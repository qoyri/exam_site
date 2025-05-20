import { absenceService } from "./absence-service"
import { roomService } from "./room-service"
import { classService } from "./class-service"

// Définition des types pour les statistiques du tableau de bord
export interface DashboardStatsDto {
  totalClasses: number
  totalStudents: number
  totalAbsences: number
  totalReservations: number
  absencesByStatus: Record<string, number>
  absencesByMonth?: Record<string, number>
  absencesByClass?: Record<string, number>
}

// Interfaces pour les autres statistiques
export interface AbsenceStatsDto {
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
  absencesByMonth?: Record<string, number>
}

export interface RoomStatsDto {
  totalRooms: number
  totalReservations: number
  reservationsByRoom?: Record<string, number>
}

export interface ClassStatsDto {
  className: string
  studentCount: number
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
}

export const clientStatService = {
  async getDashboardStats(): Promise<DashboardStatsDto> {
    try {
      console.log("Récupération des statistiques du tableau de bord...")

      // Récupérer les données depuis les endpoints existants
      const [classes, absences, rooms] = await Promise.all([
        classService.getClasses(),
        absenceService.getAbsences(),
        roomService.getRooms(),
      ])

      console.log("Classes récupérées:", classes)

      // Récupérer les réservations avec des dates par défaut (mois en cours)
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]

      const reservations = await roomService.getReservations({ startDate, endDate })
      console.log("Réservations récupérées:", reservations)

      // Calculer le nombre total d'étudiants
      let totalStudents = 0
      classes.forEach((cls) => {
        totalStudents += cls.studentCount || 0
      })

      // Calculer les absences par statut
      const absencesByStatus: Record<string, number> = {
        justifiée: 0,
        "non justifiée": 0,
        "en attente": 0,
      }

      absences.forEach((absence) => {
        const status = absence.status?.toLowerCase() || "non justifiée"
        if (absencesByStatus[status] !== undefined) {
          absencesByStatus[status]++
        } else {
          absencesByStatus[status] = 1
        }
      })

      // Construire l'objet de statistiques
      const stats: DashboardStatsDto = {
        totalClasses: classes.length,
        totalStudents,
        totalAbsences: absences.length,
        totalReservations: reservations.length,
        absencesByStatus,
      }

      console.log("Statistiques calculées:", stats)
      return stats
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques côté client:", error)
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        totalClasses: 0,
        totalStudents: 0,
        totalAbsences: 0,
        totalReservations: 0,
        absencesByStatus: {
          justifiée: 0,
          "non justifiée": 0,
          "en attente": 0,
        },
      }
    }
  },

  async getAbsenceStats(): Promise<AbsenceStatsDto> {
    try {
      // Récupérer toutes les absences
      const absences = await absenceService.getAbsences()
      console.log("Absences récupérées pour les statistiques:", absences)

      // Calculer les absences par statut
      let justifiedAbsences = 0
      let unjustifiedAbsences = 0
      let pendingAbsences = 0

      absences.forEach((absence) => {
        const status = absence.status?.toLowerCase() || "non justifiée"

        if (status === "justifiée") {
          justifiedAbsences++
        } else if (status === "non justifiée") {
          unjustifiedAbsences++
        } else {
          pendingAbsences++
        }
      })

      return {
        totalAbsences: absences.length,
        justifiedAbsences,
        unjustifiedAbsences,
        pendingAbsences,
      }
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques d'absences:", error)
      return {
        totalAbsences: 0,
        justifiedAbsences: 0,
        unjustifiedAbsences: 0,
        pendingAbsences: 0,
      }
    }
  },

  async getRoomStats(): Promise<RoomStatsDto> {
    try {
      // Récupérer toutes les salles
      const rooms = await roomService.getRooms()
      console.log("Salles récupérées pour les statistiques:", rooms)

      // Récupérer les réservations avec des dates par défaut (mois en cours)
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]

      const reservations = await roomService.getReservations({ startDate, endDate })
      console.log("Réservations récupérées pour les statistiques:", reservations)

      // Calculer les réservations par salle
      const reservationsByRoom: Record<string, number> = {}

      reservations.forEach((reservation) => {
        const roomName = reservation.roomName || `Salle ${reservation.roomId}`
        reservationsByRoom[roomName] = (reservationsByRoom[roomName] || 0) + 1
      })

      return {
        totalRooms: rooms.length,
        totalReservations: reservations.length,
        reservationsByRoom,
      }
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques de salles:", error)
      return {
        totalRooms: 0,
        totalReservations: 0,
      }
    }
  },

  async getClassStats(classId: number): Promise<ClassStatsDto> {
    try {
      console.log(`Récupération des statistiques pour la classe ${classId}...`)

      // Récupérer les détails de la classe
      const classDetails = await classService.getClassById(classId)
      console.log("Détails de la classe récupérés:", classDetails)

      // Récupérer toutes les absences pour cette classe
      const absences = await absenceService.getAbsences({ classId })
      console.log("Absences récupérées pour la classe:", absences)

      // Calculer les absences par statut
      let justifiedAbsences = 0
      let unjustifiedAbsences = 0
      let pendingAbsences = 0

      absences.forEach((absence) => {
        const status = absence.status?.toLowerCase() || "non justifiée"

        if (status === "justifiée") {
          justifiedAbsences++
        } else if (status === "non justifiée") {
          unjustifiedAbsences++
        } else {
          pendingAbsences++
        }
      })

      return {
        className: classDetails.name,
        studentCount: classDetails.studentCount || 0,
        totalAbsences: absences.length,
        justifiedAbsences,
        unjustifiedAbsences,
        pendingAbsences,
      }
    } catch (error) {
      console.error(`Erreur lors du calcul des statistiques pour la classe ${classId}:`, error)
      return {
        className: "Classe inconnue",
        studentCount: 0,
        totalAbsences: 0,
        justifiedAbsences: 0,
        unjustifiedAbsences: 0,
        pendingAbsences: 0,
      }
    }
  },
}
