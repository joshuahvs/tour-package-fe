<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/services/user.service'
import type { UserData } from '@/interfaces/user.interface'
import DataTable from 'datatables.net-dt'
import 'datatables.net-dt/css/dataTables.dataTables.css'

const router = useRouter()
const authStore = useAuthStore()
const users = ref<UserData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedRole = ref<string>('ALL')
const tableRef = ref<HTMLTableElement | null>(null)
let dt: any = null

const isAuthorized = computed(() => {
  return authStore.currentUser?.role === 'SUPERADMIN'
})

const roleOptions = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'SUPERADMIN', label: 'Superadmin' },
  { value: 'TOUR_PACKAGE_VENDOR', label: 'Tour Package Vendor' },
  { value: 'FLIGHT_AIRLINE', label: 'Flight Airline' },
  { value: 'ACCOMMODATION_OWNER', label: 'Accommodation Owner' },
  { value: 'RENTAL_VENDOR', label: 'Rental Vendor' },
  { value: 'CUSTOMER', label: 'Customer' },
]

const fetchUsers = async (role?: string) => {
  if (!isAuthorized.value) {
    error.value = 'You are not authorized to view this page.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    users.value = await userApi.getAllUsers(role === 'ALL' ? undefined : role)
  } catch (err: any) {
    error.value = err.message || 'Failed to load users. Please try again later.'
    console.error(err)
  } finally {
    loading.value = false
    await nextTick()
    if (dt) {
      loadDataIntoDataTable()
    } else if (tableRef.value && users.value.length > 0) {
      initDataTable()
    }
  }
}

const handleRoleChange = () => {
  if (dt) {
    dt.destroy()
    dt = null
  }
  fetchUsers(selectedRole.value)
}

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

const viewUserDetail = (id: string) => {
  router.push(`/users/${id}`)
}

const mapUsersToRows = () => {
  return users.value.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.roleType,
    roleDisplay: formatRoleDisplay(user.roleType),
  }))
}

const initDataTable = () => {
  if (!tableRef.value) return
  dt = new DataTable(tableRef.value, {
    data: mapUsersToRows(),
    columns: [
      { title: 'ID', data: 'id' },
      { title: 'Full Name', data: 'fullName' },
      { title: 'Username', data: 'username' },
      { title: 'Email', data: 'email' },
      {
        title: 'Role',
        data: 'roleDisplay',
        render: (data: string, type: string, row: any) => {
          if (type === 'display') {
            return `<span class="badge badge-role">${data}</span>`
          }
          return data
        }
      },
      {
        title: 'Actions',
        data: 'id',
        orderable: false,
        render: (_data: string, _type: string, row: any) => {
          return `<button class="btn-detail" data-id="${row.id}">Detail</button>`
        }
      },
    ],
    pageLength: 10,
    order: [[1, 'asc']],
    language: {
      emptyTable: 'No users found.',
      info: 'Showing _START_ to _END_ of _TOTAL_ users',
      infoEmpty: 'Showing 0 to 0 of 0 users',
      infoFiltered: '(filtered from _MAX_ total users)',
      search: 'Search:',
      paginate: {
        first: 'First',
        last: 'Last',
        next: 'Next',
        previous: 'Previous'
      }
    }
  })

  // Add click handler for detail buttons
  tableRef.value.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('btn-detail')) {
      const userId = target.getAttribute('data-id')
      if (userId) {
        viewUserDetail(userId)
      }
    }
  })
}

const loadDataIntoDataTable = () => {
  if (!dt) return
  dt.clear()
  dt.rows.add(mapUsersToRows())
  dt.draw()
}

onMounted(() => {
  if (!isAuthorized.value) {
    error.value = 'You are not authorized to view this page.'
    loading.value = false
    return
  }
  fetchUsers(selectedRole.value)
})

onBeforeUnmount(() => {
  if (dt) {
    dt.destroy()
    dt = null
  }
})
</script>

<template>
  <div class="users-container">
    <div class="users-header">
      <h1>User Management</h1>
      <p class="subtitle">Manage all users in the system</p>
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

    <!-- Main Content -->
    <template v-else>
      <!-- Filter Section -->
      <div class="filter-section">
        <div class="filter-group">
          <label for="roleFilter">Filter by Role:</label>
          <select id="roleFilter" v-model="selectedRole" @change="handleRoleChange" class="role-select">
            <option v-for="option in roleOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error && !isAuthorized" class="error-message">
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

      <!-- Empty State -->
      <div v-else-if="!loading && users.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h3>No users found.</h3>
        <p>There are no users matching your filter criteria.</p>
      </div>

      <!-- DataTable -->
      <div v-else class="table-container">
        <table ref="tableRef" class="display" style="width:100%"></table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.users-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.users-header {
  margin-bottom: 2rem;
}

.users-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-group label {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.role-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.role-select:hover {
  border-color: #4caf50;
}

.role-select:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
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
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* DataTable Custom Styles */
:deep(.dataTables_wrapper) {
  font-family: inherit;
}

:deep(.dataTables_filter) {
  margin-bottom: 1rem;
}

:deep(.dataTables_filter input) {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-left: 0.5rem;
}

:deep(table.dataTable thead th) {
  background-color: #f8f9fa;
  color: #333;
  font-weight: 600;
  padding: 1rem;
  border-bottom: 2px solid #dee2e6;
}

:deep(table.dataTable tbody td) {
  padding: 0.875rem 1rem;
  vertical-align: middle;
}

:deep(table.dataTable tbody tr:hover) {
  background-color: #f8f9fa;
}

:deep(.badge-role) {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: #e3f2fd;
  color: #1976d2;
  white-space: nowrap;
}

:deep(.btn-detail) {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

:deep(.btn-detail:hover) {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

:deep(.btn-detail:active) {
  transform: translateY(0);
}

:deep(.dataTables_info) {
  padding-top: 1rem;
  color: #666;
}

:deep(.dataTables_paginate) {
  padding-top: 1rem;
}

:deep(.dataTables_paginate .paginate_button) {
  padding: 0.5rem 0.75rem;
  margin: 0 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.dataTables_paginate .paginate_button:hover) {
  background-color: #4caf50;
  color: white !important;
  border-color: #4caf50;
}

:deep(.dataTables_paginate .paginate_button.current) {
  background-color: #4caf50;
  color: white !important;
  border-color: #4caf50;
}

:deep(.dataTables_paginate .paginate_button.disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .users-container {
    padding: 1rem;
  }

  .users-header h1 {
    font-size: 1.5rem;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .role-select {
    width: 100%;
  }

  .table-container {
    overflow-x: auto;
  }
}
</style>
