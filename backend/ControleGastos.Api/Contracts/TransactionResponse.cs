using ControleGastos.Api.Models;

namespace ControleGastos.Api.Contracts;

public sealed record TransactionResponse(
    int Id,
    string Description,
    decimal Amount,
    TransactionType Type,
    int CategoryId,
    string CategoryDescription,
    CategoryPurpose CategoryPurpose,
    int PersonId,
    string PersonName,
    DateTime CreatedAtUtc);
