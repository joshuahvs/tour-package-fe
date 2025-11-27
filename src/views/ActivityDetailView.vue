<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { activityApi } from '@/services/activity.service'
import type { ActivityData } from '@/interfaces/activity.interface'
import { useAuthStore } from '@/stores/auth'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activity = ref<ActivityData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const deleting = ref(false)
const showDeleteModal = ref(false)

const currentUser = authStore.currentUser
const isSuperAdmin = currentUser?.role === 'SUPERADMIN'

const canEdit = () => {
  if (!activity.value || !currentUser) return false
  return isSuperAdmin || activity.value.creatorId === currentUser.id
}

const canDelete = () => {
  if (!activity.value || !currentUser) return false
  return isSuperAdmin || activity.value.creatorId === currentUser.id
}

const fetchActivity = async () => {
  loading.value = true
  error.value = null
  try {
    const id = route.params.id as string
    activity.value = await activityApi.getActivityById(id)
    
    // Check if activity is deleted
    if (activity.value.isDeleted) {
      error.value = 'This activity has been deleted and cannot be viewed.'
      activity.value = null
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load activity details'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleEdit = () => {
  router.push(`/activities/${route.params.id}/edit`)
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    const id = route.params.id as string
    await activityApi.deleteActivity(id)
    alert('Activity successfully deleted.')
    router.push('/activities')
  } catch (err: any) {
    // Check for specific error messages
    let errorMsg = err.message || 'Failed to delete activity'
    
    if (errorMsg.includes('unfulfilled orders') || errorMsg.includes('unfulfilled')) {
      errorMsg = 'Cannot delete activity: This activity has unfulfilled orders.'
    }
    
    alert(errorMsg)
    console.error(err)
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
}

const handleBack = () => {
  router.push('/activities')
}

onMounted(() => {
  fetchActivity()
})
</script>

<template>
  <div class="activity-detail-container">
    <div class="activity-detail-header">
      <div>
        <h1>Activity Details</h1>
        <p class="subtitle">View complete activity information</p>
      </div>
      <button @click="handleBack" class="btn-back">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to List
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading activity details...</p>
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

    <!-- Activity Details -->
    <div v-else-if="activity" class="activity-content">
      <div class="card">
        <div class="card-header">
          <h2>{{ activity.activityName }}</h2>
          <span class="activity-type-badge">{{ activity.activityType }}</span>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <label>Activity ID</label>
              <span>{{ activity.id }}</span>
            </div>

            <div class="info-item">
              <label>Activity Name</label>
              <span>{{ activity.activityName }}</span>
            </div>

            <div class="info-item">
              <label>Activity Type</label>
              <span>{{ activity.activityType }}</span>
            </div>

            <div class="info-item">
              <label>Activity Item</label>
              <span>{{ activity.activityItem }}</span>
            </div>

            <div class="info-item">
              <label>Price</label>
              <span class="price-value">{{ formatCurrency(activity.price) }}</span>
            </div>

            <div class="info-item">
              <label>Capacity</label>
              <span>{{ activity.capacity }} people</span>
            </div>

            <div class="info-item">
              <label>Start Date</label>
              <span>{{ formatDateTime(activity.startDate) }}</span>
            </div>

            <div class="info-item">
              <label>End Date</label>
              <span>{{ formatDateTime(activity.endDate) }}</span>
            </div>

            <div class="info-item">
              <label>Start Location</label>
              <span>{{ activity.startLocation }}</span>
            </div>

            <div class="info-item">
              <label>End Location</label>
              <span>{{ activity.endLocation }}</span>
            </div>
          </div>
        </div>

        <div v-if="canEdit() || canDelete()" class="card-footer">
          <button 
            v-if="canEdit()" 
            @click="handleEdit" 
            class="btn-edit"
            :disabled="deleting"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Activity
          </button>

          <button 
            v-if="canDelete()" 
            @click="handleDelete" 
            class="btn-delete"
            :disabled="deleting"
          >
            <svg v-if="!deleting" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span v-if="deleting" class="btn-spinner"></span>
            {{ deleting ? 'Deleting...' : 'Delete Activity' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmDeleteModal
      :show="showDeleteModal"
      :activity-name="activity?.activityName || ''"
      :activity-type="activity?.activityType"
      :activity-item="activity?.activityItem"
      :is-deleting="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
.activity-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.activity-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.activity-detail-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
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

.activity-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card {
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.activity-type-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.card-body {
  padding: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

.price-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2e7d32;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}

.btn-edit,
.btn-delete {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background-color: #4caf50;
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-delete {
  background-color: #f44336;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background-color: #d32f2f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.btn-edit:disabled,
.btn-delete:disabled {
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
  .activity-detail-container {
    padding: 1rem;
  }

  .activity-detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .activity-detail-header h1 {
    font-size: 1.5rem;
  }

  .btn-back {
    width: 100%;
    justify-content: center;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .card-footer {
    flex-direction: column;
  }

  .btn-edit,
  .btn-delete {
    width: 100%;
    justify-content: center;
  }
}
</style>
