<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { profileApi } from '@/services/profile.service'
import type { UserProfile } from '@/interfaces/profile.interface'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})

const formData = ref({
  username: '',
  fullName: '',
  email: '',
  password: '',
  gender: '',
})

const userId = ref<string>('')

const fetchUserData = async () => {
  loading.value = true
  error.value = null
  try {
    const identifier = route.params.identifier as string | undefined
    let profile: UserProfile
    
    if (identifier) {
      profile = await profileApi.getUserProfile(identifier)
    } else {
      profile = await profileApi.getMyProfile()
    }

    userId.value = profile.id
    formData.value = {
      username: profile.username,
      fullName: profile.fullName,
      email: profile.email,
      password: '',
      gender: profile.gender || '',
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load user data'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const validateForm = (): boolean => {
  validationErrors.value = {}
  let isValid = true

  if (!formData.value.username.trim()) {
    validationErrors.value.username = 'Username is required'
    isValid = false
  }

  if (!formData.value.fullName.trim()) {
    validationErrors.value.fullName = 'Name is required'
    isValid = false
  }

  if (!formData.value.email.trim()) {
    validationErrors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    validationErrors.value.email = 'Invalid email format'
    isValid = false
  }

  if (!formData.value.gender.trim()) {
    validationErrors.value.gender = 'Gender is required'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  error.value = null

  try {
    const token = localStorage.getItem('tp-auth-session')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const parsedToken = JSON.parse(token)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

    const updatePayload: any = {
      id: userId.value,
      username: formData.value.username.trim(),
      fullName: formData.value.fullName.trim(),
      email: formData.value.email.trim(),
      gender: formData.value.gender.trim(),
    }

    // Only include password if it's filled
    if (formData.value.password.trim()) {
      updatePayload.password = formData.value.password.trim()
    }

    const response = await fetch(`${API_BASE_URL}/end-users/${userId.value}/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parsedToken.token}`,
      },
      body: JSON.stringify(updatePayload),
    })

    const json = await response.json()

    if (!response.ok) {
      // Check for validation errors
      if (json.message && json.message.includes('sudah digunakan')) {
        if (json.message.includes('Username')) {
          validationErrors.value.username = json.message
        } else if (json.message.includes('Email')) {
          validationErrors.value.email = json.message
        }
        throw new Error('Validation failed')
      }
      throw new Error(json.message || 'Failed to update account')
    }

    // Show success notification
    alert('Account successfully updated.')

    // Redirect to profile page
    router.push('/profile')
  } catch (err: any) {
    if (err.message !== 'Validation failed') {
      error.value = err.message || 'Failed to update account'
    }
    console.error(err)
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
  fetchUserData()
})
</script>

<template>
  <div class="edit-profile-container">
    <div class="edit-profile-header">
      <h1>Update Account</h1>
      <p class="subtitle">Update your account information</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading user data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !userId" class="error-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div>
        <strong>Error</strong>
        <p>{{ error }}</p>
      </div>
    </div>

    <!-- Form -->
    <div v-else class="form-container">
      <form @submit.prevent="handleSubmit" class="edit-form">
        <div class="form-card">
          <div class="form-header">
            <h2>Account Information</h2>
            <p>All fields are required</p>
          </div>

          <div class="form-body">
            <!-- General Error -->
            <div v-if="error" class="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {{ error }}
            </div>

            <!-- Username -->
            <div class="form-group">
              <label for="username" class="required">Username</label>
              <input
                id="username"
                v-model="formData.username"
                type="text"
                class="form-input"
                :class="{ 'input-error': validationErrors.username }"
                placeholder="Enter username"
                maxlength="100"
              />
              <span v-if="validationErrors.username" class="error-text">{{ validationErrors.username }}</span>
            </div>

            <!-- Full Name -->
            <div class="form-group">
              <label for="fullName" class="required">Name</label>
              <input
                id="fullName"
                v-model="formData.fullName"
                type="text"
                class="form-input"
                :class="{ 'input-error': validationErrors.fullName }"
                placeholder="Enter full name"
                maxlength="160"
              />
              <span v-if="validationErrors.fullName" class="error-text">{{ validationErrors.fullName }}</span>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email" class="required">Email</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                class="form-input"
                :class="{ 'input-error': validationErrors.email }"
                placeholder="Enter email address"
                maxlength="160"
              />
              <span v-if="validationErrors.email" class="error-text">{{ validationErrors.email }}</span>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password">Password</label>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                class="form-input"
                :class="{ 'input-error': validationErrors.password }"
                placeholder="Leave blank to keep current password"
                minlength="4"
              />
              <span class="help-text">Leave blank if you don't want to change password</span>
              <span v-if="validationErrors.password" class="error-text">{{ validationErrors.password }}</span>
            </div>

            <!-- Gender -->
            <div class="form-group">
              <label for="gender" class="required">Gender</label>
              <select
                id="gender"
                v-model="formData.gender"
                class="form-input"
                :class="{ 'input-error': validationErrors.gender }"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <span v-if="validationErrors.gender" class="error-text">{{ validationErrors.gender }}</span>
            </div>
          </div>

          <div class="form-footer">
            <button type="button" @click="handleCancel" class="btn-cancel" :disabled="submitting">
              Cancel
            </button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              <span v-if="submitting" class="btn-spinner"></span>
              {{ submitting ? 'Updating...' : 'Update Account' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.edit-profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.edit-profile-header {
  margin-bottom: 2rem;
}

.edit-profile-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
}

.error-message svg {
  flex-shrink: 0;
}

.error-message strong {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-card {
  overflow: hidden;
}

.form-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.form-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.form-header p {
  color: #666;
  font-size: 0.95rem;
}

.form-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.alert-error {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
}

.alert svg {
  flex-shrink: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-group label.required::after {
  content: ' *';
  color: #e53935;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-input.input-error {
  border-color: #e53935;
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
}

.help-text {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

.error-text {
  font-size: 0.875rem;
  color: #e53935;
  font-weight: 500;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}

.btn-cancel,
.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #e0e0e0;
  border-color: #ccc;
}

.btn-submit {
  background-color: #4caf50;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-cancel:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 768px) {
  .edit-profile-container {
    padding: 1rem;
  }

  .edit-profile-header h1 {
    font-size: 1.5rem;
  }

  .form-body {
    padding: 1.5rem;
  }

  .form-footer {
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
    justify-content: center;
  }
}
</style>
