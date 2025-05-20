import apiClient from "./api-client"

export interface Room {
  id: number
  name: string
  capacity: number
  location: string
  features: string[]
}

export interface RoomFilter {
  name?: string
  location?: string
  minCapacity?: number
}

// Modifier l'interface Reservation pour correspondre à la structure de l'API
export interface Reservation {
  id: number
  roomId: number
  roomName: string
  teacherId?: number
  teacherName?: string
  reservationDate: string
  startTime: string
  endTime: string
  purpose?: string
  userEmail?: string
}

export interface ReservationFilter {
  roomId?: number
  teacherId?: number
  startDate?: string
  endDate?: string
}

export interface ReservationCreate {
  roomId: number
  startTime: string
  endTime: string
  purpose: string
}

export interface RoomCreate {
  name: string
  location: string
  capacity: number
  features?: string[]
}

export const roomService = {
  // Modifier la fonction getRooms pour ne plus envoyer de paramètres de filtre
  async getRooms(filter: RoomFilter = {}): Promise<Room[]> {
    try {
      console.log("Récupération des salles avec filtre:", filter)
      // Utilisation du nouvel endpoint simplifié sans paramètres
      const response = await apiClient.get(`/api/teacher/rooms`)
      console.log("Salles récupérées:", response.data)

      // Appliquer les filtres côté client
      let rooms = response.data as Room[]

      // Filtrage côté client
      if (filter.name) {
        rooms = rooms.filter((room: Room) => room.name.toLowerCase().includes(filter.name!.toLowerCase()))
      }

      if (filter.location) {
        rooms = rooms.filter(
          (room: Room) => room.location && room.location.toLowerCase().includes(filter.location!.toLowerCase()),
        )
      }

      if (filter.minCapacity !== undefined) {
        rooms = rooms.filter((room: Room) => room.capacity >= filter.minCapacity!)
      }

      return rooms
    } catch (error) {
      console.error("Erreur lors de la récupération des salles:", error)
      throw error
    }
  },

  async getRoomById(id: number): Promise<Room> {
    try {
      // Utilisation du bon endpoint
      const response = await apiClient.get(`/api/teacher/rooms/${id}`)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la récupération de la salle ${id}:`, error)
      throw error
    }
  },

  // Modifier la fonction createRoom pour ne plus exiger de champs obligatoires
  async createRoom(room: RoomCreate): Promise<Room> {
    try {
      // Suppression des validations des champs obligatoires
      const response = await apiClient.post("/api/teacher/rooms", room)
      return response.data
    } catch (error) {
      console.error("Erreur lors de la création de la salle:", error)
      throw error
    }
  },

  // Modifier la fonction updateRoom pour ne plus exiger de champs obligatoires
  async updateRoom(id: number, room: Partial<RoomCreate>): Promise<Room> {
    try {
      // Suppression des validations des champs obligatoires
      const response = await apiClient.put(`/api/teacher/rooms/${id}`, room)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la salle ${id}:`, error)
      throw error
    }
  },

  async deleteRoom(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/teacher/rooms/${id}`)
    } catch (error) {
      console.error(`Erreur lors de la suppression de la salle ${id}:`, error)
      throw error
    }
  },

  // Modifions la fonction getReservations pour toujours inclure startDate et endDate
  async getReservations(filter: ReservationFilter = {}): Promise<Reservation[]> {
    try {
      const params = new URLSearchParams()

      if (filter.roomId) params.append("roomId", filter.roomId.toString())
      if (filter.teacherId) params.append("teacherId", filter.teacherId.toString())

      // Toujours inclure startDate et endDate
      // Si non fournis, utiliser le mois en cours
      const today = new Date()
      const startDate =
        filter.startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
      const endDate =
        filter.endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]

      params.append("startDate", startDate)
      params.append("endDate", endDate)

      console.log("Fetching reservations with params:", params.toString())

      // Utilisation du bon endpoint
      const response = await apiClient.get(`/api/teacher/reservations?${params.toString()}`)
      console.log("Réservations récupérées:", response.data)

      // Assurons-nous que les données sont correctement formatées
      const reservations = response.data.map((reservation: any) => ({
        ...reservation,
        // S'assurer que les dates sont au bon format
        startTime: reservation.startTime || `${reservation.reservationDate}T${reservation.startTime || "00:00"}:00`,
        endTime: reservation.endTime || `${reservation.reservationDate}T${reservation.endTime || "00:00"}:00`,
      }))

      return reservations
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error)
      throw error
    }
  },

  async getRoomReservations(roomId: number, startDate?: string, endDate?: string): Promise<Reservation[]> {
    try {
      let url = `/api/teacher/rooms/${roomId}/reservations`

      // Ajouter les paramètres de date si fournis
      if (startDate || endDate) {
        const params = new URLSearchParams()
        if (startDate) params.append("startDate", startDate)
        if (endDate) params.append("endDate", endDate)
        url += `?${params.toString()}`
      }

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la récupération des réservations pour la salle ${roomId}:`, error)
      throw error
    }
  },

  async createReservation(reservation: ReservationCreate): Promise<Reservation> {
    try {
      // Vérifier que les champs obligatoires sont présents
      if (!reservation.roomId) {
        throw new Error("Le champ 'roomId' est obligatoire")
      }
      if (!reservation.startTime) {
        throw new Error("Le champ 'startTime' est obligatoire")
      }
      if (!reservation.endTime) {
        throw new Error("Le champ 'endTime' est obligatoire")
      }

      // Créer l'objet createDto attendu par l'API
      const createDto = {
        roomId: reservation.roomId,
        reservationDate: reservation.startTime.split("T")[0], // Extraire la date de startTime
        startTime: reservation.startTime.split("T")[1].substring(0, 5), // Extraire l'heure de startTime (HH:MM)
        endTime: reservation.endTime.split("T")[1].substring(0, 5), // Extraire l'heure de endTime (HH:MM)
      }

      // Utilisation du bon endpoint avec le format attendu
      const response = await apiClient.post("/api/teacher/reservations", createDto)
      return response.data
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error)
      throw error
    }
  },

  async updateReservation(id: number, reservation: Partial<ReservationCreate>): Promise<Reservation> {
    try {
      // Utilisation du bon endpoint
      const response = await apiClient.put(`/api/teacher/reservations/${id}`, reservation)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la réservation ${id}:`, error)
      throw error
    }
  },

  async deleteReservation(id: number): Promise<void> {
    try {
      // Utilisation du bon endpoint
      await apiClient.delete(`/api/teacher/reservations/${id}`)
    } catch (error) {
      console.error(`Erreur lors de la suppression de la réservation ${id}:`, error)
      throw error
    }
  },
}
