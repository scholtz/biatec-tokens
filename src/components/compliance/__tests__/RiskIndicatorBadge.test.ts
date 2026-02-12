import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RiskIndicatorBadge from '../RiskIndicatorBadge.vue';

describe('RiskIndicatorBadge Component', () => {
  describe('Low Risk', () => {
    it('should display "Low Risk" with green styling for low risk level', () => {
      const wrapper = mount(RiskIndicatorBadge, {
        props: {
          riskLevel: 'low',
        },
      });

      expect(wrapper.text()).toContain('Low Risk');
      expect(wrapper.find('div').classes()).toContain('text-green-400');
      expect(wrapper.find('i').classes()).toContain('pi-check-circle');
    });
  });

  describe('Medium Risk', () => {
    it('should display "Medium Risk" with yellow styling for medium risk level', () => {
      const wrapper = mount(RiskIndicatorBadge, {
        props: {
          riskLevel: 'medium',
        },
      });

      expect(wrapper.text()).toContain('Medium Risk');
      expect(wrapper.find('div').classes()).toContain('text-yellow-400');
      expect(wrapper.find('i').classes()).toContain('pi-exclamation-triangle');
    });
  });

  describe('High Risk', () => {
    it('should display "High Risk" with red styling for high risk level', () => {
      const wrapper = mount(RiskIndicatorBadge, {
        props: {
          riskLevel: 'high',
        },
      });

      expect(wrapper.text()).toContain('High Risk');
      expect(wrapper.find('div').classes()).toContain('text-red-400');
      expect(wrapper.find('i').classes()).toContain('pi-times-circle');
    });
  });

  describe('Visual Styling', () => {
    it('should have proper badge styling classes', () => {
      const wrapper = mount(RiskIndicatorBadge, {
        props: {
          riskLevel: 'low',
        },
      });

      const badge = wrapper.find('div');
      expect(badge.classes()).toContain('px-3');
      expect(badge.classes()).toContain('py-1');
      expect(badge.classes()).toContain('rounded-full');
      expect(badge.classes()).toContain('text-xs');
      expect(badge.classes()).toContain('font-semibold');
    });

    it('should contain icon and text elements', () => {
      const wrapper = mount(RiskIndicatorBadge, {
        props: {
          riskLevel: 'medium',
        },
      });

      expect(wrapper.find('i').exists()).toBe(true);
      expect(wrapper.find('span').exists()).toBe(true);
    });
  });
});
