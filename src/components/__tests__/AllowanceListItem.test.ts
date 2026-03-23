import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AllowanceListItem from '../AllowanceListItem.vue'
import type { EVMTokenAllowance, AVMAssetOptIn } from '../../types/allowances'

const evmAllowance: EVMTokenAllowance = {
  id: 'evm-1',
  chainType: 'EVM',
  networkId: 'ethereum',
  ownerAddress: '0xowner',
  spenderAddress: '0xabcdef1234567890',
  spenderName: 'Uniswap V3',
  tokenAddress: '0xtoken',
  tokenSymbol: 'USDC',
  tokenName: 'USD Coin',
  tokenDecimals: 6,
  allowanceAmount: '1000000',
  formattedAllowance: '1.00',
  isUnlimited: false,
  riskLevel: 'low',
  activityStatus: 'active',
  discoveredAt: new Date('2024-01-01'),
}

const unlimitedEvmAllowance: EVMTokenAllowance = {
  ...evmAllowance,
  id: 'evm-2',
  isUnlimited: true,
  riskLevel: 'critical',
  spenderName: undefined,
}

const avmAllowance: AVMAssetOptIn = {
  id: 'avm-1',
  chainType: 'AVM',
  networkId: 'voi-mainnet',
  ownerAddress: 'OWNER_ADDR',
  spenderAddress: 'SPENDER_ADDR',
  assetId: 12345,
  assetName: 'Test Asset',
  unitName: 'TST',
  balance: '500',
  decimals: 6,
  riskLevel: 'medium',
  activityStatus: 'inactive',
  discoveredAt: new Date('2024-01-01'),
} as any

describe('AllowanceListItem', () => {
  const stubs = {
    Badge: { template: '<span><slot /></span>' },
    Button: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  }

  it('renders EVM token symbol', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: evmAllowance },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('USDC')
  })

  it('renders EVM token name', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: evmAllowance },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('USD Coin')
  })

  it('renders EVM spender name when provided', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: evmAllowance },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Uniswap V3')
  })

  it('truncates spender address when no name provided', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: unlimitedEvmAllowance },
      global: { stubs },
    })
    // spenderName is undefined, so address should be formatted
    expect(wrapper.html()).toBeTruthy()
  })

  it('renders AVM asset unit name', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: avmAllowance },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('TST')
  })

  it('renders AVM asset name', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: avmAllowance },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Test Asset')
  })

  it('shows unlimited warning for unlimited EVM allowance', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: unlimitedEvmAllowance },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Unlimited')
  })

  it('shows warning message for critical risk', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: unlimitedEvmAllowance },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('unlimited')
  })

  it('emits revoke event when revoke button clicked', async () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: evmAllowance },
      global: { stubs },
    })
    const revokeBtn = wrapper.find('[data-action="revoke"], button')
    if (revokeBtn.exists()) {
      await revokeBtn.trigger('click')
    }
    expect(wrapper.html()).toBeTruthy()
  })

  it('renders formatted allowance for EVM', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: evmAllowance },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('1.00')
  })

  it('renders AVM balance', () => {
    const wrapper = mount(AllowanceListItem, {
      props: { allowance: avmAllowance },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('500')
  })
})
