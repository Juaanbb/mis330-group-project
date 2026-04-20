using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;
using GreenGrow.Models;

namespace GreenGrow.Controllers;

[ApiController]
[Route("inventory")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;
    public InventoryController(AppDbContext db) => _db = db;

    // GET /inventory
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

    // POST /inventory/restock — add stock and log the transaction
    [HttpPost("restock")]
    public async Task<IActionResult> Restock([FromBody] RestockRequest req)
    {
        var product = await _db.Products.FindAsync(req.ProductId);
        if (product == null) return NotFound("Product not found.");

        product.QuantityOnHand += req.Quantity;

        var transaction = new InventoryTransaction
        {
            ProductId       = req.ProductId,
            TransactionType = "RESTOCK",
            TransactionDate = DateTime.UtcNow,
            QuantityChange  = req.Quantity,
            Notes           = req.Notes
        };

        _db.InventoryTransactions.Add(transaction);
        await _db.SaveChangesAsync();

        return Ok(new { productId = product.ProductId, newQuantity = product.QuantityOnHand });
    }
}

public record RestockRequest(int ProductId, int Quantity, string? Notes);
