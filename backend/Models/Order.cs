using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenGrow.Models;

[Table("orders")]
public class Order
{
    [Key]
    [Column("orderid")]
    public int OrderId { get; set; }

    [Column("orderdate")]
    public DateTime OrderDate { get; set; }

    [Column("orderstatus")]
    public string OrderStatus { get; set; } = "Pending";

    [Column("totalamount")]
    public decimal TotalAmount { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("city")]
    public string? City { get; set; }

    [Column("state")]
    public string? State { get; set; }

    [Column("zipcode")]
    public string? ZipCode { get; set; }

    [Column("customerid")]
    public int CustomerId { get; set; }

    [Column("employeeid")]
    public int? EmployeeId { get; set; }
}
