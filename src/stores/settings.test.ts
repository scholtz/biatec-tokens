import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from './settings';
import type { NetworkConfig } from './settings';

describe('Settings Store', () => {
  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
  });

  it('should initialize with default settings', () => {
    const store = useSettingsStore();
    
    expect(store.settings.network).toBe('testnet');
    expect(store.settings.demoMode).toBe(true);
    expect(store.settings.networkConfigs).toHaveProperty('mainnet');
    expect(store.settings.networkConfigs).toHaveProperty('testnet');
    expect(store.settings.networkConfigs).toHaveProperty('dockernet');
  });

  it('should update network', () => {
    const store = useSettingsStore();
    
    store.updateNetwork('mainnet');
    expect(store.settings.network).toBe('mainnet');
    
    store.updateNetwork('dockernet');
    expect(store.settings.network).toBe('dockernet');
  });

  it('should update network config', () => {
    const store = useSettingsStore();
    const customConfig: NetworkConfig = {
      algodUrl: 'https://custom-algod.example.com',
      algodToken: 'custom-token',
      indexerUrl: 'https://custom-indexer.example.com',
      indexerToken: 'custom-indexer-token',
      headers: { 'X-Custom': 'header' }
    };
    
    store.updateNetworkConfig('custom', customConfig);
    
    expect(store.settings.networkConfigs['custom']).toEqual(customConfig);
    expect(store.settings.networkConfigs['custom'].algodUrl).toBe('https://custom-algod.example.com');
  });

  it('should update EVM config', () => {
    const store = useSettingsStore();
    const newRpcUrl = 'https://mainnet.infura.io/v3/test';
    const newChainId = 1;
    
    store.updateEvmConfig(newRpcUrl, newChainId);
    
    expect(store.settings.evmRpcUrl).toBe(newRpcUrl);
    expect(store.settings.evmChainId).toBe(newChainId);
  });

  it('should toggle demo mode', () => {
    const store = useSettingsStore();
    const initialDemoMode = store.settings.demoMode;
    
    store.toggleDemoMode();
    expect(store.settings.demoMode).toBe(!initialDemoMode);
    
    store.toggleDemoMode();
    expect(store.settings.demoMode).toBe(initialDemoMode);
  });

  it('should export settings as JSON string', () => {
    const store = useSettingsStore();
    const exported = store.exportSettings();
    
    expect(typeof exported).toBe('string');
    
    const parsed = JSON.parse(exported);
    expect(parsed.network).toBe('testnet');
    expect(parsed.demoMode).toBe(true);
  });

  it('should import valid settings JSON', () => {
    const store = useSettingsStore();
    const settingsToImport = {
      network: 'mainnet',
      demoMode: false,
      evmRpcUrl: 'https://imported.rpc.url',
      evmChainId: 999
    };
    
    const result = store.importSettings(JSON.stringify(settingsToImport));
    
    expect(result).toBe(true);
    expect(store.settings.network).toBe('mainnet');
    expect(store.settings.demoMode).toBe(false);
    expect(store.settings.evmRpcUrl).toBe('https://imported.rpc.url');
    expect(store.settings.evmChainId).toBe(999);
  });

  it('should handle invalid JSON during import', () => {
    const store = useSettingsStore();
    const originalSettings = { ...store.settings };
    
    const result = store.importSettings('invalid-json-{]');
    
    expect(result).toBe(false);
    // Settings should remain unchanged
    expect(store.settings.network).toBe(originalSettings.network);
  });

  it('should preserve existing network configs when importing', () => {
    const store = useSettingsStore();
    const originalMainnetConfig = store.settings.networkConfigs.mainnet;
    
    const partialSettings = {
      network: 'mainnet'
    };
    
    store.importSettings(JSON.stringify(partialSettings));
    
    // Network configs should still exist
    expect(store.settings.networkConfigs.mainnet).toEqual(originalMainnetConfig);
  });

  it('should have correct default mainnet configuration', () => {
    const store = useSettingsStore();
    const mainnetConfig = store.settings.networkConfigs.mainnet;
    
    expect(mainnetConfig.algodUrl).toBe('https://mainnet-api.algonode.cloud');
    expect(mainnetConfig.indexerUrl).toBe('https://mainnet-idx.algonode.cloud');
    expect(mainnetConfig.algodToken).toBe('');
    expect(mainnetConfig.indexerToken).toBe('');
  });

  it('should have correct default testnet configuration', () => {
    const store = useSettingsStore();
    const testnetConfig = store.settings.networkConfigs.testnet;
    
    expect(testnetConfig.algodUrl).toBe('https://testnet-api.algonode.cloud');
    expect(testnetConfig.indexerUrl).toBe('https://testnet-idx.algonode.cloud');
  });

  it('should have correct default dockernet configuration', () => {
    const store = useSettingsStore();
    const dockernetConfig = store.settings.networkConfigs.dockernet;
    
    expect(dockernetConfig.algodUrl).toBe('http://localhost:4001');
    expect(dockernetConfig.indexerUrl).toBe('http://localhost:8980');
    expect(dockernetConfig.algodToken).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});
