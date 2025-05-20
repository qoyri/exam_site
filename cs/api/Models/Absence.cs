using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace gest_abs.Models;

public partial class Absence
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public DateOnly AbsenceDate { get; set; }

    public string? Reason { get; set; }

    public string? Status { get; set; }

    public string? Document { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Student Student { get; set; } = null!;

    // Correctement marquer cette propriété comme non mappée
    [NotMapped]
    public bool PointsProcessed { get; set; }
}
