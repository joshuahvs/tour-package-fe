import type { PackageData, PackageDetailData, CreatePackageRequest, UpdatePackageRequest } from '@/interfaces/package.interface'
import { httpRequest } from './httpClient'

export const packageApi = {
  async getAllPackages(searchName?: string): Promise<PackageData[]> {
    try {
      const params = new URLSearchParams()
      if (searchName) {
        params.append('name', searchName)
      }
      const response = await httpRequest<PackageData[]>(`/package${params.toString() ? `?${params}` : ''}`)
      return response.data || []
    } catch (error) {
      console.error('Error fetching packages:', error)
      throw error
    }
  },

  async getPackageById(id: string): Promise<PackageData> {
    try {
      const response = await httpRequest<PackageData>(`/package/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching package:', error)
      throw error
    }
  },

  async createPackage(packageData: CreatePackageRequest): Promise<PackageData> {
    try {
      const response = await httpRequest<PackageData>('/package', {
        method: 'POST',
        body: JSON.stringify(packageData),
      })
      return response.data
    } catch (error) {
      console.error('Error creating package:', error)
      throw error
    }
  },

  async updatePackage(id: string, packageData: UpdatePackageRequest): Promise<PackageData> {
    try {
      const response = await httpRequest<PackageData>(`/package/${id}`, {
        method: 'PUT',
        body: JSON.stringify(packageData),
      })
      return response.data
    } catch (error) {
      console.error('Error updating package:', error)
      throw error
    }
  },

  async deletePackage(id: string): Promise<void> {
    try {
      await httpRequest<null>(`/package/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting package:', error)
      throw error
    }
  },

  async getPackageDetail(id: string): Promise<PackageDetailData> {
    try {
      const response = await httpRequest<PackageDetailData>(`/package/${id}/detail`)
      return response.data
    } catch (error) {
      console.error('Error fetching package detail:', error)
      throw error
    }
  },

  async processPackage(id: string): Promise<PackageData> {
    try {
      const response = await httpRequest<PackageData>(`/package/${id}/process`, {
        method: 'PUT',
      })
      return response.data
    } catch (error) {
      console.error('Error processing package:', error)
      throw error
    }
  },
}
