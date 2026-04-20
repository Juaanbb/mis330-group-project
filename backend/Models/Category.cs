using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenGrow.Models;

[Table("category")]
public class Category
{
    [Key]
    [Column("categoryid")]
    public int CategoryId { get; set; }

    [Column("categoryname")]
    public string CategoryName { get; set; } = "";

    [Column("categorydescription")]
    public string? CategoryDescription { get; set; }
}
