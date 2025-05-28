import { describe, it, expect, beforeEach } from 'vitest';
import { register, resolve } from '../src';
import { plugins } from '../src/registry';

describe('Registry', () => {
  // Clear the registry before each test to ensure isolation
  beforeEach(() => {
    // Clear all plugins from the registry
    for (const key of Array.from(plugins.keys())) {
      plugins.delete(key);
    }
  });

  it('should register a plugin', () => {
    const testPlugin = () => {};
    register('test', testPlugin);
    
    expect(plugins.has('test')).toBe(true);
    expect(plugins.get('test')).toBe(testPlugin);
  });

  it('should resolve a registered plugin', () => {
    const testPlugin = () => {};
    register('test', testPlugin);
    
    expect(resolve('test')).toBe(testPlugin);
  });

  it('should return undefined when resolving an unregistered plugin', () => {
    expect(resolve('nonexistent')).toBeUndefined();
  });

  it('should throw when registering a plugin with an empty key', () => {
    expect(() => {
      register('', () => {});
    }).toThrow('Invalid plugin key');
  });

  it('should throw when registering a plugin with a key that is already registered', () => {
    const testPlugin = () => {};
    register('test', testPlugin);
    
    expect(() => {
      register('test', () => {});
    }).toThrow('Plugin test already registered');
  });
}); 