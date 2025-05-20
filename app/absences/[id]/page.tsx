"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { absenceService } from "@/lib/absence-service"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AbsenceDetailsProps {
  params: {
    id: string
  }
}

export default function AbsenceDetailsPage({ params }: AbsenceDetailsProps) {
  const { id } = params
  const router = useRouter()
  const { toast } = useToast()
  const [absence, setAbsence] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [document, setDocument] = useState<string>("")

  useEffect(() => {
    const fetchAbsence = async () => {
      try {
        setLoading(true)
        const data = await absenceService.getAbsenceById(Number.parseInt(id))
        setAbsence(data)

        // Initialiser les états avec les données de l'absence
        if (data) {
          // Convertir la date de format DateOnly (YYYY-MM-DD) en objet Date
          const [year, month, day] = data.absenceDate.split("-").map(Number)
          setDate(new Date(year, month - 1, day))
          setStatus(data.status || "")
          setReason(data.reason || "")
          setDocument(data.document || "")
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des détails de l'absence:", err)
        setError("Impossible de charger les détails de l'absence. Veuillez réessayer plus tard.")
      } finally {
        setLoading(false)
      }
    }

    fetchAbsence()
  }, [id])

  const handleSave = async () => {
    if (!date) {
      toast({
        title: "Erreur",
        description: "La date est requise",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      // Formater la date au format YYYY-MM-DD pour l'API
      const formattedDate = format(date, "yyyy-MM-dd")

      const updateData = {
        absenceDate: formattedDate,
        status,
        reason,
        document,
      }

      await absenceService.updateAbsence(Number.parseInt(id), updateData)

      toast({
        title: "Succès",
        description: "L'absence a été mise à jour avec succès",
      })

      // Rediriger vers la liste des absences
      router.push("/absences")
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'absence:", err)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'absence",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSaving(true)
      await absenceService.deleteAbsence(Number.parseInt(id))

      toast({
        title: "Succès",
        description: "L'absence a été supprimée avec succès",
      })

      // Rediriger vers la liste des absences
      router.push("/absences")
    } catch (err) {
      console.error("Erreur lors de la suppression de l'absence:", err)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'absence",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24 mr-2" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>Une erreur est survenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/absences")}>Retour à la liste</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!absence) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Absence non trouvée</CardTitle>
            <CardDescription>L&#39;absence demandée n&#39;existe pas</CardDescription>
          </CardHeader>
          <CardContent>
            <p>L&#39;absence avec l&#39;identifiant {id} n&#39;a pas été trouvée.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/absences")}>Retour à la liste</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Détails de l&#39;absence</h2>
        <Button variant="outline" onClick={() => router.push("/absences")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Absence de {absence.studentName}</CardTitle>
          <CardDescription>Classe: {absence.className}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date de l&#39;absence</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <RadioGroup id="status" value={status} onValueChange={setStatus} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en attente" id="status-pending" />
                <Label htmlFor="status-pending" className="font-normal">
                  En attente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="justifiée" id="status-justified" />
                <Label htmlFor="status-justified" className="font-normal">
                  Justifiée
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non justifiée" id="status-unjustified" />
                <Label htmlFor="status-unjustified" className="font-normal">
                  Non justifiée
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motif</Label>
            <Textarea
              id="reason"
              placeholder="Motif de l'absence"
              value={reason || ""}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Document justificatif</Label>
            <Input
              id="document"
              placeholder="Lien ou référence du document"
              value={document || ""}
              onChange={(e) => setDocument(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Entrez un lien vers le document justificatif ou une référence.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button variant="outline" onClick={() => router.push("/absences")} className="mr-2">
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={saving}>
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action ne peut pas être annulée. Cela supprimera définitivement cette absence.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}
