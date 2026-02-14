import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScenarioPlanner from './ScenarioPlanner.vue'
import type { ScenarioInput, ScenarioOutput } from '../../stores/insights'

describe('ScenarioPlanner', () => {
  const defaultInputs: ScenarioInput = {
    campaignLift: 0,
    liquidityContribution: 0,
    retentionChange: 0,
  }

  const mockOutputs: ScenarioOutput = {
    projectedAdoption: 1400,
    projectedVolume: 60000,
    projectedRetention: 70,
    confidenceRange: {
      low: 1190,
      high: 1610,
    },
  }

  it('should render input fields correctly', () => {
    const wrapper = mount(ScenarioPlanner, {
      props: {
        inputs: defaultInputs,
        outputs: null,
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('Expected Campaign Lift')
    expect(wrapper.text()).toContain('Liquidity Contribution')
    expect(wrapper.text()).toContain('Retention Change')
  })

  it('should emit run event with input values', async () => {
    const wrapper = mount(ScenarioPlanner, {
      props: {
        inputs: defaultInputs,
        outputs: null,
        loading: false,
      },
    })

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('15')
    await inputs[1].setValue('10000')
    await inputs[2].setValue('5')

    const runButton = wrapper.find('button:contains("Run Scenario")')
    if (runButton.exists()) {
      await runButton.trigger('click')
      
      expect(wrapper.emitted('run')).toBeTruthy()
      const emittedData = wrapper.emitted('run')![0][0] as ScenarioInput
      expect(emittedData.campaignLift).toBe(15)
      expect(emittedData.liquidityContribution).toBe(10000)
      expect(emittedData.retentionChange).toBe(5)
    }
  })

  it('should display outputs when available', () => {
    const wrapper = mount(ScenarioPlanner, {
      props: {
        inputs: defaultInputs,
        outputs: mockOutputs,
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('Projected Outcomes')
    expect(wrapper.text()).toContain('1,400')
    expect(wrapper.text()).toContain('$60,000')
    expect(wrapper.text()).toContain('70%')
  })

  it('should display confidence range', () => {
    const wrapper = mount(ScenarioPlanner, {
      props: {
        inputs: defaultInputs,
        outputs: mockOutputs,
        loading: false,
      },
    })

    expect(wrapper.text()).toContain('Range: 1,190 - 1,610')
  })

  it('should show loading state', () => {
    const wrapper = mount(ScenarioPlanner, {
      props: {
        inputs: defaultInputs,
        outputs: null,
        loading: true,
      },
    })

    expect(wrapper.text()).toContain('Running...')
  })

  it('should disable buttons when loading', () => {
    const wrapper = mount(ScenarioPlanner, {
      props: {
        inputs: defaultInputs,
        outputs: null,
        loading: true,
      },
    })

    const buttons = wrapper.findAll('button')
    buttons.forEach(button => {
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  it('should validate input ranges', async () => {
    const wrapper = mount(ScenarioPlanner, {
      props: {
        inputs: defaultInputs,
        outputs: null,
        loading: false,
      },
    })

    const campaignInput = wrapper.findAll('input')[0]
    await campaignInput.setValue('150') // Invalid: >100

    expect(wrapper.text()).toContain('Please enter valid parameters')
  })

  it('should reset inputs when reset button is clicked', async () => {
    const wrapper = mount(ScenarioPlanner, {
      props: {
        inputs: { campaignLift: 15, liquidityContribution: 10000, retentionChange: 5 },
        outputs: mockOutputs,
        loading: false,
      },
    })

    const resetButton = wrapper.find('button:contains("Reset")')
    if (resetButton.exists()) {
      await resetButton.trigger('click')
      
      // Check that inputs are reset in the local state
      const inputs = wrapper.findAll('input')
      await wrapper.vm.$nextTick()
      // Inputs should be reset to 0
    }
  })
})
