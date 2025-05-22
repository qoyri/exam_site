"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download, Plus, CalendarIcon, School } from "lucide-react"
import Link from "next/link"
import { AbsencesList } from "@/components/absences-list"
import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { absenceService } from "@/lib/absence-service"
import { classService, type Class } from "@/lib/class-service"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function AbsencesPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [absencesByClass, setAbsencesByClass] = useState<{ [key: number]: number }>({})
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

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

  // Charger les classes et compter les absences par classe
  useEffect(() => {
    const fetchClassesAndAbsences = async () => {
      try {
        setIsLoadingClasses(true)

        // Récupérer les classes
        const classesData = await classService.getClasses()
        setClasses(classesData)

        // Récupérer toutes les absences
        const absences = await absenceService.getAbsences({
          startDate: format(dateRange.from, "yyyy-MM-dd"),
          endDate: format(dateRange.to, "yyyy-MM-dd"),
        })

        // Compter les absences par classe
        const absencesCount: { [key: number]: number } = {}
        absences.forEach((absence) => {
          if (absence.classId) {
            absencesCount[absence.classId] = (absencesCount[absence.classId] || 0) + 1
          }
        })

        setAbsencesByClass(absencesCount)
      } catch (error) {
        console.error("Erreur lors de la récupération des classes et des absences:", error)
      } finally {
        setIsLoadingClasses(false)
      }
    }

    if (activeTab === "byClass") {
      fetchClassesAndAbsences()
    }
  }, [activeTab, dateRange])

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
          <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
          <TabsTrigger value="week">Cette semaine</TabsTrigger>
          <TabsTrigger value="month">Ce mois</TabsTrigger>
          <TabsTrigger value="byClass">Par classe</TabsTrigger>
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
              <CardDescription>Consultez les absences enregistrées aujourd'hui</CardDescription>
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

        <TabsContent value="byClass" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Absences par classe</CardTitle>
                <CardDescription>Consultez et gérez les absences par classe</CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("justify-start text-left font-normal", "w-auto")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "d MMM", { locale: fr })} -{" "}
                    {format(dateRange.to, "d MMM yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                    locale={fr}
                  />
                  <div className="flex justify-between p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const prevMonth = subMonths(dateRange.from, 1)
                        setDateRange({
                          from: startOfMonth(prevMonth),
                          to: endOfMonth(prevMonth),
                        })
                      }}
                    >
                      Mois précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextMonth = addMonths(dateRange.from, 1)
                        setDateRange({
                          from: startOfMonth(nextMonth),
                          to: endOfMonth(nextMonth),
                        })
                      }}
                    >
                      Mois suivant
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              {isLoadingClasses ? (
                <div className="flex justify-center p-4">Chargement des classes...</div>
              ) : classes.length === 0 ? (
                <div className="text-center p-4">Aucune classe trouvée</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((classe) => (
                    <Link
                      key={classe.id}
                      href={`/absences/classe/${classe.id}?from=${format(dateRange.from, "yyyy-MM-dd")}&to=${format(dateRange.to, "yyyy-MM-dd")}`}
                      className="block"
                    >
                      <div className="border rounded-lg p-4 hover:bg-muted transition-colors flex items-center justify-between">
                        <div className="flex items-center">
                          <School className="h-5 w-5 mr-2 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">{classe.name}</h3>
                            <p className="text-sm text-muted-foreground">{classe.studentCount || 0} élèves</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {absencesByClass[classe.id] || 0} absence{(absencesByClass[classe.id] || 0) > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
