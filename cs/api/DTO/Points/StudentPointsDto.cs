using System;

namespace gest_abs.DTO.Points
{
    public class StudentPointsDto
    {
        public int StudentId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string ClassName { get; set; }
        public int Points { get; set; }
        public int RankOverall { get; set; }
        public int RankInClass { get; set; }
        public int TotalAbsences { get; set; }
        public int UnjustifiedAbsences { get; set; }
    }
}
