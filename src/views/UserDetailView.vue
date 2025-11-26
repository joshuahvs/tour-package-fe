<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/services/user.service'
import type { UserData } from '@/interfaces/user.interface'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const user = ref<UserData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const isAuthorized = authStore.currentUser?.role === 'SUPERADMIN'

const formatRoleDisplay = (role: string) => {
  const roleMap: Record<string, string> = {
    'SUPERADMIN': 'Superadmin',
    'TOUR_PACKAGE_VENDOR': 'Tour Package Vendor',
    'FLIGHT_AIRLINE': 'Flight Airline',
    'ACCOMMODATION_OWNER': 'Accommodation Owner',
    'RENTAL_VENDOR': 'Rental Vendor',
    'CUSTOMER': 'Customer',
  }
  return roleMap[role] || role
}

const fetchUserDetail = async () => {
  if (!isAuthorized) {
    error.value = 'You are not authorized to view this page.'
    loading.value = false
    return
  }

  const userId = route.params.id as string
  loading.value = true
  error.value = null
  
  try {
    user.value = await userApi.getUserById(userId)
  } catch (err: any) {
    error.value = err.message || 'Failed to load user details.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/users')
}

onMounted(() => {
  fetchUserDetail()
})
</script>

<template>
  <div class="user-detail-container">
    <div class="detail-header">
      <button @click="goBack" class="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Users
      </button>
      <h1>User Details</h1>
    </div>

    <!-- Authorization Error -->
    <div v-if="!isAuthorized" class="error-message unauthorized">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div>
        <strong>Access Denied</strong>
        <p>{{ error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading user details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-message">
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

    <!-- User Details -->
    <div v-else-if="user" class="detail-card">
      <div class="card-header">
        <div class="user-avatar">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="user-name">
          <h2>{{ user.fullName }}</h2>
          <span class="badge-role">{{ formatRoleDisplay(user.roleType) }}</span>
        </div>
        <div class="user-status">
          <span :class="['status-badge', user.active ? 'active' : 'inactive']">
            {{ user.active ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      <div class="card-body">
        <div class="info-section">
          <h3>Basic Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>User ID</label>
              <p>{{ user.id }}</p>
            </div>
            <div class="info-item">
              <label>Username</label>
              <p>{{ user.username }}</p>
            </div>
            <div class="info-item">
              <label>Email</label>
              <p>{{ user.email }}</p>
            </div>
          </div>
        </div>

        <div class="info-section" v-if="user.organizationName || user.notes">
          <h3>Additional Information</h3>
          <div class="info-grid">
            <div class="info-item" v-if="user.organizationName">
              <label>Organization</label>
              <p>{{ user.organizationName }}</p>
            </div>
            <div class="info-item full-width" v-if="user.notes">
              <label>Notes</label>
              <p>{{ user.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.detail-header {
  margin-bottom: 2rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.back-button:hover {
  background-color: #f8f9fa;
  border-color: #4caf50;
  color: #4caf50;
}

.detail-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
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

.error-message.unauthorized {
  background-color: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.error-message svg {
  flex-shrink: 0;
}

.error-message strong {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.detail-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 2rem;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-avatar {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar svg {
  color: white;
}

.user-name {
  flex: 1;
}

.user-name h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.badge-role {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
}

.user-status {
  margin-left: auto;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
}

.status-badge.inactive {
  background-color: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.card-body {
  padding: 2rem;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item p {
  font-size: 1rem;
  color: #1a1a1a;
  word-break: break-word;
}

@media (max-width: 768px) {
  .user-detail-container {
    padding: 1rem;
  }

  .detail-header h1 {
    font-size: 1.5rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.5rem;
  }

  .user-avatar {
    width: 60px;
    height: 60px;
  }

  .user-avatar svg {
    width: 32px;
    height: 32px;
  }

  .user-name h2 {
    font-size: 1.5rem;
  }

  .user-status {
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
