/**
 * Reads a named range and returns rows of objects keyed by header.
 */
function dashGetRows(rangeName) {
  const ss = SpreadsheetApp.getActive();
  const range = ss.getRangeByName(rangeName);
  if (!range) throw new Error('Named range ' + rangeName + ' not found');
  const [headers, ...values] = range.getValues();
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

/**
 * Main entrypoint: returns all KPI values and chart data.
 */
function dashGetDashboardData() {
  // Fetch detail rows
  const sales = dashGetRows('RANGESD');
  const purchases = dashGetRows('RANGEPD');
  const customers = dashGetRows('RANGECUSTOMERS');
  const suppliers = dashGetRows('RANGESUPPLIERS');

  // KPI 1 & 2
  const totalSales = sales.reduce((sum, r) => sum + Number(r['Total Sales Price']||0), 0);
  const totalPurchases = purchases.reduce((sum, r) => sum + Number(r['Total Purchase Price']||0), 0);
  const netProfit = totalSales - totalPurchases;

  // KPI 4 & 5
  const totalReceivable = customers.reduce((sum, r) => sum + Number(r['Balance Receivable']||0), 0);
  const totalPayable = suppliers.reduce((sum, r) => sum + Number(r['Balance Payable']||0), 0);

  // KPI 6: Top Sales Location
  const salesByCity = {};
  sales.forEach(r => {
    const city = r['City']||'Unknown';
    salesByCity[city] = (salesByCity[city]||0) + Number(r['Total Sales Price']||0);
  });
  const topLocation = Object.entries(salesByCity).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';

  // KPI 7: Top Selling Item
  const salesByItem = {};
  sales.forEach(r => {
    const item = r['Item Type']||'Unknown';
    salesByItem[item] = (salesByItem[item]||0) + Number(r['Total Sales Price']||0);
  });
  const topItem = Object.entries(salesByItem).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';

  /*** Chart Data ***/

  // Chart 1: Sales Trend (group by month)
  const trendMap = {};
  sales.forEach(r => {
    const d = new Date(r['SO Date']);
    const key = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-01');
    trendMap[key] = (trendMap[key]||0) + Number(r['Total Sales Price']||0);
  });
  const salesTrendDates = Object.keys(trendMap).sort();
  const salesTrendValues = salesTrendDates.map(d => trendMap[d]);

  // Chart 2: Sales By Location (State)
  const stateMap = {};
  sales.forEach(r => {
    const st = r['State']||'Unknown';
    stateMap[st] = (stateMap[st]||0) + Number(r['Total Sales Price']||0);
  });
  const salesByLocation = { labels: Object.keys(stateMap), values: Object.values(stateMap) };

  // Chart 3: Sales By Category
  const catMap = {};
  sales.forEach(r => {
    const c = r['Item Type']||'Unknown';
    catMap[c] = (catMap[c]||0) + Number(r['Total Sales Price']||0);
  });
  const totalCat = Object.values(catMap).reduce((a,b)=>a+b,0);
  const salesByCategory = {
    labels: Object.keys(catMap),
    values: Object.values(catMap).map(v => (v/totalCat)*100)
  };

  // Chart 4: Top 10 Customers
  const custMap = {};
  sales.forEach(r => {
    const c = r['Customer Name']||'Unknown';
    custMap[c] = (custMap[c]||0) + Number(r['Total Sales Price']||0);
  });
  const topCustArr = Object.entries(custMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const topCustomers = { labels: topCustArr.map(a=>a[0]), values: topCustArr.map(a=>a[1]) };

  // Chart 5: Purchase By Location (State)
  const purStateMap = {};
  purchases.forEach(r => {
    const st = r['State']||'Unknown';
    purStateMap[st] = (purStateMap[st]||0) + Number(r['Total Purchase Price']||0);
  });
  const totalPurState = Object.values(purStateMap).reduce((a,b)=>a+b,0);
  const purchaseByLocation = {
    labels: Object.keys(purStateMap),
    values: Object.values(purStateMap).map(v=> (v/totalPurState)*100)
  };

  // Chart 6: Purchase By Category stacked by year
  const purCatYear = {};
  purchases.forEach(r => {
    const d = new Date(r['Date']);
    const y = d.getFullYear();
    const c = r['Item Type']||'Unknown';
    purCatYear[y] = purCatYear[y]||{};
    purCatYear[y][c] = (purCatYear[y][c]||0) + Number(r['Total Purchase Price']||0);
  });
  const years = Object.keys(purCatYear).sort();
  const items = Array.from(new Set(purchases.map(r=>r['Item Type'])));
  const series = items.map(item => ({
    name: item,
    data: years.map(y => purCatYear[y][item]||0)
  }));
  const purchaseByCategory = { years, series };

  // Chart 7: Sales By City (Treemap)
  const treemapData = Object.entries(salesByCity)
    .sort((a,b)=>b[1]-a[1])
    .map(([city, val])=>({ x: city, y: val }));

  return {
    totalSales,
    totalPurchases,
    netProfit,
    totalReceivable,
    totalPayable,
    topLocation,
    topItem,
    salesTrend: { dates: salesTrendDates, values: salesTrendValues },
    salesByLocation,
    salesByCategory,
    topCustomers,
    purchaseByLocation,
    purchaseByCategory,
    salesByCity: treemapData
  };
}
