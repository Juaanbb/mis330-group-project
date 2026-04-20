# GreenGrow Garden — data analysis / reporting queries (read-only SELECTs)
# Run after database_creation_queries.sql and sample data (e.g. data_loading_queries.sql).

use mis_330_group_project;

# --- Order summary by status ---
select
    orderstatus,
    count(*) as order_count,
    sum(totalamount) as revenue
from orders
group by orderstatus
order by revenue desc;

# --- Revenue by category (from line items) ---
select
    c.categoryname,
    sum(oi.quantity * oi.unitprice) as line_revenue,
    sum(oi.quantity) as units_sold
from orderitem oi
join product p on oi.productid = p.productid
join category c on p.categoryid = c.categoryid
group by c.categoryid, c.categoryname
order by line_revenue desc;

# --- Top products by line revenue ---
select
    p.productid,
    p.productname,
    sum(oi.quantity * oi.unitprice) as line_revenue,
    sum(oi.quantity) as units_sold
from orderitem oi
join product p on oi.productid = p.productid
group by p.productid, p.productname
order by line_revenue desc
limit 10;

# --- Customer spend ranking ---
select
    c.customerid,
    concat(c.firstname, ' ', c.lastname) as customer_name,
    count(o.orderid) as order_count,
    sum(o.totalamount) as total_spent
from customer c
join orders o on c.customerid = o.customerid
group by c.customerid, c.firstname, c.lastname
order by total_spent desc;

# --- Employee workload (orders handled) ---
select
    e.employeeid,
    concat(e.firstname, ' ', e.lastname) as employee_name,
    e.role,
    count(o.orderid) as orders_handled,
    sum(o.totalamount) as order_revenue
from employee e
join orders o on e.employeeid = o.employeeid
group by e.employeeid, e.firstname, e.lastname, e.role
order by orders_handled desc;

# --- Low-stock active products ---
select
    p.productid,
    p.productname,
    p.sku,
    c.categoryname,
    p.quantityonhand,
    p.reorderlevel
from product p
join category c on p.categoryid = c.categoryid
where p.isactive
  and p.quantityonhand <= p.reorderlevel
order by p.quantityonhand asc;

# --- Monthly sales trend ---
select
    date_format(o.orderdate, '%Y-%m') as month,
    count(*) as order_count,
    sum(o.totalamount) as revenue
from orders o
group by date_format(o.orderdate, '%Y-%m')
order by month;

# --- Inventory transactions by type ---
select
    it.transactiontype,
    count(*) as transaction_count,
    sum(it.quantitychange) as net_quantity_change
from inventorytransaction it
group by it.transactiontype
order by transaction_count desc;

# --- Inventory activity by product ---
select
    p.productid,
    p.productname,
    count(it.transactionid) as transaction_count,
    sum(it.quantitychange) as net_quantity_change
from inventorytransaction it
join product p on it.productid = p.productid
group by p.productid, p.productname
order by transaction_count desc;
