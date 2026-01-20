import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TokenCard from './TokenCard.vue';
import type { Token } from '../stores/tokens';

describe('TokenCard Component', () => {
  let mockToken: Token;

  beforeEach(() => {
    mockToken = {
      id: 'token-1',
      name: 'Test Token',
      symbol: 'TST',
      description: 'A test token for unit testing',
      standard: 'ERC20',
      type: 'Fungible',
      supply: 1000000,
      decimals: 18,
      status: 'draft',
      createdAt: new Date('2024-01-15T10:30:00'),
      updatedAt: new Date('2024-01-15T10:30:00'),
    };
  });

  it('should render token name and symbol', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).toContain('Test Token');
    expect(wrapper.text()).toContain('TST');
  });

  it('should render token description', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).toContain('A test token for unit testing');
  });

  it('should render token standard and status', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).toContain('ERC20');
    expect(wrapper.text()).toContain('draft');
  });

  it('should render token type and supply', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).toContain('Fungible');
    expect(wrapper.text()).toContain('1.0M');
  });

  it('should format supply with K suffix for thousands', () => {
    mockToken.supply = 5000;
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).toContain('5.0K');
  });

  it('should format supply with M suffix for millions', () => {
    mockToken.supply = 5000000;
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).toContain('5.0M');
  });

  it('should format supply without suffix for small numbers', () => {
    mockToken.supply = 500;
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).toContain('500');
  });

  it('should format date correctly', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const formattedDate = wrapper.text();
    expect(formattedDate).toMatch(/Jan 15/);
  });

  it('should render image when imageUrl is provided', () => {
    mockToken.imageUrl = 'https://example.com/image.png';
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/image.png');
    expect(img.attributes('alt')).toBe('Test Token');
  });

  it('should show default icon when no imageUrl', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.find('i.pi-image').exists()).toBe(true);
  });

  it('should show deployed details when status is deployed', () => {
    mockToken.status = 'deployed';
    mockToken.assetId = 'ASA123456';
    mockToken.contractAddress = '0x1234567890abcdef';
    mockToken.txId = 'TX9876543210';
    
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).toContain('Asset ID:');
    expect(wrapper.text()).toContain('ASA123456');
    expect(wrapper.text()).toContain('Contract:');
    expect(wrapper.text()).toContain('0x12345678');
    expect(wrapper.text()).toContain('Tx ID:');
    expect(wrapper.text()).toContain('TX98765432');
  });

  it('should not show deployed details when status is not deployed', () => {
    mockToken.status = 'draft';
    
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    expect(wrapper.text()).not.toContain('Asset ID:');
    expect(wrapper.text()).not.toContain('Contract:');
    expect(wrapper.text()).not.toContain('Tx ID:');
  });

  it('should show copy button only when deployed', () => {
    mockToken.status = 'deployed';
    const deployedWrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    mockToken.status = 'draft';
    const draftWrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const copyButtons = deployedWrapper.findAll('button[title="Copy Details"]');
    expect(copyButtons.length).toBe(1);
    
    const draftCopyButtons = draftWrapper.findAll('button[title="Copy Details"]');
    expect(draftCopyButtons.length).toBe(0);
  });

  it('should always show delete button', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const deleteButton = wrapper.find('button[title="Delete Token"]');
    expect(deleteButton.exists()).toBe(true);
  });

  it('should emit delete event when delete button is clicked', async () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const deleteButton = wrapper.find('button[title="Delete Token"]');
    await deleteButton.trigger('click');
    
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['token-1']);
  });

  it('should copy token details to clipboard when copy button is clicked', async () => {
    mockToken.status = 'deployed';
    mockToken.assetId = 'ASA123';
    mockToken.contractAddress = '0xabcdef';
    mockToken.txId = 'TX123';
    
    // Mock clipboard API properly
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    
    // Store original clipboard
    const originalClipboard = global.navigator.clipboard;
    
    // Mock navigator.clipboard
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true
    });
    
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const copyButton = wrapper.find('button[title="Copy Details"]');
    await copyButton.trigger('click');
    
    // Wait for async operation
    await wrapper.vm.$nextTick();
    
    expect(writeTextMock).toHaveBeenCalledWith(
      JSON.stringify({
        name: 'Test Token',
        symbol: 'TST',
        standard: 'ERC20',
        assetId: 'ASA123',
        contractAddress: '0xabcdef',
        txId: 'TX123',
      }, null, 2)
    );
    
    // Restore original clipboard
    Object.defineProperty(global.navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true
    });
  });

  it('should handle clipboard copy errors gracefully', async () => {
    mockToken.status = 'deployed';
    
    // Mock console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
    
    // Store original clipboard
    const originalClipboard = global.navigator.clipboard;
    
    // Mock navigator.clipboard
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true
    });
    
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const copyButton = wrapper.find('button[title="Copy Details"]');
    await copyButton.trigger('click');
    
    // Wait for async operation
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to copy to clipboard:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
    
    // Restore original clipboard
    Object.defineProperty(global.navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true
    });
  });

  it('should have hover effect class', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const card = wrapper.find('.token-card');
    expect(card.classes()).toContain('hover:shadow-xl');
    expect(card.classes()).toContain('transition-all');
  });

  it('should apply glass effect style', () => {
    const wrapper = mount(TokenCard, {
      props: { token: mockToken }
    });
    
    const card = wrapper.find('.token-card');
    expect(card.classes()).toContain('glass-effect');
  });
});
