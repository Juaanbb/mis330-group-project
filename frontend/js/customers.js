registerPage("customers", function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Customers" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ─────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const searchInput = make("input", { type: "text", class: "form-control form-control-sm w-auto", placeholder: "Search…" });
  const { card: tableCard, body: tableBody } = makeCard("All customers", searchInput);
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["ID", "Name", "Email", "Phone", "Actions"], "customers-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 5, "Loading…");

  // ── Right: form ──────────────────────────────────────────────────────────
  const rightCol = make("div", { class: "col-lg-5" });
  row.appendChild(rightCol);

  const formTitle = make("div", { class: "card-header bg-white fw-semibold", text: "Add customer" });
  const { card: formCard, body: formBody } = makeCard("Add customer");
  formCard.querySelector(".card-header").replaceWith(formTitle);
  rightCol.appendChild(formCard);

  const form      = make("form");
  const editIdIn  = make("input", { type: "hidden", id: "edit-customer-id" });
  const nameIn    = make("input", { type: "text",  id: "cust-name",  name: "name",  required: true });
  const emailIn   = make("input", { type: "email", id: "cust-email", name: "email", required: true });
  const phoneIn   = make("input", { type: "text",  id: "cust-phone", name: "phone" });
  const submitBtn = make("button", { class: "btn btn-success", text: "Add customer" });
  submitBtn.type = "submit";
  const cancelBtn = make("button", { class: "btn btn-outline-secondary", text: "Cancel", hidden: true });
  cancelBtn.type = "button";

  const btnRow = make("div", { class: "d-flex gap-2" });
  append(btnRow, submitBtn, cancelBtn);
  append(form, editIdIn, formGroup("Full name", nameIn), formGroup("Email", emailIn), formGroup("Phone", phoneIn), btnRow);
  formBody.appendChild(form);

  // ── Events ───────────────────────────────────────────────────────────────
  loadCustomers();

  searchInput.addEventListener("input", function() {
    const q = this.value.toLowerCase();
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    const editId = editIdIn.value;
    const body = { name: nameIn.value.trim(), email: emailIn.value.trim(), phone: phoneIn.value.trim() || null };
    try {
      hideError();
      editId ? await apiPut("/customers/" + editId, body) : await apiPost("/customers", body);
      resetCustomerForm(formTitle, submitBtn, cancelBtn, editIdIn, form);
      await loadCustomers();
    } catch (err) {
      showError((editId ? "Update" : "Add") + " customer failed: " + err.message);
    }
  });

  cancelBtn.addEventListener("click", () => resetCustomerForm(formTitle, submitBtn, cancelBtn, editIdIn, form));
});

function resetCustomerForm(title, submitBtn, cancelBtn, editIdIn, form) {
  form.reset();
  editIdIn.value = "";
  title.textContent = "Add customer";
  submitBtn.textContent = "Add customer";
  cancelBtn.style.display = "none";
}

async function loadCustomers() {
  const tbody = document.getElementById("customers-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const rows = asArray(await apiGet("/customers"));
    if (!rows.length) { emptyRow(tbody, 5, "No customers yet."); return; }
    rows.forEach(r => tbody.appendChild(buildCustomerRow(r)));
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

  const td      = make("td");
  const editBtn = make("button", { class: "btn btn-sm btn-outline-primary me-1", text: "Edit" });
  editBtn.type  = "button";
  editBtn.addEventListener("click", () => {
    const editIdIn  = document.getElementById("edit-customer-id");
    const nameIn    = document.getElementById("cust-name");
    const emailIn   = document.getElementById("cust-email");
    const phoneIn   = document.getElementById("cust-phone");
    const formTitle = document.querySelector("#customers-body").closest(".row").querySelector(".card-header");
    const submitBtn = document.querySelector("#form-customer .btn-success") || document.querySelector(".btn-success[type=submit]");
    const cancelBtn = document.querySelector(".btn-outline-secondary");

    editIdIn.value  = r.id;
    nameIn.value    = r.name ?? "";
    emailIn.value   = r.email ?? "";
    phoneIn.value   = r.phone ?? "";
    if (formTitle) formTitle.textContent = "Edit customer";
    if (submitBtn) submitBtn.textContent = "Update customer";
    if (cancelBtn) cancelBtn.style.display = "";
    nameIn.focus();
  });

  const delBtn = make("button", { class: "btn btn-sm btn-outline-danger", text: "Delete" });
  delBtn.type  = "button";
  delBtn.addEventListener("click", async () => {
    if (!confirm("Delete this customer?")) return;
    try { hideError(); await apiDelete("/customers/" + r.id); await loadCustomers(); }
    catch (err) { showError("Delete failed: " + err.message); }
  });

  append(td, editBtn, delBtn);
  tr.appendChild(td);
  return tr;
}
