export interface StripeProduct {
  id: string
  priceId: string
  name: string
  description: string
  mode: 'payment' | 'subscription'
  price: number
  currency: string
  interval?: 'month' | 'year'
  tier?: 'basic' | 'professional' | 'enterprise'
  features?: string[]
  tokenStandards?: string[]
  networks?: string[]
  tokenLimit?: number | 'unlimited'
  complianceFeatures?: string[]
  support?: string
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_basic',
    priceId: 'price_basic_monthly',
    name: 'Basic Plan',
    description: 'Essential token creation for small teams',
    mode: 'subscription',
    price: 29.00,
    currency: 'usd',
    interval: 'month',
    tier: 'basic',
    tokenLimit: 10,
    tokenStandards: ['ASA', 'ARC3', 'ARC19'],
    networks: ['Algorand Testnet', 'VOI Testnet'],
    features: [
      'Up to 10 tokens per month',
      'Basic token standards (ASA, ARC3, ARC19)',
      'Testnet deployment only',
      'Email support',
      'Basic compliance templates'
    ],
    complianceFeatures: ['Basic MICA templates', 'Standard documentation'],
    support: 'Email support (48h response)'
  },
  {
    id: 'prod_professional',
    priceId: 'price_professional_monthly',
    name: 'Professional Plan',
    description: 'Advanced features for growing businesses',
    mode: 'subscription',
    price: 99.00,
    currency: 'usd',
    interval: 'month',
    tier: 'professional',
    tokenLimit: 'unlimited',
    tokenStandards: ['ASA', 'ARC3', 'ARC19', 'ARC69', 'ARC200', 'ERC20'],
    networks: ['Algorand Mainnet', 'Algorand Testnet', 'VOI', 'Ethereum Sepolia', 'Arbitrum Sepolia'],
    features: [
      'Unlimited token creation',
      'All AVM standards + ERC20',
      'Mainnet and testnet deployment',
      'Priority support',
      'Advanced compliance tools',
      'API access',
      'Batch deployment'
    ],
    complianceFeatures: [
      'Full MICA compliance suite',
      'KYC/AML templates',
      'Automated compliance monitoring',
      'Audit trails'
    ],
    support: 'Priority support (24h response)'
  },
  {
    id: 'prod_enterprise',
    priceId: 'price_enterprise_monthly',
    name: 'Enterprise Plan',
    description: 'Complete solution for regulated issuance',
    mode: 'subscription',
    price: 299.00,
    currency: 'usd',
    interval: 'month',
    tier: 'enterprise',
    tokenLimit: 'unlimited',
    tokenStandards: ['ASA', 'ARC3', 'ARC19', 'ARC69', 'ARC200', 'ARC72', 'ERC20', 'ERC721'],
    networks: [
      'Algorand Mainnet',
      'Algorand Testnet',
      'VOI',
      'Aramid',
      'Ethereum Mainnet',
      'Arbitrum',
      'Base',
      'All testnets'
    ],
    features: [
      'Unlimited token creation',
      'All token standards (AVM + EVM)',
      'All networks including mainnet',
      'Dedicated support',
      'White-label options',
      'Custom compliance workflows',
      'Advanced API access',
      'Batch deployment',
      'Custom integrations'
    ],
    complianceFeatures: [
      'Full MICA compliance suite',
      'Advanced KYC/AML integration',
      'Real-time compliance monitoring',
      'Automated reporting',
      'Custom compliance workflows',
      'Regulatory audit support',
      'Legal documentation support'
    ],
    support: 'Dedicated support (4h response) + account manager'
  }
]

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id)
}

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId)
}