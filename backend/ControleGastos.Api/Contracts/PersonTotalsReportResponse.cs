namespace ControleGastos.Api.Contracts;

public sealed record PersonTotalsReportResponse(
    IReadOnlyCollection<PersonTotalsItemResponse> People,
    OverallTotalsResponse Overall);
