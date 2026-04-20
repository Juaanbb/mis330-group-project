const inventoryTemplate = `
  <h1 class="h3 mb-4">Inventory</h1>
  <div class="card border-0 shadow-sm">
    <div class="card-header bg-white fw-semibold">Stock levels</div>
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-striped mb-0">
          <thead class="table-light">
            <tr><th>Product ID</th><th>Name</th><th>Qty on hand</th><th>Reorder at</th><th>Status</th></tr>
          </thead>
          <tbody id="inventory-body">
            <tr><td colspan="5" class="text-muted text-center py-4">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;

registerPage("inventory", function(app) {
  app.innerHTML = inventoryTemplate;
  loadInventory();
});

async function loadInventory() {
  const tbody = document.getElementById("inventory-body");
  try {
    const rows = asArray(await apiGet("/inventory"));
    if (!rows.length) { tbody.innerHTML = emptyRow(5, "No inventory data."); return; }
    tbody.innerHTML = rows.map(r => {
      const qty     = Number(r.quantity ?? r.quantityOnHand ?? 0);
      const reorder = Number(r.reorderLevel ?? r.reorderAt ?? 0);
      const isLow   = reorder > 0 && qty <= reorder;
      const badge   = isLow
        ? `<span class="badge bg-danger">Low stock</span>`
        : `<span class="badge bg-success">OK</span>`;
      return `
        <tr class="${isLow ? "table-warning" : ""}">
          <td>${escapeHtml(r.productId ?? r.id ?? "")}</td>
          <td>${escapeHtml(r.name ?? "")}</td>
          <td>${qty}</td>
          <td>${reorder}</td>
          <td>${badge}</td>
        </tr>`;
    }).join("");
  } catch (err) {
    showError("Could not load inventory: " + err.message);
    tbody.innerHTML = emptyRow(5, "Failed to load. Is the API running?");
  }
}
