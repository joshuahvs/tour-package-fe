import { httpRequest } from './httpClient'

// Yearly revenue response (per month in a year)
export interface MonthlyRevenueData {
  period: string // e.g., "2025-01"
  totalRevenue: number
}

export interface YearlyRevenueResponse {
  year: number
  monthlyRevenues: MonthlyRevenueData[]
}

// Monthly revenue response (breakdown by activity type)
export interface ActivityTypeRevenue {
  activityType: string
  totalRevenue: number
  percentage: number
}

export interface MonthlyRevenueResponse {
  period: string // e.g., "2025-01"
  totalRevenue: number
  breakdown: ActivityTypeRevenue[]
}

export const statisticsApi = {
  async getYearlyRevenue(year: number): Promise<YearlyRevenueResponse> {
    try {
      const response = await httpRequest<MonthlyRevenueData[]>(`/statistics/revenue/yearly/${year}`)
      const data = response.data ?? []
      return {
        year,
        monthlyRevenues: data,
      }
    } catch (error) {
      console.error('Error fetching yearly revenue:', error)
      throw error
    }
  },

  async getMonthlyRevenue(year: number, month: number): Promise<MonthlyRevenueResponse> {
    try {
      interface BackendActivityRevenue {
        activityType: string
        totalRevenue: number
      }

      interface BackendMonthlyResponse {
        period: string
        totalRevenue: number
        revenueByActivityType: BackendActivityRevenue[]
      }

      const response = await httpRequest<BackendMonthlyResponse>(`/statistics/revenue/monthly/${year}/${month}`)
      console.log('Monthly response:', response)
      
      const data = response.data
      
      if (!data) {
        throw new Error('No data returned from server')
      }
      
      // Format period if needed (e.g., "2025-12" or construct from year/month)
      const period = data.period || `${year}-${String(month).padStart(2, '0')}`
      const totalRevenue = data.totalRevenue || 0

      const breakdown: ActivityTypeRevenue[] = (data.revenueByActivityType || []).map((item) => {
        const percentage = totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0
        return {
          activityType: item.activityType,
          totalRevenue: item.totalRevenue,
          percentage,
        }
      })
      
      return {
        period,
        totalRevenue,
        breakdown,
      }
    } catch (error) {
      console.error('Error fetching monthly revenue:', error)
      throw error
    }
  }
}
