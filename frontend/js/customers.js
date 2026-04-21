let _allCustomers = [];

registerPage("customers", function(app) {
  _allCustomers = [];
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Customers" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ──────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const filterBar   = make("div", { class: "d-flex gap-2 mb-2 flex-wrap" });
  const searchInput = make("input", { type: "text", class: "form-control form-control-sm", placeholder: "Search…" });
  searchInput.style.width = "180px";

  const sortSelect = make("select", { class: "form-select form-select-sm w-auto" });
  [
    ["id-asc",   "ID ↑"],
    ["id-desc",  "ID ↓"],
    ["name-asc", "Name: A → Z"],
    ["name-desc","Name: Z → A"],
  ].forEach(([val, text]) => { const o = make("option", { text }); o.value = val; sortSelect.appendChild(o); });

  append(filterBar, searchInput, sortSelect);
  leftCol.appendChild(filterBar);

  const { card: tableCard, body: tableBody } = makeCard("All Customers");
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["ID", "Name", "Email", "Phone", "Actions"], "customers-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 5, "Loading…");

  // ── Right: form (managers only) ──────────────────────────────────────────
  if (isManager()) {
    const rightCol = make("div", { class: "col-lg-5" });
    row.appendChild(rightCol);

    const formTitle = make("div", { class: "card-header bg-white fw-semibold", text: "Add Customer", id: "cust-form-title" });
    const { card: formCard, body: formBody } = makeCard("Add Customer");
    formCard.querySelector(".card-header").replaceWith(formTitle);
    rightCol.appendChild(formCard);

    const form      = make("form");
    const editIdIn  = make("input", { type: "hidden", id: "edit-customer-id" });
    const nameIn    = make("input", { type: "text",  id: "cust-name",  required: true });
    const emailIn   = make("input", { type: "email", id: "cust-email", required: true });
    const phoneIn   = make("input", { type: "text",  id: "cust-phone" });
    const submitBtn = make("button", { class: "btn btn-success", text: "Add Customer", id: "cust-submit-btn" });
    submitBtn.type = "submit";
    const cancelBtn = make("button", { class: "btn btn-outline-secondary", text: "Cancel", hidden: true, id: "cust-cancel-btn" });
    cancelBtn.type = "button";

    const btnRow = make("div", { class: "d-flex gap-2" });
    append(btnRow, submitBtn, cancelBtn);
    append(form, editIdIn, formGroup("Full Name", nameIn), formGroup("Email", emailIn), formGroup("Phone", phoneIn), btnRow);
    formBody.appendChild(form);

    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      const editId = editIdIn.value;
      const body = { name: nameIn.value.trim(), email: emailIn.value.trim(), phone: phoneIn.value.trim() || null };
      try {
        hideError();
        editId ? await apiPut("/customers/" + editId, body) : await apiPost("/customers", body);
        resetCustForm();
        await loadCustomers();
      } catch (err) {
        showError((editId ? "Update" : "Add") + " customer failed: " + err.message);
      }
    });

    cancelBtn.addEventListener("click", resetCustForm);
  }

  loadCustomers();

  function applyCustFilter() {
    const q    = searchInput.value.toLowerCase();
    const sort = sortSelect.value;

    let rows = _allCustomers.filter(r => {
      const text = [r.id, r.name, r.email, r.phone].join(" ").toLowerCase();
      return !q || text.includes(q);
    });

    if (sort === "id-asc")   rows = [...rows].sort((a,b) => a.id - b.id);
    if (sort === "id-desc")  rows = [...rows].sort((a,b) => b.id - a.id);
    if (sort === "name-asc") rows = [...rows].sort((a,b) => (a.name||"").localeCompare(b.name||""));
    if (sort === "name-desc") rows = [...rows].sort((a,b) => (b.name||"").localeCompare(a.name||""));

    const tbody = document.getElementById("customers-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!rows.length) { emptyRow(tbody, 5, "No customers match."); return; }
    rows.forEach(r => tbody.appendChild(buildCustomerRow(r)));
  }

  searchInput.addEventListener("input", applyCustFilter);
  sortSelect.addEventListener("change", applyCustFilter);
});

function resetCustForm() {
  const form = document.querySelector("#customers-body")?.closest(".row")?.querySelector("form");
  if (form) form.reset();
  const editIdIn = document.getElementById("edit-customer-id");
  if (editIdIn) editIdIn.value = "";
  const title = document.getElementById("cust-form-title");
  if (title) title.textContent = "Add Customer";
  const submitBtn = document.getElementById("cust-submit-btn");
  if (submitBtn) submitBtn.textContent = "Add Customer";
  const cancelBtn = document.getElementById("cust-cancel-btn");
  if (cancelBtn) cancelBtn.style.display = "none";
}

async function loadCustomers() {
  const tbody = document.getElementById("customers-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    _allCustomers = asArray(await apiGet("/customers"));
    if (!_allCustomers.length) { emptyRow(tbody, 5, "No customers yet."); return; }
    _allCustomers.forEach(r => tbody.appendChild(buildCustomerRow(r)));
  } catch (err) {
    showError("Could not load customers: " + err.message);
    emptyRow(tbody, 5, "Failed to load. Is the API running?");
  }
}

function buildCustomerRow(r) {
  const tr = make("tr");
  [String(r.id ?? ""), r.name ?? "", r.email ?? "", r.phone ?? ""].forEach(val => {
    tr.appendChild(make("td", { text: val }));
  });

  const td = make("td");

  if (isManager()) {
    const editBtn = make("button", { class: "btn btn-sm btn-outline-primary me-1", text: "Edit" });
    editBtn.type  = "button";
    editBtn.addEventListener("click", () => {
      document.getElementById("edit-customer-id").value = r.id;
      document.getElementById("cust-name").value  = r.name ?? "";
      document.getElementById("cust-email").value = r.email ?? "";
      document.getElementById("cust-phone").value = r.phone ?? "";
      const title = document.getElementById("cust-form-title");
      if (title) title.textContent = "Edit Customer";
      const submitBtn = document.getElementById("cust-submit-btn");
      if (submitBtn) submitBtn.textContent = "Update Customer";
      const cancelBtn = document.getElementById("cust-cancel-btn");
      if (cancelBtn) cancelBtn.style.display = "";
      document.getElementById("cust-name").focus();
    });

    const delBtn = make("button", { class: "btn btn-sm btn-outline-danger", text: "Delete" });
    delBtn.type  = "button";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this customer?")) return;
      try { hideError(); await apiDelete("/customers/" + r.id); await loadCustomers(); }
      catch (err) { showError("Delete failed: " + err.message); }
    });

    append(td, editBtn, delBtn);
  }

  tr.appendChild(td);
  return tr;
}
