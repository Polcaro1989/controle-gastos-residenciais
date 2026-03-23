using ControleGastos.Api.Models;

namespace ControleGastos.Api.Contracts;

public sealed record CategoryResponse(
    int Id,
    string Description,
    CategoryPurpose Purpose);
