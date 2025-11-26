export interface CustomerData {
  id: string
  username: string
  email: string
  fullName: string
  createdAt: string
}

export interface ApiResponse<T> {
  status: number
  message: string
  timestamp: string
  data: T
}
