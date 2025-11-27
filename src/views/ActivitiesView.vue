<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { activityApi } from '@/services/activity.service'
import type { ActivityData } from '@/interfaces/activity.interface'
import { useAuthStore } from '@/stores/auth'
import LocationSelector from '@/components/LocationSelector.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const activities = ref<ActivityData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showDeleteModal = ref(false)
const activityToDelete = ref<ActivityData | null>(null)
const isDeleting = ref(false)

const filterForm = reactive({
  search: '',
  activityType: '',
  startLocation: '',
  endLocation: '',
  startDate: '',
  endDate: '',
  includeDeleted: false
})

const activityTypes = ref<string[]>([])
const currentUser = authStore.currentUser
const isSuperAdmin = currentUser?.role === 'SUPERADMIN'

const canViewDeleted = computed(() => {
  return isSuperAdmin || isVendor()
})

const isVendor = () => {
  const vendorRoles = ['TOUR_PACKAGE_VENDOR', 'FLIGHT_AIRLINE', 'ACCOMMODATION_OWNER', 'RENTAL_VENDOR']
  return currentUser && vendorRoles.includes(currentUser.role)
}

const canCreateActivity = () => {
  const allowedRoles = ['SUPERADMIN', 'TOUR_PACKAGE_VENDOR', 'FLIGHT_AIRLINE', 'ACCOMMODATION_OWNER', 'RENTAL_VENDOR']
  return currentUser && allowedRoles.includes(currentUser.role)
}

const canEditActivity = (activity: ActivityData) => {
  if (!currentUser) return false
  return isSuperAdmin || activity.creatorId === currentUser.id
}

const canDeleteActivity = (activity: ActivityData) => {
  if (!currentUser) return false
  return isSuperAdmin || activity.creatorId === currentUser.id
}

const sortedActivities = computed(() => {
  return [...activities.value].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })
})

const buildFilterPayload = () => {
  const payload: Record<string, any> = {}
  if (filterForm.activityType) payload.activityType = filterForm.activityType
  if (filterForm.startLocation) payload.startLocation = filterForm.startLocation.trim()
  if (filterForm.endLocation) payload.endLocation = filterForm.endLocation.trim()
  if (filterForm.startDate) payload.startDate = normalizeDateInput(filterForm.startDate)
  if (filterForm.endDate) payload.endDate = normalizeDateInput(filterForm.endDate)
  if (filterForm.search) payload.search = filterForm.search.trim()
  if (filterForm.includeDeleted && canViewDeleted.value) payload.includeDeleted = 'true'
  
  return Object.keys(payload).length ? payload : undefined
}

const normalizeDateInput = (value: string) => {
  if (!value) return ''
  return value.length === 16 ? `${value}:00` : value
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(amount)

const formatDateTime = (raw: string) => {
  if (!raw) return '-'
  const date = new Date(raw)
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const deriveActivityTypes = (items: ActivityData[]) => {
  const unique = Array.from(
    new Set(items.map((a) => a.activityType).filter((type): type is string => Boolean(type)))
  )
  unique.sort()
  return unique
}

const fetchActivities = async () => {
  loading.value = true
  error.value = null
  try {
    const payload = buildFilterPayload()
    const result = await activityApi.getActivities(payload)
    activities.value = result
    
    if (!payload || !payload.activityType) {
      activityTypes.value = deriveActivityTypes(result)
    }
  } catch (err: any) {
    console.error(err)
    error.value = err?.message || 'Failed to load activities. Please try again later.'
    activities.value = []
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  if (filterForm.startDate && filterForm.endDate && filterForm.endDate < filterForm.startDate) {
    error.value = 'End date cannot be earlier than start date.'
    return
  }
  fetchActivities()
}

const resetFilters = () => {
  filterForm.search = ''
  filterForm.activityType = ''
  filterForm.startLocation = ''
  filterForm.endLocation = ''
  filterForm.startDate = ''
  filterForm.endDate = ''
  filterForm.includeDeleted = false
  error.value = null
  fetchActivities()
}

const viewDetail = (activityId: string) => {
  router.push(`/activities/${activityId}`)
}

const editActivity = (activityId: string) => {
  router.push(`/activities/${activityId}/edit`)
}

const createNewActivity = () => {
  router.push('/activities/create')
}

const deleteActivity = async (activity: ActivityData) => {
  activityToDelete.value = activity
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!activityToDelete.value) return

  isDeleting.value = true
  try {
    await activityApi.deleteActivity(activityToDelete.value.id)
    alert('Activity successfully deleted.')
    showDeleteModal.value = false
    activityToDelete.value = null
    fetchActivities()
  } catch (err: any) {
    // Check for specific error messages
    let errorMsg = err.message || 'Failed to delete activity'
    
    if (errorMsg.includes('unfulfilled orders') || errorMsg.includes('unfulfilled')) {
      errorMsg = 'Cannot delete activity: This activity has unfulfilled orders.'
    }
    
    alert(errorMsg)
    console.error(err)
  } finally {
    isDeleting.value = false
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  activityToDelete.value = null
}

onMounted(() => {
  fetchActivities()
})
</script>

<template>
  <section class="activities-container">
    <div class="activities-header">
      <div>
        <h1>Activities</h1>
        <p class="subtitle">Browse all available activities and refine the list using the filters below</p>
      </div>
      <button 
        v-if="canCreateActivity()"
        @click="createNewActivity" 
        class="btn-create"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Create New Activity
      </button>
    </div>

    <div class="filter-card">
      <div class="filter-header">
        <h2>Filter Activities</h2>
      </div>

      <form @submit.prevent="applyFilters" class="filter-form">
        <div class="form-row">
          <div class="form-group">
            <label for="activity-search">Search</label>
            <input
              id="activity-search"
              v-model="filterForm.search"
              type="text"
              placeholder="Search by name or item"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="activity-type">Activity Type</label>
            <select
              id="activity-type"
              v-model="filterForm.activityType"
              class="form-input"
            >
              <option value="">All Types</option>
              <option v-for="type in activityTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <LocationSelector
              v-model="filterForm.startLocation"
              label="Start Location"
            />
          </div>

          <div class="form-group">
            <LocationSelector
              v-model="filterForm.endLocation"
              label="End Location"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="start-date">Start From</label>
            <input
              id="start-date"
              v-model="filterForm.startDate"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="end-date">End Until</label>
            <input
              id="end-date"
              v-model="filterForm.endDate"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <div v-if="canViewDeleted" class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="filterForm.includeDeleted"
                type="checkbox"
                class="checkbox-input"
              />
              <span>Include Deleted Activities</span>
            </label>
            <span class="help-text">Only Superadmin and Vendors can view deleted activities</span>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Filtering...' : 'Apply Filters' }}
          </button>
          <button type="button" class="btn-secondary" :disabled="loading" @click="resetFilters">
            Clear Filters
          </button>
        </div>
      </form>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading activities...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="sortedActivities.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>No activities found</h3>
      <p>There are no activities matching your search criteria.</p>
    </div>

    <!-- Activities Table -->
    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="activities-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Item</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Start Location</th>
              <th>End Location</th>
              <th>Price</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="activity in sortedActivities" :key="activity.id" :class="{ 'deleted-row': activity.isDeleted }">
              <td class="name-cell">{{ activity.activityName }}</td>
              <td>{{ activity.activityType }}</td>
              <td>{{ activity.activityItem }}</td>
              <td>{{ formatDateTime(activity.startDate) }}</td>
              <td>{{ formatDateTime(activity.endDate) }}</td>
              <td>{{ activity.startLocation }}</td>
              <td>{{ activity.endLocation }}</td>
              <td class="price-cell">{{ formatCurrency(activity.price) }}</td>
              <td class="capacity-cell">{{ activity.capacity }}</td>
              <td>
                <span v-if="activity.isDeleted" class="status-badge deleted">Deleted</span>
                <span v-else class="status-badge active">Active</span>
              </td>
              <td class="actions-cell">
                <button @click="viewDetail(activity.id)" class="btn-action btn-view" title="View Detail">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button 
                  v-if="canEditActivity(activity) && !activity.isDeleted" 
                  @click="editActivity(activity.id)" 
                  class="btn-action btn-edit" 
                  title="Edit Activity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button 
                  v-if="canDeleteActivity(activity) && !activity.isDeleted" 
                  @click="deleteActivity(activity)" 
                  class="btn-action btn-delete" 
                  title="Delete Activity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmDeleteModal
      :show="showDeleteModal"
      :activity-name="activityToDelete?.activityName || ''"
      :activity-type="activityToDelete?.activityType"
      :activity-item="activityToDelete?.activityItem"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </section>
</template>

<style scoped>
.activities-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.activities-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.activities-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-create:active {
  transform: translateY(0);
}

.filter-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filter-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.filter-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.filter-form {
  padding: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.65rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.checkbox-group {
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  color: #333;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.help-text {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
  border-color: #ccc;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  margin-bottom: 2rem;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
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

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.activities-table {
  width: 100%;
  border-collapse: collapse;
}

.activities-table thead {
  background-color: #f8f9fa;
}

.activities-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.activities-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.95rem;
}

.activities-table tbody tr:hover {
  background-color: #f8f9fa;
}

.deleted-row {
  background-color: #fff3e0;
}

.deleted-row:hover {
  background-color: #ffe0b2 !important;
}

.name-cell {
  font-weight: 600;
  color: #1a1a1a;
}

.price-cell {
  font-weight: 700;
  color: #2e7d32;
}

.capacity-cell {
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.deleted {
  background-color: #ffebee;
  color: #c62828;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-action {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-view {
  background-color: #e3f2fd;
  color: #1976d2;
}

.btn-view:hover {
  background-color: #1976d2;
  color: white;
  transform: translateY(-1px);
}

.btn-edit {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.btn-edit:hover {
  background-color: #2e7d32;
  color: white;
  transform: translateY(-1px);
}

.btn-delete {
  background-color: #ffebee;
  color: #c62828;
}

.btn-delete:hover {
  background-color: #c62828;
  color: white;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .activities-container {
    padding: 1rem;
  }

  .activities-header h1 {
    font-size: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .table-wrapper {
    overflow-x: scroll;
  }

  .activities-table {
    min-width: 1000px;
  }
}
</style>
