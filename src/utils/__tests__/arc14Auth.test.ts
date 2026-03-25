import { describe, it, expect, vi } from 'vitest'
import { makeArc14AuthHeader } from '../arc14Auth'

describe('arc14Auth', () => {
  it('makeArc14AuthHeader returns SigTx prefix with base64 encoded transaction', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5])
    const header = makeArc14AuthHeader(bytes)
    expect(header).toMatch(/^SigTx /)
    const encoded = header.replace('SigTx ', '')
    expect(encoded).toBeTruthy()
    expect(encoded.length).toBeGreaterThan(0)
  })

  it('makeArc14AuthHeader handles empty byte array', () => {
    const bytes = new Uint8Array([])
    const header = makeArc14AuthHeader(bytes)
    expect(header).toMatch(/^SigTx /)
  })

  it('makeArc14AuthHeader produces consistent output for same input', () => {
    const bytes = new Uint8Array([10, 20, 30])
    const header1 = makeArc14AuthHeader(bytes)
    const header2 = makeArc14AuthHeader(bytes)
    expect(header1).toBe(header2)
  })

  it('makeArc14AuthHeader produces different output for different inputs', () => {
    const bytes1 = new Uint8Array([1, 2, 3])
    const bytes2 = new Uint8Array([4, 5, 6])
    const header1 = makeArc14AuthHeader(bytes1)
    const header2 = makeArc14AuthHeader(bytes2)
    expect(header1).not.toBe(header2)
  })
})
