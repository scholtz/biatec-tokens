/**
 * Launch Preflight Validator
 *
 * Validates token launch configuration before deployment is attempted.
 * Runs a deterministic set of checks and returns a structured preflight report.
 * All descriptions use plain business language — no blockchain jargon.
 */

/** Status for an individual preflight check. */
export type PreflightCheckStatus = 'pass' | 'fail' | 'warning' | 'skipped'

export interface PreflightCheck {
  id: string
  name: string
  description: string
  status: PreflightCheckStatus
  message: string
  isRequired: boolean
  category: 'network' | 'token_config' | 'compliance' | 'identity'
}

export interface PreflightResult {
  checks: PreflightCheck[]
  passed: boolean
  failedRequired: PreflightCheck[]
  warnings: PreflightCheck[]
  timestamp: Date
  summary: string
}

export interface TokenLaunchConfig {
  tokenName?: string
  tokenSymbol?: string
  totalSupply?: number
  network?: string
  complianceComplete?: boolean
  identityVerified?: boolean
  organizationVerified?: boolean
  templateSelected?: boolean
}

const SUPPORTED_NETWORKS = [
  'algorand',
  'algorand-testnet',
  'ethereum',
  'ethereum-sepolia',
  'voi',
  'aramid',
  'base',
  'arbitrum',
]

/**
 * Validate the network configuration.
 */
export function runNetworkCheck(network: string | undefined): PreflightCheck {
  if (!network || network.trim() === '') {
    return {
      id: 'network-selected',
      name: 'Network Selection',
      description: 'A deployment network must be selected before launching.',
      status: 'fail',
      message: 'No network selected. Choose a deployment network to continue.',
      isRequired: true,
      category: 'network',
    }
  }

  const normalised = network.toLowerCase()
  if (!SUPPORTED_NETWORKS.includes(normalised)) {
    return {
      id: 'network-selected',
      name: 'Network Selection',
      description: 'A deployment network must be selected before launching.',
      status: 'warning',
      message: `Network "${network}" is not a recognised network. Verify the selection before deploying.`,
      isRequired: true,
      category: 'network',
    }
  }

  return {
    id: 'network-selected',
    name: 'Network Selection',
    description: 'A deployment network must be selected before launching.',
    status: 'pass',
    message: `Network "${network}" is ready for deployment.`,
    isRequired: true,
    category: 'network',
  }
}

/**
 * Validate token configuration completeness.
 */
export function runTokenConfigCheck(config: TokenLaunchConfig): PreflightCheck[] {
  const checks: PreflightCheck[] = []

  checks.push({
    id: 'token-name',
    name: 'Token Name',
    description: 'The token must have a valid name.',
    status: config.tokenName && config.tokenName.trim().length >= 2 ? 'pass' : 'fail',
    message:
      config.tokenName && config.tokenName.trim().length >= 2
        ? `Token name "${config.tokenName}" is valid.`
        : 'Token name is missing or too short (minimum 2 characters).',
    isRequired: true,
    category: 'token_config',
  })

  checks.push({
    id: 'token-symbol',
    name: 'Token Symbol',
    description: 'The token must have a valid ticker symbol.',
    status: config.tokenSymbol && /^[A-Z0-9]{1,10}$/.test(config.tokenSymbol) ? 'pass' : 'fail',
    message:
      config.tokenSymbol && /^[A-Z0-9]{1,10}$/.test(config.tokenSymbol)
        ? `Token symbol "${config.tokenSymbol}" is valid.`
        : 'Token symbol must be 1–10 uppercase letters or digits (e.g. MYTKN).',
    isRequired: true,
    category: 'token_config',
  })

  checks.push({
    id: 'total-supply',
    name: 'Token Supply',
    description: 'The token must have a positive total supply.',
    status: config.totalSupply !== undefined && config.totalSupply > 0 ? 'pass' : 'fail',
    message:
      config.totalSupply !== undefined && config.totalSupply > 0
        ? `Total supply of ${config.totalSupply.toLocaleString()} tokens is valid.`
        : 'Total supply must be greater than zero.',
    isRequired: true,
    category: 'token_config',
  })

  checks.push({
    id: 'template-selected',
    name: 'Token Template',
    description: 'A token template must be selected to define the token standard.',
    status: config.templateSelected ? 'pass' : 'fail',
    message: config.templateSelected
      ? 'Token template selected.'
      : 'No token template selected. Choose a template (ARC3, ARC200, ERC20, etc.) to continue.',
    isRequired: true,
    category: 'token_config',
  })

  return checks
}

/**
 * Validate compliance and identity requirements.
 */
export function runComplianceCheck(config: TokenLaunchConfig): PreflightCheck[] {
  const checks: PreflightCheck[] = []

  checks.push({
    id: 'compliance-complete',
    name: 'Compliance Requirements',
    description: 'Required compliance steps must be completed before deployment.',
    status: config.complianceComplete ? 'pass' : 'warning',
    message: config.complianceComplete
      ? 'Compliance requirements are complete.'
      : 'Some compliance requirements are not yet complete. You may proceed, but complete them soon to avoid regulatory issues.',
    isRequired: false,
    category: 'compliance',
  })

  checks.push({
    id: 'identity-verified',
    name: 'Identity Verification',
    description: 'Your identity must be verified as the authorised token issuer.',
    status: config.identityVerified ? 'pass' : 'warning',
    message: config.identityVerified
      ? 'Identity verified.'
      : 'Identity verification is pending. Complete verification to meet regulatory requirements.',
    isRequired: false,
    category: 'identity',
  })

  checks.push({
    id: 'organization-verified',
    name: 'Organization Profile',
    description: 'Your organization profile must be set up.',
    status: config.organizationVerified ? 'pass' : 'fail',
    message: config.organizationVerified
      ? 'Organization profile is complete.'
      : 'Organization profile is not set up. Complete your organization profile to proceed.',
    isRequired: true,
    category: 'identity',
  })

  return checks
}

/**
 * Run all preflight checks for a token launch configuration.
 */
export function validatePreflightChecks(config: TokenLaunchConfig): PreflightResult {
  const networkCheck = runNetworkCheck(config.network)
  const tokenConfigChecks = runTokenConfigCheck(config)
  const complianceChecks = runComplianceCheck(config)

  const checks: PreflightCheck[] = [networkCheck, ...tokenConfigChecks, ...complianceChecks]

  const failedRequired = checks.filter((c) => c.isRequired && c.status === 'fail')
  const warnings = checks.filter((c) => c.status === 'warning')
  const passed = failedRequired.length === 0

  let summary: string
  if (passed && warnings.length === 0) {
    summary = 'All preflight checks passed. Your token is ready to launch.'
  } else if (passed) {
    summary = `Ready to launch with ${warnings.length} advisory notice${warnings.length !== 1 ? 's' : ''}. Review warnings before proceeding.`
  } else {
    summary = `${failedRequired.length} required check${failedRequired.length !== 1 ? 's' : ''} failed. Resolve the issues below before launching.`
  }

  return {
    checks,
    passed,
    failedRequired,
    warnings,
    timestamp: new Date(),
    summary,
  }
}

/**
 * Determine whether a preflight result allows launch to proceed.
 */
export function isPreflightPassed(result: PreflightResult): boolean {
  return result.passed
}

/**
 * Get the Tailwind CSS color class for a preflight check status.
 */
export function getPreflightStatusColor(status: PreflightCheckStatus): string {
  const colors: Record<PreflightCheckStatus, string> = {
    pass: 'text-green-400',
    fail: 'text-red-400',
    warning: 'text-amber-400',
    skipped: 'text-gray-400',
  }
  return colors[status]
}

/**
 * Get the icon identifier for a preflight check status.
 */
export function getPreflightStatusIcon(status: PreflightCheckStatus): string {
  const icons: Record<PreflightCheckStatus, string> = {
    pass: 'check-circle',
    fail: 'x-circle',
    warning: 'exclamation-triangle',
    skipped: 'minus-circle',
  }
  return icons[status]
}
