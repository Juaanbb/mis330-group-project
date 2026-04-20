using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenGrow.Models;

[Table("customer")]
public class Customer
{
    [Key]
    [Column("customerid")]
    public int CustomerId { get; set; }

    [Column("firstname")]
    public string FirstName { get; set; } = "";

    [Column("lastname")]
    public string LastName { get; set; } = "";

    [Column("email")]
    public string Email { get; set; } = "";

    [Column("phonenumber")]
    public string? PhoneNumber { get; set; }

    [Column("password")]
    public string Password { get; set; } = "";

    [Column("createddate")]
    public DateTime CreatedDate { get; set; }
}
