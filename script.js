/**
 * GreenGrow Garden — API base (change to your server URL, e.g. http://localhost:3000)
 */
const API_BASE = "";

function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function showApiError(msg) {
  const box = $("#api-alert");
  box.textContent = msg;
  box.classList.remove("d-none");
}

function hideApiError() {
  $("#api-alert").classList.add("d-none");
}

async function apiGet(path) {
  const res = await fetch(apiUrl(path), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
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
    throw new Error(`${path} → ${res.status}${t ? `: ${t}` : ""}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

/** Normalize array from common API shapes */
function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.rows)) return data.rows;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function emptyRow(colspan, text) {
  return `<tr><td colspan="${colspan}" class="text-muted text-center py-4">${text}</td></tr>`;
}

// --- Navigation ---
function showSection(id) {
  $$(".page-section").forEach((s) => s.classList.add("d-none"));
  const sec = $(`#section-${id}`);
  if (sec) sec.classList.remove("d-none");
  $$(".navbar-nav .nav-link").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("data-section") === id);
  });
  if (id === "customers") loadCustomers();
  if (id === "products") loadProducts();
  if (id === "orders") loadOrders();
  if (id === "inventory") loadInventory();
  if (id === "dashboard") loadDashboard();
}

$$(".navbar-nav .nav-link[data-section]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(link.getAttribute("data-section"));
  });
});

// --- Customers ---
async function loadCustomers() {
  const tbody = $("#customers-body");
  try {
    hideApiError();
    const raw = await apiGet("/customers");
    const rows = asArray(raw);
    if (!rows.length) {
      tbody.innerHTML = emptyRow(4, "No customers yet.");
      return;
    }
    tbody.innerHTML = rows
      .map((r) => {
        const id = r.id ?? r.customer_id ?? "";
        const name = r.name ?? r.customer_name ?? "";
        const email = r.email ?? "";
        const phone = r.phone ?? "";
        return `<tr><td>${id}</td><td>${escapeHtml(String(name))}</td><td>${escapeHtml(String(email))}</td><td>${escapeHtml(String(phone))}</td></tr>`;
      })
      .join("");
  } catch (err) {
    showApiError(`Could not load customers: ${err.message}`);
    tbody.innerHTML = emptyRow(4, "Failed to load. Is the API running?");
  }
}

$("#form-customer").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim() || undefined,
  };
  try {
    hideApiError();
    await apiPost("/customers", body);
    form.reset();
    await loadCustomers();
    if (!$("#section-dashboard").classList.contains("d-none")) loadDashboard();
  } catch (err) {
    showApiError(`Add customer failed: ${err.message}`);
  }
});

// --- Products ---
async function loadProducts() {
  const tbody = $("#products-body");
  try {
    hideApiError();
    const raw = await apiGet("/products");
    const rows = asArray(raw);
    if (!rows.length) {
      tbody.innerHTML = emptyRow(4, "No products yet.");
      return;
    }
    tbody.innerHTML = rows
      .map((r) => {
        const id = r.id ?? r.product_id ?? "";
        const name = r.name ?? r.product_name ?? "";
        const cat = r.category ?? "";
        const price = r.price != null ? r.price : "";
        return `<tr><td>${id}</td><td>${escapeHtml(String(name))}</td><td>${escapeHtml(String(cat))}</td><td>${escapeHtml(String(price))}</td></tr>`;
      })
      .join("");
  } catch (err) {
    showApiError(`Could not load products: ${err.message}`);
    tbody.innerHTML = emptyRow(4, "Failed to load. Is the API running?");
  }
}

$("#form-product").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = {
    name: form.name.value.trim(),
    category: form.category.value.trim() || undefined,
    price: parseFloat(form.price.value),
  };
  try {
    hideApiError();
    await apiPost("/products", body);
    form.reset();
    await loadProducts();
    if (!$("#section-dashboard").classList.contains("d-none")) loadDashboard();
  } catch (err) {
    showApiError(`Add product failed: ${err.message}`);
  }
});

// --- Orders ---
async function loadOrders() {
  const tbody = $("#orders-body");
  try {
    hideApiError();
    const raw = await apiGet("/orders");
    const rows = asArray(raw);
    if (!rows.length) {
      tbody.innerHTML = emptyRow(5, "No orders yet.");
      return;
    }
    tbody.innerHTML = rows
      .map((r) => {
        const id = r.id ?? r.order_id ?? "";
        const cid = r.customer_id ?? r.customerId ?? "";
        const date = r.order_date ?? r.date ?? r.created_at ?? "";
        const status = r.status ?? "";
        const total = r.total != null ? r.total : r.total_amount ?? "";
        return `<tr><td>${id}</td><td>${cid}</td><td>${escapeHtml(String(date))}</td><td>${escapeHtml(String(status))}</td><td>${escapeHtml(String(total))}</td></tr>`;
      })
      .join("");
  } catch (err) {
    showApiError(`Could not load orders: ${err.message}`);
    tbody.innerHTML = emptyRow(5, "Failed to load. Is the API running?");
  }
}

$("#form-order").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = {
    customerId: parseInt(form.customerId.value, 10),
    notes: form.notes.value.trim() || undefined,
  };
  try {
    hideApiError();
    await apiPost("/orders", body);
    form.reset();
    await loadOrders();
    if (!$("#section-dashboard").classList.contains("d-none")) loadDashboard();
  } catch (err) {
    showApiError(`Create order failed: ${err.message}`);
  }
});

// --- Inventory ---
async function loadInventory() {
  const tbody = $("#inventory-body");
  try {
    hideApiError();
    const raw = await apiGet("/inventory");
    const rows = asArray(raw);
    if (!rows.length) {
      tbody.innerHTML = emptyRow(4, "No inventory rows.");
      return;
    }
    tbody.innerHTML = rows
      .map((r) => {
        const pid = r.product_id ?? r.productId ?? r.id ?? "";
        const name = r.name ?? r.product_name ?? "";
        const qty = r.quantity ?? r.qty_on_hand ?? r.stock ?? "";
        const reorder = r.reorder_at ?? r.reorder_level ?? "";
        return `<tr><td>${pid}</td><td>${escapeHtml(String(name))}</td><td>${qty}</td><td>${reorder}</td></tr>`;
      })
      .join("");
  } catch (err) {
    showApiError(`Could not load inventory: ${err.message}`);
    tbody.innerHTML = emptyRow(4, "Failed to load. Is the API running?");
  }
}

// --- Dashboard ---
async function loadDashboard() {
  try {
    hideApiError();
    const [custRaw, prodRaw, ordRaw, invRaw] = await Promise.all([
      apiGet("/customers").catch(() => []),
      apiGet("/products").catch(() => []),
      apiGet("/orders").catch(() => []),
      apiGet("/inventory").catch(() => []),
    ]);
    const customers = asArray(custRaw);
    const products = asArray(prodRaw);
    const orders = asArray(ordRaw);
    const inventory = asArray(invRaw);

    $("#dash-customers").textContent = customers.length;
    $("#dash-products").textContent = products.length;
    $("#dash-orders").textContent = orders.length;

    const low = inventory.filter((r) => {
      const q = Number(r.quantity ?? r.qty_on_hand ?? r.stock ?? 0);
      const re = Number(r.reorder_at ?? r.reorder_level ?? 0);
      return re > 0 && q <= re;
    });
    $("#dash-low-stock").textContent = inventory.length ? low.length : "—";

    const recent = [...orders]
      .sort((a, b) => {
        const da = new Date(a.order_date ?? a.date ?? a.created_at ?? 0).getTime();
        const db = new Date(b.order_date ?? b.date ?? b.created_at ?? 0).getTime();
        return db - da;
      })
      .slice(0, 5);

    const dashBody = $("#dashboard-orders-body");
    if (!recent.length) {
      dashBody.innerHTML = emptyRow(4, "No orders to show.");
      return;
    }
    dashBody.innerHTML = recent
      .map((r) => {
        const id = r.id ?? r.order_id ?? "";
        const cid = r.customer_id ?? r.customerId ?? r.customer_name ?? "";
        const date = r.order_date ?? r.date ?? r.created_at ?? "";
        const status = r.status ?? "";
        return `<tr><td>${id}</td><td>${escapeHtml(String(cid))}</td><td>${escapeHtml(String(date))}</td><td>${escapeHtml(String(status))}</td></tr>`;
      })
      .join("");
  } catch (err) {
    showApiError(`Dashboard: ${err.message}`);
  }
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// Initial load
loadDashboard();
