CREATE TYPE role_enum AS ENUM ('customer','delivery_partner');
CREATE TYPE item_type_enum AS ENUM ('veg','non-veg','vegan');
CREATE TYPE order_status_enum AS ENUM ('pending','confirmed','cancelled','preparing','out_for_delivery');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role role_enum NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE kitchens (
    id SERIAL PRIMARY KEY,
    branch VARCHAR(255) NOT NULL
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    kitchen_id INTEGER REFERENCES kitchens(id),
    name VARCHAR(255) NOT NULL,
    type item_type_enum NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    kitchen_id INTEGER REFERENCES kitchens(id)
    status order_status_enum DEFAULT 'pending',
    total_price DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE order_items (
    order_id INTEGER REFERENCES orders(id),
    item_id INTEGER REFERENCES items(id)
    num_of_items INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL
);