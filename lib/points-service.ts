import apiClient from "./api-client"

// Types pour le service de points
export interface StudentPoints {
  studentId: number
  firstName: string
  lastName: string
  className: string
  points: number
  rankOverall: number
  rankInClass: number
  totalAbsences: number
  unjustifiedAbsences: number
  lastUpdated?: string
}

export interface PointsHistory {
  id: number
  studentId: number
  pointsChange: number
  reason: string
  absenceId?: number
  createdAt: string
}

export interface PointsConfig {
  id: number
  absenceType: string
  pointsValue: number
  description: string
  active: boolean
}

export interface AddPointsRequest {
  points: number
  reason: string
  absenceId?: number
}

// Service de points
class PointsService {
  // Récupérer le classement global
  async getGlobalRanking(): Promise<StudentPoints[]> {
    try {
      // Utiliser l'endpoint correct pour le classement global
      const response = await apiClient.get("/api/points/student/ranking")

      // Vérifier si les données sont valides
      if (response.data && Array.isArray(response.data)) {
        // Trier les données par points (décroissant) pour s'assurer qu'elles sont dans le bon ordre
        return response.data.sort((a, b) => b.points - a.points)
      }

      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération du classement global:", error)
      throw error
    }
  }

  // Récupérer le classement par classe
  async getClassRanking(classId: number): Promise<StudentPoints[]> {
    try {
      // Utiliser l'endpoint correct pour le classement par classe
      const response = await apiClient.get(`/api/points/class/${classId}/ranking`)

      // Vérifier si les données sont valides
      if (response.data && Array.isArray(response.data)) {
        // Trier les données par points (décroissant) pour s'assurer qu'elles sont dans le bon ordre
        return response.data.sort((a, b) => b.points - a.points)
      }

      return response.data
    } catch (error) {
      console.error(`Erreur lors de la récupération du classement de la classe ${classId}:`, error)
      throw error
    }
  }

  // Récupérer les points d'un étudiant
  async getStudentPoints(studentId: number): Promise<StudentPoints> {
    try {
      const response = await apiClient.get(`/api/points/student/${studentId}`)
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération des points de l'étudiant:", error)
      throw error
    }
  }

  // Récupérer l'historique des points d'un étudiant
  async getStudentPointsHistory(studentId: number): Promise<PointsHistory[]> {
    try {
      const response = await apiClient.get(`/api/points/history/${studentId}`)
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique des points:", error)
      throw error
    }
  }

  // Récupérer la configuration des points
  async getPointsConfig(): Promise<PointsConfig[]> {
    try {
      const response = await apiClient.get("/api/points/config")
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération de la configuration des points:", error)
      throw error
    }
  }

  // Ajouter des points à un étudiant
  async addPointsToStudent(studentId: number, data: AddPointsRequest): Promise<any> {
    try {
      const response = await apiClient.post(`/api/points/student/${studentId}/add`, data)
      return response.data
    } catch (error) {
      console.error("Erreur lors de l'ajout de points à l'étudiant:", error)
      throw error
    }
  }
}

export const pointsService = new PointsService()
