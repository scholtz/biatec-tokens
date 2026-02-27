import { describe, it, expect } from 'vitest'
import { stripeProducts, getProductById, getProductByPriceId } from './stripe-config'

describe('stripe-config', () => {
  describe('stripeProducts', () => {
    it('should export 3 products', () => {
      expect(stripeProducts).toHaveLength(3)
    })

    it('should have basic, professional, enterprise tiers', () => {
      const tiers = stripeProducts.map(p => p.tier)
      expect(tiers).toContain('basic')
      expect(tiers).toContain('professional')
      expect(tiers).toContain('enterprise')
    })
  })

  describe('getProductById', () => {
    it('should return product when id exists', () => {
      const product = getProductById('prod_basic')
      expect(product).toBeDefined()
      expect(product?.tier).toBe('basic')
    })

    it('should return product for professional id', () => {
      const product = getProductById('prod_professional')
      expect(product).toBeDefined()
      expect(product?.tier).toBe('professional')
    })

    it('should return product for enterprise id', () => {
      const product = getProductById('prod_enterprise')
      expect(product).toBeDefined()
      expect(product?.tier).toBe('enterprise')
    })

    it('should return undefined when id does not exist', () => {
      const product = getProductById('prod_nonexistent')
      expect(product).toBeUndefined()
    })
  })

  describe('getProductByPriceId', () => {
    it('should return product when price id exists', () => {
      const product = getProductByPriceId('price_basic_monthly')
      expect(product).toBeDefined()
      expect(product?.tier).toBe('basic')
    })

    it('should return product for professional price id', () => {
      const product = getProductByPriceId('price_professional_monthly')
      expect(product).toBeDefined()
      expect(product?.tier).toBe('professional')
    })

    it('should return product for enterprise price id', () => {
      const product = getProductByPriceId('price_enterprise_monthly')
      expect(product).toBeDefined()
      expect(product?.tier).toBe('enterprise')
    })

    it('should return undefined when price id does not exist', () => {
      const product = getProductByPriceId('price_nonexistent')
      expect(product).toBeUndefined()
    })
  })
})
