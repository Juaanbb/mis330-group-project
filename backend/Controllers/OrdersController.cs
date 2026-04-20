using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;
using GreenGrow.Models;

namespace GreenGrow.Controllers;

[ApiController]
[Route("orders")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public OrdersController(AppDbContext db) => _db = db;

    // GET /orders — return all orders, newest first
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _db.Orders
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new
            {
                id          = o.OrderId,
                customerId  = o.CustomerId,
                orderDate   = o.OrderDate.ToString("yyyy-MM-dd"),
                orderStatus = o.OrderStatus,
                totalAmount = o.TotalAmount
            })
            .ToListAsync();

        return Ok(orders);
    }

    // POST /orders — create a new order
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req)
    {
        var order = new Order
        {
            CustomerId  = req.CustomerId,
            OrderDate   = DateTime.UtcNow,
            OrderStatus = "Pending",
            TotalAmount = 0,
            Address     = req.Address,
            City        = req.City
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        return Created($"/orders/{order.OrderId}", new { id = order.OrderId });
    }
}

public record CreateOrderRequest(int CustomerId, string? Address, string? City);
