"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { pointsService } from "@/lib/points-service"

interface AddPointsDialogProps {
  studentId: number
  studentName: string
  onPointsAdded?: () => void
  buttonSize?: "default" | "sm" | "lg" | "icon"
}

export function AddPointsDialog({
  studentId,
  studentName,
  onPointsAdded,
  buttonSize = "default",
}: AddPointsDialogProps) {
  const [open, setOpen] = useState(false)
  const [points, setPoints] = useState<number>(0)
  const [reason, setReason] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!points || !reason) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      await pointsService.addPointsToStudent(studentId, {
        points,
        reason,
      })

      toast({
        title: "Succès",
        description: `${Math.abs(points)} points ${points >= 0 ? "ajoutés à" : "retirés de"} ${studentName}`,
      })

      // Réinitialiser le formulaire
      setPoints(0)
      setReason("")

      // Fermer la boîte de dialogue
      setOpen(false)

      // Appeler le callback si fourni
      if (onPointsAdded) {
        onPointsAdded()
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de points:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les points. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size={buttonSize}>
          {points >= 0 ? "Ajouter" : "Retirer"} des points
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gérer les points</DialogTitle>
            <DialogDescription>
              Ajoutez ou retirez des points à {studentName}. Utilisez des valeurs positives pour ajouter et négatives
              pour retirer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">
                Points
              </Label>
              <Input
                id="points"
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Raison
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Traitement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
