using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenGrow.Models;

[Table("employee")]
public class Employee
{
    [Key]
    [Column("employeeid")]
    public int EmployeeId { get; set; }

    [Column("firstname")]
    public string FirstName { get; set; } = "";

    [Column("lastname")]
    public string LastName { get; set; } = "";

    [Column("email")]
    public string Email { get; set; } = "";

    [Column("phonenumber")]
    public string? PhoneNumber { get; set; }

    [Column("role")]
    public string Role { get; set; } = "";

    [Column("hiredate")]
    public DateTime HireDate { get; set; }

    [Column("isactive")]
    public bool IsActive { get; set; }
}
