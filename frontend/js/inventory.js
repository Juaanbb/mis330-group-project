registerPage("inventory", function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Inventory" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: stock levels table ──────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const { card: tableCard, body: tableBody } = makeCard("Stock levels");
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["Product ID", "Name", "Qty on hand", "Reorder at", "Status"], "inventory-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 5, "Loading…");

  // ── Right: restock form ───────────────────────────────────────────────────
  const rightCol = make("div", { class: "col-lg-5" });
  row.appendChild(rightCol);

  const { card: formCard, body: formBody } = makeCard("Add stock");
  rightCol.appendChild(formCard);

  const form      = make("form");
  const productIn = make("input", { type: "number", id: "restock-product", name: "productId", required: true, min: "1" });
  const qtyIn     = make("input", { type: "number", id: "restock-qty",     name: "quantity",  required: true, min: "1" });
  const notesIn   = make("input", { type: "text",   id: "restock-notes",   name: "notes",     placeholder: "Optional note" });
  const submitBtn = make("button", { class: "btn btn-success", text: "Add stock" });
  submitBtn.type  = "submit";

  append(form, formGroup("Product ID", productIn), formGroup("Quantity to add", qtyIn), formGroup("Notes", notesIn), submitBtn);
  formBody.appendChild(form);

  // ── Events ───────────────────────────────────────────────────────────────
  loadInventory();

  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    try {
      hideError();
      await apiPost("/inventory/restock", {
        productId: parseInt(productIn.value, 10),
        quantity:  parseInt(qtyIn.value, 10),
        notes:     notesIn.value.trim() || null,
      });
      form.reset();
      await loadInventory();
    } catch (err) {
      showError("Restock failed: " + err.message);
    }
  });
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
  const badge    = make("span", { text: isLow ? "Low stock" : "OK" });
  badge.className = isLow ? "badge bg-danger" : "badge bg-success";
  badgeTd.appendChild(badge);
  tr.appendChild(badgeTd);

  return tr;
}
