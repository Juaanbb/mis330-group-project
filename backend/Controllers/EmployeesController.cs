using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;
using GreenGrow.Models;

namespace GreenGrow.Controllers;

[ApiController]
[Route("employees")]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _db;
    public EmployeesController(AppDbContext db) => _db = db;

    // GET /employees
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var employees = await _db.Employees
            .Select(e => new
            {
                id       = e.EmployeeId,
                name     = e.FirstName + " " + e.LastName,
                email    = e.Email,
                phone    = e.PhoneNumber ?? "",
                role     = e.Role,
                hireDate = e.HireDate.ToString("yyyy-MM-dd"),
                isActive = e.IsActive
            })
            .ToListAsync();

        return Ok(employees);
    }

    // POST /employees
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveEmployeeRequest req)
    {
        var parts = (req.Name ?? "").Trim().Split(' ', 2);
        var employee = new Employee
        {
            FirstName   = parts[0],
            LastName    = parts.Length > 1 ? parts[1] : "",
            Email       = req.Email ?? "",
            PhoneNumber = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone,
            Role        = req.Role ?? "",
            HireDate    = DateTime.UtcNow,
            IsActive    = true
        };

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        return Created($"/employees/{employee.EmployeeId}", new { id = employee.EmployeeId });
    }

    // PUT /employees/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveEmployeeRequest req)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        var parts = (req.Name ?? "").Trim().Split(' ', 2);
        employee.FirstName   = parts[0];
        employee.LastName    = parts.Length > 1 ? parts[1] : "";
        employee.Email       = req.Email ?? employee.Email;
        employee.PhoneNumber = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone;
        employee.Role        = req.Role ?? employee.Role;

        await _db.SaveChangesAsync();
        return Ok(new { id = employee.EmployeeId });
    }

    // DELETE /employees/{id} — soft delete (sets isactive = false)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        employee.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record SaveEmployeeRequest(string? Name, string? Email, string? Phone, string? Role);
