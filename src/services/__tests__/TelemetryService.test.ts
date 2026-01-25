import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TelemetryService, telemetryService } from '../TelemetryService'

describe('TelemetryService', () => {
  let service: TelemetryService

  beforeEach(() => {
    service = TelemetryService.getInstance()
    service.clearEvents()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should be a singleton', () => {
    const instance1 = TelemetryService.getInstance()
    const instance2 = TelemetryService.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should track events', () => {
    service.track('test_event', { foo: 'bar' })
    
    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('test_event')
    expect(events[0].properties).toEqual({ foo: 'bar' })
    expect(events[0].timestamp).toBeDefined()
  })

  it('should track wallet connection', () => {
    service.trackWalletConnect({
      walletId: 'pera',
      network: 'voi-mainnet',
      address: 'ALGO123456789ABCDEF',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('wallet_connected')
    expect(events[0].properties?.wallet_id).toBe('pera')
    expect(events[0].properties?.network).toBe('voi-mainnet')
    expect(events[0].properties?.address_prefix).toBe('ALGO12')
  })

  it('should track network switch', () => {
    service.trackNetworkSwitch({
      fromNetwork: 'voi-mainnet',
      toNetwork: 'aramidmain',
    })

    const events = service.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('network_switched')
    expect(events[0].properties?.from_network).toBe('voi-mainnet')
    expect(events[0].properties?.to_network).toBe('aramidmain')
  })

  it('should log events to console', () => {
    service.track('test_event', { data: 'value' })
    
    expect(console.log).toHaveBeenCalledWith(
      '[Telemetry]',
      'test_event',
      { data: 'value' }
    )
  })

  it('should clear events', () => {
    service.track('event1')
    service.track('event2')
    expect(service.getEvents()).toHaveLength(2)

    service.clearEvents()
    expect(service.getEvents()).toHaveLength(0)
  })

  it('should include timestamp in all events', () => {
    const beforeTime = new Date().toISOString()
    service.track('timed_event')
    const afterTime = new Date().toISOString()

    const events = service.getEvents()
    expect(events[0].timestamp).toBeDefined()
    expect(events[0].timestamp >= beforeTime).toBe(true)
    expect(events[0].timestamp <= afterTime).toBe(true)
  })
})
