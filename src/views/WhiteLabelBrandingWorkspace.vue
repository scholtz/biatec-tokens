<template>
  <MainLayout>
    <!-- Skip link (WCAG 2.4.1) -->
    <a
      href="#branding-workspace-main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>

    <div
      id="branding-workspace-main"
      role="region"
      aria-label="White-Label Branding Workspace"
      :data-testid="BRAND_TEST_IDS.WORKSPACE_SHELL"
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    >
      <div class="max-w-5xl mx-auto">

        <!-- ── Page Header ── -->
        <header class="mb-8">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <SwatchIcon class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  :data-testid="BRAND_TEST_IDS.PAGE_HEADING"
                >
                  White-Label Branding
                </h1>
                <p class="text-gray-300 text-sm mt-1">
                  Configure your organisation's brand identity for the regulated tokenization portal.
                  Changes are saved as drafts and must be published to take effect.
                </p>
              </div>
            </div>

            <!-- Publish state badge + last-updated -->
            <div class="flex-shrink-0 flex flex-col items-end gap-2 mt-1">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                :class="publishStateBadgeClass(publishState)"
                :data-testid="BRAND_TEST_IDS.PUBLISH_STATE_BADGE"
                aria-label="Branding publish state"
              >
                {{ buildPublishStateLabel(publishState) }}
              </span>
              <span
                v-if="lastUpdatedLabel"
                class="text-xs text-gray-400"
                :data-testid="BRAND_TEST_IDS.LAST_UPDATED_LABEL"
              >
                Last updated: {{ lastUpdatedLabel }}
              </span>
            </div>
          </div>
        </header>

        <!-- ── Fail-safe banner (shown when config load fails) ── -->
        <div
          v-if="configLoadFailed"
          role="alert"
          :data-testid="BRAND_TEST_IDS.FAILSAFE_BANNER"
          class="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-900/20 p-4"
        >
          <ExclamationTriangleIcon class="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p class="text-sm font-semibold text-amber-300">Branding configuration could not be loaded</p>
            <p class="text-xs text-amber-400 mt-0.5">
              The platform is displaying default Biatec branding. You can configure and publish
              new branding settings below. Compliance-critical UI elements are always preserved.
            </p>
          </div>
        </div>

        <!-- ── Loading state ── -->
        <div
          v-if="isLoading"
          class="flex items-center justify-center py-20"
          role="status"
          aria-label="Loading branding configuration"
          aria-live="polite"
          data-testid="branding-loading-state"
        >
          <div class="text-center">
            <ArrowPathIcon class="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" aria-hidden="true" />
            <p class="text-gray-300 text-sm">Loading branding configuration…</p>
          </div>
        </div>

        <template v-else>
          <!-- ── Validation errors ── -->
          <div
            v-if="validationErrors.length > 0"
            role="alert"
            :data-testid="BRAND_TEST_IDS.VALIDATION_ERRORS"
            class="mb-6 rounded-lg border border-red-500/50 bg-red-900/20 p-4"
          >
            <p class="text-sm font-semibold text-red-300 mb-2">Please fix the following issues before publishing:</p>
            <ul class="list-disc list-inside space-y-1">
              <li
                v-for="(err, idx) in validationErrors"
                :key="idx"
                class="text-xs text-red-400"
              >
                {{ err.message }}
              </li>
            </ul>
          </div>

          <!-- ── Contrast warnings ── -->
          <div
            v-if="contrastWarning"
            role="status"
            :data-testid="BRAND_TEST_IDS.CONTRAST_WARNING"
            class="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-900/20 p-4 flex items-start gap-3"
          >
            <ExclamationTriangleIcon class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p class="text-xs text-yellow-300">
              <span class="font-semibold">Accessibility warning:</span>
              The selected accent colour may not meet WCAG AA contrast requirements (4.5:1 against white).
              Publication is permitted but we strongly recommend choosing a darker shade to ensure readability.
            </p>
          </div>

          <!-- ─────────────────────────────────────────────────────────────
               SECTION 1 — Brand Identity
          ───────────────────────────────────────────────────────────── -->
          <section
            class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-6"
            aria-labelledby="section-identity-heading"
            data-testid="brand-section-identity"
          >
            <h2
              id="section-identity-heading"
              class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            >
              <BuildingOfficeIcon class="w-5 h-5 text-violet-400" aria-hidden="true" />
              Organisation Identity
            </h2>

            <div class="grid gap-4 sm:grid-cols-2">
              <!-- Organisation name -->
              <div>
                <label
                  for="brand-org-name"
                  class="block text-xs font-medium text-gray-300 mb-1"
                >
                  Organisation Display Name <span class="text-red-400" aria-hidden="true">*</span>
                  <span class="sr-only">(required)</span>
                </label>
                <input
                  id="brand-org-name"
                  v-model="draftPrimitives.organizationName"
                  type="text"
                  :maxlength="BRAND_MAX_LENGTHS.organizationName"
                  :data-testid="BRAND_TEST_IDS.ORG_NAME_INPUT"
                  class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. Meridian Capital"
                  aria-required="true"
                  @input="markDirty"
                />
                <p class="mt-1 text-xs text-gray-500 text-right">
                  {{ draftPrimitives.organizationName.length }}/{{ BRAND_MAX_LENGTHS.organizationName }}
                </p>
              </div>

              <!-- Product label -->
              <div>
                <label
                  for="brand-product-label"
                  class="block text-xs font-medium text-gray-300 mb-1"
                >
                  Product Label <span class="text-red-400" aria-hidden="true">*</span>
                  <span class="sr-only">(required)</span>
                </label>
                <input
                  id="brand-product-label"
                  v-model="draftPrimitives.productLabel"
                  type="text"
                  :maxlength="BRAND_MAX_LENGTHS.productLabel"
                  :data-testid="BRAND_TEST_IDS.PRODUCT_LABEL_INPUT"
                  class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. Meridian Tokenization Portal"
                  aria-required="true"
                  @input="markDirty"
                />
                <p class="mt-1 text-xs text-gray-500 text-right">
                  {{ draftPrimitives.productLabel.length }}/{{ BRAND_MAX_LENGTHS.productLabel }}
                </p>
              </div>

              <!-- Logo URL -->
              <div>
                <label
                  for="brand-logo-url"
                  class="block text-xs font-medium text-gray-300 mb-1"
                >
                  Logo URL <span class="text-gray-500 font-normal">(optional, must be HTTPS)</span>
                </label>
                <input
                  id="brand-logo-url"
                  v-model="logoUrlInput"
                  type="url"
                  :data-testid="BRAND_TEST_IDS.LOGO_URL_INPUT"
                  class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="https://cdn.example.com/logo.svg"
                  @input="markDirty"
                />
              </div>

              <!-- Favicon URL -->
              <div>
                <label
                  for="brand-favicon-url"
                  class="block text-xs font-medium text-gray-300 mb-1"
                >
                  Favicon URL <span class="text-gray-500 font-normal">(optional, must be HTTPS)</span>
                </label>
                <input
                  id="brand-favicon-url"
                  v-model="faviconUrlInput"
                  type="url"
                  :data-testid="BRAND_TEST_IDS.FAVICON_URL_INPUT"
                  class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="https://cdn.example.com/favicon.ico"
                  @input="markDirty"
                />
              </div>
            </div>
          </section>

          <!-- ─────────────────────────────────────────────────────────────
               SECTION 2 — Brand Colours
          ───────────────────────────────────────────────────────────── -->
          <section
            class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-6"
            aria-labelledby="section-colors-heading"
            data-testid="brand-section-colors"
          >
            <h2
              id="section-colors-heading"
              class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            >
              <SwatchIcon class="w-5 h-5 text-violet-400" aria-hidden="true" />
              Brand Colours
            </h2>
            <p class="text-xs text-gray-400 mb-4">
              Colours must meet WCAG AA contrast requirements. Compliance-critical UI
              elements (warnings, evidence states, risk indicators) always use their
              dedicated accessibility-safe palettes regardless of brand colour settings.
            </p>

            <div class="grid gap-4 sm:grid-cols-2">
              <!-- Accent color -->
              <div>
                <label
                  for="brand-accent-color"
                  class="block text-xs font-medium text-gray-300 mb-1"
                >
                  Accent Colour <span class="text-red-400" aria-hidden="true">*</span>
                  <span class="sr-only">(required, 6-digit hex)</span>
                </label>
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded border border-gray-600 flex-shrink-0"
                    :style="{ backgroundColor: draftPrimitives.accentColor }"
                    aria-hidden="true"
                  ></div>
                  <input
                    id="brand-accent-color"
                    v-model="draftPrimitives.accentColor"
                    type="text"
                    maxlength="7"
                    :data-testid="BRAND_TEST_IDS.ACCENT_COLOR_INPUT"
                    class="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                    placeholder="#2563EB"
                    aria-required="true"
                    @input="markDirty"
                  />
                </div>
              </div>

              <!-- Secondary color -->
              <div>
                <label
                  for="brand-secondary-color"
                  class="block text-xs font-medium text-gray-300 mb-1"
                >
                  Secondary Colour <span class="text-red-400" aria-hidden="true">*</span>
                  <span class="sr-only">(required, 6-digit hex)</span>
                </label>
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded border border-gray-600 flex-shrink-0"
                    :style="{ backgroundColor: draftPrimitives.secondaryColor }"
                    aria-hidden="true"
                  ></div>
                  <input
                    id="brand-secondary-color"
                    v-model="draftPrimitives.secondaryColor"
                    type="text"
                    maxlength="7"
                    :data-testid="BRAND_TEST_IDS.SECONDARY_COLOR_INPUT"
                    class="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                    placeholder="#4F46E5"
                    aria-required="true"
                    @input="markDirty"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- ─────────────────────────────────────────────────────────────
               SECTION 3 — Support & Copy
          ───────────────────────────────────────────────────────────── -->
          <section
            class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-6"
            aria-labelledby="section-copy-heading"
            data-testid="brand-section-copy"
          >
            <h2
              id="section-copy-heading"
              class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            >
              <ChatBubbleLeftEllipsisIcon class="w-5 h-5 text-violet-400" aria-hidden="true" />
              Support &amp; Custom Copy
            </h2>
            <p class="text-xs text-gray-400 mb-4">
              All copy fields are plain text only. HTML, scripts, and markup are not permitted
              and will be stripped automatically. Compliance-required legal notices and
              regulatory disclaimers are always displayed in full regardless of copy settings.
            </p>

            <div class="grid gap-4 sm:grid-cols-2">
              <!-- Support email -->
              <div>
                <label for="brand-support-email" class="block text-xs font-medium text-gray-300 mb-1">
                  Support Email <span class="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  id="brand-support-email"
                  v-model="supportEmailInput"
                  type="email"
                  :data-testid="BRAND_TEST_IDS.SUPPORT_EMAIL_INPUT"
                  class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="support@yourcompany.com"
                  @input="markDirty"
                />
              </div>

              <!-- Support URL -->
              <div>
                <label for="brand-support-url" class="block text-xs font-medium text-gray-300 mb-1">
                  Support URL <span class="text-gray-500 font-normal">(optional, must be HTTPS)</span>
                </label>
                <input
                  id="brand-support-url"
                  v-model="supportUrlInput"
                  type="url"
                  :data-testid="BRAND_TEST_IDS.SUPPORT_URL_INPUT"
                  class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="https://help.yourcompany.com"
                  @input="markDirty"
                />
              </div>

              <!-- Welcome heading -->
              <div class="sm:col-span-2">
                <label for="brand-welcome-heading" class="block text-xs font-medium text-gray-300 mb-1">
                  Welcome Heading <span class="text-gray-500 font-normal">(optional, max {{ BRAND_MAX_LENGTHS.welcomeHeading }} chars)</span>
                </label>
                <input
                  id="brand-welcome-heading"
                  v-model="welcomeHeadingInput"
                  type="text"
                  :maxlength="BRAND_MAX_LENGTHS.welcomeHeading"
                  :data-testid="BRAND_TEST_IDS.WELCOME_HEADING_INPUT"
                  class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Welcome to the Meridian Capital tokenization portal"
                  @input="markDirty"
                />
                <p class="mt-1 text-xs text-gray-500 text-right">
                  {{ (welcomeHeadingInput || '').length }}/{{ BRAND_MAX_LENGTHS.welcomeHeading }}
                </p>
              </div>

              <!-- Compliance context note -->
              <div class="sm:col-span-2">
                <label for="brand-compliance-note" class="block text-xs font-medium text-gray-300 mb-1">
                  Organisation Compliance Context Note <span class="text-gray-500 font-normal">(optional, max {{ BRAND_MAX_LENGTHS.complianceContextNote }} chars)</span>
                </label>
                <textarea
                  id="brand-compliance-note"
                  v-model="complianceNoteInput"
                  :maxlength="BRAND_MAX_LENGTHS.complianceContextNote"
                  :data-testid="BRAND_TEST_IDS.COMPLIANCE_NOTE_INPUT"
                  rows="3"
                  class="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="This platform is operated by Meridian Capital under applicable AML and securities regulations."
                  @input="markDirty"
                ></textarea>
                <p class="mt-1 text-xs text-gray-500 text-right">
                  {{ (complianceNoteInput || '').length }}/{{ BRAND_MAX_LENGTHS.complianceContextNote }}
                </p>
              </div>
            </div>
          </section>

          <!-- ─────────────────────────────────────────────────────────────
               SECTION 4 — Preview
          ───────────────────────────────────────────────────────────── -->
          <section
            class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-6"
            aria-labelledby="section-preview-heading"
            :data-testid="BRAND_TEST_IDS.PREVIEW_PANEL"
          >
            <h2
              id="section-preview-heading"
              class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            >
              <EyeIcon class="w-5 h-5 text-violet-400" aria-hidden="true" />
              Live Preview
            </h2>
            <p class="text-xs text-gray-400 mb-4">
              Preview how your branding configuration will appear in key surfaces.
              Compliance-critical areas (warnings, evidence states, release blockers)
              always use accessibility-safe colours regardless of brand settings.
            </p>

            <!-- Preview tabs -->
            <div class="flex gap-2 mb-4 flex-wrap" role="tablist" aria-label="Preview surfaces">
              <button
                v-for="tab in previewTabs"
                :key="tab.id"
                role="tab"
                :aria-selected="activePreviewTab === tab.id"
                :aria-controls="`preview-panel-${tab.id}`"
                :id="`preview-tab-${tab.id}`"
                class="px-3 py-1.5 rounded text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                :class="activePreviewTab === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'"
                @click="activePreviewTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Preview: Header -->
            <div
              v-show="activePreviewTab === 'header'"
              :id="`preview-panel-header`"
              role="tabpanel"
              aria-labelledby="preview-tab-header"
              :data-testid="BRAND_TEST_IDS.PREVIEW_HEADER"
              class="rounded-lg border border-gray-600 overflow-hidden"
            >
              <div
                class="px-6 py-3 flex items-center gap-3"
                :style="{ backgroundColor: draftPrimitives.accentColor }"
                aria-label="Brand header preview"
              >
                <div v-if="draftPrimitives.logoUrl" class="flex-shrink-0">
                  <img
                    :src="draftPrimitives.logoUrl"
                    alt="Organisation logo preview"
                    class="h-8 w-auto object-contain"
                    @error="handleLogoError"
                  />
                </div>
                <div v-else class="flex-shrink-0 w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                  <BuildingOfficeIcon class="w-5 h-5 text-white/70" aria-hidden="true" />
                </div>
                <span class="font-bold text-white text-sm">{{ draftPrimitives.organizationName || 'Your Organisation' }}</span>
                <span class="text-white/70 text-xs ml-auto">{{ draftPrimitives.productLabel || 'Tokenization Portal' }}</span>
              </div>
              <div class="bg-gray-900 px-6 py-4">
                <p class="text-xs text-gray-400">Navigation and main content area would appear here.</p>
              </div>
            </div>

            <!-- Preview: Login -->
            <div
              v-show="activePreviewTab === 'login'"
              :id="`preview-panel-login`"
              role="tabpanel"
              aria-labelledby="preview-tab-login"
              :data-testid="BRAND_TEST_IDS.PREVIEW_LOGIN"
              class="rounded-lg border border-gray-600 bg-gray-900 p-6"
            >
              <div class="max-w-sm mx-auto text-center">
                <div
                  class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  :style="{ backgroundColor: draftPrimitives.accentColor }"
                  aria-hidden="true"
                >
                  <BuildingOfficeIcon class="w-6 h-6 text-white" />
                </div>
                <h3 class="text-lg font-bold text-white mb-1">
                  {{ draftPrimitives.welcomeHeading || ('Sign in to ' + (draftPrimitives.organizationName || 'your portal')) }}
                </h3>
                <p class="text-xs text-gray-400 mb-4">Secure email/password authentication — no wallet required.</p>
                <div class="bg-gray-800 rounded-lg p-4 text-left space-y-3">
                  <div>
                    <label class="block text-xs text-gray-300 mb-1">Email address</label>
                    <div class="h-8 rounded bg-gray-700 border border-gray-600"></div>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-300 mb-1">Password</label>
                    <div class="h-8 rounded bg-gray-700 border border-gray-600"></div>
                  </div>
                  <div
                    class="h-8 rounded flex items-center justify-center text-xs font-semibold text-white"
                    :style="{ backgroundColor: draftPrimitives.accentColor }"
                  >
                    Sign In
                  </div>
                </div>
                <p v-if="draftPrimitives.supportEmail || draftPrimitives.supportUrl" class="mt-3 text-xs text-gray-400">
                  Need help?
                  <span v-if="draftPrimitives.supportEmail" class="text-violet-400">{{ draftPrimitives.supportEmail }}</span>
                  <span v-if="draftPrimitives.supportUrl" class="text-violet-400 ml-1">Support portal</span>
                </p>
              </div>
            </div>

            <!-- Preview: Dashboard Shell -->
            <div
              v-show="activePreviewTab === 'dashboard'"
              :id="`preview-panel-dashboard`"
              role="tabpanel"
              aria-labelledby="preview-tab-dashboard"
              :data-testid="BRAND_TEST_IDS.PREVIEW_DASHBOARD_SHELL"
              class="rounded-lg border border-gray-600 overflow-hidden"
            >
              <div
                class="px-6 py-2 flex items-center gap-2"
                :style="{ backgroundColor: draftPrimitives.accentColor }"
              >
                <span class="font-semibold text-white text-sm">{{ draftPrimitives.organizationName || 'Your Organisation' }}</span>
                <span class="text-white/60 text-xs">|</span>
                <span class="text-white/80 text-xs">{{ draftPrimitives.productLabel || 'Portal' }}</span>
              </div>
              <div class="bg-gray-900 flex" style="min-height:120px">
                <div
                  class="w-36 bg-gray-800 border-r border-gray-700 p-3"
                  :style="{ borderLeftColor: draftPrimitives.secondaryColor, borderLeftWidth: '3px' }"
                >
                  <div class="space-y-1">
                    <div class="h-5 rounded bg-gray-700 mb-2"></div>
                    <div class="h-4 rounded bg-gray-700/50 w-3/4"></div>
                    <div class="h-4 rounded bg-gray-700/50 w-2/3"></div>
                    <div class="h-4 rounded bg-gray-700/50 w-3/4"></div>
                  </div>
                </div>
                <div class="flex-1 p-4">
                  <div class="h-4 rounded bg-gray-700 w-1/2 mb-3"></div>
                  <div class="grid grid-cols-3 gap-2">
                    <div class="h-16 rounded bg-gray-800 border border-gray-700"></div>
                    <div class="h-16 rounded bg-gray-800 border border-gray-700"></div>
                    <div class="h-16 rounded bg-gray-800 border border-gray-700"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview: Compliance Surface -->
            <div
              v-show="activePreviewTab === 'compliance'"
              :id="`preview-panel-compliance`"
              role="tabpanel"
              aria-labelledby="preview-tab-compliance"
              :data-testid="BRAND_TEST_IDS.PREVIEW_COMPLIANCE_SURFACE"
              class="rounded-lg border border-gray-600 bg-gray-900 p-4"
            >
              <div class="mb-3 flex items-center gap-2">
                <div
                  class="w-6 h-6 rounded flex items-center justify-center"
                  :style="{ backgroundColor: draftPrimitives.accentColor }"
                  aria-hidden="true"
                >
                  <ShieldCheckIcon class="w-4 h-4 text-white" />
                </div>
                <span class="text-sm font-semibold text-white">Compliance Status</span>
              </div>
              <!-- Compliance-critical areas always retain their own palette -->
              <div class="rounded bg-red-900/40 border border-red-500/50 p-3 mb-2 flex items-start gap-2">
                <ExclamationTriangleIcon class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p class="text-xs text-red-300">
                  <span class="font-semibold">Compliance blocker:</span>
                  KYC configuration incomplete — this is always displayed regardless of brand colours.
                </p>
              </div>
              <div class="rounded bg-amber-900/30 border border-amber-500/40 p-3 flex items-start gap-2">
                <ExclamationTriangleIcon class="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p class="text-xs text-amber-300">
                  <span class="font-semibold">Evidence warning:</span>
                  Release evidence review pending — compliance colours are not overridable.
                </p>
              </div>
              <p v-if="draftPrimitives.complianceContextNote" class="mt-3 text-xs text-gray-300 italic border-t border-gray-700 pt-2">
                {{ draftPrimitives.complianceContextNote }}
              </p>
            </div>
          </section>

          <!-- ─────────────────────────────────────────────────────────────
               SECTION 5 — Change History
          ───────────────────────────────────────────────────────────── -->
          <section
            v-if="changeHistory.length > 0"
            class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-6"
            aria-labelledby="section-history-heading"
            :data-testid="BRAND_TEST_IDS.CHANGE_HISTORY_SECTION"
          >
            <h2
              id="section-history-heading"
              class="text-lg font-semibold text-white mb-4 flex items-center gap-2"
            >
              <ClockIcon class="w-5 h-5 text-violet-400" aria-hidden="true" />
              Change History
            </h2>
            <ul class="space-y-2">
              <li
                v-for="(entry, idx) in changeHistory"
                :key="idx"
                class="flex items-center gap-3 text-xs text-gray-300"
                :data-testid="`brand-history-entry-${idx}`"
              >
                <span class="text-gray-500">{{ entry.timestamp }}</span>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="entry.action === 'published' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'"
                >
                  {{ entry.action === 'published' ? 'Published' : 'Saved draft' }}
                </span>
                <span>{{ entry.description }}</span>
              </li>
            </ul>
          </section>

          <!-- ─────────────────────────────────────────────────────────────
               SECTION 6 — Actions
          ───────────────────────────────────────────────────────────── -->
          <div class="flex flex-wrap items-center gap-3 mt-2">
            <button
              :disabled="!isDirty || isSaving"
              :data-testid="BRAND_TEST_IDS.SAVE_DRAFT_BUTTON"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700 text-white hover:bg-gray-600 disabled:hover:bg-gray-700"
              aria-label="Save changes as draft"
              @click="saveDraft"
            >
              <ArrowPathIcon v-if="isSaving" class="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{{ isSaving ? 'Saving…' : 'Save Draft' }}</span>
            </button>

            <button
              :disabled="validationErrors.length > 0 || isPublishing"
              :data-testid="BRAND_TEST_IDS.PUBLISH_BUTTON"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed bg-violet-600 text-white hover:bg-violet-500 disabled:hover:bg-violet-600"
              aria-label="Publish branding configuration"
              @click="publishConfig"
            >
              <ArrowUpTrayIcon v-if="!isPublishing" class="w-4 h-4" aria-hidden="true" />
              <ArrowPathIcon v-if="isPublishing" class="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{{ isPublishing ? 'Publishing…' : 'Publish' }}</span>
            </button>

            <button
              v-if="isDirty"
              :data-testid="BRAND_TEST_IDS.DISCARD_BUTTON"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              aria-label="Discard unsaved changes and revert to last saved state"
              @click="discardChanges"
            >
              Discard Changes
            </button>
          </div>

        </template>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainLayout from '../components/layout/MainLayout.vue';
import {
  BRAND_TEST_IDS,
  BRAND_MAX_LENGTHS,
  DEFAULT_BRAND_CONFIG,
  type BrandPrimitives,
  type BrandPublishState,
  type BrandConfig,
  validateBrandConfig,
  buildPublishStateLabel,
  publishStateBadgeClass,
  brandConfigFromApi,
  meetsContrastRequirement,
} from '../utils/whiteLabelBranding';
import {
  SwatchIcon,
  BuildingOfficeIcon,
  EyeIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const isLoading = ref(true);
const isSaving = ref(false);
const isPublishing = ref(false);
const isDirty = ref(false);
const configLoadFailed = ref(false);

const publishState = ref<BrandPublishState>('draft');
const lastUpdatedLabel = ref<string | null>(null);

// Editable draft primitives (deep copy from loaded config)
const draftPrimitives = ref<BrandPrimitives>({ ...DEFAULT_BRAND_CONFIG });

// Nullable inputs wired via separate refs to avoid type coercion issues
const logoUrlInput = ref('');
const faviconUrlInput = ref('');
const supportEmailInput = ref('');
const supportUrlInput = ref('');
const welcomeHeadingInput = ref('');
const complianceNoteInput = ref('');

/** Snapshot of the last saved/loaded state used for discard. */
let savedPrimitivesSnapshot: BrandPrimitives = { ...DEFAULT_BRAND_CONFIG };

const activePreviewTab = ref<'header' | 'login' | 'dashboard' | 'compliance'>('header');

const previewTabs: Array<{ id: 'header' | 'login' | 'dashboard' | 'compliance'; label: string }> = [
  { id: 'header', label: 'Header' },
  { id: 'login', label: 'Login' },
  { id: 'dashboard', label: 'Dashboard Shell' },
  { id: 'compliance', label: 'Compliance Surface' },
];

interface ChangeHistoryEntry {
  timestamp: string;
  action: 'draft' | 'published';
  description: string;
}
const changeHistory = ref<ChangeHistoryEntry[]>([]);

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const validationErrors = computed(() => {
  const result = validateBrandConfig(buildCurrentPrimitives());
  return result.errors;
});

const contrastWarning = computed(() => {
  const current = buildCurrentPrimitives();
  return !meetsContrastRequirement(current.accentColor);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCurrentPrimitives(): BrandPrimitives {
  return {
    ...draftPrimitives.value,
    logoUrl: logoUrlInput.value.trim() || null,
    faviconUrl: faviconUrlInput.value.trim() || null,
    supportEmail: supportEmailInput.value.trim() || null,
    supportUrl: supportUrlInput.value.trim() || null,
    welcomeHeading: welcomeHeadingInput.value.trim() || null,
    complianceContextNote: complianceNoteInput.value.trim() || null,
  };
}

function applyConfig(config: BrandConfig): void {
  const p = config.primitives;
  draftPrimitives.value = {
    organizationName: p.organizationName,
    productLabel: p.productLabel,
    logoUrl: p.logoUrl,
    faviconUrl: p.faviconUrl,
    accentColor: p.accentColor,
    secondaryColor: p.secondaryColor,
    supportEmail: p.supportEmail,
    supportUrl: p.supportUrl,
    welcomeHeading: p.welcomeHeading,
    complianceContextNote: p.complianceContextNote,
  };
  logoUrlInput.value = p.logoUrl ?? '';
  faviconUrlInput.value = p.faviconUrl ?? '';
  supportEmailInput.value = p.supportEmail ?? '';
  supportUrlInput.value = p.supportUrl ?? '';
  welcomeHeadingInput.value = p.welcomeHeading ?? '';
  complianceNoteInput.value = p.complianceContextNote ?? '';

  publishState.value = config.publishState;
  lastUpdatedLabel.value = config.lastUpdatedAt
    ? formatDateLabel(config.lastUpdatedAt)
    : null;

  savedPrimitivesSnapshot = { ...draftPrimitives.value };
  isDirty.value = false;
}

function formatDateLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function markDirty(): void {
  isDirty.value = true;
  if (publishState.value === 'published') {
    publishState.value = 'draft';
  }
}

function handleLogoError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(async () => {
  isLoading.value = true;
  configLoadFailed.value = false;
  try {
    // Attempt to fetch tenant branding configuration from backend.
    // Falls back safely to DEFAULT_BRAND_CONFIG on any failure.
    const raw = await fetchBrandingConfig();
    const config = brandConfigFromApi(raw);
    applyConfig(config);
  } catch {
    configLoadFailed.value = true;
    applyConfig(brandConfigFromApi(null));
  } finally {
    isLoading.value = false;
  }
});

// ---------------------------------------------------------------------------
// API / Actions (stub implementations — to be wired to real backend)
// ---------------------------------------------------------------------------

async function fetchBrandingConfig(): Promise<unknown> {
  // In production this would call the backend API.
  // For now, return null to trigger the graceful fallback path.
  return null;
}

async function saveDraft(): Promise<void> {
  if (isSaving.value || !isDirty.value) return;
  isSaving.value = true;
  try {
    const primitives = buildCurrentPrimitives();
    // Persist to backend (stub — always resolves)
    await persistBrandConfig({ primitives, action: 'draft' });
    savedPrimitivesSnapshot = { ...primitives };
    isDirty.value = false;
    publishState.value = 'draft';
    lastUpdatedLabel.value = formatDateLabel(new Date().toISOString());
    changeHistory.value.unshift({
      timestamp: lastUpdatedLabel.value ?? '',
      action: 'draft',
      description: `Draft saved for "${primitives.organizationName}"`,
    });
  } finally {
    isSaving.value = false;
  }
}

async function publishConfig(): Promise<void> {
  if (isPublishing.value || validationErrors.value.length > 0) return;
  isPublishing.value = true;
  try {
    const primitives = buildCurrentPrimitives();
    await persistBrandConfig({ primitives, action: 'published' });
    savedPrimitivesSnapshot = { ...primitives };
    isDirty.value = false;
    publishState.value = 'published';
    lastUpdatedLabel.value = formatDateLabel(new Date().toISOString());
    changeHistory.value.unshift({
      timestamp: lastUpdatedLabel.value ?? '',
      action: 'published',
      description: `Configuration published for "${primitives.organizationName}"`,
    });
  } finally {
    isPublishing.value = false;
  }
}

function discardChanges(): void {
  const snap = savedPrimitivesSnapshot;
  draftPrimitives.value = { ...snap };
  logoUrlInput.value = snap.logoUrl ?? '';
  faviconUrlInput.value = snap.faviconUrl ?? '';
  supportEmailInput.value = snap.supportEmail ?? '';
  supportUrlInput.value = snap.supportUrl ?? '';
  welcomeHeadingInput.value = snap.welcomeHeading ?? '';
  complianceNoteInput.value = snap.complianceContextNote ?? '';
  isDirty.value = false;
  publishState.value = 'draft';
}

async function persistBrandConfig(_payload: { primitives: BrandPrimitives; action: string }): Promise<void> {
  // Stub — real implementation sends to backend API
  await new Promise<void>((resolve) => setTimeout(resolve, 100));
}

// Expose for tests
defineExpose({ saveDraft, publishConfig, discardChanges, markDirty, buildCurrentPrimitives });
</script>
