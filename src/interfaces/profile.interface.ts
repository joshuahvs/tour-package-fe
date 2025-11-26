export interface TopUpTransaction {
  id: string
  userId: string
  amount: number
  status: string
  transactionDate: string
  description: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  fullName: string
  gender: string | null
  role: string
  roleDisplayName: string
  saldo: number
  createdAt: string
  updatedAt: string | null
  topUpTransactions: TopUpTransaction[]
}

export interface ApiResponse<T> {
  status: number
  message: string
  timestamp: string
  data: T
}
