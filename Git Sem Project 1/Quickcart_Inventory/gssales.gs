/**
 * Entry point: show sidebar/modal
 */
function soShowSalesUI() {
  const html = HtmlService.createTemplateFromFile('sales')
      .evaluate()
      .setTitle('Sales Orders')
      .setWidth(1200).setHeight(700);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Helper: get named range data as array of objects
 */
function soGetRangeDataAsObjects(rangeName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const range = ss.getRangeByName(rangeName);
  if (!range) {
    throw new Error(`Named range "${rangeName}" not found. Please verify it exists in your sheet.`);
  }
  
  // Grab all values (first row = headers)
  const values = range.getValues();
  if (values.length < 2) {
    // only header row or empty range
    return [];
  }
  
  const headers = values[0];
  const rows    = values.slice(1)
    .filter(r => r.some(cell => cell !== '' && cell !== null));  // drop blank rows

  return rows.map(r => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = r[i]);
    return obj;
  });
}

/**
 * Fetch all SO rows
 */
function soGetAllSO() {
  const ss       = SpreadsheetApp.getActive();
  const tz       = ss.getSpreadsheetTimeZone();
  const raw      = soGetRangeDataAsObjects('RANGESO');
  return raw.map(row => {
    if (row['SO Date'] instanceof Date) {
      row['SO Date'] = Utilities.formatDate(row['SO Date'], tz, 'MM/dd/yyyy');
    }
    return row;
  });
}

/**
 * Fetch customers list
 */
function soGetCustomers() {
  try {
    return soGetRangeDataAsObjects('RANGECUSTOMERS');
  } catch (err) {
    // log and rethrow so you see it in Execution log
    console.error(err);
    throw new Error('soGetCustomers failed: ' + err.message);
  }
}

/**
 * Fetch inventory items list
 */
function soGetInventoryItems() {
  try {
    return soGetRangeDataAsObjects('RANGEINVENTORYITEMS');
  } catch (err) {
    console.error(err);
    throw new Error('soGetInventoryItems failed: ' + err.message);
  }
}
/**
 * Fetch details for one SO
 */
function soGetSODetails(soID) {
  const ss       = SpreadsheetApp.getActive();
  const tz       = ss.getSpreadsheetTimeZone();
  const raw      = soGetRangeDataAsObjects('RANGESD')
                     .filter(r => r['SO ID'] === soID);
  return raw.map(row => {
    if (row['SO Date'] instanceof Date) {
      row['SO Date'] = Utilities.formatDate(row['SO Date'], tz, 'MM/dd/yyyy');
    }
    return row;
  });
}

/**
 * Generate unique SO ID
 */
function soGenerateSOID() {
  const data = soGetRangeDataAsObjects('RANGESD');
  const existing = data.map(r=>r['SO ID']);
  let id;
  do {
    id = 'SO' + String(Math.floor(10000 + Math.random()*90000));
  } while (existing.indexOf(id) !== -1);
  return id;
}

/**
 * Generate unique Detail ID
 */
function soGenerateSalesDetailID() {
  const data = soGetRangeDataAsObjects('RANGESD');
  const existing = data.map(r=>r['Detail ID']);
  let id;
  do {
    id = 'D' + String(Math.floor(10000 + Math.random()*90000));
  } while (existing.indexOf(id) !== -1);
  return id;
}

/**
 * Save New SO: master + details + recalc all
 */
function soSaveNewSO(payload) {
  const ss = SpreadsheetApp.getActive();
  const soRange = ss.getRangeByName('RANGESO');
  const sdRange = ss.getRangeByName('RANGESD');
  const soSheet = soRange.getSheet();
  const sdSheet = sdRange.getSheet();

  // Step 1: append master row
  const master = payload.master;
  soSheet.appendRow([
    new Date(master.date), master.soID, master.custID, master.custNm,
    master.inv, master.state, master.city, 0, 0, 0, '', ''
  ]);

  // Step 2: append each detail row
  payload.details.forEach(d=>{
    sdSheet.appendRow([
      new Date(d['SO Date']), d['SO ID'], d['Detail ID'], d['Customer ID'],
      d['Customer Name'], d['State'], d['City'], d['Invoice Num'],
      d['Item ID'], d['Item Type'], d['Item Category'], d['Item Subcategory'],
      d['Item Name'], d['QTY Sold'], d['Unit Price'],
      d['Price Excl Tax'], d['Tax Rate'], d['Total Tax'],
      d['Price Incl Tax'], d['Shipping Fees'], d['Total Sales Price']
    ]);
  });

  // Step 3: recalc all metrics
  _soRecalcAll();
}












  /**
   * Update existing SalesDetails rows, then recalc all metrics
   */
 /**
 * Updates only the specified detail rows by Detail ID.
 */
function soUpdateSODetails(rows) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const sdRange = ss.getRangeByName('RANGESD');
  if (!sdRange) throw new Error('Named range "RANGESD" not found.');

  const sheet     = sdRange.getSheet();
  const startRow  = sdRange.getRow();
  const startCol  = sdRange.getColumn();
  const allValues = sdRange.getValues();
  const headers   = allValues[0];
  const data      = allValues.slice(1);
  const detailCol = headers.indexOf('Detail ID');

  rows.forEach(upd => {
    const did = upd['Detail ID'];
    // find the row index in data
    const i = data.findIndex(r => r[detailCol] === did);
    if (i < 0) return;  // not found

    const sheetRow = startRow + 1 + i;
    // update only the fields that arrived
    Object.keys(upd).forEach(colName => {
      const colIdx = headers.indexOf(colName);
      if (colIdx < 0) return;

      let value = upd[colName];
      // convert date
      if (colName === 'SO Date') {
        value = new Date(value);
      }
      // numeric columns
      else if ([
        'QTY Sold','Unit Price','Price Excl Tax','Tax Rate',
        'Total Tax','Price Incl Tax','Shipping Fees','Total Sales Price'
      ].includes(colName)) {
        value = parseFloat(value) || 0;
      }
      // write the single cell
      sheet.getRange(sheetRow, startCol + colIdx).setValue(value);
    });
  });

  // recalc all dependent metrics
  _soRecalcAll();
}


  /**
   * Delete a single SalesDetails row by Detail ID, then recalc all
   */
  function soDeleteDetail(detailID) {
    const ss      = SpreadsheetApp.getActive();
    const sdRange = ss.getRangeByName('RANGESD');
    const sheet   = sdRange.getSheet();
    const startRow= sdRange.getRow();
    const vals    = sdRange.getValues();
    const headers = vals[0];
    const data    = vals.slice(1);
    const colIdx  = headers.indexOf('Detail ID');

    const rowIdx = data.findIndex(r => r[colIdx] === detailID);
    if (rowIdx > -1) {
      sheet.deleteRow(startRow + 1 + rowIdx);
    }

    _soRecalcAll();
  }

  /**
   * Internal: run all recalculation routines in order
   */
  function _soRecalcAll() {
    soCalcTotalSOAmount();
    soCalcSOBalance();
    soUpdateQtySold();
    soCalcRemainingQty();
    soCalcReorderRequired();
    soCalcTotalSales();
    soCalcBalanceReceivable();
  }

  /**
   * Sum Total Sales Price per SO and write to SalesOrders[Total SO Amount]
   */
  function soCalcTotalSOAmount() {
    const ss      = SpreadsheetApp.getActive();
    const soRange = ss.getRangeByName('RANGESO');
    const sheet   = soRange.getSheet();
    const startRow= soRange.getRow();
    const vals    = soRange.getValues();
    const headers = vals[0];
    const data    = vals.slice(1);

    const soIDCol    = headers.indexOf('SO ID');
    const totalCol   = headers.indexOf('Total SO Amount');
    const sdData     = soGetRangeDataAsObjects('RANGESD');

    data.forEach((row, i) => {
      const soID = row[soIDCol];
      const sum  = sdData
        .filter(d => d['SO ID'] === soID)
        .reduce((acc, cur) => acc + cur['Total Sales Price'], 0);
      sheet
        .getRange(startRow + 1 + i, soRange.getColumn() + totalCol)
        .setValue(sum);
    });
  }

  /**
   * Calculate SO Balance = Total SO Amount - Total Received
   */
  function soCalcSOBalance() {
    const ss      = SpreadsheetApp.getActive();
    const soRange = ss.getRangeByName('RANGESO');
    const sheet   = soRange.getSheet();
    const startRow= soRange.getRow();
    const vals    = soRange.getValues();
    const headers = vals[0];
    const data    = vals.slice(1);

    const totalCol    = headers.indexOf('Total SO Amount');
    const receivedCol = headers.indexOf('Total Received');
    const balCol      = headers.indexOf('SO Balance');

    data.forEach((row, i) => {
      const bal = (row[totalCol] || 0) - (row[receivedCol] || 0);
      sheet
        .getRange(startRow + 1 + i, soRange.getColumn() + balCol)
        .setValue(bal);
    });
  }

  /**
   * Update InventoryItems[QTY Sold] via SUMIF on SalesDetails[QTY Sold]
   */
  function soUpdateQtySold() {
    const ss      = SpreadsheetApp.getActive();
    const invRange= ss.getRangeByName('RANGEINVENTORYITEMS');
    const sheet   = invRange.getSheet();
    const startRow= invRange.getRow();
    const vals    = invRange.getValues();
    const headers = vals[0];
    const data    = vals.slice(1);

    const itemIDCol = headers.indexOf('Item ID');
    const soldCol   = headers.indexOf('QTY Sold');
    const sdData    = soGetRangeDataAsObjects('RANGESD');

    data.forEach((row, i) => {
      const id  = row[itemIDCol];
      const sum = sdData
        .filter(d => d['Item ID'] === id)
        .reduce((acc, cur) => acc + cur['QTY Sold'], 0);
      sheet
        .getRange(startRow + 1 + i, invRange.getColumn() + soldCol)
        .setValue(sum);
    });
  }

  /**
   * Calculate Remaining QTY = QTY Purchased - QTY Sold
   */
  function soCalcRemainingQty() {
    const ss        = SpreadsheetApp.getActive();
    const invRange  = ss.getRangeByName('RANGEINVENTORYITEMS');
    const sheet     = invRange.getSheet();
    const startRow  = invRange.getRow();
    const vals      = invRange.getValues();
    const headers   = vals[0];
    const data      = vals.slice(1);

    const purchasedCol = headers.indexOf('QTY Purchased');
    const soldCol      = headers.indexOf('QTY Sold');
    const remainCol    = headers.indexOf('Remaining QTY');

    data.forEach((row, i) => {
      const rem = (row[purchasedCol] || 0) - (row[soldCol] || 0);
      sheet
        .getRange(startRow + 1 + i, invRange.getColumn() + remainCol)
        .setValue(rem);
    });
  }

  /**
   * Flag Reorder Required if Remaining QTY < Reorder Level
   */
  function soCalcReorderRequired() {
    const ss         = SpreadsheetApp.getActive();
    const invRange   = ss.getRangeByName('RANGEINVENTORYITEMS');
    const sheet      = invRange.getSheet();
    const startRow   = invRange.getRow();
    const vals       = invRange.getValues();
    const headers    = vals[0];
    const data       = vals.slice(1);

    const remainCol  = headers.indexOf('Remaining QTY');
    const levelCol   = headers.indexOf('Reorder Level');
    const reqCol     = headers.indexOf('Reorder Required');

    data.forEach((row, i) => {
      const flag = (row[remainCol] < row[levelCol]) ? 'Yes' : 'No';
      sheet
        .getRange(startRow + 1 + i, invRange.getColumn() + reqCol)
        .setValue(flag);
    });
  }

  /**
   * Sum Total Sales per Customer, write to Customers[Total Sales]
   */
  function soCalcTotalSales() {
    const ss         = SpreadsheetApp.getActive();
    const custRange  = ss.getRangeByName('RANGECUSTOMERS');
    const sheet      = custRange.getSheet();
    const startRow   = custRange.getRow();
    const vals       = custRange.getValues();
    const headers    = vals[0];
    const data       = vals.slice(1);

    const custIDCol      = headers.indexOf('Customer ID');
    const totalSalesCol  = headers.indexOf('Total Sales');
    const sdData         = soGetRangeDataAsObjects('RANGESD');

    data.forEach((row, i) => {
      const cid = row[custIDCol];
      const sum = sdData
        .filter(d => d['Customer ID'] === cid)
        .reduce((acc, cur) => acc + cur['Total Sales Price'], 0);
      sheet
        .getRange(startRow + 1 + i, custRange.getColumn() + totalSalesCol)
        .setValue(sum);
    });
  }

  /**
   * Calculate Balance Receivable = Total Sales - Total Receipts
   */
  function soCalcBalanceReceivable() {
    const ss         = SpreadsheetApp.getActive();
    const custRange  = ss.getRangeByName('RANGECUSTOMERS');
    const sheet      = custRange.getSheet();
    const startRow   = custRange.getRow();
    const vals       = custRange.getValues();
    const headers    = vals[0];
    const data       = vals.slice(1);

    const totalSalesCol   = headers.indexOf('Total Sales');
    const receiptsCol     = headers.indexOf('Total Receipts');
    const balanceRecCol   = headers.indexOf('Balance Receivable');

    data.forEach((row, i) => {
      const bal = (row[totalSalesCol] || 0) - (row[receiptsCol] || 0);
      sheet
        .getRange(startRow + 1 + i, custRange.getColumn() + balanceRecCol)
        .setValue(bal);
    });
  }


