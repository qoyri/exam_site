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
import { CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { classService, type Class, type Student } from "@/lib/class-service"
import { absenceService } from "@/lib/absence-service"
import { toast } from "@/hooks/use-toast"

const formSchema = z.object({
  classId: z.string().min(1, {
    message: "Veuillez sélectionner une classe.",
  }),
  studentId: z.string().min(1, {
    message: "Veuillez sélectionner un élève.",
  }),
  date: z.date({
    required_error: "Veuillez sélectionner une date.",
  }),
  status: z.string().optional(),
  reason: z.string().optional(),
})

export default function SaisieAbsencePage() {
  const [date, setDate] = useState<Date>()
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: "",
      studentId: "",
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
  }, [selectedClassId])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await absenceService.createAbsence({
        studentId: Number.parseInt(values.studentId),
        absenceDate: format(values.date, "yyyy-MM-dd"),
        status: values.status,
        reason: values.reason,
      })

      toast({
        title: "Succès",
        description: "L'absence a été enregistrée avec succès.",
        variant: "default",
      })

      // Redirection vers la page des absences après soumission
      router.push("/absences")
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'absence:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'absence.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Saisie d&#39;absence</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle absence</CardTitle>
          <CardDescription>Saisissez les informations relatives à l&#39;absence d&#39;un élève</CardDescription>
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
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Élève</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedClassId || isLoadingStudents}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un élève" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingStudents ? (
                            <SelectItem value="loading" disabled>
                              Chargement des élèves...
                            </SelectItem>
                          ) : !selectedClassId ? (
                            <SelectItem value="select-class" disabled>
                              Sélectionnez d&#39;abord une classe
                            </SelectItem>
                          ) : students.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              Aucun élève dans cette classe
                            </SelectItem>
                          ) : (
                            students.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.firstName} {student.lastName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
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
                    <FormLabel>Motif (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Saisissez le motif de l'absence..." className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>
                      Vous pouvez saisir des informations complémentaires sur l&#39;absence.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/absences")}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
