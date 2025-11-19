import type { CreatePlanRequest, UpdatePlanRequest, AddOrderedQuantityRequest, UpdateOrderedQuantityRequest, PlanData, PlanDetailData, LocationData } from '@/interfaces/plan.interface'
import { httpRequest } from './httpClient'

export const planApi = {
  async createPlan(packageId: string, planData: CreatePlanRequest): Promise<PlanData> {
    try {
      const response = await httpRequest<PlanData>(`/packages/${packageId}/plans/create`, {
        method: 'POST',
        body: JSON.stringify(planData),
      })
      return response.data
    } catch (error) {
      console.error('Error creating plan:', error)
      throw error
    }
  },

  async getPlanDetail(planId: string): Promise<PlanDetailData> {
    try {
      const response = await httpRequest<PlanDetailData>(`/packages/plans/${planId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching plan detail:', error)
      throw error
    }
  },

  async getLocations(): Promise<LocationData[]> {
    try {
      const response = await httpRequest<LocationData[]>(`/locations`)
      return response.data || []
    } catch (error) {
      console.error('Error fetching locations:', error)
      throw error
    }
  },

  async updatePlan(planId: string, planData: UpdatePlanRequest): Promise<PlanDetailData> {
    try {
      const response = await httpRequest<PlanDetailData>(`/plans/${planId}/edit`, {
        method: 'PUT',
        body: JSON.stringify(planData),
      })
      return response.data
    } catch (error) {
      console.error('Error updating plan:', error)
      throw error
    }
  },

  async addOrderedQuantity(planId: string, data: AddOrderedQuantityRequest): Promise<PlanDetailData> {
    try {
      const response = await httpRequest<PlanDetailData>(`/ordered-activities/create?planId=${planId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.data
    } catch (error) {
      console.error('Error adding activity to plan:', error)
      throw error
    }
  },

  async updateOrderedQuantity(orderedQuantityId: string, data: UpdateOrderedQuantityRequest): Promise<PlanDetailData> {
    try {
      const response = await httpRequest<PlanDetailData>(`/ordered-activities/${orderedQuantityId}/edit`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return response.data
    } catch (error) {
      console.error('Error updating ordered activity quantity:', error)
      throw error
    }
  },

  async deleteOrderedQuantity(orderedQuantityId: string): Promise<PlanDetailData> {
    try {
      const response = await httpRequest<PlanDetailData>(`/ordered-activities/${orderedQuantityId}/delete`, {
        method: 'DELETE',
      })
      return response.data
    } catch (error) {
      console.error('Error deleting ordered activity:', error)
      throw error
    }
  },

  async deletePlan(planId: string): Promise<void> {
    try {
      await httpRequest<void>(`/packages/plans/${planId}/delete`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting plan:', error)
      throw error
    }
  },

  async getAvailablePlansForActivity(planId: string): Promise<PlanData[]> {
    try {
      const response = await httpRequest<PlanData[]>(`/plans/${planId}/available-activities`)
      return response.data
    } catch (error) {
      console.error('Error fetching available activities:', error)
      throw error
    }
  },
}
