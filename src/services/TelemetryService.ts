/**
 * Minimal telemetry service for tracking user events
 * Used to monitor wallet connections and platform adoption
 */

export interface TelemetryEvent {
  event: string
  properties?: Record<string, any>
  timestamp: string
}

export class TelemetryService {
  private static instance: TelemetryService
  private events: TelemetryEvent[] = []

  private constructor() {}

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService()
    }
    return TelemetryService.instance
  }

  /**
   * Track a telemetry event
   */
  track(event: string, properties?: Record<string, any>): void {
    const telemetryEvent: TelemetryEvent = {
      event,
      properties,
      timestamp: new Date().toISOString(),
    }

    this.events.push(telemetryEvent)

    // Log to console for visibility
    console.log('[Telemetry]', event, properties)

    // In a production environment, this would send to an analytics service
    // For now, we just store locally and log
  }

  /**
   * Track wallet connection success
   */
  trackWalletConnect(data: {
    walletId: string
    network: string
    address: string
  }): void {
    this.track('wallet_connected', {
      wallet_id: data.walletId,
      network: data.network,
      address_prefix: data.address.slice(0, 6),
    })
  }

  /**
   * Track network switch
   */
  trackNetworkSwitch(data: { fromNetwork: string; toNetwork: string }): void {
    this.track('network_switched', {
      from_network: data.fromNetwork,
      to_network: data.toNetwork,
    })
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events]
  }

  /**
   * Clear all tracked events
   */
  clearEvents(): void {
    this.events = []
  }
}

export const telemetryService = TelemetryService.getInstance()
