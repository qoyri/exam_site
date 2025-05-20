"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, BookOpen, Calendar, Home, Users } from "lucide-react"
import { clientStatService } from "@/lib/client-stat-service"

// Ajoutons une fonction pour générer les initiales à partir du nom d'utilisateur
// et assurons-nous qu'elle est utilisée correctement dans le composant

// Ajoutez cette fonction d'utilitaire en haut du fichier, après les imports
function getInitials(name: string): string {
  if (!name) return "??"

  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  // Si un seul mot, prendre les deux premières lettres ou la première lettre doublée
  return name.length > 1 ? name.substring(0, 2).toUpperCase() : `${name[0]}${name[0]}`.toUpperCase()
}

// Assurez-vous que cette fonction est utilisée partout où des initiales sont affichées
// Par exemple, si vous avez un composant Avatar qui affiche des initiales, modifiez-le pour utiliser cette fonction

export function DashboardStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await clientStatService.getDashboardStats()
        console.log("Statistiques récupérées:", data)
        setStats(data)
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err)
        setError("Impossible de charger les statistiques. Veuillez réessayer plus tard.")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>Aucune donnée statistique disponible.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Étudiants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClasses || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Absences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAbsences || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.absencesByStatus && typeof stats.absencesByStatus === "object" ? (
              <>
                {stats.absencesByStatus["justifiée"] || 0} justifiées • {stats.absencesByStatus["non justifiée"] || 0}{" "}
                non justifiées
              </>
            ) : (
              "Aucune donnée disponible"
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Réservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalReservations || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Ce mois-ci</div>
        </CardContent>
      </Card>
    </div>
  )
}
