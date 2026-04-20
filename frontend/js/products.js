const productsTemplate = `
  <h1 class="h3 mb-4">Products</h1>
  <div class="row g-4">
    <div class="col-lg-7">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">Catalog</div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-striped mb-0">
              <thead class="table-light">
                <tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th></tr>
              </thead>
              <tbody id="products-body">
                <tr><td colspan="5" class="text-muted text-center py-4">Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-5">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">Add product</div>
        <div class="card-body">
          <form id="form-product">
            <div class="mb-3">
              <label class="form-label" for="prod-name">Name</label>
              <input type="text" class="form-control" id="prod-name" name="name" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="prod-price">Price ($)</label>
              <input type="number" step="0.01" min="0" class="form-control" id="prod-price" name="price" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="prod-qty">Initial stock</label>
              <input type="number" min="0" class="form-control" id="prod-qty" name="quantity" value="0" required />
            </div>
            <button type="submit" class="btn btn-success">Add product</button>
          </form>
        </div>
      </div>
    </div>
  </div>`;

registerPage("products", function(app) {
  app.innerHTML = productsTemplate;
  loadProducts();

  document.getElementById("form-product").addEventListener("submit", async function(e) {
    e.preventDefault();
    const form = e.target;
    try {
      hideError();
      await apiPost("/products", {
        name:     form.name.value.trim(),
        price:    parseFloat(form.price.value),
        quantity: parseInt(form.quantity.value, 10),
      });
      form.reset();
      await loadProducts();
    } catch (err) {
      showError("Add product failed: " + err.message);
    }
  });
});

async function loadProducts() {
  const tbody = document.getElementById("products-body");
  try {
    const rows = asArray(await apiGet("/products"));
    if (!rows.length) { tbody.innerHTML = emptyRow(5, "No products yet."); return; }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${escapeHtml(r.id ?? r.productId ?? "")}</td>
        <td>${escapeHtml(r.name ?? r.productName ?? "")}</td>
        <td>${escapeHtml(r.category ?? "")}</td>
        <td>$${escapeHtml(r.price ?? "")}</td>
        <td>${escapeHtml(r.quantity ?? r.quantityOnHand ?? "")}</td>
      </tr>`).join("");
  } catch (err) {
    showError("Could not load products: " + err.message);
    tbody.innerHTML = emptyRow(5, "Failed to load. Is the API running?");
  }
}
