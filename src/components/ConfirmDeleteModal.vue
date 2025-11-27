<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  show: boolean
  title?: string
  activityName: string
  activityType?: string
  activityItem?: string
  isDeleting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Activity Deletion',
  isDeleting: false
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="handleCancel">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>{{ title }}</h2>
            <button @click="handleCancel" class="close-button" :disabled="isDeleting">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="warning-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>

            <p class="warning-text">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>

            <div class="activity-info">
              <div class="info-row">
                <span class="info-label">Activity Name:</span>
                <span class="info-value">{{ activityName }}</span>
              </div>
              <div v-if="activityType" class="info-row">
                <span class="info-label">Type:</span>
                <span class="info-value">{{ activityType }}</span>
              </div>
              <div v-if="activityItem" class="info-row">
                <span class="info-label">Item:</span>
                <span class="info-value">{{ activityItem }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button 
              @click="handleCancel" 
              class="btn-cancel"
              :disabled="isDeleting"
            >
              Cancel
            </button>
            <button 
              @click="handleConfirm" 
              class="btn-delete"
              :disabled="isDeleting"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete Activity' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

.close-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 2rem 1.5rem;
}

.warning-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #ef4444;
}

.warning-text {
  text-align: center;
  color: #374151;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.activity-info {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.info-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.info-value {
  color: #1f2937;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.btn-cancel,
.btn-delete {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.btn-delete {
  background-color: #ef4444;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-cancel:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s, opacity 0.2s;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}
</style>
