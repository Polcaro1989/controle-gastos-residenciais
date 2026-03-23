using ControleGastos.Api.Contracts;
using ControleGastos.Api.Data;
using ControleGastos.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Api.Controllers;

/// <summary>
/// Expõe a criação e a listagem do cadastro de categorias.
/// </summary>
[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(ControleGastosDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var categories = await dbContext.Categories
            .AsNoTracking()
            .OrderBy(category => category.Description)
            .Select(category => new CategoryResponse(category.Id, category.Description, category.Purpose))
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(
        [FromBody] CategoryCreateRequest request,
        CancellationToken cancellationToken)
    {
        var description = request.Description.Trim();

        if (string.IsNullOrWhiteSpace(description))
        {
            ModelState.AddModelError(nameof(request.Description), "A descrição da categoria é obrigatória.");
            return ValidationProblem(ModelState);
        }

        var category = new Category
        {
            Description = description,
            Purpose = request.Purpose
        };

        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Created($"/api/categories/{category.Id}", ToResponse(category));
    }

    private static CategoryResponse ToResponse(Category category)
    {
        return new CategoryResponse(category.Id, category.Description, category.Purpose);
    }
}
