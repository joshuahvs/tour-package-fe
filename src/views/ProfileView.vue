<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { profileApi } from '@/services/profile.service'
import type { UserProfile } from '@/interfaces/profile.interface'

const route = useRoute()
const profile = ref<UserProfile | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const topUpServiceUrl = import.meta.env.VITE_TOPUP_SERVICE_URL ?? 'http://localhost:8081/topup'

const isMyProfile = computed(() => !route.params.identifier)

const fetchProfile = async () => {
  loading.value = true
  error.value = null
  try {
    const identifier = route.params.identifier as string | undefined
    
    if (identifier) {
      profile.value = await profileApi.getUserProfile(identifier)
    } else {
      profile.value = await profileApi.getMyProfile()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load user profile'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'Not updated yet'
  const date = new Date(dateString)
  
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${hours}:${minutes} - ${day}/${month}/${year}`
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

const getStatusClass = (status: string) => {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return 'status-success'
    case 'PENDING':
      return 'status-pending'
    case 'FAILED':
      return 'status-failed'
    default:
      return ''
  }
}

const redirectToTopUp = () => {
  window.location.href = topUpServiceUrl
}

// Watch for route changes to re-fetch profile
watch(() => route.params.identifier, () => {
  fetchProfile()
}, { immediate: false })

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="header-content">
        <div>
          <h1>{{ isMyProfile ? 'My Profile' : 'User Profile' }}</h1>
          <p class="subtitle">View user information and transaction history</p>
        </div>
        <RouterLink 
          v-if="profile && isMyProfile" 
          :to="{ name: 'edit-profile' }" 
          class="btn-edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Edit Profile
        </RouterLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading profile...</p>
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

    <!-- User Not Found -->
    <div v-else-if="!profile" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="8" r="4"></circle>
      </svg>
      <h3>User not found</h3>
      <p>The requested user profile could not be found.</p>
    </div>

    <!-- Profile Content -->
    <div v-else class="profile-content">
      <!-- User Info Card -->
      <div class="card profile-card">
        <div class="card-header">
          <div class="user-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="8" r="4"></circle>
            </svg>
          </div>
          <div class="user-header-info">
            <h2>{{ profile.fullName }}</h2>
            <span class="role-badge">{{ profile.roleDisplayName }}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <label>Username</label>
              <span>{{ profile.username }}</span>
            </div>
            <div class="info-item">
              <label>Email</label>
              <span>{{ profile.email }}</span>
            </div>
            <div class="info-item">
              <label>Gender</label>
              <span>{{ profile.gender || 'Not specified' }}</span>
            </div>
            <div class="info-item">
              <label>Role</label>
              <span>{{ profile.role }}</span>
            </div>
            <div class="info-item">
              <label>Registered At</label>
              <span>{{ formatDateTime(profile.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>Last Updated</label>
              <span>{{ formatDateTime(profile.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Balance Card (Only for My Profile) -->
      <div v-if="isMyProfile" class="card balance-card">
        <div class="card-header">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Balance
          </h3>
        </div>
        <div class="card-body">
          <div class="balance-amount">
            <span class="currency-label">IDR</span>
            <span class="amount">{{ formatCurrency(profile.saldo) }}</span>
          </div>
          <button @click="redirectToTopUp" class="btn-topup">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Top-Up Balance
          </button>
        </div>
      </div>

      <!-- Transaction History (Only for My Profile) -->
      <div v-if="isMyProfile && profile.topUpTransactions.length > 0" class="card transactions-card">
        <div class="card-header">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Past Top-Up Transactions
          </h3>
        </div>
        <div class="card-body">
          <div class="transactions-list">
            <div v-for="transaction in profile.topUpTransactions" :key="transaction.id" class="transaction-item">
              <div class="transaction-info">
                <div class="transaction-main">
                  <span class="transaction-amount">{{ formatCurrency(transaction.amount) }}</span>
                  <span :class="['transaction-status', getStatusClass(transaction.status)]">
                    {{ transaction.status }}
                  </span>
                </div>
                <div class="transaction-meta">
                  <span class="transaction-date">{{ formatDateTime(transaction.transactionDate) }}</span>
                  <span v-if="transaction.description" class="transaction-desc">{{ transaction.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Transactions -->
      <div v-else-if="isMyProfile && profile.topUpTransactions.length === 0" class="card empty-transactions">
        <div class="empty-state-small">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <h4>No transactions yet</h4>
          <p>You haven't made any top-up transactions.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.profile-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #4caf50;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-edit:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state svg {
  color: #ccc;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

.profile-content {
  display: grid;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.profile-card .card-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.user-header-info h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.card-body {
  padding: 1.5rem;
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

.info-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  font-size: 1rem;
  color: #1a1a1a;
}

.balance-card .card-header h3,
.transactions-card .card-header h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.currency-label {
  font-size: 1rem;
  font-weight: 600;
  color: #666;
}

.amount {
  font-size: 2rem;
  font-weight: 700;
  color: #2e7d32;
}

.btn-topup {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-topup:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  padding: 1rem;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.transaction-item:hover {
  border-color: #4caf50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.transaction-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.transaction-amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
}

.transaction-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-pending {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-failed {
  background-color: #ffebee;
  color: #c62828;
}

.transaction-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transaction-date {
  font-size: 0.875rem;
  color: #666;
  font-family: 'Courier New', monospace;
}

.transaction-desc {
  font-size: 0.875rem;
  color: #999;
  font-style: italic;
}

.empty-transactions {
  padding: 0;
}

.empty-state-small {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-state-small svg {
  color: #ccc;
  margin-bottom: 1rem;
}

.empty-state-small h4 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state-small p {
  color: #666;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-edit {
    width: 100%;
    justify-content: center;
  }

  .profile-header h1 {
    font-size: 1.5rem;
  }

  .profile-card .card-header {
    flex-direction: column;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .transaction-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
