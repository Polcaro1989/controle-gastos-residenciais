using System.ComponentModel.DataAnnotations;
using ControleGastos.Api.Models;

namespace ControleGastos.Api.Contracts;

/// <summary>
/// Entrada do cadastro de categorias com a finalidade usada nas validações de transação.
/// </summary>
public sealed class CategoryCreateRequest
{
    /// <summary>
    /// Descrição da categoria com limite de 400 caracteres.
    /// </summary>
    [Required]
    [StringLength(400)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Define se a categoria aceita despesa, receita ou ambas.
    /// </summary>
    [EnumDataType(typeof(CategoryPurpose))]
    public CategoryPurpose Purpose { get; set; }
}
