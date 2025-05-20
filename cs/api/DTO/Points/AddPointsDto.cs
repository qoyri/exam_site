namespace gest_abs.DTO.Points
{
    public class AddPointsDto
    {
        public int Points { get; set; }
        public string Reason { get; set; }
        public int? AbsenceId { get; set; }
    }
}
