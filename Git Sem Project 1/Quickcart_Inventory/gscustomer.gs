// Get all customers
function custGetCustomers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Customers");
  const range = ss.getRangeByName("RANGECUSTOMERS");
  
  if (!range) {
    return [];
  }
  
  const data = range.getValues();
  const headers = data[0];
  const customers = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === '') continue; // Skip empty rows
    
    customers.push({
      id: row[headers.indexOf("Customer ID")],
      name: row[headers.indexOf("Customer Name")],
      contact: row[headers.indexOf("Customer Contact")],
      email: row[headers.indexOf("Customer Email")],
      state: row[headers.indexOf("State")],
      city: row[headers.indexOf("City")],
      address: row[headers.indexOf("Customer Address")],
      sales: row[headers.indexOf("Total Sales")],
      receipts: row[headers.indexOf("Total Receipts")],
      balance: row[headers.indexOf("Balance Receivable")]
    });
  }
  
  return customers;
}

// Get states from Dimensions
function custGetStates() {
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
function custGetCities() {
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
function custAddNewState(stateName) {
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
function custAddNewCity(cityName) {
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

// Generate unique customer ID
function custGenerateCustomerId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Customers");
  const range = ss.getRangeByName("RANGECUSTOMERS");
  
  if (!range) {
    return "C" + Math.floor(10000 + Math.random() * 90000);
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Customer ID");
  const existingIds = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const id = data[i][idIndex];
    if (id && id !== '') {
      existingIds.add(id);
    }
  }
  
  let newId;
  do {
    newId = "C" + Math.floor(10000 + Math.random() * 90000);
  } while (existingIds.has(newId));
  
  return newId;
}

// Add new customer
function custAddNewCustomer(customer) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Customers");
  const range = ss.getRangeByName("RANGECUSTOMERS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  
  const newRow = [];
  headers.forEach(header => {
    switch(header) {
      case "Customer ID": newRow.push(customer.id); break;
      case "Customer Name": newRow.push(customer.name); break;
      case "Customer Contact": newRow.push(customer.contact); break;
      case "Customer Email": newRow.push(customer.email); break;
      case "State": newRow.push(customer.state); break;
      case "City": newRow.push(customer.city); break;
      case "Customer Address": newRow.push(customer.address); break;
      case "Total Sales": newRow.push(0); break;
      case "Total Receipts": newRow.push(0); break;
      case "Balance Receivable": newRow.push(0); break;
      default: newRow.push(''); break;
    }
  });
  
  // Append to sheet
  sheet.appendRow(newRow);
}

// Update customer
function custUpdateCustomer(customer) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Customers");
  const range = ss.getRangeByName("RANGECUSTOMERS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Customer ID");
  
  // Find row index
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === customer.id) {
      const rowNum = range.getRow() + i;
      
      // Update editable fields
      sheet.getRange(rowNum, headers.indexOf("Customer Name") + 1).setValue(customer.name);
      sheet.getRange(rowNum, headers.indexOf("Customer Contact") + 1).setValue(customer.contact);
      sheet.getRange(rowNum, headers.indexOf("Customer Email") + 1).setValue(customer.email);
      sheet.getRange(rowNum, headers.indexOf("State") + 1).setValue(customer.state);
      sheet.getRange(rowNum, headers.indexOf("City") + 1).setValue(customer.city);
      sheet.getRange(rowNum, headers.indexOf("Customer Address") + 1).setValue(customer.address);
      
      break;
    }
  }
}

// Delete customer
function custDeleteCustomer(customerId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Customers");
  const range = ss.getRangeByName("RANGECUSTOMERS");
  
  if (!range) {
    return "error";
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Customer ID");
  const balanceIndex = headers.indexOf("Balance Receivable");
  
  // Find row index
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === customerId) {
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