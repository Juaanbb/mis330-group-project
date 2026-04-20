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

    // GET /products — return all active products with their category name
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await (
            from p in _db.Products.Where(p => p.IsActive)
            join c in _db.Categories on p.CategoryId equals c.CategoryId into catGroup
            from c in catGroup.DefaultIfEmpty()
            select new
            {
                id       = p.ProductId,
                name     = p.ProductName,
                category = c != null ? c.CategoryName : "",
                price    = p.Price,
                quantity = p.QuantityOnHand
            }
        ).ToListAsync();

        return Ok(products);
    }

    // POST /products — add a new product
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest req)
    {
        var product = new Product
        {
            ProductName    = req.Name ?? "",
            Price          = req.Price,
            QuantityOnHand = req.Quantity,
            ReorderLevel   = 5,
            IsActive       = true
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return Created($"/products/{product.ProductId}", new { id = product.ProductId });
    }
}

public record CreateProductRequest(string? Name, decimal Price, int Quantity);
