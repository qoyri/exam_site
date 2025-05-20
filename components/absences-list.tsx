"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { absenceService, type Absence, type AbsenceFilter } from "@/lib/absence-service"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

interface AbsencesListProps {
  filter?: AbsenceFilter
}

export function AbsencesList({ filter = {} }: AbsencesListProps) {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await absenceService.getAbsences(filter)
        setAbsences(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des absences:", error)
        setError("Impossible de charger les absences")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAbsences()
  }, [filter])

  const handleDelete = async (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette absence ?")) {
      try {
        await absenceService.deleteAbsence(id)
        setAbsences(absences.filter((absence) => absence.id !== id))
      } catch (error) {
        console.error("Erreur lors de la suppression de l'absence:", error)
        alert("Erreur lors de la suppression de l'absence")
      }
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Chargement des absences...</div>
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>
  }

  if (absences.length === 0) {
    return <div className="text-center p-4">Aucune absence trouvée</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Élève</TableHead>
            <TableHead>Classe</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Motif</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => (
            <TableRow key={absence.id}>
              <TableCell className="font-medium">{absence.studentName}</TableCell>
              <TableCell>{absence.className}</TableCell>
              <TableCell>{format(new Date(absence.absenceDate), "EEEE d MMMM yyyy", { locale: fr })}</TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>{absence.reason || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/absences/${absence.id}`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(absence.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
