const customersTemplate = `
  <h1 class="h3 mb-4">Customers</h1>
  <div class="row g-4">
    <div class="col-lg-7">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">All customers</div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-striped mb-0">
              <thead class="table-light">
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th></tr>
              </thead>
              <tbody id="customers-body">
                <tr><td colspan="4" class="text-muted text-center py-4">Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-5">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">Add customer</div>
        <div class="card-body">
          <form id="form-customer">
            <div class="mb-3">
              <label class="form-label" for="cust-name">Full name</label>
              <input type="text" class="form-control" id="cust-name" name="name" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="cust-email">Email</label>
              <input type="email" class="form-control" id="cust-email" name="email" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="cust-phone">Phone</label>
              <input type="text" class="form-control" id="cust-phone" name="phone" />
            </div>
            <button type="submit" class="btn btn-success">Add customer</button>
          </form>
        </div>
      </div>
    </div>
  </div>`;

registerPage("customers", function(app) {
  app.innerHTML = customersTemplate;
  loadCustomers();

  document.getElementById("form-customer").addEventListener("submit", async function(e) {
    e.preventDefault();
    const form = e.target;
    try {
      hideError();
      await apiPost("/customers", {
        name:  form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim() || null,
      });
      form.reset();
      await loadCustomers();
    } catch (err) {
      showError("Add customer failed: " + err.message);
    }
  });
});

async function loadCustomers() {
  const tbody = document.getElementById("customers-body");
  try {
    const rows = asArray(await apiGet("/customers"));
    if (!rows.length) { tbody.innerHTML = emptyRow(4, "No customers yet."); return; }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${escapeHtml(r.id ?? r.customerId ?? "")}</td>
        <td>${escapeHtml(r.name ?? "")}</td>
        <td>${escapeHtml(r.email ?? "")}</td>
        <td>${escapeHtml(r.phone ?? "")}</td>
      </tr>`).join("");
  } catch (err) {
    showError("Could not load customers: " + err.message);
    tbody.innerHTML = emptyRow(4, "Failed to load. Is the API running?");
  }
}
