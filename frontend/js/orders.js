registerPage("orders", function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Orders" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ──────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const searchInput = make("input", { type: "text", class: "form-control form-control-sm w-auto", placeholder: "Search…" });
  const { card: tableCard, body: tableBody } = makeCard("All orders", searchInput);
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["ID", "Customer ID", "Date", "Status", "Total", "Actions"], "orders-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 6, "Loading…");

  // ── Right: create order form ──────────────────────────────────────────────
  const rightCol = make("div", { class: "col-lg-5" });
  row.appendChild(rightCol);

  const { card: formCard, body: formBody } = makeCard("Create order");
  rightCol.appendChild(formCard);

  const form        = make("form");
  const customerIn  = make("input", { type: "number", id: "order-customer",  name: "customerId",  required: true, min: "1" });
  const employeeIn  = make("input", { type: "number", id: "order-employee",  name: "employeeId",  required: true, min: "1" });
  const addressIn   = make("input", { type: "text",   id: "order-address",   name: "address",     required: true, placeholder: "123 Main St" });
  const cityIn      = make("input", { type: "text",   id: "order-city",      name: "city",        required: true });
  const stateIn     = make("input", { type: "text",   id: "order-state",     name: "state",       required: true, placeholder: "TX" });
  const zipcodeIn   = make("input", { type: "text",   id: "order-zipcode",   name: "zipcode",     required: true, placeholder: "78701" });
  const submitBtn   = make("button", { class: "btn btn-success", text: "Place order" });
  submitBtn.type    = "submit";

  append(form,
    formGroup("Customer ID", customerIn),
    formGroup("Employee ID", employeeIn),
    formGroup("Shipping address", addressIn),
    formGroup("City", cityIn),
    formGroup("State", stateIn),
    formGroup("ZIP code", zipcodeIn),
    submitBtn
  );
  formBody.appendChild(form);

  // ── Events ───────────────────────────────────────────────────────────────
  loadOrders();

  searchInput.addEventListener("input", function() {
    const q = this.value.toLowerCase();
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    try {
      hideError();
      await apiPost("/orders", {
        customerId:  parseInt(customerIn.value, 10),
        employeeId:  parseInt(employeeIn.value, 10),
        address:     addressIn.value.trim(),
        city:        cityIn.value.trim(),
        state:       stateIn.value.trim(),
        zipcode:     zipcodeIn.value.trim(),
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
  [String(r.id ?? ""), String(r.customerId ?? ""), r.orderDate ?? "", r.orderStatus ?? "", "$" + (r.totalAmount ?? "0.00")].forEach(val => {
    tr.appendChild(make("td", { text: val }));
  });

  const td = make("td");

  // Status dropdown for quick update
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

  const delBtn = make("button", { class: "btn btn-sm btn-outline-danger", text: "Delete" });
  delBtn.type  = "button";
  delBtn.addEventListener("click", async () => {
    if (!confirm("Delete this order?")) return;
    try { hideError(); await apiDelete("/orders/" + r.id); await loadOrders(); }
    catch (err) { showError("Delete failed: " + err.message); }
  });

  append(td, select, delBtn);
  tr.appendChild(td);
  return tr;
}
