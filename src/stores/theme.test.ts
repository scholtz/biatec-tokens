import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore } from './theme';

// Mock document and window
global.document = {
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
} as any;

global.window = {
  matchMedia: vi.fn().mockReturnValue({
    matches: false,
  }),
} as any;

describe('Theme Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with dark theme by default', () => {
    const store = useThemeStore();
    
    // Default value is true (dark)
    expect(store.isDark).toBe(true);
  });

  it('should toggle theme from dark to light', () => {
    const store = useThemeStore();
    
    expect(store.isDark).toBe(true);
    
    store.toggleTheme();
    
    expect(store.isDark).toBe(false);
  });

  it('should toggle theme from light to dark', () => {
    const store = useThemeStore();
    
    // First toggle to light
    store.toggleTheme();
    expect(store.isDark).toBe(false);
    
    // Then toggle back to dark
    store.toggleTheme();
    
    expect(store.isDark).toBe(true);
  });

  it('should save theme preference to localStorage', () => {
    const store = useThemeStore();
    
    store.toggleTheme(); // Should toggle to light
    
    expect(localStorage.getItem('theme')).toBe('light');
    
    store.toggleTheme(); // Should toggle back to dark
    
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should initialize theme from localStorage', () => {
    localStorage.setItem('theme', 'light');
    
    const store = useThemeStore();
    store.initTheme(null);
    
    expect(store.isDark).toBe(false);
  });

  it('should update document classes when theme changes', () => {
    const store = useThemeStore();
    const { classList } = document.documentElement;
    
    store.toggleTheme();
    
    expect(classList.add).toHaveBeenCalled();
    expect(classList.remove).toHaveBeenCalled();
  });

  it('should initialize with dark theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    const store = useThemeStore();
    store.initTheme(null);
    expect(store.isDark).toBe(true);
  });

  it('should initialize from system preference when no localStorage value', () => {
    // System prefers dark
    (global.window as any).matchMedia = vi.fn().mockReturnValue({ matches: true });
    const store = useThemeStore();
    store.initTheme(null);
    expect(store.isDark).toBe(true);
  });

  it('should invoke callback when setCallback is provided', () => {
    const callback = vi.fn();
    const store = useThemeStore();
    store.initTheme(callback);
    // toggleTheme triggers updateTheme → callback
    store.toggleTheme();
    expect(callback).toHaveBeenCalled();
  });
});
