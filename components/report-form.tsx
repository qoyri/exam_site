"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// Définir le schéma avec des types plus précis
const formSchema = z.object({
  reportType: z.enum(["absences", "performance", "schedule", "rooms", ""]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  classId: z.enum(["all", "1", "2", "3", ""]).optional(),
  studentId: z.enum(["all", "1", "2", "3", ""]).optional(),
  includeJustified: z.boolean(),
  includeUnjustified: z.boolean(),
  includeDetails: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

type ReportFormProps = {
  type: "absences" | "performance" | "custom"
}

export function ReportForm({ type }: ReportFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  // Définir les valeurs par défaut avec les types corrects
  const defaultValues: Partial<FormValues> = {
    reportType: type === "custom" ? "" : (type as "absences" | "performance"),
    includeJustified: true,
    includeUnjustified: true,
    includeDetails: false,
    classId: "",
    studentId: "",
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  function onSubmit(values: FormValues) {
    setIsGenerating(true)
    console.log(values)

    // Simuler la génération du rapport
    setTimeout(() => {
      setIsGenerating(false)
      alert("Rapport généré avec succès!")
    }, 1500)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {type === "custom" && (
          <FormField
            control={form.control}
            name="reportType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de rapport</FormLabel>
                <Select onValueChange={(value) => field.onChange(value as any)} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type de rapport" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="absences">Absences</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="schedule">Emploi du temps</SelectItem>
                    <SelectItem value="rooms">Salles</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Choisissez le type de rapport que vous souhaitez générer.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        type="button"
                      >
                        {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => field.onChange(date)}
                      disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        type="button"
                      >
                        {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => field.onChange(date)}
                      disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classe</FormLabel>
                <Select onValueChange={(value) => field.onChange(value as any)} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les classes" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    <SelectItem value="1">Terminale S1</SelectItem>
                    <SelectItem value="2">Terminale S2</SelectItem>
                    <SelectItem value="3">Première ES</SelectItem>
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
                <Select onValueChange={(value) => field.onChange(value as any)} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les élèves" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Tous les élèves</SelectItem>
                    <SelectItem value="1">Martin Dupont</SelectItem>
                    <SelectItem value="2">Sophie Martin</SelectItem>
                    <SelectItem value="3">Lucas Bernard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {type === "absences" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="includeJustified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Inclure les absences justifiées</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeUnjustified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Inclure les absences non justifiées</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="includeDetails"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Inclure les détails complets</FormLabel>
                <FormDescription>Ajoute des informations supplémentaires au rapport.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isGenerating} className="w-full">
          {isGenerating ? (
            "Génération en cours..."
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Générer le rapport
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
