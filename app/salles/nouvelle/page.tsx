"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { roomService, type RoomCreate } from "@/lib/room-service"

export default function NewRoomPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<RoomCreate>({
    name: "",
    location: "",
    capacity: 0,
    features: [],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number.parseInt(value) || 0 : value,
    }))
  }

  // Modifier la fonction handleSubmit pour supprimer les validations côté client
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await roomService.createRoom(formData)

      toast({
        title: "Succès",
        description: "La salle a été créée avec succès.",
      })

      router.push("/salles")
    } catch (error: any) {
      console.error("Erreur lors de la création de la salle:", error)

      // Extraire le message d'erreur de la réponse API si disponible
      const errorMessage = error.response?.data?.errors
        ? Object.entries(error.response.data.errors)
            .map(([field, errors]) => `${field}: ${(errors as string[]).join(", ")}`)
            .join("; ")
        : error.message || "Une erreur est survenue lors de la création de la salle."

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Nouvelle salle</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la salle</CardTitle>
          <CardDescription>Entrez les détails de la nouvelle salle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nom de la salle"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Emplacement de la salle"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  placeholder="Capacité de la salle"
                  value={formData.capacity || ""}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="features">Caractéristiques</Label>
                <Input
                  id="features"
                  name="features"
                  placeholder="Séparées par des virgules"
                  onChange={(e) => {
                    const features = e.target.value
                      .split(",")
                      .map((f) => f.trim())
                      .filter(Boolean)
                    setFormData((prev) => ({ ...prev, features }))
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Entrez les caractéristiques séparées par des virgules (ex: Projecteur, Tableau blanc)
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => router.push("/salles")}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création en cours..." : "Créer la salle"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
