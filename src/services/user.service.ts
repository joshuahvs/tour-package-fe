import type { ApiResponse, UserData } from '@/interfaces/user.interface'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const userApi = {
  async getAllUsers(role?: string): Promise<UserData[]> {
    const token = localStorage.getItem('tp-auth-session')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const parsedToken = JSON.parse(token)
    const url = new URL(`${API_BASE_URL}/end-users/users`)
    
    if (role && role !== 'ALL') {
      url.searchParams.append('role', role)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parsedToken.token}`,
      },
    })

    const json = (await response.json()) as ApiResponse<UserData[]>
    
    if (!response.ok) {
      throw new Error(json.message || 'Failed to fetch users')
    }
    
    return json.data
  },

  async getUserById(id: string): Promise<UserData> {
    const token = localStorage.getItem('tp-auth-session')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const parsedToken = JSON.parse(token)
    const response = await fetch(`${API_BASE_URL}/end-users/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parsedToken.token}`,
      },
    })

    const json = (await response.json()) as ApiResponse<UserData>
    
    if (!response.ok) {
      throw new Error(json.message || 'Failed to fetch user')
    }
    
    return json.data
  },
}
