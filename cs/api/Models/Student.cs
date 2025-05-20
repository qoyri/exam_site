using System;
using System.Collections.Generic;

namespace gest_abs.Models;

public partial class Student
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int ClassId { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public DateOnly? Birthdate { get; set; }

    public virtual ICollection<Absence> Absences { get; set; } = new List<Absence>();

    public virtual Class Class { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual ICollection<User> Parents { get; set; } = new List<User>();

    public virtual ICollection<PointsHistory> PointsHistory { get; set; } = new List<PointsHistory>();
}
