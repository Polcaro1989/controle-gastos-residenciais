namespace ControleGastos.Api.Contracts;

public sealed record PersonTotalsItemResponse(
    int PersonId,
    string PersonName,
    int Age,
    decimal TotalIncome,
    decimal TotalExpense)
{
    public decimal Balance => TotalIncome - TotalExpense;
}
