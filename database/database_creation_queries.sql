# shippingaddress split into address, city, state, and zipcode for better  querying
# linetotal dropped from orderitem since it can be derived from quantity x unitprice
# employeeid added to orders so we can track which employee handled which order
# phonenumber in customer is nullable since customers may not always provide one at signup
# a few fk constraint names simplified

create database mis_330_group_project;
use mis_330_group_project;

create table customer (
	customerid int not null auto_increment primary key,
    firstname varchar(50) not null,
    lastname varchar(50) not null,
    email varchar(100) not null unique,
    phonenumber varchar(20),
    password varchar(255) not null,
    createddate date not null
);

create table employee (
	employeeid int not null auto_increment primary key,
    firstname varchar(50) not null,
    lastname varchar(50) not null,
    email varchar(100) not null unique,
    phonenumber varchar(20) not null,
    role varchar(50) not null,
    hiredate date not null,
    isactive bool not null
);

create table orders (
    orderid int not null auto_increment primary key,
    orderdate date not null,
    orderstatus varchar(50) not null,
    totalamount decimal(10,2) not null,
    -- I went ahead and split up shippingaddress to address, city, state, and zipcode
    address varchar(255) not null,
    city varchar(100) not null,
    state varchar(50) not null,
    zipcode varchar(10) not null,
    customerid int not null,
    -- added employeeid so we can see which employees handled which orders
    employeeid int not null,

    constraint fk_customerid foreign key (customerid) references customer(customerid),
	constraint fk_employeeid foreign key (employeeid) references employee(employeeid)
);
create table category (
	categoryid int not null auto_increment primary key,
    categoryname varchar(50) not null,
    categorydescription varchar(255) not null
);

create table product (
	productid int not null auto_increment primary key,
    productname varchar(50) not null,
    productdescription varchar(255) not null,
    price decimal(10,2) not null,
    sku varchar(50) not null unique,
    quantityonhand int not null,
    reorderlevel int not null,
    isactive bool not null,
    categoryid int not null,

    constraint fk_categoryid foreign key (categoryid) references category(categoryid)
);

create table orderitem (
	orderitemid int not null auto_increment primary key,
    quantity int not null,
    unitprice decimal(10,2) not null,
    -- linetotal decimal(10,2) not null,
    -- dropped this since it can be dervied from quantity and unit price
    orderid int not null,
    productid int not null,

    constraint fk_orderid foreign key (orderid) references orders(orderid),
    constraint fk_productid foreign key (productid) references product(productid)
);

create table inventorytransaction (
	transactionid int not null auto_increment primary key,
    transactiontype varchar(50) not null,
    transactiondate date not null,
    quantitychange int not null,
    notes varchar(255), -- optional
    productid int not null,
    employeeid int not null,

    -- fk_productid already used in orderitem
    -- fk_employeeid already used in orders
    constraint fk_productid_it foreign key (productid) references product(productid),
    constraint fk_employeeid_it foreign key (employeeid) references employee(employeeid)
);