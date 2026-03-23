using ControleGastos.Api.Contracts;
using ControleGastos.Api.Data;
using ControleGastos.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Api.Controllers;

/// <summary>
/// Controla o cadastro de transações e concentra as regras de negócio de menor de idade e compatibilidade de categoria.
/// </summary>
[ApiController]
[Route("api/transactions")]
public sealed class TransactionsController(ControleGastosDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TransactionResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var transactions = await dbContext.Transactions
            .AsNoTracking()
            .OrderByDescending(transaction => transaction.CreatedAtUtc)
            .Select(transaction => new TransactionResponse(
                transaction.Id,
                transaction.Description,
                transaction.Amount,
                transaction.Type,
                transaction.CategoryId,
                transaction.Category.Description,
                transaction.Category.Purpose,
                transaction.PersonId,
                transaction.Person.Name,
                transaction.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Ok(transactions);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> Create(
        [FromBody] TransactionCreateRequest request,
        CancellationToken cancellationToken)
    {
        var description = request.Description.Trim();

        if (string.IsNullOrWhiteSpace(description))
        {
            ModelState.AddModelError(nameof(request.Description), "A descrição da transação é obrigatória.");
            return ValidationProblem(ModelState);
        }

        var person = await dbContext.People
            .SingleOrDefaultAsync(item => item.Id == request.PersonId, cancellationToken);

        if (person is null)
        {
            ModelState.AddModelError(nameof(request.PersonId), "A pessoa informada não foi encontrada.");
            return ValidationProblem(ModelState);
        }

        var category = await dbContext.Categories
            .SingleOrDefaultAsync(item => item.Id == request.CategoryId, cancellationToken);

        if (category is null)
        {
            ModelState.AddModelError(nameof(request.CategoryId), "A categoria informada não foi encontrada.");
            return ValidationProblem(ModelState);
        }

        // Menores de idade podem registrar apenas despesas.
        if (person.Age < 18 && request.Type == TransactionType.Income)
        {
            ModelState.AddModelError(nameof(request.Type), "Menores de idade podem registrar apenas despesas.");
            return ValidationProblem(ModelState);
        }

        // A categoria precisa ser compatível com o tipo da transação.
        if (!IsCategoryCompatible(category.Purpose, request.Type))
        {
            ModelState.AddModelError(
                nameof(request.CategoryId),
                "A categoria selecionada não é compatível com o tipo da transação.");
            return ValidationProblem(ModelState);
        }

        var transaction = new FinancialTransaction
        {
            Description = description,
            Amount = request.Amount,
            Type = request.Type,
            CategoryId = category.Id,
            PersonId = person.Id,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.Transactions.Add(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Created($"/api/transactions/{transaction.Id}", ToResponse(transaction, person, category));
    }

    private static bool IsCategoryCompatible(CategoryPurpose purpose, TransactionType type)
    {
        return purpose == CategoryPurpose.Both
            || (purpose == CategoryPurpose.Expense && type == TransactionType.Expense)
            || (purpose == CategoryPurpose.Income && type == TransactionType.Income);
    }

    private static TransactionResponse ToResponse(
        FinancialTransaction transaction,
        Person person,
        Category category)
    {
        return new TransactionResponse(
            transaction.Id,
            transaction.Description,
            transaction.Amount,
            transaction.Type,
            category.Id,
            category.Description,
            category.Purpose,
            person.Id,
            person.Name,
            transaction.CreatedAtUtc);
    }
}
