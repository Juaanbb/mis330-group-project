using Microsoft.EntityFrameworkCore;
using GreenGrow.Data;

var builder = WebApplication.CreateBuilder(args);

// Build MySQL connection string from Railway env vars, or fall back to appsettings.json
var connStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
var mysqlHost = Environment.GetEnvironmentVariable("MYSQLHOST");
if (!string.IsNullOrEmpty(mysqlHost))
{
    var port = Environment.GetEnvironmentVariable("MYSQLPORT") ?? "3306";
    var db   = Environment.GetEnvironmentVariable("MYSQLDATABASE");
    var user = Environment.GetEnvironmentVariable("MYSQLUSER");
    var pass = Environment.GetEnvironmentVariable("MYSQLPASSWORD");
    connStr = $"Server={mysqlHost};Port={port};Database={db};Uid={user};Pwd={pass};";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connStr, ServerVersion.AutoDetect(connStr)));

// Allow the frontend to call the API from any origin
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers();

var app = builder.Build();

app.UseCors();
app.UseDefaultFiles();   // serves index.html for "/"
app.UseStaticFiles();    // serves frontend/ files copied into wwwroot at build time
app.MapControllers();

app.Run();
