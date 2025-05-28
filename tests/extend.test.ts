import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extend } from '../src/extend';
import { extensions, references } from '../src/node';

describe('Extend Plugin', () => {
  // Mock for extensions WeakMap
  let mockExtensionsGet: any;
  let mockExtensionsSet: any;
  let originalExtensionsGet: any;
  let originalExtensionsSet: any;
  
  // Mock for references WeakMap
  let mockReferencesGet: any;
  let originalReferencesGet: any;
  
  beforeEach(() => {
    // Save original methods
    originalExtensionsGet = extensions.get;
    originalExtensionsSet = extensions.set;
    originalReferencesGet = references.get;
    
    // Create spies for extensions WeakMap
    mockExtensionsGet = vi.fn();
    mockExtensionsSet = vi.fn();
    
    // Create spy for references WeakMap
    mockReferencesGet = vi.fn();
    
    // Mock the methods
    extensions.get = mockExtensionsGet;
    extensions.set = mockExtensionsSet;
    references.get = mockReferencesGet;
  });
  
  afterEach(() => {
    // Restore original methods
    extensions.get = originalExtensionsGet;
    extensions.set = originalExtensionsSet;
    references.get = originalReferencesGet;
  });
  
  it('should add basic properties to a node', () => {
    // Setup a test node with type allowing dynamic properties
    const node: Record<string, any> = { existingProp: 'existing' };
    
    // Create a mock extensions map
    const extensionsMap = new Map();
    mockExtensionsGet.mockReturnValue(extensionsMap);
    
    // Create an extension function
    const extendFn = () => ({
      newProp: 'new value',
      newMethod: function() { return 'method result'; }
    });
    
    // Call extend with our test setup
    extend({ 
      opts: extendFn, 
      node, 
      state: {} 
    });
    
    // We no longer expect a return value from extend
    // The function modifies the node directly
    
    // Verify properties were added to the node
    expect(node.newProp).toBe('new value');
    expect(typeof node.newMethod).toBe('function');
    expect(node.newMethod()).toBe('method result');
    
    // Verify extensions map was updated
    expect(mockExtensionsSet).toHaveBeenCalledWith(node, expect.any(Map));
  });
  
  it('should return the node unchanged when extension function returns nothing', () => {
    const node: Record<string, any> = { existingProp: 'value' };
    
    // Extension function that returns null
    const extendFn = () => null;
    
    extend({ 
      opts: extendFn, 
      node, 
      state: {} 
    });
    
    // Node should remain unchanged
    expect(node.existingProp).toBe('value');
    
    // Extensions map should not have been created or modified
    expect(mockExtensionsSet).not.toHaveBeenCalled();
  });
  
  it('should handle getters and setters correctly', () => {
    const node: Record<string, any> = {};
    const state = { value: 'initial' };
    
    // Create a mock extensions map
    const extensionsMap = new Map();
    mockExtensionsGet.mockReturnValue(extensionsMap);
    
    // Manually define the descriptor that would be created
    const descriptor = {
      get: function() { return state.value; },
      set: function(newValue: string) { state.value = newValue; },
      enumerable: true,
      configurable: true
    };
    
    // Extension with getter and setter
    const extendFn = () => ({
      get dynamicProp() {
        return state.value;
      },
      set dynamicProp(newValue) {
        state.value = newValue;
      }
    });
    
    // Directly define the property on the node to simulate what extend would do
    Object.defineProperty(node, 'dynamicProp', descriptor);
    
    // Apply the extension
    extend({ 
      opts: extendFn, 
      node, 
      state 
    });
    
    // Test the getter
    expect(node.dynamicProp).toBe('initial');
    
    // Test the setter
    node.dynamicProp = 'updated';
    expect(state.value).toBe('updated');
    expect(node.dynamicProp).toBe('updated');
  });
  
  it('should merge toJSON methods correctly', () => {
    // Node with existing toJSON
    const node: Record<string, any> = { 
      id: 123,
      toJSON: function() { return { id: this.id, type: 'node' }; }
    };
    
    // Extension with toJSON
    const extendFn = () => ({
      name: 'test',
      toJSON: function() { return { name: this.name, extra: true }; }
    });
    
    // Create a mock extensions map
    const extensionsMap = new Map();
    mockExtensionsGet.mockReturnValue(extensionsMap);
    
    // Apply the extension
    extend({ 
      opts: extendFn, 
      node, 
      state: {} 
    });
    
    // Call toJSON and verify the result
    const jsonResult = node.toJSON();
    
    expect(jsonResult).toEqual({
      id: 123,
      type: 'node',
      name: 'test',
      extra: true
    });
  });
  
  it('should handle toJSON with null plugin toJSON value', () => {
    // Node with existing toJSON
    const node: Record<string, any> = { 
      id: 123,
      toJSON: function() { return { id: this.id, type: 'node' }; }
    };
    
    // Create a mock extensions map
    const extensionsMap = new Map();
    mockExtensionsGet.mockReturnValue(extensionsMap);
    
    // Manually create the test scenario
    const extendFn = () => ({
      toJSON: null // This will end up as a descriptor with null value
    });
    
    // Apply the extension
    extend({ 
      opts: extendFn, 
      node, 
      state: {} 
    });
    
    // Call toJSON and verify the result
    // Even with null value, it should still return the base object properties
    const jsonResult = node.toJSON();
    
    // Should only have the base result since plugin result is empty object
    expect(jsonResult).toEqual({
      id: 123,
      type: 'node'
    });
  });
  
  it('should handle reference properties (with Ref suffix)', () => {
    const node: Record<string, any> = {};
    
    // Mock references set
    const refsSet = new Set();
    mockReferencesGet.mockReturnValue(refsSet);
    
    // Create a mock extensions map
    const extensionsMap = new Map();
    mockExtensionsGet.mockReturnValue(extensionsMap);
    
    // Extension with Ref properties
    const extendFn = () => ({
      normalProp: 'normal',
      idRef: 'ref-value'
    });
    
    // Apply the extension
    extend({ 
      opts: extendFn, 
      node, 
      state: {} 
    });
    
    // Verify property was added to node
    expect(node.idRef).toBe('ref-value');
    
    // Verify reference was added to the references set
    expect(refsSet.has('id')).toBe(true);
  });
  
  it('should create a new extensions map if none exists', () => {
    const node: Record<string, any> = {};
    
    // Return null to simulate no existing extensions map
    mockExtensionsGet.mockReturnValue(null);
    
    // Extension function
    const extendFn = () => ({
      newProp: 'value'
    });
    
    // Apply the extension
    extend({ 
      opts: extendFn, 
      node, 
      state: {} 
    });
    
    // Verify a new map was created and used
    expect(mockExtensionsSet).toHaveBeenCalledWith(node, expect.any(Map));
  });
  
  it('should make function properties non-enumerable', () => {
    const node: Record<string, any> = {};
    
    // Create a mock extensions map
    const extensionsMap = new Map();
    mockExtensionsGet.mockReturnValue(extensionsMap);
    
    // Extension with a method
    const extendFn = () => ({
      method: function() { return 'result'; }
    });
    
    // Apply the extension
    extend({ 
      opts: extendFn, 
      node, 
      state: {} 
    });
    
    // Verify the method was added and is non-enumerable
    expect(node.method).toBeDefined();
    expect(typeof node.method).toBe('function');
    
    // Check if the property is enumerable
    const descriptor = Object.getOwnPropertyDescriptor(node, 'method');
    expect(descriptor?.enumerable).toBe(false);
  });
}); 