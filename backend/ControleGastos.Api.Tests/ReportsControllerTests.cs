using ControleGastos.Api.Contracts;
using ControleGastos.Api.Controllers;
using ControleGastos.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace ControleGastos.Api.Tests;

public sealed class ReportsControllerTests
{
    [Fact]
    public async Task GetPeopleTotals_ShouldIncludePeopleWithoutTransactionsAndOverallTotals()
    {
        using var database = new TestDatabaseFactory();
        using var dbContext = database.CreateDbContext();

        var personWithTransactions = new Person { Name = "Laura", Age = 31 };
        var personWithoutTransactions = new Person { Name = "Pedro", Age = 15 };
        var incomeCategory = new Category { Description = "Salário", Purpose = CategoryPurpose.Income };
        var expenseCategory = new Category { Description = "Mercado", Purpose = CategoryPurpose.Expense };

        dbContext.AddRange(personWithTransactions, personWithoutTransactions, incomeCategory, expenseCategory);
        await dbContext.SaveChangesAsync();

        dbContext.Transactions.AddRange(
            new FinancialTransaction
            {
                Description = "Salário",
                Amount = 5000m,
                Type = TransactionType.Income,
                PersonId = personWithTransactions.Id,
                CategoryId = incomeCategory.Id,
                CreatedAtUtc = DateTime.UtcNow
            },
            new FinancialTransaction
            {
                Description = "Mercado",
                Amount = 1300m,
                Type = TransactionType.Expense,
                PersonId = personWithTransactions.Id,
                CategoryId = expenseCategory.Id,
                CreatedAtUtc = DateTime.UtcNow
            });
        await dbContext.SaveChangesAsync();

        var controller = new ReportsController(dbContext);

        var response = await controller.GetPeopleTotals(CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var payload = Assert.IsType<PersonTotalsReportResponse>(result.Value);
        Assert.Equal(2, payload.People.Count);
        Assert.Contains(payload.People, item => item.PersonName == "Pedro" && item.TotalIncome == 0m && item.TotalExpense == 0m);
        Assert.Equal(5000m, payload.Overall.TotalIncome);
        Assert.Equal(1300m, payload.Overall.TotalExpense);
        Assert.Equal(3700m, payload.Overall.Balance);
    }

    [Fact]
    public async Task GetCategoryTotals_ShouldGroupTotalsByCategoryAndComputeOverall()
    {
        using var database = new TestDatabaseFactory();
        using var dbContext = database.CreateDbContext();

        var person = new Person { Name = "Rafaela", Age = 29 };
        var incomeCategory = new Category { Description = "Freela", Purpose = CategoryPurpose.Income };
        var expenseCategory = new Category { Description = "Internet", Purpose = CategoryPurpose.Expense };

        dbContext.AddRange(person, incomeCategory, expenseCategory);
        await dbContext.SaveChangesAsync();

        dbContext.Transactions.AddRange(
            new FinancialTransaction
            {
                Description = "Projeto",
                Amount = 2400m,
                Type = TransactionType.Income,
                PersonId = person.Id,
                CategoryId = incomeCategory.Id,
                CreatedAtUtc = DateTime.UtcNow
            },
            new FinancialTransaction
            {
                Description = "Plano",
                Amount = 180m,
                Type = TransactionType.Expense,
                PersonId = person.Id,
                CategoryId = expenseCategory.Id,
                CreatedAtUtc = DateTime.UtcNow
            });
        await dbContext.SaveChangesAsync();

        var controller = new ReportsController(dbContext);

        var response = await controller.GetCategoryTotals(CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var payload = Assert.IsType<CategoryTotalsReportResponse>(result.Value);
        Assert.Equal(2, payload.Categories.Count);
        Assert.Contains(payload.Categories, item => item.CategoryDescription == "Freela" && item.TotalIncome == 2400m);
        Assert.Contains(payload.Categories, item => item.CategoryDescription == "Internet" && item.TotalExpense == 180m);
        Assert.Equal(2400m, payload.Overall.TotalIncome);
        Assert.Equal(180m, payload.Overall.TotalExpense);
        Assert.Equal(2220m, payload.Overall.Balance);
    }
}
