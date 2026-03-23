using ControleGastos.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Api.Tests;

internal static class InMemoryTestDatabaseFactory
{
    public static ControleGastosDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ControleGastosDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new ControleGastosDbContext(options);
    }
}
