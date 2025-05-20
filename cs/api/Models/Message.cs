using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gest_abs.Models
{
    [Table("messages")]
    public class Message
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("sender_id")]
        public int SenderId { get; set; }
        
        [Column("receiver_id")]
        public int ReceiverId { get; set; }
        
        [Column("content")]
        public string Content { get; set; }
        
        [Column("sent_at")]
        public DateTime SentAt { get; set; }
        
        [Column("received_at")]
        public DateTime? DeliveredAt { get; set; }
        
        [Column("read_at")]
        public DateTime? ReadAt { get; set; }
        
        [Column("status")]
        public string Status { get; set; } = "sent";
        
        [ForeignKey("SenderId")]
        public virtual User Sender { get; set; }
        
        [ForeignKey("ReceiverId")]
        public virtual User Receiver { get; set; }
    }
}
