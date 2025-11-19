import router from '@/router'
import { useAuthStore } from '../stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export interface ApiResponse<T> {
  status: number
  message: string
  timestamp: string
  data: T
}

export async function httpRequest<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const authStore = useAuthStore()
  const headers = new Headers(options.headers ?? {})

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const token = authStore.getToken()
  console.log('[httpClient] Making request to:', `${API_BASE_URL}${path}`)
  console.log('[httpClient] Token exists:', !!token)
  if (token) {
    console.log('[httpClient] Token preview:', token.substring(0, 20) + '...')
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  console.log('[httpClient] Response status:', response.status)

  let json: ApiResponse<T> | null = null
  try {
    json = (await response.json()) as ApiResponse<T>
    console.log('[httpClient] Response data:', json)
  } catch (error) {
    console.error('[httpClient] Failed to parse response:', error)
  }

  if (!response.ok) {
    const message = json?.message ?? `Request failed (status ${response.status})`
    console.error('[httpClient] Request failed:', message)
    if (response.status === 401) {
      authStore.clearSession()
      const currentName = router.currentRoute.value.name
      if (currentName !== 'login') {
        router.push({
          name: 'login',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }
    }
    throw new Error(message)
  }

  return json as ApiResponse<T>
}
