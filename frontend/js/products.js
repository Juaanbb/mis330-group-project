registerPage("products", async function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Products" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ──────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const searchInput = make("input", { type: "text", class: "form-control form-control-sm w-auto", placeholder: "Search…" });
  const { card: tableCard, body: tableBody } = makeCard("Catalog", searchInput);
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["ID", "Name", "Category", "Price", "Stock", "Actions"], "products-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 6, "Loading…");

  // ── Right: form ──────────────────────────────────────────────────────────
  const rightCol = make("div", { class: "col-lg-5" });
  row.appendChild(rightCol);

  const formTitle = make("div", { id: "product-form-title", class: "card-header bg-white fw-semibold", text: "Add product" });
  const { card: formCard, body: formBody } = makeCard("Add product");
  formCard.querySelector(".card-header").replaceWith(formTitle);
  rightCol.appendChild(formCard);

  const form     = make("form");
  const editIdIn = make("input", { type: "hidden", id: "edit-product-id" });
  const nameIn   = make("input", { type: "text",   id: "prod-name",  name: "name",        required: true });
  const descIn   = make("textarea", { id: "prod-desc", name: "description", required: true, rows: "2", placeholder: "Short product description" });
  const priceIn  = make("input", { type: "number", id: "prod-price", name: "price",       required: true, step: "0.01", min: "0" });
  const qtyIn    = make("input", { type: "number", id: "prod-qty",   name: "quantity",    required: true, min: "0", value: "0" });

  // Category dropdown — populated from the categories table
  const categorySelect = make("select", { id: "prod-category", name: "categoryId", required: true });
  categorySelect.classList.add("form-select");
  const defaultOpt = make("option", { text: "Select a category", value: "" });
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  categorySelect.appendChild(defaultOpt);

  try {
    const categories = asArray(await apiGet("/categories"));
    categories.forEach(c => {
      categorySelect.appendChild(make("option", { text: c.name, value: String(c.id) }));
    });
  } catch {
    categorySelect.appendChild(make("option", { text: "Could not load categories", value: "" }));
  }

  const categoryGroup = make("div", { class: "mb-3" });
  append(categoryGroup,
    make("label", { class: "form-label", for: "prod-category", text: "Category" }),
    categorySelect
  );

  const submitBtn = make("button", { id: "product-submit-btn", class: "btn btn-success", text: "Add product" });
  submitBtn.type  = "submit";
  const cancelBtn = make("button", { id: "product-cancel-btn", class: "btn btn-outline-secondary", text: "Cancel", hidden: true });
  cancelBtn.type  = "button";

  const btnRow = make("div", { class: "d-flex gap-2" });
  append(btnRow, submitBtn, cancelBtn);
  append(form, editIdIn, formGroup("Name", nameIn), formGroup("Description", descIn), categoryGroup, formGroup("Price ($)", priceIn), formGroup("Stock qty", qtyIn), btnRow);
  formBody.appendChild(form);

  // ── Events ───────────────────────────────────────────────────────────────
  loadProducts();

  searchInput.addEventListener("input", function() {
    const q = this.value.toLowerCase();
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    const editId = editIdIn.value;
    const catId  = categorySelect.value ? parseInt(categorySelect.value, 10) : null;
    const body   = { name: nameIn.value.trim(), description: descIn.value.trim(), price: parseFloat(priceIn.value), quantity: parseInt(qtyIn.value, 10), categoryId: catId };
    try {
      hideError();
      editId ? await apiPut("/products/" + editId, body) : await apiPost("/products", body);
      resetProductForm();
      await loadProducts();
    } catch (err) {
      showError((editId ? "Update" : "Add") + " product failed: " + err.message);
    }
  });

  cancelBtn.addEventListener("click", resetProductForm);
});

function resetProductForm() {
  const form = document.querySelector("#products-body")?.closest(".row")?.querySelector("form");
  if (form) form.reset();
  const qtyIn = document.getElementById("prod-qty");
  if (qtyIn) qtyIn.value = "0";
  const sel = document.getElementById("prod-category");
  if (sel) sel.selectedIndex = 0;
  document.getElementById("edit-product-id").value       = "";
  document.getElementById("product-form-title").textContent = "Add product";
  document.getElementById("product-submit-btn").textContent = "Add product";
  document.getElementById("product-cancel-btn").style.display = "none";
}

async function loadProducts() {
  const tbody = document.getElementById("products-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const rows = asArray(await apiGet("/products"));
    if (!rows.length) { emptyRow(tbody, 6, "No products yet."); return; }
    rows.forEach(r => tbody.appendChild(buildProductRow(r)));
  } catch (err) {
    showError("Could not load products: " + err.message);
    emptyRow(tbody, 6, "Failed to load. Is the API running?");
  }
}

function buildProductRow(r) {
  const tr = make("tr");
  [String(r.id ?? ""), r.name ?? "", r.category ?? "", "$" + (r.price ?? ""), String(r.quantity ?? "")].forEach(val => {
    tr.appendChild(make("td", { text: val }));
  });

  const td      = make("td");
  const editBtn = make("button", { class: "btn btn-sm btn-outline-primary me-1", text: "Edit" });
  editBtn.type  = "button";
  editBtn.addEventListener("click", () => {
    document.getElementById("edit-product-id").value = r.id;
    document.getElementById("prod-name").value        = r.name ?? "";
    document.getElementById("prod-desc").value        = r.description ?? "";
    document.getElementById("prod-price").value       = r.price ?? "";
    document.getElementById("prod-qty").value         = r.quantity ?? 0;

    const select = document.getElementById("prod-category");
    if (select && r.categoryId != null) select.value = String(r.categoryId);

    document.getElementById("product-form-title").textContent  = "Edit product";
    document.getElementById("product-submit-btn").textContent  = "Update product";
    document.getElementById("product-cancel-btn").style.display = "";
    document.getElementById("prod-name").focus();
  });

  const delBtn = make("button", { class: "btn btn-sm btn-outline-danger", text: "Delete" });
  delBtn.type  = "button";
  delBtn.addEventListener("click", async () => {
    if (!confirm("Delete this product?")) return;
    try { hideError(); await apiDelete("/products/" + r.id); await loadProducts(); }
    catch (err) { showError("Delete failed: " + err.message); }
  });

  append(td, editBtn, delBtn);
  tr.appendChild(td);
  return tr;
}
