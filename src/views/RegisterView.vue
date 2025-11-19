<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/services/auth.service'
import type { RoleDefinition } from '@/interfaces/auth.interface'

const authStore = useAuthStore()
const router = useRouter()

const roles = ref<RoleDefinition[]>([])
const loadingRoles = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phoneNumber: '',
  organizationName: '',
  notes: '',
  role: 'CUSTOMER',
})

const loadRoles = async () => {
  loadingRoles.value = true
  try {
    const response = await authApi.getRoleDefinitions()
    roles.value = response.data
  } catch (error) {
    console.error('Failed to load roles', error)
  } finally {
    loadingRoles.value = false
  }
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'Konfirmasi password tidak cocok'
    return
  }

  submitting.value = true
  try {
    await authStore.register({
      username: form.username,
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      organizationName: form.organizationName || undefined,
      notes: form.notes || undefined,
      role: form.role || undefined,
    })
    successMessage.value = 'Registrasi berhasil! Silakan login.'
    router.push({ name: 'login', query: { username: form.username } })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Registrasi gagal'
  } finally {
    submitting.value = false
  }
}

onMounted(loadRoles)
</script>

<template>
  <section class="auth-shell">
    <div class="auth-card">
      <header>
        <h1>Buat Akun Baru</h1>
        <p>Daftarkan diri Anda untuk membuat paket dan mengelola aktivitas.</p>
      </header>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="grid">
          <label>
            <span>Nama Lengkap</span>
            <input v-model="form.fullName" type="text" required placeholder="Nama lengkap" />
          </label>
          <label>
            <span>Nomor Telepon</span>
            <input v-model="form.phoneNumber" type="tel" required placeholder="0812xxxx" />
          </label>
          <label>
            <span>Email</span>
            <input v-model="form.email" type="email" required placeholder="nama@email.com" />
          </label>
          <label>
            <span>Role</span>
            <select v-model="form.role" :disabled="loadingRoles">
              <option value="CUSTOMER">Customer</option>
              <option v-for="role in roles" :key="role.code" :value="role.code">
                {{ role.displayName }}
              </option>
            </select>
          </label>
          <label>
            <span>Nama Organisasi (opsional)</span>
            <input v-model="form.organizationName" type="text" placeholder="Perusahaan" />
          </label>
          <label>
            <span>Catatan (opsional)</span>
            <textarea v-model="form.notes" rows="2" placeholder="Tuliskan kebutuhan khusus"></textarea>
          </label>
        </div>

        <label>
          <span>Username</span>
          <input v-model="form.username" type="text" required placeholder="username" />
        </label>
        <label>
          <span>Password</span>
          <input v-model="form.password" type="password" required placeholder="Minimal 6 karakter" autocomplete="new-password" />
        </label>
        <label>
          <span>Konfirmasi Password</span>
          <input v-model="form.confirmPassword" type="password" required placeholder="Ulangi password" autocomplete="new-password" />
        </label>

        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="auth-success">{{ successMessage }}</p>

        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Memproses...' : 'Daftar' }}
        </button>
      </form>

      <footer>
        <p>
          Sudah punya akun?
          <RouterLink to="/login" class="auth-link">Masuk di sini</RouterLink>
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
  background: linear-gradient(120deg, #faf5ff 0%, #eef2ff 70%);
}
.auth-card {
  width: min(640px, 100%);
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 25px 55px rgba(99, 102, 241, 0.25);
  border: 1px solid rgba(99, 102, 241, 0.1);
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
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 500;
  color: #2d2f48;
}
input,
select,
textarea {
  border: 1px solid #dcdff5;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
textarea {
  resize: vertical;
}
input:focus,
select:focus,
textarea:focus {
  border-color: #7c3aed;
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}
button {
  margin-top: 0.5rem;
  border: none;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(120deg, #7c3aed, #4f46e5);
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
.auth-success {
  color: #0f5132;
  background: #d1e7dd;
  border: 1px solid #badbcc;
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
