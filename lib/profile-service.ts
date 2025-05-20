import apiClient from "./api-client"

export interface TeacherProfile {
  id: number
  email: string
  subject: string
  createdAt?: string
}

export interface TeacherProfileUpdate {
  subject: string
  currentPassword?: string
  newPassword?: string
}

export const profileService = {
  async getProfile(): Promise<TeacherProfile> {
    try {
      const response = await apiClient.get("/api/teacher/profile")
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error)
      throw error
    }
  },

  async updateProfile(profile: TeacherProfileUpdate): Promise<void> {
    try {
      await apiClient.put("/api/teacher/profile", profile)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      throw error
    }
  },
}
