import type { ActivityData } from '@/interfaces/activity.interface'
import { httpRequest } from './httpClient'

export const activityApi = {
  async getActivities(filters?: { activityType?: string; startDate?: string; endDate?: string; search?: string }): Promise<ActivityData[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.activityType) params.append('activityType', filters.activityType)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.search) params.append('search', filters.search)

      const query = params.toString()
      const response = await httpRequest<ActivityData[]>(`/activities${query ? `?${query}` : ''}`)
      return response.data || []
    } catch (error) {
      console.error('Error fetching activities:', error)
      throw error
    }
  },
}
