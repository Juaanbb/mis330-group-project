using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;
using GreenGrow.Models;

namespace GreenGrow.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuthController(AppDbContext db) => _db = db;

    // POST /auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Email == req.Email && c.Password == req.Password);

        if (customer == null)
            return Unauthorized("Invalid email or password.");

        return Ok(new
        {
            id    = customer.CustomerId,
            name  = customer.FirstName + " " + customer.LastName,
            email = customer.Email
        });
    }

    // POST /auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (await _db.Customers.AnyAsync(c => c.Email == req.Email))
            return Conflict("An account with that email already exists.");

        var parts = (req.Name ?? "").Trim().Split(' ', 2);
        var customer = new Customer
        {
            FirstName   = parts[0],
            LastName    = parts.Length > 1 ? parts[1] : "",
            Email       = req.Email ?? "",
            Password    = req.Password ?? "",
            PhoneNumber = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone,
            CreatedDate = DateTime.UtcNow
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return Created($"/customers/{customer.CustomerId}", new
        {
            id    = customer.CustomerId,
            name  = customer.FirstName + " " + customer.LastName,
            email = customer.Email
        });
    }
}

public record LoginRequest(string? Email, string? Password);
public record RegisterRequest(string? Name, string? Email, string? Password, string? Phone);
