import { describe, it, expect, vi, beforeEach } from 'vitest';
import { node, validNodeState, instances, sources, watchers, extensions, references } from '../src/node';
import { createWatcher } from '../src/watch';

// Mock the createWatcher and processConfig dependencies
vi.mock('../src/watch', () => ({
  createWatcher: vi.fn(() => ({
    watch: vi.fn(),
    batch: vi.fn(),
    ignore: vi.fn(),
    onGet: vi.fn(),
    onSet: vi.fn(),
    onDelete: vi.fn()
  }))
}));

vi.mock('../src/config', () => ({
  processConfig: vi.fn()
}));

describe('Node Module', () => {
  describe('validNodeState function', () => {
    it('should return false for primitive values', () => {
      expect(validNodeState('string')).toBe(false);
      expect(validNodeState(123)).toBe(false);
      expect(validNodeState(true)).toBe(false);
      expect(validNodeState(null)).toBe(false);
      expect(validNodeState(undefined)).toBe(false);
    });

    it('should return true for objects and arrays', () => {
      expect(validNodeState({})).toBe(true);
      expect(validNodeState([])).toBe(true);
      expect(validNodeState({ a: 1 })).toBe(true);
      expect(validNodeState([1, 2, 3])).toBe(true);
    });
  });

  describe('node function', () => {
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
    });

    it('should return the state if it is already a node instance', () => {
      const state = {};
      const result = node({ state, config: null });
      
      // Add the result to instances so it's recognized as a node
      instances.add(result);
      
      // Create a second node with the same state
      const result2 = node({ state, config: null });
      
      // Should return the same instance
      expect(result2).toBe(result);
    });

    it('should return the existing proxy if state has a source', () => {
      const state = {};
      const existingProxy = {};
      
      // Register the state as having a source
      sources.set(state, existingProxy);
      
      const result = node({ state, config: null });
      
      expect(result).toBe(existingProxy);
    });

    it('should return the state if it is not a valid node state', () => {
      const state = 'not an object' as any;
      const result = node({ state, config: null });
      
      expect(result).toBe(state);
    });
    
    it('should create a proxy for a valid state', () => {
      const state = { prop: 'value' };
      const result = node({ state, config: null });
      
      expect(result).not.toBe(state);
      expect(result.prop).toBe('value');
      expect(instances.has(result)).toBe(true);
      expect(sources.get(state)).toBe(result);
    });

    it('should create a watcher for the root node', () => {
      const state = {};
      const result = node({ state, config: null });
      
      expect(watchers.has(result)).toBe(true);
      expect(createWatcher).toHaveBeenCalled();
      
      // Check if watch, batch, and ignore methods are defined
      expect(typeof result.watch).toBe('function');
      expect(typeof result.batch).toBe('function');
      expect(typeof result.ignore).toBe('function');
    });

    it('should not create a watcher for non-root nodes', () => {
      const rootState = {};
      const root = node({ state: rootState, config: null });
      
      // Reset mock calls
      vi.clearAllMocks();
      
      const childState = {};
      const child = node({ state: childState, root, config: null });
      
      expect(watchers.has(child)).toBe(false);
      expect(createWatcher).not.toHaveBeenCalled();
      
      // Child should not have watcher methods
      expect(child.watch).toBeUndefined();
      expect(child.batch).toBeUndefined();
      expect(child.ignore).toBeUndefined();
    });

    it('should create an empty extensions map for the node', () => {
      const state = {};
      const result = node({ state, config: null });
      
      expect(extensions.has(result)).toBe(true);
      const nodeExtensions = extensions.get(result);
      expect(nodeExtensions).toBeInstanceOf(Map);
      expect(nodeExtensions?.size).toBe(0);
    });

    it('should create an empty references set for the node', () => {
      const state = {};
      const result = node({ state, config: null });
      
      expect(references.has(result)).toBe(true);
      const nodeRefs = references.get(result);
      expect(nodeRefs).toBeInstanceOf(Set);
      expect(nodeRefs?.size).toBe(0);
    });

    it('should handle property access on the node', () => {
      const state = { 
        name: 'test',
        nested: {
          value: 42
        },
        array: [1, 2, 3]
      };
      
      const mockWatcher = {
        watch: vi.fn(),
        batch: vi.fn(),
        ignore: vi.fn(),
        onGet: vi.fn(),
        onSet: vi.fn(),
        onDelete: vi.fn()
      };
      
      (createWatcher as any).mockReturnValue(mockWatcher);
      
      const result = node({ state, config: null });
      
      // Access properties
      const name = result.name;
      const nestedValue = result.nested.value;
      const arrayItem = result.array[1];
      
      // Verify watcher.onGet was called with correct paths
      expect(mockWatcher.onGet).toHaveBeenCalledWith('$.name');
      expect(mockWatcher.onGet).toHaveBeenCalledWith('$.nested');
      expect(mockWatcher.onGet).toHaveBeenCalledWith('$.nested.value');
      expect(mockWatcher.onGet).toHaveBeenCalledWith('$.array');
      expect(mockWatcher.onGet).toHaveBeenCalledWith('$.array[1]');
      
      // Verify returned values
      expect(name).toBe('test');
      expect(nestedValue).toBe(42);
      expect(arrayItem).toBe(2);
    });

    it('should handle property setting on the node', () => {
      const state = { name: 'test' };
      
      const mockWatcher = {
        watch: vi.fn(),
        batch: vi.fn(),
        ignore: vi.fn(),
        onGet: vi.fn(),
        onSet: vi.fn(),
        onDelete: vi.fn()
      };
      
      (createWatcher as any).mockReturnValue(mockWatcher);
      
      const result = node({ state, config: null });
      
      // Set property
      result.name = 'new value';
      
      // Verify watcher.onSet was called with correct path
      expect(mockWatcher.onSet).toHaveBeenCalledWith('$.name');
      
      // Verify state was updated
      expect(state.name).toBe('new value');
    });

    it('should handle property deletion on the node', () => {
      const state = { toBeDeleted: 'value', keep: 'keep' };
      
      const mockWatcher = {
        watch: vi.fn(),
        batch: vi.fn(),
        ignore: vi.fn(),
        onGet: vi.fn(),
        onSet: vi.fn(),
        onDelete: vi.fn()
      };
      
      (createWatcher as any).mockReturnValue(mockWatcher);
      
      const result = node({ state, config: null });
      
      // Delete property
      delete result.toBeDeleted;
      
      // Verify watcher.onDelete was called with correct path
      expect(mockWatcher.onDelete).toHaveBeenCalledWith('$.toBeDeleted');
      
      // Verify property was deleted
      expect(state.toBeDeleted).toBeUndefined();
      expect(result.toBeDeleted).toBeUndefined();
      expect(result.keep).toBe('keep');
    });

    it('should handle property existence check with has', () => {
      const state = { exists: 'value' };
      const result = node({ state, config: null });
      
      expect('exists' in result).toBe(true);
      expect('nonExistent' in result).toBe(false);
    });

    it('should handle JSON serialization', () => {
      const childState = { child: 'value' };
      const state = { 
        prop: 'value',
        nested: childState,
        complex: { deep: { value: 42 } }
      };
      
      const proxy = node({ state, config: null });
      const childProxy = node({ state: childState, config: null });
      
      // Mock sources.has to simulate a value that's been proxied
      const originalSourcesHas = sources.has;
      const originalSourcesGet = sources.get;
      sources.has = vi.fn((value) => value === childState);
      sources.get = vi.fn((value) => value === childState ? childProxy : null);
      
      const json = proxy.toJSON();
      
      // Restore original sources.has and sources.get
      sources.has = originalSourcesHas;
      sources.get = originalSourcesGet;
      
      expect(json).toEqual({
        prop: 'value',
        nested: { child: 'value' },
        complex: { deep: { value: 42 } }
      });
    });

    it('should handle access to Symbol properties', () => {
      const symbolKey = Symbol('test');
      const state = {} as any;
      state[symbolKey] = 'symbol value';
      
      const proxy = node({ state, config: null });
      
      expect(proxy[symbolKey]).toBe('symbol value');
    });

    it('should access extension properties through get trap', () => {
      const state = {};
      const result = node({ state, config: null });
      
      // Create extension property via Map
      const extensionMap = extensions.get(result) as Map<string, PropertyDescriptor>;
      
      // Define a simple value extension
      extensionMap.set('extValue', {
        value: 'extension value',
        enumerable: true,
        configurable: true,
        writable: true
      });
      
      // Define a getter extension
      let getterValue = 'getter value';
      extensionMap.set('extGetter', {
        get: function() { return getterValue; },
        enumerable: true,
        configurable: true
      });
      
      // Access the extensions
      expect(result.extValue).toBe('extension value');
      expect(result.extGetter).toBe('getter value');
    });

    it('should set extension properties through set trap', () => {
      const state = {};
      const result = node({ state, config: null });
      
      // Create extension property via Map
      const extensionMap = extensions.get(result) as Map<string, PropertyDescriptor>;
      
      // Define a simple value extension
      extensionMap.set('extValue', {
        value: 'extension value',
        enumerable: true,
        configurable: true,
        writable: true
      });
      
      // Define a setter extension
      let setterValue = 'initial';
      extensionMap.set('extSetter', {
        set: function(value) { setterValue = value; },
        get: function() { return setterValue; },
        enumerable: true,
        configurable: true
      });
      
      // Set the extensions
      result.extValue = 'new value';
      result.extSetter = 'new setter value';
      
      // Verify the values were updated
      expect(result.extValue).toBe('new value');
      expect(result.extSetter).toBe('new setter value');
      expect(setterValue).toBe('new setter value');
    });

    it('should skip watcher notification for reference properties', () => {
      const state = { name: 'test' };
      
      const mockWatcher = {
        watch: vi.fn(),
        batch: vi.fn(),
        ignore: vi.fn(),
        onGet: vi.fn(),
        onSet: vi.fn(),
        onDelete: vi.fn()
      };
      
      (createWatcher as any).mockReturnValue(mockWatcher);
      
      const result = node({ state, config: null });
      
      // Get the references set
      const refs = references.get(result) as Set<string>;
      refs.add('refProp');
      
      // Set the reference property
      result.refProp = 'reference value';
      
      // Set a normal property for comparison
      result.normalProp = 'normal value';
      
      // onSet should only be called for the normal property
      expect(mockWatcher.onSet).not.toHaveBeenCalledWith('$.refProp');
      expect(mockWatcher.onSet).toHaveBeenCalledWith('$.normalProp');
    });

    it('should handle the getOwnPropertyDescriptor trap', () => {
      const state = { prop: 'value' };
      const result = node({ state, config: null });
      
      // Add extension property
      const extensionMap = extensions.get(result) as Map<string, PropertyDescriptor>;
      extensionMap.set('extProp', {
        value: 'extension value',
        enumerable: true,
        configurable: false  // This should be overridden to true
      });
      
      // Get descriptors
      const regularDesc = Object.getOwnPropertyDescriptor(result, 'prop');
      const extensionDesc = Object.getOwnPropertyDescriptor(result, 'extProp');
      
      // Check regular property
      expect(regularDesc).toBeDefined();
      expect(regularDesc?.value).toBe('value');
      
      // Check extension property
      expect(extensionDesc).toBeDefined();
      expect(extensionDesc?.value).toBe('extension value');
      expect(extensionDesc?.configurable).toBe(true);  // Should be true regardless of original value
    });

    it('should handle the ownKeys trap', () => {
      const state = { prop1: 'value1', prop2: 'value2' };
      const result = node({ state, config: null });
      
      // Add extension properties
      const extensionMap = extensions.get(result) as Map<string, PropertyDescriptor>;
      extensionMap.set('extProp1', {
        value: 'extension value 1',
        enumerable: true,
        configurable: true
      });
      extensionMap.set('extProp2', {
        value: 'extension value 2',
        enumerable: true,
        configurable: true
      });
      
      // Get own keys
      const keys = Object.keys(result);
      
      // Should include both regular and extension properties
      expect(keys).toContain('prop1');
      expect(keys).toContain('prop2');
      expect(keys).toContain('extProp1');
      expect(keys).toContain('extProp2');
    });

    it('should delete references when deleting properties', () => {
      const state = { refProp: 'value' };
      
      const mockWatcher = {
        watch: vi.fn(),
        batch: vi.fn(),
        ignore: vi.fn(),
        onGet: vi.fn(),
        onSet: vi.fn(),
        onDelete: vi.fn()
      };
      
      (createWatcher as any).mockReturnValue(mockWatcher);
      
      const result = node({ state, config: null });
      
      // Add to references
      const refs = references.get(result) as Set<string>;
      refs.add('refProp');
      
      // Delete the property
      delete result.refProp;
      
      // The reference should be removed
      expect(refs.has('refProp')).toBe(false);
    });

    it('should handle self-assignment of child nodes', () => {
      // Create root node with a nested object
      const rootState = { 
        nested: { value: 42 } as Record<string, any>
      };
      const root = node({ state: rootState, config: null });
      
      // Access the nested node to create its proxy
      const nestedNode = root.nested;
      
      // Now try to access it again directly
      const result = node({ state: nestedNode, config: null });
      
      // Verify we get the same instance back (due to the instances check)
      expect(result).toBe(nestedNode);
      
      // Verify the self-assignment works
      root.self = root;
      expect(root.self).toBe(root);
      
      // Verify circular reference with child works
      root.nestedAgain = nestedNode;
      expect(root.nestedAgain).toBe(nestedNode);
      expect(root.nestedAgain.value).toBe(42);

      // Verify assigning to a nested property still works
      nestedNode.extra = "new property";
      expect(root.nested.extra).toBe("new property");
      expect(rootState.nested.extra).toBe("new property");
    });

    it('should handle JSON serialization with non-tracked objects', () => {
      // Create a node with a nested object that's not tracked in sources
      const state = { 
        prop: 'value',
        nested: { 
          deep: { value: 42 },
          array: [1, 2, { item: 3 }]
        } as Record<string, any>
      };
      
      // Only create a proxy for the root, not the nested objects
      const proxy = node({ state, config: null });
      
      // Modify the nested object directly to ensure it's not tracked
      state.nested.newProp = 'added directly';
      
      // Get JSON representation
      const json = proxy.toJSON();
      
      // Verify the result includes all properties
      expect(json).toEqual({
        prop: 'value',
        nested: { 
          deep: { value: 42 },
          array: [1, 2, { item: 3 }],
          newProp: 'added directly'
        }
      });
    });
    
    it('should properly initialize all properties in the state object', () => {
      // This test specifically targets the "initialize all props" functionality
      const accessedProps = new Set<string>();
      
      // Create a state with getters that track access
      const state = {
        get prop1() { accessedProps.add('prop1'); return 'value1'; },
        get prop2() { accessedProps.add('prop2'); return 'value2'; },
        get prop3() { accessedProps.add('prop3'); return 'value3'; },
      };
      
      // Creating the node should initialize all properties
      node({ state, config: null });
      
      // Verify all properties were accessed during initialization
      expect(accessedProps.has('prop1')).toBe(true);
      expect(accessedProps.has('prop2')).toBe(true);
      expect(accessedProps.has('prop3')).toBe(true);
    });

    it('should handle non-proxied objects in toJSON', () => {
      // Mocking the sources to simulate a specific scenario
      const originalSourcesHas = sources.has;
      
      // Create a state with objects that won't be in sources
      const state = {
        obj1: { a: 1, b: 2 },
        obj2: { c: 3, d: { e: 4 } }
      };
      
      // Force sources.has to always return false to hit the JSON.parse/stringify branch
      sources.has = vi.fn(() => false);
      
      const proxy = node({ state, config: null });
      const json = proxy.toJSON();
      
      // Restore original function
      sources.has = originalSourcesHas;
      
      // Verify result
      expect(json).toEqual({
        obj1: { a: 1, b: 2 },
        obj2: { c: 3, d: { e: 4 } }
      });
    });
    
    it('should handle JSON serialization of special objects', () => {
      // Use JSON.stringify to spy on calls
      const originalStringify = JSON.stringify;
      const originalParse = JSON.parse;
      
      const stringifySpy = vi.fn((val) => originalStringify(val));
      const parseSpy = vi.fn((val) => originalParse(val));
      
      JSON.stringify = stringifySpy;
      JSON.parse = parseSpy;
      
      // Create a node with values that will trigger JSON.parse(JSON.stringify())
      const state = {
        // Add a special object that's not easily serializable directly
        date: new Date('2023-01-01')
      };
      
      // Create proxy with mocks to control behavior
      const proxy = node({ state, config: null });
      
      // Force sources.has to always return false to ensure stringify/parse is used
      const originalSourcesHas = sources.has;
      sources.has = vi.fn(() => false);
      
      // Get JSON
      proxy.toJSON();
      
      // Restore originals
      sources.has = originalSourcesHas;
      JSON.stringify = originalStringify;
      JSON.parse = originalParse;
      
      // Verify the stringify/parse was called
      expect(stringifySpy).toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalled();
    });
    
    it('should fully cover the JSON.parse/stringify fallback path', () => {
      // Mock JSON methods
      const originalStringify = JSON.stringify;
      const originalParse = JSON.parse;
      
      // Create spies that actually call the original methods
      const stringifySpy = vi.fn((val) => originalStringify(val));
      const parseSpy = vi.fn((val) => originalParse(val));
      
      // Replace the methods with spies
      JSON.stringify = stringifySpy;
      JSON.parse = parseSpy;
      
      // Create nested object structure with non-standard objects
      const nestedObj = {
        value: new Date('2023-01-01')
      };
      
      const state = {
        nested: nestedObj
      };
      
      // Create a node proxy
      const proxy = node({ state, config: null });
      
      // Force specific behavior to hit the target lines
      const originalSourcesHas = sources.has;
      const originalSourcesGet = sources.get;
      
      sources.has = vi.fn((value) => false); // Force JSON.parse/stringify path
      sources.get = vi.fn(() => null);
      
      // Get JSON representation
      const json = proxy.toJSON();
      
      // Restore originals
      sources.has = originalSourcesHas;
      sources.get = originalSourcesGet;
      JSON.stringify = originalStringify;
      JSON.parse = originalParse;
      
      // Verify stringify/parse was called
      expect(stringifySpy).toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalled();
      
      // Verify result has the correct structure
      expect(json.nested).toHaveProperty('value');
    });
    
    it('should call for..in for property initialization', () => {
      // Instead of trying to mock Object methods, let's directly test that properties are accessed
      const accessedProps = new Set<string>();
      
      // Create an object with enumerable properties and a getter to track access
      const state = {
        prop1: 'value1',
        prop2: 'value2',
        get trackedProp() {
          accessedProps.add('trackedProp');
          return 'tracked';
        }
      };
      
      // Create node which should trigger property initialization
      node({ state, config: null });
      
      // Verify property was accessed during initialization
      expect(accessedProps.has('trackedProp')).toBe(true);
    });
    
    it('should directly hit the JSON.parse/stringify branch in toJSON', () => {
      // Direct approach to hit line 154-155
      
      // Save original methods
      const originalStringify = JSON.stringify;
      const originalParse = JSON.parse;
      
      // Set up spies
      const stringifySpy = vi.fn((val) => originalStringify(val));
      const parseSpy = vi.fn((val) => originalParse(val));
      
      // Replace with spies
      JSON.stringify = stringifySpy;
      JSON.parse = parseSpy;
      
      // Create a simple state
      const state = { obj: { value: 42 } };
      
      // Create a mock proxy for toJSON testing
      const proxy = node({ state, config: null });
      
      // Directly access the toJSON function from the proxy
      const toJSON = proxy.toJSON;
      
      // Mock the proxy's internal methods to force the specific code path
      const originalSourcesHas = sources.has;
      const originalSourcesGet = sources.get;
      
      sources.has = vi.fn((val) => false);
      sources.get = vi.fn(() => undefined);
      
      // Call toJSON
      const result = toJSON.call(proxy);
      
      // Restore original methods
      JSON.stringify = originalStringify;
      JSON.parse = originalParse;
      sources.has = originalSourcesHas;
      sources.get = originalSourcesGet;
      
      // Verify stringifySpy and parseSpy were called
      expect(stringifySpy).toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalled();
      
      // Verify the result
      expect(result).toEqual({ obj: { value: 42 } });
    });
    
    it('should handle nodes extended with plugin properties', () => {
      // Create a simple state
      const state = { prop: 'value' };
      
      // Create a node
      const proxy = node({ state, config: null });
      
      // Get the extensions map for this node
      const extensionsMap = extensions.get(proxy);
      
      // Ensure the extensions map exists
      expect(extensionsMap).toBeDefined();
      
      // Add an extension property (simulating what the extend plugin would do)
      extensionsMap!.set('test', {
        value: 'extended value',
        enumerable: true,
        configurable: true,
        writable: true
      });
      
      // Now test that the property exists and is included in serialization
      expect('test' in proxy).toBe(true);
      expect(proxy.test).toBe('extended value');
      
      // Test JSON serialization with extensions
      const json = proxy.toJSON();
      
      // The extension should not be included in the serialized output
      // as it's not part of the original state
      expect(json).toEqual({ prop: 'value' });
      
      // Also test setting an extended property
      proxy.test = 'new value';
      expect(proxy.test).toBe('new value');
    });
    
    it('should initialize complex properties during node creation', () => {
      // This test specifically targets the initialization loop in lines 166-167
      
      // Create an object with properties that need to be accessed
      const accessTracker = {
        accessed: {} as Record<string, boolean>
      };
      
      // Define properties with getters to track access
      const state = {
        get computed() {
          accessTracker.accessed.computed = true;
          return 'computed value';
        },
        normal: 'normal value'
      };
      
      // Create the node which should trigger initialization of all properties
      const result = node({ state, config: null });
      
      // Verify that the computed property was accessed during initialization
      expect(accessTracker.accessed.computed).toBe(true);
      
      // Add a test to cover the branches in the ownKeys trap with nodeExtensions check
      const keysSpy = vi.spyOn(Object, 'keys');
      
      // First test with existing extensions
      // Get the extensions map
      const extensionsMap = extensions.get(result);
      expect(extensionsMap).toBeDefined();
      
      // Add an extension property
      extensionsMap!.set('extProp', {
        value: 'extension value',
        enumerable: true,
        configurable: true
      });
      
      // Get keys - this will use the ownKeys trap with extensions
      const keys = Object.keys(result);
      
      // Verify the extension is included
      expect(keys).toContain('extProp');
      expect(keys).toContain('computed');
      expect(keys).toContain('normal');
      
      // Verify our spy was called
      expect(keysSpy).toHaveBeenCalled();
      
      // Now test without extensions by creating a case where extensions might not exist
      // Create a mock proxy with no extensions
      const noExtensionsProxy = {};
      
      // Delete all extensions maps to force a null return
      extensions.delete(result);
      
      // Get keys again - this will hit the early return branch
      const keysAgain = Object.keys(result);
      
      // Verify the extension is gone
      expect(keysAgain).not.toContain('extProp');
      
      // Restore the spy
      keysSpy.mockRestore();
    });
    
    it('should format paths correctly for array indices', () => {
      // This test targets lines 121 and 133 for array index path formatting
      
      // Create a state with an array
      const state = {
        array: [1, 2, 3]
      };
      
      // Create a mock watcher to track paths
      const mockWatcher = {
        watch: vi.fn(),
        batch: vi.fn(),
        ignore: vi.fn(),
        onGet: vi.fn(),
        onSet: vi.fn(),
        onDelete: vi.fn()
      };
      
      (createWatcher as any).mockReturnValue(mockWatcher);
      
      // Create the node
      const result = node({ state, config: null });
      
      // Access array element by index to trigger onGet with array index path format
      const element = result.array[1];
      expect(element).toBe(2);
      
      // Check that onGet was called with the correct path format ([1] not .1)
      expect(mockWatcher.onGet).toHaveBeenCalledWith('$.array[1]');
      
      // Set array element to trigger onSet with array index path format
      result.array[1] = 22;
      
      // Check that onSet was called with the correct path format
      expect(mockWatcher.onSet).toHaveBeenCalledWith('$.array[1]');
      
      // Delete array element to trigger onDelete with array index path format
      delete result.array[0];
      
      // Check that onDelete was called with the correct path format
      expect(mockWatcher.onDelete).toHaveBeenCalledWith('$.array[0]');
    });
  });
}); 