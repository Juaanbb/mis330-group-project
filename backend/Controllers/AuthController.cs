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

    // POST /auth/login — customer login only
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
            email = customer.Email,
            type  = "customer"
        });
    }

    // POST /auth/register — customer registration
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
            email = customer.Email,
            type  = "customer"
        });
    }

    // POST /auth/employee-login — employee and admin login only
    [HttpPost("employee-login")]
    public async Task<IActionResult> EmployeeLogin([FromBody] LoginRequest req)
    {
        // Hardcoded admin account for testing
        if (req.Email == "admin" && req.Password == "password")
        {
            return Ok(new
            {
                id    = 0,
                name  = "Admin",
                email = "admin",
                role  = "Manager",
                type  = "employee"
            });
        }

        var employee = await _db.Employees
            .FirstOrDefaultAsync(e => e.Email == req.Email && e.Password == req.Password && e.IsActive);

        if (employee == null)
            return Unauthorized("Invalid employee credentials.");

        return Ok(new
        {
            id    = employee.EmployeeId,
            name  = employee.FirstName + " " + employee.LastName,
            email = employee.Email,
            role  = employee.Role,
            type  = "employee"
        });
    }
}

public record LoginRequest(string? Email, string? Password);
public record RegisterRequest(string? Name, string? Email, string? Password, string? Phone);
