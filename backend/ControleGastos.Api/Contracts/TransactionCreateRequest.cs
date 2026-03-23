using System.ComponentModel.DataAnnotations;
using ControleGastos.Api.Models;

namespace ControleGastos.Api.Contracts;

/// <summary>
/// Entrada do cadastro de transações com os campos exigidos pelo teste.
/// </summary>
public sealed class TransactionCreateRequest
{
    /// <summary>
    /// Descrição da transação com limite de 400 caracteres.
    /// </summary>
    [Required]
    [StringLength(400)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Valor positivo informado pelo usuário.
    /// </summary>
    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Tipo da transação, usado junto à finalidade da categoria.
    /// </summary>
    [EnumDataType(typeof(TransactionType))]
    public TransactionType Type { get; set; }

    /// <summary>
    /// Categoria previamente cadastrada.
    /// </summary>
    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }

    /// <summary>
    /// Pessoa previamente cadastrada.
    /// </summary>
    [Range(1, int.MaxValue)]
    public int PersonId { get; set; }
}
