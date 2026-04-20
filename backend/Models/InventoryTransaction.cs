using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenGrow.Models;

[Table("inventorytransaction")]
public class InventoryTransaction
{
    [Key]
    [Column("transactionid")]
    public int TransactionId { get; set; }

    [Column("transactiontype")]
    public string TransactionType { get; set; } = "";

    [Column("transactiondate")]
    public DateTime TransactionDate { get; set; }

    [Column("quantitychange")]
    public int QuantityChange { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("productid")]
    public int ProductId { get; set; }

    [Column("employeeid")]
    public int? EmployeeId { get; set; }
}
