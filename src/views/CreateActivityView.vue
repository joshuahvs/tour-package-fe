<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { activityApi } from '@/services/activity.service'
import { useAuthStore } from '@/stores/auth'
import LocationSelector from '@/components/LocationSelector.vue'

const router = useRouter()
const authStore = useAuthStore()
const currentUser = authStore.currentUser

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

const isSubmitting = ref(false)
const errorMessage = ref('')

// Activity types based on user role
const availableActivityTypes = computed(() => {
  if (!currentUser) return []
  
  const role = currentUser.role
  
  if (role === 'TOUR_PACKAGE_VENDOR' || role === 'SUPERADMIN') {
    return [
      { value: 'Flight', label: 'Flight' },
      { value: 'Accommodation', label: 'Accommodation' },
      { value: 'Vehicle Rental', label: 'Vehicle Rental' }
    ]
  } else if (role === 'FLIGHT_AIRLINE') {
    return [{ value: 'Flight', label: 'Flight' }]
  } else if (role === 'ACCOMMODATION_OWNER') {
    return [{ value: 'Accommodation', label: 'Accommodation' }]
  } else if (role === 'RENTAL_VENDOR') {
    return [{ value: 'Vehicle Rental', label: 'Vehicle Rental' }]
  }
  
  return []
})

const validateForm = (): boolean => {
  errorMessage.value = ''

  // Required fields validation
  if (!formData.activityName.trim()) {
    errorMessage.value = 'Activity Name is required'
    return false
  }

  if (!formData.activityType) {
    errorMessage.value = 'Activity Type is required'
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

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await activityApi.createActivity({
      activityName: formData.activityName.trim(),
      activityType: formData.activityType,
      activityItem: formData.activityItem.trim(),
      price: formData.price,
      capacity: formData.capacity,
      startDate: formData.startDate,
      endDate: formData.endDate,
      startLocation: formData.startLocation,
      endLocation: formData.endLocation
    })
    
    alert('Activity created successfully!')
    router.push('/activities')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to create activity. Please try again.'
    console.error('Error creating activity:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
    router.push('/activities')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Create New Activity</h1>
      <p class="text-gray-600 mt-2">Fill in the details to create a new activity</p>
    </div>

    <div class="bg-white rounded-lg shadow-lg">
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

          <!-- Activity Type -->
          <div>
            <label for="activityType" class="block text-sm font-semibold text-gray-700 mb-1">
              Activity Type <span class="text-red-500">*</span>
            </label>
            <select
              id="activityType"
              v-model="formData.activityType"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">Select Activity Type</option>
              <option v-for="type in availableActivityTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
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
            {{ isSubmitting ? 'Creating...' : 'Create Activity' }}
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
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
