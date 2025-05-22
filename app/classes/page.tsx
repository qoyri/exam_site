"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Users, CalendarDays, RefreshCw } from "lucide-react"
import Link from "next/link"
import { classService, type Class } from "@/lib/class-service"
import { toast } from "@/hooks/use-toast"

// Ajoutons la fonction getInitials et assurons-nous qu'elle est utilisée correctement

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

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      // Utiliser la méthode de filtrage côté client
      const data = await classService.getFilteredClasses(searchTerm)
      setClasses(data)
    } catch (error) {
      console.error("Erreur lors de la récupération des classes:", error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les classes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Effet pour charger les classes au chargement de la page
  useEffect(() => {
    fetchClasses()
  }, [])

  // Effet pour filtrer les classes lorsque le terme de recherche change
  useEffect(() => {
    const filterClasses = async () => {
      try {
        const filteredData = await classService.getFilteredClasses(searchTerm)
        setClasses(filteredData)
      } catch (error) {
        console.error("Erreur lors du filtrage des classes:", error)
      }
    }

    filterClasses()
  }, [searchTerm])

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    classService.clearCache()
    fetchClasses()
    toast({
      title: "Rafraîchissement",
      description: "Les données ont été rafraîchies.",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Mes classes</h2>
        <Button variant="outline" size="icon" onClick={handleRefresh} title="Rafraîchir">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Rechercher une classe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center p-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">Aucune classe trouvée</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm
              ? "Aucune classe ne correspond à votre recherche."
              : "Vous n'avez pas encore de classes assignées."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{cls.name}</CardTitle>
                <CardDescription>{cls.studentCount} élèves</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{cls.studentCount} élèves</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Aujourd'hui</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Button asChild className="w-full">
                    <Link href={`/classes/${cls.id}`}>Voir les détails</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/absences/saisie?classId=${cls.id}`}>Saisir des absences</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
