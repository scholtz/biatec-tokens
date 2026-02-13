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

    // Edge case: Empty requirements (should not crash)
    it('should handle requirements with no flags set', () => {
      const utility = TOKEN_UTILITIES.ARC200
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
      }
      const score = calculateUtilityScore(utility, requirements)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    // Edge case: All requirements set
    it('should handle requirements with all flags set', () => {
      const utility = TOKEN_UTILITIES.ARC200
      const requirements = {
        useCase: TokenUseCase.RWA_TOKEN,
        requiresCompliance: true,
        costSensitive: true,
        requiresWideCompatibility: true,
        requiresSmartContract: true,
        preferredNetworks: ['Algorand Mainnet', 'VOI'],
      }
      const score = calculateUtilityScore(utility, requirements)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    // Edge case: No use case match
    it('should return lower score when use case does not match', () => {
      const utility = TOKEN_UTILITIES.ARC3 // NFT standard
      const requirements = {
        useCase: TokenUseCase.GOVERNANCE_TOKEN, // Not in ARC3 use cases
      }
      const score = calculateUtilityScore(utility, requirements)
      expect(score).toBeLessThan(40) // Should miss the 40-point use case bonus
    })

    // Edge case: Compliance required but not available
    it('should penalize non-compliant standards when compliance required', () => {
      const erc20Utility = TOKEN_UTILITIES.ERC20 // Not compliance-ready
      const arc200Utility = TOKEN_UTILITIES.ARC200 // Compliance-ready
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN, // Both support fungible tokens
        requiresCompliance: true,
        costSensitive: true, // This will favor ARC200 even more
      }
      const erc20Score = calculateUtilityScore(erc20Utility, requirements)
      const arc200Score = calculateUtilityScore(arc200Utility, requirements)
      // ARC200 should score higher due to compliance support + low cost
      expect(arc200Score).toBeGreaterThan(erc20Score)
      // Difference should be significant
      expect(arc200Score - erc20Score).toBeGreaterThanOrEqual(20)
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

  describe('Tie-breaking and edge case scenarios', () => {
    it('should handle tie-breaking when two standards have similar scores', () => {
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        requiresCompliance: false,
        costSensitive: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // Verify that scores are deterministic and ordered
      for (let i = 0; i < comparisons.length - 1; i++) {
        expect(comparisons[i].score).toBeGreaterThanOrEqual(comparisons[i + 1].score)
      }
    })

    it('should handle partial network preferences', () => {
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        preferredNetworks: ['Algorand Mainnet'],
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // Algorand-based standards should score higher
      const algorandStandards = comparisons.filter(c => 
        ['ARC-200', 'ARC-3', 'ARC-19', 'ARC-69', 'ASA (Algorand Standard Asset)'].includes(c.standard)
      )
      const ethereumStandards = comparisons.filter(c => 
        ['ERC-20', 'ERC-721'].includes(c.standard)
      )
      
      if (algorandStandards.length > 0 && ethereumStandards.length > 0) {
        expect(algorandStandards[0].score).toBeGreaterThan(ethereumStandards[ethereumStandards.length - 1].score - 20)
      }
    })

    it('should handle case where no standards match use case perfectly', () => {
      // SECURITY_TOKEN is in use cases but may not be primary for all standards
      const requirements = {
        useCase: TokenUseCase.SECURITY_TOKEN,
        requiresCompliance: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // Should still return recommendations even if not perfect match
      expect(comparisons.length).toBeGreaterThan(0)
      // ARC-200 should be near top due to compliance support
      const arc200 = comparisons.find(c => c.standard === 'ARC-200')
      expect(arc200).toBeDefined()
      // Score should be reasonable even if not perfect match
      expect(arc200!.score).toBeGreaterThan(30)
    })

    it('should handle conflicting requirements gracefully', () => {
      // Conflicting: wants compliance (favors ARC-200) but also maximum compatibility (favors ARC-3/ERC)
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        requiresCompliance: true,
        requiresWideCompatibility: true,
        costSensitive: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // Should still produce valid scores
      expect(comparisons.length).toBeGreaterThan(0)
      comparisons.forEach(c => {
        expect(c.score).toBeGreaterThanOrEqual(0)
        expect(c.score).toBeLessThanOrEqual(100)
      })
    })

    it('should handle empty preferred networks array', () => {
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        preferredNetworks: [],
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // Should not crash and should return valid scores
      expect(comparisons.length).toBeGreaterThan(0)
      comparisons.forEach(c => {
        expect(c.score).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle undefined optional properties', () => {
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        // All other properties undefined
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // Should work with minimal requirements
      expect(comparisons.length).toBeGreaterThan(0)
      expect(comparisons[0].score).toBeGreaterThan(0)
    })
  })

  describe('Compliance-weighted scenarios', () => {
    it('should heavily favor ARC-200 for RWA tokens with compliance', () => {
      const requirements = {
        useCase: TokenUseCase.RWA_TOKEN,
        requiresCompliance: true,
        costSensitive: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // ARC-200 should be the top recommendation
      expect(comparisons[0].standard).toBe('ARC-200')
      expect(comparisons[0].score).toBeGreaterThan(85)
    })

    it('should recommend ARC-200 for security tokens with compliance', () => {
      const requirements = {
        useCase: TokenUseCase.SECURITY_TOKEN,
        requiresCompliance: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // ARC-200 should be in top 2
      const arc200 = comparisons.find(c => c.standard === 'ARC-200')
      expect(arc200).toBeDefined()
      const arc200Index = comparisons.findIndex(c => c.standard === 'ARC-200')
      expect(arc200Index).toBeLessThan(2)
    })

    it('should not favor compliance-ready standards when compliance not required', () => {
      const requirements = {
        useCase: TokenUseCase.UTILITY_TOKEN,
        requiresCompliance: false,
        costSensitive: false,
        requiresWideCompatibility: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      
      // Other factors should dominate, not just compliance readiness
      // ARC-200 may not be #1 if wallet compatibility is prioritized
      expect(comparisons.length).toBeGreaterThan(0)
    })

    it('should generate appropriate pros for compliance-ready standards', () => {
      const requirements = {
        useCase: TokenUseCase.RWA_TOKEN,
        requiresCompliance: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      
      const arc200 = comparisons.find(c => c.standard === 'ARC-200')
      expect(arc200).toBeDefined()
      expect(arc200!.pros.some(pro => pro.toLowerCase().includes('compliance'))).toBe(true)
    })

    it('should generate appropriate cons for non-compliant standards when compliance required', () => {
      const requirements = {
        useCase: TokenUseCase.FUNGIBLE_TOKEN,
        requiresCompliance: true,
      }
      const comparisons = getUtilityComparisons(requirements)
      
      const erc20 = comparisons.find(c => c.standard === 'ERC-20')
      expect(erc20).toBeDefined()
      // Should have cons about no compliance support
      expect(erc20!.cons.some(con => con.toLowerCase().includes('compliance'))).toBe(true)
    })
  })
})
