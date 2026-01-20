# Backend API Integration Examples

This document provides practical examples of using the BiatecTokensApi backend integration.

## Basic Setup

```typescript
import { tokenDeploymentService } from '@/services/TokenDeploymentService';
import { apiClient } from '@/services/BiatecTokensApiClient';
import { TokenStandard, validateTokenDeploymentRequest } from '@/types/api';
```

## Example 1: Deploy an ERC20 Token

```typescript
async function deployERC20Token() {
  try {
    // Define the token
    const request = {
      standard: TokenStandard.ERC20,
      name: 'My Company Token',
      symbol: 'MCT',
      decimals: 18,
      totalSupply: '1000000000', // 1 billion tokens
      walletAddress: '0x1234567890123456789012345678901234567890',
      description: 'Token for my company ecosystem',
    };

    // Validate before deployment
    const validation = validateTokenDeploymentRequest(request);
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    // Deploy
    const result = await tokenDeploymentService.deployToken(request);

    if (result.success) {
      console.log('✅ Token deployed successfully!');
      console.log('Transaction ID:', result.transactionId);
      console.log('Token ID:', result.tokenId);
      console.log('Contract Address:', result.contractAddress);
      
      // Save transaction ID for status checking
      localStorage.setItem('lastDeploymentTxId', result.transactionId);
    } else {
      console.error('❌ Deployment failed:', result.error);
      console.error('Error code:', result.errorCode);
    }
  } catch (error) {
    console.error('Deployment error:', error);
  }
}
```

## Example 2: Deploy an ARC3 NFT

```typescript
async function deployARC3NFT() {
  const request = {
    standard: TokenStandard.ARC3,
    name: 'My NFT Collection',
    unitName: 'MNFT',
    total: 1, // Single NFT
    decimals: 0,
    url: 'ipfs://QmYourMetadataHashHere',
    walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
    metadata: {
      name: 'NFT #1',
      description: 'First NFT in my collection',
      image: 'ipfs://QmYourImageHashHere',
      properties: {
        rarity: 'legendary',
        edition: 1,
        creator: 'Artist Name',
      },
    },
  };

  const result = await tokenDeploymentService.deployToken(request);
  
  if (result.success) {
    console.log('NFT Asset ID:', result.assetId);
  }
}
```

## Example 3: Vue Component Integration

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { tokenDeploymentService } from '@/services/TokenDeploymentService';
import { TokenStandard, type ERC20DeploymentRequest } from '@/types/api';

const loading = ref(false);
const result = ref<string>('');

const deployToken = async () => {
  loading.value = true;
  result.value = '';
  
  try {
    const request: ERC20DeploymentRequest = {
      standard: TokenStandard.ERC20,
      name: 'My Token',
      symbol: 'MTK',
      decimals: 18,
      totalSupply: '1000000',
      walletAddress: '0x1234567890123456789012345678901234567890',
    };

    const response = await tokenDeploymentService.deployToken(request);
    
    if (response.success) {
      result.value = `Success! Token ID: ${response.tokenId}`;
    } else {
      result.value = `Error: ${response.error}`;
    }
  } catch (error) {
    result.value = `Error: ${error.message}`;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-4">
    <button 
      @click="deployToken" 
      :disabled="loading"
      class="btn btn-primary"
    >
      {{ loading ? 'Deploying...' : 'Deploy Token' }}
    </button>
    
    <p v-if="result" class="mt-4">{{ result }}</p>
  </div>
</template>
```

## Next Steps

- See [README.md](../README.md#-backend-api-integration) for more details
- Check [CONTRIBUTING.md](../CONTRIBUTING.md#testing) for TDD practices
- Review test files in `src/services/__tests__/` for more examples
