<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { packageApi } from '@/services/package.service'
import { planApi } from '@/services/plan.service'
import type { PackageDetailData } from '@/interfaces/package.interface'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const packageDetail = ref<PackageDetailData | null>(null)
const loading = ref(true)
const error = ref('')
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const showProcessModal = ref(false)
const isProcessing = ref(false)
const locationMap = ref<Record<string, string>>({})

const currentUser = authStore.currentUser
const isCustomer = computed(() => currentUser?.role === 'CUSTOMER')
const isSuperAdminOrVendor = computed(() => 
  currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'TOUR_PACKAGE_VENDOR'
)

const isOwnPackage = computed(() => 
  packageDetail.value && currentUser && packageDetail.value.userId === currentUser.id
)

const packageInfo = computed(() => {
  if (!packageDetail.value) return {}
  return {
    'Package ID': packageDetail.value.id,
    'Package Name': packageDetail.value.packageName,
    'User ID': packageDetail.value.userId,
    'Start Date': formatDate(packageDetail.value.startDate),
    'End Date': formatDate(packageDetail.value.endDate),
    'Quota': packageDetail.value.quota,
    'Total Price': formatCurrency(packageDetail.value.price)
  }
})

const tableHeaders = [
  'Plan Name', 'Activity Type', 'Price', 'Start Date', 'End Date',
  'Start Location', 'End Location', 'Status', 'Activities', 'Actions'
]

// Authorization for Edit button
const canEdit = computed(() => {
  if (!packageDetail.value) return false
  
  // Package must be PENDING and have no plans
  if (packageDetail.value.status !== 'PENDING' || packageDetail.value.plans.length > 0) {
    return false
  }
  
  // Customer: only their own packages
  if (isCustomer.value) {
    return isOwnPackage.value
  }
  
  // Superadmin and Vendor: all packages
  return isSuperAdminOrVendor.value
})

// Authorization for Delete button
const canDelete = computed(() => {
  if (!packageDetail.value) return false
  
  // Package must be PENDING
  if (packageDetail.value.status !== 'PENDING') {
    return false
  }
  
  // Customer: only their own packages
  if (isCustomer.value) {
    return isOwnPackage.value
  }
  
  // Superadmin and Vendor: all PENDING packages
  return isSuperAdminOrVendor.value
})

// Authorization for Process button
const canProcess = computed(() => {
  if (!packageDetail.value) return false
  
  // Customer CANNOT process packages
  if (isCustomer.value) {
    return false
  }
  
  // Only Superadmin and Vendor can process
  if (!isSuperAdminOrVendor.value) {
    return false
  }
  
  // Package must be PENDING, have plans, and all plans must be FULFILLED
  return packageDetail.value.status?.toUpperCase() === 'PENDING' &&
    packageDetail.value.plans.length > 0 &&
    packageDetail.value.plans.every(plan => plan.status?.toUpperCase() === 'FULFILLED')
})

const fetchPackageDetail = async () => {
  try {
    loading.value = true
    const id = route.params.id as string
    packageDetail.value = await packageApi.getPackageDetail(id)
  } catch {
    error.value = 'Failed to load package details'
  } finally {
    loading.value = false
  }
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatCurrency = (a: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(a)

const fetchLocations = async () => {
  try {
    const locations = await planApi.getLocations()
    locationMap.value = locations.reduce((acc, loc) => {
      acc[loc.code] = loc.name
      return acc
    }, {} as Record<string, string>)
  } catch (err) {
    console.error('Failed to load locations', err)
  }
}

const formatLocation = (name?: string, code?: string) => {
  if (name) return name
  if (!code) return '-'
  return locationMap.value[code] || code
}

const getStatusClass = (status: string) => {
  const s = status.toLowerCase()
  if (['processed', 'fulfilled'].includes(s)) return 'bg-emerald-100 text-emerald-800'
  if (['pending', 'unfulfilled'].includes(s)) return 'bg-amber-100 text-amber-800'
  return 'bg-gray-200 text-gray-700'
}

const handleEdit = () => {
  if (!canEdit.value) {
    if ((packageDetail.value?.plans?.length ?? 0) > 0) {
      return alert('Cannot edit package: Package already has plans')
    }
    if (packageDetail.value?.status !== 'PENDING') {
      return alert('Cannot edit package: Only PENDING packages can be edited')
    }
    return alert('You do not have permission to edit this package')
  }
  router.push(`/packages/${route.params.id}/edit`)
}

const handleDelete = async () => {
  if (!canDelete.value) {
    if (packageDetail.value?.status !== 'PENDING') {
      return alert('Cannot delete package: Only PENDING packages can be deleted')
    }
    return alert('You do not have permission to delete this package')
  }
  
  showDeleteModal.value = false
  isDeleting.value = true
  try {
    await packageApi.deletePackage(route.params.id as string)
    alert('Package deleted successfully!')
    router.push('/packages')
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to delete package. Please try again.'
    alert(`Error: ${errorMessage}`)
  } finally {
    isDeleting.value = false
  }
}

const handleViewPlan = (id: string) => router.push(`/plans/${id}`)
const handleCreatePlan = () => router.push(`/packages/${route.params.id}/plans/create`)

const handleProcess = async () => {
  showProcessModal.value = false
  isProcessing.value = true
  try {
    await packageApi.processPackage(route.params.id as string)
    alert('Package processed successfully!')
    await fetchPackageDetail()
  } catch {
    alert('Failed to process package')
  } finally {
    isProcessing.value = false
  }
}

const handleProcessClick = () => {
  if (!canProcess.value) {
    if (isCustomer.value) {
      return alert('Customers cannot process packages')
    }
    if (packageDetail.value?.status !== 'PENDING') {
      return alert('Cannot process package: Only PENDING packages can be processed')
    }
    if ((packageDetail.value?.plans?.length ?? 0) === 0) {
      return alert('Cannot process package: Package must have at least one plan')
    }
    const hasUnfulfilledPlans = packageDetail.value?.plans?.some(
      plan => plan.status?.toUpperCase() !== 'FULFILLED'
    )
    if (hasUnfulfilledPlans) {
      return alert('Cannot process package: All plans must be FULFILLED')
    }
    return alert('You do not have permission to process this package')
  }
  showProcessModal.value = true
}

onMounted(() => {
  fetchPackageDetail()
  fetchLocations()
})
</script>


<template>
  <div class="p-8 max-w-[1400px] mx-auto">
    <div v-if="loading" class="text-center py-12 text-lg">Loading...</div>

    <div v-else-if="error" class="text-center py-12 text-lg text-red-600">
      {{ error }}
    </div>

    <div v-else-if="packageDetail" class="flex flex-col gap-6">
      <!-- Package Header -->
      <h1 class="text-3xl font-bold text-gray-800 mb-4">
        {{ packageDetail.packageName }}
      </h1>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3 mb-2">
        <button
          v-if="canEdit || isSuperAdminOrVendor || isOwnPackage"
          class="px-4 py-2 rounded-md font-medium text-white transition 
                 disabled:opacity-60 disabled:cursor-not-allowed 
                 bg-indigo-500 hover:bg-indigo-600"
          @click="handleEdit"
          :disabled="!canEdit"
          :title="!canEdit ? 'Can only edit PENDING packages without plans' : 'Edit this package'"
        >
          Edit Package
        </button>

        <button
          v-if="canDelete || isSuperAdminOrVendor || isOwnPackage"
          class="px-4 py-2 rounded-md font-medium text-white transition
                 disabled:opacity-60 disabled:cursor-not-allowed
                 bg-red-500 hover:bg-red-600"
          @click="showDeleteModal = true"
          :disabled="!canDelete"
          :title="!canDelete ? 'Can only delete PENDING packages' : 'Delete this package'"
        >
          Delete Package
        </button>

        <button
          v-if="!isCustomer"
          class="px-4 py-2 rounded-md font-medium text-white transition
                 bg-emerald-500 hover:bg-emerald-600
                 disabled:opacity-60 disabled:cursor-not-allowed"
          @click="handleProcessClick"
          :disabled="!canProcess"
          :title="!canProcess ? 'Must be PENDING with all plans FULFILLED' : 'Process this package'"
        >
          Process Package
        </button>
      </div>

      <!-- Package Information Card -->
      <div class="bg-white rounded-lg shadow">
        <h2 class="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-6 py-4 text-lg font-semibold">
          Package Information
        </h2>
        <div class="grid md:grid-cols-2 gap-6 p-6">
          <div v-for="(value, label) in packageInfo" :key="label" class="flex flex-col gap-1">
            <label class="font-semibold text-gray-500 text-sm">{{ label }}:</label>
            <span class="text-gray-800 text-base">{{ value }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-semibold text-gray-500 text-sm">Status:</label>
            <span
              :class="[
                'inline-block px-3 py-1 rounded-full text-sm font-medium',
                getStatusClass(packageDetail.status)
              ]"
            >
              {{ packageDetail.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Plans for Package Card -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div
          class="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-6 py-4 flex justify-between items-center"
        >
          <h2 class="text-lg font-semibold">Plans for Package</h2>
          <button
            v-if="packageDetail.status === 'PENDING'"
            class="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-sm rounded-md font-medium transition"
            @click="handleCreatePlan"
          >
            Create New Plan
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th v-for="header in tableHeaders" :key="header" class="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="plan in packageDetail.plans"
                :key="plan.id"
                class="border-b border-gray-200 hover:bg-gray-50"
              >
                <td class="px-4 py-3 text-gray-800 text-sm">{{ plan.planName }}</td>
                <td class="px-4 py-3 text-gray-800 text-sm">{{ plan.activityType }}</td>
                <td class="px-4 py-3 text-gray-800 text-sm">{{ formatCurrency(plan.price) }}</td>
                <td class="px-4 py-3 text-gray-800 text-sm">{{ formatDateTime(plan.startDate) }}</td>
                <td class="px-4 py-3 text-gray-800 text-sm">{{ formatDateTime(plan.endDate) }}</td>
                <td class="px-4 py-3 text-gray-800 text-sm">
                  {{ formatLocation(plan.startLocationName, plan.startLocation) }}
                </td>
                <td class="px-4 py-3 text-gray-800 text-sm">
                  {{ formatLocation(plan.endLocationName, plan.endLocation) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-block px-3 py-1 rounded-full text-sm font-medium',
                      getStatusClass(plan.status)
                    ]"
                  >
                    {{ plan.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center text-gray-800 text-sm">
                  {{ plan.activitiesCount }}
                </td>
                <td class="px-4 py-3">
                  <button
                    class="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 rounded-md transition"
                    @click="handleViewPlan(plan.id)"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4"
      @click="showDeleteModal = false"
    >
      <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full text-gray-100" @click.stop>
        <h3 class="text-xl font-semibold mb-4 text-red-400">Confirm Package Deletion</h3>
        
        <!-- Package Information -->
        <div class="bg-gray-700 rounded-lg p-4 mb-4 text-sm">
          <div class="mb-2">
            <span class="text-gray-400">Package Name:</span>
            <span class="ml-2 font-medium">{{ packageDetail?.packageName }}</span>
          </div>
          <div class="mb-2">
            <span class="text-gray-400">Period:</span>
            <span class="ml-2">{{ packageDetail ? formatDate(packageDetail.startDate) : '' }} - {{ packageDetail ? formatDate(packageDetail.endDate) : '' }}</span>
          </div>
          <div>
            <span class="text-gray-400">Plans:</span>
            <span class="ml-2">{{ packageDetail?.plans.length || 0 }} plan(s)</span>
          </div>
        </div>
        
        <!-- Warning Message -->
        <div class="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-6">
          <p class="text-red-300 text-sm">
            ⚠️ <strong>Warning:</strong> This action cannot be undone. Deleting this package will also permanently delete all associated <strong>Plans</strong> and <strong>Ordered Activities</strong>.
          </p>
        </div>
        
        <p class="mb-6 text-gray-300">
          Are you sure you want to delete this package?
        </p>
        
        <div class="flex gap-3 justify-center">
          <button
            class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-md min-w-[100px] font-medium transition-colors"
            @click="handleDelete"
            :disabled="isDeleting"
          >
            {{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}
          </button>
          <button
            class="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-md min-w-[100px] font-medium transition-colors"
            @click="showDeleteModal = false"
            :disabled="isDeleting"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Process Confirmation Modal -->
    <div
      v-if="showProcessModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4"
      @click="showProcessModal = false"
    >
      <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full text-gray-100" @click.stop>
        <h3 class="text-xl font-semibold mb-4">Process Package</h3>
        <p class="mb-4 text-gray-300">
          Are you sure you want to process this package? This will change the package status to 'PROCESSED' and book all activities. This action cannot be undone.
        </p>
        <div class="bg-amber-100 border border-amber-300 text-amber-800 px-3 py-2 rounded-md text-sm mb-6">
          ⚠️ All associated activities will have their capacity reduced.
        </div>
        <div class="flex gap-3 justify-center">
          <button
            class="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md min-w-[80px]"
            @click="handleProcess"
            :disabled="isProcessing"
          >
            {{ isProcessing ? 'Processing...' : 'OK' }}
          </button>
          <button
            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md min-w-[80px]"
            @click="showProcessModal = false"
            :disabled="isProcessing"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>