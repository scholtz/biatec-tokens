<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">

        <!-- ── Header ──────────────────────────────────────────────────────── -->
        <header class="mb-8">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Portfolio Launchpad
              </h1>
              <p class="text-gray-600 dark:text-gray-300 text-lg">
                Discover, evaluate, and act on token opportunities with confidence
              </p>
            </div>
            <!-- Stage progress indicator -->
            <nav aria-label="Launchpad progress" class="flex items-center gap-2">
              <template v-for="(s, idx) in stages" :key="s.key">
                <button
                  :aria-current="s.key === store.stage ? 'step' : undefined"
                  :class="stepClasses(s.key)"
                  :disabled="!isStageReachable(s.key)"
                  :aria-label="`Stage ${idx + 1}: ${s.label}`"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  @click="navigateToStage(s.key)"
                >
                  <span
                    class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    :class="stepBadgeClasses(s.key)"
                  >{{ idx + 1 }}</span>
                  <span class="hidden sm:inline">{{ s.label }}</span>
                </button>
                <ChevronRightIcon v-if="idx < stages.length - 1" class="w-3 h-3 text-gray-400" aria-hidden="true" />
              </template>
            </nav>
          </div>
        </header>

        <!-- ── Loading state ───────────────────────────────────────────────── -->
        <div
          v-if="store.loading"
          role="status"
          aria-live="polite"
          aria-label="Loading token opportunities"
          class="glass-effect rounded-xl p-16 text-center"
        >
          <div class="inline-block w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" aria-hidden="true"></div>
          <p class="text-gray-600 dark:text-gray-300 text-lg">Loading opportunities…</p>
        </div>

        <!-- ── Error state ─────────────────────────────────────────────────── -->
        <div
          v-else-if="store.error && store.stage === 'discover'"
          role="alert"
          class="glass-effect rounded-xl p-12 text-center"
        >
          <ExclamationTriangleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <p class="text-gray-900 dark:text-white text-lg font-semibold mb-2">Failed to load opportunities</p>
          <p class="text-gray-600 dark:text-gray-300 mb-6">{{ store.error }}</p>
          <button
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            @click="store.fetchTokens()"
          >
            Retry
          </button>
        </div>

        <!-- ── Stage: Discover ─────────────────────────────────────────────── -->
        <section
          v-else-if="store.stage === 'discover'"
          aria-label="Discover token opportunities"
        >
          <!-- Empty state -->
          <div
            v-if="store.tokens.length === 0"
            class="glass-effect rounded-xl p-16 text-center"
          >
            <MagnifyingGlassIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <p class="text-gray-900 dark:text-white text-lg font-semibold mb-2">No opportunities available</p>
            <p class="text-gray-600 dark:text-gray-300">Check back soon for new token opportunities.</p>
          </div>

          <!-- Token grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <article
              v-for="token in store.tokens"
              :key="token.id"
              :aria-label="`${token.name} – ${token.utilitySummary}`"
              class="glass-effect rounded-xl p-6 flex flex-col gap-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] focus-within:ring-2 focus-within:ring-blue-500"
              :class="token.isFeatured ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''"
              @click="handleTokenSelect(token.id)"
            >
              <!-- Featured badge -->
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span
                    v-if="token.isFeatured"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 mb-2"
                  >
                    <StarIcon class="w-3 h-3 mr-1" aria-hidden="true" />Featured
                  </span>
                  <h2 class="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {{ token.name }}
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ token.symbol }} · {{ token.standard }} · {{ token.network }}
                  </p>
                </div>
                <!-- Trust score badge -->
                <div
                  class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                  :class="trustScoreClasses(token.trustScore)"
                  :aria-label="`Trust score: ${token.trustScore ?? 'N/A'}`"
                >
                  {{ token.trustScore ?? '?' }}
                </div>
              </div>

              <!-- Utility summary -->
              <p class="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                {{ token.utilitySummary ?? 'No summary available.' }}
              </p>

              <!-- Indicators row -->
              <div class="flex items-center gap-3 text-xs flex-wrap">
                <!-- Liquidity -->
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                  :class="liquidityClasses(token.liquidityIndicator)"
                >
                  <ChartBarIcon class="w-3 h-3" aria-hidden="true" />
                  {{ capitalize(token.liquidityIndicator ?? 'unknown') }} liquidity
                </span>

                <!-- Compliance -->
                <span
                  v-if="token.complianceStatus === 'compliant'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium"
                >
                  <ShieldCheckIcon class="w-3 h-3" aria-hidden="true" />Compliant
                </span>
                <span
                  v-else-if="token.complianceStatus === 'partial'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 font-medium"
                >
                  <ShieldExclamationIcon class="w-3 h-3" aria-hidden="true" />Partial
                </span>

                <!-- KYC required -->
                <span
                  v-if="token.kycRequired"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-medium"
                >
                  <IdentificationIcon class="w-3 h-3" aria-hidden="true" />KYC
                </span>
              </div>

              <!-- Account compatibility note -->
              <p
                v-if="token.accessNote"
                class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"
              >
                <InformationCircleIcon class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {{ token.accessNote }}
              </p>

              <!-- CTA -->
              <button
                class="w-full mt-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                :aria-label="`${token.actionLabel ?? 'Explore'} ${token.symbol}`"
                @click.stop="handleTokenSelect(token.id)"
              >
                {{ token.actionLabel ?? 'Explore' }}
              </button>
            </article>
          </div>
        </section>

        <!-- ── Stage: Evaluate ─────────────────────────────────────────────── -->
        <section
          v-else-if="store.stage === 'evaluate' && store.selectedToken"
          aria-label="Evaluate selected token"
        >
          <div class="glass-effect rounded-xl p-8 max-w-3xl mx-auto">
            <!-- Back + header -->
            <div class="flex items-center gap-4 mb-6">
              <button
                class="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Back to discover"
                @click="store.deselectToken()"
              >
                <ArrowLeftIcon class="w-5 h-5" aria-hidden="true" />
                <span class="text-sm font-medium">Back</span>
              </button>
              <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ store.selectedToken.name }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ store.selectedToken.symbol }} · {{ store.selectedToken.standard }} · {{ store.selectedToken.network }}
                </p>
              </div>
            </div>

            <!-- Value summary -->
            <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Utility Summary</h3>
              <p class="text-sm text-blue-700 dark:text-blue-200">
                {{ store.selectedToken.utilitySummary ?? 'No summary available.' }}
              </p>
            </div>

            <!-- Trust & compliance -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Trust Score</p>
                <p
                  class="text-2xl font-bold"
                  :class="trustScoreClasses(store.selectedToken.trustScore)"
                >
                  {{ store.selectedToken.trustScore ?? 'N/A' }}
                </p>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Liquidity</p>
                <p class="text-2xl font-bold" :class="liquidityTextClasses(store.selectedToken.liquidityIndicator)">
                  {{ capitalize(store.selectedToken.liquidityIndicator ?? 'Unknown') }}
                </p>
              </div>
            </div>

            <!-- Constraints & risks -->
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Constraints &amp; Risks
              </h3>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li
                  v-if="store.selectedToken.kycRequired"
                  class="flex items-start gap-2"
                >
                  <ExclamationTriangleIcon class="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  KYC verification is required before any transfer
                </li>
                <li
                  v-if="store.selectedToken.complianceStatus === 'partial'"
                  class="flex items-start gap-2"
                >
                  <ExclamationTriangleIcon class="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  Compliance is partially complete – proceed with caution
                </li>
                <li
                  v-if="store.selectedToken.liquidityIndicator === 'low'"
                  class="flex items-start gap-2"
                >
                  <ExclamationTriangleIcon class="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  Low liquidity – expect wider spreads and slower fills
                </li>
                <li
                  v-if="!store.selectedToken.kycRequired && store.selectedToken.complianceStatus === 'compliant' && store.selectedToken.liquidityIndicator !== 'low'"
                  class="flex items-start gap-2"
                >
                  <CheckCircleIcon class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  No major constraints identified
                </li>
              </ul>
            </div>

            <!-- Help link -->
            <div v-if="store.selectedToken.helpUrl" class="mb-6 text-sm">
              <a
                :href="store.selectedToken.helpUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
              >
                <InformationCircleIcon class="w-4 h-4" aria-hidden="true" />
                Learn more &amp; risk information
                <ArrowTopRightOnSquareIcon class="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <!-- CTA -->
            <button
              class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              @click="handleRunSimulation()"
            >
              Run Simulation
            </button>
          </div>
        </section>

        <!-- ── Stage: Simulate ─────────────────────────────────────────────── -->
        <section
          v-else-if="store.stage === 'simulate'"
          aria-label="Pre-action simulation"
        >
          <div class="glass-effect rounded-xl p-8 max-w-3xl mx-auto">
            <!-- Back -->
            <button
              class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
              @click="store.stage = 'evaluate'"
            >
              <ArrowLeftIcon class="w-4 h-4" aria-hidden="true" />
              Back to evaluation
            </button>

            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Simulation</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Review estimated outcomes and constraints before signing.
            </p>

            <!-- Simulation loading -->
            <div
              v-if="store.simulationLoading"
              role="status"
              aria-live="polite"
              aria-label="Running simulation"
              class="py-12 text-center"
            >
              <div class="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" aria-hidden="true"></div>
              <p class="text-gray-600 dark:text-gray-300">Running simulation…</p>
            </div>

            <!-- Simulation error -->
            <div
              v-else-if="store.simulationError"
              role="alert"
              class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6"
            >
              <div class="flex items-start gap-3">
                <ExclamationTriangleIcon class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p class="text-sm font-semibold text-red-700 dark:text-red-300">Simulation failed</p>
                  <p class="text-sm text-red-600 dark:text-red-400 mt-1">{{ store.simulationError }}</p>
                </div>
              </div>
              <button
                class="mt-3 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                @click="handleRunSimulation()"
              >
                Retry simulation
              </button>
            </div>

            <!-- Simulation result -->
            <template v-else-if="store.simulation">
              <!-- Estimated fee -->
              <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Estimated Network Fee</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">{{ store.simulation.estimatedFeeDisplay }}</p>
              </div>

              <!-- Estimated outcome -->
              <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                <p class="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Expected Outcome</p>
                <p class="text-sm text-blue-700 dark:text-blue-200">{{ store.simulation.estimatedOutcome }}</p>
              </div>

              <!-- Constraints -->
              <ul v-if="store.simulation.constraints.length > 0" class="space-y-2 mb-4" role="list" aria-label="Simulation constraints">
                <li
                  v-for="c in store.simulation.constraints"
                  :key="c"
                  class="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300"
                >
                  <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {{ c }}
                </li>
              </ul>

              <!-- Warnings -->
              <ul v-if="store.simulation.warnings.length > 0" class="space-y-2 mb-4" role="list" aria-label="Simulation warnings">
                <li
                  v-for="w in store.simulation.warnings"
                  :key="w"
                  class="flex items-start gap-2 text-sm text-orange-600 dark:text-orange-300"
                >
                  <InformationCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {{ w }}
                </li>
              </ul>

              <!-- Stale warning -->
              <div v-if="store.simulation.isStale" role="alert" class="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 mb-4">
                <ClockIcon class="w-4 h-4" aria-hidden="true" />
                Quote is stale – re-run simulation for fresh estimates
              </div>

              <!-- CTA -->
              <button
                class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                @click="handleProceedToExecute()"
              >
                Review &amp; Submit
              </button>
            </template>
          </div>
        </section>

        <!-- ── Stage: Execute ──────────────────────────────────────────────── -->
        <section
          v-else-if="store.stage === 'execute'"
          aria-label="Execute token action"
        >
          <div class="glass-effect rounded-xl p-8 max-w-3xl mx-auto">
            <button
              class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
              @click="store.stage = 'simulate'"
            >
              <ArrowLeftIcon class="w-4 h-4" aria-hidden="true" />
              Back to simulation
            </button>

            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Execute Action</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Your action will be processed securely by the Biatec backend.
            </p>

            <!-- Auth / backend notice -->
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6 flex items-start gap-3">
              <ShieldCheckIcon class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p class="text-sm font-semibold text-blue-700 dark:text-blue-300">Backend-Secured Transaction</p>
                <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  This action will be executed by our backend service using your authenticated account on
                  <strong>{{ store.selectedToken?.network }}</strong>. No wallet app required.
                </p>
              </div>
            </div>

            <!-- Action error -->
            <div
              v-if="store.actionError"
              role="alert"
              class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6"
            >
              <div class="flex items-start gap-3">
                <ExclamationTriangleIcon class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p class="text-sm font-semibold text-red-700 dark:text-red-300">Action failed</p>
                  <p class="text-sm text-red-600 dark:text-red-400 mt-1">{{ store.actionError }}</p>
                </div>
              </div>
              <button
                class="mt-3 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                @click="store.retryAction()"
              >
                Try again
              </button>
            </div>

            <!-- Submit -->
            <button
              :disabled="store.actionLoading"
              class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
              @click="handleSubmitAction()"
            >
              <div
                v-if="store.actionLoading"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              ></div>
              <span>{{ store.actionLoading ? 'Submitting…' : 'Submit Action' }}</span>
            </button>
          </div>
        </section>

        <!-- ── Stage: Confirm ──────────────────────────────────────────────── -->
        <section
          v-else-if="store.stage === 'confirm'"
          aria-label="Action confirmed"
          aria-live="polite"
        >
          <div class="glass-effect rounded-xl p-12 text-center max-w-xl mx-auto">
            <CheckCircleIcon class="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Action Confirmed!</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-2">
              Your transaction was submitted successfully.
            </p>
            <p v-if="store.actionTxId" class="text-xs text-gray-500 dark:text-gray-400 mb-6 font-mono break-all">
              Tx ID: {{ store.actionTxId }}
            </p>
            <button
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              @click="handleReset()"
            >
              Explore More Opportunities
            </button>
          </div>
        </section>

      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import {
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  IdentificationIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'
import MainLayout from '../components/layout/MainLayout.vue'
import { usePortfolioLaunchpadStore, LAUNCHPAD_STAGES } from '../stores/portfolioLaunchpad'
import type { LaunchpadStage } from '../stores/portfolioLaunchpad'
import {
  trackLaunchpadViewed,
  trackTokenSelected,
  trackSimulationCompleted,
  trackActionSubmitted,
  trackActionConfirmed,
  trackActionFailed,
  resetLaunchpadDispatchGuard,
} from '../utils/launchpadFunnel'

const store = usePortfolioLaunchpadStore()

// ── Stage metadata for progress nav ─────────────────────────────────────────

const stages = LAUNCHPAD_STAGES.map((key, idx) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
  index: idx,
}))

// ── Stage navigation helpers ─────────────────────────────────────────────────

function isStageReachable(key: LaunchpadStage): boolean {
  const idx = LAUNCHPAD_STAGES.indexOf(key)
  return idx <= store.stageIndex
}

function navigateToStage(key: LaunchpadStage): void {
  if (!isStageReachable(key)) return
  // Allow backward navigation but guard forward jumps
  if (key === 'discover') { store.deselectToken(); return }
  if (key === 'evaluate' && store.selectedTokenId) { store.stage = 'evaluate'; return }
  if (key === 'simulate' && store.simulation) { store.stage = 'simulate'; return }
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function stepClasses(key: LaunchpadStage): Record<string, boolean> {
  const active = key === store.stage
  const done = LAUNCHPAD_STAGES.indexOf(key) < store.stageIndex
  return {
    'bg-blue-600 text-white': active,
    'bg-green-600 text-white': done,
    'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400': !active && !done,
    'cursor-not-allowed opacity-50': !isStageReachable(key),
  }
}

function stepBadgeClasses(key: LaunchpadStage): Record<string, boolean> {
  const done = LAUNCHPAD_STAGES.indexOf(key) < store.stageIndex
  return {
    'bg-white/20': key === store.stage || done,
    'bg-gray-200 dark:bg-gray-700': key !== store.stage && !done,
  }
}

function trustScoreClasses(score?: number): string {
  if (score == null) return 'text-gray-400'
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function liquidityClasses(indicator?: string): string {
  switch (indicator) {
    case 'high': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'low': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function liquidityTextClasses(indicator?: string): string {
  switch (indicator) {
    case 'high': return 'text-green-600 dark:text-green-400'
    case 'medium': return 'text-yellow-600 dark:text-yellow-400'
    case 'low': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-500'
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Event handlers ────────────────────────────────────────────────────────────

function handleTokenSelect(tokenId: string): void {
  store.selectToken(tokenId)
  const token = store.selectedToken
  if (token) {
    trackTokenSelected({
      tokenId: token.id,
      tokenSymbol: token.symbol,
      network: token.network ?? '',
      stage: 'evaluate',
    })
  }
}

async function handleRunSimulation(): Promise<void> {
  const t0 = Date.now()
  await store.runSimulation()
  if (store.simulation && !store.simulationError) {
    trackSimulationCompleted({
      tokenId: store.simulation.tokenId,
      estimatedFee: store.simulation.estimatedFee,
      estimatedOutcome: store.simulation.estimatedOutcome,
      durationMs: Date.now() - t0,
    })
  }
}

function handleProceedToExecute(): void {
  store.proceedToExecute()
}

async function handleSubmitAction(): Promise<void> {
  if (!store.selectedToken) return
  const t0 = Date.now()
  trackActionSubmitted({ tokenId: store.selectedToken.id, actionType: store.selectedToken.actionLabel ?? 'explore' })
  await store.submitAction()
  if (store.actionTxId) {
    trackActionConfirmed({ tokenId: store.selectedToken?.id ?? '', txId: store.actionTxId, durationMs: Date.now() - t0 })
  } else if (store.actionError) {
    trackActionFailed({ tokenId: store.selectedToken?.id ?? '', reason: store.actionError })
  }
}

function handleReset(): void {
  store.reset()
  resetLaunchpadDispatchGuard()
  store.fetchTokens()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  resetLaunchpadDispatchGuard()
  await store.fetchTokens()
  trackLaunchpadViewed({ tokenCount: store.tokens.length, source: 'direct' })
})

onUnmounted(() => {
  resetLaunchpadDispatchGuard()
})
</script>
