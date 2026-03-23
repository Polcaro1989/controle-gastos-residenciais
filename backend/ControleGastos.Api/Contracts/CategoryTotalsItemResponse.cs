namespace ControleGastos.Api.Contracts;

public sealed record CategoryTotalsItemResponse(
    int CategoryId,
    string CategoryDescription,
    string Purpose,
    decimal TotalIncome,
    decimal TotalExpense)
{
    public decimal Balance => TotalIncome - TotalExpense;
}
