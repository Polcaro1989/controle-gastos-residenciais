using System.ComponentModel.DataAnnotations;

namespace ControleGastos.Api.Contracts;

/// <summary>
/// Representa os dados de entrada do cadastro de pessoas conforme o enunciado.
/// </summary>
public sealed class PersonUpsertRequest
{
    /// <summary>
    /// Nome da pessoa com limite de 200 caracteres.
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Idade usada pela regra que restringe receitas para menores de idade.
    /// </summary>
    [Range(0, 130)]
    public int Age { get; set; }
}
