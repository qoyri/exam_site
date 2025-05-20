"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Download, Calendar, Users, FileText, PieChart } from "lucide-react"
import { ReportForm } from "@/components/report-form"
import { clientStatService } from "@/lib/client-stat-service"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function RapportsPage() {
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [absenceStats, setAbsenceStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [dashboardData, absenceData] = await Promise.all([
          clientStatService.getDashboardStats(),
          clientStatService.getAbsenceStats(),
        ])

        setDashboardStats(dashboardData)
        setAbsenceStats(absenceData)
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Génération de rapports</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            Imprimer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="absences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="absences">Absences</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="custom">Personnalisé</TabsTrigger>
        </TabsList>

        <TabsContent value="absences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapport d'absences</CardTitle>
              <CardDescription>Générez un rapport détaillé des absences par classe, élève ou période</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportForm type="absences" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aperçu des statistiques d'absences</CardTitle>
              <CardDescription>Résumé des absences pour toutes les classes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <div className="text-sm font-medium">Total des absences</div>
                      <div className="text-2xl font-bold">{absenceStats?.totalAbsences || 0}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-sm font-medium">Absences justifiées</div>
                      <div className="text-2xl font-bold">{absenceStats?.justifiedAbsences || 0}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-sm font-medium">Absences non justifiées</div>
                      <div className="text-2xl font-bold">{absenceStats?.unjustifiedAbsences || 0}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 text-lg font-medium">Répartition des absences</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Justifiées", value: absenceStats?.justifiedAbsences || 0 },
                            { name: "Non justifiées", value: absenceStats?.unjustifiedAbsences || 0 },
                            { name: "En attente", value: absenceStats?.pendingAbsences || 0 },
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" name="Nombre d'absences" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rapport mensuel</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Résumé des absences du mois en cours</p>
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rapport par classe</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Absences regroupées par classe</p>
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Statistiques d'absences</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Analyse statistique des absences</p>
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapport de performance</CardTitle>
              <CardDescription>Générez un rapport sur les performances des élèves</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportForm type="performance" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aperçu des performances</CardTitle>
              <CardDescription>Résumé des performances pour toutes les classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-center text-muted-foreground">
                  Les données de performance seront disponibles après la génération d'un rapport.
                </p>
                <Button className="mt-4">
                  <PieChart className="mr-2 h-4 w-4" />
                  Générer un rapport de performance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapport personnalisé</CardTitle>
              <CardDescription>Créez un rapport avec les critères de votre choix</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportForm type="custom" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
