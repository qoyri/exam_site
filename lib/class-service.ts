import apiClient from "./api-client"

export interface Class {
  id: number
  name: string
  studentCount: number
}

export interface ClassDetail extends Class {
  students: Student[]
}

export interface Student {
  id: number
  classId: number
  firstName: string
  lastName: string
  birthdate?: string
}

// Cache pour stocker les classes récupérées
let classesCache: Class[] | null = null

export const classService = {
  async getClasses(): Promise<Class[]> {
    try {
      // Si le cache existe, retourner les données du cache
      if (classesCache) {
        return classesCache
      }

      // Sinon, faire une requête à l'API
      const response = await apiClient.get("/api/teacher/classes")
      classesCache = response.data
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération des classes:", error)
      throw error
    }
  },

  async getClassById(id: number): Promise<ClassDetail> {
    try {
      const response = await apiClient.get(`/api/teacher/classes/${id}`)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la récupération de la classe ${id}:`, error)
      throw error
    }
  },

  // Méthode pour filtrer les classes côté client
  async getFilteredClasses(searchTerm = ""): Promise<Class[]> {
    try {
      // Récupérer toutes les classes
      const allClasses = await this.getClasses()

      // Si aucun terme de recherche, retourner toutes les classes
      if (!searchTerm) {
        return allClasses
      }

      // Sinon, filtrer les classes par nom
      const normalizedSearchTerm = searchTerm.toLowerCase()
      return allClasses.filter((cls) => cls.name.toLowerCase().includes(normalizedSearchTerm))
    } catch (error) {
      console.error("Erreur lors du filtrage des classes:", error)
      throw error
    }
  },

  // Méthode pour vider le cache (utile après des modifications)
  clearCache() {
    classesCache = null
  },
}
