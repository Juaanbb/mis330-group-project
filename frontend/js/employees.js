const EMPLOYEE_ROLES = ["Manager", "Sales Associate", "Stock Associate", "Cashier", "Gardening Specialist"];

registerPage("employees", function(app) {
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Employees" }));

  const row = make("div", { class: "row g-4" });
  app.appendChild(row);

  // ── Left: table ──────────────────────────────────────────────────────────
  const leftCol = make("div", { class: "col-lg-7" });
  row.appendChild(leftCol);

  const searchInput = make("input", { type: "text", class: "form-control form-control-sm w-auto", placeholder: "Search…" });
  const { card: tableCard, body: tableBody } = makeCard("All Employees", searchInput);
  tableBody.className = "card-body p-0";
  leftCol.appendChild(tableCard);

  const { wrapper, tbody } = makeTable(["ID", "Name", "Email", "Role", "Active", "Actions"], "employees-body");
  tableBody.appendChild(wrapper);
  emptyRow(tbody, 6, "Loading…");

  // ── Right: form (managers only) ──────────────────────────────────────────
  if (isManager()) {
    const rightCol = make("div", { class: "col-lg-5" });
    row.appendChild(rightCol);

    const formTitle = make("div", { class: "card-header bg-white fw-semibold", text: "Add Employee", id: "emp-form-title" });
    const { card: formCard, body: formBody } = makeCard("Add Employee");
    formCard.querySelector(".card-header").replaceWith(formTitle);
    rightCol.appendChild(formCard);

    const form     = make("form");
    const editIdIn = make("input", { type: "hidden", id: "edit-employee-id" });
    const nameIn   = make("input", { type: "text",  id: "emp-name",  required: true });
    const emailIn  = make("input", { type: "email", id: "emp-email", required: true });
    const phoneIn  = make("input", { type: "text",  id: "emp-phone", required: true });

    const roleSelect = make("select", { id: "emp-role", required: true });
    const defaultRoleOpt = make("option", { text: "Select a role", value: "" });
    defaultRoleOpt.disabled = true;
    defaultRoleOpt.selected = true;
    roleSelect.appendChild(defaultRoleOpt);
    EMPLOYEE_ROLES.forEach(r => roleSelect.appendChild(make("option", { text: r, value: r })));

    const passIn = make("input", { type: "password", id: "emp-password", placeholder: "Leave blank to keep current" });
    const passGroup = make("div", { class: "mb-3" });
    const passLabel = make("label", { class: "form-label", for: "emp-password", text: "Password" });
    append(passGroup, passLabel, passIn);
    passIn.classList.add("form-control");

    const submitBtn = make("button", { class: "btn btn-success", text: "Add Employee", id: "emp-submit-btn" });
    submitBtn.type  = "submit";
    const cancelBtn = make("button", { class: "btn btn-outline-secondary", text: "Cancel", hidden: true, id: "emp-cancel-btn" });
    cancelBtn.type  = "button";

    const btnRow = make("div", { class: "d-flex gap-2" });
    append(btnRow, submitBtn, cancelBtn);
    append(form,
      editIdIn,
      formGroup("Full Name", nameIn),
      formGroup("Email", emailIn),
      formGroup("Phone", phoneIn),
      selectGroup("Role", roleSelect),
      passGroup,
      btnRow
    );
    formBody.appendChild(form);

    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      const editId = editIdIn.value;
      const body = {
        name:     nameIn.value.trim(),
        email:    emailIn.value.trim(),
        phone:    phoneIn.value.trim() || null,
        role:     roleSelect.value,
        password: passIn.value || null
      };
      try {
        hideError();
        editId ? await apiPut("/employees/" + editId, body) : await apiPost("/employees", body);
        resetEmpForm();
        await loadEmployees();
      } catch (err) {
        showError((editId ? "Update" : "Add") + " employee failed: " + err.message);
      }
    });

    cancelBtn.addEventListener("click", resetEmpForm);
  }

  loadEmployees();

  searchInput.addEventListener("input", function() {
    const q = this.value.toLowerCase();
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
});

function resetEmpForm() {
  const form = document.querySelector("#employees-body")?.closest(".row")?.querySelector("form");
  if (form) form.reset();
  const editIdIn = document.getElementById("edit-employee-id");
  if (editIdIn) editIdIn.value = "";
  const roleSelect = document.getElementById("emp-role");
  if (roleSelect) roleSelect.selectedIndex = 0;
  const title = document.getElementById("emp-form-title");
  if (title) title.textContent = "Add Employee";
  const submitBtn = document.getElementById("emp-submit-btn");
  if (submitBtn) submitBtn.textContent = "Add Employee";
  const cancelBtn = document.getElementById("emp-cancel-btn");
  if (cancelBtn) cancelBtn.style.display = "none";
}

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

  const td = make("td");

  if (isManager()) {
    const editBtn = make("button", { class: "btn btn-sm btn-outline-primary me-1", text: "Edit" });
    editBtn.type  = "button";
    editBtn.addEventListener("click", () => {
      document.getElementById("edit-employee-id").value = r.id;
      document.getElementById("emp-name").value  = r.name ?? "";
      document.getElementById("emp-email").value = r.email ?? "";
      document.getElementById("emp-phone").value = r.phone ?? "";
      const roleSelect = document.getElementById("emp-role");
      if (roleSelect) roleSelect.value = r.role ?? "";
      const passIn = document.getElementById("emp-password");
      if (passIn) passIn.value = "";

      const title = document.getElementById("emp-form-title");
      if (title) title.textContent = "Edit Employee";
      const submitBtn = document.getElementById("emp-submit-btn");
      if (submitBtn) submitBtn.textContent = "Update Employee";
      const cancelBtn = document.getElementById("emp-cancel-btn");
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
  }

  tr.appendChild(td);
  return tr;
}
