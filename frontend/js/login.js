function showLoginError(el, msg) {
  el.textContent = msg;
  el.classList.remove("d-none");
}

function hideLoginError(el) {
  el.classList.add("d-none");
}

function makeLoginAlert() {
  const el = make("div", { class: "alert alert-danger d-none mt-3", text: "" });
  el.role = "alert";
  return el;
}

function showLogin() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  hideError();

  const row = make("div", { class: "row justify-content-center" });
  row.style.marginTop = "80px";
  const col = make("div", { class: "col-md-5" });
  app.appendChild(row);
  row.appendChild(col);

  // Branding
  const brand = make("div", { class: "text-center mb-4" });
  append(brand,
    make("h2", { class: "text-success fw-bold", text: "GreenGrow Garden" }),
    make("p",  { class: "text-muted", text: "Sign in to continue" })
  );
  col.appendChild(brand);

  // ── Customer card ───────────────────────────────────────────────────────
  const customerCard = make("div", { class: "card border-0 shadow-sm mb-3" });
  const customerBody = make("div", { class: "card-body" });
  customerCard.appendChild(customerBody);
  col.appendChild(customerCard);

  // Tabs: Sign In / Register
  const tabs = make("ul", { class: "nav nav-tabs mb-4" });
  const tabLogin    = make("li", { class: "nav-item" });
  const tabRegister = make("li", { class: "nav-item" });
  const linkLogin    = make("a", { class: "nav-link active", text: "Sign In" });
  linkLogin.href = "#";
  const linkRegister = make("a", { class: "nav-link", text: "Register" });
  linkRegister.href = "#";
  tabLogin.appendChild(linkLogin);
  tabRegister.appendChild(linkRegister);
  append(tabs, tabLogin, tabRegister);
  customerBody.appendChild(tabs);

  // ── Login form ──────────────────────────────────────────────────────────
  const loginForm  = make("form", { id: "form-login" });
  const loginEmail = make("input", { type: "email", id: "login-email", required: true });
  const loginPass  = make("input", { type: "password", id: "login-password", required: true });
  const loginBtn   = make("button", { class: "btn btn-success w-100", text: "Sign In" });
  loginBtn.type = "submit";
  const loginAlert = makeLoginAlert();
  append(loginForm,
    formGroup("Email", loginEmail),
    formGroup("Password", loginPass),
    loginBtn,
    loginAlert
  );
  customerBody.appendChild(loginForm);

  // ── Register form ───────────────────────────────────────────────────────
  const regForm  = make("form", { id: "form-register", hidden: true });
  const regName  = make("input", { type: "text",     id: "reg-name",     required: true });
  const regEmail = make("input", { type: "email",    id: "reg-email",    required: true });
  const regPass  = make("input", { type: "password", id: "reg-password", required: true });
  const regPhone = make("input", { type: "text",     id: "reg-phone" });
  const regBtn   = make("button", { class: "btn btn-success w-100", text: "Create Account" });
  regBtn.type = "submit";
  const regAlert = makeLoginAlert();
  append(regForm,
    formGroup("Full Name", regName),
    formGroup("Email", regEmail),
    formGroup("Password", regPass),
    formGroup("Phone (optional)", regPhone),
    regBtn,
    regAlert
  );
  customerBody.appendChild(regForm);

  // ── Tab switching ───────────────────────────────────────────────────────
  linkLogin.addEventListener("click", e => {
    e.preventDefault();
    loginForm.style.display = "";
    regForm.style.display   = "none";
    linkLogin.classList.add("active");
    linkRegister.classList.remove("active");
    hideLoginError(loginAlert);
    hideLoginError(regAlert);
  });

  linkRegister.addEventListener("click", e => {
    e.preventDefault();
    regForm.style.display   = "";
    loginForm.style.display = "none";
    linkRegister.classList.add("active");
    linkLogin.classList.remove("active");
    hideLoginError(loginAlert);
    hideLoginError(regAlert);
  });

  // ── Login submit ────────────────────────────────────────────────────────
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    hideLoginError(loginAlert);
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in…";
    try {
      const user = await apiPost("/auth/login", {
        email:    loginEmail.value.trim(),
        password: loginPass.value,
      });
      setCurrentUser(user);
      renderShell(true, user);
      navigate("storefront");
    } catch (err) {
      const status = err.message.includes("401") ? "Incorrect email or password. Please try again." : "Sign in failed. Please try again.";
      showLoginError(loginAlert, status);
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";
    }
  });

  // ── Register submit ─────────────────────────────────────────────────────
  regForm.addEventListener("submit", async e => {
    e.preventDefault();
    hideLoginError(regAlert);
    regBtn.disabled = true;
    regBtn.textContent = "Creating account…";
    try {
      const user = await apiPost("/auth/register", {
        name:     regName.value.trim(),
        email:    regEmail.value.trim(),
        password: regPass.value,
        phone:    regPhone.value.trim() || null,
      });
      setCurrentUser(user);
      renderShell(true, user);
      navigate("storefront");
    } catch (err) {
      const status = err.message.includes("409") ? "An account with that email already exists." : "Registration failed. Please try again.";
      showLoginError(regAlert, status);
      regBtn.disabled = false;
      regBtn.textContent = "Create Account";
    }
  });

  // ── Employee sign-in link ───────────────────────────────────────────────
  const empLinkWrapper = make("div", { class: "text-center mt-2" });
  const empLink = make("a", { class: "text-muted small", text: "Employee Sign In" });
  empLink.href = "#";
  empLink.addEventListener("click", e => {
    e.preventDefault();
    showEmployeeLogin(col, customerCard, empLinkWrapper);
  });
  empLinkWrapper.appendChild(empLink);
  col.appendChild(empLinkWrapper);
}

function showEmployeeLogin(col, customerCard, empLinkWrapper) {
  customerCard.style.display   = "none";
  empLinkWrapper.style.display = "none";

  const empCard = make("div", { class: "card border-0 shadow-sm mb-3", id: "emp-card" });
  const empBody = make("div", { class: "card-body" });
  empCard.appendChild(empBody);
  col.appendChild(empCard);

  empBody.appendChild(make("h6", { class: "fw-semibold mb-4 text-center", text: "Employee Sign In" }));

  const form      = make("form", { id: "form-employee-login" });
  const emailIn   = make("input", { type: "text",     id: "emp-login-email", required: true, placeholder: "Email or username" });
  const passIn    = make("input", { type: "password", id: "emp-login-pass",  required: true });
  const signInBtn = make("button", { class: "btn btn-success w-100", text: "Sign In as Employee" });
  signInBtn.type  = "submit";
  const empAlert  = makeLoginAlert();

  append(form,
    formGroup("Email / Username", emailIn),
    formGroup("Password", passIn),
    signInBtn,
    empAlert
  );
  empBody.appendChild(form);

  const backLink = make("a", { class: "text-muted small", text: "← Back to customer portal" });
  backLink.href = "#";
  backLink.addEventListener("click", e => {
    e.preventDefault();
    empCard.remove();
    backWrapper.remove();
    customerCard.style.display   = "";
    empLinkWrapper.style.display = "";
  });
  const backWrapper = make("div", { class: "text-center mt-3" });
  backWrapper.appendChild(backLink);
  col.appendChild(backWrapper);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    hideLoginError(empAlert);
    signInBtn.disabled = true;
    signInBtn.textContent = "Signing in…";
    try {
      const user = await apiPost("/auth/employee-login", {
        email:    emailIn.value.trim(),
        password: passIn.value,
      });
      setCurrentUser(user);
      renderShell(true, user);
      navigate("dashboard");
    } catch (err) {
      const status = err.message.includes("401") ? "Incorrect username or password. Please try again." : "Sign in failed. Please try again.";
      showLoginError(empAlert, status);
      signInBtn.disabled = false;
      signInBtn.textContent = "Sign In as Employee";
    }
  });
}
