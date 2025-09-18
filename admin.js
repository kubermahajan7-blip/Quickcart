// Sample Products
let products = [
  { id: 1, name: "iPhone 15 Pro", price: 90000, stock: 39 },
  { id: 2, name: "MacBook Pro", price: 140000, stock: 23 },
  { id: 3, name: "Fresh Apples", price: 150, stock: 99 }
];

// Sample Orders
let orders = [
  {
    id: "d0c08703",
    customer: "hum5@gmail.com",
    items: ["iPhone 15 Pro x1", "MacBook Pro x1", "Fresh Apples x1"],
    total: 230150.00,
    status: "Pending"
  },
  {
    id: "b5ad4726",
    customer: "hunm5@gmail.com",
    items: ["iPhone 15 Pro x2"],
    total: 180000.00,
    status: "Pending"
  }
];

// Show Tabs
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');

  if (tabId === "products") renderProducts();
  if (tabId === "orders") renderOrders();
}

// Render Products
function renderProducts() {
  const grid = document.querySelector(".products-grid");
  grid.innerHTML = "";
  products.forEach(prod => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${prod.name}</h3>
      <p>$${prod.price.toFixed(2)} — ${prod.stock} in stock</p>
      <button onclick="editProduct(${prod.id})">✏ Edit</button>
      <button class="delete" onclick="deleteProduct(${prod.id})">🗑 Delete</button>
    `;
    grid.appendChild(card);
  });
}

// Add Product
function addProduct() {
  const name = prompt("Enter product name:");
  const price = parseFloat(prompt("Enter product price:"));
  const stock = parseInt(prompt("Enter stock quantity:"));

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("Invalid input!");
    return;
  }

  const newProd = { id: Date.now(), name, price, stock };
  products.push(newProd);
  renderProducts();
}

// Edit Product
function editProduct(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;

  const newName = prompt("Edit product name:", prod.name);
  const newPrice = parseFloat(prompt("Edit price:", prod.price));
  const newStock = parseInt(prompt("Edit stock:", prod.stock));

  prod.name = newName || prod.name;
  prod.price = isNaN(newPrice) ? prod.price : newPrice;
  prod.stock = isNaN(newStock) ? prod.stock : newStock;

  renderProducts();
}

// Delete Product
function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  renderProducts();
}

// Render Orders
function renderOrders() {
  const ordersContainer = document.getElementById("orders");
  ordersContainer.innerHTML = "<h2>Order Management</h2>";

  orders.forEach(order => {
    const div = document.createElement("div");
    div.className = "order";
    div.innerHTML = `
      <h4>Order #${order.id}</h4>
      <p><strong>Customer:</strong> ${order.customer}</p>
      <p><strong>Items:</strong> ${order.items.join(", ")}</p>
      <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
      <select onchange="updateOrderStatus('${order.id}', this.value)">
        <option ${order.status === "Pending" ? "selected" : ""}>Pending</option>
        <option ${order.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
        <option ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
      </select>
    `;
    ordersContainer.appendChild(div);
  });
}

// Update Order Status
function updateOrderStatus(orderId, status) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    alert(`Order #${orderId} status updated to ${status}`);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".add-btn").addEventListener("click", addProduct);
  renderProducts();
  renderOrders();
});
