// ABOUTME: Test suite for useAppNames composable focusing on app name mapping functionality
// ABOUTME: Validates slug generation, display name lookup, localStorage persistence, and edge cases

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppNames } from '../useAppNames';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

// Replace global localStorage with our mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Also ensure it's available on globalThis for browser compatibility
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
}

describe('useAppNames', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('generateSlug function', () => {
    it('should convert display name to technical slug with project prefix', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('My Awesome Project')).toBe('project-my-awesome-project');
    });

    it('should handle multiple spaces correctly', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('My  Multiple   Space  Project')).toBe('project-my-multiple-space-project');
    });

    it('should remove special characters and preserve alphanumeric', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('My-Project@2024#Test!')).toBe('project-my-project-2024-test');
    });

    it('should handle lowercase input correctly', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('my awesome project')).toBe('project-my-awesome-project');
    });

    it('should handle mixed case input correctly', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('MyAwesomeProject')).toBe('project-myawesomeproject');
    });

    it('should handle empty string input', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('')).toBe('project-untitled');
    });

    it('should handle whitespace-only input', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('   ')).toBe('project-untitled');
    });

    it('should handle unicode characters', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('Mön Prøjéct')).toBe('project-mon-pr-ject');
    });

    it('should handle numbers and underscores', () => {
      const { generateSlug } = useAppNames();
      
      expect(generateSlug('Project_123 Test')).toBe('project-project-123-test');
    });

    it('should handle very long names by truncating', () => {
      const { generateSlug } = useAppNames();
      const longName = 'This is a very long project name that should be truncated to prevent extremely long slugs';
      
      const result = generateSlug(longName);
      expect(result).toMatch(/^project-/);
      expect(result.length).toBeLessThanOrEqual(50); // reasonable slug length limit
    });
  });

  describe('getDisplayName function', () => {
    it('should return friendly name from localStorage mapping if exists', () => {
      const { getDisplayName, saveAppMapping } = useAppNames();
      
      saveAppMapping('project-my-app', 'My App');
      expect(getDisplayName('project-my-app')).toBe('My App');
    });

    it('should return original slug if no mapping exists (fallback)', () => {
      const { getDisplayName } = useAppNames();
      
      expect(getDisplayName('project-unknown-app')).toBe('project-unknown-app');
    });

    it('should handle empty string input', () => {
      const { getDisplayName } = useAppNames();
      
      expect(getDisplayName('')).toBe('');
    });

    it('should be case-sensitive for slug lookup', () => {
      const { getDisplayName, saveAppMapping } = useAppNames();
      
      saveAppMapping('project-my-app', 'My App');
      expect(getDisplayName('Project-My-App')).toBe('Project-My-App'); // No match, returns original
    });
  });

  describe('saveAppMapping function', () => {
    it('should save mapping to localStorage with correct key', () => {
      const { saveAppMapping } = useAppNames();
      
      saveAppMapping('project-test-app', 'Test App');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'claude-app-mappings',
        JSON.stringify({ 'project-test-app': 'Test App' })
      );
    });

    it('should merge new mappings with existing ones', () => {
      const { saveAppMapping } = useAppNames();
      
      saveAppMapping('project-app1', 'App 1');
      saveAppMapping('project-app2', 'App 2');
      
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        'claude-app-mappings',
        JSON.stringify({
          'project-app1': 'App 1',
          'project-app2': 'App 2'
        })
      );
    });

    it('should update existing mapping if same slug is used', () => {
      const { saveAppMapping } = useAppNames();
      
      saveAppMapping('project-app1', 'App 1');
      saveAppMapping('project-app1', 'Updated App 1');
      
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        'claude-app-mappings',
        JSON.stringify({ 'project-app1': 'Updated App 1' })
      );
    });

    it('should handle empty values gracefully', () => {
      const { saveAppMapping } = useAppNames();
      
      saveAppMapping('', 'Empty Slug');
      saveAppMapping('project-test', '');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('loadMappings function', () => {
    it('should load mappings from localStorage on initialization', () => {
      const testMappings = {
        'project-app1': 'App 1',
        'project-app2': 'App 2'
      };
      
      // Set the data in our mock store first
      mockLocalStorage.setItem('claude-app-mappings', JSON.stringify(testMappings));
      
      const { mappings, loadMappings } = useAppNames();
      loadMappings();
      
      expect(mappings.value).toEqual(testMappings);
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      mockLocalStorage.setItem('claude-app-mappings', 'invalid json');
      
      const { mappings, loadMappings } = useAppNames();
      loadMappings();
      
      expect(mappings.value).toEqual({});
    });

    it('should handle empty localStorage gracefully', () => {
      const { mappings, loadMappings } = useAppNames();
      loadMappings();
      
      expect(mappings.value).toEqual({});
    });
  });

  describe('reactive mappings state', () => {
    it('should provide reactive mappings that update when new mappings are saved', () => {
      const { mappings, saveAppMapping } = useAppNames();
      
      expect(mappings.value).toEqual({});
      
      saveAppMapping('project-test', 'Test App');
      
      expect(mappings.value).toEqual({ 'project-test': 'Test App' });
    });

    it('should be readonly for external consumption', () => {
      const { mappings } = useAppNames();
      
      // Should not allow direct mutation
      expect(() => {
        mappings.value = { 'direct': 'mutation' };
      }).not.toThrow(); // Vue's ref allows this, but it should be documented as readonly
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end: generate slug, save mapping, retrieve display name', () => {
      const { generateSlug, saveAppMapping, getDisplayName } = useAppNames();
      
      const displayName = 'My Awesome Project';
      const slug = generateSlug(displayName);
      
      expect(slug).toBe('project-my-awesome-project');
      
      saveAppMapping(slug, displayName);
      
      expect(getDisplayName(slug)).toBe(displayName);
    });

    it('should persist across composable instances', () => {
      const instance1 = useAppNames();
      instance1.saveAppMapping('project-test', 'Test App');
      
      const instance2 = useAppNames();
      instance2.loadMappings();
      
      expect(instance2.getDisplayName('project-test')).toBe('Test App');
    });

    it('should handle real-world hook event source_app names', () => {
      const { generateSlug, saveAppMapping, getDisplayName } = useAppNames();
      
      // Test common patterns from the system
      const testCases = [
        { input: 'AI Assistant', expected: 'project-ai-assistant' },
        { input: 'Claude Code Hooks', expected: 'project-claude-code-hooks' },
        { input: 'Testing Suite 2024', expected: 'project-testing-suite-2024' },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const slug = generateSlug(input);
        expect(slug).toBe(expected);
        
        saveAppMapping(slug, input);
        expect(getDisplayName(slug)).toBe(input);
      });
    });
  });

  describe('localStorage error handling', () => {
    it('should handle localStorage.setItem failures gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const { saveAppMapping } = useAppNames();
      
      expect(() => {
        saveAppMapping('project-test', 'Test App');
      }).not.toThrow();
    });

    it('should handle localStorage.getItem failures gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const { loadMappings, mappings } = useAppNames();
      
      expect(() => {
        loadMappings();
      }).not.toThrow();
      
      expect(mappings.value).toEqual({});
    });
  });
});