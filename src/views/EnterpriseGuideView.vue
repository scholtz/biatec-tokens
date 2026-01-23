<template>
  <MainLayout>
    <div class="container-padding">
      <div class="max-w-7xl mx-auto">
        <!-- Page Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Enterprise Decision Guide</h1>
            <router-link to="/token-standards">
              <Button variant="outline" size="md">
                <template #icon>
                  <ChartBarSquareIcon class="w-5 h-5 mr-2" />
                </template>
                Full Comparison
              </Button>
            </router-link>
          </div>
          <p class="text-gray-600 dark:text-gray-300 text-lg">
            Choose the right token standard for your enterprise requirements with our comprehensive decision guide
          </p>
        </div>

        <!-- Enterprise Decision Guide Component -->
        <EnterpriseDecisionGuide />
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '../layout/MainLayout.vue';
import EnterpriseDecisionGuide from '../components/EnterpriseDecisionGuide.vue';
import Button from '../components/ui/Button.vue';
import { ChartBarSquareIcon } from '@heroicons/vue/24/outline';
</script>
