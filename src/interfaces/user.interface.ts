export interface UserData {
  id: string
  username: string
  email: string
  fullName: string
  organizationName?: string | null
  notes?: string | null
  roleType: string
  active: boolean
}

export interface ApiResponse<T> {
  status: number
  message: string
  timestamp: string
  data: T
}
