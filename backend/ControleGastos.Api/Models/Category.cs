namespace ControleGastos.Api.Models;

/// <summary>
/// Entidade do cadastro de categorias com a finalidade que restringe o uso nas transações.
/// </summary>
public sealed class Category
{
    public int Id { get; set; }

    public string Description { get; set; } = string.Empty;

    public CategoryPurpose Purpose { get; set; }

    public ICollection<FinancialTransaction> Transactions { get; set; } = new List<FinancialTransaction>();
}
