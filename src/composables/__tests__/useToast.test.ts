import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToast } from '../useToast';

describe('useToast', () => {
  let toast: ReturnType<typeof useToast>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Get a fresh instance for each test
    toast = useToast();
    // Clear any existing toasts
    toast.toasts.value = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clear toasts after each test
    toast.toasts.value = [];
  });

  it('should add a toast message', () => {
    toast.showToast('Test message', 'info');

    expect(toast.toasts.value).toHaveLength(1);
    expect(toast.toasts.value[0].message).toBe('Test message');
    expect(toast.toasts.value[0].type).toBe('info');
  });

  it('should generate unique IDs for toasts', () => {
    toast.showToast('Message 1', 'info');
    toast.showToast('Message 2', 'info');

    expect(toast.toasts.value).toHaveLength(2);
    expect(toast.toasts.value[0].id).not.toBe(toast.toasts.value[1].id);
  });

  it('should auto-remove toast after duration', () => {
    toast.showToast('Test message', 'info', 1000);

    expect(toast.toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(1000);

    expect(toast.toasts.value).toHaveLength(0);
  });

  it('should not auto-remove toast if duration is 0', () => {
    toast.showToast('Test message', 'info', 0);

    expect(toast.toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(10000);

    expect(toast.toasts.value).toHaveLength(1);
  });

  it('should manually remove toast by ID', () => {
    const id = toast.showToast('Test message', 'info', 0);

    expect(toast.toasts.value).toHaveLength(1);

    toast.removeToast(id);

    expect(toast.toasts.value).toHaveLength(0);
  });

  it('should use success helper', () => {
    toast.success('Success message');

    expect(toast.toasts.value).toHaveLength(1);
    expect(toast.toasts.value[0].type).toBe('success');
    expect(toast.toasts.value[0].message).toBe('Success message');
  });

  it('should use error helper', () => {
    toast.error('Error message');

    expect(toast.toasts.value).toHaveLength(1);
    expect(toast.toasts.value[0].type).toBe('error');
    expect(toast.toasts.value[0].message).toBe('Error message');
  });

  it('should use warning helper', () => {
    toast.warning('Warning message');

    expect(toast.toasts.value).toHaveLength(1);
    expect(toast.toasts.value[0].type).toBe('warning');
    expect(toast.toasts.value[0].message).toBe('Warning message');
  });

  it('should use info helper', () => {
    toast.info('Info message');

    expect(toast.toasts.value).toHaveLength(1);
    expect(toast.toasts.value[0].type).toBe('info');
    expect(toast.toasts.value[0].message).toBe('Info message');
  });

  it('should handle multiple toasts', () => {
    toast.showToast('Message 1', 'info', 0);
    toast.showToast('Message 2', 'success', 0);
    toast.showToast('Message 3', 'error', 0);

    expect(toast.toasts.value).toHaveLength(3);
    expect(toast.toasts.value[0].message).toBe('Message 1');
    expect(toast.toasts.value[1].message).toBe('Message 2');
    expect(toast.toasts.value[2].message).toBe('Message 3');
  });

  it('should remove specific toast without affecting others', () => {
    const id1 = toast.showToast('Message 1', 'info', 0);
    const id2 = toast.showToast('Message 2', 'success', 0);
    const id3 = toast.showToast('Message 3', 'error', 0);

    expect(toast.toasts.value).toHaveLength(3);

    toast.removeToast(id2);

    expect(toast.toasts.value).toHaveLength(2);
    expect(toast.toasts.value.find(t => t.id === id1)).toBeTruthy();
    expect(toast.toasts.value.find(t => t.id === id2)).toBeFalsy();
    expect(toast.toasts.value.find(t => t.id === id3)).toBeTruthy();
  });

  it('should use default duration of 3000ms', () => {
    toast.showToast('Test message', 'info');

    expect(toast.toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(2999);
    expect(toast.toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('should default to info type', () => {
    toast.showToast('Test message');

    expect(toast.toasts.value).toHaveLength(1);
    expect(toast.toasts.value[0].type).toBe('info');
  });

  it('should handle removing non-existent toast gracefully', () => {
    expect(() => toast.removeToast('non-existent-id')).not.toThrow();
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('should allow custom duration for helper methods', () => {
    toast.success('Success message', 500);

    expect(toast.toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(500);

    expect(toast.toasts.value).toHaveLength(0);
  });
});
