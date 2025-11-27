<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { planApi } from '@/services/plan.service'
import type { LocationData } from '@/interfaces/plan.interface'

const props = defineProps<{
  modelValue: string
  label?: string
  required?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const locations = ref<LocationData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const fetchLocations = async () => {
  loading.value = true
  error.value = null
  try {
    locations.value = await planApi.getLocations()
  } catch (err: any) {
    console.error('Error fetching locations:', err)
    error.value = 'Failed to load locations'
  } finally {
    loading.value = false
  }
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

onMounted(() => {
  fetchLocations()
})
</script>

<template>
  <div class="location-selector">
    <label v-if="label" class="block text-sm font-semibold text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <select
      :value="modelValue"
      @change="handleChange"
      :disabled="disabled || loading"
      :required="required"
      class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
    >
      <option value="">Select a location</option>
      <option v-for="location in locations" :key="location.code" :value="location.code">
        {{ location.name }} ({{ location.code }})
      </option>
    </select>
    
    <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
  </div>
</template>

<style scoped>
.location-selector select {
  appearance: auto;
}
</style>
