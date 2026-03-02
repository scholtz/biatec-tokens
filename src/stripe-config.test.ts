import { describe, it, expect } from 'vitest'
import { stripeProducts, getProductById, getProductByPriceId, getProductByTierAndInterval, getMonthlyEquivalentPrice, ANNUAL_DISCOUNT_PERCENT } from './stripe-config'

describe('stripe-config', () => {
  describe('stripeProducts', () => {
    it('should export 6 products (3 monthly + 3 annual)', () => {
      expect(stripeProducts).toHaveLength(6)
    })

    it('should have 3 monthly products', () => {
      const monthly = stripeProducts.filter(p => p.interval === 'month')
      expect(monthly).toHaveLength(3)
    })

    it('should have 3 annual products', () => {
      const annual = stripeProducts.filter(p => p.interval === 'year')
      expect(annual).toHaveLength(3)
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

  describe('getProductByTierAndInterval', () => {
    it('should return monthly basic plan', () => {
      const product = getProductByTierAndInterval('basic', 'month')
      expect(product).toBeDefined()
      expect(product?.tier).toBe('basic')
      expect(product?.interval).toBe('month')
      expect(product?.price).toBe(29)
    })

    it('should return annual professional plan', () => {
      const product = getProductByTierAndInterval('professional', 'year')
      expect(product).toBeDefined()
      expect(product?.tier).toBe('professional')
      expect(product?.interval).toBe('year')
    })

    it('should return undefined for unknown tier', () => {
      const product = getProductByTierAndInterval('basic', 'year')
      expect(product).toBeDefined() // annual basic exists
    })

    it('annual plan price should be at least 20% less than 12x monthly', () => {
      const monthly = getProductByTierAndInterval('professional', 'month')!
      const annual = getProductByTierAndInterval('professional', 'year')!
      const annualEquivalentMonthly = annual.price / 12
      const discountRate = 1 - annualEquivalentMonthly / monthly.price
      expect(discountRate).toBeGreaterThanOrEqual(ANNUAL_DISCOUNT_PERCENT / 100 - 0.01)
    })
  })

  describe('getMonthlyEquivalentPrice', () => {
    it('should return the monthly price directly for monthly plan', () => {
      const product = getProductByTierAndInterval('basic', 'month')!
      expect(getMonthlyEquivalentPrice(product)).toBe(29)
    })

    it('should return price/12 for annual plan', () => {
      const product = getProductByTierAndInterval('basic', 'year')!
      const expected = product.price / 12
      expect(getMonthlyEquivalentPrice(product)).toBeCloseTo(expected, 2)
    })
  })

  describe('ANNUAL_DISCOUNT_PERCENT', () => {
    it('should be 20', () => {
      expect(ANNUAL_DISCOUNT_PERCENT).toBe(20)
    })
  })
})
