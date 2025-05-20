using System;
using System.Collections.Generic;

namespace gest_abs.DTO
{
    public class ReportFilterDTO
    {
        public int? ClassId { get; set; }
        public int? StudentId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Format { get; set; } = "json";
    }

    public class AbsenceReportDTO
    {
        public DateTime GeneratedAt { get; set; }
        public string ReportPeriod { get; set; }
        public int TotalAbsences { get; set; }
        public int JustifiedAbsences { get; set; }
        public int UnjustifiedAbsences { get; set; }
        public List<AbsenceDTO> Absences { get; set; }
        public Dictionary<string, int> AbsencesByClass { get; set; }
        public Dictionary<string, int> AbsencesByStudent { get; set; }
        public Dictionary<string, int> AbsencesByMonth { get; set; }
    }

    public class ClassStatisticsDTO
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; }
        public int StudentCount { get; set; }
        public int TotalAbsences { get; set; }
        public double AbsenceRate { get; set; }
    }
}
