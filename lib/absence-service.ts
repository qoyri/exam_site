import apiClient from "./api-client"

export interface Absence {
  id: number
  studentId: number
  studentName: string
  classId: number
  className: string
  absenceDate: string
  status: string
  reason: string
  document: string
}

export interface AbsenceFilter {
  classId?: number
  studentId?: number
  startDate?: string
  endDate?: string
  status?: string
}

export interface AbsenceCreate {
  studentId: number
  absenceDate: string
  status?: string
  reason?: string
  document?: string
}

export interface AbsenceUpdate {
  absenceDate: string
  status?: string
  reason?: string
  document?: string
}

export const absenceService = {
  // Tableau pour stocker les absences récupérées
  _cachedAbsences: [] as Absence[],

  async getAbsences(filter: AbsenceFilter = {}): Promise<Absence[]> {
    try {
      // Toujours récupérer les absences depuis l'API pour éviter les problèmes de cache
      console.log("Récupération des absences depuis l'API")
      const response = await apiClient.get("/api/teacher/absences")

      if (!response || !response.data || !Array.isArray(response.data)) {
        console.error("Réponse API invalide:", response)
        return []
      }

      this._cachedAbsences = response.data

      // Filtrer les absences côté client
      let filteredAbsences = [...this._cachedAbsences]

      if (filter.classId) {
        filteredAbsences = filteredAbsences.filter((absence) => absence.classId === filter.classId)
      }

      if (filter.studentId) {
        filteredAbsences = filteredAbsences.filter((absence) => absence.studentId === filter.studentId)
      }

      if (filter.status) {
        filteredAbsences = filteredAbsences.filter((absence) => absence.status === filter.status)
      }

      if (filter.startDate) {
        const startDate = new Date(filter.startDate)
        filteredAbsences = filteredAbsences.filter((absence) => {
          const absenceDate = new Date(absence.absenceDate)
          return absenceDate >= startDate
        })
      }

      if (filter.endDate) {
        const endDate = new Date(filter.endDate)
        filteredAbsences = filteredAbsences.filter((absence) => {
          const absenceDate = new Date(absence.absenceDate)
          return absenceDate <= endDate
        })
      }

      return filteredAbsences
    } catch (error) {
      console.error("Erreur lors de la récupération des absences:", error)
      return [] // Retourner un tableau vide en cas d'erreur au lieu de propager l'erreur
    }
  },

  async getAbsenceById(id: number): Promise<Absence | null> {
    try {
      const response = await apiClient.get(`/api/teacher/absences/${id}`)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'absence ${id}:`, error)
      return null
    }
  },

  async createAbsence(absence: AbsenceCreate): Promise<Absence | null> {
    try {
      // Formater la date au format yyyy-MM-dd pour DateOnly
      const date = new Date(absence.absenceDate)
      const formattedAbsence = {
        ...absence,
        absenceDate: date.toISOString().split("T")[0],
      }

      console.log("Création d'absence avec date formatée:", formattedAbsence.absenceDate)
      const response = await apiClient.post("/api/teacher/absences", formattedAbsence)

      // Mettre à jour le cache
      if (response && response.data) {
        this._cachedAbsences.push(response.data)
        return response.data
      }
      return null
    } catch (error) {
      console.error("Erreur lors de la création de l'absence:", error)
      return null
    }
  },

  async updateAbsence(id: number, absence: AbsenceUpdate): Promise<boolean> {
    try {
      // Formater la date au format yyyy-MM-dd pour DateOnly
      const date = new Date(absence.absenceDate)
      const formattedAbsence = {
        ...absence,
        absenceDate: date.toISOString().split("T")[0],
      }

      await apiClient.put(`/api/teacher/absences/${id}`, formattedAbsence)

      // Mettre à jour le cache
      const index = this._cachedAbsences.findIndex((a) => a.id === id)
      if (index !== -1) {
        this._cachedAbsences[index] = {
          ...this._cachedAbsences[index],
          ...formattedAbsence,
        }
      }
      return true
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'absence ${id}:`, error)
      return false
    }
  },

  async deleteAbsence(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/api/teacher/absences/${id}`)

      // Mettre à jour le cache
      this._cachedAbsences = this._cachedAbsences.filter((a) => a.id !== id)
      return true
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'absence ${id}:`, error)
      return false
    }
  },

  // Méthode pour vider le cache (utile pour forcer un rechargement)
  clearCache() {
    this._cachedAbsences = []
  },
}
