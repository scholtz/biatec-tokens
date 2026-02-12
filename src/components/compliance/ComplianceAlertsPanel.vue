<template>
  <div class="glass-effect rounded-xl p-6">
    <div class="flex items-start justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <i class="pi pi-bell text-biatec-accent"></i>
          Compliance Alerts
          <span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">Coming Soon</span>
        </h2>
        <p class="text-sm text-gray-400 mt-1">Real-time compliance monitoring and notifications</p>
      </div>
    </div>

    <!-- Coming Soon State -->
    <div class="text-center py-12">
      <div class="relative inline-block mb-6">
        <i class="pi pi-bell text-6xl text-gray-500 opacity-50"></i>
        <div class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500/20 border-2 border-yellow-500 rounded-full flex items-center justify-center animate-pulse">
          <i class="pi pi-clock text-yellow-400 text-sm"></i>
        </div>
      </div>

      <h3 class="text-xl font-semibold text-white mb-3">Real-Time Alerts Coming Soon</h3>
      <p class="text-gray-400 max-w-2xl mx-auto mb-8">
        Stay ahead of compliance issues with automated monitoring and instant alerts for critical events,
        whitelist changes, suspicious activity, and regulatory updates.
      </p>

      <!-- Features Preview -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <div class="bg-white/5 rounded-lg p-4 text-left">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="pi pi-exclamation-triangle text-red-400 text-xl"></i>
            </div>
            <div>
              <h4 class="text-white font-medium mb-1">Critical Alerts</h4>
              <p class="text-sm text-gray-400">
                Immediate notifications for whitelist violations, failed transfers, and regulatory breaches
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white/5 rounded-lg p-4 text-left">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="pi pi-sync text-yellow-400 text-xl"></i>
            </div>
            <div>
              <h4 class="text-white font-medium mb-1">System Monitoring</h4>
              <p class="text-sm text-gray-400">
                Track KYC provider health, audit trail status, and data retention compliance
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white/5 rounded-lg p-4 text-left">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="pi pi-globe text-blue-400 text-xl"></i>
            </div>
            <div>
              <h4 class="text-white font-medium mb-1">Regulatory Updates</h4>
              <p class="text-sm text-gray-400">
                Automated tracking of MICA regulation changes and jurisdiction-specific requirements
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white/5 rounded-lg p-4 text-left">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="pi pi-shield-check text-green-400 text-xl"></i>
            </div>
            <div>
              <h4 class="text-white font-medium mb-1">Proactive Compliance</h4>
              <p class="text-sm text-gray-400">
                Predictive warnings before issues escalate, with recommended remediation actions
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Alert Types Preview -->
      <div class="mt-8 bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-6 max-w-3xl mx-auto">
        <h4 class="text-lg font-semibold text-white mb-4">Alert Categories (Planned)</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-red-400 mb-1">Critical</div>
            <div class="text-xs text-gray-400">Immediate action</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-400 mb-1">High</div>
            <div class="text-xs text-gray-400">Within 24 hours</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-yellow-400 mb-1">Medium</div>
            <div class="text-xs text-gray-400">Within 7 days</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-400 mb-1">Low</div>
            <div class="text-xs text-gray-400">Informational</div>
          </div>
        </div>
      </div>

      <!-- Notification Methods Preview -->
      <div class="mt-6 flex items-center justify-center gap-6 text-gray-400">
        <div class="flex items-center gap-2">
          <i class="pi pi-envelope text-lg"></i>
          <span class="text-sm">Email</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="pi pi-mobile text-lg"></i>
          <span class="text-sm">SMS</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="pi pi-bell text-lg"></i>
          <span class="text-sm">In-App</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="pi pi-slack text-lg"></i>
          <span class="text-sm">Slack</span>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-8">
        <button
          @click="notifyInterest"
          class="px-6 py-3 bg-biatec-accent/20 hover:bg-biatec-accent/30 text-biatec-accent rounded-lg transition-colors font-medium"
          aria-label="Express interest in compliance alerts feature"
        >
          <i class="pi pi-envelope mr-2"></i>
          Notify Me When Available
        </button>
      </div>
    </div>

    <!-- Info Box -->
    <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
        <div class="text-sm text-gray-300">
          <strong class="text-blue-400">Planned for Phase 2</strong>
          <p class="mt-1">
            The Compliance Alerts system is currently in development and will be available in the next major release.
            This feature will provide real-time monitoring, automated notifications, and proactive compliance management
            to help you stay ahead of regulatory requirements and operational issues.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const notifyInterest = () => {
  // In real implementation, this would open a modal or send a request to backend
  alert('Thank you for your interest! We\'ll notify you when Compliance Alerts are available.');
  console.log('User expressed interest in Compliance Alerts feature');
};
</script>
