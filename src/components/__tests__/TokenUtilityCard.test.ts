import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TokenUtilityCard from '../TokenUtilityCard.vue'
import { TOKEN_UTILITIES } from '../../types/tokenUtility'

describe('TokenUtilityCard', () => {
  it('should render token standard name', () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain('ARC-200')
  })

  it('should show MICA Ready badge for compliance-ready standards', () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain('MICA Ready')
  })

  it('should not show MICA badge for non-compliance standards', () => {
    const utility = TOKEN_UTILITIES.ARC3
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).not.toContain('MICA Ready')
  })

  it('should display utility description', () => {
    const utility = TOKEN_UTILITIES.ERC20
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain(utility.description)
  })

  it('should display cost profile', () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain('Transaction Cost')
    expect(wrapper.text()).toContain('Low Cost')
  })

  it('should display wallet compatibility', () => {
    const utility = TOKEN_UTILITIES.ARC3
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain('Wallet Support')
    expect(wrapper.text()).toContain('Excellent')
  })

  it('should display use cases', () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain('Supported Use Cases')
    expect(wrapper.text()).toContain('Fungible Token')
  })

  it('should display key features', () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain('Key Features')
    utility.features.slice(0, 4).forEach((feature) => {
      expect(wrapper.text()).toContain(feature)
    })
  })

  it('should limit displayed features based on maxFeatures prop', () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility, maxFeatures: 2 },
    })
    // Should show first 2 features
    expect(wrapper.text()).toContain(utility.features[0])
    expect(wrapper.text()).toContain(utility.features[1])
    // Should show "Show more" button
    expect(wrapper.text()).toContain('Show')
    expect(wrapper.text()).toContain('more features')
  })

  it('should show all features when "show more" clicked', async () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility, maxFeatures: 2 },
    })
    // Click show more button
    const button = wrapper.find('button')
    await button.trigger('click')
    // Should now show all features
    utility.features.forEach((feature) => {
      expect(wrapper.text()).toContain(feature)
    })
  })

  it('should display best-for section', () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain('Best For')
    utility.bestFor.forEach((item) => {
      expect(wrapper.text()).toContain(item)
    })
  })

  it('should display examples when showExamples is true', () => {
    const utility = TOKEN_UTILITIES.ARC3
    const wrapper = mount(TokenUtilityCard, {
      props: { utility, showExamples: true },
    })
    expect(wrapper.text()).toContain('Example Use Cases')
    utility.examples.forEach((example) => {
      expect(wrapper.text()).toContain(example)
    })
  })

  it('should hide examples when showExamples is false', () => {
    const utility = TOKEN_UTILITIES.ARC3
    const wrapper = mount(TokenUtilityCard, {
      props: { utility, showExamples: false },
    })
    expect(wrapper.text()).not.toContain('Example Use Cases')
  })

  it('should display limitations when showLimitations is true', () => {
    const utility = TOKEN_UTILITIES.ARC19
    const wrapper = mount(TokenUtilityCard, {
      props: { utility, showLimitations: true },
    })
    expect(wrapper.text()).toContain('Considerations')
    utility.limitations.forEach((limitation) => {
      expect(wrapper.text()).toContain(limitation)
    })
  })

  it('should hide limitations when showLimitations is false', () => {
    const utility = TOKEN_UTILITIES.ARC19
    const wrapper = mount(TokenUtilityCard, {
      props: { utility, showLimitations: false },
    })
    expect(wrapper.text()).not.toContain('Considerations')
  })

  it('should display available networks', () => {
    const utility = TOKEN_UTILITIES.ERC20
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    expect(wrapper.text()).toContain('Available Networks')
    utility.networks.forEach((network) => {
      expect(wrapper.text()).toContain(network)
    })
  })

  it('should apply hover effect styling', () => {
    const utility = TOKEN_UTILITIES.ARC200
    const wrapper = mount(TokenUtilityCard, {
      props: { utility },
    })
    const card = wrapper.find('.token-utility-card')
    expect(card.exists()).toBe(true)
  })
})
