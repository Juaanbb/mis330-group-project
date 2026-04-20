const ordersTemplate = `
  <h1 class="h3 mb-4">Orders</h1>
  <div class="row g-4">
    <div class="col-lg-7">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">All orders</div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-striped mb-0">
              <thead class="table-light">
                <tr><th>ID</th><th>Customer ID</th><th>Date</th><th>Status</th><th>Total</th></tr>
              </thead>
              <tbody id="orders-body">
                <tr><td colspan="5" class="text-muted text-center py-4">Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-5">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">Create order</div>
        <div class="card-body">
          <form id="form-order">
            <div class="mb-3">
              <label class="form-label" for="order-customer">Customer ID</label>
              <input type="number" min="1" class="form-control" id="order-customer" name="customerId" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="order-address">Shipping address</label>
              <input type="text" class="form-control" id="order-address" name="address" placeholder="123 Main St" />
            </div>
            <div class="mb-3">
              <label class="form-label" for="order-city">City</label>
              <input type="text" class="form-control" id="order-city" name="city" />
            </div>
            <button type="submit" class="btn btn-success">Place order</button>
          </form>
        </div>
      </div>
    </div>
  </div>`;

registerPage("orders", function(app) {
  app.innerHTML = ordersTemplate;
  loadOrders();

  document.getElementById("form-order").addEventListener("submit", async function(e) {
    e.preventDefault();
    const form = e.target;
    try {
      hideError();
      await apiPost("/orders", {
        customerId: parseInt(form.customerId.value, 10),
        address:    form.address.value.trim() || null,
        city:       form.city.value.trim() || null,
      });
      form.reset();
      await loadOrders();
    } catch (err) {
      showError("Create order failed: " + err.message);
    }
  });
});

async function loadOrders() {
  const tbody = document.getElementById("orders-body");
  try {
    const rows = asArray(await apiGet("/orders"));
    if (!rows.length) { tbody.innerHTML = emptyRow(5, "No orders yet."); return; }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${escapeHtml(r.id ?? r.orderId ?? "")}</td>
        <td>${escapeHtml(r.customerId ?? "")}</td>
        <td>${escapeHtml(r.orderDate ?? "")}</td>
        <td>${escapeHtml(r.orderStatus ?? r.status ?? "")}</td>
        <td>$${escapeHtml(r.totalAmount ?? r.total ?? "0.00")}</td>
      </tr>`).join("");
  } catch (err) {
    showError("Could not load orders: " + err.message);
    tbody.innerHTML = emptyRow(5, "Failed to load. Is the API running?");
  }
}
