function showLogin() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  hideError();

  // Outer centering row
  const row = make("div", { class: "row justify-content-center" });
  row.style.marginTop = "80px";
  const col = make("div", { class: "col-md-4" });
  app.appendChild(row);
  row.appendChild(col);

  // Branding
  const brand = make("div", { class: "text-center mb-4" });
  const brandTitle = make("h2", { class: "text-success fw-bold", text: "GreenGrow Garden" });
  const brandSub   = make("p",  { class: "text-muted", text: "Sign in to continue" });
  append(brand, brandTitle, brandSub);
  col.appendChild(brand);

  // Card
  const { card, body: cardBody } = makeCard("");
  card.querySelector(".card-header").remove();
  col.appendChild(card);

  // Tabs
  const tabs = make("ul", { class: "nav nav-tabs mb-4" });
  const tabLogin    = make("li", { class: "nav-item" });
  const tabRegister = make("li", { class: "nav-item" });
  const linkLogin    = make("a", { class: "nav-link active", text: "Sign in" });
  linkLogin.href = "#";
  const linkRegister = make("a", { class: "nav-link", text: "Register" });
  linkRegister.href = "#";
  tabLogin.appendChild(linkLogin);
  tabRegister.appendChild(linkRegister);
  append(tabs, tabLogin, tabRegister);
  cardBody.appendChild(tabs);

  // ── Login form ──────────────────────────────────────────────────────────
  const loginForm = make("form", { id: "form-login" });

  const loginEmail = make("input", { type: "email", id: "login-email", name: "email", required: true });
  const loginPass  = make("input", { type: "password", id: "login-password", name: "password", required: true });
  const loginBtn   = make("button", { class: "btn btn-success w-100", text: "Sign in" });
  loginBtn.type = "submit";

  append(loginForm,
    formGroup("Email", loginEmail),
    formGroup("Password", loginPass),
    loginBtn
  );
  cardBody.appendChild(loginForm);

  // ── Register form ───────────────────────────────────────────────────────
  const regForm = make("form", { id: "form-register", hidden: true });

  const regName  = make("input", { type: "text",     id: "reg-name",     name: "name",     required: true });
  const regEmail = make("input", { type: "email",    id: "reg-email",    name: "email",    required: true });
  const regPass  = make("input", { type: "password", id: "reg-password", name: "password", required: true });
  const regPhone = make("input", { type: "text",     id: "reg-phone",    name: "phone" });
  const regBtn   = make("button", { class: "btn btn-success w-100", text: "Create account" });
  regBtn.type = "submit";

  append(regForm,
    formGroup("Full name", regName),
    formGroup("Email", regEmail),
    formGroup("Password", regPass),
    formGroup("Phone (optional)", regPhone),
    regBtn
  );
  cardBody.appendChild(regForm);

  // ── Tab switching ───────────────────────────────────────────────────────
  linkLogin.addEventListener("click", e => {
    e.preventDefault();
    loginForm.style.display = "";
    regForm.style.display   = "none";
    linkLogin.classList.add("active");
    linkRegister.classList.remove("active");
  });

  linkRegister.addEventListener("click", e => {
    e.preventDefault();
    regForm.style.display   = "";
    loginForm.style.display = "none";
    linkRegister.classList.add("active");
    linkLogin.classList.remove("active");
  });

  // ── Login submit ────────────────────────────────────────────────────────
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      hideError();
      const user = await apiPost("/auth/login", {
        email:    loginEmail.value.trim(),
        password: loginPass.value,
      });
      setCurrentUser(user);
      renderShell(true, user);
      navigate("dashboard");
    } catch (err) {
      showError("Login failed: " + err.message);
    }
  });

  // ── Register submit ─────────────────────────────────────────────────────
  regForm.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      hideError();
      const user = await apiPost("/auth/register", {
        name:     regName.value.trim(),
        email:    regEmail.value.trim(),
        password: regPass.value,
        phone:    regPhone.value.trim() || null,
      });
      setCurrentUser(user);
      renderShell(true, user);
      navigate("dashboard");
    } catch (err) {
      showError("Registration failed: " + err.message);
    }
  });
}
