using System.Collections.Generic;

namespace api.DTO.Teacher
{
    // DTO pour les statistiques du tableau de bord
    public class DashboardStatsDto
    {
        public int TotalClasses { get; set; }
        public int TotalStudents { get; set; }
        public int TotalAbsences { get; set; }
        public Dictionary<string, int> AbsencesByStatus { get; set; }
        public int TotalReservations { get; set; }
    }

    // DTO pour les statistiques d'absences
    public class AbsenceStatsDto
    {
        public int TotalAbsences { get; set; }
        public int JustifiedAbsences { get; set; }
        public int UnjustifiedAbsences { get; set; }
        public int PendingAbsences { get; set; }
    }

    // DTO pour les statistiques d'une classe
    public class ClassStatsDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; }
        public int StudentCount { get; set; }
        public int TotalAbsences { get; set; }
        public int JustifiedAbsences { get; set; }
        public int UnjustifiedAbsences { get; set; }
        public int PendingAbsences { get; set; }
    }

    // DTO pour les statistiques d'un étudiant
    public class StudentStatsDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; }
        public int ClassId { get; set; }
        public string ClassName { get; set; }
        public int TotalAbsences { get; set; }
        public int JustifiedAbsences { get; set; }
        public int UnjustifiedAbsences { get; set; }
        public int PendingAbsences { get; set; }
    }

    // DTO pour les statistiques des salles
    public class RoomStatsDto
    {
        public int TotalRooms { get; set; }
        public int TotalReservations { get; set; }
    }
}
