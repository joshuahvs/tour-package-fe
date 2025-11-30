<template>
  <header class="nav">
    <div class="container">
      <RouterLink to="/" class="brand">
        <span class="brand-text">Tour Package Management</span>
      </RouterLink>
      <div class="navigation-sections">
        <nav class="links" v-if="isAuthenticated">
          <RouterLink to="/" class="link">Home</RouterLink>
          <RouterLink to="/activities" class="link">Activities</RouterLink>
          <RouterLink to="/packages" class="link">Packages</RouterLink>
          <RouterLink to="/statistics" class="link">Statistics</RouterLink>
          <RouterLink v-if="isSuperAdmin" to="/users" class="link">Users</RouterLink>
          <RouterLink v-if="canAccessCustomers" to="/customers" class="link">Customers</RouterLink>
        </nav>

        <div
          class="partner-dropdown"
          @mouseenter="showPartnerMenu = true"
          @mouseleave="showPartnerMenu = false"
        >
          <button class="partner-trigger" type="button">
            Partner Modules
            <span class="chevron" :class="{ open: showPartnerMenu }">⌄</span>
          </button>
          <div class="dropdown" v-if="showPartnerMenu">
            <a
              v-for="module in partnerModules"
              :key="module.url"
              class="partner-link"
              :href="module.url"
              target="_blank"
              rel="noreferrer noopener"
            >
              <span class="partner-title">{{ module.label }}</span>
              <span class="partner-desc">{{ module.description }}</span>
            </a>
          </div>
        </div>
      </div>

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
import { computed, ref } from 'vue'
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

const partnerModules = [
  {
    label: 'Flight & Loyalty',
    description: 'Manage flights and loyalty program',
    url: 'http://2306231422-fe.hafizmuh.site/',
  },
  {
    label: 'Vehicle Rental & Bill',
    description: 'Vehicle fleet and billing portal',
    url: 'http://2306240124-fe.hafizmuh.site/',
  },
  {
    label: 'Accommodation & Top-up',
    description: 'Hotels plus top-up service',
    url: 'http://2306240162-fe.hafizmuh.site',
  },
  {
    label: 'Insurance & Support',
    description: 'Travel insurance & support desk',
    url: 'http://2306165622-fe.hafizmuh.site',
  },
]

const showPartnerMenu = ref(false)

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
.navigation-sections {
  display: flex;
  align-items: center;
  gap: 1rem;
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
.partner-dropdown {
  position: relative;
}
.partner-trigger {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.partner-trigger:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.8);
}
.chevron {
  transition: transform 0.2s ease;
}
.chevron.open {
  transform: rotate(180deg);
}
.dropdown {
  position: absolute;
  top: calc(100% + 0.4rem);
  right: 0;
  min-width: 220px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.25);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  z-index: 10;
}
.partner-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  color: #111827;
  transition: background 0.2s ease;
}
.partner-link:hover {
  background: #eef2ff;
}
.partner-title {
  font-weight: 600;
}
.partner-desc {
  font-size: 0.8rem;
  color: #6b7280;
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
