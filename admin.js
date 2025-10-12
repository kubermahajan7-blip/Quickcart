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
  if (tabId === "carts") renderCarts();
  if (tabId === "customers") renderCustomers();
  if (tabId === "orders") renderOrders();
}

// Render Products
function renderProducts() {
  const grid = document.querySelector(".products-grid");
  grid.innerHTML = "";
  fetch('/api/admin/products')
    .then(async r => {
      if (r.status === 401 || r.status === 403) { window.location.href = 'index.html'; return []; }
      return r.json();
    })
    .then(products => {
      if (products.length === 0) {
        grid.innerHTML = "<div class='no-orders'><p>No products found</p></div>";
        return;
      }
      
      products.forEach(prod => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${prod.name}</h3>
          <p><strong>Category:</strong> ${prod.category}</p>
          <p><strong>Price:</strong> ₹${Number(prod.price).toFixed(2)}</p>
          <p><strong>Stock:</strong> ${prod.stock} units</p>
          <p><strong>Reorder Level:</strong> ${prod.reorder_level}</p>
          <div style="margin-top: 10px;">
            <button onclick="editProduct(${prod.id})" style="margin-right: 5px;">✏️ Edit</button>
            <button onclick="deleteProduct(${prod.id})" class="delete">🗑 Delete</button>
          </div>
        `;
        grid.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Error loading products:', error);
      grid.innerHTML = "<p>Error loading products</p>";
    });
}

// Add Product
async function addProduct() {
  const name = prompt("Enter product name:");
  if (!name) return;
  
  const category = prompt("Enter product category (or press Enter for 'General'):") || 'General';
  
  const priceStr = prompt("Enter product price:");
  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) {
    alert("Invalid price!");
    return;
  }
  
  const stockStr = prompt("Enter stock quantity (or press Enter for 0):") || '0';
  const stock = parseInt(stockStr);
  if (isNaN(stock) || stock < 0) {
    alert("Invalid stock quantity!");
    return;
  }
  
  const reorderStr = prompt("Enter reorder level (or press Enter for 5):") || '5';
  const reorder_level = parseInt(reorderStr);
  if (isNaN(reorder_level) || reorder_level < 0) {
    alert("Invalid reorder level!");
    return;
  }

  try {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        category: category,
        price: price,
        stock: stock,
        reorder_level: reorder_level
      })
    });

    if (response.ok) {
      alert('Product added successfully!');
      renderProducts(); // Refresh the products list
    } else {
      const error = await response.json();
      alert('Failed to add product: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error adding product:', error);
    alert('Failed to add product');
  }
}

// Edit Product
async function editProduct(id) {
  // First, get the current product data
  try {
    const response = await fetch('/api/admin/products');
    if (!response.ok) {
      alert('Failed to load product data');
      return;
    }
    
    const products = await response.json();
    const product = products.find(p => p.id === id);
    
    if (!product) {
      alert('Product not found');
      return;
    }
    
    const name = prompt("Enter product name:", product.name);
    if (name === null) return; // User cancelled
    
    const category = prompt("Enter product category:", product.category) || product.category;
    
    const priceStr = prompt("Enter product price:", product.price);
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      alert("Invalid price!");
      return;
    }
    
    const stockStr = prompt("Enter stock quantity:", product.stock);
    const stock = parseInt(stockStr);
    if (isNaN(stock) || stock < 0) {
      alert("Invalid stock quantity!");
      return;
    }
    
    const reorderStr = prompt("Enter reorder level:", product.reorder_level);
    const reorder_level = parseInt(reorderStr);
    if (isNaN(reorder_level) || reorder_level < 0) {
      alert("Invalid reorder level!");
      return;
    }

    const updateResponse = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        category: category,
        price: price,
        stock: stock,
        reorder_level: reorder_level
      })
    });

    if (updateResponse.ok) {
      alert('Product updated successfully!');
      renderProducts(); // Refresh the products list
    } else {
      const error = await updateResponse.json();
      alert('Failed to update product: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error updating product:', error);
    alert('Failed to update product');
  }
}

// Delete Product
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Product deleted successfully!');
      renderProducts(); // Refresh the products list
    } else {
      const error = await response.json();
      alert('Failed to delete product: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product');
  }
}

// Render Orders
function renderOrders() {
  const ordersList = document.getElementById("ordersList");
  ordersList.innerHTML = "<p>Loading orders...</p>";
  
  fetch('/api/admin/orders')
    .then(async r => {
      if (r.status === 401 || r.status === 403) { window.location.href = 'index.html'; return []; }
      return r.json();
    })
    .then(orders => {
      if (orders.length === 0) {
        ordersList.innerHTML = "<div class='no-orders'><p>No orders found</p></div>";
        return;
      }
      
      ordersList.innerHTML = "";
      orders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order";
        const items = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
        const date = new Date(order.created_at).toLocaleDateString();
        const statusClass = getStatusClass(order.status);
        
        div.innerHTML = `
          <h4>Order #${order.id}</h4>
          <p><strong>Customer:</strong> ${order.customer}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Items:</strong> ${items}</p>
          <p><strong>Total:</strong> ₹${Number(order.total_amount).toFixed(2)}</p>
          <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
          <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${order.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="rejected" ${order.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        `;
        ordersList.appendChild(div);
      });
    })
    .catch(error => {
      console.error('Error loading orders:', error);
      ordersList.innerHTML = "<p>Error loading orders</p>";
    });
}

// Update Order Status
async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: status })
    });
    
    if (response.ok) {
      // Refresh orders list
      renderOrders();
    } else {
      const error = await response.json();
      alert('Failed to update order status: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('Failed to update order status');
  }
}

// Render Carts
function renderCarts() {
  const cartsList = document.getElementById("cartsList");
  cartsList.innerHTML = "<p>Loading cart items...</p>";
  
  fetch('/api/admin/carts')
    .then(async r => {
      if (r.status === 401 || r.status === 403) { window.location.href = 'index.html'; return []; }
      return r.json();
    })
    .then(carts => {
      if (carts.length === 0) {
        cartsList.innerHTML = "<div class='no-orders'><p>No cart items found</p></div>";
        return;
      }
      
      cartsList.innerHTML = "";
      carts.forEach(cart => {
        const div = document.createElement("div");
        div.className = "order";
        const date = new Date(cart.created_at).toLocaleDateString();
        const statusClass = getStatusClass(cart.status);
        const total = cart.quantity * cart.price;
        
        div.innerHTML = `
          <h4>${cart.product_name}</h4>
          <p><strong>Customer:</strong> ${cart.customer_name} (${cart.customer_email})</p>
          <p><strong>Category:</strong> ${cart.category}</p>
          <p><strong>Quantity:</strong> ${cart.quantity}</p>
          <p><strong>Price:</strong> ₹${Number(cart.price).toFixed(2)} each</p>
          <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
          <p><strong>Date Added:</strong> ${date}</p>
          <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${cart.status.charAt(0).toUpperCase() + cart.status.slice(1)}</span></p>
          <select onchange="updateCartItemStatus(${cart.id}, this.value)" class="status-select">
            <option value="pending" ${cart.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${cart.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${cart.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        `;
        cartsList.appendChild(div);
      });
    })
    .catch(error => {
      console.error('Error loading carts:', error);
      cartsList.innerHTML = "<p>Error loading cart items</p>";
    });
}

// Render Customers
function renderCustomers() {
  const customersList = document.getElementById("customersList");
  customersList.innerHTML = "<p>Loading customers...</p>";
  
  fetch('/api/admin/customers')
    .then(async r => {
      if (r.status === 401 || r.status === 403) { window.location.href = 'index.html'; return []; }
      return r.json();
    })
    .then(customers => {
      if (customers.length === 0) {
        customersList.innerHTML = "<div class='no-orders'><p>No customers found</p></div>";
        return;
      }
      
      customersList.innerHTML = "";
      customers.forEach(customer => {
        const div = document.createElement("div");
        div.className = "order";
        const joinDate = new Date(customer.created_at).toLocaleDateString();
        
        div.innerHTML = `
          <h4>${customer.name}</h4>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Member Since:</strong> ${joinDate}</p>
          <p><strong>Total Orders:</strong> ${customer.total_orders}</p>
          <p><strong>Cart Items:</strong> ${customer.total_cart_items}</p>
          <p><strong>Total Spent:</strong> ₹${Number(customer.total_spent).toFixed(2)}</p>
        `;
        customersList.appendChild(div);
      });
    })
    .catch(error => {
      console.error('Error loading customers:', error);
      customersList.innerHTML = "<p>Error loading customers</p>";
    });
}

// Update Cart Item Status
async function updateCartItemStatus(cartItemId, status) {
  try {
    const response = await fetch(`/api/admin/cart/${cartItemId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: status })
    });
    
    if (response.ok) {
      // Refresh carts list
      renderCarts();
    } else {
      const error = await response.json();
      alert('Failed to update cart item status: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error updating cart item status:', error);
    alert('Failed to update cart item status');
  }
}

// Filter Carts
function filterCarts() {
  const filter = document.getElementById('cartStatusFilter').value;
  // Re-render carts with filter applied
  renderCarts();
}

// Get status class for styling
function getStatusClass(status) {
  const classes = {
    'pending': 'status-pending',
    'approved': 'status-approved',
    'shipped': 'status-shipped',
    'delivered': 'status-delivered',
    'rejected': 'status-rejected'
  };
  return classes[status] || 'status-pending';
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".add-btn").addEventListener("click", addProduct);
  // fetch and populate dashboard summary
  fetch('/api/admin/summary')
    .then(async r => {
      if (r.status === 401 || r.status === 403) { window.location.href = 'index.html'; return null; }
      return r.json();
    })
    .then(sum => {
      if (!sum) return;
      
      // Update main stats cards
      document.getElementById('totalProducts').textContent = sum.totalProducts;
      document.getElementById('totalCustomers').textContent = sum.totalCustomers;
      document.getElementById('totalOrders').textContent = sum.totalOrders;
      document.getElementById('totalRevenue').textContent = `₹${Number(sum.totalRevenue).toFixed(2)}`;
      document.getElementById('deliveredRevenue').textContent = `₹${Number(sum.deliveredRevenue).toFixed(2)}`;
      document.getElementById('totalCartItems').textContent = sum.totalCartItems;
      document.getElementById('pendingCartItems').textContent = sum.pendingCartItems;
      document.getElementById('lowStock').textContent = sum.lowStock;
      
      // Update today's performance
      document.getElementById('ordersToday').textContent = sum.ordersToday;
      document.getElementById('revenueToday').textContent = Number(sum.revenueToday).toFixed(2);
      document.getElementById('pendingOrders').textContent = sum.pendingOrders;
      document.getElementById('approvedOrders').textContent = sum.approvedOrders;
      document.getElementById('deliveredOrders').textContent = sum.deliveredOrders;
      
      // Update cart management
      document.getElementById('cartItemsCount').textContent = sum.totalCartItems;
      document.getElementById('pendingCartCount').textContent = sum.pendingCartItems;
      document.getElementById('approvedCartCount').textContent = sum.approvedCartItems;
      document.getElementById('cartTotalValue').textContent = Number(sum.cartTotalValue).toFixed(2);
      
      // Update top products
      const topProductsDiv = document.getElementById('topProducts');
      if (sum.topProducts && sum.topProducts.length > 0) {
        topProductsDiv.innerHTML = sum.topProducts.map(product => 
          `<p>${product.name}: ${product.total_sold} sold (₹${Number(product.revenue).toFixed(2)})</p>`
        ).join('');
      } else {
        topProductsDiv.innerHTML = '<p>No sales data available</p>';
      }
    });
  renderProducts();
  renderCarts();
  renderCustomers();
  renderOrders();
});

