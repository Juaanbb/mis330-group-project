const dashboardTemplate = `
  <h1 class="h3 mb-4">Dashboard</h1>
  <div class="row g-3 mb-4">
    <div class="col-sm-6 col-lg-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="text-muted small">Customers</div>
          <div class="fs-3 fw-semibold" id="dash-customers">—</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="text-muted small">Products</div>
          <div class="fs-3 fw-semibold" id="dash-products">—</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="text-muted small">Orders</div>
          <div class="fs-3 fw-semibold" id="dash-orders">—</div>
        </div>
      </div>
    </div>
    <div class="col-sm-6 col-lg-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="text-muted small">Low stock</div>
          <div class="fs-3 fw-semibold" id="dash-low-stock">—</div>
        </div>
      </div>
    </div>
  </div>
  <div class="card border-0 shadow-sm">
    <div class="card-header bg-white fw-semibold">Recent orders</div>
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>ID</th><th>Customer ID</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody id="dash-orders-body">
            <tr><td colspan="4" class="text-muted text-center py-4">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;

registerPage("dashboard", function(app) {
  app.innerHTML = dashboardTemplate;
  loadDashboard();
});

async function loadDashboard() {
  try {
    const [custRaw, prodRaw, ordRaw, invRaw] = await Promise.all([
      apiGet("/customers").catch(() => []),
      apiGet("/products").catch(() => []),
      apiGet("/orders").catch(() => []),
      apiGet("/inventory").catch(() => []),
    ]);

    const customers = asArray(custRaw);
    const products  = asArray(prodRaw);
    const orders    = asArray(ordRaw);
    const inventory = asArray(invRaw);

    document.getElementById("dash-customers").textContent = customers.length;
    document.getElementById("dash-products").textContent  = products.length;
    document.getElementById("dash-orders").textContent    = orders.length;

    const low = inventory.filter(r => {
      const qty     = Number(r.quantity ?? r.quantityOnHand ?? 0);
      const reorder = Number(r.reorderLevel ?? r.reorderAt ?? 0);
      return reorder > 0 && qty <= reorder;
    });
    document.getElementById("dash-low-stock").textContent = inventory.length ? low.length : "—";

    const recent = [...orders]
      .sort((a, b) => new Date(b.orderDate ?? 0) - new Date(a.orderDate ?? 0))
      .slice(0, 5);

    const tbody = document.getElementById("dash-orders-body");
    if (!recent.length) { tbody.innerHTML = emptyRow(4, "No orders yet."); return; }

    tbody.innerHTML = recent.map(r => `
      <tr>
        <td>${escapeHtml(r.id ?? r.orderId ?? "")}</td>
        <td>${escapeHtml(r.customerId ?? "")}</td>
        <td>${escapeHtml(r.orderDate ?? "")}</td>
        <td>${escapeHtml(r.orderStatus ?? r.status ?? "")}</td>
      </tr>`).join("");
  } catch (err) {
    showError("Dashboard error: " + err.message);
  }
}
