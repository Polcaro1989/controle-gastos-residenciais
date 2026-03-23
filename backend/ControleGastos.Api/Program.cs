using System.Text.Json.Serialization;
using ControleGastos.Api.Data;
using ControleGastos.Api.Seeders;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

var shouldSeedDatabase = args.Contains("seed-demo-data", StringComparer.OrdinalIgnoreCase);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not configured.");

var normalizedConnectionString = NormalizeSqliteConnectionString(
    connectionString,
    builder.Environment.ContentRootPath);

builder.Services.AddDbContext<ControleGastosDbContext>(options =>
{
    options.UseSqlite(normalizedConnectionString);
});

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:3000", "http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("frontend");

app.MapControllers();

if (shouldSeedDatabase)
{
    await DemoDataSeeder.SeedAsync(app.Services);
    return;
}

await app.Services.InitializeDatabaseAsync();

app.Run();

static string NormalizeSqliteConnectionString(string connectionString, string contentRootPath)
{
    var sqliteBuilder = new SqliteConnectionStringBuilder(connectionString);

    if (string.IsNullOrWhiteSpace(sqliteBuilder.DataSource))
    {
        throw new InvalidOperationException("The SQLite connection string must define a data source.");
    }

    if (!Path.IsPathRooted(sqliteBuilder.DataSource))
    {
        sqliteBuilder.DataSource = Path.GetFullPath(sqliteBuilder.DataSource, contentRootPath);
    }

    var databaseDirectory = Path.GetDirectoryName(sqliteBuilder.DataSource);

    if (!string.IsNullOrWhiteSpace(databaseDirectory))
    {
        Directory.CreateDirectory(databaseDirectory);
    }

    return sqliteBuilder.ToString();
}
