-- Reviews table for coffee shop
-- This table stores product reviews from users

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id) -- Prevent duplicate reviews from same user
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Sample reviews (optional)
-- Note: Make sure user IDs and product IDs exist in your database
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES 
(1, 1, 5, 'Best espresso in town! Rich and smooth.'),
(1, 2, 4, 'Great cappuccino, perfect foam ratio.')
ON CONFLICT (user_id, product_id) DO NOTHING;

