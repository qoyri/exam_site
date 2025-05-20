"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Plus } from "lucide-react"
import Link from "next/link"
import { AbsencesList } from "@/components/absences-list"
import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { absenceService } from "@/lib/absence-service"

export default function AbsencesPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  // Calculer les dates pour les filtres
  const today = new Date()
  const todayStr = format(today, "yyyy-MM-dd")

  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Lundi
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }) // Dimanche
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const weekEndStr = format(weekEnd, "yyyy-MM-dd")

  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const monthStartStr = format(monthStart, "yyyy-MM-dd")
  const monthEndStr = format(monthEnd, "yyyy-MM-dd")

  // Précharger toutes les absences au chargement de la page
  useEffect(() => {
    const loadAbsences = async () => {
      try {
        setIsLoading(true)
        // Vider le cache pour s'assurer d'avoir les données les plus récentes
        absenceService.clearCache()
        // Précharger toutes les absences
        await absenceService.getAbsences()
      } catch (error) {
        console.error("Erreur lors du préchargement des absences:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAbsences()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des absences</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/absences/saisie">
              <Plus className="mr-2 h-4 w-4" />
              Saisir des absences
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="today">Aujourd&#39;hui</TabsTrigger>
          <TabsTrigger value="week">Cette semaine</TabsTrigger>
          <TabsTrigger value="month">Ce mois</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Historique des absences</CardTitle>
                <CardDescription>Consultez et gérez toutes les absences</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">Chargement des absences...</div>
              ) : (
                <AbsencesList filter={{}} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Absences du jour</CardTitle>
              <CardDescription>Consultez les absences enregistrées aujourd&#39;hui</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">Chargement des absences...</div>
              ) : (
                <AbsencesList filter={{ startDate: todayStr, endDate: todayStr }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Absences de la semaine</CardTitle>
              <CardDescription>Consultez les absences enregistrées cette semaine</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">Chargement des absences...</div>
              ) : (
                <AbsencesList filter={{ startDate: weekStartStr, endDate: weekEndStr }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Absences du mois</CardTitle>
              <CardDescription>Consultez les absences enregistrées ce mois-ci</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">Chargement des absences...</div>
              ) : (
                <AbsencesList filter={{ startDate: monthStartStr, endDate: monthEndStr }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
