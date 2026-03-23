namespace ControleGastos.Api.Models;

/// <summary>
/// Entidade principal do cadastro de pessoas.
/// </summary>
public sealed class Person
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Age { get; set; }

    // A coleção é usada tanto nos relatórios quanto na exclusão em cascata das transações.
    public ICollection<FinancialTransaction> Transactions { get; set; } = new List<FinancialTransaction>();
}
