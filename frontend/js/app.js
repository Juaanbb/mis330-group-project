// ─── Config ────────────────────────────────────────────────────────────────
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "";

// ─── API helpers ───────────────────────────────────────────────────────────
function apiUrl(path) {
  return API_BASE + (path.startsWith("/") ? path : "/" + path);
}

async function apiGet(path) {
  const res = await fetch(apiUrl(path), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(path + " → " + res.status);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(path + " → " + res.status + (t ? ": " + t : ""));
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

async function apiPut(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(path + " → " + res.status + (t ? ": " + t : ""));
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

async function apiDelete(path) {
  const res = await fetch(apiUrl(path), { method: "DELETE" });
  if (!res.ok) throw new Error(path + " → " + res.status);
  return null;
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// ─── Auth helpers ──────────────────────────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("currentUser")); } catch { return null; }
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("currentUser");
}

function logout() {
  clearCurrentUser();
  document.getElementById("main-nav").style.display = "none";
  showLogin();
}

// ─── UI helpers ────────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById("api-alert");
  el.textContent = msg;
  el.classList.remove("d-none");
}

function hideError() {
  document.getElementById("api-alert").classList.add("d-none");
}

// Create a DOM element with common properties set via an options object
function make(tag, opts = {}) {
  const el = document.createElement(tag);
  if (opts.class)       el.className     = opts.class;
  if (opts.id)          el.id            = opts.id;
  if (opts.text)        el.textContent   = opts.text;
  if (opts.type)        el.type          = opts.type;
  if (opts.name)        el.name          = opts.name;
  if (opts.for)         el.htmlFor       = opts.for;
  if (opts.placeholder) el.placeholder   = opts.placeholder;
  if (opts.value)       el.value         = opts.value;
  if (opts.required)    el.required      = true;
  if (opts.disabled)    el.disabled      = true;
  if (opts.checked)     el.checked       = true;
  if (opts.rows)        el.rows          = opts.rows;
  if (opts.step)        el.step          = opts.step;
  if (opts.min)         el.min           = opts.min;
  if (opts.colspan)     el.colSpan       = opts.colspan;
  if (opts.hidden)      el.style.display = "none";
  return el;
}

// Append multiple children to a parent in one call
function append(parent, ...children) {
  children.forEach(c => parent.appendChild(c));
  return parent;
}

// Build a Bootstrap form-group: label + any input element
function formGroup(labelText, input) {
  input.classList.add("form-control");
  const group = make("div", { class: "mb-3" });
  const label = make("label", { class: "form-label", for: input.id, text: labelText });
  append(group, label, input);
  return group;
}

// Build a Bootstrap card with a header
function makeCard(headerText, headerExtra) {
  const card = make("div", { class: "card border-0 shadow-sm" });
  const header = make("div", { class: "card-header bg-white" });
  if (headerExtra) {
    header.className += " d-flex justify-content-between align-items-center";
    append(header, make("span", { class: "fw-semibold", text: headerText }), headerExtra);
  } else {
    header.className += " fw-semibold";
    header.textContent = headerText;
  }
  const body = make("div", { class: "card-body" });
  append(card, header, body);
  return { card, header, body };
}

// Build a striped Bootstrap table with a thead and an empty tbody
function makeTable(columns, tbodyId) {
  const wrapper = make("div", { class: "table-responsive" });
  const table   = make("table", { class: "table table-striped mb-0" });
  const thead   = make("thead", { class: "table-light" });
  const tr      = make("tr");
  columns.forEach(col => tr.appendChild(make("th", { text: col })));
  thead.appendChild(tr);
  const tbody = make("tbody", { id: tbodyId });
  append(table, thead, tbody);
  wrapper.appendChild(table);
  return { wrapper, table, tbody };
}

// Build an empty-state row spanning all columns
function emptyRow(tbody, colspan, msg) {
  const tr = make("tr");
  const td = make("td", { class: "text-muted text-center py-4", colspan, text: msg });
  tr.appendChild(td);
  tbody.appendChild(tr);
}

// ─── Router ────────────────────────────────────────────────────────────────
const pages = {};

function registerPage(name, fn) {
  pages[name] = fn;
}

function navigate(page) {
  hideError();
  const app = document.getElementById("app");
  app.innerHTML = "";
  if (pages[page]) pages[page](app);
  document.querySelectorAll(".navbar-nav .nav-link[data-page]").forEach(link => {
    link.classList.toggle("active", link.getAttribute("data-page") === page);
  });
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────
document.querySelectorAll(".navbar-nav .nav-link[data-page]").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    navigate(link.getAttribute("data-page"));
  });
});

document.getElementById("btn-logout").addEventListener("click", logout);

document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (user) {
    document.getElementById("main-nav").style.display = "";
    document.getElementById("nav-username").textContent = user.name;
    navigate("dashboard");
  } else {
    showLogin();
  }
});
