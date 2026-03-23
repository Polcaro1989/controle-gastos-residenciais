using ControleGastos.Api.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace ControleGastos.Api.Controllers;

/// <summary>
/// Expõe um resumo simples da API para a rota base /api.
/// </summary>
[ApiController]
[Route("api")]
public sealed class ApiInfoController : ControllerBase
{
    [HttpGet]
    public ActionResult<ApiInfoResponse> Get()
    {
        return Ok(new ApiInfoResponse(
            "Controle de Gastos Residenciais API",
            "ok",
            "/swagger",
            [
                "/api/people",
                "/api/categories",
                "/api/transactions",
                "/api/reports/people-totals",
                "/api/reports/category-totals"
            ]));
    }
}
