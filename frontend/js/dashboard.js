registerPage("dashboard", function(app) {
  // Title
  app.appendChild(make("h1", { class: "h3 mb-4", text: "Dashboard" }));

  // Stat cards row
  const statsRow = make("div", { class: "row g-3 mb-4" });
  app.appendChild(statsRow);

  const stats = [
    { label: "Customers",  id: "dash-customers" },
    { label: "Products",   id: "dash-products" },
    { label: "Orders",     id: "dash-orders" },
    { label: "Low stock",  id: "dash-low-stock" },
  ];

  stats.forEach(s => {
    const col  = make("div", { class: "col-sm-6 col-lg-3" });
    const card = make("div", { class: "card border-0 shadow-sm" });
    const body = make("div", { class: "card-body" });
    append(body,
      make("div", { class: "text-muted small", text: s.label }),
      make("div", { class: "fs-3 fw-semibold", id: s.id, text: "—" })
    );
    card.appendChild(body);
    col.appendChild(card);
    statsRow.appendChild(col);
  });

  // Recent orders card
  const { card: ordersCard, body: ordersBody } = makeCard("Recent orders");
  ordersBody.className = "card-body p-0";
  app.appendChild(ordersCard);

  const { wrapper, tbody } = makeTable(["ID", "Customer ID", "Date", "Status"], "dash-orders-body");
  ordersBody.appendChild(wrapper);

  emptyRow(tbody, 4, "Loading…");

  // Load data
  loadDashboard(tbody);
});

async function loadDashboard(tbody) {
  try {
    const [custRaw, prodRaw, ordRaw, invRaw] = await Promise.all([
      apiGet("/customers").catch(() => []),
      apiGet("/products").catch(() => []),
      apiGet("/orders").catch(() => []),
      apiGet("/inventory").catch(() => []),
    ]);

    const customers = asArray(custRaw);
    const products  = asArray(prodRaw);
    const orders    = asArray(ordRaw);
    const inventory = asArray(invRaw);

    document.getElementById("dash-customers").textContent = customers.length;
    document.getElementById("dash-products").textContent  = products.length;
    document.getElementById("dash-orders").textContent    = orders.length;

    const low = inventory.filter(r => {
      const qty     = Number(r.quantity ?? r.quantityOnHand ?? 0);
      const reorder = Number(r.reorderLevel ?? r.reorderAt ?? 0);
      return reorder > 0 && qty <= reorder;
    });
    document.getElementById("dash-low-stock").textContent = inventory.length ? low.length : "—";

    const recent = [...orders]
      .sort((a, b) => new Date(b.orderDate ?? 0) - new Date(a.orderDate ?? 0))
      .slice(0, 5);

    // Use the tbody passed in, or look it up
    const t = tbody || document.getElementById("dash-orders-body");
    if (!t) return;
    t.innerHTML = "";

    if (!recent.length) { emptyRow(t, 4, "No orders yet."); return; }

    recent.forEach(r => {
      const tr = make("tr");
      [r.id ?? r.orderId ?? "", r.customerId ?? "", r.orderDate ?? "", r.orderStatus ?? r.status ?? ""].forEach(val => {
        tr.appendChild(make("td", { text: String(val) }));
      });
      t.appendChild(tr);
    });
  } catch (err) {
    showError("Dashboard error: " + err.message);
  }
}
