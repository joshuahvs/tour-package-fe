import { httpRequest } from './httpClient'

export interface ActivityTypeRevenue {
  activityType: string
  totalRevenue: number
}

export interface RevenueStatistics {
  revenueByActivityType: ActivityTypeRevenue[]
}

export const statisticsApi = {
  async getRevenueStatistics(year?: number, month?: number): Promise<RevenueStatistics> {
    try {
      const params = new URLSearchParams()
      if (year) params.append('year', year.toString())
      if (month) params.append('month', month.toString())
      
      const query = params.toString()
      const response = await httpRequest<RevenueStatistics>(`/statistics${query ? `?${query}` : ''}`)
      return response.data
    } catch (error) {
      console.error('Error fetching statistics:', error)
      throw error
    }
  }
}
