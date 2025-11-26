import type { ActivityData } from '@/interfaces/activity.interface'
import { httpRequest } from './httpClient'

export const activityApi = {
  async getActivities(filters?: { 
    activityType?: string
    startDate?: string
    endDate?: string
    search?: string
    startLocation?: string
    endLocation?: string
    includeDeleted?: string
  }): Promise<ActivityData[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.activityType) params.append('activityType', filters.activityType)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.startLocation) params.append('startLocation', filters.startLocation)
      if (filters?.endLocation) params.append('endLocation', filters.endLocation)
      if (filters?.includeDeleted) params.append('includeDeleted', filters.includeDeleted)

      const query = params.toString()
      const response = await httpRequest<ActivityData[]>(`/activities${query ? `?${query}` : ''}`)
      return response.data || []
    } catch (error) {
      console.error('Error fetching activities:', error)
      throw error
    }
  },

  async getActivityById(id: string): Promise<ActivityData> {
    try {
      const response = await httpRequest<ActivityData>(`/activities/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching activity:', error)
      throw error
    }
  },

  async deleteActivity(id: string): Promise<void> {
    try {
      await httpRequest(`/activities/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting activity:', error)
      throw error
    }
  },
}
