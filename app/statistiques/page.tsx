"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, BarChart3, Users, BookOpen, Calendar } from "lucide-react"
import { clientStatService } from "@/lib/client-stat-service"
import { classService, type Class, type Student as StudentType } from "@/lib/class-service"
import { absenceService } from "@/lib/absence-service"
import { roomService, type Room as RoomType, type Reservation as ReservationType } from "@/lib/room-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Définition des interfaces pour les types
// interface Student {
//   id: number
//   classId: number
//   firstName: string
//   lastName: string
//   birthdate: string
// }

// interface Class {
//   id: number
//   name: string
//   studentCount?: number
//   students?: Student[]
// }

// Utilisons les types importés au lieu de les redéfinir
type Student = StudentType
type Room = RoomType
type Reservation = ReservationType

interface DashboardStats {
  totalStudents: number
  totalClasses: number
  totalAbsences: number
  totalReservations: number
  absencesByStatus: Record<string, number>
}

interface AbsenceStats {
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
}

interface ClassStats {
  className: string
  studentCount: number
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
  students: Student[]
}

interface RoomStats {
  totalRooms: number
  totalReservations: number
  rooms: Room[]
  reservations: Reservation[]
}

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

export default function StatistiquesPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [absenceStats, setAbsenceStats] = useState<AbsenceStats | null>(null)
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null)
  const [classStats, setClassStats] = useState<ClassStats | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger la liste des classes au chargement de la page
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await classService.getClasses()
        console.log("Classes récupérées:", data)
        setClasses(data)

        // Sélectionner la première classe par défaut si disponible
        if (data.length > 0 && !selectedClassId) {
          setSelectedClassId(data[0].id)
        }
      } catch (err) {
        console.error("Erreur lors du chargement des classes:", err)
      }
    }

    fetchClasses()
  }, [])

  // Charger les statistiques en fonction de l'onglet actif
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        if (activeTab === "dashboard") {
          // Récupérer les statistiques du tableau de bord
          const data = await clientStatService.getDashboardStats()
          console.log("Statistiques du tableau de bord:", data)
          setDashboardStats(data)
        } else if (activeTab === "absences") {
          // Récupérer directement les absences pour l'onglet absences
          const absences = await absenceService.getAbsences()
          console.log("Absences récupérées:", absences)

          // Calculer les statistiques d'absences
          const justifiedCount = absences.filter((a) => a.status?.toLowerCase() === "justifiée").length
          const unjustifiedCount = absences.filter((a) => a.status?.toLowerCase() === "non justifiée").length
          const pendingCount = absences.filter((a) => !a.status || a.status.toLowerCase() === "en attente").length

          setAbsenceStats({
            totalAbsences: absences.length,
            justifiedAbsences: justifiedCount,
            unjustifiedAbsences: unjustifiedCount,
            pendingAbsences: pendingCount,
          })
        } else if (activeTab === "rooms") {
          // Récupérer directement les salles et réservations pour l'onglet salles
          const [rooms, reservations] = await Promise.all([roomService.getRooms(), roomService.getReservations()])

          console.log("Salles récupérées:", rooms)
          console.log("Réservations récupérées:", reservations)

          setRoomStats({
            totalRooms: rooms.length,
            totalReservations: reservations.length,
            rooms: rooms,
            reservations: reservations,
          })
        } else if (activeTab === "classes" && selectedClassId) {
          // Récupérer les détails de la classe sélectionnée
          const classDetails = await classService.getClassById(selectedClassId)
          console.log("Détails de la classe récupérés:", classDetails)

          // Récupérer les absences pour cette classe
          const absences = await absenceService.getAbsences({ classId: selectedClassId })
          console.log("Absences de la classe récupérées:", absences)

          const justifiedCount = absences.filter((a) => a.status?.toLowerCase() === "justifiée").length
          const unjustifiedCount = absences.filter((a) => a.status?.toLowerCase() === "non justifiée").length
          const pendingCount = absences.filter((a) => !a.status || a.status.toLowerCase() === "en attente").length

          setClassStats({
            className: classDetails.name,
            studentCount: classDetails.studentCount || classDetails.students?.length || 0,
            totalAbsences: absences.length,
            justifiedAbsences: justifiedCount,
            unjustifiedAbsences: unjustifiedCount,
            pendingAbsences: pendingCount,
            students: classDetails.students || [],
          })
        }
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err)
        setError("Impossible de charger les statistiques. Veuillez réessayer plus tard.")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [activeTab, selectedClassId])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleClassChange = (value: string) => {
    setSelectedClassId(Number.parseInt(value))
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Statistiques</h1>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="rooms">Salles</TabsTrigger>
        </TabsList>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="dashboard">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          ) : dashboardStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Étudiants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalStudents || 0}</div>
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
                    <div className="text-2xl font-bold">{dashboardStats.totalClasses || 0}</div>
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
                    <div className="text-2xl font-bold">{dashboardStats.totalAbsences || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Réservations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalReservations || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition des absences</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                          <div className="flex-1">Justifiées</div>
                          <div className="font-bold">
                            {dashboardStats.absencesByStatus &&
                            dashboardStats.absencesByStatus["justifiée"] !== undefined
                              ? dashboardStats.absencesByStatus["justifiée"]
                              : 0}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                          <div className="flex-1">Non justifiées</div>
                          <div className="font-bold">
                            {dashboardStats.absencesByStatus &&
                            dashboardStats.absencesByStatus["non justifiée"] !== undefined
                              ? dashboardStats.absencesByStatus["non justifiée"]
                              : 0}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                          <div className="flex-1">En attente</div>
                          <div className="font-bold">
                            {dashboardStats.absencesByStatus &&
                            dashboardStats.absencesByStatus["en attente"] !== undefined
                              ? dashboardStats.absencesByStatus["en attente"]
                              : 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques générales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Moyenne d'absences par étudiant:</span>
                        <span className="font-bold">
                          {dashboardStats.totalStudents > 0
                            ? (dashboardStats.totalAbsences / dashboardStats.totalStudents).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Moyenne d'étudiants par classe:</span>
                        <span className="font-bold">
                          {dashboardStats.totalClasses > 0
                            ? (dashboardStats.totalStudents / dashboardStats.totalClasses).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Taux d'absences justifiées:</span>
                        <span className="font-bold">
                          {dashboardStats.totalAbsences > 0 && dashboardStats.absencesByStatus
                            ? (
                                ((dashboardStats.absencesByStatus["justifiée"] || 0) / dashboardStats.totalAbsences) *
                                100
                              ).toFixed(2) + "%"
                            : "0.00%"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>Aucune donnée statistique disponible.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="absences">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          ) : absenceStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{absenceStats.totalAbsences}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">Justifiées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{absenceStats.justifiedAbsences}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">Non justifiées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{absenceStats.unjustifiedAbsences}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-600">En attente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{absenceStats.pendingAbsences}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition des absences</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                          <div className="flex-1">Justifiées</div>
                          <div className="font-bold">{absenceStats.justifiedAbsences}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                          <div className="flex-1">Non justifiées</div>
                          <div className="font-bold">{absenceStats.unjustifiedAbsences}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                          <div className="flex-1">En attente</div>
                          <div className="font-bold">{absenceStats.pendingAbsences}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pourcentages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Justifiées</span>
                          <span>
                            {absenceStats.totalAbsences > 0
                              ? ((absenceStats.justifiedAbsences / absenceStats.totalAbsences) * 100).toFixed(2) + "%"
                              : "0%"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full"
                            style={{
                              width: `${
                                absenceStats.totalAbsences > 0
                                  ? (absenceStats.justifiedAbsences / absenceStats.totalAbsences) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Non justifiées</span>
                          <span>
                            {absenceStats.totalAbsences > 0
                              ? ((absenceStats.unjustifiedAbsences / absenceStats.totalAbsences) * 100).toFixed(2) + "%"
                              : "0%"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-red-600 h-2.5 rounded-full"
                            style={{
                              width: `${
                                absenceStats.totalAbsences > 0
                                  ? (absenceStats.unjustifiedAbsences / absenceStats.totalAbsences) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>En attente</span>
                          <span>
                            {absenceStats.totalAbsences > 0
                              ? ((absenceStats.pendingAbsences / absenceStats.totalAbsences) * 100).toFixed(2) + "%"
                              : "0%"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-yellow-600 h-2.5 rounded-full"
                            style={{
                              width: `${
                                absenceStats.totalAbsences > 0
                                  ? (absenceStats.pendingAbsences / absenceStats.totalAbsences) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>Aucune donnée d'absence disponible.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="classes">
          <div className="mb-6">
            <div className="w-full md:w-[300px]">
              <Select value={selectedClassId?.toString()} onValueChange={handleClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          ) : classStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classStats.studentCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total absences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classStats.totalAbsences}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-600">Justifiées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{classStats.justifiedAbsences}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">Non justifiées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{classStats.unjustifiedAbsences}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition des absences</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                          <div className="flex-1">Justifiées</div>
                          <div className="font-bold">{classStats.justifiedAbsences}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                          <div className="flex-1">Non justifiées</div>
                          <div className="font-bold">{classStats.unjustifiedAbsences}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                          <div className="flex-1">En attente</div>
                          <div className="font-bold">{classStats.pendingAbsences}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Liste des étudiants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {classStats.students && classStats.students.length > 0 ? (
                        classStats.students.map((student) => (
                          <div key={student.id} className="flex items-center p-2 border rounded-md">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              {getInitials(student.firstName || "", student.lastName || "")}
                            </div>
                            <div>
                              <p className="font-medium">{`${student.firstName || ""} ${student.lastName || ""}`}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>Aucun étudiant dans cette classe.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                {classes.length > 0
                  ? "Veuillez sélectionner une classe pour voir ses statistiques."
                  : "Aucune classe disponible."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="rooms">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : roomStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total des salles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{roomStats.totalRooms}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total des réservations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{roomStats.totalReservations}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des salles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {roomStats.rooms && roomStats.rooms.length > 0 ? (
                        roomStats.rooms.map((room) => (
                          <div key={room.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div>
                              <p className="font-medium">{room.name}</p>
                              <p className="text-sm text-gray-500">{room.location}</p>
                            </div>
                            <div className="text-sm">
                              Capacité: <span className="font-medium">{room.capacity}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>Aucune salle disponible.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Réservations actuelles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {roomStats.reservations && roomStats.reservations.length > 0 ? (
                        roomStats.reservations.map((reservation) => (
                          <div key={reservation.id} className="p-2 border rounded-md">
                            <div className="flex justify-between items-center">
                              <p className="font-medium">{reservation.roomName}</p>
                              <p className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {new Date(reservation.reservationDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {reservation.startTime.substring(0, 5)} - {reservation.endTime.substring(0, 5)}
                            </div>
                            {reservation.userEmail && (
                              <div className="mt-1 text-xs text-gray-400">Réservé par: {reservation.userEmail}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p>Aucune réservation disponible.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Utilisation des salles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                          <div className="flex-1">Moyenne de réservations par salle</div>
                          <div className="font-bold">
                            {roomStats.totalRooms > 0
                              ? (roomStats.totalReservations / roomStats.totalRooms).toFixed(2)
                              : "0.00"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>Aucune donnée de salle disponible.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
