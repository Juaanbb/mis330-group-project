using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;

namespace GreenGrow.Controllers;

[ApiController]
[Route("inventory")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;
    public InventoryController(AppDbContext db) => _db = db;

    // GET /inventory — return stock levels for all active products
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var inventory = await _db.Products
            .Where(p => p.IsActive)
            .Select(p => new
            {
                productId    = p.ProductId,
                name         = p.ProductName,
                quantity     = p.QuantityOnHand,
                reorderLevel = p.ReorderLevel
            })
            .ToListAsync();

        return Ok(inventory);
    }
}
