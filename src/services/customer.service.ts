import type { ApiResponse, CustomerData } from '@/interfaces/customer.interface'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const customerApi = {
  async getAllCustomers(name?: string, email?: string): Promise<CustomerData[]> {
    const token = localStorage.getItem('tp-auth-session')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const parsedToken = JSON.parse(token)
    const url = new URL(`${API_BASE_URL}/end-users/customers`)
    
    if (name && name.trim()) {
      url.searchParams.append('name', name.trim())
    }
    
    if (email && email.trim()) {
      url.searchParams.append('email', email.trim())
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parsedToken.token}`,
      },
    })

    const json = (await response.json()) as ApiResponse<CustomerData[]>
    
    if (!response.ok) {
      throw new Error(json.message || 'Failed to fetch customers')
    }
    
    return json.data
  },
}

