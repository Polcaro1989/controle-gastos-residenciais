namespace ControleGastos.Api.Contracts;

public sealed record ApiInfoResponse(
    string Name,
    string Status,
    string DocumentationUrl,
    IReadOnlyCollection<string> Endpoints);
