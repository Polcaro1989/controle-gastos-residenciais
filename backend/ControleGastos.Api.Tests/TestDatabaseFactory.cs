using ControleGastos.Api.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Api.Tests;

internal sealed class TestDatabaseFactory : IDisposable
{
    private readonly SqliteConnection connection;

    public TestDatabaseFactory()
    {
        connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        using var dbContext = CreateDbContext();
        dbContext.Database.EnsureCreated();
    }

    public ControleGastosDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ControleGastosDbContext>()
            .UseSqlite(connection)
            .Options;

        return new ControleGastosDbContext(options);
    }

    public void Dispose()
    {
        connection.Dispose();
    }
}
