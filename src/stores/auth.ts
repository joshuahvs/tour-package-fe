import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  EndUserDto,
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  RegisterResponseData,
} from '@/interfaces/auth.interface'
import { authApi } from '@/services/auth.service'

interface PersistedAuthState {
  token: string
  expiresAt: string
  user: EndUserDto
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const expiresAt = ref<string | null>(null)
  const currentUser = ref<EndUserDto | null>(null)
  const loading = ref(false)
  const formError = ref<string | null>(null)
  const lastRegisterResult = reactive<{ success: boolean; message: string | null }>({ success: false, message: null })

  const isAuthenticated = computed(() => Boolean(token.value))

  function persistSession() {
    if (!token.value || !expiresAt.value || !currentUser.value) {
      localStorage.removeItem('tp-auth-session')
      return
    }
    const payload: PersistedAuthState = {
      token: token.value,
      expiresAt: expiresAt.value,
      user: currentUser.value,
    }
    localStorage.setItem('tp-auth-session', JSON.stringify(payload))
  }

  function restoreSession() {
    const raw = localStorage.getItem('tp-auth-session')
    console.log('[auth] Restoring session, raw data:', raw ? 'exists' : 'null')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as PersistedAuthState
      token.value = parsed.token
      expiresAt.value = parsed.expiresAt
      currentUser.value = parsed.user
      console.log('[auth] Session restored:', currentUser.value?.username, 'token:', token.value ? token.value.substring(0, 20) + '...' : 'null')
    } catch (error) {
      console.warn('Failed to restore auth session', error)
      clearSession()
    }
  }

  function clearSession() {
    token.value = null
    expiresAt.value = null
    currentUser.value = null
    localStorage.removeItem('tp-auth-session')
  }

  function getToken() {
    return token.value
  }

  async function login(payload: LoginRequest): Promise<LoginResponseData> {
    loading.value = true
    formError.value = null
    try {
      const response = await authApi.login(payload)
      console.log('[auth] Login response:', response)
      token.value = response.data.token
      expiresAt.value = response.data.expiresAt
      currentUser.value = response.data.user
      console.log('[auth] Token saved:', token.value.substring(0, 20) + '...')
      console.log('[auth] User saved:', currentUser.value.username)
      persistSession()
      lastRegisterResult.success = false
      lastRegisterResult.message = null
      return response.data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login gagal'
      formError.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterRequest): Promise<RegisterResponseData> {
    loading.value = true
    formError.value = null
    try {
      const response = await authApi.register(payload)
      lastRegisterResult.success = true
      lastRegisterResult.message = 'Registrasi berhasil, silakan login.'
      return response.data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registrasi gagal'
      formError.value = message
      lastRegisterResult.success = false
      lastRegisterResult.message = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearSession()
  }

  return {
    token,
    expiresAt,
    currentUser,
    loading,
    formError,
    lastRegisterResult,
    isAuthenticated,
    login,
    register,
    logout,
    restoreSession,
    clearSession,
    getToken,
  }
})
