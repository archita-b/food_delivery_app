-- customers table
INSERT INTO customers (full_name, address, lat_long, phone) VALUES 
    ('Akshay Gupta', 
    'Lakkasandra - Bengaluru',
    POINT(12.94155925165077, 77.60085080989724), 
    '7983252146');

-- kitchens table
INSERT INTO kitchens (name,address,lat_long,opening_time,closing_time) VALUES
       ('Dominos-Koramangla',
       'Koramangla - Bengaluru',
       POINT(12.940545270929217, 77.62489812523958),
       '08:00', '22:00');


-- items table
INSERT INTO items (name, type, price) VALUES 
    ('Happy Pizza', 'veg', 12.99),
    ('Protato Pizza', 'non-veg', 15.99),
    ('Vegan Burger', 'vegan', 10.50);


-- kitchen_items table
INSERT INTO kitchen_items (kitchen_id,item_id,stock) VALUES
            (1,1,10),
            (1,2,8),
            (1,3,12);


-- delivery_partners table
INSERT INTO delivery_partners (full_name,phone) VALUES 
    ('Manjunath Yadav', '9876543210');