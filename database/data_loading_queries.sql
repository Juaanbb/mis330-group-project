use mis_330_group_project;

-- CATEGORY
insert into category (categoryname, categorydescription) values
('Plants', 'Live plants'),
('Tools', 'Gardening tools'),
('Soil', 'Soil and fertilizers'),
('Accessories', 'Garden accessories'),
('Seeds', 'Plant seeds');

-- CUSTOMER
insert into customer (firstname, lastname, email, phonenumber, password, createddate) values
('Juan', 'Baltazar', 'juan@email.com', '2051234567', '123', '2026-04-01'),
('Maria', 'Lopez', 'maria@email.com', '2059876543', '123', '2026-04-02'),
('Carlos', 'Garcia', 'carlos@email.com', null, '123', '2026-04-03'),
('Ana', 'Martinez', 'ana@email.com', '2055556666', '123', '2026-04-04'),
('Luis', 'Hernandez', 'luis@email.com', '2057778888', '123', '2026-04-05');

-- EMPLOYEE
insert into employee (firstname, lastname, email, phonenumber, role, hiredate, isactive, password) values
('John', 'Smith', 'john@email.com', '2051112222', 'Manager', '2025-01-01', true, '123'),
('Sara', 'Lee', 'sara@email.com', '2053334444', 'Sales Associate', '2025-06-01', true, '123'),
('Mike', 'Brown', 'mike@email.com', '2059990000', 'Stock Associate', '2025-03-15', true, '123'),
('Emma', 'Davis', 'emma@email.com', '2052223333', 'Cashier', '2025-07-10', true, '123'),
('Noah', 'Wilson', 'noah@email.com', '2054445555', 'Manager', '2024-11-20', true, '123');

-- PRODUCT
insert into product (productname, productdescription, price, sku, quantityonhand, reorderlevel, isactive, categoryid) values
('Rose Bush', 'Red flowering plant', 19.99, 'PLT001', 15, 5, true, 1),
('Tulip Pack', 'Pack of tulip bulbs', 9.99, 'PLT002', 30, 10, true, 1),
('Garden Shovel', 'Metal shovel for gardening', 14.50, 'TLS001', 8, 3, true, 2),
('Potting Soil', 'Nutrient-rich soil bag', 12.00, 'SOL001', 20, 5, true, 3),
('Watering Can', 'Plastic watering can', 11.75, 'ACC001', 6, 2, true, 4);

-- ORDERS
insert into orders (orderdate, orderstatus, totalamount, address, city, state, zipcode, customerid, employeeid) values
('2026-04-10', 'Completed', 29.98, '123 Oak St', 'Tuscaloosa', 'AL', '35401', 1, 1),
('2026-04-11', 'Pending', 14.50, '456 Pine Ave', 'Birmingham', 'AL', '35203', 2, 2),
('2026-04-12', 'Completed', 31.99, '789 Cedar Rd', 'Huntsville', 'AL', '35801', 3, 3),
('2026-04-13', 'Shipped', 12.00, '101 Maple Dr', 'Mobile', 'AL', '36602', 4, 4),
('2026-04-14', 'Completed', 11.75, '202 Birch Ln', 'Montgomery', 'AL', '36104', 5, 5);

-- ORDERITEM
insert into orderitem (quantity, unitprice, orderid, productid) values
(2, 19.99, 1, 1),   -- 2 Rose Bush
(1, 14.50, 2, 3),   -- 1 Garden Shovel
(1, 9.99, 3, 2),    -- 1 Tulip Pack
(1, 12.00, 4, 4),   -- 1 Potting Soil
(1, 11.75, 5, 5);   -- 1 Watering Can

-- INVENTORYTRANSACTION
insert into inventorytransaction (transactiontype, transactiondate, quantitychange, notes, productid, employeeid) values
('SALE', '2026-04-10', -2, 'Order 1 sale', 1, 1),
('SALE', '2026-04-11', -1, 'Order 2 sale', 3, 2),
('SALE', '2026-04-12', -1, 'Order 3 sale', 2, 3),
('RESTOCK', '2026-04-13', 10, 'New stock arrived', 5, 4),
('ADJUSTMENT', '2026-04-14', -2, 'Damaged items removed', 4, 5);