namespace ControleGastos.Api.Contracts;

public sealed record CategoryTotalsReportResponse(
    IReadOnlyCollection<CategoryTotalsItemResponse> Categories,
    OverallTotalsResponse Overall);
