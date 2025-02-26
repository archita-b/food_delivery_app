CREATE TYPE item_type_enum AS ENUM ('veg','non-veg','vegan');
CREATE TYPE order_status_enum AS ENUM ('pending','confirmed','cancelled','preparing','out_for_delivery');

CREATE TABLE auth (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY REFERENCES auth(user_id),
    full_name TEXT,
    address TEXT NOT NULL,
    lat_long POINT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE delivery_partners (
    id SERIAL PRIMARY KEY REFERENCES auth(user_id),
    full_name TEXT,
    phone VARCHAR(20) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE kitchens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    lat_long POINT NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type item_type_enum NOT NULL,
    price DECIMAL NOT NULL CHECK (price > 0)
);

CREATE TABLE kitchen_items (
    kitchen_id INTEGER REFERENCES kitchens(id),
    item_id INTEGER REFERENCES items(id),
    stock INTEGER NOT NULL CHECK (stock >= 0), 
    PRIMARY KEY (kitchen_id, item_id)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    delivery_partner_id INTEGER REFERENCES delivery_partners(id),
    kitchen_id INTEGER REFERENCES kitchens(id),
    status order_status_enum DEFAULT 'pending',
    total_price DECIMAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE order_items (
    order_id INTEGER REFERENCES orders(id),
    item_id INTEGER REFERENCES items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL NOT NULL CHECK (price > 0),
    PRIMARY KEY (order_id, item_id)
);