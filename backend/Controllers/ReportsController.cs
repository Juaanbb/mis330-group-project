using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;

namespace GreenGrow.Controllers;

[ApiController]
[Route("reports")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    // GET /reports/order-status
    [HttpGet("order-status")]
    public async Task<IActionResult> OrderStatus()
    {
        var result = await _db.Orders
            .GroupBy(o => o.OrderStatus)
            .Select(g => new
            {
                status  = g.Key,
                count   = g.Count(),
                revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderByDescending(x => x.revenue)
            .ToListAsync();

        return Ok(result);
    }

    // GET /reports/revenue-by-category
    [HttpGet("revenue-by-category")]
    public async Task<IActionResult> RevenueByCategory()
    {
        var items = await (
            from oi in _db.OrderItems
            join p in _db.Products on oi.ProductId equals p.ProductId
            join c in _db.Categories on p.CategoryId equals c.CategoryId into catGroup
            from c in catGroup.DefaultIfEmpty()
            select new
            {
                category = c != null ? c.CategoryName : "Uncategorized",
                revenue  = oi.Quantity * oi.UnitPrice,
                qty      = oi.Quantity
            }
        ).ToListAsync();

        var result = items
            .GroupBy(x => x.category)
            .Select(g => new
            {
                category  = g.Key,
                unitsSold = g.Sum(x => x.qty),
                revenue   = g.Sum(x => x.revenue)
            })
            .OrderByDescending(x => x.revenue)
            .ToList();

        return Ok(result);
    }

    // GET /reports/top-products
    [HttpGet("top-products")]
    public async Task<IActionResult> TopProducts()
    {
        var items = await (
            from oi in _db.OrderItems
            join p in _db.Products on oi.ProductId equals p.ProductId
            select new { p.ProductId, p.ProductName, oi.Quantity, Revenue = oi.Quantity * oi.UnitPrice }
        ).ToListAsync();

        var result = items
            .GroupBy(x => new { x.ProductId, x.ProductName })
            .Select(g => new
            {
                id        = g.Key.ProductId,
                name      = g.Key.ProductName,
                unitsSold = g.Sum(x => x.Quantity),
                revenue   = g.Sum(x => x.Revenue)
            })
            .OrderByDescending(x => x.revenue)
            .Take(10)
            .ToList();

        return Ok(result);
    }

    // GET /reports/customer-spend
    [HttpGet("customer-spend")]
    public async Task<IActionResult> CustomerSpend()
    {
        var items = await (
            from o in _db.Orders
            join c in _db.Customers on o.CustomerId equals c.CustomerId
            select new { c.CustomerId, FirstName = c.FirstName, LastName = c.LastName, o.OrderId, o.TotalAmount }
        ).ToListAsync();

        var result = items
            .GroupBy(x => new { x.CustomerId, x.FirstName, x.LastName })
            .Select(g => new
            {
                customerId  = g.Key.CustomerId,
                name        = g.Key.FirstName + " " + g.Key.LastName,
                orderCount  = g.Count(),
                totalSpent  = g.Sum(x => x.TotalAmount)
            })
            .OrderByDescending(x => x.totalSpent)
            .ToList();

        return Ok(result);
    }

    // GET /reports/employee-workload
    [HttpGet("employee-workload")]
    public async Task<IActionResult> EmployeeWorkload()
    {
        var items = await (
            from o in _db.Orders
            join e in _db.Employees on o.EmployeeId equals e.EmployeeId into empGroup
            from e in empGroup.DefaultIfEmpty()
            select new { e.EmployeeId, FirstName = e.FirstName, LastName = e.LastName, e.Role, o.OrderId, o.TotalAmount }
        ).ToListAsync();

        var result = items
            .GroupBy(x => new { x.EmployeeId, x.FirstName, x.LastName, x.Role })
            .Select(g => new
            {
                employeeId     = g.Key.EmployeeId,
                name           = g.Key.FirstName + " " + g.Key.LastName,
                role           = g.Key.Role,
                ordersHandled  = g.Count(),
                orderRevenue   = g.Sum(x => x.TotalAmount)
            })
            .OrderByDescending(x => x.ordersHandled)
            .ToList();

        return Ok(result);
    }

    // GET /reports/low-stock
    [HttpGet("low-stock")]
    public async Task<IActionResult> LowStock()
    {
        var result = await (
            from p in _db.Products.Where(p => p.IsActive && p.QuantityOnHand <= p.ReorderLevel)
            join c in _db.Categories on p.CategoryId equals c.CategoryId into catGroup
            from c in catGroup.DefaultIfEmpty()
            select new
            {
                id           = p.ProductId,
                name         = p.ProductName,
                sku          = p.Sku ?? "",
                category     = c != null ? c.CategoryName : "",
                quantity     = p.QuantityOnHand,
                reorderLevel = p.ReorderLevel
            }
        ).OrderBy(x => x.quantity).ToListAsync();

        return Ok(result);
    }

    // GET /reports/monthly-sales
    [HttpGet("monthly-sales")]
    public async Task<IActionResult> MonthlySales()
    {
        var orders = await _db.Orders
            .Select(o => new { o.OrderDate, o.TotalAmount })
            .ToListAsync();

        var result = orders
            .GroupBy(o => o.OrderDate.ToString("yyyy-MM"))
            .Select(g => new
            {
                month      = g.Key,
                orderCount = g.Count(),
                revenue    = g.Sum(x => x.TotalAmount)
            })
            .OrderBy(x => x.month)
            .ToList();

        return Ok(result);
    }

    // GET /reports/inventory-by-type
    [HttpGet("inventory-by-type")]
    public async Task<IActionResult> InventoryByType()
    {
        var result = await _db.InventoryTransactions
            .GroupBy(t => t.TransactionType)
            .Select(g => new
            {
                type             = g.Key,
                transactionCount = g.Count(),
                netQtyChange     = g.Sum(t => t.QuantityChange)
            })
            .OrderByDescending(x => x.transactionCount)
            .ToListAsync();

        return Ok(result);
    }

    // GET /reports/inventory-by-product
    [HttpGet("inventory-by-product")]
    public async Task<IActionResult> InventoryByProduct()
    {
        var items = await (
            from t in _db.InventoryTransactions
            join p in _db.Products on t.ProductId equals p.ProductId
            select new { p.ProductId, p.ProductName, t.TransactionId, t.QuantityChange }
        ).ToListAsync();

        var result = items
            .GroupBy(x => new { x.ProductId, x.ProductName })
            .Select(g => new
            {
                productId        = g.Key.ProductId,
                name             = g.Key.ProductName,
                transactionCount = g.Count(),
                netQtyChange     = g.Sum(x => x.QuantityChange)
            })
            .OrderByDescending(x => x.transactionCount)
            .ToList();

        return Ok(result);
    }
}
