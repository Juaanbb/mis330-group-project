using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenGrow.Models;

[Table("orderitem")]
public class OrderItem
{
    [Key]
    [Column("orderitemid")]
    public int OrderItemId { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    [Column("unitprice")]
    public decimal UnitPrice { get; set; }

    [Column("orderid")]
    public int OrderId { get; set; }

    [Column("productid")]
    public int ProductId { get; set; }
}
