CREATE TYPE item_type_enum AS ENUM ('veg','non-veg','vegan');
CREATE TYPE order_status_enum AS ENUM ('pending','confirmed','cancelled','preparing','out_for_delivery');

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    full_name TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL
);

CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    full_name TEXT,
    phone VARCHAR(20) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE kitchens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
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
    is_available BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (kitchen_id, item_id)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    kitchen_id INTEGER REFERENCES kitchens(id),
    driver_id INTEGER REFERENCES drivers(id),
    status order_status_enum DEFAULT 'pending',
    total_price DECIMAL DEFAULT 0
);

CREATE TABLE order_items (
    order_id INTEGER REFERENCES orders(id),
    kitchen_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    num_of_items INTEGER NOT NULL CHECK (num_of_items > 0),
    price DECIMAL NOT NULL CHECK (price > 0),
    FOREIGN KEY (kitchen_id, item_id) REFERENCES kitchen_items(kitchen_id, item_id),
    PRIMARY KEY (order_id, kitchen_id, item_id)
);