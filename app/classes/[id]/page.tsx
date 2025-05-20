"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Users, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { classService, type Class, type Student } from "@/lib/class-service"
import { absenceService, type Absence } from "@/lib/absence-service"
import { pointsService, type StudentPoints } from "@/lib/points-service"
import { StudentPointsBadge } from "@/components/student-points-badge"
import { AddPointsDialog } from "@/components/add-points-dialog"

export default function ClassDetailsPage() {
  const params = useParams()
  const classId = Number.parseInt(params.id as string)

  const [classDetails, setClassDetails] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [studentPoints, setStudentPoints] = useState<StudentPoints[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("students")

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Récupérer les détails de la classe
        const classData = await classService.getClassById(classId)
        setClassDetails(classData)
        setStudents(classData.students || [])

        // Récupérer les absences pour cette classe
        const absencesData = await absenceService.getAbsences({ classId })
        setAbsences(absencesData)

        // Récupérer les points des étudiants de cette classe
        if (classData.students && classData.students.length > 0) {
          try {
            // Utiliser getClassRanking si disponible, sinon gérer l'erreur
            const pointsData = await pointsService.getClassRanking(classId)
            setStudentPoints(pointsData)
          } catch (err) {
            console.error("Erreur lors de la récupération des points:", err)
            // Ne pas bloquer le chargement de la page si les points ne sont pas disponibles
            setStudentPoints([])
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des détails de la classe:", err)
        setError("Impossible de charger les détails de la classe. Veuillez réessayer plus tard.")
      } finally {
        setLoading(false)
      }
    }

    if (classId) {
      fetchClassDetails()
    }
  }, [classId])

  const refreshPoints = async () => {
    try {
      // Utiliser getClassRanking si disponible, sinon gérer l'erreur
      const pointsData = await pointsService.getClassRanking(classId)
      setStudentPoints(pointsData)
    } catch (err) {
      console.error("Erreur lors de la récupération des points:", err)
    }
  }

  const getStudentPoints = (studentId: number): number => {
    const student = studentPoints.find((s) => s.studentId === studentId)
    return student ? student.points : 0
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
  }

  if (loading) {
    return (
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    )
  }

  if (error || !classDetails) {
    return (
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error || "Impossible de charger les détails de la classe."}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild>
              <Link href="/classes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la liste des classes
              </Link>
            </Button>
          </div>
        </div>
    )
  }

  return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{classDetails.name}</h1>
          <Button asChild variant="outline">
            <Link href="/classes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Étudiants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Absences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absences.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Moyenne de points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentPoints.length > 0
                    ? (studentPoints.reduce((sum, student) => sum + student.points, 0) / studentPoints.length).toFixed(1)
                    : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="students">Étudiants</TabsTrigger>
            <TabsTrigger value="absences">Absences</TabsTrigger>
            <TabsTrigger value="points">Points</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Liste des étudiants</CardTitle>
              </CardHeader>
              <CardContent>
                {students.length > 0 ? (
                    <div className="space-y-4">
                      {students.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{`${student.firstName} ${student.lastName}`}</h3>
                              <p className="text-sm text-muted-foreground">
                                {student.birthdate ? formatDate(student.birthdate) : "Date de naissance non disponible"}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <StudentPointsBadge points={getStudentPoints(student.id)} />
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/absences/saisie?studentId=${student.id}&classId=${classId}`}>
                                  Saisir absence
                                </Link>
                              </Button>
                            </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucun étudiant dans cette classe.</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="absences">
            <Card>
              <CardHeader>
                <CardTitle>Absences récentes</CardTitle>
              </CardHeader>
              <CardContent>
                {absences.length > 0 ? (
                    <div className="space-y-4">
                      {absences.map((absence) => (
                          <div key={absence.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium">{absence.studentName}</h3>
                              <div
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      absence.status?.toLowerCase() === "justifiée"
                                          ? "bg-green-100 text-green-800"
                                          : absence.status?.toLowerCase() === "non justifiée"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-yellow-100 text-yellow-800"
                                  }`}
                              >
                                {absence.status || "En attente"}
                              </div>
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Date: </span>
                              {absence.absenceDate ? formatDate(absence.absenceDate) : "Non spécifiée"}
                            </div>
                            {absence.reason && (
                                <div className="mt-1 text-sm">
                                  <span className="text-muted-foreground">Motif: </span>
                                  {absence.reason}
                                </div>
                            )}
                            <div className="mt-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/absences/${absence.id}`}>Voir détails</Link>
                              </Button>
                            </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucune absence enregistrée pour cette classe.</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Classement des points</CardTitle>
              </CardHeader>
              <CardContent>
                {studentPoints.length > 0 ? (
                    <div className="space-y-4">
                      {studentPoints.map((student, index) => (
                          <div key={student.studentId} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center">
                              <div
                                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
                                      index === 0
                                          ? "bg-yellow-100 text-yellow-800"
                                          : index === 1
                                              ? "bg-gray-100 text-gray-800"
                                              : index === 2
                                                  ? "bg-amber-100 text-amber-800"
                                                  : "bg-blue-100 text-blue-800"
                                  }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-medium">
                                  {student.firstName} {student.lastName}
                                </h3>
                                <p className="text-sm text-muted-foreground">{student.points} points</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <AddPointsDialog
                                  studentId={student.studentId}
                                  studentName={`${student.firstName} ${student.lastName}`}
                                  onPointsAdded={refreshPoints}
                                  buttonSize="sm"
                              />
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/points?studentId=${student.studentId}`}>Détails</Link>
                              </Button>
                            </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucun point enregistré pour cette classe.</p>
                      <Button className="mt-4" asChild>
                        <Link href="/points">Gérer les points</Link>
                      </Button>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}
