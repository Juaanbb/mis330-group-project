let _allOrders = [];

registerPage("orders", function(app) {
  _allOrders = [];
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Orders" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ──────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const filterBar    = make("div", { class: "d-flex gap-2 mb-2 flex-wrap" });
  const searchInput  = make("input", { type: "text", class: "form-control form-control-sm", placeholder: "Search…" });
  searchInput.style.width = "160px";

  const statusFilter = make("select", { class: "form-select form-select-sm w-auto" });
  [["", "All Statuses"], ["Pending","Pending"], ["Shipped","Shipped"], ["Completed","Completed"], ["Cancelled","Cancelled"]]
    .forEach(([val, text]) => { const o = make("option", { text }); o.value = val; statusFilter.appendChild(o); });

  const sortSelect = make("select", { class: "form-select form-select-sm w-auto" });
  [
    ["id-asc",    "Order ID ↑"],
    ["id-desc",   "Order ID ↓"],
    ["date-desc", "Date: Newest"],
    ["date-asc",  "Date: Oldest"],
    ["total-desc","Total: High → Low"],
    ["total-asc", "Total: Low → High"],
  ].forEach(([val, text]) => { const o = make("option", { text }); o.value = val; sortSelect.appendChild(o); });

  append(filterBar, searchInput, statusFilter, sortSelect);
  leftCol.appendChild(filterBar);

  const { card: tableCard, body: tableBody } = makeCard("All Orders");
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["Order ID", "Customer ID", "Employee ID", "Date", "Status", "Total", "Actions"], "orders-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 7, "Loading…");

  // ── Right: create / edit form (managers only) ─────────────────────────────
  if (isManager()) {
    const rightCol = make("div", { class: "col-lg-5" });
    row.appendChild(rightCol);

    const formTitle = make("div", { class: "card-header bg-white fw-semibold", text: "Create Order", id: "order-form-title" });
    const { card: formCard, body: formBody } = makeCard("Create Order");
    formCard.querySelector(".card-header").replaceWith(formTitle);
    rightCol.appendChild(formCard);

    const form       = make("form");
    const editIdIn   = make("input", { type: "hidden", id: "edit-order-id" });
    const customerIn = make("input", { type: "number", id: "order-customer",     required: true, min: "1" });
    const employeeIn = make("input", { type: "number", id: "order-employee-edit", min: "1", placeholder: "Leave blank for unassigned" });
    const addressIn  = make("input", { type: "text",   id: "order-address",  required: true, placeholder: "123 Main St" });
    const cityIn     = make("input", { type: "text",   id: "order-city",     required: true });
    const stateIn    = make("input", { type: "text",   id: "order-state",    required: true, placeholder: "TX" });
    const zipcodeIn  = make("input", { type: "text",   id: "order-zipcode",  required: true, placeholder: "78701" });

    const statusSelect = make("select", { id: "order-status-edit", class: "form-select" });
    ["Pending", "Shipped", "Completed", "Cancelled"].forEach(s =>
      statusSelect.appendChild(make("option", { text: s, value: s }))
    );
    const statusGroup = make("div", { class: "mb-3", id: "order-status-group", hidden: true });
    append(statusGroup,
      make("label", { class: "form-label", for: "order-status-edit", text: "Status" }),
      statusSelect
    );

    const submitBtn = make("button", { class: "btn btn-success", text: "Create Order", id: "order-submit-btn" });
    submitBtn.type  = "submit";
    const cancelBtn = make("button", { class: "btn btn-outline-secondary", text: "Cancel", hidden: true, id: "order-cancel-btn" });
    cancelBtn.type  = "button";

    const btnRow = make("div", { class: "d-flex gap-2" });
    append(btnRow, submitBtn, cancelBtn);
    append(form, editIdIn,
      formGroup("Customer ID", customerIn),
      formGroup("Employee ID", employeeIn),
      statusGroup,
      formGroup("Shipping Address", addressIn),
      formGroup("City", cityIn),
      formGroup("State", stateIn),
      formGroup("ZIP Code", zipcodeIn),
      btnRow
    );
    formBody.appendChild(form);

    cancelBtn.addEventListener("click", resetOrderForm);

    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      const editId = editIdIn.value;
      try {
        hideError();
        const user = getCurrentUser();
        if (editId) {
          await apiPut("/orders/" + editId, {
            customerId:  parseInt(customerIn.value, 10),
            employeeId:  employeeIn.value ? parseInt(employeeIn.value, 10) : null,
            orderStatus: statusSelect.value,
            address:     addressIn.value.trim(),
            city:        cityIn.value.trim(),
            state:       stateIn.value.trim(),
            zipcode:     zipcodeIn.value.trim(),
          });
        } else {
          await apiPost("/orders", {
            customerId: parseInt(customerIn.value, 10),
            employeeId: employeeIn.value ? parseInt(employeeIn.value, 10) : (user?.id || null),
            address:    addressIn.value.trim(),
            city:       cityIn.value.trim(),
            state:      stateIn.value.trim(),
            zipcode:    zipcodeIn.value.trim(),
            items:      []
          });
        }
        resetOrderForm();
        await loadOrders();
      } catch (err) {
        showError((editId ? "Update" : "Create") + " order failed: " + err.message);
      }
    });
  }

  loadOrders();

  function applyOrderFilter() {
    const q      = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const sort   = sortSelect.value;

    let rows = _allOrders.filter(r => {
      const text = [r.id, r.customerId, r.employeeId, r.orderDate, r.orderStatus, r.totalAmount].join(" ").toLowerCase();
      const matchQ = !q || text.includes(q);
      const matchS = !status || r.orderStatus === status;
      return matchQ && matchS;
    });

    if (sort === "id-asc")    rows = [...rows].sort((a,b) => a.id - b.id);
    if (sort === "id-desc")   rows = [...rows].sort((a,b) => b.id - a.id);
    if (sort === "date-desc") rows = [...rows].sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate));
    if (sort === "date-asc")  rows = [...rows].sort((a,b) => new Date(a.orderDate) - new Date(b.orderDate));
    if (sort === "total-desc") rows = [...rows].sort((a,b) => b.totalAmount - a.totalAmount);
    if (sort === "total-asc")  rows = [...rows].sort((a,b) => a.totalAmount - b.totalAmount);

    const tbody = document.getElementById("orders-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!rows.length) { emptyRow(tbody, 7, "No orders match."); return; }
    rows.forEach(r => tbody.appendChild(buildOrderRow(r)));
  }

  searchInput.addEventListener("input", applyOrderFilter);
  statusFilter.addEventListener("change", applyOrderFilter);
  sortSelect.addEventListener("change", applyOrderFilter);
});

function resetOrderForm() {
  const form = document.querySelector("#orders-body")?.closest(".row")?.querySelector("form");
  if (form) form.reset();
  const editIdIn = document.getElementById("edit-order-id");
  if (editIdIn) editIdIn.value = "";
  const title = document.getElementById("order-form-title");
  if (title) title.textContent = "Create Order";
  const submitBtn = document.getElementById("order-submit-btn");
  if (submitBtn) submitBtn.textContent = "Create Order";
  const cancelBtn = document.getElementById("order-cancel-btn");
  if (cancelBtn) cancelBtn.style.display = "none";
  const statusGroup = document.getElementById("order-status-group");
  if (statusGroup) statusGroup.style.display = "none";
}

async function loadOrders() {
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    _allOrders = asArray(await apiGet("/orders"));
    if (!_allOrders.length) { emptyRow(tbody, 7, "No orders yet."); return; }
    _allOrders.forEach(r => tbody.appendChild(buildOrderRow(r)));
  } catch (err) {
    showError("Could not load orders: " + err.message);
    emptyRow(tbody, 7, "Failed to load. Is the API running?");
  }
}

function buildOrderRow(r) {
  const tr = make("tr");
  [String(r.id ?? ""), String(r.customerId ?? ""), String(r.employeeId ?? "—"), r.orderDate ?? "", r.orderStatus ?? "", "$" + Number(r.totalAmount ?? 0).toFixed(2)].forEach(val => {
    tr.appendChild(make("td", { text: val }));
  });

  const td = make("td");

  if (isManager()) {
    const editBtn = make("button", { class: "btn btn-sm btn-outline-primary me-1", text: "Edit" });
    editBtn.type  = "button";
    editBtn.addEventListener("click", async () => {
      try {
        const order = await apiGet("/orders/" + r.id);
        document.getElementById("edit-order-id").value        = order.id;
        document.getElementById("order-customer").value       = order.customerId ?? "";
        document.getElementById("order-employee-edit").value  = order.employeeId ?? "";
        document.getElementById("order-address").value        = order.address ?? "";
        document.getElementById("order-city").value           = order.city ?? "";
        document.getElementById("order-state").value          = order.state ?? "";
        document.getElementById("order-zipcode").value        = order.zipcode ?? "";
        const statusSelect = document.getElementById("order-status-edit");
        if (statusSelect) statusSelect.value = order.orderStatus ?? "Pending";
        const statusGroup = document.getElementById("order-status-group");
        if (statusGroup) statusGroup.style.display = "";
        const title = document.getElementById("order-form-title");
        if (title) title.textContent = "Edit Order #" + order.id;
        const submitBtn = document.getElementById("order-submit-btn");
        if (submitBtn) submitBtn.textContent = "Update Order";
        const cancelBtn = document.getElementById("order-cancel-btn");
        if (cancelBtn) cancelBtn.style.display = "";
        document.getElementById("order-customer").focus();
      } catch (err) {
        showError("Could not load order: " + err.message);
      }
    });
    td.appendChild(editBtn);

    const delBtn = make("button", { class: "btn btn-sm btn-outline-danger", text: "Delete" });
    delBtn.type  = "button";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this order?")) return;
      try { hideError(); await apiDelete("/orders/" + r.id); await loadOrders(); }
      catch (err) { showError("Delete failed: " + err.message); }
    });
    td.appendChild(delBtn);
  } else {
    const select = make("select", { class: "form-select form-select-sm d-inline-block w-auto" });
    ["Pending", "Shipped", "Completed", "Cancelled"].forEach(s => {
      const opt = make("option", { text: s, value: s });
      if (s === (r.orderStatus ?? "Pending")) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", async () => {
      try { hideError(); await apiPut("/orders/" + r.id, { orderStatus: select.value }); await loadOrders(); }
      catch (err) { showError("Update failed: " + err.message); }
    });
    td.appendChild(select);
  }

  tr.appendChild(td);
  return tr;
}
