using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;
using GreenGrow.Models;

namespace GreenGrow.Controllers;

[ApiController]
[Route("customers")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomersController(AppDbContext db) => _db = db;

    // GET /customers — return all customers
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var customers = await _db.Customers
            .Select(c => new
            {
                id    = c.CustomerId,
                name  = c.FirstName + " " + c.LastName,
                email = c.Email,
                phone = c.PhoneNumber ?? ""
            })
            .ToListAsync();

        return Ok(customers);
    }

    // POST /customers — add a new customer
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest req)
    {
        var parts = (req.Name ?? "").Trim().Split(' ', 2);
        var customer = new Customer
        {
            FirstName   = parts[0],
            LastName    = parts.Length > 1 ? parts[1] : "",
            Email       = req.Email ?? "",
            PhoneNumber = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone,
            Password    = "",
            CreatedDate = DateTime.UtcNow
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return Created($"/customers/{customer.CustomerId}", new { id = customer.CustomerId });
    }
}

public record CreateCustomerRequest(string? Name, string? Email, string? Phone);
