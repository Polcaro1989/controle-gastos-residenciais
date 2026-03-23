using ControleGastos.Api.Contracts;
using ControleGastos.Api.Data;
using ControleGastos.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Api.Controllers;

/// <summary>
/// Consolida os relatórios de totais por pessoa e por categoria.
/// </summary>
[ApiController]
[Route("api/reports")]
public sealed class ReportsController(ControleGastosDbContext dbContext) : ControllerBase
{
    [HttpGet("people-totals")]
    public async Task<ActionResult<PersonTotalsReportResponse>> GetPeopleTotals(CancellationToken cancellationToken)
    {
        // O relatório precisa listar todas as pessoas, mesmo quando ainda não possuem transações.
        // Como o projeto usa SQLite, a soma de decimal é feita após materializar os dados.
        var people = (await dbContext.People
            .AsNoTracking()
            .Include(person => person.Transactions)
            .OrderBy(person => person.Name)
            .ToListAsync(cancellationToken))
            .Select(person => new PersonTotalsItemResponse(
                person.Id,
                person.Name,
                person.Age,
                person.Transactions
                    .Where(transaction => transaction.Type == TransactionType.Income)
                    .Sum(transaction => transaction.Amount),
                person.Transactions
                    .Where(transaction => transaction.Type == TransactionType.Expense)
                    .Sum(transaction => transaction.Amount)))
            .ToList();

        var overall = new OverallTotalsResponse(
            people.Sum(person => person.TotalIncome),
            people.Sum(person => person.TotalExpense));

        return Ok(new PersonTotalsReportResponse(people, overall));
    }

    [HttpGet("category-totals")]
    public async Task<ActionResult<CategoryTotalsReportResponse>> GetCategoryTotals(CancellationToken cancellationToken)
    {
        // O relatório por categoria segue a mesma estratégia para manter compatibilidade com SQLite.
        var categories = (await dbContext.Categories
            .AsNoTracking()
            .Include(category => category.Transactions)
            .OrderBy(category => category.Description)
            .ToListAsync(cancellationToken))
            .Select(category => new CategoryTotalsItemResponse(
                category.Id,
                category.Description,
                category.Purpose.ToString(),
                category.Transactions
                    .Where(transaction => transaction.Type == TransactionType.Income)
                    .Sum(transaction => transaction.Amount),
                category.Transactions
                    .Where(transaction => transaction.Type == TransactionType.Expense)
                    .Sum(transaction => transaction.Amount)))
            .ToList();

        var overall = new OverallTotalsResponse(
            categories.Sum(category => category.TotalIncome),
            categories.Sum(category => category.TotalExpense));

        return Ok(new CategoryTotalsReportResponse(categories, overall));
    }
}
