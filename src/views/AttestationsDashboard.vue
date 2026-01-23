<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <button
            @click="$router.back()"
            class="mb-4 text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <i class="pi pi-arrow-left"></i>
            <span>Back</span>
          </button>

          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <i class="pi pi-verified text-biatec-accent"></i>
                Compliance Attestations
              </h1>
              <p class="text-gray-400">
                Manage MICA compliance attestations and verify audit readiness for your tokens
              </p>
            </div>
          </div>
        </div>

        <!-- Access Control Check -->
        <div v-if="!hasAccess" class="glass-effect rounded-xl p-12 text-center">
          <i class="pi pi-lock text-gray-500 text-4xl mb-4"></i>
          <p class="text-white font-semibold mb-2">Access Restricted</p>
          <p class="text-gray-400 mb-4">
            You need compliance or admin privileges to access this dashboard
          </p>
          <button
            @click="$router.push('/dashboard')"
            class="px-6 py-2 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        <!-- Main Content -->
        <div v-else>
          <!-- Network Selection -->
          <div class="glass-effect rounded-xl p-6 mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">Network Selection</h3>
                <p class="text-sm text-gray-400">Filter attestations by blockchain network</p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  v-for="network in networks"
                  :key="network"
                  @click="selectedNetwork = network"
                  :class="[
                    'px-4 py-2 rounded-lg transition-colors font-medium',
                    selectedNetwork === network
                      ? 'bg-biatec-accent text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  ]"
                >
                  {{ network }}
                </button>
              </div>
            </div>
          </div>

          <!-- Attestations List -->
          <AttestationsList :network="selectedNetwork === 'All Networks' ? undefined : (selectedNetwork as 'VOI' | 'Aramid')" />
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import AttestationsList from '../components/AttestationsList.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const selectedNetwork = ref<'All Networks' | 'VOI' | 'Aramid'>('All Networks')
const networks = ['All Networks', 'VOI', 'Aramid'] as const

// Role-based access control
// In a real implementation, this would check user roles from the auth store
const hasAccess = computed(() => {
  // For now, allow access if user is authenticated
  // In production, check for specific roles like 'compliance' or 'admin'
  return authStore.isAuthenticated
  
  // Example of stricter access control:
  // const userRoles = authStore.user?.roles || []
  // return userRoles.includes('compliance') || userRoles.includes('admin')
})

onMounted(() => {
  // Ensure user is authenticated
  if (!authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>
