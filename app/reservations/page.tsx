"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { roomService } from "@/lib/room-service"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function ReservationsPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [rooms, setRooms] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("08:00")
  const [endTime, setEndTime] = useState<string>("10:00")
  const [purpose, setPurpose] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomService.getRooms()
        setRooms(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des salles:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les salles.",
          variant: "destructive",
        })
      }
    }

    fetchRooms()
  }, [])

  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true)
      try {
        const startDate = format(date, "yyyy-MM-dd")
        const endDate = format(addDays(date, 7), "yyyy-MM-dd")

        const data = await roomService.getReservations({
          startDate,
          endDate,
        })
        setReservations(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des réservations:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les réservations.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReservations()
  }, [date])

  const handleCreateReservation = async () => {
    if (!selectedRoom || !startTime || !endTime || !purpose) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      })
      return
    }

    if (startTime >= endTime) {
      toast({
        title: "Erreur",
        description: "L'heure de début doit être antérieure à l'heure de fin.",
        variant: "destructive",
      })
      return
    }

    try {
      // Formatage des dates pour le backend
      const reservationDate = format(date, "yyyy-MM-dd")
      const startDateTime = `${startTime}:00`
      const endDateTime = `${endTime}:00`

      await roomService.createReservation({
        roomId: Number.parseInt(selectedRoom),
        startTime: `${reservationDate}T${startDateTime}`,
        endTime: `${reservationDate}T${endDateTime}`,
        purpose,
      })

      toast({
        title: "Succès",
        description: "Réservation créée avec succès.",
      })

      // Rafraîchir les réservations
      const startDate = format(date, "yyyy-MM-dd")
      const endDate = format(addDays(date, 7), "yyyy-MM-dd")
      const data = await roomService.getReservations({
        startDate,
        endDate,
      })
      setReservations(data)

      // Réinitialiser les champs et fermer le dialogue
      setSelectedRoom("")
      setStartTime("08:00")
      setEndTime("10:00")
      setPurpose("")
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Erreur lors de la création de la réservation:", error)

      // Extraire le message d'erreur de la réponse API si disponible
      const errorMessage =
        error.response?.data?.message ||
        "Impossible de créer la réservation. La salle est peut-être déjà réservée pour cette période."

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteReservation = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      return
    }

    try {
      await roomService.deleteReservation(id)

      toast({
        title: "Succès",
        description: "Réservation supprimée avec succès.",
      })

      // Rafraîchir les réservations
      const startDate = format(date, "yyyy-MM-dd")
      const endDate = format(addDays(date, 7), "yyyy-MM-dd")
      const data = await roomService.getReservations({
        startDate,
        endDate,
      })
      setReservations(data)
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la réservation:", error)

      // Extraire le message d'erreur de la réponse API si disponible
      const errorMessage = error.response?.data?.message || "Impossible de supprimer la réservation."

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Modifier la fonction getDayReservations pour utiliser le champ reservationDate
  const getDayReservations = (day: Date) => {
    return reservations.filter((reservation) => {
      // Utiliser le champ reservationDate au lieu de startTime
      const reservationDate = new Date(reservation.reservationDate)
      return isSameDay(reservationDate, day)
    })
  }

  // Modifier la fonction formatTime pour utiliser les champs séparés
  const formatTime = (timeString: string) => {
    // Si c'est déjà au format HH:MM:SS, extraire simplement HH:MM
    if (timeString.includes(":")) {
      return timeString.substring(0, 5)
    }
    // Sinon, utiliser la méthode précédente
    return format(new Date(timeString), "HH:mm")
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Réservation de salles</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle réservation</DialogTitle>
              <DialogDescription>Réservez une salle pour une date et une plage horaire spécifiques.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: fr }) : <span>Sélectionnez une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room" className="text-right">
                  Salle
                </Label>
                <div className="col-span-3">
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une salle" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name} {room.location ? `(${room.location})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startTime" className="text-right">
                  Heure de début
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endTime" className="text-right">
                  Heure de fin
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purpose" className="text-right">
                  Motif
                </Label>
                <Input
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Motif de la réservation"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateReservation}>Réserver</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
            <CardDescription>Sélectionnez une date pour voir les réservations</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Réservations du {format(date, "d MMMM yyyy", { locale: fr })}</CardTitle>
            <CardDescription>Liste des réservations pour la date sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">Chargement des réservations...</div>
            ) : getDayReservations(date).length === 0 ? (
              <div className="text-center p-4">Aucune réservation pour cette date</div>
            ) : (
              <div className="space-y-4">
                {getDayReservations(date).map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{reservation.roomName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                        </p>
                        {reservation.teacherName && (
                          <p className="text-xs text-muted-foreground">Réservé par: {reservation.teacherName}</p>
                        )}
                        {reservation.purpose && (
                          <p className="text-xs text-muted-foreground">Motif: {reservation.purpose}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteReservation(reservation.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
