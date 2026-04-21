let cart = [];
let _storefrontProducts = [];
let _cartContainer = null;

registerPage("storefront", async function(app) {
  cart = [];

  app.appendChild(make("h1", { class: "h3 mb-4", text: "Shop" }));

  // ── Filter row ────────────────────────────────────────────────────────────
  const filterRow = make("div", { class: "row g-2 mb-4 align-items-center" });
  const searchCol = make("div", { class: "col-md-4" });
  const catCol    = make("div", { class: "col-md-4" });
  const sortCol   = make("div", { class: "col-md-4" });

  const searchIn  = make("input", { type: "text", id: "store-search", class: "form-control", placeholder: "Search products…" });

  const catSelect = make("select", { id: "store-cat", class: "form-select" });
  catSelect.appendChild(make("option", { text: "All Categories" }));

  const sortSelect = make("select", { id: "store-sort", class: "form-select" });
  [
    ["",        "Sort by…"],
    ["price-asc",  "Price: Low to High"],
    ["price-desc", "Price: High to Low"],
    ["name-asc",   "Name: A to Z"],
    ["name-desc",  "Name: Z to A"],
  ].forEach(([val, text]) => {
    const opt = make("option", { text });
    opt.value = val;
    sortSelect.appendChild(opt);
  });

  searchCol.appendChild(searchIn);
  catCol.appendChild(catSelect);
  sortCol.appendChild(sortSelect);
  append(filterRow, searchCol, catCol, sortCol);
  app.appendChild(filterRow);

  // ── Main row ──────────────────────────────────────────────────────────────
  const mainRow = make("div", { class: "row g-4" });
  app.appendChild(mainRow);

  const prodCol = make("div", { class: "col-lg-8" });
  const prodGrid = make("div", { class: "row g-3", id: "store-products" });
  prodCol.appendChild(prodGrid);
  mainRow.appendChild(prodCol);

  const cartCol = make("div", { class: "col-lg-4", id: "store-cart-col" });
  mainRow.appendChild(cartCol);
  _cartContainer = cartCol;

  // ── Load categories ───────────────────────────────────────────────────────
  try {
    const cats = asArray(await apiGet("/categories"));
    cats.forEach(c => catSelect.appendChild(make("option", { text: c.name, value: String(c.id) })));
  } catch {}

  // ── Load products ─────────────────────────────────────────────────────────
  try {
    _storefrontProducts = asArray(await apiGet("/products"));
    renderStorefrontProducts(prodGrid, _storefrontProducts);
  } catch (err) {
    prodGrid.appendChild(make("p", { class: "text-muted", text: "Could not load products: " + err.message }));
  }

  renderCartPanel();

  // ── Filter + sort events ──────────────────────────────────────────────────
  function applyFilters() {
    const q    = searchIn.value.toLowerCase();
    const isAllCats = catSelect.selectedIndex === 0;
    const catId = isAllCats ? null : catSelect.value;

    let filtered = _storefrontProducts.filter(p => {
      const matchQ   = !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      const matchCat = !catId || String(p.categoryId) === catId;
      return matchQ && matchCat;
    });

    const sort = sortSelect.value;
    if (sort === "price-asc")  filtered = [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
    if (sort === "name-asc")   filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name-desc")  filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));

    renderStorefrontProducts(prodGrid, filtered);
  }

  searchIn.addEventListener("input", applyFilters);
  catSelect.addEventListener("change", applyFilters);
  sortSelect.addEventListener("change", applyFilters);
});

function renderStorefrontProducts(grid, products) {
  grid.innerHTML = "";
  if (!products.length) {
    grid.appendChild(make("p", { class: "text-muted py-4 text-center", text: "No products found." }));
    return;
  }
  products.forEach(p => grid.appendChild(buildStoreProductCard(p)));
}

function buildStoreProductCard(p) {
  const col  = make("div", { class: "col-sm-6 col-md-4" });
  const card = make("div", { class: "card h-100 border-0 shadow-sm", style: "cursor:pointer" });
  const body = make("div", { class: "card-body d-flex flex-column" });

  const badge = make("span", { class: "badge bg-success-subtle text-success mb-2 align-self-start", text: p.category || "General" });
  const name  = make("h6",  { class: "card-title mb-1 fw-semibold", text: p.name });
  const desc  = make("p",   { class: "card-text text-muted small flex-grow-1", text: p.description || "" });
  const price = make("div", { class: "fw-bold text-success mb-2", text: "$" + Number(p.price).toFixed(2) });

  const outOfStock = (p.quantity ?? 0) === 0;
  const addBtn = make("button", {
    class: outOfStock ? "btn btn-secondary btn-sm mt-auto" : "btn btn-success btn-sm mt-auto",
    text:  outOfStock ? "Out of Stock" : "Add to Cart"
  });
  if (outOfStock) addBtn.disabled = true;
  else addBtn.addEventListener("click", e => { e.stopPropagation(); addToCart(p); });

  card.addEventListener("click", () => showProductModal(p));

  append(body, badge, name, desc, price, addBtn);
  card.appendChild(body);
  col.appendChild(card);
  return col;
}

function showProductModal(p) {
  // Remove any existing modal
  document.getElementById("product-detail-modal")?.remove();

  const outOfStock = (p.quantity ?? 0) === 0;

  const backdrop = make("div", { id: "product-detail-modal" });
  backdrop.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1050;display:flex;align-items:center;justify-content:center";

  const dialog = make("div", { class: "card border-0 shadow-lg", id: "prod-modal-dialog" });
  dialog.style.cssText = "width:min(480px,90vw);max-height:90vh;overflow-y:auto;z-index:1051;position:relative";

  const header = make("div", { class: "card-header bg-white d-flex justify-content-between align-items-center" });
  const title  = make("span", { class: "fw-semibold", text: p.name });
  const closeBtn = make("button", { class: "btn-close", type: "button" });
  closeBtn.addEventListener("click", () => backdrop.remove());
  append(header, title, closeBtn);

  const body = make("div", { class: "card-body" });

  const catBadge = make("span", { class: "badge bg-success-subtle text-success mb-3 d-inline-block", text: p.category || "General" });
  const descP    = make("p",   { class: "text-muted mb-3", text: p.description || "No description available." });

  const metaRow  = make("div", { class: "d-flex justify-content-between align-items-center mb-4" });
  const priceEl  = make("div", { class: "fs-4 fw-bold text-success", text: "$" + Number(p.price).toFixed(2) });
  const stockEl  = make("div", { class: "small text-muted", text: outOfStock ? "Out of stock" : "In stock: " + p.quantity });
  append(metaRow, priceEl, stockEl);

  const addBtn = make("button", {
    class: outOfStock ? "btn btn-secondary w-100 disabled" : "btn btn-success w-100",
    text:  outOfStock ? "Out of Stock" : "Add to Cart"
  });
  if (!outOfStock) {
    addBtn.addEventListener("click", () => {
      addToCart(p);
      backdrop.remove();
    });
  }

  append(body, catBadge, descP, metaRow, addBtn);
  append(dialog, header, body);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  // Close on backdrop click
  backdrop.addEventListener("click", e => { if (e.target === backdrop) backdrop.remove(); });
}

function addToCart(product) {
  const existing = cart.find(i => i.productId === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
  }
  renderCartPanel();
}

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(i => i.productId !== productId);
  renderCartPanel();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.productId !== productId);
  renderCartPanel();
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function renderCartPanel() {
  const c = _cartContainer;
  if (!c) return;
  c.innerHTML = "";

  const { card, body } = makeCard("Cart (" + cart.length + " item" + (cart.length === 1 ? "" : "s") + ")");
  c.appendChild(card);

  if (!cart.length) {
    body.appendChild(make("p", { class: "text-muted text-center py-3", text: "Your cart is empty." }));
    return;
  }

  cart.forEach(item => {
    const row = make("div", { class: "d-flex align-items-center gap-2 mb-2" });

    const nameSpan = make("span", { class: "flex-grow-1 small fw-semibold", text: item.name });

    const minusBtn = make("button", { class: "btn btn-outline-secondary btn-sm py-0 px-2", text: "−" });
    minusBtn.addEventListener("click", () => updateCartQty(item.productId, -1));

    const qtySpan = make("span", { class: "small px-1", text: String(item.quantity) });

    const plusBtn = make("button", { class: "btn btn-outline-secondary btn-sm py-0 px-2", text: "+" });
    plusBtn.addEventListener("click", () => updateCartQty(item.productId, 1));

    const linePrice = make("span", { class: "small text-muted ms-auto", text: "$" + (item.price * item.quantity).toFixed(2) });

    const removeBtn = make("button", { class: "btn btn-link btn-sm text-danger p-0 ms-1", text: "×" });
    removeBtn.addEventListener("click", () => removeFromCart(item.productId));

    append(row, nameSpan, minusBtn, qtySpan, plusBtn, linePrice, removeBtn);
    body.appendChild(row);
  });

  const hr = make("hr");
  const totalRow = make("div", { class: "d-flex justify-content-between fw-bold mb-3" });
  append(totalRow, make("span", { text: "Total" }), make("span", { text: "$" + cartTotal().toFixed(2) }));

  const checkoutBtn = make("button", { class: "btn btn-success w-100", text: "Checkout →" });
  checkoutBtn.addEventListener("click", () => showCheckoutPanel());

  append(body, hr, totalRow, checkoutBtn);
}

function showCheckoutPanel() {
  const c = _cartContainer;
  if (!c) return;
  c.innerHTML = "";

  const { card, body } = makeCard("Checkout");
  c.appendChild(card);

  // Order summary
  const summaryDiv = make("div", { class: "mb-3 p-2 bg-light rounded small" });
  cart.forEach(item => {
    const line = make("div", { class: "d-flex justify-content-between" });
    append(line,
      make("span", { text: item.name + " x" + item.quantity }),
      make("span", { text: "$" + (item.price * item.quantity).toFixed(2) })
    );
    summaryDiv.appendChild(line);
  });
  const totalLine = make("div", { class: "d-flex justify-content-between fw-bold border-top mt-1 pt-1" });
  append(totalLine, make("span", { text: "Total" }), make("span", { text: "$" + cartTotal().toFixed(2) }));
  summaryDiv.appendChild(totalLine);
  body.appendChild(summaryDiv);

  const form = make("form");
  const addressIn = make("input", { type: "text", id: "co-address", required: true, placeholder: "123 Main St" });
  const cityIn    = make("input", { type: "text", id: "co-city",    required: true });
  const stateIn   = make("input", { type: "text", id: "co-state",   required: true, placeholder: "TX" });
  const zipIn     = make("input", { type: "text", id: "co-zip",     required: true, placeholder: "78701" });

  const payBtn = make("button", { class: "btn btn-success w-100", text: "Pay $" + cartTotal().toFixed(2) });
  payBtn.type = "submit";

  const backBtn = make("button", { class: "btn btn-outline-secondary w-100 mt-2", text: "← Back to Cart" });
  backBtn.type = "button";
  backBtn.addEventListener("click", () => renderCartPanel());

  append(form,
    formGroup("Shipping Address", addressIn),
    formGroup("City", cityIn),
    formGroup("State", stateIn),
    formGroup("ZIP Code", zipIn),
    payBtn,
    backBtn
  );
  body.appendChild(form);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const user = getCurrentUser();
    try {
      payBtn.disabled  = true;
      payBtn.textContent = "Processing…";
      const order = await apiPost("/orders", {
        customerId: user.id,
        address:    addressIn.value.trim(),
        city:       cityIn.value.trim(),
        state:      stateIn.value.trim(),
        zipcode:    zipIn.value.trim(),
        items:      cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price }))
      });

      cart = [];
      c.innerHTML = "";

      const { card: confCard, body: confBody } = makeCard("Order Confirmed!");
      const checkDiv = make("div", { class: "text-center py-3" });
      const checkIcon = make("div", { class: "text-success display-4 mb-2", text: "✓" });
      const confTitle = make("h5", { class: "fw-semibold", text: "Order #" + (order?.id ?? "—") + " placed!" });
      const confSub   = make("p", { class: "text-muted small", text: "Thank you for your purchase. Your order is being processed." });
      const shopBtn   = make("button", { class: "btn btn-success", text: "Continue Shopping" });
      shopBtn.addEventListener("click", () => renderCartPanel());
      append(checkDiv, checkIcon, confTitle, confSub, shopBtn);
      confBody.appendChild(checkDiv);
      c.appendChild(confCard);
    } catch (err) {
      payBtn.disabled  = false;
      payBtn.textContent = "Pay $" + cartTotal().toFixed(2);
      showError("Checkout failed: " + err.message);
    }
  });
}
