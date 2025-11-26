import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ActivitiesView from '@/views/ActivitiesView.vue'
import ActivityDetailView from '@/views/ActivityDetailView.vue'
import PackagesView from '@/views/PackagesView.vue'
import CreatePackageView from '@/views/CreatePackageView.vue'
import EditPackageView from '@/views/EditPackageView.vue'
import PackageDetailView from '@/views/PackageDetailView.vue'
import CreatePlanView from '@/views/CreatePlanView.vue'
import PlanDetailView from '@/views/PlanDetailView.vue'
import EditPlanView from '@/views/EditPlanView.vue'
import ReportsView from '@/views/ReportsView.vue'
import UsersView from '@/views/UsersView.vue'
import UserDetailView from '@/views/UserDetailView.vue'
import CustomersView from '@/views/CustomersView.vue'
import ProfileView from '@/views/ProfileView.vue'
import EditProfileView from '@/views/EditProfileView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/activities',
      name: 'activities',
      component: ActivitiesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/activities/:id',
      name: 'activity-detail',
      component: ActivityDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/packages',
      name: 'packages',
      component: PackagesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/packages/create',
      name: 'create-package',
      component: CreatePackageView,
      meta: { requiresAuth: true },
    },
    {
      path: '/packages/:id',
      name: 'package-detail',
      component: PackageDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/packages/:id/edit',
      name: 'edit-package',
      component: EditPackageView,
      meta: { requiresAuth: true },
    },
    {
      path: '/packages/:id/plans/create',
      name: 'create-plan',
      component: CreatePlanView,
      meta: { requiresAuth: true },
    },
    {
      path: '/plans/:id',
      name: 'plan-detail',
      component: PlanDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/plans/:id/edit',
      name: 'edit-plan',
      component: EditPlanView,
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: { requiresAuth: true },
    },
    {
      path: '/users/:id',
      name: 'user-detail',
      component: UserDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/customers',
      name: 'customers',
      component: CustomersView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/edit',
      name: 'edit-profile',
      component: EditProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/:identifier',
      name: 'profile-detail',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/:identifier/edit',
      name: 'edit-profile-detail',
      component: EditProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    const redirect = (to.query.redirect as string) || '/'
    next({ path: redirect })
    return
  }

  next()
})

export default router
