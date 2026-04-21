registerPage("orders", function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Orders" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ──────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  // Filter row
  const filterBar = make("div", { class: "d-flex gap-2 mb-2 align-items-center" });
  const searchInput  = make("input", { type: "text", class: "form-control form-control-sm", placeholder: "Search…" });
  const statusFilter = make("select", { class: "form-select form-select-sm w-auto" });
  [["", "All Statuses"], ["Pending","Pending"], ["Shipped","Shipped"], ["Completed","Completed"], ["Cancelled","Cancelled"]]
    .forEach(([val, text]) => {
      const opt = make("option", { text, value: val });
      if (!val) opt.selected = true;
      statusFilter.appendChild(opt);
    });
  append(filterBar, searchInput, statusFilter);
  leftCol.appendChild(filterBar);

  const { card: tableCard, body: tableBody } = makeCard("All Orders");
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["ID", "Customer", "Date", "Status", "Total", "Actions"], "orders-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 6, "Loading…");

  // ── Right: create order form (managers only) ──────────────────────────────
  if (isManager()) {
    const rightCol = make("div", { class: "col-lg-5" });
    row.appendChild(rightCol);

    const { card: formCard, body: formBody } = makeCard("Create Order");
    rightCol.appendChild(formCard);

    const form       = make("form");
    const customerIn = make("input", { type: "number", id: "order-customer", required: true, min: "1" });
    const addressIn  = make("input", { type: "text",   id: "order-address",  required: true, placeholder: "123 Main St" });
    const cityIn     = make("input", { type: "text",   id: "order-city",     required: true });
    const stateIn    = make("input", { type: "text",   id: "order-state",    required: true, placeholder: "TX" });
    const zipcodeIn  = make("input", { type: "text",   id: "order-zipcode",  required: true, placeholder: "78701" });
    const submitBtn  = make("button", { class: "btn btn-success", text: "Create Order" });
    submitBtn.type   = "submit";

    append(form,
      formGroup("Customer ID", customerIn),
      formGroup("Shipping Address", addressIn),
      formGroup("City", cityIn),
      formGroup("State", stateIn),
      formGroup("ZIP Code", zipcodeIn),
      submitBtn
    );
    formBody.appendChild(form);

    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      try {
        hideError();
        const user = getCurrentUser();
        await apiPost("/orders", {
          customerId: parseInt(customerIn.value, 10),
          employeeId: user?.id || null,
          address:    addressIn.value.trim(),
          city:       cityIn.value.trim(),
          state:      stateIn.value.trim(),
          zipcode:    zipcodeIn.value.trim(),
          items:      []
        });
        form.reset();
        await loadOrders();
      } catch (err) {
        showError("Create order failed: " + err.message);
      }
    });
  }

  // ── Events ───────────────────────────────────────────────────────────────
  loadOrders();

  function applyOrderFilter() {
    const q      = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    tbody.querySelectorAll("tr").forEach(tr => {
      const matchQ = !q || tr.textContent.toLowerCase().includes(q);
      const matchS = !status || (tr.cells[3] && tr.cells[3].textContent === status);
      tr.style.display = (matchQ && matchS) ? "" : "none";
    });
  }

  searchInput.addEventListener("input", applyOrderFilter);
  statusFilter.addEventListener("change", applyOrderFilter);
});

async function loadOrders() {
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const rows = asArray(await apiGet("/orders"));
    if (!rows.length) { emptyRow(tbody, 6, "No orders yet."); return; }
    rows.forEach(r => tbody.appendChild(buildOrderRow(r)));
  } catch (err) {
    showError("Could not load orders: " + err.message);
    emptyRow(tbody, 6, "Failed to load. Is the API running?");
  }
}

function buildOrderRow(r) {
  const tr = make("tr");
  [String(r.id ?? ""), String(r.customerId ?? ""), r.orderDate ?? "", r.orderStatus ?? "", "$" + Number(r.totalAmount ?? 0).toFixed(2)].forEach(val => {
    tr.appendChild(make("td", { text: val }));
  });

  const td = make("td");

  // Status dropdown — all employees can update status
  const select = make("select", { class: "form-select form-select-sm d-inline-block w-auto me-1" });
  ["Pending", "Shipped", "Completed", "Cancelled"].forEach(s => {
    const opt = make("option", { text: s, value: s });
    if (s === (r.orderStatus ?? "Pending")) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", async () => {
    try {
      hideError();
      await apiPut("/orders/" + r.id, { orderStatus: select.value });
      await loadOrders();
    } catch (err) { showError("Update failed: " + err.message); }
  });
  td.appendChild(select);

  if (isManager()) {
    const delBtn = make("button", { class: "btn btn-sm btn-outline-danger", text: "Delete" });
    delBtn.type  = "button";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this order?")) return;
      try { hideError(); await apiDelete("/orders/" + r.id); await loadOrders(); }
      catch (err) { showError("Delete failed: " + err.message); }
    });
    td.appendChild(delBtn);
  }

  tr.appendChild(td);
  return tr;
}
