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
            .OrderBy(o => o.OrderId)
            .Select(o => new
            {
                id          = o.OrderId,
                customerId  = o.CustomerId,
                employeeId  = o.EmployeeId,
                orderDate   = o.OrderDate.ToString("yyyy-MM-dd"),
                orderStatus = o.OrderStatus,
                totalAmount = o.TotalAmount
            })
            .ToListAsync();

        return Ok(orders);
    }

    // GET /orders/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var o = await _db.Orders.FindAsync(id);
        if (o == null) return NotFound();

        return Ok(new
        {
            id          = o.OrderId,
            customerId  = o.CustomerId,
            employeeId  = o.EmployeeId,
            orderDate   = o.OrderDate.ToString("yyyy-MM-dd"),
            orderStatus = o.OrderStatus,
            totalAmount = o.TotalAmount,
            address     = o.Address,
            city        = o.City,
            state       = o.State,
            zipcode     = o.ZipCode
        });
    }

    // POST /orders
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req)
    {
        var items = req.Items ?? new List<OrderItemRequest>();
        var total = items.Sum(i => i.Quantity * i.UnitPrice);

        var order = new Order
        {
            CustomerId  = req.CustomerId,
            EmployeeId  = req.EmployeeId,
            OrderDate   = DateTime.UtcNow,
            OrderStatus = "Pending",
            TotalAmount = total,
            Address     = req.Address ?? "",
            City        = req.City ?? "",
            State       = req.State ?? "",
            ZipCode     = req.Zipcode ?? ""
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        foreach (var item in items)
        {
            _db.OrderItems.Add(new OrderItem
            {
                OrderId   = order.OrderId,
                ProductId = item.ProductId,
                Quantity  = item.Quantity,
                UnitPrice = item.UnitPrice
            });

            var product = await _db.Products.FindAsync(item.ProductId);
            if (product != null)
                product.QuantityOnHand = Math.Max(0, product.QuantityOnHand - item.Quantity);
        }

        await _db.SaveChangesAsync();

        return Created($"/orders/{order.OrderId}", new { id = order.OrderId });
    }

    // PUT /orders/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateOrderRequest req)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        if (req.OrderStatus != null)  order.OrderStatus = req.OrderStatus;
        if (req.CustomerId.HasValue)  order.CustomerId  = req.CustomerId.Value;
        if (req.EmployeeId.HasValue)  order.EmployeeId  = req.EmployeeId.Value == 0 ? null : req.EmployeeId.Value;
        if (req.Address  != null)     order.Address     = req.Address;
        if (req.City     != null)     order.City        = req.City;
        if (req.State    != null)     order.State       = req.State;
        if (req.Zipcode  != null)     order.ZipCode     = req.Zipcode;

        await _db.SaveChangesAsync();
        return Ok(new { id = order.OrderId });
    }

    // DELETE /orders/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        var items = _db.OrderItems.Where(i => i.OrderId == id);
        _db.OrderItems.RemoveRange(items);
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record OrderItemRequest(int ProductId, int Quantity, decimal UnitPrice);
public record CreateOrderRequest(int CustomerId, int? EmployeeId, string? Address, string? City, string? State, string? Zipcode, List<OrderItemRequest>? Items);
public record UpdateOrderRequest(string? OrderStatus, int? CustomerId, int? EmployeeId, string? Address, string? City, string? State, string? Zipcode);
