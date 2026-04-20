using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;
using GreenGrow.Models;

namespace GreenGrow.Controllers;

[ApiController]
[Route("products")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductsController(AppDbContext db) => _db = db;

    // GET /products
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await (
            from p in _db.Products.Where(p => p.IsActive)
            join c in _db.Categories on p.CategoryId equals c.CategoryId into catGroup
            from c in catGroup.DefaultIfEmpty()
            select new
            {
                id         = p.ProductId,
                name       = p.ProductName,
                category   = c != null ? c.CategoryName : "",
                categoryId = p.CategoryId,
                price      = p.Price,
                quantity   = p.QuantityOnHand
            }
        ).ToListAsync();

        return Ok(products);
    }

    // POST /products
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveProductRequest req)
    {
        var product = new Product
        {
            ProductName    = req.Name ?? "",
            Price          = req.Price,
            QuantityOnHand = req.Quantity,
            CategoryId     = req.CategoryId,
            ReorderLevel   = 5,
            IsActive       = true
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return Created($"/products/{product.ProductId}", new { id = product.ProductId });
    }

    // PUT /products/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveProductRequest req)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.ProductName    = req.Name ?? product.ProductName;
        product.Price          = req.Price;
        product.QuantityOnHand = req.Quantity;
        product.CategoryId     = req.CategoryId;

        await _db.SaveChangesAsync();
        return Ok(new { id = product.ProductId });
    }

    // DELETE /products/{id} — soft delete
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record SaveProductRequest(string? Name, decimal Price, int Quantity, int? CategoryId);
