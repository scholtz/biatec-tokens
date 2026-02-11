import { defineStore } from "pinia";
import { ref } from "vue";

export type ChainType = "AVM" | "EVM";

export type AVMNetworkId = "algorand-mainnet" | "voi-mainnet" | "aramidmain" | "algorand-testnet" | "dockernet";
export type EVMNetworkId = "ethereum" | "arbitrum" | "base" | "sepolia";
export type NetworkId = AVMNetworkId | EVMNetworkId;

export interface BaseNetworkInfo {
  id: NetworkId;
  name: string;
  displayName: string;
  isTestnet: boolean;
  isAdvanced?: boolean; // For networks like VOI/Aramid that are mainnets but advanced
  chainType: ChainType;
}

export interface AVMNetworkInfo extends BaseNetworkInfo {
  chainType: "AVM";
  algodUrl: string;
  genesisId: string;
}

export interface EVMNetworkInfo extends BaseNetworkInfo {
  chainType: "EVM";
  chainId: number;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export type NetworkInfo = AVMNetworkInfo | EVMNetworkInfo;

export const AVM_NETWORKS: Record<AVMNetworkId, AVMNetworkInfo> = {
  "algorand-mainnet": {
    id: "algorand-mainnet",
    name: "algorand-mainnet",
    displayName: "Algorand Mainnet",
    algodUrl: "https://mainnet-api.4160.nodely.dev",
    genesisId: "mainnet-v1.0",
    isTestnet: false,
    chainType: "AVM",
  },
  "voi-mainnet": {
    id: "voi-mainnet",
    name: "voi-mainnet",
    displayName: "VOI Mainnet",
    algodUrl: "https://mainnet-api.voi.nodely.dev",
    genesisId: "voimain-v1.0",
    isTestnet: false,
    isAdvanced: true,
    chainType: "AVM",
  },
  aramidmain: {
    id: "aramidmain",
    name: "aramidmain",
    displayName: "Aramid Mainnet",
    algodUrl: "https://algod.aramidmain.a-wallet.net",
    genesisId: "aramidmain-v1.0",
    isTestnet: false,
    isAdvanced: true,
    chainType: "AVM",
  },
  "algorand-testnet": {
    id: "algorand-testnet",
    name: "algorand-testnet",
    displayName: "Algorand Testnet",
    algodUrl: "https://testnet-api.4160.nodely.dev",
    genesisId: "testnet-v1.0",
    isTestnet: true,
    chainType: "AVM",
  },
  dockernet: {
    id: "dockernet",
    name: "dockernet",
    displayName: "Dockernet (Local)",
    algodUrl: "http://localhost:4001",
    genesisId: "dockernet-v1",
    isTestnet: true,
    chainType: "AVM",
  },
};

export const EVM_NETWORKS: Record<EVMNetworkId, EVMNetworkInfo> = {
  ethereum: {
    id: "ethereum",
    name: "ethereum",
    displayName: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://ethereum.publicnode.com",
    blockExplorerUrl: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    isTestnet: false,
    chainType: "EVM",
  },
  arbitrum: {
    id: "arbitrum",
    name: "arbitrum",
    displayName: "Arbitrum One",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorerUrl: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    isTestnet: false,
    chainType: "EVM",
  },
  base: {
    id: "base",
    name: "base",
    displayName: "Base",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    blockExplorerUrl: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    isTestnet: false,
    chainType: "EVM",
  },
  sepolia: {
    id: "sepolia",
    name: "sepolia",
    displayName: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    isTestnet: true,
    chainType: "EVM",
  },
};

export const NETWORKS: Record<NetworkId, NetworkInfo> = {
  ...AVM_NETWORKS,
  ...EVM_NETWORKS,
};
export const useNetworkStore = defineStore("network", () => {
  const networkInfo = ref<NetworkInfo>(NETWORKS["algorand-mainnet"]);
  const switchNetwork = async (networkId: NetworkId) => {
    if (!NETWORKS[networkId]) {
      throw new Error(`Unsupported network ID: ${networkId}`);
    }
    networkInfo.value = NETWORKS[networkId];
  };
  return {
    networkInfo,
    switchNetwork,
  };
});
