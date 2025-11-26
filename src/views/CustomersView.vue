<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { customerApi } from '@/services/customer.service'
import type { CustomerData } from '@/interfaces/customer.interface'
import DataTable from 'datatables.net-dt'
import 'datatables.net-dt/css/dataTables.dataTables.css'

const customers = ref<CustomerData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchName = ref('')
const searchEmail = ref('')
const tableRef = ref<HTMLTableElement | null>(null)
let dt: any = null

const fetchCustomers = async () => {
  loading.value = true
  error.value = null
  try {
    const name = searchName.value.trim() || undefined
    const email = searchEmail.value.trim() || undefined
    customers.value = await customerApi.getAllCustomers(name, email)
  } catch (err: any) {
    error.value = err.message || 'Failed to load customers. Please try again later.'
    console.error(err)
  } finally {
    loading.value = false
    await nextTick()
    if (dt) {
      loadDataIntoDataTable()
    } else if (tableRef.value && customers.value.length > 0) {
      initDataTable()
    }
  }
}

const handleSearch = () => {
  if (dt) {
    dt.destroy()
    dt = null
  }
  fetchCustomers()
}

const clearSearch = () => {
  if (dt) {
    dt.destroy()
    dt = null
  }
  searchName.value = ''
  searchEmail.value = ''
  fetchCustomers()
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${hours}:${minutes}-${day}-${month}-${year}`
}

const mapCustomersToRows = () => {
  return customers.value.map((customer) => ({
    username: customer.username,
    fullName: customer.fullName,
    email: customer.email,
    createdAt: customer.createdAt,
    createdAtFormatted: formatDateTime(customer.createdAt),
  }))
}

const initDataTable = () => {
  if (!tableRef.value) return
  dt = new DataTable(tableRef.value, {
    data: mapCustomersToRows(),
    columns: [
      { title: 'Username', data: 'username' },
      { title: 'Name', data: 'fullName' },
      { title: 'Email', data: 'email' },
      { 
        title: 'Registered At', 
        data: 'createdAtFormatted',
        render: (data: string, type: string, row: any) => {
          if (type === 'display') {
            return `<span class="datetime-badge">${data}</span>`
          }
          return data
        }
      },
    ],
    pageLength: 10,
    order: [[3, 'desc']], // Sort by Registered At (newest first)
    language: {
      emptyTable: 'No customers found.',
      info: 'Showing _START_ to _END_ of _TOTAL_ customers',
      infoEmpty: 'Showing 0 to 0 of 0 customers',
      infoFiltered: '(filtered from _MAX_ total customers)',
      search: 'Search:',
      paginate: {
        first: 'First',
        last: 'Last',
        next: 'Next',
        previous: 'Previous'
      }
    }
  })
}

const loadDataIntoDataTable = () => {
  if (!dt) return
  dt.clear()
  dt.rows.add(mapCustomersToRows())
  dt.draw()
}

onMounted(() => {
  fetchCustomers()
})

onBeforeUnmount(() => {
  if (dt) {
    dt.destroy()
    dt = null
  }
})
</script>

<template>
  <div class="customers-container">
    <div class="customers-header">
      <h1>Customer Management</h1>
      <p class="subtitle">View and search all registered customers</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-inputs">
        <div class="input-group">
          <label for="searchName">Search by Name:</label>
          <input
            id="searchName"
            v-model="searchName"
            type="text"
            placeholder="Enter customer name..."
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="input-group">
          <label for="searchEmail">Search by Email:</label>
          <input
            id="searchEmail"
            v-model="searchEmail"
            type="text"
            placeholder="Enter customer email..."
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>
      <div class="search-actions">
        <button @click="handleSearch" class="btn-search">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Search
        </button>
        <button @click="clearSearch" class="btn-clear">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Clear
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading customers...</p>
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

    <!-- Empty State -->
    <div v-else-if="!loading && customers.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <line x1="22" y1="11" x2="16" y2="11"></line>
      </svg>
      <h3>No customers found.</h3>
      <p>Try adjusting your search criteria.</p>
    </div>

    <!-- DataTable -->
    <div v-else class="table-container">
      <table ref="tableRef" class="display" style="width:100%"></table>
    </div>
  </div>
</template>

<style scoped>
.customers-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.customers-header {
  margin-bottom: 2rem;
}

.customers-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.search-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.search-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.search-input {
  padding: 0.65rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.search-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-search,
.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-search {
  background-color: #4caf50;
  color: white;
}

.btn-search:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.btn-clear {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-clear:hover {
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

:deep(.datetime-badge) {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: #e8f5e9;
  color: #2e7d32;
  font-family: 'Courier New', monospace;
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
  .customers-container {
    padding: 1rem;
  }

  .customers-header h1 {
    font-size: 1.5rem;
  }

  .search-inputs {
    grid-template-columns: 1fr;
  }

  .search-actions {
    flex-direction: column;
  }

  .btn-search,
  .btn-clear {
    width: 100%;
    justify-content: center;
  }

  .table-container {
    overflow-x: auto;
  }
}
</style>
