using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenGrow.Models;

[Table("product")]
public class Product
{
    [Key]
    [Column("productid")]
    public int ProductId { get; set; }

    [Column("productname")]
    public string ProductName { get; set; } = "";

    [Column("productdescription")]
    public string? ProductDescription { get; set; }

    [Column("price")]
    public decimal Price { get; set; }

    [Column("sku")]
    public string? Sku { get; set; }

    [Column("quantityonhand")]
    public int QuantityOnHand { get; set; }

    [Column("reorderlevel")]
    public int ReorderLevel { get; set; }

    [Column("isactive")]
    public bool IsActive { get; set; } = true;

    [Column("categoryid")]
    public int? CategoryId { get; set; }
}
