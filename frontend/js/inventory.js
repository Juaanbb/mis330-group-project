let _allInventory = [];

registerPage("inventory", function(app) {
  _allInventory = [];
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Inventory" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: stock levels table ──────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const filterBar   = make("div", { class: "d-flex gap-2 mb-2 flex-wrap" });
  const searchInput = make("input", { type: "text", class: "form-control form-control-sm", placeholder: "Search…" });
  searchInput.style.width = "150px";

  const stockFilter = make("select", { class: "form-select form-select-sm w-auto" });
  [["", "All Items"], ["low", "Low Stock"], ["ok", "OK"]].forEach(([val, text]) => {
    const o = make("option", { text }); o.value = val; stockFilter.appendChild(o);
  });

  const sortSelect = make("select", { class: "form-select form-select-sm w-auto" });
  [
    ["name-asc",  "Name: A → Z"],
    ["name-desc", "Name: Z → A"],
    ["qty-asc",   "Qty: Low → High"],
    ["qty-desc",  "Qty: High → Low"],
  ].forEach(([val, text]) => { const o = make("option", { text }); o.value = val; sortSelect.appendChild(o); });

  append(filterBar, searchInput, stockFilter, sortSelect);
  leftCol.appendChild(filterBar);

  const { card: tableCard, body: tableBody } = makeCard("Stock Levels");
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["Product ID", "Name", "Qty on Hand", "Reorder At", "Status"], "inventory-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 5, "Loading…");

  // ── Right: restock form (managers only) ───────────────────────────────────
  if (isManager()) {
    const rightCol = make("div", { class: "col-lg-5" });
    row.appendChild(rightCol);

    const { card: formCard, body: formBody } = makeCard("Add Stock");
    rightCol.appendChild(formCard);

    const form      = make("form");
    const productIn = make("input", { type: "number", id: "restock-product", required: true, min: "1" });
    const qtyIn     = make("input", { type: "number", id: "restock-qty",     required: true, min: "1" });
    const notesIn   = make("input", { type: "text",   id: "restock-notes",   placeholder: "Optional note" });
    const submitBtn = make("button", { class: "btn btn-success", text: "Add Stock" });
    submitBtn.type  = "submit";

    append(form, formGroup("Product ID", productIn), formGroup("Quantity to Add", qtyIn), formGroup("Notes", notesIn), submitBtn);
    formBody.appendChild(form);

    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      try {
        hideError();
        const user = getCurrentUser();
        await apiPost("/inventory/restock", {
          productId:  parseInt(productIn.value, 10),
          employeeId: user?.id || 1,
          quantity:   parseInt(qtyIn.value, 10),
          notes:      notesIn.value.trim() || null,
        });
        form.reset();
        await loadInventory();
      } catch (err) {
        showError("Restock failed: " + err.message);
      }
    });
  }

  loadInventory();

  function applyInvFilter() {
    const q     = searchInput.value.toLowerCase();
    const stock = stockFilter.value;
    const sort  = sortSelect.value;

    let rows = _allInventory.filter(r => {
      const qty     = Number(r.quantity ?? r.quantityOnHand ?? 0);
      const reorder = Number(r.reorderLevel ?? r.reorderAt ?? 0);
      const isLow   = reorder > 0 && qty <= reorder;
      const matchQ  = !q || (r.name || "").toLowerCase().includes(q);
      const matchS  = !stock || (stock === "low" && isLow) || (stock === "ok" && !isLow);
      return matchQ && matchS;
    });

    if (sort === "name-asc")  rows = [...rows].sort((a,b) => (a.name||"").localeCompare(b.name||""));
    if (sort === "name-desc") rows = [...rows].sort((a,b) => (b.name||"").localeCompare(a.name||""));
    if (sort === "qty-asc")   rows = [...rows].sort((a,b) => Number(a.quantity ?? 0) - Number(b.quantity ?? 0));
    if (sort === "qty-desc")  rows = [...rows].sort((a,b) => Number(b.quantity ?? 0) - Number(a.quantity ?? 0));

    const tbody = document.getElementById("inventory-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!rows.length) { emptyRow(tbody, 5, "No items match."); return; }
    rows.forEach(r => tbody.appendChild(buildInventoryRow(r)));
  }

  searchInput.addEventListener("input", applyInvFilter);
  stockFilter.addEventListener("change", applyInvFilter);
  sortSelect.addEventListener("change", applyInvFilter);
});

async function loadInventory() {
  const tbody = document.getElementById("inventory-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    _allInventory = asArray(await apiGet("/inventory"));
    if (!_allInventory.length) { emptyRow(tbody, 5, "No inventory data."); return; }
    _allInventory.forEach(r => tbody.appendChild(buildInventoryRow(r)));
  } catch (err) {
    showError("Could not load inventory: " + err.message);
    emptyRow(tbody, 5, "Failed to load. Is the API running?");
  }
}

function buildInventoryRow(r) {
  const qty     = Number(r.quantity ?? r.quantityOnHand ?? 0);
  const reorder = Number(r.reorderLevel ?? r.reorderAt ?? 0);
  const isLow   = reorder > 0 && qty <= reorder;

  const tr = make("tr");
  if (isLow) tr.className = "table-warning";

  [String(r.productId ?? r.id ?? ""), r.name ?? "", String(qty), String(reorder)].forEach(val => {
    tr.appendChild(make("td", { text: val }));
  });

  const badgeTd = make("td");
  const badge   = make("span", { text: isLow ? "Low Stock" : "OK" });
  badge.className = isLow ? "badge bg-danger" : "badge bg-success";
  badgeTd.appendChild(badge);
  tr.appendChild(badgeTd);

  return tr;
}
