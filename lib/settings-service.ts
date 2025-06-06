import { apiClient } from "./api-client"

export interface Settings {
  id: number
  userId: number
  nickname: string | null
  profileImage: string | null
  theme: string
  language: string
  notificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface ProfileImage {
  userId: number
  profileImage: string
}

export interface UpdateSettingsDto {
  nickname?: string
  profileImage?: string
  theme?: string
  language?: string
  notificationsEnabled?: boolean
}

// Cache pour les images de profil
const profileImageCache: Map<number, string> = new Map()

export const settingsService = {
  async getSettings(): Promise<Settings> {
    try {
      const response = await apiClient.get("/api/teacher/settings")
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres:", error)
      throw error
    }
  },

  async updateSettings(settings: UpdateSettingsDto): Promise<Settings> {
    try {
      const response = await apiClient.put("/api/teacher/settings", settings)
      return response.data
    } catch (error) {
      console.error("Erreur lors de la mise à jour des paramètres:", error)
      throw error
    }
  },

  async getProfileImage(userId: number): Promise<string> {
    try {
      // Vérifier si l'image est déjà en cache
      if (profileImageCache.has(userId)) {
        return profileImageCache.get(userId) || ""
      }

      // Sinon, récupérer l'image depuis l'API
      const response = await apiClient.get(`/api/teacher/settings/profile-image/${userId}`)
      const profileImage = response.data.profileImage || ""

      // Mettre en cache l'image
      profileImageCache.set(userId, profileImage)

      return profileImage
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'image de profil pour l'utilisateur ${userId}:`, error)
      return "" // Retourner une chaîne vide en cas d'erreur
    }
  },

  async uploadProfileImage(file: File): Promise<string> {
    try {
      // Convertir l'image en base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const base64String = reader.result as string
          resolve(base64String)
        }
        reader.onerror = (error) => {
          reject(error)
        }
      })
    } catch (error) {
      console.error("Erreur lors de la conversion de l'image:", error)
      throw error
    }
  },

  // Fonction utilitaire pour compresser une image
  async compressImage(base64Image: string, maxWidth = 300, maxHeight = 300, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = base64Image
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculer les dimensions proportionnelles
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Impossible de créer le contexte 2D"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedImage = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedImage)
      }
      img.onerror = () => {
        reject(new Error("Erreur lors du chargement de l'image"))
      }
    })
  },

  // Vider le cache des images de profil
  clearProfileImageCache() {
    profileImageCache.clear()
  },

  // Supprimer une image spécifique du cache
  removeProfileImageFromCache(userId: number) {
    profileImageCache.delete(userId)
  },
}
