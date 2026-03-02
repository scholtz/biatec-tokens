/**
 * Wallet Activation Checkpoint Manager
 *
 * Provides deterministic checkpoint-based journey persistence for the wallet
 * activation flow. Checkpoints are stored in localStorage so an interrupted
 * journey can be resumed without data loss.
 */

const CHECKPOINT_STORAGE_KEY_PREFIX = 'wallet_activation_checkpoint_'
const DEFAULT_EXPIRY_MINUTES = 60 * 24 // 24 hours

export interface ActivationCheckpoint {
  journeyId: string
  step: number
  totalSteps: number
  completedSteps: number[]
  metadata: Record<string, unknown>
  savedAt: string   // ISO date string
  version: number
}

export interface CheckpointLoadResult {
  checkpoint: ActivationCheckpoint | null
  isExpired: boolean
  ageMinutes: number
}

/**
 * Save a checkpoint for a wallet activation journey.
 */
export function saveCheckpoint(
  journeyId: string,
  step: number,
  totalSteps: number,
  completedSteps: number[],
  metadata: Record<string, unknown> = {},
): ActivationCheckpoint {
  const checkpoint: ActivationCheckpoint = {
    journeyId,
    step,
    totalSteps,
    completedSteps: [...completedSteps],
    metadata,
    savedAt: new Date().toISOString(),
    version: 1,
  }

  try {
    localStorage.setItem(
      `${CHECKPOINT_STORAGE_KEY_PREFIX}${journeyId}`,
      JSON.stringify(checkpoint),
    )
  } catch {
    // localStorage may be unavailable in some environments; silently ignore
  }

  return checkpoint
}

/**
 * Load a checkpoint for a wallet activation journey.
 * Returns null if no checkpoint exists or if it cannot be parsed.
 */
export function loadCheckpoint(
  journeyId: string,
  maxAgeMinutes = DEFAULT_EXPIRY_MINUTES,
): CheckpointLoadResult {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(`${CHECKPOINT_STORAGE_KEY_PREFIX}${journeyId}`)
  } catch {
    return { checkpoint: null, isExpired: false, ageMinutes: 0 }
  }

  if (!raw) {
    return { checkpoint: null, isExpired: false, ageMinutes: 0 }
  }

  let checkpoint: ActivationCheckpoint
  try {
    checkpoint = JSON.parse(raw) as ActivationCheckpoint
  } catch {
    return { checkpoint: null, isExpired: false, ageMinutes: 0 }
  }

  const ageMinutes = getCheckpointAge(checkpoint)
  const isExpired = ageMinutes > maxAgeMinutes

  return { checkpoint, isExpired, ageMinutes }
}

/**
 * Clear a saved checkpoint for a journey.
 * Call this on successful completion or deliberate user reset.
 */
export function clearCheckpoint(journeyId: string): void {
  try {
    localStorage.removeItem(`${CHECKPOINT_STORAGE_KEY_PREFIX}${journeyId}`)
  } catch {
    // Silently ignore
  }
}

/**
 * Get the age of a checkpoint in minutes.
 */
export function getCheckpointAge(checkpoint: ActivationCheckpoint): number {
  const savedAt = new Date(checkpoint.savedAt)
  const now = new Date()
  return Math.floor((now.getTime() - savedAt.getTime()) / (1000 * 60))
}

/**
 * Check whether a checkpoint has expired.
 */
export function isCheckpointExpired(
  checkpoint: ActivationCheckpoint,
  maxAgeMinutes = DEFAULT_EXPIRY_MINUTES,
): boolean {
  return getCheckpointAge(checkpoint) > maxAgeMinutes
}

/**
 * Get a human-readable resume message for a checkpoint.
 */
export function getResumeMessage(checkpoint: ActivationCheckpoint): string {
  const ageMinutes = getCheckpointAge(checkpoint)

  if (ageMinutes < 1) {
    return `You were on step ${checkpoint.step} of ${checkpoint.totalSteps}. Continue where you left off.`
  }

  if (ageMinutes < 60) {
    return `You started this ${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} ago and were on step ${checkpoint.step} of ${checkpoint.totalSteps}. Continue where you left off.`
  }

  const ageHours = Math.floor(ageMinutes / 60)
  if (ageHours < 24) {
    return `You started this ${ageHours} hour${ageHours !== 1 ? 's' : ''} ago and were on step ${checkpoint.step} of ${checkpoint.totalSteps}. Continue where you left off.`
  }

  const ageDays = Math.floor(ageHours / 24)
  return `You started this ${ageDays} day${ageDays !== 1 ? 's' : ''} ago and were on step ${checkpoint.step} of ${checkpoint.totalSteps}. Continue where you left off.`
}

/**
 * Determine whether a checkpoint is resumable (exists, not expired, step > 1).
 */
export function isCheckpointResumable(result: CheckpointLoadResult): boolean {
  return result.checkpoint !== null && !result.isExpired && result.checkpoint.step > 1
}
