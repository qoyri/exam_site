"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, FileText, Users, Clock, BarChart3 } from "lucide-react"
import Link from "next/link"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentAbsences } from "@/components/recent-absences"
import { useEffect, useState } from "react"
import { classService, type Class } from "@/lib/class-service"

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await classService.getClasses()
        setClasses(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des classes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [])

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/rapports">
                <FileText className="mr-2 h-4 w-4" />
                Générer un rapport
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="absences">Absences</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DashboardStats />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Absences récentes</CardTitle>
                  <CardDescription>Les 5 dernières absences enregistrées</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentAbsences />
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Mes classes</CardTitle>
                  <CardDescription>Accès rapide à vos classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="text-center p-4">Chargement des classes...</div>
                    ) : classes.length === 0 ? (
                      <div className="text-center p-4">Aucune classe assignée</div>
                    ) : (
                      classes.map((classe) => (
                        <Button key={classe.id} variant="outline" className="w-full justify-start" asChild>
                          <Link href={`/classes/${classe.id}`}>
                            <Users className="mr-2 h-4 w-4" />
                            {classe.name}
                          </Link>
                        </Button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="absences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des absences</CardTitle>
                <CardDescription>Consultez et saisissez les absences des élèves</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cette section vous permet de gérer les absences des élèves. Vous pouvez consulter les absences par
                  classe, par élève ou par période.
                </p>
                <div className="mt-4 flex flex-col space-y-2">
                  <Button variant="outline" asChild>
                    <Link href="/absences/saisie">
                      <Clock className="mr-2 h-4 w-4" />
                      Saisir des absences
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/absences">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Historique des absences
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Génération de rapports</CardTitle>
                <CardDescription>Créez des rapports personnalisés</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cette section vous permet de générer différents types de rapports pour suivre la progression des
                  élèves et les absences.
                </p>
                <div className="mt-4 flex flex-col space-y-2">
                  <Button variant="outline" asChild>
                    <Link href="/rapports">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Rapport d'absences
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/rapports?tab=performance">
                      <FileText className="mr-2 h-4 w-4" />
                      Rapport de performance
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
