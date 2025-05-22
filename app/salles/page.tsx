"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Users, Plus } from "lucide-react"
import { roomService, type Room, type RoomFilter } from "@/lib/room-service"
import { toast } from "@/components/ui/use-toast"

export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<RoomFilter>({
    name: "",
    location: "",
    minCapacity: undefined,
  })

  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true)
      try {
        // Récupère toutes les salles et applique les filtres côté client
        const data = await roomService.getRooms(filter)
        setRooms(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des salles:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer la liste des salles.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRooms()
  }, [filter])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilter((prev) => ({
      ...prev,
      [name]: name === "minCapacity" ? (value ? Number.parseInt(value) : undefined) : value,
    }))
  }

  // Modifier la fonction handleSearch pour qu'elle ne déclenche pas de nouvelle requête API
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Pas besoin de faire une nouvelle requête API, les filtres sont appliqués côté client
    // dans la fonction getRooms du service
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Salles</h2>
        <Button onClick={() => router.push("/salles/nouvelle")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle salle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechercher une salle</CardTitle>
          <CardDescription>Filtrez les salles selon vos critères</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nom de la salle"
                  value={filter.name || ""}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Emplacement de la salle"
                  value={filter.location || ""}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minCapacity">Capacité minimale</Label>
                <Input
                  id="minCapacity"
                  name="minCapacity"
                  type="number"
                  placeholder="Capacité minimale"
                  value={filter.minCapacity || ""}
                  onChange={handleFilterChange}
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Rechercher</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center p-8">
          <h3 className="text-lg font-medium">Aucune salle trouvée</h3>
          <p className="text-muted-foreground mt-2">Essayez de modifier vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => router.push(`/salles/${room.id}`)}
            >
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
                {room.location && (
                  <CardDescription className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {room.location}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {room.capacity > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    Capacité: {room.capacity} personnes
                  </div>
                )}
                {room.features && room.features.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Caractéristiques:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
