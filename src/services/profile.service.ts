import type { ApiResponse, UserProfile } from '@/interfaces/profile.interface'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const profileApi = {
  async getMyProfile(): Promise<UserProfile> {
    const token = localStorage.getItem('tp-auth-session')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const parsedToken = JSON.parse(token)

    const response = await fetch(`${API_BASE_URL}/end-users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parsedToken.token}`,
      },
    })

    const json = (await response.json()) as ApiResponse<UserProfile>
    
    if (!response.ok) {
      throw new Error(json.message || 'Failed to fetch profile')
    }
    
    return json.data
  },

  async getUserProfile(identifier: string): Promise<UserProfile> {
    const token = localStorage.getItem('tp-auth-session')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const parsedToken = JSON.parse(token)

    const response = await fetch(`${API_BASE_URL}/end-users/profile/${identifier}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parsedToken.token}`,
      },
    })

    const json = (await response.json()) as ApiResponse<UserProfile>
    
    if (!response.ok) {
      throw new Error(json.message || 'Failed to fetch profile')
    }
    
    return json.data
  },
}
