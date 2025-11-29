<template>
  <section class="page">
    <!-- Authorization Check -->
    <div v-if="!isAuthorized" class="bg-red-50 border border-red-200 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-red-800 mb-2">Access Denied</h3>
      <p class="text-red-700">Only Superadmin and Tour Package Vendor can access revenue statistics.</p>
    </div>

    <div v-else>
      <h2 class="text-3xl font-bold mb-6">Revenue Statistics</h2>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-end gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Year <span class="text-red-500">*</span>
            </label>
            <select
              v-model="selectedYear"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Month (optional)</label>
            <select
              v-model="selectedMonth"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option :value="null">All Months</option>
              <option v-for="month in months" :key="month.value" :value="month.value">
                {{ month.label }}
              </option>
            </select>
          </div>
          <button
            @click="loadStatistics"
            :disabled="loading || !selectedYear"
            class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ loading ? 'Loading...' : 'Show Statistics' }}
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        {{ error }}
      </div>

      <!-- Chart and Table -->
      <div v-if="!loading && (yearlyData || monthlyData)">
        <!-- Yearly View: Line/Bar Chart -->
        <div v-if="yearlyData && !selectedMonth" class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 class="text-xl font-semibold mb-4 text-indigo-600">
            Revenue per Month - {{ selectedYear }}
          </h3>
          <div class="h-96 mb-6">
            <canvas ref="yearlyChartCanvas"></canvas>
          </div>
          
          <!-- Yearly Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in yearlyData.monthlyRevenues" :key="item.period">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatPeriod(item.period) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{{ formatCurrency(item.totalRevenue) }}</td>
                </tr>
                <tr class="bg-gray-50 font-semibold">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{{ formatCurrency(totalYearlyRevenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Monthly View: Pie/Bar Chart -->
        <div v-if="monthlyData && selectedMonth" class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 class="text-xl font-semibold mb-4 text-indigo-600">
            Revenue Breakdown - {{ formatPeriod(monthlyData.period) }}
          </h3>
          <div class="mb-4">
            <p class="text-2xl font-bold text-gray-800">
              Total Revenue: {{ formatCurrency(monthlyData.totalRevenue) }}
            </p>
          </div>
          <div class="h-96 mb-6">
            <canvas ref="monthlyChartCanvas"></canvas>
          </div>

          <!-- Monthly Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Type</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in monthlyData.breakdown" :key="item.activityType">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.activityType }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{{ formatCurrency(item.totalRevenue) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{{ item.percentage.toFixed(2) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-sm p-6">
        <div class="h-96 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p>Loading statistics...</p>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!loading && !yearlyData && !monthlyData && selectedYear" class="bg-white rounded-lg shadow-sm p-6">
        <div class="h-96 flex items-center justify-center">
          <div class="text-center text-gray-600">
            <p class="text-lg">No data available for the selected period.</p>
            <p class="text-sm mt-2">Try selecting a different year or month.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import { statisticsApi, type YearlyRevenueResponse, type MonthlyRevenueResponse } from '@/services/statistics.service'
import { useAuthStore } from '@/stores/auth'

Chart.register(...registerables)

const authStore = useAuthStore()
const currentUser = authStore.currentUser

const isAuthorized = computed(() => 
  currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'TOUR_PACKAGE_VENDOR'
)

const selectedYear = ref<number>(new Date().getFullYear())
const selectedMonth = ref<number | null>(null)
const loading = ref(false)
const error = ref('')
const yearlyData = ref<YearlyRevenueResponse | null>(null)
const monthlyData = ref<MonthlyRevenueResponse | null>(null)
const yearlyChartCanvas = ref<HTMLCanvasElement | null>(null)
const monthlyChartCanvas = ref<HTMLCanvasElement | null>(null)
let yearlyChartInstance: Chart | null = null
let monthlyChartInstance: Chart | null = null

const availableYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const totalYearlyRevenue = computed(() => {
  if (!yearlyData.value) return 0
  return yearlyData.value.monthlyRevenues.reduce((sum, item) => sum + item.totalRevenue, 0)
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

const formatPeriod = (period: string) => {
  const [year, month] = period.split('-')
  if (!month) return period
  const monthName = months.find(m => m.value === parseInt(month))?.label || month
  return `${monthName} ${year}`
}

const loadStatistics = async () => {
  if (!selectedYear.value || !isAuthorized.value) return

  loading.value = true
  error.value = ''
  yearlyData.value = null
  monthlyData.value = null

  try {
    if (selectedMonth.value) {
      // Load monthly breakdown
      monthlyData.value = await statisticsApi.getMonthlyRevenue(selectedYear.value, selectedMonth.value)
      loading.value = false
      await nextTick()
      renderMonthlyChart()
    } else {
      // Load yearly data
      yearlyData.value = await statisticsApi.getYearlyRevenue(selectedYear.value)
      loading.value = false
      await nextTick()
      renderYearlyChart()
    }
  } catch (err: any) {
    console.error('Error loading statistics:', err)
    error.value = err.message || 'Failed to load statistics'
  } finally {
    loading.value = false
  }
}

const ensureCanvasSize = (canvas: HTMLCanvasElement) => {
  const container = canvas.parentElement as HTMLElement | null
  const containerWidth = container?.clientWidth ?? 800
  const containerHeight = container?.clientHeight ?? 400
  canvas.width = containerWidth
  canvas.height = containerHeight
  canvas.style.width = '100%'
  canvas.style.height = '100%'
}

const renderYearlyChart = () => {
  if (!yearlyChartCanvas.value || !yearlyData.value) return

  // Destroy existing chart
  if (yearlyChartInstance) {
    yearlyChartInstance.destroy()
  }

  ensureCanvasSize(yearlyChartCanvas.value)

  const ctx = yearlyChartCanvas.value.getContext('2d')
  if (!ctx) return

  const data = yearlyData.value.monthlyRevenues
  const labels = data.map(item => formatPeriod(item.period))
  const values = data.map(item => item.totalRevenue)

  yearlyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Revenue',
          data: values,
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderColor: 'rgb(79, 70, 229)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: 'rgb(79, 70, 229)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Revenue: ${formatCurrency(context.parsed.y ?? 0)}`
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#111827'
          },
          grid: {
            color: 'rgba(17, 24, 39, 0.08)'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#111827',
            callback: function (value) {
              return formatCurrency(Number(value))
            }
          },
          grid: {
            color: 'rgba(17, 24, 39, 0.08)'
          }
        }
      }
    }
  })

  yearlyChartInstance.resize()
}

const renderMonthlyChart = () => {
  if (!monthlyChartCanvas.value || !monthlyData.value) return

  // Destroy existing chart
  if (monthlyChartInstance) {
    monthlyChartInstance.destroy()
  }

  ensureCanvasSize(monthlyChartCanvas.value)

  const ctx = monthlyChartCanvas.value.getContext('2d')
  if (!ctx) return

  const data = monthlyData.value.breakdown
  const labels = data.map(item => item.activityType)
  const values = data.map(item => item.totalRevenue)
  const percentages = data.map(item => item.percentage)

  monthlyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Revenue',
          data: values,
          backgroundColor: [
            'rgba(79, 70, 229, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: 'rgba(255,255,255,0.9)',
          borderWidth: 1.5,
          borderRadius: 6,
          barThickness: 'flex'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const idx = context.dataIndex
              const revenue = formatCurrency(values[idx] ?? 0)
              const percentage = (percentages[idx] ?? 0).toFixed(2)
              return `${context.label}: ${revenue} (${percentage}%)`
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#111827'
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#111827',
            callback: function (value) {
              return formatCurrency(Number(value))
            }
          },
          grid: {
            color: 'rgba(17, 24, 39, 0.08)'
          }
        }
      }
    }
  })

  monthlyChartInstance.resize()
}

onMounted(() => {
  if (isAuthorized.value) {
    loadStatistics()
  }
})

// Watch for month changes
watch(selectedMonth, () => {
  if (isAuthorized.value) {
    loadStatistics()
  }
})
</script>

<style scoped>
.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}
</style>
