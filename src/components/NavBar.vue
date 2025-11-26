<template>
  <header class="nav">
    <div class="container">
      <RouterLink to="/" class="brand">
        <span class="brand-text">Tour Package Management</span>
      </RouterLink>
      <nav class="links" v-if="isAuthenticated">
        <RouterLink to="/" class="link">Home</RouterLink>
        <RouterLink to="/activities" class="link">Activities</RouterLink>
        <RouterLink to="/packages" class="link">Packages</RouterLink>
        <RouterLink to="/reports" class="link">Reports</RouterLink>
        <RouterLink v-if="isSuperAdmin" to="/users" class="link">Users</RouterLink>
        <RouterLink v-if="canAccessCustomers" to="/customers" class="link">Customers</RouterLink>
      </nav>

      <div class="auth-buttons">
        <template v-if="isAuthenticated">
          <RouterLink to="/profile" class="user-chip">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">{{ currentUser?.role }}</span>
          </RouterLink>
          <button class="logout-btn" @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="link">Login</RouterLink>
          <RouterLink to="/register" class="btn-primary">Register</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.currentUser)
const userName = computed(() => currentUser.value?.fullName || currentUser.value?.username || 'User')
const isSuperAdmin = computed(() => currentUser.value?.role === 'SUPERADMIN')
const canAccessCustomers = computed(() => {
  const allowedRoles = ['SUPERADMIN', 'FLIGHT_AIRLINE', 'ACCOMMODATION_OWNER', 'RENTAL_VENDOR', 'INSURANCE_PROVIDER', 'TOUR_PACKAGE_VENDOR']
  return currentUser.value?.role && allowedRoles.includes(currentUser.value.role)
})

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.nav {
  background: #4f46e5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  min-height: 64px;
}
.brand {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.5px;
  color: white;
  text-decoration: none;
  white-space: nowrap;
  display: inline-block;
}
.brand-text {
  display: inline-block;
}
.links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}
.link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all .2s ease;
  white-space: nowrap;
  font-weight: 500;
}
.link:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}
.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  color: white !important;
}
.auth-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.user-chip {
  display: flex;
  flex-direction: column;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  color: white;
  font-size: 0.85rem;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}
.user-chip:hover {
  background: rgba(255, 255, 255, 0.28);
}
.user-name {
  font-weight: 600;
}
.user-role {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}
.logout-btn {
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: #4f46e5;
  background: white;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.logout-btn:hover {
  background: #f4f4ff;
}
.btn-primary {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.2s ease;
}
.btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
