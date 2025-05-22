"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, parse } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, UserCheck, UserX, Save } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { classService, type Class, type Student } from "@/lib/class-service"
import { absenceService, type Absence } from "@/lib/absence-service"
import { settingsService } from "@/lib/settings-service"
import { toast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const formSchema = z.object({
  date: z.date({
    required_error: "Veuillez sélectionner une date.",
  }),
  presentStudentIds: z.array(z.string()),
  status: z.string().optional(),
  reason: z.string().optional(),
})

export default function ClasseAbsencesPage({ params }: { params: { id: string } }) {
  const classId = Number.parseInt(params.id)
  const searchParams = useSearchParams()
  const fromDate = searchParams.get("from")

  const [date, setDate] = useState<Date>(() => {
    if (fromDate) {
      try {
        return parse(fromDate, "yyyy-MM-dd", new Date())
      } catch (e) {
        console.error("Erreur de parsing de la date:", e)
        return new Date()
      }
    }
    return new Date()
  })

  const [classe, setClasse] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [profileImages, setProfileImages] = useState<Map<number, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: date,
      presentStudentIds: [],
      status: "en attente",
      reason: "",
    },
  })

  // Récupérer la classe et ses élèves
  useEffect(() => {
    const fetchClassAndAbsences = async () => {
      try {
        setIsLoading(true)

        // Récupérer les détails de la classe
        const classData = await classService.getClassById(classId)
        if (!classData) {
          throw new Error("Classe non trouvée")
        }

        setClasse(classData)

        // S'assurer que students est un tableau
        if (Array.isArray(classData.students)) {
          setStudents(classData.students)

          // Initialiser les élèves présents avec tous les élèves
          const allStudentIds = classData.students.map((student) => student.id.toString())
          form.setValue("presentStudentIds", allStudentIds)

          // Récupérer les absences pour cette classe à la date sélectionnée
          if (classData.students.length > 0) {
            try {
              await fetchAbsencesForDate(date)
            } catch (error) {
              console.error("Erreur lors du chargement initial des absences:", error)
            }
          }

          // Récupérer les images de profil pour chaque élève
          await fetchProfileImages(classData.students)
        } else {
          setStudents([])
          form.setValue("presentStudentIds", [])
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les données de la classe.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (classId) {
      fetchClassAndAbsences()
    }
  }, [classId])

  // Récupérer les images de profil pour tous les élèves
  const fetchProfileImages = async (studentsList: Student[]) => {
    const newProfileImages = new Map<number, string>()

    // Récupérer les images de profil uniquement pour les élèves qui ont un userId
    for (const student of studentsList) {
      if (student.userId) {
        try {
          const profileImage = await settingsService.getProfileImage(student.userId)
          if (profileImage) {
            newProfileImages.set(student.id, profileImage)
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération de l'image de profil pour l'élève ${student.id}:`, error)
        }
      }
    }

    setProfileImages(newProfileImages)
  }

  // Fonction séparée pour récupérer les absences
  const fetchAbsencesForDate = async (selectedDate: Date) => {
    if (!selectedDate || !classId) {
      console.error("Date ou ID de classe invalide")
      return
    }

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      // Vider le cache pour forcer une nouvelle requête
      absenceService.clearCache()

      // Récupérer les absences pour cette classe à la date sélectionnée
      const absencesData = await absenceService.getAbsences({
        classId: classId,
        startDate: formattedDate,
        endDate: formattedDate,
      })

      setAbsences(absencesData)
      return absencesData
    } catch (error) {
      console.error("Erreur lors de la récupération des absences:", error)
      setAbsences([])
      throw error
    }
  }

  // Charger les absences pour une date spécifique et mettre à jour le formulaire
  const loadAbsencesForDate = async (selectedDate: Date) => {
    if (!selectedDate || !classId || !students.length) {
      return
    }

    try {
      // Récupérer les absences
      const absencesData = await fetchAbsencesForDate(selectedDate)

      // Marquer tous les élèves comme présents par défaut, sauf ceux qui sont absents
      const absentStudentIds = absencesData.map((absence) => absence.studentId.toString())
      const presentStudentIds = students
        .map((student) => student.id.toString())
        .filter((id) => !absentStudentIds.includes(id))

      // Mettre à jour le formulaire manuellement sans utiliser setValue
      form.reset({
        ...form.getValues(),
        presentStudentIds: presentStudentIds,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les absences.",
        variant: "destructive",
      })
    }
  }

  // Mettre à jour les absences lorsque la date change
  const onDateChange = async (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      form.setValue("date", newDate)
      await loadAbsencesForDate(newDate)
    }
  }

  // Obtenir les initiales d'un élève pour l'avatar
  const getStudentInitials = (student: Student): string => {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase()
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!classId || !values.date) {
      toast({
        title: "Erreur",
        description: "Données de formulaire incomplètes.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const formattedDate = format(values.date, "yyyy-MM-dd")

      // S'assurer que students est un tableau avant de continuer
      if (!Array.isArray(students) || students.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun étudiant disponible pour enregistrer les absences.",
          variant: "destructive",
        })
        return
      }

      // 1. Identifier les élèves qui étaient absents mais sont maintenant présents (absences à supprimer)
      const absentStudentIds = students
        .map((student) => student.id.toString())
        .filter((id) => !values.presentStudentIds.includes(id))

      // 2. Trouver les absences existantes pour cette date
      const existingAbsences = absences.filter(
        (absence) => format(new Date(absence.absenceDate), "yyyy-MM-dd") === formattedDate,
      )

      // 3. Absences à supprimer (élèves maintenant présents)
      const absencesToDelete = existingAbsences.filter(
        (absence) => !absentStudentIds.includes(absence.studentId.toString()),
      )

      // 4. Élèves nouvellement absents (absences à créer)
      const existingAbsentStudentIds = existingAbsences.map((absence) => absence.studentId.toString())
      const newAbsentStudentIds = absentStudentIds.filter((id) => !existingAbsentStudentIds.includes(id))

      // 5. Absences à mettre à jour (statut ou motif modifié)
      const absencesToUpdate = existingAbsences.filter(
        (absence) =>
          absentStudentIds.includes(absence.studentId.toString()) &&
          (absence.status !== values.status || absence.reason !== values.reason),
      )

      // Effectuer les opérations
      let successCount = 0
      const totalOperations = absencesToDelete.length + newAbsentStudentIds.length + absencesToUpdate.length

      // Supprimer les absences
      for (const absence of absencesToDelete) {
        try {
          await absenceService.deleteAbsence(absence.id)
          successCount++
        } catch (error) {
          console.error(`Erreur lors de la suppression de l'absence ${absence.id}:`, error)
        }
      }

      // Créer les nouvelles absences
      for (const studentId of newAbsentStudentIds) {
        try {
          await absenceService.createAbsence({
            studentId: Number.parseInt(studentId),
            absenceDate: formattedDate,
            status: values.status,
            reason: values.reason,
          })
          successCount++
        } catch (error) {
          console.error(`Erreur lors de la création de l'absence pour l'élève ${studentId}:`, error)
        }
      }

      // Mettre à jour les absences existantes
      for (const absence of absencesToUpdate) {
        try {
          await absenceService.updateAbsence(absence.id, {
            absenceDate: formattedDate,
            status: values.status,
            reason: values.reason,
          })
          successCount++
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de l'absence ${absence.id}:`, error)
        }
      }

      // Afficher un toast de résultat
      if (totalOperations === 0) {
        toast({
          title: "Information",
          description: "Aucune modification à enregistrer.",
          variant: "default",
        })
      } else if (successCount === totalOperations) {
        toast({
          title: "Succès",
          description: `Modifications enregistrées avec succès.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Partiellement réussi",
          description: `${successCount} sur ${totalOperations} opération(s) réussie(s).`,
          variant: "default",
        })
      }

      // Recharger les absences pour mettre à jour l'affichage
      await fetchAbsencesForDate(values.date)
      await loadAbsencesForDate(values.date)
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des modifications:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les modifications.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/absences">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Absences : {classe?.name || "Chargement..."}</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des absences par date</CardTitle>
          <CardDescription>Modifiez les absences pour la classe {classe?.name}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground",
                            )}
                          >
                            {date ? (
                              format(date, "EEEE d MMMM yyyy", { locale: fr })
                            ) : (
                              <span>Sélectionnez une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => onDateChange(newDate)}
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="presentStudentIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liste des élèves</FormLabel>
                    <FormDescription>Cochez les élèves présents, décochez les absents</FormDescription>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                      {isLoading ? (
                        <div className="p-2">Chargement des élèves...</div>
                      ) : !students || students.length === 0 ? (
                        <div className="p-2">Aucun élève dans cette classe</div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const allIds = students.map((student) => student.id.toString())
                                form.setValue("presentStudentIds", allIds)
                              }}
                              className="flex items-center gap-1"
                            >
                              <UserCheck className="h-4 w-4" />
                              <span>Tous présents</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => form.setValue("presentStudentIds", [])}
                              className="flex items-center gap-1"
                            >
                              <UserX className="h-4 w-4" />
                              <span>Tous absents</span>
                            </Button>
                          </div>
                          {students.map((student) => (
                            <div key={student.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`student-${student.id}`}
                                checked={field.value.includes(student.id.toString())}
                                onCheckedChange={(checked) => {
                                  const studentId = student.id.toString()
                                  const currentValues = [...field.value]
                                  if (checked) {
                                    if (!currentValues.includes(studentId)) {
                                      currentValues.push(studentId)
                                    }
                                  } else {
                                    const index = currentValues.indexOf(studentId)
                                    if (index !== -1) {
                                      currentValues.splice(index, 1)
                                    }
                                  }
                                  form.setValue("presentStudentIds", currentValues)
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={profileImages.get(student.id) || ""}
                                    alt={`${student.firstName} ${student.lastName}`}
                                  />
                                  <AvatarFallback>{getStudentInitials(student)}</AvatarFallback>
                                </Avatar>
                                <label
                                  htmlFor={`student-${student.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {student.firstName} {student.lastName}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {students &&
                        students.length > 0 &&
                        `${field.value.length} élève(s) présent(s), ${students.length - field.value.length} élève(s) absent(s)`}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut des absences</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en attente">En attente</SelectItem>
                        <SelectItem value="justifiée">Justifiée</SelectItem>
                        <SelectItem value="non justifiée">Non justifiée</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif des absences (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Saisissez le motif des absences..." className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>Ce motif sera appliqué à toutes les absences enregistrées.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/absences")}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving} className="flex items-center gap-1">
                {isSaving ? (
                  "Enregistrement..."
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Enregistrer les modifications</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
