import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSubscriptionStore } from './subscription';

// Mock the stripe-config module
vi.mock('../stripe-config', () => ({
  getProductByPriceId: (priceId: string) => {
    if (priceId === 'price_1RZditFQlr5akrTCrlVCJ6Gd') {
      return {
        id: 'prod_SUcy60xNbxYd2P',
        priceId: 'price_1RZditFQlr5akrTCrlVCJ6Gd',
        name: 'Monthly subscription',
        description: 'Access to premium features',
        mode: 'subscription',
        price: 50.00,
        currency: 'usd',
        interval: 'month'
      };
    }
    return null;
  }
}));

describe('Subscription Store', () => {
  let originalLocation: any;

  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Mock window.location.href for checkout tests
    originalLocation = window.location.href;
    delete (window as any).location;
    window.location = { href: originalLocation } as any;
  });

  afterEach(() => {
    // Restore original location
    if (originalLocation) {
      delete (window as any).location;
      window.location = { href: originalLocation } as any;
    }
  });

  it('should initialize with null subscription', () => {
    const store = useSubscriptionStore();
    
    expect(store.subscription).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should compute isActive as false when no subscription', () => {
    const store = useSubscriptionStore();
    
    expect(store.isActive).toBe(false);
  });

  it('should compute isActive as true when subscription is active', async () => {
    const store = useSubscriptionStore();
    
    await store.fetchSubscription();
    
    // Change subscription to active
    if (store.subscription) {
      store.subscription.subscription_status = 'active';
    }
    
    expect(store.isActive).toBe(true);
  });

  it('should fetch subscription data', async () => {
    const store = useSubscriptionStore();
    
    await store.fetchSubscription();
    
    expect(store.subscription).not.toBeNull();
    expect(store.subscription?.customer_id).toBe('demo_customer');
    expect(store.subscription?.subscription_status).toBe('not_started');
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should set loading state correctly', async () => {
    const store = useSubscriptionStore();
    
    expect(store.loading).toBe(false);
    
    await store.fetchSubscription();
    
    // After completion, loading should be false
    expect(store.loading).toBe(false);
    expect(store.subscription).not.toBeNull();
  });

  it('should compute currentProduct when price_id is set', async () => {
    const store = useSubscriptionStore();
    
    await store.fetchSubscription();
    
    // Initially no product
    expect(store.currentProduct).toBeNull();
    
    // Set a price_id
    if (store.subscription) {
      store.subscription.price_id = 'price_1RZditFQlr5akrTCrlVCJ6Gd';
    }
    
    // Now currentProduct should be populated
    expect(store.currentProduct).not.toBeNull();
    expect(store.currentProduct?.name).toBe('Monthly subscription');
  });

  it('should compute currentProduct as null when price_id is null', async () => {
    const store = useSubscriptionStore();
    
    await store.fetchSubscription();
    
    expect(store.subscription?.price_id).toBeNull();
    expect(store.currentProduct).toBeNull();
  });

  it('should compute currentPeriodEnd as Date when current_period_end is set', async () => {
    const store = useSubscriptionStore();
    
    await store.fetchSubscription();
    
    const timestamp = 1735000000; // Some future timestamp
    
    if (store.subscription) {
      store.subscription.current_period_end = timestamp;
    }
    
    const periodEnd = store.currentPeriodEnd;
    expect(periodEnd).toBeInstanceOf(Date);
    expect(periodEnd?.getTime()).toBe(timestamp * 1000);
  });

  it('should compute currentPeriodEnd as null when current_period_end is null', async () => {
    const store = useSubscriptionStore();
    
    await store.fetchSubscription();
    
    expect(store.subscription?.current_period_end).toBeNull();
    expect(store.currentPeriodEnd).toBeNull();
  });

  it('should create checkout session with default mode', async () => {
    const store = useSubscriptionStore();
    const mockPriceId = 'price_test_123';
    
    const promise = store.createCheckoutSession(mockPriceId);
    
    // Check loading is true during operation
    expect(store.loading).toBe(true);
    
    // Wait for promise with timeout to prevent hanging
    await Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve('timeout'), 2000))
    ]);
    
    expect(store.loading).toBe(false);
    expect(window.location.href).toContain('/subscription/success');
    expect(window.location.href).toContain('session_id=mock_session_');
  });

  it('should create checkout session with custom mode', async () => {
    const store = useSubscriptionStore();
    const mockPriceId = 'price_test_456';
    
    const promise = store.createCheckoutSession(mockPriceId, 'payment');
    
    // Wait for promise with timeout to prevent hanging
    await Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve('timeout'), 2000))
    ]);
    
    expect(store.loading).toBe(false);
    expect(window.location.href).toContain('/subscription/success');
  });

  it('should initialize with all expected state properties', () => {
    const store = useSubscriptionStore();
    
    // Check all exposed properties exist
    expect(store).toHaveProperty('subscription');
    expect(store).toHaveProperty('loading');
    expect(store).toHaveProperty('error');
    expect(store).toHaveProperty('isActive');
    expect(store).toHaveProperty('currentProduct');
    expect(store).toHaveProperty('currentPeriodEnd');
    expect(store).toHaveProperty('fetchSubscription');
    expect(store).toHaveProperty('createCheckoutSession');
  });

  it('should handle subscription with cancel_at_period_end flag', async () => {
    const store = useSubscriptionStore();
    
    await store.fetchSubscription();
    
    expect(store.subscription?.cancel_at_period_end).toBe(false);
    
    // Simulate subscription being cancelled
    if (store.subscription) {
      store.subscription.cancel_at_period_end = true;
    }
    
    expect(store.subscription?.cancel_at_period_end).toBe(true);
  });

  it('should store payment method details', async () => {
    const store = useSubscriptionStore();
    
    await store.fetchSubscription();
    
    expect(store.subscription?.payment_method_brand).toBeNull();
    expect(store.subscription?.payment_method_last4).toBeNull();
    
    // Simulate payment method being added
    if (store.subscription) {
      store.subscription.payment_method_brand = 'visa';
      store.subscription.payment_method_last4 = '4242';
    }
    
    expect(store.subscription?.payment_method_brand).toBe('visa');
    expect(store.subscription?.payment_method_last4).toBe('4242');
  });
});
