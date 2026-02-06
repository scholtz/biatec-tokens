<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <!-- Wizard Container with Solid Background -->
      <div class="max-w-4xl mx-auto glass-effect rounded-2xl p-8 shadow-2xl border border-white/10">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Create New Token</h1>
          <p class="text-gray-600 dark:text-gray-300 text-lg">Choose a template or token standard and deploy in seconds</p>
        </div>

        <!-- Sticky Validation Error Banner -->
        <div 
          v-if="!validationResult.isValid && validationError" 
          role="alert"
          class="sticky top-4 z-50 mb-8 p-4 bg-red-500 dark:bg-red-600 border border-red-600 dark:border-red-700 rounded-lg shadow-lg animate-shake"
        >
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-white text-xl mt-0.5"></i>
            <div class="flex-1">
              <p class="text-sm font-semibold text-white mb-2">Please fix the following errors:</p>
              <ul class="space-y-1">
                <li v-for="error in validationResult.errors" :key="error.field" class="text-sm text-white">
                  • {{ error.message }}
                </li>
              </ul>
            </div>
            <button 
              @click="dismissValidationError" 
              class="text-white hover:text-red-200 transition-colors"
              aria-label="Dismiss error"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>

        <!-- Wallet & Network Panel (NEW) -->
        <div class="mb-8">
          <WalletNetworkPanel 
            @connect-wallet="handleConnectWallet"
            @disconnect-wallet="handleDisconnectWallet"
            @network-switched="handleNetworkSwitched"
          />
        </div>

        <!-- Network Selection (New) -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Select Network</h2>
            <span class="text-sm text-gray-600 dark:text-gray-400">Choose your deployment target</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button
              v-for="network in tokenStore.networkGuidance"
              :key="network.name"
              @click="selectNetwork(network.name)"
              :class="[
                'p-6 rounded-xl border-2 transition-all duration-200 text-left',
                selectedNetwork === network.name ? 'border-biatec-accent bg-biatec-accent/10' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
              ]"
            >
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-semibold text-gray-900 dark:text-white text-lg">{{ network.displayName }}</h3>
                <i class="pi pi-check-circle text-biatec-accent" v-if="selectedNetwork === network.name"></i>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{{ network.description }}</p>
              <div class="space-y-2 text-xs">
                <div class="flex items-center gap-2">
                  <i class="pi pi-bolt text-blue-400"></i>
                  <span class="text-gray-700 dark:text-gray-300">Creation: {{ network.fees.creation }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-send text-green-400"></i>
                  <span class="text-gray-700 dark:text-gray-300">Transaction: {{ network.fees.transaction }}</span>
                </div>
              </div>
            </button>
          </div>

          <!-- Network-Specific Guidance -->
          <div v-if="selectedNetwork && currentNetworkGuidance" class="mt-6 p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <div class="space-y-4">
              <div>
                <h4 class="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  Fee Structure
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ currentNetworkGuidance.fees.description }}</p>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <i class="pi pi-cloud"></i>
                  Metadata Hosting
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{{ currentNetworkGuidance.metadataHosting.description }}</p>
                <div class="flex flex-wrap gap-2">
                  <span v-for="provider in currentNetworkGuidance.metadataHosting.recommended" :key="provider" class="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                    {{ provider }}
                  </span>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <i class="pi pi-shield-check"></i>
                  MICA Compliance
                </h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{{ currentNetworkGuidance.compliance.micaRelevance }}</p>
                <ul class="space-y-1 ml-4">
                  <li v-for="(consideration, idx) in currentNetworkGuidance.compliance.considerations" :key="idx" class="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <i class="pi pi-check text-green-500 mt-0.5"></i>
                    <span>{{ consideration }}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                  <i class="pi pi-star"></i>
                  Best Use Cases
                </h4>
                <div class="flex flex-wrap gap-2">
                  <span v-for="useCase in currentNetworkGuidance.bestFor" :key="useCase" class="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                    {{ useCase }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compliance Checklist (New) -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <i class="pi pi-shield-check text-biatec-accent"></i>
              Compliance Checklist
            </h2>
            <button
              @click="showComplianceChecklist = !showComplianceChecklist"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                showComplianceChecklist ? 'bg-biatec-accent text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
              ]"
            >
              <i :class="showComplianceChecklist ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              {{ showComplianceChecklist ? "Hide" : "Show" }} Checklist
            </button>
          </div>

          <div v-if="!showComplianceChecklist" class="text-center py-8">
            <i class="pi pi-shield-check text-5xl text-biatec-accent/50 mb-4"></i>
            <p class="text-gray-700 dark:text-gray-300 mb-2">MICA-compliant token launch preparation</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Complete {{ complianceStore.metrics.completedChecks }} of {{ complianceStore.metrics.totalChecks }} compliance items ({{ complianceStore.metrics.completionPercentage }}% complete)
            </p>
            <button @click="showComplianceChecklist = true" class="btn-primary px-6 py-2 rounded-lg text-gray-900 dark:text-white font-semibold inline-flex items-center gap-2">
              <i class="pi pi-check-square"></i>
              Open Compliance Checklist
            </button>
          </div>

          <ComplianceChecklist v-if="showComplianceChecklist" />
        </div>

        <!-- Competitor Parity Checklist (NEW) -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <i class="pi pi-chart-bar text-purple-400"></i>
              Feature Parity Tracker
            </h2>
            <button
              @click="showCompetitorParity = !showCompetitorParity"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                showCompetitorParity ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
              ]"
            >
              <i :class="showCompetitorParity ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              {{ showCompetitorParity ? "Hide" : "Show" }} Parity Checklist
            </button>
          </div>

          <div v-if="!showCompetitorParity" class="text-center py-8">
            <i class="pi pi-chart-bar text-5xl text-purple-400/50 mb-4"></i>
            <p class="text-gray-700 dark:text-gray-300 mb-2">Track feature parity with leading Algorand tools</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Ensure Biatec Tokens stays competitive with Pera Wallet, Defly, and Folks Finance</p>
            <button @click="showCompetitorParity = true" class="bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg text-white font-semibold inline-flex items-center gap-2 transition-all">
              <i class="pi pi-chart-bar"></i>
              Open Parity Tracker
            </button>
          </div>

          <CompetitorParityChecklist v-if="showCompetitorParity" />
        </div>

        <!-- RWA Compliance Presets (NEW) -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <RwaPresetSelector @apply-preset="applyTemplate" />
        </div>

        <!-- Wallet Attestation (NEW - Optional) -->
        <div class="mb-8">
          <WalletAttestationForm v-model="tokenForm.attestations" v-model:enabled="tokenForm.attestationEnabled" />
        </div>

        <!-- MICA Compliance Metadata (NEW - For ARC-200) -->
        <div class="mb-8">
          <MicaComplianceForm
            v-model="tokenForm.complianceMetadata"
            v-model:enabled="tokenForm.complianceMetadataEnabled"
            v-model:valid="tokenForm.complianceMetadataValid"
            :required="selectedStandard === 'ARC200'"
          />
        </div>

        <!-- Template Selection (New Step) -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Quick Start with Standard Templates</h2>
            <span class="text-sm text-gray-600 dark:text-gray-400">General-purpose token templates</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <button
              v-for="template in tokenStore.standardTokenTemplates"
              :key="template.id"
              @click="applyTemplate(template.id)"
              :class="[
                'p-5 rounded-xl border-2 transition-all duration-200 text-left',
                selectedTemplate === template.id ? 'border-biatec-accent bg-biatec-accent/10' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
              ]"
            >
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-semibold text-gray-900 dark:text-white text-base">{{ template.name }}</h3>
                <span v-if="template.micaCompliant" class="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg flex-shrink-0 ml-2" title="MICA Compliant">
                  <i class="pi pi-shield-check mr-1"></i>MICA
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ template.description }}</p>
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{{ template.standard }}</span>
                <span class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">{{ template.network }}</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400"><strong>Use cases:</strong> {{ template.useCases.slice(0, 2).join(", ") }}</div>
            </button>
          </div>
          <div v-if="selectedTemplate" class="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div class="flex items-start space-x-3">
              <i class="pi pi-info-circle text-blue-400 mt-1"></i>
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-blue-400 mb-2">Template Guidance</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {{ currentTemplate?.guidance }}
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-400 border-t border-blue-500/20 pt-2 mt-2">
                  <strong>Compliance Note:</strong>
                  {{ currentTemplate?.compliance }}
                </p>
              </div>
            </div>
            <button @click="clearTemplate" class="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors">Clear template and customize manually</button>
          </div>
        </div>

        <!-- Token Standard Selection -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Or Select Token Standard Manually</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              v-for="standard in filteredTokenStandards"
              :key="standard.name"
              @click="selectStandard(standard.name)"
              :class="[
                'p-6 rounded-xl border-2 transition-all duration-200 text-left',
                selectedStandard === standard.name ? 'border-biatec-accent bg-biatec-accent/10' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
              ]"
            >
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="standard.bgClass">
                  <i :class="standard.icon + ' text-gray-900 dark:text-white'"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ standard.name }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ standard.type }}</p>
                </div>
              </div>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ standard.description }}</p>
            </button>
          </div>

          <!-- Standard Detailed Guidance -->
          <div v-if="selectedStandard && currentStandardDetails" class="mt-6 p-5 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-lg">
            <div class="space-y-4">
              <div>
                <h4 class="text-sm font-semibold text-indigo-400 mb-2">About {{ currentStandardDetails.name }}</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ currentStandardDetails.detailedDescription }}</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 class="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                    <i class="pi pi-thumbs-up"></i>
                    Advantages
                  </h5>
                  <ul class="space-y-1">
                    <li v-for="pro in currentStandardDetails.pros" :key="pro" class="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <i class="pi pi-check text-green-500 mt-0.5"></i>
                      <span>{{ pro }}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 class="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-1">
                    <i class="pi pi-exclamation-triangle"></i>
                    Considerations
                  </h5>
                  <ul class="space-y-1">
                    <li v-for="con in currentStandardDetails.cons" :key="con" class="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <i class="pi pi-info-circle text-orange-500 mt-0.5"></i>
                      <span>{{ con }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h5 class="text-xs font-semibold text-cyan-400 mb-2">Use this standard when:</h5>
                <ul class="space-y-1">
                  <li v-for="when in currentStandardDetails.useWhen" :key="when" class="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <i class="pi pi-arrow-right text-cyan-500 mt-0.5"></i>
                    <span>{{ when }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Token Creation Form -->
        <div v-if="selectedStandard" class="glass-effect rounded-xl p-6" :class="{ 'opacity-60 pointer-events-none': isCreating }">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Token Details
            <span v-if="isCreating" class="ml-3 text-sm text-biatec-accent font-normal inline-flex items-center gap-2">
              <i class="pi pi-spin pi-spinner"></i>
              Creating token...
            </span>
          </h2>
          <form @submit.prevent="createToken" class="space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token Name</label>
                <input
                  v-model="tokenForm.name"
                  type="text"
                  required
                  class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
                  placeholder="e.g., My Awesome Token"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Symbol</label>
                <input
                  v-model="tokenForm.symbol"
                  type="text"
                  required
                  class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
                  placeholder="e.g., MAT"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                v-model="tokenForm.description"
                required
                rows="3"
                class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
                placeholder="Describe your token's purpose and features..."
              ></textarea>
            </div>

            <!-- Token Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token Type</label>
              <div class="flex space-x-4">
                <label class="flex items-center space-x-2">
                  <input v-model="tokenForm.type" type="radio" value="FT" class="w-4 h-4 text-biatec-accent focus:ring-biatec-accent" />
                  <span class="text-gray-900 dark:text-white">Fungible Token (FT)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input v-model="tokenForm.type" type="radio" value="NFT" class="w-4 h-4 text-biatec-accent focus:ring-biatec-accent" />
                  <span class="text-gray-900 dark:text-white">Non-Fungible Token (NFT)</span>
                </label>
              </div>
            </div>

            <!-- Supply and Decimals -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Supply</label>
                <input
                  v-model.number="tokenForm.supply"
                  type="number"
                  required
                  min="1"
                  class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
                  placeholder="1000000"
                />
              </div>
              <div v-if="tokenForm.type === 'FT'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Decimals</label>
                <input
                  v-model.number="tokenForm.decimals"
                  type="number"
                  min="0"
                  max="18"
                  class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
                  placeholder="6"
                />
              </div>
            </div>

            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token Image</label>
              <div class="flex items-center space-x-4">
                <input type="file" @change="handleImageUpload" accept="image/*" class="hidden" ref="imageInput" />
                <button type="button" @click="imageInput?.click()" class="px-4 py-2 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors">
                  <i class="pi pi-upload mr-2"></i>
                  Upload Image
                </button>
                <span v-if="tokenForm.imageUrl" class="text-sm text-gray-300">Image uploaded</span>
              </div>
            </div>

            <!-- NFT Attributes (for NFTs only) -->
            <div v-if="tokenForm.type === 'NFT'" class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-medium text-gray-300">Attributes</label>
                <button type="button" @click="addAttribute" class="px-3 py-1 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors text-sm">
                  <i class="pi pi-plus mr-1"></i>
                  Add Attribute
                </button>
              </div>
              <div v-for="(attr, index) in tokenForm.attributes" :key="index" class="flex space-x-2">
                <input
                  v-model="attr.trait_type"
                  type="text"
                  placeholder="Trait type"
                  class="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
                />
                <input
                  v-model="attr.value"
                  type="text"
                  placeholder="Value"
                  class="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-biatec-accent"
                />
                <button type="button" @click="removeAttribute(index)" class="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>

            <!-- Pre-Deployment Compliance Summary -->
            <div v-if="tokenForm.attestationEnabled && tokenForm.attestations.length > 0" class="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i class="pi pi-shield-check text-green-400"></i>
                Pre-Deployment Compliance Status
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div class="flex items-center gap-2 text-sm">
                  <i :class="['pi pi-check-circle', tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.KYC_AML) ? 'text-green-400' : 'text-gray-500']"></i>
                  <span :class="tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.KYC_AML) ? 'text-white' : 'text-gray-400'"> KYC/AML Verified </span>
                </div>

                <div class="flex items-center gap-2 text-sm">
                  <i
                    :class="['pi pi-check-circle', tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.ACCREDITED_INVESTOR) ? 'text-green-400' : 'text-gray-500']"
                  ></i>
                  <span :class="tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.ACCREDITED_INVESTOR) ? 'text-white' : 'text-gray-400'"> Accredited Investor </span>
                </div>

                <div class="flex items-center gap-2 text-sm">
                  <i :class="['pi pi-check-circle', tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.JURISDICTION) ? 'text-green-400' : 'text-gray-500']"></i>
                  <span :class="tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.JURISDICTION) ? 'text-white' : 'text-gray-400'"> Jurisdiction Approved </span>
                </div>
              </div>

              <div class="text-sm text-gray-300 flex items-start gap-2">
                <i class="pi pi-info-circle text-blue-400 mt-0.5"></i>
                <span>
                  <strong class="text-white">{{ tokenForm.attestations.length }}</strong> attestation(s) will be included with this token deployment for compliance audit trail.
                </span>
              </div>
            </div>

            <!-- Submit Button -->
            <!-- Validation Error Message -->
            <div v-if="!validationResult.isValid" class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6 validation-error-display">
              <div class="flex items-start gap-3">
                <i class="pi pi-exclamation-triangle text-red-400 mt-1"></i>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-red-400 mb-2">Validation Errors</p>
                  <div class="space-y-1">
                    <p v-for="error in validationResult.errors" :key="error.field" class="text-sm text-gray-300">
                      • {{ error.message }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Validation Warnings -->
            <div v-if="validationResult.warnings.length > 0" class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
              <div class="flex items-start gap-3">
                <i class="pi pi-exclamation-circle text-yellow-400 mt-1"></i>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-yellow-400 mb-2">Warnings</p>
                  <div class="space-y-1">
                    <p v-for="warning in validationResult.warnings" :key="warning.field" class="text-sm text-gray-300">
                      • {{ warning.message }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="isCreating || !canSubmit"
                class="btn-primary px-8 py-3 rounded-xl text-gray-900 dark:text-white font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i v-if="isCreating" class="pi pi-spin pi-spinner"></i>
                <i v-else class="pi pi-check"></i>
                <span>{{ isCreating ? "Creating Token..." : "Review & Deploy" }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Deployment Confirmation Dialog -->
    <DeploymentConfirmationDialog
      :is-open="showConfirmationDialog"
      :token-name="tokenForm.name"
      :token-symbol="tokenForm.symbol"
      :standard="selectedStandard"
      :token-type="tokenForm.type"
      :supply="tokenForm.supply"
      :decimals="tokenForm.type === 'FT' ? tokenForm.decimals : undefined"
      :network-display-name="currentNetworkGuidance?.displayName || 'Unknown'"
      :network-genesis-id="networkInfo?.chainType === 'AVM' ? (networkInfo?.genesisId || 'Unknown') : `Chain ID: ${networkInfo?.chainId || 'Unknown'}`"
      :is-testnet="networkInfo?.isTestnet || false"
      :fees="currentNetworkGuidance?.fees || { creation: 'N/A', transaction: 'N/A' }"
      :attestations-count="tokenForm.attestations.length"
      :has-compliance-metadata="!!tokenForm.complianceMetadata"
      :is-deploying="isCreating"
      @close="showConfirmationDialog = false"
      @confirm="executeDeployment"
    />

    <!-- Deployment Progress Dialog -->
    <DeploymentProgressDialog
      :is-open="showProgressDialog"
      :current-step="deploymentStep"
      :status="deploymentStatus"
      :error-message="deploymentError"
      :error-type="deploymentErrorType"
      :transaction-id="deploymentTxId"
      :can-cancel="deploymentStep === 'preparing'"
      @close="handleProgressDialogClose"
      @retry="handleRetryDeployment"
      @cancel="handleCancelDeployment"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTokenStore } from "../stores/tokens";
import { useSubscriptionStore } from "../stores/subscription";
import { useComplianceStore } from "../stores/compliance";
import { telemetryService } from "../services/TelemetryService";
import MainLayout from "../layout/MainLayout.vue";
import ComplianceChecklist from "../components/ComplianceChecklist.vue";
import RwaPresetSelector from "../components/RwaPresetSelector.vue";
import WalletAttestationForm from "../components/WalletAttestationForm.vue";
import MicaComplianceForm from "../components/MicaComplianceForm.vue";
import CompetitorParityChecklist from "../components/CompetitorParityChecklist.vue";
import WalletNetworkPanel from "../components/WalletNetworkPanel.vue";
import DeploymentConfirmationDialog from "../components/DeploymentConfirmationDialog.vue";
import DeploymentProgressDialog from "../components/DeploymentProgressDialog.vue";
import { WalletAttestation, AttestationType } from "../types/compliance";
import type { MicaComplianceMetadata } from "../types/api";
import { validateTokenParameters, formatValidationErrors, type TokenValidationResult } from "../utils/tokenValidation";
import { useWalletManager, type NetworkId } from "../composables/useWalletManager";

const router = useRouter();
const tokenStore = useTokenStore();
const subscriptionStore = useSubscriptionStore();
const complianceStore = useComplianceStore();
const { connect, disconnect, networkInfo } = useWalletManager();

const selectedNetwork = ref<"VOI" | "Aramid" | null>(null);
const selectedStandard = ref("");
const selectedTemplate = ref<string>("");
const isCreating = ref(false);
const validationError = ref<string | null>(null);
const imageInput = ref<HTMLInputElement>();
const showComplianceChecklist = ref(false);
const wizardStartTime = ref<number | null>(null);

// Deployment dialog states
const showConfirmationDialog = ref(false);
const showProgressDialog = ref(false);
const deploymentStep = ref<'preparing' | 'signing' | 'submitting' | 'confirming'>('preparing');
const deploymentStatus = ref<'processing' | 'success' | 'error'>('processing');
const deploymentError = ref<string | undefined>(undefined);
const deploymentErrorType = ref<'insufficient_funds' | 'wallet_rejected' | 'network_error' | 'timeout' | 'unknown' | undefined>(undefined);
const deploymentTxId = ref<string | undefined>(undefined);
const showCompetitorParity = ref(false);

const TEMPLATE_STORAGE_KEY = "biatec_selected_template";
const NETWORK_STORAGE_KEY = "biatec_selected_network";
const STANDARD_STORAGE_KEY = "biatec_selected_standard";

const tokenForm = reactive({
  name: "",
  symbol: "",
  description: "",
  type: "FT" as "FT" | "NFT",
  supply: 1000000,
  decimals: 6,
  imageUrl: "",
  attributes: [] as Array<{ trait_type: string; value: string }>,
  attestationEnabled: false,
  attestations: [] as WalletAttestation[],
  complianceMetadata: undefined as MicaComplianceMetadata | undefined,
  complianceMetadataEnabled: false,
  complianceMetadataValid: false,
});

// Watch for network changes and sync with compliance store
watch(selectedNetwork, (newNetwork) => {
  if (newNetwork) {
    complianceStore.setNetwork(newNetwork);
    localStorage.setItem(NETWORK_STORAGE_KEY, newNetwork);
  } else {
    // Default to 'Both' when network is deselected
    complianceStore.setNetwork("Both");
    localStorage.removeItem(NETWORK_STORAGE_KEY);
  }
});

// Watch for template changes and save to localStorage
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate) {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, newTemplate);
  } else {
    localStorage.removeItem(TEMPLATE_STORAGE_KEY);
  }
});

// Watch for standard changes and save to localStorage
watch(selectedStandard, (newStandard) => {
  if (newStandard) {
    localStorage.setItem(STANDARD_STORAGE_KEY, newStandard);
  } else {
    localStorage.removeItem(STANDARD_STORAGE_KEY);
  }
});

// Load saved selections from localStorage on mount
onMounted(() => {
  // Track wizard started
  wizardStartTime.value = Date.now()
  telemetryService.trackTokenWizardStarted({
    source: router.currentRoute.value.query.source as string || 'direct',
    network: selectedNetwork.value || undefined
  })
  
  const savedTemplate = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  const savedNetwork = localStorage.getItem(NETWORK_STORAGE_KEY);
  const savedStandard = localStorage.getItem(STANDARD_STORAGE_KEY);

  // Validate and restore template (which also sets standard and network)
  if (savedTemplate && tokenStore.tokenTemplates.find((t) => t.id === savedTemplate)) {
    applyTemplate(savedTemplate);
  } else if (savedStandard) {
    // Validate that the saved standard exists before restoring
    if (tokenStore.tokenStandards.find((s) => s.name === savedStandard)) {
      selectedStandard.value = savedStandard;
    }
  }

  // Only restore network if no template was applied and network value is valid
  if (!savedTemplate && savedNetwork) {
    const validNetworks: Array<"VOI" | "Aramid"> = ["VOI", "Aramid"];
    if (validNetworks.includes(savedNetwork as "VOI" | "Aramid")) {
      selectedNetwork.value = savedNetwork as "VOI" | "Aramid";
    }
  }
});

const currentTemplate = computed(() => (selectedTemplate.value ? tokenStore.tokenTemplates.find((t) => t.id === selectedTemplate.value) : undefined));

const currentNetworkGuidance = computed(() => (selectedNetwork.value ? tokenStore.networkGuidance.find((n) => n.name === selectedNetwork.value) : undefined));

const currentStandardDetails = computed(() => (selectedStandard.value ? tokenStore.tokenStandards.find((s) => s.name === selectedStandard.value) : undefined));

// Filter token standards based on selected network type (AVM vs EVM)
// AC #6: Ensure AVM standards remain visible when AVM chain selected
const filteredTokenStandards = computed(() => {
  if (!selectedNetwork.value) {
    // No network selected - show all standards
    return tokenStore.tokenStandards;
  }
  
  // VOI and Aramid are AVM chains, so show standards with network "VOI"
  // In future, if EVM chains are added, show standards with network "EVM"
  const isAVMChain = selectedNetwork.value === "VOI" || selectedNetwork.value === "Aramid";
  const targetNetwork = isAVMChain ? "VOI" : "EVM";
  
  return tokenStore.tokenStandards.filter(standard => standard.network === targetNetwork);
});

const selectNetwork = (network: "VOI" | "Aramid" | null) => {
  selectedNetwork.value = network;
  subscriptionStore.trackGuidanceInteraction();
};

const selectStandard = (standard: string) => {
  selectedStandard.value = standard;
  subscriptionStore.trackGuidanceInteraction();
};

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // In a real app, you'd upload to IPFS or similar
    tokenForm.imageUrl = URL.createObjectURL(file);
  }
};

const addAttribute = () => {
  tokenForm.attributes.push({ trait_type: "", value: "" });
};

const removeAttribute = (index: number) => {
  tokenForm.attributes.splice(index, 1);
};

const applyTemplate = (templateId: string) => {
  const template = tokenStore.tokenTemplates.find((t) => t.id === templateId);
  if (template) {
    selectedTemplate.value = templateId;
    selectedStandard.value = template.standard;
    tokenForm.supply = template.defaults.supply;
    tokenForm.decimals = template.defaults.decimals ?? 6;
    tokenForm.description = template.defaults.description;
    tokenForm.type = template.type;

    // Auto-select network if template specifies one
    if (template.network !== "Both") {
      selectedNetwork.value = template.network;
    }

    subscriptionStore.trackGuidanceInteraction();
  }
};

const clearTemplate = () => {
  selectedTemplate.value = "";
};

// Computed validation result - runs validation on form changes
const validationResult = computed<TokenValidationResult>(() => {
  return validateTokenParameters({
    name: tokenForm.name,
    symbol: tokenForm.symbol,
    description: tokenForm.description,
    type: tokenForm.type,
    supply: tokenForm.supply,
    decimals: tokenForm.decimals,
    standard: selectedStandard.value,
    complianceMetadata: tokenForm.complianceMetadata,
    complianceMetadataValid: tokenForm.complianceMetadataValid,
    isRwaToken: currentTemplate.value?.isRwaPreset,
  });
});

// Check if form is valid for submission
const canSubmit = computed(() => {
  return !!(selectedStandard.value && validationResult.value.isValid);
});

// Dismiss validation error banner (will reappear if form is submitted with errors)
const dismissValidationError = () => {
  validationError.value = null;
};

// Authentication handlers
const handleConnectWallet = async () => {
  try {
    await connect();
  } catch (error) {
    console.error('Failed to sign in:', error);
  }
};

const handleDisconnectWallet = async () => {
  try {
    await disconnect();
  } catch (error) {
    console.error('Failed to sign out:', error);
  }
};

const handleNetworkSwitched = (networkId: NetworkId) => {
  console.log('Network switched to:', networkId);
  // Network state is automatically managed by useWalletManager
};

const createToken = async () => {
  if (!selectedStandard.value) return;

  // Clear previous validation error
  validationError.value = null;

  // Run preflight validation
  if (!validationResult.value.isValid) {
    validationError.value = formatValidationErrors(validationResult.value);
    // Scroll to validation error display
    const errorElement = document.querySelector('.validation-error-display');
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // Show confirmation dialog instead of deploying immediately
  showConfirmationDialog.value = true;
};

const executeDeployment = async () => {
  // Close confirmation dialog and show progress dialog
  showConfirmationDialog.value = false;
  showProgressDialog.value = true;
  
  // Reset deployment state
  deploymentStep.value = 'preparing';
  deploymentStatus.value = 'processing';
  deploymentError.value = undefined;
  deploymentErrorType.value = undefined;
  deploymentTxId.value = undefined;
  
  isCreating.value = true;
  subscriptionStore.trackTokenCreationAttempt();

  try {
    // Step 1: Preparing transaction
    deploymentStep.value = 'preparing';
    // TODO: Remove this artificial delay in production - only for UX demonstration
    await new Promise(resolve => setTimeout(resolve, 500));

    // Prepare attestation metadata if enabled
    const attestationMetadata =
      tokenForm.attestationEnabled && tokenForm.attestations.length > 0
        ? {
            enabled: true,
            attestations: tokenForm.attestations,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            complianceSummary: {
              kycCompliant: tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.KYC_AML),
              accreditedInvestor: tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.ACCREDITED_INVESTOR),
              jurisdictionApproved: tokenForm.attestations.some((att: WalletAttestation) => att.type === AttestationType.JURISDICTION),
              overallStatus: tokenForm.attestations.length >= 2 ? "compliant" : ((tokenForm.attestations.length === 1 ? "partial" : "non_compliant") as "compliant" | "partial" | "non_compliant"),
            },
          }
        : undefined;

    // Step 2: Waiting for wallet signature
    deploymentStep.value = 'signing';
    // TODO: Replace with actual wallet signature request and response handling
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Submitting to network
    deploymentStep.value = 'submitting';

    await tokenStore.createToken({
      name: tokenForm.name,
      symbol: tokenForm.symbol,
      standard: selectedStandard.value as any,
      type: tokenForm.type,
      supply: tokenForm.supply,
      decimals: tokenForm.type === "FT" ? tokenForm.decimals : undefined,
      description: tokenForm.description,
      imageUrl: tokenForm.imageUrl || undefined,
      attributes: tokenForm.type === "NFT" ? tokenForm.attributes.filter((attr) => attr.trait_type && attr.value) : undefined,
      attestationMetadata,
      complianceMetadata: tokenForm.complianceMetadata,
    });

    // Step 4: Confirming transaction
    deploymentStep.value = 'confirming';
    // TODO: Replace with actual blockchain confirmation polling
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Set success state
    deploymentStatus.value = 'success';
    // TODO: Replace mock transaction ID with actual blockchain transaction ID from response
    deploymentTxId.value = 'TX-' + Math.random().toString(36).substring(2, 15);

    // Track successful creation with details
    subscriptionStore.trackTokenCreationSuccess(selectedStandard.value, selectedTemplate.value || undefined, selectedNetwork.value || undefined);
    
    // Track wizard completion with analytics
    if (wizardStartTime.value) {
      const durationMs = Date.now() - wizardStartTime.value
      telemetryService.trackTokenWizardCompleted({
        tokenStandard: selectedStandard.value,
        tokenType: tokenForm.type,
        network: selectedNetwork.value || 'unknown',
        durationMs
      })
      wizardStartTime.value = null
    }

    // Give user time to see success state before auto-navigation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reset form
    Object.assign(tokenForm, {
      name: "",
      symbol: "",
      description: "",
      type: "FT",
      supply: 1000000,
      decimals: 6,
      imageUrl: "",
      attributes: [],
      attestationEnabled: false,
      attestations: [],
      complianceMetadata: undefined,
      complianceMetadataEnabled: false,
      complianceMetadataValid: false,
    });
    selectedStandard.value = "";
    selectedNetwork.value = null;

    // Close progress dialog and redirect to dashboard
    showProgressDialog.value = false;
    router.push("/dashboard");
  } catch (error) {
    console.error("Failed to create token:", error);
    
    // Set error state
    deploymentStatus.value = 'error';
    
    // Determine error type and message
    const errorMessage = error instanceof Error ? error.message : 'Failed to deploy token';
    deploymentError.value = errorMessage;
    
    // Parse error type from message
    if (errorMessage.toLowerCase().includes('insufficient')) {
      deploymentErrorType.value = 'insufficient_funds';
    } else if (errorMessage.toLowerCase().includes('reject')) {
      deploymentErrorType.value = 'wallet_rejected';
    } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
      deploymentErrorType.value = 'network_error';
    } else if (errorMessage.toLowerCase().includes('timeout')) {
      deploymentErrorType.value = 'timeout';
    } else {
      deploymentErrorType.value = 'unknown';
    }
  } finally {
    isCreating.value = false;
  }
};

const handleProgressDialogClose = () => {
  showProgressDialog.value = false;
  
  // If deployment was successful, redirect to dashboard
  if (deploymentStatus.value === 'success') {
    router.push("/dashboard");
  }
};

const handleRetryDeployment = () => {
  // Reset progress dialog and retry
  showProgressDialog.value = false;
  
  // Small delay before showing confirmation again
  setTimeout(() => {
    showConfirmationDialog.value = true;
  }, 300);
};

const handleCancelDeployment = () => {
  // Cancel deployment
  isCreating.value = false;
  showProgressDialog.value = false;
};
</script>
