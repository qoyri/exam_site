using System;
using System.Collections.Generic;

namespace gest_abs.Models;

public partial class Room
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int? Capacity { get; set; }

    public string? Location { get; set; }
    
    // Ajout d'un champ Features pour stocker les caractéristiques de la salle
    public string? Features { get; set; }

    public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
