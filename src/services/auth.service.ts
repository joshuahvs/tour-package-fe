import type {
  ApiResponse,
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  RegisterResponseData,
  RoleDefinition,
} from '@/interfaces/auth.interface'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const authApi = {
  async login(payload: LoginRequest): Promise<ApiResponse<LoginResponseData>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const json = (await response.json()) as ApiResponse<LoginResponseData>
    if (!response.ok) {
      throw new Error(json.message || 'Login gagal')
    }
    return json
  },

  async register(payload: RegisterRequest): Promise<ApiResponse<RegisterResponseData>> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const json = (await response.json()) as ApiResponse<RegisterResponseData>
    if (!response.ok) {
      throw new Error(json.message || 'Registrasi gagal')
    }
    return json
  },

  async getRoleDefinitions(): Promise<ApiResponse<RoleDefinition[]>> {
    const response = await fetch(`${API_BASE_URL}/profile/roles`)
    const json = (await response.json()) as ApiResponse<RoleDefinition[]>
    if (!response.ok) {
      throw new Error(json.message || 'Gagal memuat daftar role')
    }
    return json
  },
}
