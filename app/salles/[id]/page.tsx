"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, MapPin, Users, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { roomService, type Room, type Reservation } from "@/lib/room-service"
import { toast } from "@/hooks/use-toast"
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

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = Number.parseInt(params.id as string)

  const [room, setRoom] = useState<Room | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [date, setDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState<string>("08:00")
  const [endTime, setEndTime] = useState<string>("10:00")
  const [purpose, setPurpose] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchRoomData = async () => {
      setIsLoading(true)
      try {
        const roomData = await roomService.getRoomById(roomId)
        setRoom(roomData)
      } catch (error) {
        console.error(`Erreur lors de la récupération de la salle ${roomId}:`, error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les détails de la salle.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoomData()
  }, [roomId])

  useEffect(() => {
    const fetchReservations = async () => {
      if (!roomId) return

      try {
        const startDate = format(date, "yyyy-MM-dd")
        const endDate = format(date, "yyyy-MM-dd")

        const data = await roomService.getRoomReservations(roomId, startDate, endDate)
        setReservations(data)
      } catch (error) {
        console.error(`Erreur lors de la récupération des réservations pour la salle ${roomId}:`, error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les réservations.",
          variant: "destructive",
        })
      }
    }

    fetchReservations()
  }, [roomId, date])

  // Modifier la fonction handleCreateReservation pour ne vérifier que les champs obligatoires pour les réservations
  const handleCreateReservation = async () => {
    if (!startTime || !endTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les heures de début et de fin.",
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
        roomId: roomId,
        startTime: `${reservationDate}T${startDateTime}`,
        endTime: `${reservationDate}T${endDateTime}`,
        purpose: purpose || "Réservation sans motif spécifié",
      })

      toast({
        title: "Succès",
        description: "Réservation créée avec succès.",
      })

      // Rafraîchir les réservations
      const startDate = format(date, "yyyy-MM-dd")
      const endDate = format(date, "yyyy-MM-dd")
      const data = await roomService.getRoomReservations(roomId, startDate, endDate)
      setReservations(data)

      // Réinitialiser les champs et fermer le dialogue
      setPurpose("")
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Erreur lors de la création de la réservation:", error)

      // Extraire le message d'erreur de la réponse API si disponible
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
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
      const endDate = format(date, "yyyy-MM-dd")
      const data = await roomService.getRoomReservations(roomId, startDate, endDate)
      setReservations(data)
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la réservation:", error)

      // Extraire le message d'erreur de la réponse API si disponible
      const errorMessage = error.response?.data?.message || error.message || "Impossible de supprimer la réservation."

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getDayReservations = (day: Date) => {
    return reservations.filter((reservation) => {
      // Convertir les deux dates en objets Date pour comparer uniquement la date (sans l'heure)
      const reservationDate = new Date(reservation.startTime)
      return isSameDay(reservationDate, day)
    })
  }

  const formatTime = (isoString: string) => {
    try {
      // Vérifier si la chaîne contient un T (format ISO)
      if (isoString.includes("T")) {
        return format(new Date(isoString), "HH:mm")
      } else {
        // Si c'est juste une heure (HH:MM), la retourner directement
        return isoString
      }
    } catch (error) {
      console.error("Erreur de formatage de l'heure:", error, isoString)
      return isoString
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Salle non trouvée</h2>
          <p className="text-muted-foreground mt-2">La salle demandée n'existe pas ou vous n'y avez pas accès.</p>
          <Button className="mt-4" onClick={() => router.push("/salles")}>
            Retour à la liste des salles
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{room.name}</h2>
          <p className="text-muted-foreground">
            {room.location && (
              <span className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {room.location}
              </span>
            )}
            {room.capacity && (
              <span className="flex items-center mt-1">
                <Users className="h-4 w-4 mr-1" />
                Capacité: {room.capacity} personnes
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push("/salles")}>
            Toutes les salles
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Réserver cette salle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Réserver {room.name}</DialogTitle>
                <DialogDescription>
                  Réservez cette salle pour une date et une plage horaire spécifiques.
                </DialogDescription>
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
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(date) => date && setDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    Heure de début *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    Heure de fin *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="col-span-3"
                    required
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
                <div className="col-span-4 text-xs text-muted-foreground">* Champs obligatoires</div>
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
            {getDayReservations(date).length === 0 ? (
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
