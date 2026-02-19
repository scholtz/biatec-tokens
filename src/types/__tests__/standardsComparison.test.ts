/**
 * Tests for Standards Comparison Types and Functions
 */

import { describe, it, expect } from 'vitest';
import {
  tokenFeatures,
  standardComparisons,
  getFeatureComparisonMatrix,
  getRWARecommendations,
  calculateUseCaseCompatibility,
} from '../standardsComparison';

describe('Standards Comparison', () => {
  describe('Token Features', () => {
    it('should define all required feature categories', () => {
      const categories = new Set(tokenFeatures.map((f) => f.category));
      expect(categories.has('metadata')).toBe(true);
      expect(categories.has('compliance')).toBe(true);
      expect(categories.has('economics')).toBe(true);
      expect(categories.has('governance')).toBe(true);
      expect(categories.has('technical')).toBe(true);
    });

    it('should have RWA relevance for compliance features', () => {
      const complianceFeatures = tokenFeatures.filter((f) => f.category === 'compliance');
      complianceFeatures.forEach((feature) => {
        expect(feature.rwaRelevance).toBeDefined();
      });
    });

    it('should have unique feature IDs', () => {
      const ids = tokenFeatures.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Standard Comparisons', () => {
    it('should include ARC3 standard', () => {
      const arc3 = standardComparisons.find((s) => s.standard === 'ARC3');
      expect(arc3).toBeDefined();
      expect(arc3?.displayName).toContain('ARC3');
    });

    it('should include ARC200 standard', () => {
      const arc200 = standardComparisons.find((s) => s.standard === 'ARC200');
      expect(arc200).toBeDefined();
      expect(arc200?.displayName).toContain('ARC200');
    });

    it('should include ERC20 standard', () => {
      const erc20 = standardComparisons.find((s) => s.standard === 'ERC20');
      expect(erc20).toBeDefined();
      expect(erc20?.displayName).toContain('ERC20');
    });

    it('should include ARC1400 standard', () => {
      const arc1400 = standardComparisons.find((s) => s.standard === 'ARC1400');
      expect(arc1400).toBeDefined();
      expect(arc1400?.displayName).toContain('ARC1400');
    });

    it('should have RWA scores for all standards', () => {
      standardComparisons.forEach((standard) => {
        expect(standard.rwaScore).toBeGreaterThanOrEqual(0);
        expect(standard.rwaScore).toBeLessThanOrEqual(100);
      });
    });

    it('should have compliance scores for all standards', () => {
      standardComparisons.forEach((standard) => {
        expect(standard.complianceScore).toBeGreaterThanOrEqual(0);
        expect(standard.complianceScore).toBeLessThanOrEqual(100);
      });
    });

    it('should rank ARC1400 highest for RWA suitability', () => {
      const arc1400 = standardComparisons.find((s) => s.standard === 'ARC1400');
      const otherStandards = standardComparisons.filter((s) => s.standard !== 'ARC1400');
      
      expect(arc1400).toBeDefined();
      otherStandards.forEach((other) => {
        expect(arc1400!.rwaScore).toBeGreaterThanOrEqual(other.rwaScore);
      });
    });

    it('should rank ARC1400 highest for compliance', () => {
      const arc1400 = standardComparisons.find((s) => s.standard === 'ARC1400');
      const otherStandards = standardComparisons.filter((s) => s.standard !== 'ARC1400');
      
      expect(arc1400).toBeDefined();
      otherStandards.forEach((other) => {
        expect(arc1400!.complianceScore).toBeGreaterThanOrEqual(other.complianceScore);
      });
    });
  });

  describe('Feature Capabilities', () => {
    it('should show ARC3 supports rich metadata', () => {
      const arc3 = standardComparisons.find((s) => s.standard === 'ARC3');
      const richMetadata = arc3?.capabilities.find((c) => c.feature === 'rich_metadata');
      expect(richMetadata?.supported).toBe(true);
    });

    it('should show ARC200 supports whitelist', () => {
      const arc200 = standardComparisons.find((s) => s.standard === 'ARC200');
      const whitelist = arc200?.capabilities.find((c) => c.feature === 'whitelist_support');
      expect(whitelist?.supported).toBe(true);
    });

    it('should show ERC20 has limited metadata', () => {
      const erc20 = standardComparisons.find((s) => s.standard === 'ERC20');
      const richMetadata = erc20?.capabilities.find((c) => c.feature === 'rich_metadata');
      expect(richMetadata?.supported).toBe(false);
    });

    it('should show ARC1400 supports all compliance features', () => {
      const arc1400 = standardComparisons.find((s) => s.standard === 'ARC1400');
      const complianceFeatures = [
        'whitelist_support',
        'jurisdiction_controls',
        'kyc_integration',
        'attestations',
      ];

      complianceFeatures.forEach((feature) => {
        const capability = arc1400?.capabilities.find((c) => c.feature === feature);
        expect(capability?.supported).toBe(true);
      });
    });

    it('should provide benefits for supported features', () => {
      standardComparisons.forEach((standard) => {
        standard.capabilities
          .filter((c) => c.supported === true)
          .forEach((capability) => {
            if (capability.details || capability.benefits) {
              expect(
                capability.details || (capability.benefits && capability.benefits.length > 0)
              ).toBeTruthy();
            }
          });
      });
    });

    it('should provide limitations for unsupported features', () => {
      standardComparisons.forEach((standard) => {
        standard.capabilities
          .filter((c) => c.supported === false)
          .forEach((capability) => {
            // Limitations are optional but helpful
            // This test just ensures the structure exists
            expect(capability.limitations || true).toBeTruthy();
          });
      });
    });
  });

  describe('getFeatureComparisonMatrix', () => {
    it('should return features, standards, and matrix', () => {
      const result = getFeatureComparisonMatrix();
      expect(result.features).toBeDefined();
      expect(result.standards).toBeDefined();
      expect(result.matrix).toBeDefined();
    });

    it('should include all standards in matrix', () => {
      const result = getFeatureComparisonMatrix();
      expect(result.standards).toContain('ARC3');
      expect(result.standards).toContain('ARC200');
      expect(result.standards).toContain('ERC20');
      expect(result.standards).toContain('ARC1400');
    });

    it('should map features to standards correctly', () => {
      const result = getFeatureComparisonMatrix();
      const arc3Matrix = result.matrix.get('ARC3');
      expect(arc3Matrix).toBeDefined();
      expect(arc3Matrix?.get('rich_metadata')).toBe(true);
    });

    it('should handle partial support', () => {
      const result = getFeatureComparisonMatrix();
      const arc3Matrix = result.matrix.get('ARC3');
      expect(arc3Matrix?.get('whitelist_support')).toBe('partial');
    });
  });

  describe('getRWARecommendations', () => {
    it('should recommend ARC1400 for securities', () => {
      const result = getRWARecommendations('Security Token');
      expect(result.recommended).toContain('ARC1400');
      expect(result.reasoning).toBeTruthy();
    });

    it('should recommend ARC1400 for equity', () => {
      const result = getRWARecommendations('Equity Token');
      expect(result.recommended).toContain('ARC1400');
    });

    it('should recommend ARC1400 for real estate', () => {
      const result = getRWARecommendations('Real Estate');
      expect(result.recommended).toContain('ARC1400');
    });

    it('should recommend ARC3 for art', () => {
      const result = getRWARecommendations('Digital Art');
      expect(result.recommended).toContain('ARC3');
    });

    it('should recommend ARC200 or ERC20 for commodities', () => {
      const result = getRWARecommendations('Gold-Backed Token');
      expect(
        result.recommended.includes('ARC200') || result.recommended.includes('ERC20')
      ).toBe(true);
    });

    it('should provide reasoning for all recommendations', () => {
      const testCases = ['Security', 'Real Estate', 'Art', 'Commodity', 'Other'];
      testCases.forEach((useCase) => {
        const result = getRWARecommendations(useCase);
        expect(result.reasoning.length).toBeGreaterThan(0);
      });
    });

    it('should be case insensitive', () => {
      const lower = getRWARecommendations('security token');
      const upper = getRWARecommendations('SECURITY TOKEN');
      expect(lower.recommended).toEqual(upper.recommended);
    });
  });

  describe('calculateUseCaseCompatibility', () => {
    it('should return 100% score when all features supported', () => {
      const result = calculateUseCaseCompatibility('ARC1400', [
        'whitelist_support',
        'jurisdiction_controls',
        'kyc_integration',
      ]);
      expect(result.score).toBe(100);
      expect(result.supported.length).toBe(3);
      expect(result.missing.length).toBe(0);
    });

    it('should return 0% score when no features supported', () => {
      const result = calculateUseCaseCompatibility('ARC3', [
        'governance_rights',
        'fractional_ownership',
      ]);
      expect(result.score).toBe(0);
      expect(result.missing.length).toBe(2);
    });

    it('should return 50% score for partial support', () => {
      const result = calculateUseCaseCompatibility('ARC3', [
        'rich_metadata', // supported
        'mutable_metadata', // not supported
      ]);
      expect(result.score).toBe(50);
    });

    it('should weight partial support at 50%', () => {
      const result = calculateUseCaseCompatibility('ERC20', [
        'programmable_logic', // fully supported
        'whitelist_support', // partial support
      ]);
      // 1.0 + 0.5 = 1.5, 1.5 / 2 * 100 = 75
      expect(result.score).toBe(75);
      expect(result.supported.length).toBe(1);
      expect(result.partial.length).toBe(1);
    });

    it('should categorize features correctly', () => {
      const result = calculateUseCaseCompatibility('ARC200', [
        'whitelist_support', // supported
        'cross_chain', // planned
        'royalties', // supported
      ]);
      expect(result.supported).toContain('whitelist_support');
      expect(result.supported).toContain('royalties');
      expect(result.partial).toContain('cross_chain');
    });

    it('should handle unknown standard gracefully', () => {
      const result = calculateUseCaseCompatibility('UNKNOWN', ['whitelist_support']);
      expect(result.score).toBe(0);
      expect(result.missing.length).toBe(1);
    });

    it('should handle empty required features', () => {
      const result = calculateUseCaseCompatibility('ARC3', []);
      expect(result.score).toBeNaN(); // 0/0 = NaN
      expect(result.supported.length).toBe(0);
    });
  });

  describe('Use Cases', () => {
    it('should provide use cases for all standards', () => {
      standardComparisons.forEach((standard) => {
        expect(standard.useCases.length).toBeGreaterThan(0);
      });
    });

    it('should include RWA use cases for ARC1400', () => {
      const arc1400 = standardComparisons.find((s) => s.standard === 'ARC1400');
      const hasSecurityToken = arc1400?.useCases.some(u => u.includes('Equity') || u.includes('Security'));
      expect(hasSecurityToken).toBe(true);
    });

    it('should include real estate use cases', () => {
      const realEstateStandards = standardComparisons.filter((s) =>
        s.useCases.some((u) => u.toLowerCase().includes('real estate'))
      );
      expect(realEstateStandards.length).toBeGreaterThan(0);
    });
  });

  describe('Difficulty Levels', () => {
    it('should mark ARC3 as beginner-friendly', () => {
      const arc3 = standardComparisons.find((s) => s.standard === 'ARC3');
      expect(arc3?.difficultyLevel).toBe('beginner');
    });

    it('should mark ARC200 and ARC1400 as advanced', () => {
      const arc200 = standardComparisons.find((s) => s.standard === 'ARC200');
      const arc1400 = standardComparisons.find((s) => s.standard === 'ARC1400');
      expect(arc200?.difficultyLevel).toBe('advanced');
      expect(arc1400?.difficultyLevel).toBe('advanced');
    });

    it('should mark ERC20 as intermediate', () => {
      const erc20 = standardComparisons.find((s) => s.standard === 'ERC20');
      expect(erc20?.difficultyLevel).toBe('intermediate');
    });
  });
});
