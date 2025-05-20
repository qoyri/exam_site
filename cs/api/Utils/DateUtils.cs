using System;
using System.Globalization;

namespace gest_abs.Utils
{
    public static class DateUtils
    {
        private const string DateFormat = "yyyy-MM-dd";

        public static DateOnly? ParseDateOnly(string dateString)
        {
            if (string.IsNullOrEmpty(dateString))
                return null;

            if (DateOnly.TryParse(dateString, out var date))
                return date;

            if (DateTime.TryParse(dateString, out var dateTime))
                return DateOnly.FromDateTime(dateTime);

            return null;
        }

        public static string FormatDateOnly(DateOnly? date)
        {
            return date?.ToString(DateFormat);
        }

        public static DateOnly? GetDateOnlyFromDateTime(DateTime? dateTime)
        {
            return dateTime.HasValue ? DateOnly.FromDateTime(dateTime.Value) : null;
        }

        public static DateTime? GetDateTimeFromDateOnly(DateOnly? date)
        {
            return date.HasValue ? date.Value.ToDateTime(TimeOnly.MinValue) : null;
        }
    }
}
