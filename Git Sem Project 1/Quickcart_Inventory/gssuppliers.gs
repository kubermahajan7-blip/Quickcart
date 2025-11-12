// Get all suppliers
function supGetSuppliers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Suppliers");
  const range = ss.getRangeByName("RANGESUPPLIERS");
  
  if (!range) {
    return [];
  }
  
  const data = range.getValues();
  const headers = data[0];
  const suppliers = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === '') continue; // Skip empty rows
    
    suppliers.push({
      id: row[headers.indexOf("Supplier ID")],
      name: row[headers.indexOf("Supplier Name")],
      contact: row[headers.indexOf("Supplier Contact")],
      email: row[headers.indexOf("Supplier Email")],
      state: row[headers.indexOf("State")],
      city: row[headers.indexOf("City")],
      address: row[headers.indexOf("Supplier Address")],
      purchases: row[headers.indexOf("Total Purchases")],
      payments: row[headers.indexOf("Total Payments")],
      balance: row[headers.indexOf("Balance Payable")]
    });
  }
  
  return suppliers;
}

// Get states from Dimensions
function supGetStates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return [];
  }
  
  const data = range.getValues();
  const headers = data[0];
  const stateIndex = headers.indexOf("State");
  
  if (stateIndex === -1) {
    return [];
  }
  
  const states = [];
  const stateSet = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const state = data[i][stateIndex];
    if (state && state.trim() !== '' && !stateSet.has(state)) {
      states.push(state);
      stateSet.add(state);
    }
  }
  
  return states;
}

// Get cities from Dimensions
function supGetCities() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return [];
  }
  
  const data = range.getValues();
  const headers = data[0];
  const cityIndex = headers.indexOf("City");
  
  if (cityIndex === -1) {
    return [];
  }
  
  const cities = [];
  const citySet = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const city = data[i][cityIndex];
    if (city && city.trim() !== '' && !citySet.has(city)) {
      cities.push(city);
      citySet.add(city);
    }
  }
  
  return cities;
}

// Add new state to Dimensions
function supAddNewState(stateName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  const stateIndex = headers.indexOf("State");
  
  if (stateIndex === -1) {
    return;
  }
  
  // Find first empty row
  let lastRow = sheet.getLastRow() + 1;
  
  // Add to State column
  sheet.getRange(lastRow, stateIndex + 1).setValue(stateName);
}

// Add new city to Dimensions
function supAddNewCity(cityName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  const cityIndex = headers.indexOf("City");
  
  if (cityIndex === -1) {
    return;
  }
  
  // Find first empty row
  let lastRow = sheet.getLastRow() + 1;
  
  // Add to City column
  sheet.getRange(lastRow, cityIndex + 1).setValue(cityName);
}

// Generate unique supplier ID
function supGenerateSupplierId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Suppliers");
  const range = ss.getRangeByName("RANGESUPPLIERS");
  
  if (!range) {
    return "P" + Math.floor(10000 + Math.random() * 90000);
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Supplier ID");
  const existingIds = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const id = data[i][idIndex];
    if (id && id !== '') {
      existingIds.add(id);
    }
  }
  
  let newId;
  do {
    newId = "P" + Math.floor(10000 + Math.random() * 90000);
  } while (existingIds.has(newId));
  
  return newId;
}

// Add new supplier
function supAddNewSupplier(supplier) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Suppliers");
  const range = ss.getRangeByName("RANGESUPPLIERS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  
  const newRow = [];
  headers.forEach(header => {
    switch(header) {
      case "Supplier ID": newRow.push(supplier.id); break;
      case "Supplier Name": newRow.push(supplier.name); break;
      case "Supplier Contact": newRow.push(supplier.contact); break;
      case "Supplier Email": newRow.push(supplier.email); break;
      case "State": newRow.push(supplier.state); break;
      case "City": newRow.push(supplier.city); break;
      case "Supplier Address": newRow.push(supplier.address); break;
      case "Total Purchases": newRow.push(0); break;
      case "Total Payments": newRow.push(0); break;
      case "Balance Payable": newRow.push(0); break;
      default: newRow.push(''); break;
    }
  });
  
  // Append to sheet
  sheet.appendRow(newRow);
}

// Update supplier
function supUpdateSupplier(supplier) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Suppliers");
  const range = ss.getRangeByName("RANGESUPPLIERS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Supplier ID");
  
  // Find row index
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === supplier.id) {
      const rowNum = range.getRow() + i;
      
      // Update editable fields
      sheet.getRange(rowNum, headers.indexOf("Supplier Name") + 1).setValue(supplier.name);
      sheet.getRange(rowNum, headers.indexOf("Supplier Contact") + 1).setValue(supplier.contact);
      sheet.getRange(rowNum, headers.indexOf("Supplier Email") + 1).setValue(supplier.email);
      sheet.getRange(rowNum, headers.indexOf("State") + 1).setValue(supplier.state);
      sheet.getRange(rowNum, headers.indexOf("City") + 1).setValue(supplier.city);
      sheet.getRange(rowNum, headers.indexOf("Supplier Address") + 1).setValue(supplier.address);
      
      break;
    }
  }
}

// Delete supplier
function supDeleteSupplier(supplierId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Suppliers");
  const range = ss.getRangeByName("RANGESUPPLIERS");
  
  if (!range) {
    return "error";
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Supplier ID");
  const balanceIndex = headers.indexOf("Balance Payable");
  
  // Find row index
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === supplierId) {
      const balance = data[i][balanceIndex] || 0;
      
      // Check balance
      if (balance > 0) {
        return "balance_error";
      }
      
      // Delete row
      const rowNum = range.getRow() + i;
      sheet.deleteRow(rowNum);
      return "success";
    }
  }
  
  return "not_found";
}