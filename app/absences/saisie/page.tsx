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
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, UserCheck, UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { classService, type Class, type Student } from "@/lib/class-service"
import { absenceService } from "@/lib/absence-service"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { settingsService } from "@/lib/settings-service"

const formSchema = z.object({
  classId: z.string().min(1, {
    message: "Veuillez sélectionner une classe.",
  }),
  presentStudentIds: z.array(z.string()),
  date: z.date({
    required_error: "Veuillez sélectionner une date.",
  }),
  status: z.string().optional(),
  reason: z.string().optional(),
})

// Fonction pour obtenir les initiales à partir du nom et prénom
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Fonction pour formater la date de naissance
function formatBirthdate(birthdate: string | undefined): string {
  if (!birthdate) return "Non renseignée"
  try {
    const date = new Date(birthdate)
    return format(date, "dd/MM/yyyy")
  } catch (error) {
    return "Format invalide"
  }
}

export default function SaisieAbsencePage() {
  const [date, setDate] = useState<Date>()
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [profileImages, setProfileImages] = useState<Record<number, string>>({})
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: "",
      presentStudentIds: [],
      status: "en attente",
      reason: "",
    },
  })

  // Récupérer les classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await classService.getClasses()
        setClasses(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des classes:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les classes.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingClasses(false)
      }
    }

    fetchClasses()
  }, [])

  // Récupérer les élèves lorsque la classe change
  const selectedClassId = form.watch("classId")
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([])
      return
    }

    const fetchStudents = async () => {
      setIsLoadingStudents(true)
      try {
        const classData = await classService.getClassById(Number.parseInt(selectedClassId))
        setStudents(classData.students)

        // Marquer tous les élèves comme présents par défaut
        const allStudentIds = classData.students.map((student) => student.id.toString())
        form.setValue("presentStudentIds", allStudentIds)

        // Récupérer les images de profil
        await fetchProfileImages(classData.students)
      } catch (error) {
        console.error("Erreur lors de la récupération des élèves:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les élèves.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [selectedClassId, form])

  // Récupérer les images de profil des élèves
  const fetchProfileImages = async (students: Student[]) => {
    setIsLoadingImages(true)
    const images: Record<number, string> = {}

    try {
      // Récupérer les images uniquement pour les élèves qui ont un userId
      const studentsWithUserId = students.filter((student) => student.userId)

      // Traiter les requêtes en parallèle pour améliorer les performances
      const promises = studentsWithUserId.map(async (student) => {
        if (student.userId) {
          try {
            const profileImage = await settingsService.getProfileImage(student.userId)
            if (profileImage) {
              images[student.id] = profileImage
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération de l'image pour l'élève ${student.id}:`, error)
          }
        }
      })

      await Promise.all(promises)
      setProfileImages(images)
    } catch (error) {
      console.error("Erreur lors de la récupération des images de profil:", error)
    } finally {
      setIsLoadingImages(false)
    }
  }

  // Gérer le clic sur une carte d'élève
  const handleStudentCardClick = (studentId: string) => {
    const currentPresentIds = form.getValues("presentStudentIds")

    if (currentPresentIds.includes(studentId)) {
      // Si l'élève est présent, le marquer comme absent
      form.setValue(
        "presentStudentIds",
        currentPresentIds.filter((id) => id !== studentId),
      )
    } else {
      // Si l'élève est absent, le marquer comme présent
      form.setValue("presentStudentIds", [...currentPresentIds, studentId])
    }
  }

  // Vérifier si un élève est présent
  const isStudentPresent = (studentId: string): boolean => {
    return form.getValues("presentStudentIds").includes(studentId)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const formattedDate = format(values.date, "yyyy-MM-dd")

      // Identifier les élèves absents (ceux qui ne sont pas dans presentStudentIds)
      const absentStudentIds = students
        .map((student) => student.id.toString())
        .filter((id) => !values.presentStudentIds.includes(id))

      const totalAbsents = absentStudentIds.length

      if (totalAbsents === 0) {
        toast({
          title: "Information",
          description: "Aucun élève absent à enregistrer.",
          variant: "default",
        })
        router.push("/absences")
        return
      }

      // Afficher un toast de démarrage
      toast({
        title: "Traitement en cours",
        description: `Enregistrement de ${totalAbsents} absence(s)...`,
        variant: "default",
      })

      let successCount = 0

      // Traiter chaque élève absent
      for (const studentId of absentStudentIds) {
        try {
          await absenceService.createAbsence({
            studentId: Number.parseInt(studentId),
            absenceDate: formattedDate,
            status: values.status,
            reason: values.reason,
          })
          successCount++
        } catch (error) {
          console.error(`Erreur lors de l'enregistrement de l'absence pour l'élève ${studentId}:`, error)
        }
      }

      // Afficher un toast de résultat
      if (successCount === totalAbsents) {
        toast({
          title: "Succès",
          description: `${successCount} absence(s) enregistrée(s) avec succès.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Partiellement réussi",
          description: `${successCount} sur ${totalAbsents} absence(s) enregistrée(s).`,
          variant: "default",
        })
      }

      // Redirection vers la page des absences après soumission
      router.push("/absences")
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des absences:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les absences.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Faire l'appel</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appel des élèves</CardTitle>
          <CardDescription>Cliquez sur un élève pour le marquer comme absent</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classe</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une classe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingClasses ? (
                            <SelectItem value="loading" disabled>
                              Chargement des classes...
                            </SelectItem>
                          ) : classes.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              Aucune classe disponible
                            </SelectItem>
                          ) : (
                            classes.map((classe) => (
                              <SelectItem key={classe.id} value={classe.id.toString()}>
                                {classe.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              {date ? format(date, "P", { locale: fr }) : <span>Sélectionnez une date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => {
                              setDate(newDate)
                              field.onChange(newDate)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="presentStudentIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-4">
                      <FormLabel>Liste des élèves</FormLabel>
                      <div className="flex items-center gap-2">
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
                    </div>

                    {isLoadingStudents ? (
                      <div className="p-4 text-center">Chargement des élèves...</div>
                    ) : !selectedClassId ? (
                      <div className="p-4 text-center">Sélectionnez d'abord une classe</div>
                    ) : students.length === 0 ? (
                      <div className="p-4 text-center">Aucun élève dans cette classe</div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {students.map((student) => {
                            const studentId = student.id.toString()
                            const isPresent = isStudentPresent(studentId)
                            return (
                              <div
                                key={student.id}
                                className={cn(
                                  "border rounded-lg p-4 cursor-pointer transition-colors",
                                  isPresent
                                    ? "bg-green-50 border-green-200 hover:bg-green-100"
                                    : "bg-red-50 border-red-200 hover:bg-red-100",
                                )}
                                onClick={() => handleStudentCardClick(studentId)}
                              >
                                <div className="flex items-center space-x-4">
                                  <Avatar className="h-12 w-12">
                                    {profileImages[student.id] ? (
                                      <AvatarImage
                                        src={profileImages[student.id] || "/placeholder.svg"}
                                        alt={`${student.firstName} ${student.lastName}`}
                                      />
                                    ) : (
                                      <AvatarFallback>
                                        {getInitials(student.firstName, student.lastName)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className="space-y-1">
                                    <h4 className="font-medium">
                                      {student.firstName} {student.lastName}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      Né(e) le: {formatBirthdate(student.birthdate)}
                                    </p>
                                    <div
                                      className={cn(
                                        "text-xs font-medium px-2 py-1 rounded-full inline-block",
                                        isPresent ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                                      )}
                                    >
                                      {isPresent ? "Présent" : "Absent"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground">
                          {students.length > 0 &&
                            `${field.value.length} élève(s) présent(s), ${students.length - field.value.length} élève(s) absent(s)`}
                        </div>
                      </>
                    )}
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
              <Button type="submit">Valider l'appel</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
