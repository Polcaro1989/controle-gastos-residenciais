namespace ControleGastos.Api.Models;

/// <summary>
/// Representa um lançamento financeiro vinculado a uma pessoa e a uma categoria.
/// </summary>
public sealed class FinancialTransaction
{
    public int Id { get; set; }

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public TransactionType Type { get; set; }

    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;

    public int PersonId { get; set; }

    public Person Person { get; set; } = null!;

    // Mantém a ordenação dos lançamentos e facilita auditoria e listagem no frontend.
    public DateTime CreatedAtUtc { get; set; }
}
