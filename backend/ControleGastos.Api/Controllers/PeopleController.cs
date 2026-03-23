using ControleGastos.Api.Contracts;
using ControleGastos.Api.Data;
using ControleGastos.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Api.Controllers;

/// <summary>
/// Expõe o CRUD do cadastro de pessoas.
/// </summary>
[ApiController]
[Route("api/people")]
public sealed class PeopleController(ControleGastosDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PersonResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var people = await dbContext.People
            .AsNoTracking()
            .OrderBy(person => person.Name)
            .Select(person => new PersonResponse(person.Id, person.Name, person.Age))
            .ToListAsync(cancellationToken);

        return Ok(people);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PersonResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var person = await dbContext.People
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new PersonResponse(item.Id, item.Name, item.Age))
            .SingleOrDefaultAsync(cancellationToken);

        return person is null ? NotFound() : Ok(person);
    }

    [HttpPost]
    public async Task<ActionResult<PersonResponse>> Create(
        [FromBody] PersonUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            ModelState.AddModelError(nameof(request.Name), "O nome da pessoa é obrigatório.");
            return ValidationProblem(ModelState);
        }

        var person = new Person
        {
            Name = name,
            Age = request.Age
        };

        dbContext.People.Add(person);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = person.Id }, ToResponse(person));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PersonResponse>> Update(
        int id,
        [FromBody] PersonUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var person = await dbContext.People.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (person is null)
        {
            return NotFound();
        }

        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            ModelState.AddModelError(nameof(request.Name), "O nome da pessoa é obrigatório.");
            return ValidationProblem(ModelState);
        }

        person.Name = name;
        person.Age = request.Age;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(person));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var person = await dbContext.People.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (person is null)
        {
            return NotFound();
        }

        // A remoção dispara a exclusão em cascata configurada no DbContext para apagar as transações da pessoa.
        dbContext.People.Remove(person);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static PersonResponse ToResponse(Person person)
    {
        return new PersonResponse(person.Id, person.Name, person.Age);
    }
}
