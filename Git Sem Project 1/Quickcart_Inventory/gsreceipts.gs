/**
 * Fetch named-range as array of objects with headers
 */
function _rcGetRangeData(name) {
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRangeByName(name);
  if (!range) throw new Error(`Named range "${name}" not found.`);
  const vals = range.getValues();
  if (vals.length < 2) return [];
  const headers = vals[0];
  return vals.slice(1)
    .filter(r=>r.some(c=>c!=='' && c!=null))
    .map(r=>{
      const obj = {};
      headers.forEach((h,i)=> {
        let v = r[i];
        // Format dates as MM/dd/yyyy
        if (h.endsWith('Date') && v instanceof Date) {
          v = Utilities.formatDate(v, ss.getSpreadsheetTimeZone(), 'MM/dd/yyyy');
        }
        obj[h] = v;
      });
      return obj;
    });
}

/**
 * Server-side getters
 */
function rcGetCustomers()    { return _rcGetRangeData('RANGECUSTOMERS'); }
function rcGetSalesOrders()  { return _rcGetRangeData('RANGESO'); }
function rcGetDimensions()   { return _rcGetRangeData('RANGEDIMENSIONS'); }
function rcGetAllReceipts()  { return _rcGetRangeData('RANGERECEIPTS'); }

/**
 * Generate unique Trx ID (RTxxxxx)
 */
function rcGenerateTrxID() {
  const data = _rcGetRangeData('RANGERECEIPTS').map(r=>r['Trx ID']);
  let id;
  do { id = 'RT'+Math.floor(10000+Math.random()*90000); }
  while(data.includes(id));
  return id;
}

/**
 * Save new receipt, then call downstream funcs
 */
function rcSaveNewReceipt(rec) {
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRangeByName('RANGERECEIPTS');
  const sheet = range.getSheet();

  // Append row in correct column order
  sheet.appendRow([
    new Date(rec['Trx Date']),
    rec['Trx ID'],
    rec['Customer ID'],
    rec['Customer Name'],
    rec['State'],
    rec['City'],
    rec['SO ID'],
    rec['Invoice Num'],
    rec['PMT Mode'],
    rec['Amount Received']
  ]);

  // Recalc
calcsoreceipts();
calctotalreceipts();
soCalcSOBalance();
soCalcBalanceReceivable();
rcUpdateReceiptStatus();
}

/**
 * Update existing receipt row by Trx ID
 */
function rcUpdateReceipt(rec) {
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRangeByName('RANGERECEIPTS');
  const sheet = range.getSheet();
  const vals = range.getValues();
  const headers = vals[0];
  const data = vals.slice(1);
  const colTrx = headers.indexOf('Trx ID');
  const rowIdx = data.findIndex(r=>r[colTrx]===rec['Trx ID']);
  if (rowIdx<0) throw new Error('Receipt not found');

  const sheetRow = range.getRow() + 1 + rowIdx;
  // Overwrite each field
  headers.forEach((h,i) => {
    if (rec.hasOwnProperty(h)) {
      let v = rec[h];
      if (h==='Trx Date') v = new Date(v);
      if (h==='Amount Received') v = parseFloat(v) || 0;
      sheet.getRange(sheetRow, range.getColumn()+i).setValue(v);
    }
  });

  // Recalc
calcsoreceipts();
calctotalreceipts();
soCalcSOBalance();
soCalcBalanceReceivable();
rcUpdateReceiptStatus();
}

/**
 * Delete receipt row by Trx ID
 */
function rcDeleteReceipt(trxID) {
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRangeByName('RANGERECEIPTS');
  const sheet = range.getSheet();
  const vals = range.getValues();
  const headers = vals[0];
  const data = vals.slice(1);
  const col = headers.indexOf('Trx ID');
  const idx = data.findIndex(r=>r[col]===trxID);
  if (idx<0) return;
  sheet.deleteRow(range.getRow()+1+idx);

  // Recalc
calcsoreceipts();
calctotalreceipts();
soCalcSOBalance();
soCalcBalanceReceivable();
rcUpdateReceiptStatus();
}

/**
 * Calc SO Balance = Total SO Amount - Total Received
 * (reuse from sales module)
 */
function rcCalcSOBalance() {
  // assuming soCalcSOBalance exists in gssales.gs
  return this.soCalcSOBalance();
}

/**
 * Calc Balance Receivable = Total Sales - Total Receipts
 */
function rcCalcBalanceReceivable() {
  return this.soCalcBalanceReceivable();
}

/**
 * Update Receipt Status on SalesOrders sheet
 */
function rcUpdateReceiptStatus() {
  const ss     = SpreadsheetApp.getActive();
  const range  = ss.getRangeByName('RANGESO');
  if (!range) throw new Error('Named range "RANGESO" not found');
  const sheet  = range.getSheet();
  const values = range.getValues();
  const headers= values[0];
  const data   = values.slice(1);

  const colTotal = headers.indexOf('Total SO Amount');
  const colRec   = headers.indexOf('Total Received');
  const colStat  = headers.indexOf('Receipt Status');

  data.forEach((row, i) => {
    const total = parseFloat(row[colTotal])  || 0;
    const recvd = parseFloat(row[colRec])    || 0;
    let status;

    if (recvd <= 0) {
      status = 'Pending';
    }
    else if (recvd < total) {
      status = 'Partial Receipt';
    }
    else if (recvd === total) {
      status = 'Received';
    }
    else {
      // in case recvd > total, you might handle Overpaid here
      status = 'Received';
    }

    sheet
      .getRange(range.getRow() + 1 + i, range.getColumn() + colStat)
      .setValue(status);
  });
}


/**
 * Sum Amount Received by SO ID and write into SalesOrders[Total Received]
 */
function calcsoreceipts() {
  const ss        = SpreadsheetApp.getActive();
  const soRange   = ss.getRangeByName('RANGESO');
  if (!soRange) throw new Error('Named range RANGESO not found');
  const soSheet   = soRange.getSheet();
  const soValues  = soRange.getValues();
  const headers   = soValues[0];
  const dataRows  = soValues.slice(1);
  const soIdCol   = headers.indexOf('SO ID');
  const recCol    = headers.indexOf('Total Received');

  // Build map of SO ID → sum of Amount Received
  const receipts = _rcGetRangeData('RANGERECEIPTS');
  const sumMap   = receipts.reduce((m, r) => {
    const so = r['SO ID'];
    const amt = parseFloat(r['Amount Received']) || 0;
    m[so] = (m[so] || 0) + amt;
    return m;
  }, {});

  // Loop each SO row and write the sum (or 0)
  dataRows.forEach((row, i) => {
    const so = row[soIdCol];
    const totalRec = sumMap[so] || 0;
    soSheet
      .getRange(soRange.getRow() + 1 + i, soRange.getColumn() + recCol)
      .setValue(totalRec);
  });
}



/**
 * Sum SalesOrders[Total Received] by Customer ID and write into Customers[Total Receipts]
 */
function calctotalreceipts() {
  const ss         = SpreadsheetApp.getActive();
  const custRange  = ss.getRangeByName('RANGECUSTOMERS');
  if (!custRange) throw new Error('Named range RANGECUSTOMERS not found');
  const custSheet  = custRange.getSheet();
  const custValues = custRange.getValues();
  const headers    = custValues[0];
  const dataRows   = custValues.slice(1);
  const custCol    = headers.indexOf('Customer ID');
  const totalRecCol = headers.indexOf('Total Receipts');

  // Build map of Customer ID → sum of Total Received from SalesOrders
  const soData     = _rcGetRangeData('RANGESO');
  const sumMap     = soData.reduce((m, r) => {
    const cid = r['Customer ID'];
    const rec = parseFloat(r['Total Received']) || 0;
    m[cid] = (m[cid] || 0) + rec;
    return m;
  }, {});

  // Loop each customer row and write the sum
  dataRows.forEach((row, i) => {
    const cid = row[custCol];
    const tot = sumMap[cid] || 0;
    custSheet
      .getRange(custRange.getRow() + 1 + i, custRange.getColumn() + totalRecCol)
      .setValue(tot);
  });
}