// Get all suppliers
function poGetSuppliers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Suppliers");
  const range = ss.getRangeByName("RANGESUPPLIERS");

  if (!range) {
    console.log("poGetSuppliers: RANGESUPPLIERS named range not found.");
    return [];
  }

  try {
    const data = range.getValues();
    if (!data || data.length === 0) {
      console.log("poGetSuppliers: No data found in RANGESUPPLIERS.");
      return [];
    }
    const headers = data[0];
    const suppliers = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.every(cell => cell === '' || cell === null || typeof cell === 'undefined')) continue;

      suppliers.push({
        id: row[headers.indexOf("Supplier ID")],
        name: row[headers.indexOf("Supplier Name")],
        state: row[headers.indexOf("State")],
        city: row[headers.indexOf("City")]
      });
    }
    return suppliers;
  } catch (e) {
    console.error("Error in poGetSuppliers: " + e.message + " Stack: " + e.stack);
    return [];
  }
}

// Get all inventory items
function poGetInventoryItems() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("InventoryItems");
  const range = ss.getRangeByName("RANGEINVENTORYITEMS");

  if (!range) {
    console.log("poGetInventoryItems: RANGEINVENTORYITEMS named range not found.");
    return [];
  }

  try {
    const data = range.getValues();
    if (!data || data.length === 0) {
      console.log("poGetInventoryItems: No data found in RANGEINVENTORYITEMS.");
      return [];
    }
    const headers = data[0];
    const items = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.every(cell => cell === '' || cell === null || typeof cell === 'undefined')) continue;

      items.push({
        id: row[headers.indexOf("Item ID")],
        name: row[headers.indexOf("Item Name")],
        type: row[headers.indexOf("Item Type")],
        category: row[headers.indexOf("Item Category")],
        subcategory: row[headers.indexOf("Item Subcategory")]
      });
    }
    return items;
  } catch (e) {
    console.error("Error in poGetInventoryItems: " + e.message + " Stack: " + e.stack);
    return [];
  }
}

// Get PMT statuses
function poGetPMTStatuses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");

  if (!range) {
    console.log("poGetPMTStatuses: RANGEDIMENSIONS named range not found.");
    return [];
  }

  try {
    const data = range.getValues();
    if (!data || data.length === 0) {
      console.log("poGetPMTStatuses: No data found in RANGEDIMENSIONS.");
      return [];
    }
    const headers = data[0];
    const statusIndex = headers.indexOf("PMT Status");

    if (statusIndex === -1) {
      console.log("poGetPMTStatuses: 'PMT Status' header not found.");
      return [];
    }

    const statuses = [];
    const statusSet = new Set();

    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusIndex];
      if (status && status.trim() !== '' && !statusSet.has(status)) {
        statuses.push(status);
        statusSet.add(status);
      }
    }
    return statuses;
  } catch (e) {
    console.error("Error in poGetPMTStatuses: " + e.message + " Stack: " + e.stack);
    return [];
  }
}

// Get shipping statuses
function poGetShippingStatuses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");

  if (!range) {
    console.log("poGetShippingStatuses: RANGEDIMENSIONS named range not found.");
    return [];
  }

  try {
    const data = range.getValues();
    if (!data || data.length === 0) {
      console.log("poGetShippingStatuses: No data found in RANGEDIMENSIONS.");
      return [];
    }
    const headers = data[0];
    const statusIndex = headers.indexOf("Shipping Status");

    if (statusIndex === -1) {
      console.log("poGetShippingStatuses: 'Shipping Status' header not found.");
      return [];
    }

    const statuses = [];
    const statusSet = new Set();

    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusIndex];
      if (status && status.trim() !== '' && !statusSet.has(status)) {
        statuses.push(status);
        statusSet.add(status);
      }
    }
    return statuses;
  } catch (e) {
    console.error("Error in poGetShippingStatuses: " + e.message + " Stack: " + e.stack);
    return [];
  }
}

// Add new PMT status
function poAddNewPMTStatus(status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");

  if (!range) {
    console.error("poAddNewPMTStatus: RANGEDIMENSIONS named range not found.");
    throw new Error("Dimensions range not found.");
  }

  try {
    const data = range.getValues();
    const headers = data[0];
    const statusIndex = headers.indexOf("PMT Status");

    if (statusIndex === -1) {
      console.error("poAddNewPMTStatus: 'PMT Status' header not found.");
      throw new Error("'PMT Status' column not found in Dimensions sheet.");
    }

    let lastRow = sheet.getLastRow();
    // Ensure we append to the first truly empty row after headers
    if (lastRow < 1) lastRow = 1; // If sheet is empty, start at row 1
    let targetRow = lastRow + 1;

    sheet.getRange(targetRow, statusIndex + 1).setValue(status);
    console.log(`Added new PMT status: ${status} at row ${targetRow}`);
  } catch (e) {
    console.error("Error in poAddNewPMTStatus: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to add new PMT status: " + e.message);
  }
}

// Add new shipping status
function poAddNewShippingStatus(status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");

  if (!range) {
    console.error("poAddNewShippingStatus: RANGEDIMENSIONS named range not found.");
    throw new Error("Dimensions range not found.");
  }

  try {
    const data = range.getValues();
    const headers = data[0];
    const statusIndex = headers.indexOf("Shipping Status");

    if (statusIndex === -1) {
      console.error("poAddNewShippingStatus: 'Shipping Status' header not found.");
      throw new Error("'Shipping Status' column not found in Dimensions sheet.");
    }

    let lastRow = sheet.getLastRow();
    if (lastRow < 1) lastRow = 1;
    let targetRow = lastRow + 1;

    sheet.getRange(targetRow, statusIndex + 1).setValue(status);
    console.log(`Added new Shipping status: ${status} at row ${targetRow}`);
  } catch (e) {
    console.error("Error in poAddNewShippingStatus: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to add new Shipping status: " + e.message);
  }
}

// Generate PO ID
function poGeneratePOID() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PurchaseDetails");
  const range = ss.getRangeByName("RANGEPD");

  if (!range) {
    console.log("poGeneratePOID: RANGEPD named range not found. Generating simple ID.");
    return "PO" + Math.floor(10000 + Math.random() * 90000);
  }

  try {
    const data = range.getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("PO ID");
    const existingIds = new Set();

    if (idIndex === -1) {
      console.warn("poGeneratePOID: 'PO ID' header not found in PurchaseDetails. Generating simple ID.");
      return "PO" + Math.floor(10000 + Math.random() * 90000);
    }

    for (let i = 1; i < data.length; i++) {
      const id = data[i][idIndex];
      if (id && id !== '') {
        existingIds.add(String(id)); // Ensure string for consistency
      }
    }

    let newId;
    do {
      newId = "PO" + Math.floor(10000 + Math.random() * 90000);
    } while (existingIds.has(newId));

    console.log("Generated new PO ID: " + newId);
    return newId;
  } catch (e) {
    console.error("Error in poGeneratePOID: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to generate PO ID: " + e.message);
  }
}

// Get all purchase orders
function poGetPOs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PurchaseOrders");
  const range = ss.getRangeByName("RANGEPO");

  if (!range) {
    console.log("poGetPOs: RANGEPO named range not found. Returning empty array.");
    return []; // Ensure an empty array is returned if range is not found
  }

  try {
    const data = range.getValues(); // This retrieves values as they are, including Date objects

    console.log("poGetPOs: Raw data from RANGEPO:", JSON.stringify(data)); // Log raw data

    // If data is empty or only contains an empty row (e.g., just headers but no actual data)
    if (!data || data.length === 0 || (data.length === 1 && data[0].every(cell => cell === ''))) {
      console.log("poGetPOs: No meaningful data found in RANGEPO.");
      return []; // Return empty array if no meaningful data
    }

    const headers = data[0];
    // Check if headers are valid
    if (!headers || headers.length === 0 || !headers.includes("PO ID")) { // Added check for a crucial header
      console.error("poGetPOs: Headers not found, empty, or missing 'PO ID' in RANGEPO data.");
      return []; // Return empty array if headers are invalid
    }

    const pos = [];

    // Helper function to safely get a value by header name
    const getVal = (h, row) => {
      const index = headers.indexOf(h);
      return index !== -1 ? row[index] : null;
    };

    // Start from 1 to skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log(`poGetPOs: Processing row ${i}:`, JSON.stringify(row));

      // Skip completely empty rows
      if (row.every(cell => cell === '' || cell === null || typeof cell === 'undefined')) {
        console.log(`poGetPOs: Skipping empty row ${i}.`);
        continue;
      }

      // Retrieve date value directly. Google Sheets' getValues() returns Date objects for date-formatted cells.
      // The client-side will handle formatting for display.
      let dateValue = getVal("Date", row);
      if (dateValue instanceof Date) {
        dateValue = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), "MMM/dd/yyyy");
      }
      else if (!(dateValue instanceof Date)) {
          console.warn(`poGetPOs: Date value for row ${i} is not a Date object. Type: ${typeof dateValue}, Value: ${dateValue}`);
          // If it's not a Date object, it's likely a string or number.
          // We can try to parse it if it's a string, but for robustness, we'll just pass it as is.
          // The client-side will need to handle non-Date objects for display.
      }


      pos.push({
        date: dateValue, // Keep as is, let client-side format for display
        id: getVal("PO ID", row),
        supplierId: getVal("Supplier ID", row),
        supplierName: getVal("Supplier Name", row),
        billNum: getVal("Bill Num", row),
        state: getVal("State", row),
        city: getVal("City", row),
        totalAmount: getVal("Total Amount", row),
        totalPaid: getVal("Total Paid", row),
        poBalance: getVal("PO Balance", row),
        pmtStatus: getVal("PMT Status", row),
        shippingStatus: getVal("Shipping Status", row)
      });
    }
    console.log("poGetPOs: Successfully retrieved POs. Count:", pos.length);
    return pos;
  } catch (e) {
    // This catch block should prevent null from being returned on unexpected errors
    console.error("CRITICAL ERROR in poGetPOs: " + e.message + " Stack: " + e.stack);
    return []; // Always return an array on error
  }
}

// Get PO details
function poGetPODetails(poId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PurchaseDetails");
  const range = ss.getRangeByName("RANGEPD");

  if (!range) {
    console.log("poGetPODetails: RANGEPD named range not found. Returning empty array.");
    return [];
  }

  try {
    const data = range.getValues();
    if (!data || data.length === 0) {
      console.log("poGetPODetails: No data found in RANGEPD.");
      return [];
    }

    const headers = data[0];
    const details = [];

    // Helper to get value by header name
    const getVal = (h, row) => {
      const index = headers.indexOf(h);
      return index !== -1 ? row[index] : null;
    };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows or those that don’t match the given PO ID
      if (row.every(cell => cell === '' || cell === null || typeof cell === 'undefined') || getVal("PO ID", row) !== poId) {
        continue;
      }

      // Format the date consistently
      let dateVal = getVal("Date", row);
      if (dateVal instanceof Date) {
        dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "MMM/dd/yyyy");
      } else if (typeof dateVal === "string" || typeof dateVal === "number") {
        const parsedDate = new Date(dateVal);
        if (!isNaN(parsedDate)) {
          dateVal = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), "MMM/dd/yyyy");
        } else {
          console.warn(`Invalid date for row ${i}:`, dateVal);
        }
      }

      details.push({
        date: dateVal,
        poId: getVal("PO ID", row),
        detailId: getVal("Detail ID", row),
        supplierId: getVal("Supplier ID", row),
        supplierName: getVal("Supplier Name", row),
        state: getVal("State", row),
        city: getVal("City", row),
        billNum: getVal("Bill Num", row),
        itemId: getVal("Item ID", row),
        itemType: getVal("Item Type", row),
        itemCategory: getVal("Item Category", row),
        itemSubcategory: getVal("Item Subcategory", row),
        itemName: getVal("Item Name", row),
        qtyPurchased: getVal("QTY Purchased", row),
        unitCost: getVal("Unit Cost", row),
        costExclTax: getVal("Cost Excl Tax", row),
        taxRate: getVal("Tax Rate", row),
        totalTax: getVal("Total Tax", row),
        costInclTax: getVal("Cost Incl Tax", row),
        shippingFees: getVal("Shipping Fees", row),
        totalPrice: getVal("Total Purchase Price", row)
      });
    }

    console.log(`poGetPODetails: Retrieved ${details.length} details for PO ID: ${poId}`);
    return details;
  } catch (e) {
    console.error("Error in poGetPODetails: " + e.message + " Stack: " + e.stack);
    return [];
  }
}


// Save new PO
function poSaveNewPO(items) {
  // Add a check to ensure 'items' is an array and not empty
  if (!Array.isArray(items) || items.length === 0) {
    console.error("poSaveNewPO: 'items' is not a valid array or is empty. Received:", items);
    throw new Error("No items provided to save."); // Throw an error to be caught by client-side failure handler
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const detailsSheet = ss.getSheetByName("PurchaseDetails");
  const ordersSheet = ss.getSheetByName("PurchaseOrders");

  // Save to PurchaseDetails
  const detailsRange = ss.getRangeByName("RANGEPD");
  if (!detailsRange) {
    console.error("poSaveNewPO: RANGEPD named range not found.");
    throw new Error("Purchase Details range not found.");
  }

  try {
    const detailsData = detailsRange.getValues();
    const detailsHeaders = detailsData[0];

    // Prepare new rows
    const newRows = items.map(item => {
      const newRow = [];
      detailsHeaders.forEach(header => {
        switch(header) {
          case "Date": newRow.push(item.date); break;
          case "PO ID": newRow.push(item.poId); break;
          case "Detail ID": newRow.push(item.detailId); break;
          case "Supplier ID": newRow.push(item.supplierId); break;
          case "Supplier Name": newRow.push(item.supplierName); break;
          case "State": newRow.push(item.state); break;
          case "City": newRow.push(item.city); break;
          case "Bill Num": newRow.push(item.billNum); break;
          case "Item ID": newRow.push(item.itemId); break;
          case "Item Type": newRow.push(item.itemType); break;
          case "Item Category": newRow.push(item.itemCategory); break;
          case "Item Subcategory": newRow.push(item.itemSubcategory); break;
          case "Item Name": newRow.push(item.itemName); break;
          case "QTY Purchased": newRow.push(item.qtyPurchased); break;
          case "Unit Cost": newRow.push(item.unitCost); break;
          case "Cost Excl Tax": newRow.push(item.costExclTax); break;
          case "Tax Rate": newRow.push(item.taxRate); break;
          case "Total Tax": newRow.push(item.totalTax); break;
          case "Cost Incl Tax": newRow.push(item.costInclTax); break;
          case "Shipping Fees": newRow.push(item.shippingFees); break;
          case "Total Purchase Price": newRow.push(item.totalPrice); break;
          default: newRow.push(''); break;
        }
      });
      return newRow;
    });

    // Append to sheet
    detailsSheet.getRange(detailsSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    console.log(`poSaveNewPO: Successfully saved ${newRows.length} item details.`);

    // Update related data
    poUpdateTotalPO(items[0].poId);
    revisetotalinventory();
    poUpdateRemainingQty();
    poUpdateReorderRequired();
    poUpdateTotalPurchases();
    poUpdateBalancePayable();
    console.log("poSaveNewPO: Related data updates triggered.");
  } catch (e) {
    console.error("Error in poSaveNewPO: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to save new PO: " + e.message);
  }
}

// Update total PO
function poUpdateTotalPO(poId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const detailsSheet = ss.getSheetByName("PurchaseDetails");
  const ordersSheet  = ss.getSheetByName("PurchaseOrders");
  const detailsRange = ss.getRangeByName("RANGEPD");
  const ordersRange  = ss.getRangeByName("RANGEPO");

  if (!detailsRange || !ordersRange) {
    console.warn("poUpdateTotalPO: Named ranges RANGEPD or RANGEPO not found. Skipping.");
    return;
  }

  // 1) Gather PO Details and compute totalAmount, keep firstRow for meta
  const detailsData    = detailsRange.getValues();
  const detailsHeaders = detailsData[0];
  const poIdIndex      = detailsHeaders.indexOf("PO ID");
  const totalPriceIdx  = detailsHeaders.indexOf("Total Purchase Price");

  let totalAmount = 0;
  let firstRow    = null;

  for (let i = 1; i < detailsData.length; i++) {
    if (detailsData[i][poIdIndex] === poId) {
      totalAmount += Number(detailsData[i][totalPriceIdx]) || 0;
      if (!firstRow) firstRow = detailsData[i];
    }
  }

  if (!firstRow) {
    console.warn(`poUpdateTotalPO: No details found for PO ID ${poId}. Nothing to update.`);
    return;
  }

  // 2) Build the new row array in the exact order of your PurchaseOrders headers
  const ordersData    = ordersRange.getValues();
  const ordersHeaders = ordersData[0];

  const newRow = ordersHeaders.map(header => {
    switch (header) {
      case "Date":               return firstRow[ detailsHeaders.indexOf("Date") ];
      case "PO ID":              return poId;
      case "Supplier ID":        return firstRow[ detailsHeaders.indexOf("Supplier ID") ];
      case "Supplier Name":      return firstRow[ detailsHeaders.indexOf("Supplier Name") ];
      case "Bill Num":           return firstRow[ detailsHeaders.indexOf("Bill Num") ];
      case "State":              return firstRow[ detailsHeaders.indexOf("State") ];
      case "City":               return firstRow[ detailsHeaders.indexOf("City") ];
      case "Total Amount":       return totalAmount;
      case "Total Paid":         return 0;
      case "PO Balance":         return totalAmount;
      case "PMT Status":         return "Pending";
      case "Shipping Status":    return "Pending";
      default:                   return "";
    }
  });

  // 3) Find existing PO row in ordersData
  const poIdCol  = ordersHeaders.indexOf("PO ID");
  const existing = ordersData.findIndex((r, i) => i > 0 && r[poIdCol] == poId);

  if (existing > 0) {
    // Overwrite in place
    const writeRow    = ordersRange.getRow() + existing;
    const writeCol    = ordersRange.getColumn();
    const writeRange  = ordersSheet.getRange(writeRow, writeCol, 1, newRow.length);
    writeRange.setValues([ newRow ]);
    console.log(`poUpdateTotalPO: Updated existing row ${writeRow} for PO ID ${poId}.`);
  } else {
    // Fallback: append if not found
    ordersSheet.appendRow(newRow);
    console.log(`poUpdateTotalPO: Appended new row for PO ID ${poId}.`);
  }
}


// Update remaining quantity
function poUpdateRemainingQty() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const itemsSheet = ss.getSheetByName("InventoryItems");
  const itemsRange = ss.getRangeByName("RANGEINVENTORYITEMS");

  if (!itemsRange) {
    console.warn("poUpdateRemainingQty: RANGEINVENTORYITEMS named range not found. Skipping update.");
    return;
  }

  try {
    const itemsData = itemsRange.getValues();
    const itemsHeaders = itemsData[0];

    const purchasedIndex = itemsHeaders.indexOf("QTY Purchased");
    const soldIndex = itemsHeaders.indexOf("QTY Sold");
    const remainingIndex = itemsHeaders.indexOf("Remaining QTY");

    for (let i = 1; i < itemsData.length; i++) {
      const purchased = itemsData[i][purchasedIndex] || 0;
      const sold = itemsData[i][soldIndex] || 0;
      const remaining = purchased - sold;

      itemsSheet.getRange(itemsRange.getRow() + i, remainingIndex + 1).setValue(remaining);
    }
    console.log("poUpdateRemainingQty: Remaining quantities updated.");
  } catch (e) {
    console.error("Error in poUpdateRemainingQty: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to update remaining quantity: " + e.message);
  }
}

// Update reorder required
function poUpdateReorderRequired() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const itemsSheet = ss.getSheetByName("InventoryItems");
  const itemsRange = ss.getRangeByName("RANGEINVENTORYITEMS");

  if (!itemsRange) {
    console.warn("poUpdateReorderRequired: RANGEINVENTORYITEMS named range not found. Skipping update.");
    return;
  }

  try {
    const itemsData = itemsRange.getValues();
    const itemsHeaders = itemsData[0];

    const remainingIndex = itemsHeaders.indexOf("Remaining QTY");
    const reorderLevelIndex = itemsHeaders.indexOf("Reorder Level");
    const reorderRequiredIndex = itemsHeaders.indexOf("Reorder Required");

    for (let i = 1; i < itemsData.length; i++) {
      const remaining = itemsData[i][remainingIndex] || 0;
      const reorderLevel = itemsData[i][reorderLevelIndex] || 0;
      const reorderRequired = remaining < reorderLevel ? "Yes" : "No";

      itemsSheet.getRange(itemsRange.getRow() + i, reorderRequiredIndex + 1).setValue(reorderRequired);
    }
    console.log("poUpdateReorderRequired: Reorder required status updated.");
  } catch (e) {
    console.error("Error in poUpdateReorderRequired: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to update reorder required status: " + e.message);
  }
}

// Update total purchases for suppliers
function poUpdateTotalPurchases() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const suppliersSheet = ss.getSheetByName("Suppliers");
  const detailsSheet = ss.getSheetByName("PurchaseDetails");

  const suppliersRange = ss.getRangeByName("RANGESUPPLIERS");
  const detailsRange = ss.getRangeByName("RANGEPD");

  if (!suppliersRange || !detailsRange) {
    console.warn("poUpdateTotalPurchases: One or more named ranges not found. Skipping update.");
    return;
  }

  try {
    const suppliersData = suppliersRange.getValues();
    const suppliersHeaders = suppliersData[0];
    const detailsData = detailsRange.getValues();
    const detailsHeaders = detailsData[0];

    const supplierIdIndex = suppliersHeaders.indexOf("Supplier ID");
    const totalPurchasesIndex = suppliersHeaders.indexOf("Total Purchases");
    const detailsSupplierIdIndex = detailsHeaders.indexOf("Supplier ID");
    const detailsTotalPriceIndex = detailsHeaders.indexOf("Total Purchase Price");

    // Create a map of supplier totals
    const supplierTotals = {};

    for (let i = 1; i < detailsData.length; i++) {
      const supplierId = detailsData[i][detailsSupplierIdIndex];
      const totalPrice = detailsData[i][detailsTotalPriceIndex] || 0;

      if (supplierId) {
        if (!supplierTotals[supplierId]) supplierTotals[supplierId] = 0;
        supplierTotals[supplierId] += totalPrice;
      }
    }

    // Update suppliers
    for (let i = 1; i < suppliersData.length; i++) {
      const supplierId = suppliersData[i][supplierIdIndex];
      if (supplierId && supplierTotals[supplierId]) {
        suppliersSheet.getRange(suppliersRange.getRow() + i, totalPurchasesIndex + 1).setValue(supplierTotals[supplierId]);
      }
    }
    console.log("poUpdateTotalPurchases: Total purchases for suppliers updated.");
  } catch (e) {
    console.error("Error in poUpdateTotalPurchases: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to update total purchases: " + e.message);
  }
}

// Update balance payable for suppliers
function poUpdateBalancePayable() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const suppliersSheet = ss.getSheetByName("Suppliers");
  const suppliersRange = ss.getRangeByName("RANGESUPPLIERS");

  if (!suppliersRange) {
    console.warn("poUpdateBalancePayable: RANGESUPPLIERS named range not found. Skipping update.");
    return;
  }

  try {
    const suppliersData = suppliersRange.getValues();
    const suppliersHeaders = suppliersData[0];

    const totalPurchasesIndex = suppliersHeaders.indexOf("Total Purchases");
    const totalPaymentsIndex = suppliersHeaders.indexOf("Total Payments");
    const balancePayableIndex = suppliersHeaders.indexOf("Balance Payable");

    for (let i = 1; i < suppliersData.length; i++) {
      const totalPurchases = suppliersData[i][totalPurchasesIndex] || 0;
      const totalPayments = suppliersData[i][totalPaymentsIndex] || 0;
      const balance = totalPurchases - totalPayments;

      suppliersSheet.getRange(suppliersRange.getRow() + i, balancePayableIndex + 1).setValue(balance);
    }
    console.log("poUpdateBalancePayable: Balance payable for suppliers updated.");
  } catch (e) {
    console.error("Error in poUpdateBalancePayable: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to update balance payable: " + e.message);
  }
}

// Update PO balance
function poUpdatePOBalance() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName("PurchaseOrders");
  const ordersRange = ss.getRangeByName("RANGEPO");

  if (!ordersRange) {
    console.warn("poUpdatePOBalance: RANGEPO named range not found. Skipping update.");
    return;
  }

  try {
    const ordersData = ordersRange.getValues();
    const ordersHeaders = ordersData[0];

    const totalAmountIndex = ordersHeaders.indexOf("Total Amount");
    const totalPaidIndex = ordersHeaders.indexOf("Total Paid");
    const poBalanceIndex = ordersHeaders.indexOf("PO Balance");

    for (let i = 1; i < ordersData.length; i++) {
      const totalAmount = ordersData[i][totalAmountIndex] || 0;
      const totalPaid = ordersData[i][totalPaidIndex] || 0;
      const balance = totalAmount - totalPaid;

      ordersSheet.getRange(ordersRange.getRow() + i, poBalanceIndex + 1).setValue(balance);
    }
    console.log("poUpdatePOBalance: PO balances updated.");
  } catch (e) {
    console.error("Error in poUpdatePOBalance: " + e.message + " Stack: " + e.stack);
    throw new Error("Failed to update PO balance: " + e.message);
  }
}

function poDeletePODetail(detailId, poId) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PurchaseDetails");
  const range = ss.getRangeByName("RANGEPD");
  const data  = range.getValues();      // data[0] is header row

  // Find the Detail ID column index
  const headers = data[0];
  const idCol   = headers.indexOf("Detail ID");

  // Loop through data rows (i=1 → first data row)
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == detailId) {
      // range.getRow() is the sheet row of the header,
      // so data[i] lives at sheetRow = range.getRow() + i.
      const sheetRow = range.getRow() + i;
      sheet.deleteRow(sheetRow);
      break;
    }
  }

  // recalc
  revisetotalpo();
  poUpdatePOBalance();
  revisetotalinventory();
  poUpdateRemainingQty();
  poUpdateReorderRequired();
  poUpdateTotalPurchases();
  poUpdateBalancePayable();
}




























/**
 * Save all edited detail rows, then recalc in order.
 */
function poSavePODetails(updates) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PurchaseDetails");
  const range = ss.getRangeByName("RANGEPD");
  const data  = range.getValues();
  const hdr   = data[0];

  // helper to find column index by name
  const ci = name => hdr.indexOf(name);

  updates.forEach(u => {
    // find the row in RANGEPD by Detail ID
    const rowIdx = data.findIndex((r,i) => i>0 && r[ci("Detail ID")] == u.detailId);
    if (rowIdx < 1) throw new Error("Detail ID not found: " + u.detailId);
    const sheetRow = range.getRow() + rowIdx;

    // write back editable fields
    sheet.getRange(sheetRow, range.getColumn() + ci("Item ID")      ).setValue(u.itemId);
    sheet.getRange(sheetRow, range.getColumn() + ci("Item Name")    ).setValue(u.itemName);
    sheet.getRange(sheetRow, range.getColumn() + ci("QTY Purchased")).setValue(u.qtyPurchased);
    sheet.getRange(sheetRow, range.getColumn() + ci("Unit Cost")    ).setValue(u.unitCost);
    sheet.getRange(sheetRow, range.getColumn() + ci("Tax Rate")     ).setValue(u.taxRate);

    // write back derived fields
    sheet.getRange(sheetRow, range.getColumn() + ci("Cost Excl Tax")    ).setValue(u.costExclTax);
    sheet.getRange(sheetRow, range.getColumn() + ci("Total Tax")         ).setValue(u.totalTax);
    sheet.getRange(sheetRow, range.getColumn() + ci("Cost Incl Tax")    ).setValue(u.costInclTax);
    sheet.getRange(sheetRow, range.getColumn() + ci("Shipping Fees")     ).setValue(u.shippingFees);
    sheet.getRange(sheetRow, range.getColumn() + ci("Total Purchase Price")).setValue(u.totalPrice);
  });

  // then recalc
  revisetotalpo();
  poUpdatePOBalance();
  revisetotalinventory();
  poUpdateRemainingQty();
  poUpdateReorderRequired();
  poUpdateTotalPurchases();
  poUpdateBalancePayable();
}



/**
 * Loop through every PO in PurchaseOrders and SUMIF from PurchaseDetails.
 */
function revisetotalpo() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const pdRng   = ss.getRangeByName("RANGEPD");
  const poRng   = ss.getRangeByName("RANGEPO");
  const pdVals  = pdRng.getValues();
  const poVals  = poRng.getValues();
  const pdHdr   = pdVals[0];
  const poHdr   = poVals[0];
  const pdPoCol = pdHdr.indexOf("PO ID");
  const pdTotCol= pdHdr.indexOf("Total Purchase Price");
  const poPoCol = poHdr.indexOf("PO ID");
  const poTotCol= poHdr.indexOf("Total Amount");
  const ssheet  = ss.getSheetByName(poRng.getSheet().getName());

  // build sum map
  const sums = {};
  for(let i=1;i<pdVals.length;i++){
    const id = pdVals[i][pdPoCol];
    const val= Number(pdVals[i][pdTotCol])||0;
    sums[id]=(sums[id]||0)+val;
  }

  // write back per PO
  for(let r=1;r<poVals.length;r++){
    const id      = poVals[r][poPoCol];
    const newSum  = sums[id]||0;
    const rowNum  = poRng.getRow()+r;
    const colNum  = poRng.getColumn()+poTotCol;
    ssheet.getRange(rowNum,colNum).setValue(newSum);
  }
}


function revisetotalinventory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get named ranges
  const inventoryRange = ss.getRangeByName("RANGEINVENTORYITEMS");
  const purchaseRange = ss.getRangeByName("RANGEPD");

  const inventoryData = inventoryRange.getValues();
  const purchaseData = purchaseRange.getValues();

  // Get headers
  const inventoryHeaders = inventoryData[0];
  const purchaseHeaders = purchaseData[0];

  // Find column indexes
  const invItemIdIndex = inventoryHeaders.indexOf("Item ID");
  const invQtyPurchasedIndex = inventoryHeaders.indexOf("QTY Purchased");

  const pdItemIdIndex = purchaseHeaders.indexOf("Item ID");
  const pdQtyIndex = purchaseHeaders.indexOf("QTY Purchased");

  if (invItemIdIndex === -1 || invQtyPurchasedIndex === -1 ||
      pdItemIdIndex === -1 || pdQtyIndex === -1) {
    throw new Error("One or more required columns (Item ID or QTY Purchased) not found.");
  }

  // Create a map of Item ID to total QTY Purchased from PurchaseDetails
  const qtyMap = {};
  for (let i = 1; i < purchaseData.length; i++) {
    const itemId = purchaseData[i][pdItemIdIndex];
    const qty = Number(purchaseData[i][pdQtyIndex]) || 0;
    if (itemId) {
      qtyMap[itemId] = (qtyMap[itemId] || 0) + qty;
    }
  }

  // Update QTY Purchased in InventoryItems sheet
  for (let j = 1; j < inventoryData.length; j++) {
    const itemId = inventoryData[j][invItemIdIndex];
    inventoryData[j][invQtyPurchasedIndex] = qtyMap[itemId] || 0;
  }

  // Write updated data back to sheet
  inventoryRange.setValues(inventoryData);
}



