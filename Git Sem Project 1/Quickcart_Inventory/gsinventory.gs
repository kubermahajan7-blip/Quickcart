// Get all inventory items
function itemGetInventoryItems() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("InventoryItems");
  const range = ss.getRangeByName("RANGEINVENTORYITEMS");
  
  if (!range) {
    return [];
  }
  
  const data = range.getValues();
  const headers = data[0];
  const items = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === '') continue; // Skip empty rows
    
    items.push({
      id: row[headers.indexOf("Item ID")],
      type: row[headers.indexOf("Item Type")],
      category: row[headers.indexOf("Item Category")],
      subcategory: row[headers.indexOf("Item Subcategory")],
      name: row[headers.indexOf("Item Name")],
      purchasedQty: row[headers.indexOf("QTY Purchased")] || 0,
      soldQty: row[headers.indexOf("QTY Sold")] || 0,
      remainingQty: row[headers.indexOf("Remaining QTY")] || 0,
      reorderLevel: row[headers.indexOf("Reorder Level")] || 0,
      reorderRequired: row[headers.indexOf("Reorder Required")] === "Yes"
    });
  }
  
  return items;
}

// Get item types from Dimensions
function itemGetTypes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return [];
  }
  
  const data = range.getValues();
  const headers = data[0];
  const typeIndex = headers.indexOf("Item Type");
  
  if (typeIndex === -1) {
    return [];
  }
  
  const types = [];
  const typeSet = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const type = data[i][typeIndex];
    if (type && type.trim() !== '' && !typeSet.has(type)) {
      types.push(type);
      typeSet.add(type);
    }
  }
  
  return types;
}

// Get item categories from Dimensions
function itemGetCategories() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return [];
  }
  
  const data = range.getValues();
  const headers = data[0];
  const categoryIndex = headers.indexOf("Item Category");
  
  if (categoryIndex === -1) {
    return [];
  }
  
  const categories = [];
  const categorySet = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const category = data[i][categoryIndex];
    if (category && category.trim() !== '' && !categorySet.has(category)) {
      categories.push(category);
      categorySet.add(category);
    }
  }
  
  return categories;
}

// Get item subcategories from Dimensions
function itemGetSubcategories() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return [];
  }
  
  const data = range.getValues();
  const headers = data[0];
  const subcategoryIndex = headers.indexOf("Item Subcategory");
  
  if (subcategoryIndex === -1) {
    return [];
  }
  
  const subcategories = [];
  const subcategorySet = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const subcategory = data[i][subcategoryIndex];
    if (subcategory && subcategory.trim() !== '' && !subcategorySet.has(subcategory)) {
      subcategories.push(subcategory);
      subcategorySet.add(subcategory);
    }
  }
  
  return subcategories;
}

// Add new item type to Dimensions
function itemAddNewType(typeName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  const typeIndex = headers.indexOf("Item Type");
  
  if (typeIndex === -1) {
    return;
  }
  
  // Find first empty row
  let lastRow = sheet.getLastRow() + 1;
  
  // Add to Item Type column
  sheet.getRange(lastRow, typeIndex + 1).setValue(typeName);
}

// Add new item category to Dimensions
function itemAddNewCategory(categoryName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  const categoryIndex = headers.indexOf("Item Category");
  
  if (categoryIndex === -1) {
    return;
  }
  
  // Find first empty row
  let lastRow = sheet.getLastRow() + 1;
  
  // Add to Item Category column
  sheet.getRange(lastRow, categoryIndex + 1).setValue(categoryName);
}

// Add new item subcategory to Dimensions
function itemAddNewSubcategory(subcategoryName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Dimensions");
  const range = ss.getRangeByName("RANGEDIMENSIONS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  const subcategoryIndex = headers.indexOf("Item Subcategory");
  
  if (subcategoryIndex === -1) {
    return;
  }
  
  // Find first empty row
  let lastRow = sheet.getLastRow() + 1;
  
  // Add to Item Subcategory column
  sheet.getRange(lastRow, subcategoryIndex + 1).setValue(subcategoryName);
}

// Generate unique item ID
function itemGenerateInventoryId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("InventoryItems");
  const range = ss.getRangeByName("RANGEINVENTORYITEMS");
  
  if (!range) {
    return "P" + Math.floor(10000 + Math.random() * 90000);
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Item ID");
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

// Add new inventory item
function itemAddNewInventoryItem(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("InventoryItems");
  const range = ss.getRangeByName("RANGEINVENTORYITEMS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  
  const newRow = [];
  headers.forEach(header => {
    switch(header) {
      case "Item ID": newRow.push(item.id); break;
      case "Item Type": newRow.push(item.type); break;
      case "Item Category": newRow.push(item.category); break;
      case "Item Subcategory": newRow.push(item.subcategory); break;
      case "Item Name": newRow.push(item.name); break;
      case "QTY Purchased": newRow.push(0); break;
      case "QTY Sold": newRow.push(0); break;
      case "Remaining QTY": newRow.push(0); break;
      case "Reorder Level": newRow.push(item.reorderLevel); break;
      case "Reorder Required": newRow.push("No"); break;
      default: newRow.push(''); break;
    }
  });
  
  // Append to sheet
  sheet.appendRow(newRow);
}

// Update inventory item
function itemUpdateInventoryItem(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("InventoryItems");
  const range = ss.getRangeByName("RANGEINVENTORYITEMS");
  
  if (!range) {
    return;
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Item ID");
  
  // Find row index
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === item.id) {
      const rowNum = range.getRow() + i;
      
      // Update editable fields
      sheet.getRange(rowNum, headers.indexOf("Item Type") + 1).setValue(item.type);
      sheet.getRange(rowNum, headers.indexOf("Item Category") + 1).setValue(item.category);
      sheet.getRange(rowNum, headers.indexOf("Item Subcategory") + 1).setValue(item.subcategory);
      sheet.getRange(rowNum, headers.indexOf("Item Name") + 1).setValue(item.name);
      sheet.getRange(rowNum, headers.indexOf("Reorder Level") + 1).setValue(item.reorderLevel);
      
      // Update reorder required based on remaining quantity
      const remainingQty = sheet.getRange(rowNum, headers.indexOf("Remaining QTY") + 1).getValue();
      const reorderRequired = remainingQty < item.reorderLevel ? "Yes" : "No";
      sheet.getRange(rowNum, headers.indexOf("Reorder Required") + 1).setValue(reorderRequired);
      
      break;
    }
  }
}

// Delete inventory item
function itemDeleteInventoryItem(itemId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("InventoryItems");
  const range = ss.getRangeByName("RANGEINVENTORYITEMS");
  
  if (!range) {
    return "error";
  }
  
  const data = range.getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("Item ID");
  const qtyIndex = headers.indexOf("Remaining QTY");
  
  // Find row index
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === itemId) {
      const qty = data[i][qtyIndex] || 0;
      
      // Check remaining quantity
      if (qty > 0) {
        return "qty_error";
      }
      
      // Delete row
      const rowNum = range.getRow() + i;
      sheet.deleteRow(rowNum);
      return "success";
    }
  }
  
  return "not_found";
}