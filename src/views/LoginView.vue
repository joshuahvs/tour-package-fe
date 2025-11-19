<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  password: '',
})

watchEffect(() => {
  const presetUsername = route.query.username as string | undefined
  if (presetUsername) {
    form.username = presetUsername
  }
})

const handleSubmit = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    await authStore.login({ ...form })
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-shell">
    <div class="auth-card">
      <header>
        <h1>Masuk ke Aplikasi</h1>
        <p>Masukkan kredensial Anda untuk melanjutkan.</p>
      </header>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label>
          <span>Username</span>
          <input v-model="form.username" type="text" placeholder="superadmin" required autocomplete="username" />
        </label>

        <label>
          <span>Password</span>
          <input v-model="form.password" type="password" placeholder="••••••••" required autocomplete="current-password" />
        </label>

        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <footer>
        <p>
          Belum punya akun?
          <RouterLink to="/register" class="auth-link">Daftar sekarang</RouterLink>
        </p>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.auth-shell {
  min-height: calc(100vh - 64px);
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #eef2ff 0%, #ffffff 60%);
}
.auth-card {
  width: min(420px, 100%);
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 45px rgba(79, 70, 229, 0.25);
  border: 1px solid rgba(79, 70, 229, 0.08);
}
header {
  text-align: center;
  margin-bottom: 1.5rem;
}
header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1f235a;
}
header p {
  color: #5d5f7a;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 500;
  color: #2d2f48;
}
input {
  border: 1px solid #dcdff5;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
input:focus {
  border-color: #4f46e5;
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}
button {
  margin-top: 0.5rem;
  border: none;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(120deg, #4f46e5, #7c3aed);
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.auth-error {
  color: #b42318;
  background: #fee4e2;
  border: 1px solid #fca19a;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
}
footer {
  margin-top: 1.75rem;
  text-align: center;
  color: #5d5f7a;
}
.auth-link {
  color: #4f46e5;
  text-decoration: underline;
}
</style>
