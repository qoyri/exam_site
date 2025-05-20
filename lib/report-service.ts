import apiClient from "./api-client"

export interface ReportFilter {
  classId?: number
  studentId?: number
  startDate?: string
  endDate?: string
  format?: string
  includeAllStatuses?: boolean
}

export interface AbsenceReport {
  generatedAt: string
  reportPeriod: string
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
  absences: any[]
  absencesByClass: Record<string, number>
  absencesByStudent: Record<string, number>
  absencesByMonth: Record<string, number>
  absencesByDay: Record<string, number>
}

export interface ClassStatistics {
  classId: number
  className: string
  studentCount: number
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
  absenceRate: number
  studentStats: StudentAbsenceStat[]
  absencesByMonth: Record<string, number>
  absencesByDay: Record<string, number>
}

export interface StudentStatistics {
  studentId: number
  studentName: string
  classId: number
  className: string
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
  absenceRate: number
  recentAbsences: any[]
  absencesByMonth: Record<string, number>
}

export interface StudentAbsenceStat {
  studentId: number
  studentName: string
  totalAbsences: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  pendingAbsences: number
  absenceRate: number
}

export const reportService = {
  async getAbsenceReport(filter: ReportFilter = {}): Promise<AbsenceReport> {
    try {
      const params = new URLSearchParams()

      if (filter.classId) params.append("classId", filter.classId.toString())
      if (filter.studentId) params.append("studentId", filter.studentId.toString())
      if (filter.startDate) params.append("startDate", filter.startDate)
      if (filter.endDate) params.append("endDate", filter.endDate)
      if (filter.format) params.append("format", filter.format)
      if (filter.includeAllStatuses !== undefined)
        params.append("includeAllStatuses", filter.includeAllStatuses.toString())

      const response = await apiClient.get(`/api/teacher/reports/absences?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération du rapport d'absences:", error)
      throw error
    }
  },

  async getClassStatistics(classId: number): Promise<ClassStatistics> {
    try {
      const response = await apiClient.get(`/api/teacher/stats/class/${classId}`)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques de la classe ${classId}:`, error)
      throw error
    }
  },

  async getStudentStatistics(studentId: number): Promise<StudentStatistics> {
    try {
      const response = await apiClient.get(`/api/teacher/stats/student/${studentId}`)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques de l'étudiant ${studentId}:`, error)
      throw error
    }
  },
}
