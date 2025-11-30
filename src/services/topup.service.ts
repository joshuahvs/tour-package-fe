import type { TopUpTransaction } from '@/interfaces/profile.interface'

interface TopUpApiResponse<T> {
  status?: number
  message?: string
  timestamp?: string
  data: T
}

const TOPUP_API_BASE_URL =
  import.meta.env.VITE_TOPUP_API_BASE_URL ??
  import.meta.env.VITE_TOPUP_SERVICE_URL ??
  'http://localhost:8081/api/topup'

const generateFallbackId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const mapTransaction = (payload: any): TopUpTransaction => ({
  id: String(payload?.id ?? payload?.transactionId ?? payload?.referenceId ?? generateFallbackId()),
  userId: String(payload?.userId ?? payload?.customerId ?? ''),
  amount: Number(payload?.amount ?? 0),
  status: String(payload?.status ?? 'UNKNOWN').toUpperCase(),
  transactionDate: payload?.transactionDate ?? payload?.createdAt ?? new Date().toISOString(),
  description: payload?.description ?? payload?.notes ?? '',
})

const buildAuthHeaders = () => {
  const rawSession = localStorage.getItem('tp-auth-session')
  if (!rawSession) {
    throw new Error('No authentication token found')
  }

  const parsed = JSON.parse(rawSession)
  if (!parsed?.token) {
    throw new Error('Invalid authentication token')
  }

  return {
    Authorization: `Bearer ${parsed.token}`,
  }
}

export const topUpApi = {
  async getTransactionsByCustomerId(customerId: string): Promise<TopUpTransaction[]> {
    if (!customerId) {
      return []
    }

    const headers = buildAuthHeaders()
    const url = new URL(TOPUP_API_BASE_URL)
    url.searchParams.set('customerId', customerId)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    })

    const json = (await response.json()) as TopUpApiResponse<any[]>

    if (!response.ok) {
      throw new Error(json?.message || 'Failed to fetch top-up transactions')
    }

    const records = Array.isArray(json?.data) ? json.data : []
    return records.map(mapTransaction)
  },
}
