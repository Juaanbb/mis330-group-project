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

    // GET /orders
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

    // POST /orders
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

    // PUT /orders/{id} — update status
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateOrderRequest req)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.OrderStatus = req.OrderStatus ?? order.OrderStatus;

        await _db.SaveChangesAsync();
        return Ok(new { id = order.OrderId });
    }

    // DELETE /orders/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateOrderRequest(int CustomerId, string? Address, string? City);
public record UpdateOrderRequest(string? OrderStatus);
