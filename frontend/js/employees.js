registerPage("employees", function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Employees" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ──────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const searchInput = make("input", { type: "text", class: "form-control form-control-sm w-auto", placeholder: "Search…" });
  const { card: tableCard, body: tableBody } = makeCard("All employees", searchInput);
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["ID", "Name", "Email", "Role", "Active", "Actions"], "employees-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 6, "Loading…");

  // ── Right: form ──────────────────────────────────────────────────────────
  const rightCol = make("div", { class: "col-lg-5" });
  row.appendChild(rightCol);

  const formTitle = make("div", { class: "card-header bg-white fw-semibold", text: "Add employee" });
  const { card: formCard, body: formBody } = makeCard("Add employee");
  formCard.querySelector(".card-header").replaceWith(formTitle);
  rightCol.appendChild(formCard);

  const form     = make("form");
  const editIdIn = make("input", { type: "hidden", id: "edit-employee-id" });
  const nameIn   = make("input", { type: "text",  id: "emp-name",  name: "name",  required: true });
  const emailIn  = make("input", { type: "email", id: "emp-email", name: "email", required: true });
  const phoneIn  = make("input", { type: "text",  id: "emp-phone", name: "phone", required: true });
  const roleIn   = make("input", { type: "text",  id: "emp-role",  name: "role",  required: true, placeholder: "Manager, Clerk, Stock…" });

  const submitBtn = make("button", { class: "btn btn-success", text: "Add employee" });
  submitBtn.type  = "submit";
  const cancelBtn = make("button", { class: "btn btn-outline-secondary", text: "Cancel", hidden: true });
  cancelBtn.type  = "button";

  const btnRow = make("div", { class: "d-flex gap-2" });
  append(btnRow, submitBtn, cancelBtn);
  append(form, editIdIn, formGroup("Full name", nameIn), formGroup("Email", emailIn), formGroup("Phone", phoneIn), formGroup("Role", roleIn), btnRow);
  formBody.appendChild(form);

  // ── Events ───────────────────────────────────────────────────────────────
  loadEmployees();

  searchInput.addEventListener("input", function() {
    const q = this.value.toLowerCase();
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    const editId = editIdIn.value;
    const body = { name: nameIn.value.trim(), email: emailIn.value.trim(), phone: phoneIn.value.trim() || null, role: roleIn.value.trim() };
    try {
      hideError();
      editId ? await apiPut("/employees/" + editId, body) : await apiPost("/employees", body);
      form.reset();
      editIdIn.value = "";
      formTitle.textContent = "Add employee";
      submitBtn.textContent = "Add employee";
      cancelBtn.style.display = "none";
      await loadEmployees();
    } catch (err) {
      showError((editId ? "Update" : "Add") + " employee failed: " + err.message);
    }
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    editIdIn.value = "";
    formTitle.textContent = "Add employee";
    submitBtn.textContent = "Add employee";
    cancelBtn.style.display = "none";
  });
});

async function loadEmployees() {
  const tbody = document.getElementById("employees-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const rows = asArray(await apiGet("/employees"));
    if (!rows.length) { emptyRow(tbody, 6, "No employees yet."); return; }
    rows.forEach(r => tbody.appendChild(buildEmployeeRow(r)));
  } catch (err) {
    showError("Could not load employees: " + err.message);
    emptyRow(tbody, 6, "Failed to load. Is the API running?");
  }
}

function buildEmployeeRow(r) {
  const tr = make("tr");
  [String(r.id ?? ""), r.name ?? "", r.email ?? "", r.role ?? "", r.isActive ? "Yes" : "No"].forEach(val => {
    tr.appendChild(make("td", { text: val }));
  });

  const td     = make("td");
  const editBtn = make("button", { class: "btn btn-sm btn-outline-primary me-1", text: "Edit" });
  editBtn.type  = "button";
  editBtn.addEventListener("click", () => {
    document.getElementById("edit-employee-id").value = r.id;
    document.getElementById("emp-name").value  = r.name ?? "";
    document.getElementById("emp-email").value = r.email ?? "";
    document.getElementById("emp-phone").value = r.phone ?? "";
    document.getElementById("emp-role").value  = r.role ?? "";
    const formTitle = document.querySelectorAll(".card-header.bg-white")[1];
    if (formTitle) formTitle.textContent = "Edit employee";
    const submitBtn = document.querySelector("button[type=submit].btn-success");
    if (submitBtn) submitBtn.textContent = "Update employee";
    const cancelBtn = document.querySelector(".btn-outline-secondary");
    if (cancelBtn) cancelBtn.style.display = "";
    document.getElementById("emp-name").focus();
  });

  const delBtn = make("button", { class: "btn btn-sm btn-outline-danger", text: "Deactivate" });
  delBtn.type  = "button";
  delBtn.addEventListener("click", async () => {
    if (!confirm("Deactivate this employee?")) return;
    try { hideError(); await apiDelete("/employees/" + r.id); await loadEmployees(); }
    catch (err) { showError("Deactivate failed: " + err.message); }
  });

  append(td, editBtn, delBtn);
  tr.appendChild(td);
  return tr;
}
