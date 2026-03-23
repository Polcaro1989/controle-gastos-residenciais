using ControleGastos.Api.Contracts;
using ControleGastos.Api.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace ControleGastos.Api.Tests;

public sealed class ApiInfoControllerTests
{
    [Fact]
    public void Get_ShouldReturnApiOverview()
    {
        var controller = new ApiInfoController();

        var response = controller.Get();

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var payload = Assert.IsType<ApiInfoResponse>(result.Value);
        Assert.Equal("ok", payload.Status);
        Assert.Contains("/api/people", payload.Endpoints);
        Assert.Equal("/swagger", payload.DocumentationUrl);
    }
}
