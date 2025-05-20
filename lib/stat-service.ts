import { classService } from "./class-service"
import { absenceService } from "./absence-service"
import { apiClient } from "./api-client"

// Interfaces pour les statistiques
export interface DashboardStatsDto {
  totalClasses: number
  totalStudents: number
  totalAbsences: number
  absencesByStatus: Record<string, number>
  totalReservations: number
}

export interface AbsenceStatsDto {
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
}

export interface ClassStatsDto {
  classId: number
  className: string
  studentCount: number
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
}

export interface StudentStatsDto {
  studentId: number
  studentName: string
  classId: number
  className: string
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
}

export interface RoomStatsDto {
  totalRooms: number
  totalReservations: number
}

// Service pour les statistiques calculées côté client
class StatService {
  async getDashboardStats(): Promise<DashboardStatsDto> {
    try {
      // Récupérer les classes
      const classes = await classService.getClasses()

      // Récupérer les absences
      const absences = await absenceService.getAbsences()

      // Récupérer les réservations (en utilisant l'API directement car nous n'avons pas de service dédié)
      const reservationsResponse = await apiClient.get("/api/teacher/reservations")
      const reservations = reservationsResponse.data

      // Calculer le nombre total d'étudiants
      let totalStudents = 0
      for (const cls of classes) {
        totalStudents += cls.studentCount
      }

      // Calculer les absences par statut
      const absencesByStatus: Record<string, number> = {
        justifiée: 0,
        "non justifiée": 0,
        "en attente": 0,
      }

      for (const absence of absences) {
        if (absence.status in absencesByStatus) {
          absencesByStatus[absence.status]++
        }
      }

      // Créer l'objet de statistiques
      const stats: DashboardStatsDto = {
        totalClasses: classes.length,
        totalStudents,
        totalAbsences: absences.length,
        absencesByStatus,
        totalReservations: reservations.length,
      }

      return stats
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques du tableau de bord:", error)
      throw error
    }
  }

  async getAbsenceStats(): Promise<AbsenceStatsDto> {
    try {
      // Récupérer toutes les absences
      const absences = await absenceService.getAbsences()

      // Calculer les statistiques
      const stats: AbsenceStatsDto = {
        totalAbsences: absences.length,
        justifiedAbsences: absences.filter((a) => a.status === "justifiée").length,
        unjustifiedAbsences: absences.filter((a) => a.status === "non justifiée").length,
        pendingAbsences: absences.filter((a) => a.status === "en attente").length,
      }

      return stats
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques d'absences:", error)
      throw error
    }
  }

  async getClassStats(classId: number): Promise<ClassStatsDto> {
    try {
      // Récupérer les détails de la classe
      const classDetail = await classService.getClassById(classId)

      // Récupérer les absences pour cette classe
      const absences = await absenceService.getAbsences({ classId })

      // Calculer les statistiques
      const stats: ClassStatsDto = {
        classId,
        className: classDetail.name,
        studentCount: classDetail.students.length,
        totalAbsences: absences.length,
        justifiedAbsences: absences.filter((a) => a.status === "justifiée").length,
        unjustifiedAbsences: absences.filter((a) => a.status === "non justifiée").length,
        pendingAbsences: absences.filter((a) => a.status === "en attente").length,
      }

      return stats
    } catch (error) {
      console.error(`Erreur lors du calcul des statistiques de classe ${classId}:`, error)
      throw error
    }
  }

  async getStudentStats(studentId: number): Promise<StudentStatsDto> {
    try {
      // Récupérer les absences pour cet étudiant
      const absences = await absenceService.getAbsences({ studentId })

      // Si aucune absence, on ne peut pas déterminer l'étudiant
      if (absences.length === 0) {
        throw new Error("Aucune absence trouvée pour cet étudiant")
      }

      // Utiliser la première absence pour obtenir les informations de l'étudiant
      const firstAbsence = absences[0]

      // Récupérer les détails de la classe
      const classDetail = await classService.getClassById(firstAbsence.classId)

      // Calculer les statistiques
      const stats: StudentStatsDto = {
        studentId,
        studentName: firstAbsence.studentName,
        classId: firstAbsence.classId,
        className: classDetail.name,
        totalAbsences: absences.length,
        justifiedAbsences: absences.filter((a) => a.status === "justifiée").length,
        unjustifiedAbsences: absences.filter((a) => a.status === "non justifiée").length,
        pendingAbsences: absences.filter((a) => a.status === "en attente").length,
      }

      return stats
    } catch (error) {
      console.error(`Erreur lors du calcul des statistiques d'étudiant ${studentId}:`, error)
      throw error
    }
  }

  async getRoomStats(): Promise<RoomStatsDto> {
    try {
      // Récupérer les salles et les réservations directement via l'API
      const roomsResponse = await apiClient.get("/api/teacher/rooms")
      const rooms = roomsResponse.data

      const reservationsResponse = await apiClient.get("/api/teacher/reservations")
      const reservations = reservationsResponse.data

      // Calculer les statistiques
      const stats: RoomStatsDto = {
        totalRooms: rooms.length,
        totalReservations: reservations.length,
      }

      return stats
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques de salles:", error)
      throw error
    }
  }
}

export const statService = new StatService()
