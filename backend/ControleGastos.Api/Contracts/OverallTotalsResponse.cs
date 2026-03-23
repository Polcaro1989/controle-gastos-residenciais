namespace ControleGastos.Api.Contracts;

public sealed record OverallTotalsResponse(
    decimal TotalIncome,
    decimal TotalExpense)
{
    public decimal Balance => TotalIncome - TotalExpense;
}
