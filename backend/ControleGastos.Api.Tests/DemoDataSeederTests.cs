using ControleGastos.Api.Data;
using ControleGastos.Api.Models;
using ControleGastos.Api.Seeders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ControleGastos.Api.Tests;

public sealed class DemoDataSeederTests
{
    [Fact]
    public async Task SeedAsync_ShouldPopulateDemoDataOnlyOnce()
    {
        var databaseName = Guid.NewGuid().ToString("N");
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ControleGastosDbContext>(options =>
            options.UseInMemoryDatabase(databaseName));

        using var provider = services.BuildServiceProvider();

        await DemoDataSeeder.SeedAsync(provider);
        await DemoDataSeeder.SeedAsync(provider);

        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ControleGastosDbContext>();

        Assert.Equal(10, await dbContext.Categories.CountAsync());
        Assert.Equal(8, await dbContext.People.CountAsync());
        Assert.Equal(34, await dbContext.Transactions.CountAsync());
        Assert.DoesNotContain(
            await dbContext.Transactions.Include(transaction => transaction.Person).ToListAsync(),
            transaction => transaction.Person.Age < 18 && transaction.Type == TransactionType.Income);
    }
}
