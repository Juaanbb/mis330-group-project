let _allProducts = [];
let _allCategories = [];

registerPage("products", async function(app) {
  _allProducts = [];
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Products" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ──────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const filterBar  = make("div", { class: "d-flex gap-2 mb-2 flex-wrap" });
  const searchInput = make("input", { type: "text", class: "form-control form-control-sm", placeholder: "Search…" });
  searchInput.style.width = "140px";

  const catFilter = make("select", { class: "form-select form-select-sm w-auto", id: "prod-cat-filter" });
  catFilter.appendChild(make("option", { text: "All Categories" }));

  const sortSelect = make("select", { class: "form-select form-select-sm w-auto" });
  [
    ["name-asc",   "Name: A → Z"],
    ["name-desc",  "Name: Z → A"],
    ["price-asc",  "Price: Low → High"],
    ["price-desc", "Price: High → Low"],
    ["stock-asc",  "Stock: Low → High"],
    ["stock-desc", "Stock: High → Low"],
  ].forEach(([val, text]) => { const o = make("option", { text }); o.value = val; sortSelect.appendChild(o); });

  append(filterBar, searchInput, catFilter, sortSelect);
  leftCol.appendChild(filterBar);

  const { card: tableCard, body: tableBody } = makeCard("Catalog");
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["ID", "Name", "Category", "Price", "Stock", "Actions"], "products-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 6, "Loading…");

  // ── Right: form (managers only) ──────────────────────────────────────────
  let categorySelect;

  if (isManager()) {
    const rightCol = make("div", { class: "col-lg-5" });
    row.appendChild(rightCol);

    const formTitle = make("div", { id: "product-form-title", class: "card-header bg-white fw-semibold", text: "Add Product" });
    const { card: formCard, body: formBody } = makeCard("Add Product");
    formCard.querySelector(".card-header").replaceWith(formTitle);
    rightCol.appendChild(formCard);

    const form     = make("form");
    const editIdIn = make("input", { type: "hidden", id: "edit-product-id" });
    const nameIn   = make("input", { type: "text",     id: "prod-name",  required: true });
    const descIn   = make("textarea", { id: "prod-desc", required: true, rows: "2", placeholder: "Short product description" });
    const priceIn  = make("input", { type: "number", id: "prod-price", required: true, step: "0.01", min: "0" });
    const qtyIn    = make("input", { type: "number", id: "prod-qty",   required: true, min: "0", value: "0" });

    categorySelect = make("select", { id: "prod-category", required: true });
    categorySelect.classList.add("form-select");
    const defaultOpt = make("option", { text: "Select a category" });
    defaultOpt.value = "";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    categorySelect.appendChild(defaultOpt);

    const categoryGroup = make("div", { class: "mb-3" });
    append(categoryGroup,
      make("label", { class: "form-label", for: "prod-category", text: "Category" }),
      categorySelect
    );

    const submitBtn = make("button", { id: "product-submit-btn", class: "btn btn-success", text: "Add Product" });
    submitBtn.type  = "submit";
    const cancelBtn = make("button", { id: "product-cancel-btn", class: "btn btn-outline-secondary", text: "Cancel", hidden: true });
    cancelBtn.type  = "button";

    const btnRow = make("div", { class: "d-flex gap-2" });
    append(btnRow, submitBtn, cancelBtn);
    append(form, editIdIn, formGroup("Name", nameIn), formGroup("Description", descIn), categoryGroup, formGroup("Price ($)", priceIn), formGroup("Stock Qty", qtyIn), btnRow);
    formBody.appendChild(form);

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
  }

  // ── Load categories ───────────────────────────────────────────────────────
  try {
    _allCategories = asArray(await apiGet("/categories"));
    _allCategories.forEach(c => {
      catFilter.appendChild(make("option", { text: c.name, value: String(c.id) }));
      if (categorySelect) {
        const opt = make("option", { text: c.name, value: String(c.id) });
        categorySelect.appendChild(opt);
      }
    });
  } catch {}

  loadProducts();

  function applyProdFilter() {
    const q    = searchInput.value.toLowerCase();
    const sort = sortSelect.value;
    const isAllCats = catFilter.selectedIndex === 0;
    const catId = isAllCats ? null : catFilter.value;

    let rows = _allProducts.filter(p => {
      const text = [p.id, p.name, p.category, p.price, p.quantity].join(" ").toLowerCase();
      const matchQ   = !q || text.includes(q);
      const matchCat = !catId || String(p.categoryId) === catId;
      return matchQ && matchCat;
    });

    if (sort === "name-asc")   rows = [...rows].sort((a,b) => (a.name||"").localeCompare(b.name||""));
    if (sort === "name-desc")  rows = [...rows].sort((a,b) => (b.name||"").localeCompare(a.name||""));
    if (sort === "price-asc")  rows = [...rows].sort((a,b) => a.price - b.price);
    if (sort === "price-desc") rows = [...rows].sort((a,b) => b.price - a.price);
    if (sort === "stock-asc")  rows = [...rows].sort((a,b) => a.quantity - b.quantity);
    if (sort === "stock-desc") rows = [...rows].sort((a,b) => b.quantity - a.quantity);

    const tbody = document.getElementById("products-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!rows.length) { emptyRow(tbody, 6, "No products match."); return; }
    rows.forEach(r => tbody.appendChild(buildProductRow(r)));
  }

  searchInput.addEventListener("input", applyProdFilter);
  catFilter.addEventListener("change", applyProdFilter);
  sortSelect.addEventListener("change", applyProdFilter);
});

function resetProductForm() {
  const form = document.querySelector("#products-body")?.closest(".row")?.querySelector("form");
  if (form) form.reset();
  const qtyIn = document.getElementById("prod-qty");
  if (qtyIn) qtyIn.value = "0";
  const sel = document.getElementById("prod-category");
  if (sel) sel.selectedIndex = 0;
  const editId = document.getElementById("edit-product-id");
  if (editId) editId.value = "";
  const title = document.getElementById("product-form-title");
  if (title) title.textContent = "Add Product";
  const submitBtn = document.getElementById("product-submit-btn");
  if (submitBtn) submitBtn.textContent = "Add Product";
  const cancelBtn = document.getElementById("product-cancel-btn");
  if (cancelBtn) cancelBtn.style.display = "none";
}

async function loadProducts() {
  const tbody = document.getElementById("products-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    _allProducts = asArray(await apiGet("/products"));
    if (!_allProducts.length) { emptyRow(tbody, 6, "No products yet."); return; }
    _allProducts.forEach(r => tbody.appendChild(buildProductRow(r)));
  } catch (err) {
    showError("Could not load products: " + err.message);
    emptyRow(tbody, 6, "Failed to load. Is the API running?");
  }
}

function buildProductRow(r) {
  const tr = make("tr");
  [String(r.id ?? ""), r.name ?? "", r.category ?? "", "$" + Number(r.price ?? 0).toFixed(2), String(r.quantity ?? "")].forEach(val => {
    tr.appendChild(make("td", { text: val }));
  });

  const td = make("td");

  if (isManager()) {
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
      const title = document.getElementById("product-form-title");
      if (title) title.textContent = "Edit Product";
      const submitBtn = document.getElementById("product-submit-btn");
      if (submitBtn) submitBtn.textContent = "Update Product";
      const cancelBtn = document.getElementById("product-cancel-btn");
      if (cancelBtn) cancelBtn.style.display = "";
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
  }

  tr.appendChild(td);
  return tr;
}
