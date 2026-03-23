using ControleGastos.Api.Data;
using ControleGastos.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ControleGastos.Api.Seeders;

/// <summary>
/// Popula o banco com dados de demonstração sob comando explícito.
/// </summary>
public static class DemoDataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        await services.InitializeDatabaseAsync();

        using var scope = services.CreateScope();

        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("DemoDataSeeder");

        var dbContext = scope.ServiceProvider.GetRequiredService<ControleGastosDbContext>();

        if (await dbContext.People.AnyAsync()
            || await dbContext.Categories.AnyAsync()
            || await dbContext.Transactions.AnyAsync())
        {
            logger.LogInformation("Demo data seeding skipped because the database already contains data.");
            return;
        }

        var categories = new[]
        {
            new Category { Description = "Salário", Purpose = CategoryPurpose.Income },
            new Category { Description = "Freelance", Purpose = CategoryPurpose.Income },
            new Category { Description = "Investimentos", Purpose = CategoryPurpose.Income },
            new Category { Description = "Moradia", Purpose = CategoryPurpose.Expense },
            new Category { Description = "Alimentação", Purpose = CategoryPurpose.Expense },
            new Category { Description = "Transporte", Purpose = CategoryPurpose.Expense },
            new Category { Description = "Saúde", Purpose = CategoryPurpose.Expense },
            new Category { Description = "Educação", Purpose = CategoryPurpose.Expense },
            new Category { Description = "Lazer", Purpose = CategoryPurpose.Both },
            new Category { Description = "Presentes", Purpose = CategoryPurpose.Both }
        };

        var people = new[]
        {
            new Person { Name = "Ana Souza", Age = 34 },
            new Person { Name = "Bruno Lima", Age = 41 },
            new Person { Name = "Carla Mendes", Age = 29 },
            new Person { Name = "Diego Alves", Age = 17 },
            new Person { Name = "Elisa Costa", Age = 15 },
            new Person { Name = "Fernando Rocha", Age = 52 },
            new Person { Name = "Giovana Martins", Age = 24 },
            new Person { Name = "Henrique Dias", Age = 38 }
        };

        dbContext.Categories.AddRange(categories);
        dbContext.People.AddRange(people);
        await dbContext.SaveChangesAsync();

        var categoryByDescription = categories.ToDictionary(category => category.Description);
        var personByName = people.ToDictionary(person => person.Name);
        var now = DateTime.UtcNow;

        var transactions = new[]
        {
            CreateTransaction("Salário de março", 5200m, TransactionType.Income, categoryByDescription["Salário"], personByName["Ana Souza"], now.AddDays(-29)),
            CreateTransaction("Projeto de branding", 1200m, TransactionType.Income, categoryByDescription["Freelance"], personByName["Ana Souza"], now.AddDays(-24)),
            CreateTransaction("Aluguel do apartamento", 1500m, TransactionType.Expense, categoryByDescription["Moradia"], personByName["Ana Souza"], now.AddDays(-27)),
            CreateTransaction("Supermercado do mês", 460m, TransactionType.Expense, categoryByDescription["Alimentação"], personByName["Ana Souza"], now.AddDays(-20)),
            CreateTransaction("Cinema de sábado", 120m, TransactionType.Expense, categoryByDescription["Lazer"], personByName["Ana Souza"], now.AddDays(-8)),

            CreateTransaction("Salário mensal", 6800m, TransactionType.Income, categoryByDescription["Salário"], personByName["Bruno Lima"], now.AddDays(-30)),
            CreateTransaction("Rendimento da carteira", 430m, TransactionType.Income, categoryByDescription["Investimentos"], personByName["Bruno Lima"], now.AddDays(-11)),
            CreateTransaction("Prestação da casa", 2100m, TransactionType.Expense, categoryByDescription["Moradia"], personByName["Bruno Lima"], now.AddDays(-26)),
            CreateTransaction("Combustível", 320m, TransactionType.Expense, categoryByDescription["Transporte"], personByName["Bruno Lima"], now.AddDays(-16)),
            CreateTransaction("Jantar em família", 190m, TransactionType.Expense, categoryByDescription["Lazer"], personByName["Bruno Lima"], now.AddDays(-6)),

            CreateTransaction("Salário CLT", 4700m, TransactionType.Income, categoryByDescription["Salário"], personByName["Carla Mendes"], now.AddDays(-30)),
            CreateTransaction("Curso online", 240m, TransactionType.Expense, categoryByDescription["Educação"], personByName["Carla Mendes"], now.AddDays(-21)),
            CreateTransaction("Mercado semanal", 390m, TransactionType.Expense, categoryByDescription["Alimentação"], personByName["Carla Mendes"], now.AddDays(-13)),
            CreateTransaction("Farmácia", 95m, TransactionType.Expense, categoryByDescription["Saúde"], personByName["Carla Mendes"], now.AddDays(-10)),
            CreateTransaction("Presente da sobrinha", 150m, TransactionType.Expense, categoryByDescription["Presentes"], personByName["Carla Mendes"], now.AddDays(-4)),

            CreateTransaction("Lanche da escola", 35m, TransactionType.Expense, categoryByDescription["Alimentação"], personByName["Diego Alves"], now.AddDays(-18)),
            CreateTransaction("Passe escolar", 90m, TransactionType.Expense, categoryByDescription["Transporte"], personByName["Diego Alves"], now.AddDays(-12)),
            CreateTransaction("Jogo online", 60m, TransactionType.Expense, categoryByDescription["Lazer"], personByName["Diego Alves"], now.AddDays(-5)),

            CreateTransaction("Material escolar", 110m, TransactionType.Expense, categoryByDescription["Educação"], personByName["Elisa Costa"], now.AddDays(-19)),
            CreateTransaction("Remédio", 45m, TransactionType.Expense, categoryByDescription["Saúde"], personByName["Elisa Costa"], now.AddDays(-9)),
            CreateTransaction("Presente de aniversário", 80m, TransactionType.Expense, categoryByDescription["Presentes"], personByName["Elisa Costa"], now.AddDays(-2)),

            CreateTransaction("Salário do mês", 7500m, TransactionType.Income, categoryByDescription["Salário"], personByName["Fernando Rocha"], now.AddDays(-30)),
            CreateTransaction("Consultoria avulsa", 1600m, TransactionType.Income, categoryByDescription["Freelance"], personByName["Fernando Rocha"], now.AddDays(-17)),
            CreateTransaction("Plano de saúde", 680m, TransactionType.Expense, categoryByDescription["Saúde"], personByName["Fernando Rocha"], now.AddDays(-15)),
            CreateTransaction("Supermercado premium", 520m, TransactionType.Expense, categoryByDescription["Alimentação"], personByName["Fernando Rocha"], now.AddDays(-7)),
            CreateTransaction("Hotel de fim de semana", 410m, TransactionType.Expense, categoryByDescription["Lazer"], personByName["Fernando Rocha"], now.AddDays(-3)),

            CreateTransaction("Projeto de design", 2300m, TransactionType.Income, categoryByDescription["Freelance"], personByName["Giovana Martins"], now.AddDays(-28)),
            CreateTransaction("Aluguel do studio", 1200m, TransactionType.Expense, categoryByDescription["Moradia"], personByName["Giovana Martins"], now.AddDays(-22)),
            CreateTransaction("Academia", 140m, TransactionType.Expense, categoryByDescription["Lazer"], personByName["Giovana Martins"], now.AddDays(-14)),
            CreateTransaction("Compras do mês", 280m, TransactionType.Expense, categoryByDescription["Alimentação"], personByName["Giovana Martins"], now.AddDays(-8)),

            CreateTransaction("Salário corporativo", 5900m, TransactionType.Income, categoryByDescription["Salário"], personByName["Henrique Dias"], now.AddDays(-30)),
            CreateTransaction("Rendimento do CDB", 560m, TransactionType.Income, categoryByDescription["Investimentos"], personByName["Henrique Dias"], now.AddDays(-12)),
            CreateTransaction("Condomínio", 850m, TransactionType.Expense, categoryByDescription["Moradia"], personByName["Henrique Dias"], now.AddDays(-25)),
            CreateTransaction("Abastecimento", 260m, TransactionType.Expense, categoryByDescription["Transporte"], personByName["Henrique Dias"], now.AddDays(-9))
        };

        dbContext.Transactions.AddRange(transactions);
        await dbContext.SaveChangesAsync();

        logger.LogInformation(
            "Demo data seeded with {CategoryCount} categories, {PeopleCount} people and {TransactionCount} transactions.",
            categories.Length,
            people.Length,
            transactions.Length);
    }

    private static FinancialTransaction CreateTransaction(
        string description,
        decimal amount,
        TransactionType type,
        Category category,
        Person person,
        DateTime createdAtUtc)
    {
        return new FinancialTransaction
        {
            Description = description,
            Amount = amount,
            Type = type,
            CategoryId = category.Id,
            PersonId = person.Id,
            CreatedAtUtc = createdAtUtc
        };
    }
}
