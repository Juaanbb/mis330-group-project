registerPage("reports", function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Reports" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // Helper — builds a report card and returns its tbody
  function reportCard(colClass, title, columns, tbodyId) {
    const col = make("div", { class: colClass });
    row.appendChild(col);
    const { card, body } = makeCard(title);
    body.className = "card-body p-0";
    col.appendChild(card);
    const { wrapper, tbody } = makeTable(columns, tbodyId);
    body.appendChild(wrapper);
    emptyRow(tbody, columns.length, "Loading…");
    return tbody;
  }

  const tb1 = reportCard("col-lg-6", "Order status summary",          ["Status", "Orders", "Revenue"],                        "r-order-status");
  const tb2 = reportCard("col-lg-6", "Revenue by category",           ["Category", "Units sold", "Revenue"],                  "r-rev-category");
  const tb3 = reportCard("col-lg-6", "Top 10 products by revenue",    ["Product", "Units sold", "Revenue"],                   "r-top-products");
  const tb4 = reportCard("col-lg-6", "Customer spend ranking",        ["Customer", "Orders", "Total spent"],                  "r-cust-spend");
  const tb5 = reportCard("col-lg-6", "Employee workload",             ["Employee", "Role", "Orders handled", "Revenue"],      "r-emp-workload");
  const tb6 = reportCard("col-lg-6", "Low stock alert",               ["Product", "SKU", "Category", "On hand", "Reorder at"], "r-low-stock");
  const tb7 = reportCard("col-12",   "Monthly sales trend",           ["Month", "Orders", "Revenue"],                        "r-monthly");
  const tb8 = reportCard("col-lg-6", "Inventory transactions by type",["Type", "Transactions", "Net qty change"],             "r-inv-type");
  const tb9 = reportCard("col-lg-6", "Inventory activity by product", ["Product", "Transactions", "Net qty change"],          "r-inv-product");

  loadReports(tb1, tb2, tb3, tb4, tb5, tb6, tb7, tb8, tb9);
});

async function loadReports(tb1, tb2, tb3, tb4, tb5, tb6, tb7, tb8, tb9) {
  const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
    apiGet("/reports/order-status").catch(() => []),
    apiGet("/reports/revenue-by-category").catch(() => []),
    apiGet("/reports/top-products").catch(() => []),
    apiGet("/reports/customer-spend").catch(() => []),
    apiGet("/reports/employee-workload").catch(() => []),
    apiGet("/reports/low-stock").catch(() => []),
    apiGet("/reports/monthly-sales").catch(() => []),
    apiGet("/reports/inventory-by-type").catch(() => []),
    apiGet("/reports/inventory-by-product").catch(() => []),
  ]);

  fillTable(tb1, r1, r => [r.status, String(r.count), "$" + Number(r.revenue).toFixed(2)]);
  fillTable(tb2, r2, r => [r.category, String(r.unitsSold), "$" + Number(r.revenue).toFixed(2)]);
  fillTable(tb3, r3, r => [r.name, String(r.unitsSold), "$" + Number(r.revenue).toFixed(2)]);
  fillTable(tb4, r4, r => [r.name, String(r.orderCount), "$" + Number(r.totalSpent).toFixed(2)]);
  fillTable(tb5, r5, r => [r.name, r.role, String(r.ordersHandled), "$" + Number(r.orderRevenue).toFixed(2)]);
  fillTable(tb6, r6, r => [r.name, r.sku, r.category, String(r.quantity), String(r.reorderLevel)], r => r.quantity <= r.reorderLevel ? "table-warning" : "");
  fillTable(tb7, r7, r => [r.month, String(r.orderCount), "$" + Number(r.revenue).toFixed(2)]);
  fillTable(tb8, r8, r => [r.type, String(r.transactionCount), String(r.netQtyChange)]);
  fillTable(tb9, r9, r => [r.name, String(r.transactionCount), String(r.netQtyChange)]);
}

// Generic table filler — cells is a fn(row) => string[], rowClass is optional fn(row) => string
function fillTable(tbody, data, cells, rowClass) {
  tbody.innerHTML = "";
  const rows = asArray(data);
  if (!rows.length) { emptyRow(tbody, tbody.closest("table").querySelectorAll("th").length, "No data."); return; }
  rows.forEach(r => {
    const tr = make("tr");
    if (rowClass) tr.className = rowClass(r);
    cells(r).forEach(val => tr.appendChild(make("td", { text: val })));
    tbody.appendChild(tr);
  });
}
