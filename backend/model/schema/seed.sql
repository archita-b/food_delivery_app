-- customers table
INSERT INTO customers (full_name, address, phone) VALUES 
('Customer One', POINT(37.794929, -122.399416), '9876543210');

-- kitchens table
INSERT INTO kitchens (name,address,opening_time,closing_time) VALUES
       ('Dominos',POINT(37.774500, -122.418500),'08:00', '22:00');


-- items table
INSERT INTO items (name, type, price) VALUES 
    ('Margherita Pizza', 'veg', 12.99),
    ('Pepperoni Pizza', 'non-veg', 15.99),
    ('Vegan Burger', 'vegan', 10.50);


-- kitchen_items table
INSERT INTO kitchen_items (kitchen_id,item_id) VALUES
            (1,1),
            (1,2),
            (1,3);


-- drivers table
INSERT INTO drivers (full_name,phone) VALUES 
    ('Driver One', '1234567890');