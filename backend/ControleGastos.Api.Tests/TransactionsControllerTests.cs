using ControleGastos.Api.Contracts;
using ControleGastos.Api.Controllers;
using ControleGastos.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace ControleGastos.Api.Tests;

public sealed class TransactionsControllerTests
{
    [Fact]
    public async Task Create_ShouldRejectIncomeForMinor()
    {
        using var dbContext = InMemoryTestDatabaseFactory.CreateDbContext();

        var person = new Person { Name = "Ana", Age = 17 };
        var category = new Category { Description = "Bolsa", Purpose = CategoryPurpose.Income };
        dbContext.People.Add(person);
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();

        var controller = new TransactionsController(dbContext);
        var request = new TransactionCreateRequest
        {
            Description = "Pagamento",
            Amount = 500m,
            Type = TransactionType.Income,
            CategoryId = category.Id,
            PersonId = person.Id
        };

        var response = await controller.Create(request, CancellationToken.None);

        var result = Assert.IsType<ObjectResult>(response.Result);
        var problem = Assert.IsType<ValidationProblemDetails>(result.Value);
        Assert.Contains("Menores de idade podem registrar apenas despesas.", problem.Errors[nameof(request.Type)]);
    }

    [Fact]
    public async Task Create_ShouldRejectCategoryWithIncompatiblePurpose()
    {
        using var dbContext = InMemoryTestDatabaseFactory.CreateDbContext();

        var person = new Person { Name = "Carlos", Age = 35 };
        var category = new Category { Description = "Salário", Purpose = CategoryPurpose.Income };
        dbContext.People.Add(person);
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();

        var controller = new TransactionsController(dbContext);
        var request = new TransactionCreateRequest
        {
            Description = "Conta de luz",
            Amount = 220m,
            Type = TransactionType.Expense,
            CategoryId = category.Id,
            PersonId = person.Id
        };

        var response = await controller.Create(request, CancellationToken.None);

        var result = Assert.IsType<ObjectResult>(response.Result);
        var problem = Assert.IsType<ValidationProblemDetails>(result.Value);
        Assert.Contains(
            "A categoria selecionada não é compatível com o tipo da transação.",
            problem.Errors[nameof(request.CategoryId)]);
    }

    [Fact]
    public async Task Create_ShouldPersistTransactionWhenRequestIsValid()
    {
        using var dbContext = InMemoryTestDatabaseFactory.CreateDbContext();

        var person = new Person { Name = "Marina", Age = 28 };
        var category = new Category { Description = "Mercado", Purpose = CategoryPurpose.Expense };
        dbContext.People.Add(person);
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();

        var controller = new TransactionsController(dbContext);
        var request = new TransactionCreateRequest
        {
            Description = "Compra do mês",
            Amount = 380m,
            Type = TransactionType.Expense,
            CategoryId = category.Id,
            PersonId = person.Id
        };

        var response = await controller.Create(request, CancellationToken.None);

        var result = Assert.IsType<CreatedResult>(response.Result);
        var payload = Assert.IsType<TransactionResponse>(result.Value);
        Assert.Equal("Compra do mês", payload.Description);
        Assert.Equal(380m, payload.Amount);
        Assert.Single(dbContext.Transactions);
    }
}
