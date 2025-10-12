from flask import Flask, request, jsonify, session, redirect, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import os
import sqlite3
import json

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = 'quickcart_flask_secret'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# SQLite database setup
DATABASE = 'quickcart.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            reorder_level INTEGER NOT NULL DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price_each REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id),
            UNIQUE(user_id, product_id)
        )
    ''')
    
    # Insert default admin user
    admin_exists = conn.execute('SELECT id FROM users WHERE role="admin" LIMIT 1').fetchone()
    if not admin_exists:
        admin_hash = generate_password_hash('admin123')
        conn.execute('INSERT INTO users(name, email, password_hash, role) VALUES(?,?,?,?)', 
                    ('admin', 'admin123@gmail.com', admin_hash, 'admin'))
    
    # Insert sample products
    products_exist = conn.execute('SELECT id FROM products LIMIT 1').fetchone()
    if not products_exist:
        conn.execute('INSERT INTO products(name, category, price, stock, reorder_level) VALUES(?,?,?,?,?)',
                    ('iPhone 15 Pro', 'Electronics', 90000.00, 39, 5))
        conn.execute('INSERT INTO products(name, category, price, stock, reorder_level) VALUES(?,?,?,?,?)',
                    ('MacBook Pro', 'Electronics', 140000.00, 23, 5))
        conn.execute('INSERT INTO products(name, category, price, stock, reorder_level) VALUES(?,?,?,?,?)',
                    ('Fresh Apples', 'Groceries', 150.00, 99, 10))
    
    conn.commit()
    conn.close()

def get_user_from_session():
    user = session.get('user')
    return user

def require_role(role):
    user = get_user_from_session()
    if not user or user.get('role') != role:
        return False
    return True

@app.route('/')
def root_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/admin.html')
def admin_dashboard():
    user = get_user_from_session()
    if not user or user.get('role') != 'admin':
        return redirect('/index.html')
    return send_from_directory(app.static_folder, 'admin.html')

@app.route('/customer-dashboard.html')
def customer_dashboard_page():
    user = get_user_from_session()
    if not user or user.get('role') != 'customer':
        return redirect('/index.html')
    return send_from_directory(app.static_folder, 'customer-dashboard.html')

# -------- AUTH ---------
@app.post('/register')
def register_form():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')
    if not name or not email or not password:
        return 'Missing fields', 400
    password_hash = generate_password_hash(password)
    conn = get_db()
    try:
        conn.execute("INSERT INTO users(name, email, password_hash, role) VALUES(?,?,?,?)", (name, email, password_hash, 'customer'))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return 'Registration failed', 500
    finally:
        conn.close()
    return redirect('/index.html')

@app.post('/login')
def login_form():
    email = request.form.get('email')
    password = request.form.get('password')
    print(f"Login attempt: email={email}")  # Debug line (removed password for security)
    
    conn = get_db()
    user = conn.execute('SELECT id, name, email, password_hash, role FROM users WHERE email=?', (email,)).fetchone()
    conn.close()
    
    if not user:
        print(f"User not found: {email}")  # Debug line
        return 'Invalid email or password', 401
    
    if not check_password_hash(user['password_hash'], password):
        print(f"Invalid password for user: {email}")  # Debug line
        return 'Invalid email or password', 401
    
    print(f"Login successful for user: {user['email']}, role: {user['role']}")  # Debug line
    session['user'] = { 'id': user['id'], 'name': user['name'], 'email': user['email'], 'role': user['role'] }
    
    # Redirect based on user role
    if user['role'] == 'admin':
        print("Redirecting to admin dashboard")  # Debug line
        return redirect('/admin.html')
    elif user['role'] == 'customer':
        print("Redirecting to customer dashboard")  # Debug line
        return redirect('/customer-dashboard.html')
    else:
        print(f"Unknown role: {user['role']}")  # Debug line
        return 'Invalid user role', 403

@app.get('/logout')
def logout():
    session.clear()
    return redirect('/index.html')

@app.get('/api/auth/me')
def auth_me():
    user = get_user_from_session()
    if not user:
        return jsonify({'authenticated': False}), 200
    return jsonify({'authenticated': True, 'user': user}), 200

# -------- PRODUCTS ---------
@app.get('/api/products')
def list_products():
    conn = get_db()
    rows = conn.execute('SELECT id, name, category, price, stock FROM products ORDER BY id').fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

# -------- CART MANAGEMENT ---------
@app.get('/api/cart')
def get_cart():
    user = get_user_from_session()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db()
    cart_items = conn.execute('''
        SELECT ci.id, ci.quantity, ci.status, ci.created_at, ci.updated_at,
               p.id as product_id, p.name, p.price, p.category, p.stock
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        ORDER BY ci.created_at DESC
    ''', (user['id'],)).fetchall()
    conn.close()
    
    return jsonify([dict(item) for item in cart_items])

@app.post('/api/cart')
def add_to_cart():
    user = get_user_from_session()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.get_json(force=True)
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return jsonify({'message': 'Product ID required'}), 400
    
    try:
        quantity = int(quantity)
        if quantity <= 0:
            return jsonify({'message': 'Invalid quantity'}), 400
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid quantity'}), 400
    
    conn = get_db()
    try:
        # Check if product exists and has stock
        product = conn.execute('SELECT id, stock FROM products WHERE id=?', (product_id,)).fetchone()
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        # Check if item already in cart
        existing_item = conn.execute('SELECT id, quantity FROM cart_items WHERE user_id=? AND product_id=?', 
                                   (user['id'], product_id)).fetchone()
        
        if existing_item:
            new_quantity = existing_item['quantity'] + quantity
            if new_quantity > product['stock']:
                return jsonify({'message': 'Insufficient stock'}), 400
            conn.execute('UPDATE cart_items SET quantity=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', 
                        (new_quantity, existing_item['id']))
        else:
            if quantity > product['stock']:
                return jsonify({'message': 'Insufficient stock'}), 400
            conn.execute('INSERT INTO cart_items(user_id, product_id, quantity) VALUES(?,?,?)', 
                        (user['id'], product_id, quantity))
        
        conn.commit()
        return jsonify({'message': 'Item added to cart'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': 'Failed to add to cart', 'error': str(e)}), 500
    finally:
        conn.close()

@app.put('/api/cart/<int:cart_item_id>')
def update_cart_item(cart_item_id):
    user = get_user_from_session()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.get_json(force=True)
    quantity = data.get('quantity')
    
    if quantity is None:
        return jsonify({'message': 'Quantity required'}), 400
    
    try:
        quantity = int(quantity)
        if quantity < 0:
            return jsonify({'message': 'Invalid quantity'}), 400
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid quantity'}), 400
    
    conn = get_db()
    try:
        # Check if cart item belongs to user
        cart_item = conn.execute('SELECT id, product_id FROM cart_items WHERE id=? AND user_id=?', 
                               (cart_item_id, user['id'])).fetchone()
        if not cart_item:
            return jsonify({'message': 'Cart item not found'}), 404
        
        if quantity == 0:
            # Remove item from cart
            conn.execute('DELETE FROM cart_items WHERE id=?', (cart_item_id,))
        else:
            # Check stock availability
            product = conn.execute('SELECT stock FROM products WHERE id=?', (cart_item['product_id'],)).fetchone()
            if not product or quantity > product['stock']:
                return jsonify({'message': 'Insufficient stock'}), 400
            
            conn.execute('UPDATE cart_items SET quantity=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', 
                        (quantity, cart_item_id))
        
        conn.commit()
        return jsonify({'message': 'Cart updated'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': 'Failed to update cart', 'error': str(e)}), 500
    finally:
        conn.close()

@app.delete('/api/cart/<int:cart_item_id>')
def remove_from_cart(cart_item_id):
    user = get_user_from_session()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db()
    try:
        result = conn.execute('DELETE FROM cart_items WHERE id=? AND user_id=?', 
                            (cart_item_id, user['id']))
        if result.rowcount == 0:
            return jsonify({'message': 'Cart item not found'}), 404
        
        conn.commit()
        return jsonify({'message': 'Item removed from cart'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'message': 'Failed to remove from cart', 'error': str(e)}), 500
    finally:
        conn.close()

# -------- ORDERS (customer) ---------
@app.post('/api/orders')
def create_order():
    user = get_user_from_session()
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
    data = request.get_json(force=True)
    items = data.get('items', [])
    if not items:
        return jsonify({'message': 'No items'}), 400

    conn = get_db()
    try:
        total_amount = 0.0
        # Validate stock and compute totals
        for item in items:
            prod = conn.execute('SELECT id, price, stock FROM products WHERE id=?', (item['product_id'],)).fetchone()
            if not prod:
                raise ValueError('Product not found')
            if prod['stock'] < int(item['quantity']):
                raise ValueError('Insufficient stock')
            total_amount += float(prod['price']) * int(item['quantity'])

        # Create order
        conn.execute('INSERT INTO orders(user_id, total_amount) VALUES(?, ?)', (user['id'], total_amount))
        order_id = conn.lastrowid

        # Add items and decrement stock
        for item in items:
            prod = conn.execute('SELECT price, stock FROM products WHERE id=?', (item['product_id'],)).fetchone()
            qty = int(item['quantity'])
            conn.execute('INSERT INTO order_items(order_id, product_id, quantity, price_each) VALUES(?,?,?,?)', (order_id, item['product_id'], qty, prod['price']))
            conn.execute('UPDATE products SET stock = stock - ? WHERE id=?', (qty, item['product_id']))

        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'message': 'Order failed', 'error': str(e)}), 400
    finally:
        conn.close()

    return jsonify({'message': 'Order placed', 'order_id': order_id, 'total': total_amount})

# -------- ADMIN ---------
@app.get('/api/admin/summary')
def admin_summary():
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    conn = get_db()
    
    # Basic totals
    total_products = conn.execute('SELECT COUNT(*) AS total_products FROM products').fetchone()['total_products']
    total_customers = conn.execute('SELECT COUNT(*) AS total_customers FROM users WHERE role="customer"').fetchone()['total_customers']
    
    # Order statistics
    order_stats = conn.execute('''
        SELECT 
            COUNT(*) AS total_orders,
            COALESCE(SUM(total_amount),0) AS total_revenue,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_orders,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved_orders,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_orders,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) AS delivered_revenue
        FROM orders
    ''').fetchone()
    
    # Cart statistics
    cart_stats = conn.execute('''
        SELECT 
            COUNT(*) AS total_cart_items,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_cart_items,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved_cart_items,
            COALESCE(SUM(ci.quantity * p.price), 0) AS cart_total_value
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
    ''').fetchone()
    
    # Today's statistics
    today_stats = conn.execute('''
        SELECT 
            COUNT(*) AS orders_today,
            COALESCE(SUM(total_amount), 0) AS revenue_today
        FROM orders 
        WHERE DATE(created_at) = DATE('now')
    ''').fetchone()
    
    # Low stock products
    low_stock = conn.execute('SELECT COUNT(*) AS low_stock FROM products WHERE stock <= reorder_level').fetchone()['low_stock']
    
    # Top selling products
    top_products = conn.execute('''
        SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price_each) as revenue
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'delivered'
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 5
    ''').fetchall()
    
    conn.close()
    
    return jsonify({
        'totalProducts': total_products,
        'totalCustomers': total_customers,
        'totalOrders': order_stats['total_orders'],
        'totalRevenue': float(order_stats['total_revenue'] or 0),
        'deliveredRevenue': float(order_stats['delivered_revenue'] or 0),
        'pendingOrders': order_stats['pending_orders'],
        'approvedOrders': order_stats['approved_orders'],
        'deliveredOrders': order_stats['delivered_orders'],
        'totalCartItems': cart_stats['total_cart_items'],
        'pendingCartItems': cart_stats['pending_cart_items'],
        'approvedCartItems': cart_stats['approved_cart_items'],
        'cartTotalValue': float(cart_stats['cart_total_value'] or 0),
        'ordersToday': today_stats['orders_today'],
        'revenueToday': float(today_stats['revenue_today'] or 0),
        'lowStock': low_stock,
        'topProducts': [dict(product) for product in top_products]
    })

@app.get('/api/admin/products')
def admin_products():
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    conn = get_db()
    rows = conn.execute('SELECT id, name, category, price, stock, reorder_level FROM products ORDER BY id').fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.post('/api/admin/products')
def add_product():
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    
    data = request.get_json(force=True)
    name = data.get('name')
    category = data.get('category', 'General')
    price = data.get('price')
    stock = data.get('stock', 0)
    reorder_level = data.get('reorder_level', 5)
    
    if not name or not price:
        return jsonify({'message': 'Name and price are required'}), 400
    
    try:
        price = float(price)
        stock = int(stock)
        reorder_level = int(reorder_level)
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid price, stock, or reorder_level'}), 400
    
    conn = get_db()
    try:
        conn.execute('INSERT INTO products(name, category, price, stock, reorder_level) VALUES(?,?,?,?,?)',
                    (name, category, price, stock, reorder_level))
        conn.commit()
        product_id = conn.lastrowid
        conn.close()
        return jsonify({'message': 'Product added successfully', 'product_id': product_id}), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'message': 'Failed to add product', 'error': str(e)}), 500

@app.put('/api/admin/products/<int:product_id>')
def update_product(product_id):
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    
    data = request.get_json(force=True)
    name = data.get('name')
    category = data.get('category')
    price = data.get('price')
    stock = data.get('stock')
    reorder_level = data.get('reorder_level')
    
    conn = get_db()
    try:
        # Check if product exists
        product = conn.execute('SELECT id FROM products WHERE id=?', (product_id,)).fetchone()
        if not product:
            conn.close()
            return jsonify({'message': 'Product not found'}), 404
        
        # Build update query dynamically
        updates = []
        params = []
        
        if name is not None:
            updates.append('name = ?')
            params.append(name)
        if category is not None:
            updates.append('category = ?')
            params.append(category)
        if price is not None:
            try:
                price = float(price)
                updates.append('price = ?')
                params.append(price)
            except (ValueError, TypeError):
                conn.close()
                return jsonify({'message': 'Invalid price'}), 400
        if stock is not None:
            try:
                stock = int(stock)
                updates.append('stock = ?')
                params.append(stock)
            except (ValueError, TypeError):
                conn.close()
                return jsonify({'message': 'Invalid stock'}), 400
        if reorder_level is not None:
            try:
                reorder_level = int(reorder_level)
                updates.append('reorder_level = ?')
                params.append(reorder_level)
            except (ValueError, TypeError):
                conn.close()
                return jsonify({'message': 'Invalid reorder_level'}), 400
        
        if not updates:
            conn.close()
            return jsonify({'message': 'No fields to update'}), 400
        
        params.append(product_id)
        query = f'UPDATE products SET {", ".join(updates)} WHERE id = ?'
        conn.execute(query, params)
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product updated successfully'}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'message': 'Failed to update product', 'error': str(e)}), 500

@app.delete('/api/admin/products/<int:product_id>')
def delete_product(product_id):
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    
    conn = get_db()
    try:
        # Check if product exists
        product = conn.execute('SELECT id FROM products WHERE id=?', (product_id,)).fetchone()
        if not product:
            conn.close()
            return jsonify({'message': 'Product not found'}), 404
        
        # Check if product is in any orders
        order_items = conn.execute('SELECT id FROM order_items WHERE product_id=?', (product_id,)).fetchone()
        if order_items:
            conn.close()
            return jsonify({'message': 'Cannot delete product that has been ordered'}), 400
        
        conn.execute('DELETE FROM products WHERE id=?', (product_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'message': 'Failed to delete product', 'error': str(e)}), 500

@app.get('/api/admin/orders')
def admin_orders():
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    conn = get_db()
    orders = conn.execute('''
        SELECT o.id, o.total_amount, o.status, o.created_at, o.updated_at, u.email AS customer
        FROM orders o
        JOIN users u ON u.id = o.user_id
        ORDER BY o.id DESC
    ''').fetchall()
    
    # Fetch items per order
    result_orders = []
    for order in orders:
        order_dict = dict(order)
        items = conn.execute('''
            SELECT p.name, oi.quantity, oi.price_each
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id=?
        ''', (order['id'],)).fetchall()
        order_dict['items'] = [dict(item) for item in items]
        result_orders.append(order_dict)
    
    conn.close()
    return jsonify(result_orders)

@app.get('/api/admin/carts')
def admin_carts():
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    
    conn = get_db()
    carts = conn.execute('''
        SELECT ci.id, ci.quantity, ci.status, ci.created_at, ci.updated_at,
               u.id as user_id, u.name as customer_name, u.email as customer_email,
               p.id as product_id, p.name as product_name, p.price, p.category
        FROM cart_items ci
        JOIN users u ON u.id = ci.user_id
        JOIN products p ON p.id = ci.product_id
        ORDER BY ci.created_at DESC
    ''').fetchall()
    conn.close()
    
    return jsonify([dict(cart) for cart in carts])

@app.get('/api/admin/customers')
def admin_customers():
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    
    conn = get_db()
    customers = conn.execute('''
        SELECT u.id, u.name, u.email, u.created_at,
               COUNT(DISTINCT o.id) as total_orders,
               COUNT(DISTINCT ci.id) as total_cart_items,
               COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        LEFT JOIN cart_items ci ON ci.user_id = u.id
        WHERE u.role = 'customer'
        GROUP BY u.id, u.name, u.email, u.created_at
        ORDER BY u.created_at DESC
    ''').fetchall()
    conn.close()
    
    return jsonify([dict(customer) for customer in customers])

@app.put('/api/admin/cart/<int:cart_item_id>/status')
def update_cart_item_status(cart_item_id):
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    
    data = request.get_json(force=True)
    new_status = data.get('status')
    
    if new_status not in ['pending', 'approved', 'rejected']:
        return jsonify({'message': 'Invalid status'}), 400
    
    conn = get_db()
    try:
        conn.execute('UPDATE cart_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                    (new_status, cart_item_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Cart item status updated'})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'message': 'Failed to update status'}), 500

# -------- CUSTOMER DASHBOARD ---------
@app.get('/api/customer/dashboard')
def customer_dashboard():
    user = get_user_from_session()
    if not user or user.get('role') != 'customer':
        return jsonify({'message': 'Forbidden'}), 403
    
    conn = get_db()
    
    # Get customer's orders with status
    orders = conn.execute('''
        SELECT o.id, o.total_amount, o.status, o.created_at, o.updated_at
        FROM orders o
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    ''', (user['id'],)).fetchall()
    
    # Fetch items for each order
    result_orders = []
    for order in orders:
        order_dict = dict(order)
        items = conn.execute('''
            SELECT p.name, oi.quantity, oi.price_each
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
        ''', (order['id'],)).fetchall()
        order_dict['items'] = [dict(item) for item in items]
        result_orders.append(order_dict)
    
    # Get cart items with status
    cart_items = conn.execute('''
        SELECT ci.id, ci.quantity, ci.status, ci.created_at, ci.updated_at,
               p.id as product_id, p.name, p.price, p.category
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        ORDER BY ci.created_at DESC
    ''', (user['id'],)).fetchall()
    
    # Get summary stats
    stats = conn.execute('''
        SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_orders,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as total_spent
        FROM orders 
        WHERE user_id = ?
    ''', (user['id'],)).fetchone()
    
    # Get cart stats
    cart_stats = conn.execute('''
        SELECT 
            COUNT(*) as total_cart_items,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_cart_items,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_cart_items,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_cart_items,
            COALESCE(SUM(ci.quantity * p.price), 0) as cart_total_value
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
    ''', (user['id'],)).fetchone()
    
    conn.close()
    
    return jsonify({
        'orders': result_orders,
        'cart_items': [dict(item) for item in cart_items],
        'stats': dict(stats),
        'cart_stats': dict(cart_stats)
    })

@app.put('/api/admin/orders/<int:order_id>/status')
def update_order_status(order_id):
    if not require_role('admin'):
        return jsonify({'message': 'Forbidden'}), 403
    
    data = request.get_json(force=True)
    new_status = data.get('status')
    
    if new_status not in ['pending', 'approved', 'rejected', 'shipped', 'delivered']:
        return jsonify({'message': 'Invalid status'}), 400
    
    conn = get_db()
    try:
        conn.execute('UPDATE orders SET status = ? WHERE id = ?', (new_status, order_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Order status updated'})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'message': 'Failed to update status'}), 500

# Static files (serve all existing HTML/CSS/JS)
@app.route('/<path:filename>')
def serve_static(filename):
    if os.path.exists(os.path.join(app.static_folder, filename)):
        return send_from_directory(app.static_folder, filename)
    return 'Not found', 404

if __name__ == '__main__':
    # Helpful in dev: ensure session cookies work cross-site in dev
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)

