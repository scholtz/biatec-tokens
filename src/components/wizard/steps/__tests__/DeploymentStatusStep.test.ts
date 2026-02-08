import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DeploymentStatusStep from '../DeploymentStatusStep.vue'
import WizardStep from '../../WizardStep.vue'

describe('DeploymentStatusStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('Timeline Rendering', () => {
    it('should render deployment timeline', () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('Deployment Progress')
    })

    it('should display all deployment stages', () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('Preparing Token')
      expect(wrapper.text()).toContain('Uploading Metadata')
      expect(wrapper.text()).toContain('Deploying to Blockchain')
      expect(wrapper.text()).toContain('Confirming Transaction')
      expect(wrapper.text()).toContain('Indexing Token')
    })

    it('should show stage descriptions', () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('Validating token parameters')
      expect(wrapper.text()).toContain('Storing token metadata')
      expect(wrapper.text()).toContain('Submitting transaction')
    })
  })

  describe('Status Progression', () => {
    it('should start with pending status', () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      expect(vm.deploymentStatus).toBe('pending')
    })

    it('should show in-progress status during deployment', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      await vm.startDeployment()
      await wrapper.vm.$nextTick()

      expect(vm.deploymentStatus).toBe('in-progress')
    })

    it('should display progress bar for in-progress stage', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStages[0].status = 'in-progress'
      vm.deploymentStages[0].progress = 50
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('50%')
    })

    it('should show check icon for completed stages', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStages[0].status = 'completed'
      await wrapper.vm.$nextTick()

      const checkIcon = wrapper.find('.pi-check')
      expect(checkIcon.exists()).toBe(true)
    })

    it('should show spinner for in-progress stages', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStages[0].status = 'in-progress'
      await wrapper.vm.$nextTick()

      const spinner = wrapper.find('.pi-spinner')
      expect(spinner.exists()).toBe(true)
    })
  })

  describe('Success State', () => {
    it('should display success message when completed', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'completed'
      vm.deploymentResult = {
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        network: 'VOI',
        standard: 'ASA',
        assetId: '123456',
        txId: 'ABC123XYZ',
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Token Deployed Successfully!')
    })

    it('should display deployment result details', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'completed'
      vm.deploymentResult = {
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        network: 'VOI',
        standard: 'ASA',
        assetId: '123456',
        txId: 'ABC123',
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Test Token')
      expect(wrapper.text()).toContain('TEST')
      expect(wrapper.text()).toContain('VOI')
      expect(wrapper.text()).toContain('123456')
    })

    it('should show Download Summary button', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'completed'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Download Summary')
    })

    it('should show View on Explorer button', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'completed'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('View on Explorer')
    })
  })

  describe('Error State and Recovery', () => {
    it('should display error message when deployment fails', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'failed'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Deployment Failed')
    })

    it('should show retry button on failure', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'failed'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Retry Deployment')
    })

    it('should show save draft button on failure', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'failed'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Save Draft and Exit')
    })

    it('should show contact support button on failure', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'failed'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Contact Support')
    })

    it('should display error details for failed stage', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStages[0].status = 'failed'
      vm.deploymentStages[0].error = 'Connection timeout'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Connection timeout')
    })

    it('should show X icon for failed stages', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStages[0].status = 'failed'
      await wrapper.vm.$nextTick()

      const failIcon = wrapper.find('.pi-times')
      expect(failIcon.exists()).toBe(true)
    })
  })

  describe('In Progress State', () => {
    it('should show in-progress notice', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'in-progress'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Deployment in Progress')
    })

    it('should display estimated time', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'in-progress'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('30-60 seconds')
    })
  })

  describe('Helpful Information', () => {
    it('should display what happens next section', () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('What Happens Next?')
    })

    it('should list post-deployment benefits', () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      expect(wrapper.text()).toContain('recorded on the blockchain')
      expect(wrapper.text()).toContain('view and manage your token')
      expect(wrapper.text()).toContain('email confirmation')
    })
  })

  describe('Interactive Features', () => {
    it('should call retryDeployment when retry button clicked', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'failed'
      await wrapper.vm.$nextTick()

      const retryButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Retry Deployment')
      )
      
      if (retryButton) {
        await retryButton.trigger('click')
        expect(vm.deploymentStatus).toBe('in-progress')
      }
    })

    it('should provide copy functionality for asset ID', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          components: { WizardStep },
        },
      })

      const vm = wrapper.vm as any
      vm.deploymentStatus = 'completed'
      vm.deploymentResult.assetId = '123456'
      await wrapper.vm.$nextTick()

      const copyButtons = wrapper.findAll('button').filter(btn => 
        btn.find('.pi-copy').exists()
      )
      
      expect(copyButtons.length).toBeGreaterThan(0)
    })
  })
})
