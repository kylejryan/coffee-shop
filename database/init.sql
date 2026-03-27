-- Coffee Shop Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_price CHECK (price > 0),
    CONSTRAINT non_negative_stock CHECK (stock_quantity >= 0)
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Insert admin user (password: admin123)
INSERT INTO users (email, password, role) VALUES 
('admin@coffeeshop.com', '$2b$10$JFOxpAPWAXV1CgS/TmHzAOMcVCGopdJxSzOSTv023t.kTCcNj1OLi', 'admin');

-- Insert sample products
INSERT INTO products (name, description, price, image_url, stock_quantity) VALUES 
('Espresso', 'Rich and bold espresso shot', 2.50, NULL, 100),
('Cappuccino', 'Espresso with steamed milk and foam', 4.25, NULL, 50),
('Latte', 'Smooth espresso with steamed milk', 4.75, NULL, 75),
('Americano', 'Espresso with hot water', 3.50, NULL, 60),
('Mocha', 'Espresso with chocolate and steamed milk', 5.25, NULL, 40),
('Cold Brew', 'Smooth cold-brewed coffee', 3.75, NULL, 30),
('Croissant', 'Buttery French pastry', 3.00, NULL, 25),
('Blueberry Muffin', 'Fresh blueberry muffin', 2.75, NULL, 20);
