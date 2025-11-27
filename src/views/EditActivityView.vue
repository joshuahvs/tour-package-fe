<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { activityApi } from '@/services/activity.service'
import { useAuthStore } from '@/stores/auth'
import LocationSelector from '@/components/LocationSelector.vue'
import type { ActivityData } from '@/interfaces/activity.interface'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const currentUser = authStore.currentUser

const activityId = route.params.id as string

const formData = reactive({
  activityName: '',
  activityType: '',
  activityItem: '',
  price: 0,
  capacity: 1,
  startDate: '',
  endDate: '',
  startLocation: '',
  endLocation: ''
})

const originalActivity = ref<ActivityData | null>(null)
const isSubmitting = ref(false)
const loading = ref(true)
const errorMessage = ref('')

const canEdit = (): boolean => {
  if (!currentUser || !originalActivity.value) return false
  return currentUser.role === 'SUPERADMIN' || originalActivity.value.creatorId === currentUser.id
}

const validateForm = (): boolean => {
  errorMessage.value = ''

  // Required fields validation
  if (!formData.activityName.trim()) {
    errorMessage.value = 'Activity Name is required'
    return false
  }

  if (!formData.activityItem.trim()) {
    errorMessage.value = 'Activity Item is required'
    return false
  }

  if (!formData.startLocation) {
    errorMessage.value = 'Start Location is required'
    return false
  }

  if (!formData.endLocation) {
    errorMessage.value = 'End Location is required'
    return false
  }

  if (!formData.startDate) {
    errorMessage.value = 'Start Date is required'
    return false
  }

  if (!formData.endDate) {
    errorMessage.value = 'End Date is required'
    return false
  }

  // Price validation
  if (formData.price <= 0) {
    errorMessage.value = 'Price must be greater than 0'
    return false
  }

  // Capacity validation
  if (formData.capacity <= 0) {
    errorMessage.value = 'Capacity must be greater than 0'
    return false
  }

  // Date validation
  const now = new Date()
  const startDate = new Date(formData.startDate)
  const endDate = new Date(formData.endDate)

  if (startDate < now) {
    errorMessage.value = 'Start Date must be in the future'
    return false
  }

  if (endDate <= startDate) {
    errorMessage.value = 'End Date must be after Start Date'
    return false
  }

  return true
}

const fetchActivity = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const activity = await activityApi.getActivityById(activityId)
    originalActivity.value = activity

    // Check if user can edit
    if (!canEdit()) {
      errorMessage.value = 'You do not have permission to edit this activity'
      return
    }

    // Populate form
    formData.activityName = activity.activityName
    formData.activityType = activity.activityType
    formData.activityItem = activity.activityItem
    formData.price = activity.price
    formData.capacity = activity.capacity
    
    // Format dates for datetime-local input
    formData.startDate = formatDateTimeLocal(activity.startDate)
    formData.endDate = formatDateTimeLocal(activity.endDate)
    
    formData.startLocation = activity.startLocation
    formData.endLocation = activity.endLocation
  } catch (error: any) {
    console.error('Error fetching activity:', error)
    errorMessage.value = error.message || 'Failed to load activity'
  } finally {
    loading.value = false
  }
}

const formatDateTimeLocal = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const handleSubmit = async () => {
  if (!canEdit()) {
    errorMessage.value = 'You do not have permission to edit this activity'
    return
  }

  if (!validateForm()) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await activityApi.updateActivity(activityId, {
      activityName: formData.activityName.trim(),
      activityItem: formData.activityItem.trim(),
      price: formData.price,
      capacity: formData.capacity,
      startDate: formData.startDate,
      endDate: formData.endDate,
      startLocation: formData.startLocation,
      endLocation: formData.endLocation
    })
    
    alert('Activity updated successfully!')
    router.push(`/activities/${activityId}`)
  } catch (error: any) {
    // Check for specific error about fulfilled orders
    if (error.message?.includes('fulfilled') || error.message?.includes('ordered')) {
      errorMessage.value = 'Cannot update activity: This activity has fulfilled orders and cannot be modified.'
    } else {
      errorMessage.value = error.message || 'Failed to update activity. Please try again.'
    }
    console.error('Error updating activity:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
    router.push(`/activities/${activityId}`)
  }
}

onMounted(() => {
  fetchActivity()
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Update Activity</h1>
      <p class="text-gray-600 mt-2">Modify the activity details below</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-lg shadow-lg p-12">
      <div class="flex flex-col items-center justify-center">
        <div class="spinner mb-4"></div>
        <p class="text-gray-600">Loading activity details...</p>
      </div>
    </div>

    <!-- Error State (No Permission) -->
    <div v-else-if="errorMessage && !originalActivity" class="bg-white rounded-lg shadow-lg p-8">
      <div class="flex flex-col items-center text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mb-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p class="text-gray-600 mb-6">{{ errorMessage }}</p>
        <button
          @click="router.push('/activities')"
          class="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700"
        >
          Back to Activities
        </button>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-else class="bg-white rounded-lg shadow-lg">
      <div class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-4 rounded-t-lg">
        <h2 class="text-lg font-semibold">Activity Information</h2>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6">
        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="text-red-700 font-medium">{{ errorMessage }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Activity Name -->
          <div class="md:col-span-2">
            <label for="activityName" class="block text-sm font-semibold text-gray-700 mb-1">
              Activity Name <span class="text-red-500">*</span>
            </label>
            <input
              id="activityName"
              v-model="formData.activityName"
              type="text"
              placeholder="e.g., Jakarta-Bali Flight"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <!-- Activity Type (Read-only) -->
          <div>
            <label for="activityType" class="block text-sm font-semibold text-gray-700 mb-1">
              Activity Type <span class="text-gray-500 text-xs">(Cannot be changed)</span>
            </label>
            <input
              id="activityType"
              :value="formData.activityType"
              type="text"
              disabled
              readonly
              class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <!-- Activity Item -->
          <div>
            <label for="activityItem" class="block text-sm font-semibold text-gray-700 mb-1">
              Activity Item <span class="text-red-500">*</span>
            </label>
            <input
              id="activityItem"
              v-model="formData.activityItem"
              type="text"
              placeholder="e.g., Garuda Indonesia, Hotel Mulia"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <!-- Price -->
          <div>
            <label for="price" class="block text-sm font-semibold text-gray-700 mb-1">
              Price (IDR) <span class="text-red-500">*</span>
            </label>
            <input
              id="price"
              v-model.number="formData.price"
              type="number"
              min="0"
              step="any"
              placeholder="e.g., 500000"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <!-- Capacity -->
          <div>
            <label for="capacity" class="block text-sm font-semibold text-gray-700 mb-1">
              Capacity <span class="text-red-500">*</span>
            </label>
            <input
              id="capacity"
              v-model.number="formData.capacity"
              type="number"
              min="1"
              placeholder="e.g., 50"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <!-- Start Date -->
          <div>
            <label for="startDate" class="block text-sm font-semibold text-gray-700 mb-1">
              Start Date <span class="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              v-model="formData.startDate"
              type="datetime-local"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <!-- End Date -->
          <div>
            <label for="endDate" class="block text-sm font-semibold text-gray-700 mb-1">
              End Date <span class="text-red-500">*</span>
            </label>
            <input
              id="endDate"
              v-model="formData.endDate"
              type="datetime-local"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <!-- Start Location -->
          <div>
            <LocationSelector
              v-model="formData.startLocation"
              label="Start Location"
              :required="true"
            />
          </div>

          <!-- End Location -->
          <div>
            <LocationSelector
              v-model="formData.endLocation"
              label="End Location"
              :required="true"
            />
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isSubmitting ? 'Updating...' : 'Update Activity' }}
          </button>
          <button
            type="button"
            @click="handleCancel"
            :disabled="isSubmitting"
            class="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
