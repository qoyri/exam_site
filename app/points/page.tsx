"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Trophy, Star, Plus, History, Award } from "lucide-react"
import { pointsService, type StudentPoints, type PointsHistory } from "@/lib/points-service"
import { classService } from "@/lib/class-service"
import { useToast } from "@/hooks/use-toast"

export default function PointsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("ranking")
  const [classes, setClasses] = useState<any[]>([])
  const [globalRanking, setGlobalRanking] = useState<StudentPoints[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentPoints | null>(null)
  const [studentHistory, setStudentHistory] = useState<PointsHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulaire d'ajout de points
  const [pointsToAdd, setPointsToAdd] = useState<number>(0)
  const [pointsReason, setPointsReason] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  // Charger les données initiales au chargement de la page
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Charger les classes
        const classData = await classService.getClasses()
        setClasses(classData)

        // Vérifier si un ID d'étudiant est passé en paramètre
        const studentId = searchParams.get("studentId")
        if (studentId) {
          await loadStudentDetails(Number.parseInt(studentId))
          setActiveTab("student")
        } else {
          // Charger le classement global par défaut
          await loadGlobalRanking()
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données initiales:", err)
        setError("Impossible de charger les données. Veuillez réessayer plus tard.")
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
    // Cette dépendance vide [] signifie que cet effet ne s'exécute qu'une seule fois au montage du composant
  }, [])

  // Gérer le changement d'onglet manuellement
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Charger les données appropriées lors du changement d'onglet
    if (value === "ranking" && globalRanking.length === 0) {
      loadGlobalRanking()
    }
  }

  const loadGlobalRanking = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await pointsService.getGlobalRanking()

      // Éliminer les doublons en utilisant l'ID de l'étudiant comme clé unique
      const uniqueStudentsMap = new Map()
      data.forEach((student) => {
        // Ne garder que la première occurrence de chaque étudiant
        if (!uniqueStudentsMap.has(student.studentId)) {
          uniqueStudentsMap.set(student.studentId, student)
        }
      })

      const uniqueStudents = Array.from(uniqueStudentsMap.values())

      // Trier par points (décroissant)
      uniqueStudents.sort((a, b) => b.points - a.points)

      // Calculer les rangs correctement
      const rankedStudents = []
      let currentRank = 1
      let currentPoints = null
      let studentsAtCurrentRank = 0

      for (let i = 0; i < uniqueStudents.length; i++) {
        const student = uniqueStudents[i]

        // Si c'est le premier étudiant ou si les points sont différents du précédent
        if (currentPoints === null || student.points !== currentPoints) {
          currentRank = i + 1
          currentPoints = student.points
          studentsAtCurrentRank = 1
        } else {
          // Même nombre de points que le précédent, même rang
          studentsAtCurrentRank++
        }

        rankedStudents.push({
          ...student,
          displayRank: currentRank,
        })
      }

      setGlobalRanking(rankedStudents)
    } catch (err) {
      console.error("Erreur lors du chargement du classement global:", err)
      setError("Impossible de charger le classement global. Veuillez réessayer plus tard.")
    } finally {
      setLoading(false)
    }
  }

  const loadStudentDetails = async (studentId: number) => {
    try {
      setLoading(true)
      setError(null)
      const [studentData, historyData] = await Promise.all([
        pointsService.getStudentPoints(studentId),
        pointsService.getStudentPointsHistory(studentId),
      ])
      setSelectedStudent(studentData)
      setStudentHistory(historyData)
    } catch (err) {
      console.error("Erreur lors du chargement des détails de l'étudiant:", err)
      setError("Impossible de charger les détails de l'étudiant. Veuillez réessayer plus tard.")
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (student: StudentPoints) => {
    setSelectedStudent(student)
    loadStudentDetails(student.studentId)
    setActiveTab("student")
  }

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudent) return

    try {
      setSubmitting(true)

      await pointsService.addPointsToStudent(selectedStudent.studentId, {
        points: pointsToAdd,
        reason: pointsReason,
      })

      // Recharger les détails de l'étudiant
      await loadStudentDetails(selectedStudent.studentId)

      // Réinitialiser le formulaire
      setPointsToAdd(0)
      setPointsReason("")

      toast({
        title: "Points ajoutés avec succès",
        description: `${Math.abs(pointsToAdd)} points ${pointsToAdd >= 0 ? "ajoutés à" : "retirés de"} ${selectedStudent.firstName} ${selectedStudent.lastName}`,
        variant: "default",
      })
    } catch (err) {
      console.error("Erreur lors de l'ajout de points:", err)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les points. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Système de Points</h1>

      <Tabs defaultValue="ranking" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="ranking">Classement Global</TabsTrigger>
          <TabsTrigger value="student">Détails Étudiant</TabsTrigger>
        </TabsList>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                Classement Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
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
              ) : globalRanking.length > 0 ? (
                <div className="space-y-4">
                  {globalRanking.map((student: any) => {
                    // Utiliser le rang calculé
                    const rank = student.displayRank || 1

                    return (
                      <div
                        key={student.studentId}
                        className="flex items-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold ${
                            rank === 1
                              ? "bg-yellow-100 text-yellow-800"
                              : rank === 2
                                ? "bg-gray-100 text-gray-800"
                                : rank === 3
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {rank}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{student.className || "Classe inconnue"}</p>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-bold">{student.points}</span>
                          <span className="text-sm text-muted-foreground ml-1">points</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun étudiant trouvé dans le classement.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student">
          {selectedStudent ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <Star className="h-8 w-8 text-yellow-500 mb-2" />
                      <div className="text-3xl font-bold">{selectedStudent.points}</div>
                      <div className="text-sm text-muted-foreground">Points totaux</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <Trophy className="h-8 w-8 text-blue-500 mb-2" />
                      <div className="text-3xl font-bold">#{selectedStudent.rankOverall || "N/A"}</div>
                      <div className="text-sm text-muted-foreground">Classement global</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <Award className="h-8 w-8 text-green-500 mb-2" />
                      <div className="text-3xl font-bold">{selectedStudent.className || "N/A"}</div>
                      <div className="text-sm text-muted-foreground">Classe</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Plus className="mr-2 h-5 w-5" />
                      Ajouter/Retirer des Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddPoints} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="points">Points (positif pour ajouter, négatif pour retirer)</Label>
                        <Input
                          id="points"
                          type="number"
                          value={pointsToAdd}
                          onChange={(e) => setPointsToAdd(Number.parseInt(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Raison</Label>
                        <Input
                          id="reason"
                          value={pointsReason}
                          onChange={(e) => setPointsReason(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={submitting} className="w-full">
                        {submitting
                          ? "Traitement en cours..."
                          : pointsToAdd >= 0
                            ? "Ajouter des points"
                            : "Retirer des points"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Historique des Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {loading ? (
                        [...Array(3)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ))
                      ) : studentHistory.length > 0 ? (
                        studentHistory.map((entry) => (
                          <div key={entry.id} className="border-b pb-3 last:border-0">
                            <div className="flex justify-between items-center">
                              <span
                                className={`font-medium ${entry.pointsChange >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {entry.pointsChange >= 0 ? "+" : ""}
                                {entry.pointsChange} points
                              </span>
                              <span className="text-sm text-muted-foreground">{formatDate(entry.createdAt)}</span>
                            </div>
                            <p className="text-sm mt-1">{entry.reason}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Aucun historique de points disponible.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Veuillez sélectionner un étudiant dans le classement pour voir ses détails.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
