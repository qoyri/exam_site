"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { absenceService, type Absence } from "@/lib/absence-service"
import { format } from "date-fns"

// Ajoutez cette fonction d'utilitaire en haut du fichier, après les imports
function getInitials(firstName: string, lastName: string): string {
  if (!firstName && !lastName) return "??"

  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : ""
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : ""

  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`
  } else if (firstInitial) {
    return `${firstInitial}${firstInitial}`
  } else if (lastInitial) {
    return `${lastInitial}${lastInitial}`
  }

  return "??"
}

export function RecentAbsences() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await absenceService.getAbsences()
        // Trier par date décroissante et prendre les 5 premières
        const sortedAbsences = data
          .sort((a, b) => new Date(b.absenceDate).getTime() - new Date(a.absenceDate).getTime())
          .slice(0, 5)
        setAbsences(sortedAbsences)
      } catch (error) {
        console.error("Erreur lors de la récupération des absences récentes:", error)
        setError("Impossible de charger les absences récentes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAbsences()
  }, [])

  if (isLoading) {
    return <div className="flex justify-center p-4">Chargement des absences...</div>
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>
  }

  if (absences.length === 0) {
    return <div className="text-center p-4">Aucune absence récente</div>
  }

  return (
    <div className="space-y-4">
      {absences.map((absence) => (
        <div key={absence.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={`/placeholder-32px.png?height=32&width=32`} alt={absence.studentName} />
              <AvatarFallback>
                {getInitials(absence.studentName.split(" ")[0], absence.studentName.split(" ")[1])}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{absence.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {absence.className} - {format(new Date(absence.absenceDate), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant={
                absence.status === "justifiée"
                  ? "outline"
                  : absence.status === "non justifiée"
                    ? "destructive"
                    : "secondary"
              }
            >
              {absence.status}
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <a href={`/absences/${absence.id}`}>Détails</a>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
