import { describe, it, expect } from 'vitest'
import {
  calculateUtilityScore,
  getUtilityComparisons,
  getRecommendedStandard,
  getStandardUtility,
  getUseCaseDisplayName,
  getCostProfileDisplay,
  getWalletCompatibilityDisplay,
} from '../tokenUtilityRecommendations'
import { TOKEN_UTILITIES, TokenUseCase } from '../../types/tokenUtility'

describe('tokenUtilityRecommendations', () => {
  describe('calculateUtilityScore', () => {
    it('should give high score for exact use case match', () => {
      const utility = TOKEN_UTILITIES.ARC200
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
      }
      const score = calculateUtilityScore(utility, requirements)
      expect(score).toBeGreaterThan(40)
    })

    it('should give bonus for compliance when required', () => {
      const utility = TOKEN_UTILITIES.ARC200
      const requirements = {
        useCase: TokenUseCase.RWA_TOKEN,
        requiresCompliance: true,
      }
      const score = calculateUtilityScore(utility, requirements)
      expect(score).toBeGreaterThan(60)
    })

    it('should favor low-cost standards when cost-sensitive', () => {
      const algorandUtility = TOKEN_UTILITIES.ARC200
      const ethereumUtility = TOKEN_UTILITIES.ERC20
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        costSensitive: true,
      }
      const algorandScore = calculateUtilityScore(algorandUtility, requirements)
      const ethereumScore = calculateUtilityScore(ethereumUtility, requirements)
      expect(algorandScore).toBeGreaterThan(ethereumScore)
    })

    it('should favor excellent wallet compatibility when required', () => {
      const arc3Utility = TOKEN_UTILITIES.ARC3
      const arc19Utility = TOKEN_UTILITIES.ARC19
      const requirements = {
        useCase: TokenUseCase.NFT,
        requiresWideCompatibility: true,
      }
      const arc3Score = calculateUtilityScore(arc3Utility, requirements)
      const arc19Score = calculateUtilityScore(arc19Utility, requirements)
      expect(arc3Score).toBeGreaterThan(arc19Score)
    })

    it('should match preferred networks', () => {
      const utility = TOKEN_UTILITIES.ERC20
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        preferredNetworks: ['Ethereum', 'Arbitrum'],
      }
      const score = calculateUtilityScore(utility, requirements)
      expect(score).toBeGreaterThan(40)
    })
  })

  describe('getUtilityComparisons', () => {
    it('should return comparisons sorted by score', () => {
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        requiresCompliance: true,
        costSensitive: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      expect(comparisons.length).toBeGreaterThan(0)
      // Verify sorted descending
      for (let i = 0; i < comparisons.length - 1; i++) {
        expect(comparisons[i].score).toBeGreaterThanOrEqual(comparisons[i + 1].score)
      }
    })

    it('should recommend ARC-200 for MICA-compliant RWA tokens', () => {
      const requirements = {
        useCase: TokenUseCase.RWA_TOKEN,
        requiresCompliance: true,
        costSensitive: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      expect(comparisons[0].standard).toBe('ARC-200')
    })

    it('should recommend ARC-3 for NFTs without compliance needs', () => {
      const requirements = {
        useCase: TokenUseCase.NFT,
        requiresCompliance: false,
        costSensitive: true,
        requiresWideCompatibility: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      expect(comparisons[0].standard).toBe('ARC-3')
    })

    it('should include pros and cons in comparisons', () => {
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
      }
      const comparisons = getUtilityComparisons(requirements)
      comparisons.forEach((comparison) => {
        expect(Array.isArray(comparison.pros)).toBe(true)
        expect(Array.isArray(comparison.cons)).toBe(true)
      })
    })
  })

  describe('getRecommendedStandard', () => {
    it('should return the top-scoring standard', () => {
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        requiresCompliance: true,
      }
      const recommended = getRecommendedStandard(requirements)
      expect(recommended).toBeTruthy()
      expect(typeof recommended).toBe('string')
    })

    it('should recommend ERC-20 for EVM DeFi use cases', () => {
      const requirements = {
        useCase: TokenUseCase.GOVERNANCE_TOKEN,
        preferredNetworks: ['Ethereum'],
        requiresSmartContract: true,
      }
      const recommended = getRecommendedStandard(requirements)
      expect(recommended).toBe('ERC-20')
    })
  })

  describe('getStandardUtility', () => {
    it('should find utility by standard name', () => {
      const utility = getStandardUtility('ARC200')
      expect(utility).toBeDefined()
      expect(utility?.standard).toBe('ARC-200')
    })

    it('should handle case-insensitive lookup', () => {
      const utility = getStandardUtility('arc200')
      expect(utility).toBeDefined()
      expect(utility?.standard).toBe('ARC-200')
    })

    it('should handle hyphenated standard names', () => {
      const utility = getStandardUtility('ARC-200')
      expect(utility).toBeDefined()
      expect(utility?.standard).toBe('ARC-200')
    })

    it('should return undefined for unknown standards', () => {
      const utility = getStandardUtility('UNKNOWN')
      expect(utility).toBeUndefined()
    })
  })

  describe('getUseCaseDisplayName', () => {
    it('should return readable names for all use cases', () => {
      const useCases = Object.values(TokenUseCase)
      useCases.forEach((useCase) => {
        const displayName = getUseCaseDisplayName(useCase)
        expect(displayName).toBeTruthy()
        expect(displayName.length).toBeGreaterThan(0)
        expect(displayName).not.toBe(useCase) // Should be formatted
      })
    })

    it('should format NFT correctly', () => {
      const displayName = getUseCaseDisplayName(TokenUseCase.NFT)
      expect(displayName).toContain('NFT')
    })

    it('should format RWA correctly', () => {
      const displayName = getUseCaseDisplayName(TokenUseCase.RWA_TOKEN)
      expect(displayName).toContain('Real-World Asset')
    })
  })

  describe('getCostProfileDisplay', () => {
    it('should return display info for low cost', () => {
      const display = getCostProfileDisplay('low')
      expect(display.text).toBe('Low Cost')
      expect(display.color).toContain('green')
      expect(display.icon).toBeTruthy()
    })

    it('should return display info for medium cost', () => {
      const display = getCostProfileDisplay('medium')
      expect(display.text).toBe('Medium Cost')
      expect(display.color).toContain('yellow')
    })

    it('should return display info for high cost', () => {
      const display = getCostProfileDisplay('high')
      expect(display.text).toBe('High Cost')
      expect(display.color).toContain('red')
    })
  })

  describe('getWalletCompatibilityDisplay', () => {
    it('should return display info for excellent compatibility', () => {
      const display = getWalletCompatibilityDisplay('excellent')
      expect(display.text).toBe('Excellent')
      expect(display.color).toContain('green')
      expect(display.icon).toContain('⭐')
    })

    it('should return display info for good compatibility', () => {
      const display = getWalletCompatibilityDisplay('good')
      expect(display.text).toBe('Good')
      expect(display.color).toContain('blue')
    })

    it('should return display info for limited compatibility', () => {
      const display = getWalletCompatibilityDisplay('limited')
      expect(display.text).toBe('Limited')
      expect(display.color).toContain('orange')
    })
  })

  describe('TOKEN_UTILITIES data validation', () => {
    it('should have utility info for all major standards', () => {
      expect(TOKEN_UTILITIES.ARC200).toBeDefined()
      expect(TOKEN_UTILITIES.ARC3).toBeDefined()
      expect(TOKEN_UTILITIES.ARC19).toBeDefined()
      expect(TOKEN_UTILITIES.ARC69).toBeDefined()
      expect(TOKEN_UTILITIES.ASA).toBeDefined()
      expect(TOKEN_UTILITIES.ERC20).toBeDefined()
      expect(TOKEN_UTILITIES.ERC721).toBeDefined()
    })

    it('should have complete utility information for each standard', () => {
      Object.values(TOKEN_UTILITIES).forEach((utility) => {
        expect(utility.standard).toBeTruthy()
        expect(utility.description).toBeTruthy()
        expect(utility.useCases.length).toBeGreaterThan(0)
        expect(utility.features.length).toBeGreaterThan(0)
        expect(utility.networks.length).toBeGreaterThan(0)
        expect(utility.bestFor.length).toBeGreaterThan(0)
        expect(['low', 'medium', 'high']).toContain(utility.costProfile)
        expect(['excellent', 'good', 'limited']).toContain(utility.walletCompatibility)
      })
    })

    it('should mark ARC-200 as compliance-ready', () => {
      expect(TOKEN_UTILITIES.ARC200.complianceReady).toBe(true)
    })

    it('should have low cost profile for Algorand standards', () => {
      expect(TOKEN_UTILITIES.ARC200.costProfile).toBe('low')
      expect(TOKEN_UTILITIES.ARC3.costProfile).toBe('low')
      expect(TOKEN_UTILITIES.ASA.costProfile).toBe('low')
    })

    it('should have high cost profile for Ethereum standards', () => {
      expect(TOKEN_UTILITIES.ERC20.costProfile).toBe('high')
      expect(TOKEN_UTILITIES.ERC721.costProfile).toBe('high')
    })
  })
})
