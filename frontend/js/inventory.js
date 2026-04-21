registerPage("inventory", function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Inventory" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: stock levels table ──────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const filterBar = make("div", { class: "d-flex gap-2 mb-2 align-items-center" });
  const searchInput  = make("input", { type: "text", class: "form-control form-control-sm", placeholder: "Search…" });
  const statusFilter = make("select", { class: "form-select form-select-sm w-auto" });
  [["", "All Items"], ["low", "Low Stock"], ["ok", "OK"]]
    .forEach(([val, text]) => {
      const opt = make("option", { text, value: val });
      if (!val) opt.selected = true;
      statusFilter.appendChild(opt);
    });
  append(filterBar, searchInput, statusFilter);
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

    const form       = make("form");
    const productIn  = make("input", { type: "number", id: "restock-product",  required: true, min: "1" });
    const qtyIn      = make("input", { type: "number", id: "restock-qty",      required: true, min: "1" });
    const notesIn    = make("input", { type: "text",   id: "restock-notes",    placeholder: "Optional note" });
    const submitBtn  = make("button", { class: "btn btn-success", text: "Add Stock" });
    submitBtn.type   = "submit";

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

  // ── Events ───────────────────────────────────────────────────────────────
  loadInventory();

  function applyInvFilter() {
    const q      = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    tbody.querySelectorAll("tr").forEach(tr => {
      const matchQ = !q || tr.textContent.toLowerCase().includes(q);
      const isLow  = tr.className.includes("table-warning");
      const matchS = !status || (status === "low" && isLow) || (status === "ok" && !isLow);
      tr.style.display = (matchQ && matchS) ? "" : "none";
    });
  }

  searchInput.addEventListener("input", applyInvFilter);
  statusFilter.addEventListener("change", applyInvFilter);
});

async function loadInventory() {
  const tbody = document.getElementById("inventory-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const rows = asArray(await apiGet("/inventory"));
    if (!rows.length) { emptyRow(tbody, 5, "No inventory data."); return; }
    rows.forEach(r => tbody.appendChild(buildInventoryRow(r)));
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

  const badgeTd  = make("td");
  const badge    = make("span", { text: isLow ? "Low Stock" : "OK" });
  badge.className = isLow ? "badge bg-danger" : "badge bg-success";
  badgeTd.appendChild(badge);
  tr.appendChild(badgeTd);

  return tr;
}
