export interface EndUserDto {
  id: string
  username: string
  email: string
  fullName: string
  phoneNumber: string
  organizationName?: string | null
  notes?: string | null
  role: string
  active: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  fullName: string
  phoneNumber: string
  organizationName?: string
  notes?: string
  role?: string
}

export interface LoginResponseData {
  token: string
  expiresAt: string
  user: EndUserDto
}

export interface RegisterResponseData extends EndUserDto {}

export interface RoleDefinition {
  code: string
  displayName: string
  description: string
}

export interface ApiResponse<T> {
  status: number
  message: string
  timestamp: string
  data: T
}
