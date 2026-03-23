using ControleGastos.Api.Controllers;
using ControleGastos.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Api.Tests;

public sealed class PeopleControllerTests
{
    [Fact]
    public async Task Delete_ShouldCascadeDeleteTransactionsFromPerson()
    {
        using var database = new TestDatabaseFactory();
        using var dbContext = database.CreateDbContext();

        var person = new Person { Name = "João", Age = 40 };
        var category = new Category { Description = "Casa", Purpose = CategoryPurpose.Expense };
        dbContext.People.Add(person);
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();

        dbContext.Transactions.Add(new FinancialTransaction
        {
            Description = "Água",
            Amount = 120m,
            Type = TransactionType.Expense,
            PersonId = person.Id,
            CategoryId = category.Id,
            CreatedAtUtc = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var controller = new PeopleController(dbContext);

        var result = await controller.Delete(person.Id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.False(await dbContext.People.AnyAsync());
        Assert.False(await dbContext.Transactions.AnyAsync());
    }
}
