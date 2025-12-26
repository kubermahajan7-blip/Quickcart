function doGet(e) {
  const page = e.parameter.page || 'dashboard';
  
  // Map pages to their template files
  const pageTemplates = {
    'dashboard': 'index',
    'inventory': 'inventory',
    'suppliers': 'suppliers',
    'customers': 'customers',
    'purchases': 'purchases',
    'sales': 'sales',
    'receipts': 'receipts',
    'payments': 'payments',
    'reports': 'reports'
  };
  
  // Get template name or default to index
  const contentTemplate = pageTemplates[page] || 'index';
  
  // Create template from base file
  const template = HtmlService.createTemplateFromFile('template');
  
  // Set dynamic properties
  template.contentTemplate = contentTemplate;
  template.getScriptUrl = getScriptUrl;
  template.currentPage = page; // <--- THIS IS THE NEW LINE
  
  // Evaluate and return template
  return template.evaluate()
    .setTitle('QuickCart Inventory App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();

}
function doGet(e) {
  const page = e.parameter.page || 'dashboard';
  
  // Map pages to their template files
  const pageTemplates = {
    'dashboard': 'index',
    'inventory': 'inventory',
    'suppliers': 'suppliers',
    'customers': 'customers',
    'purchases': 'purchases',
    'sales': 'sales',
    'receipts': 'receipts',
    'payments': 'payments',
    'reports': 'reports'
  };
  
  // Get template name or default to index
  const contentTemplate = pageTemplates[page] || 'index';
  
  // Create template from base file
  const template = HtmlService.createTemplateFromFile('template');
  
  // Set dynamic properties
  template.contentTemplate = contentTemplate;
  template.getScriptUrl = getScriptUrl;
  template.currentPage = page; // <--- THIS IS THE NEW LINE
  
  // Evaluate and return template
  return template.evaluate()
    .setTitle('QuickCart Inventory App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}
