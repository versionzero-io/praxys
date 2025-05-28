import { createWatcher } from './watch';
import { processConfig } from './config';
import type { WatchCallback, StopFunction, BatchCallback, IgnoreCallback, Watcher } from './watch';

/**
 * NodeOptions defines the parameters for creating a new node
 */
export interface NodeOptions {
  /** Configuration object for the node */
  config: any;
  /** State/data of the node */
  state: Record<string, any>;
  /** Root node of the tree (for nested nodes) */
  root?: Record<string, any>;
  /** Parent node (for nested nodes) */
  parent?: Record<string, any>;
  /** Path to this node in the tree */
  path?: string;
  /** Context object shared across nodes */
  ctx?: Record<string, any>;
  /** Utility functions available to the node */
  utils?: Record<string, any>;
}

/**
 * NodeInstance represents a proxied node instance
 * @internal
 */
export interface NodeInstance extends Record<string, any> {
  /** Watch for changes in the state */
  watch: (callback: WatchCallback) => StopFunction;
  /** Batch multiple changes into a single update */
  batch: (fn: BatchCallback) => void;
  /** Ignore a function from dependency tracking */
  ignore: (fn: IgnoreCallback) => void;
  /** Convert the node to a plain JSON object */
  toJSON: () => Record<string, any>;
}

/**
 * Collection of WeakMaps and WeakSets used to track node instances
 */
export interface NodeTracker {
  /** All node instances */
  instances: WeakSet<any>;
  /** Map from source objects to their node instances */
  sources: WeakMap<any, any>;
  /** Map from nodes to their watchers */
  watchers: WeakMap<any, Watcher>;
  /** Map from nodes to their extensions */
  extensions: WeakMap<any, Map<string, PropertyDescriptor>>;
  /** Map from nodes to their references */
  references: WeakMap<any, Set<string>>;
}

/**
 * Type utility to mark a property as non-reactive 
 * 
 * This is purely for documentation purposes to indicate that
 * a property will be implemented using the Ref pattern and
 * will not trigger reactivity when accessed or modified.
 * 
 * @example
 * ```typescript
 * interface Properties {
 *   id: Ref<string>; // Indicates a non-reactive property
 * }
 * ```
 * @public
 */
export type Ref<T> = T;

/**
 * Utility type to mark properties as Ref pattern
 * 
 * This transforms properties to use the Ref pattern where a property
 * like 'id' is exposed as 'idRef' in the extension but as 'id' on the node.
 */
export type Refs<T, K extends Array<keyof T>> = {
  [P in keyof T as P extends K[number] ? `${string & P}Ref` : P]: T[P];
};


// track instances of node
export const instances: WeakSet<any> = new WeakSet();

// track sources to their instances
export const sources: WeakMap<any, any> = new WeakMap();

// track watcher instances
export const watchers: WeakMap<any, Watcher> = new WeakMap();

// Store extensions for specific nodes
export const extensions: WeakMap<any, Map<string, PropertyDescriptor>> = new WeakMap();

// Store refs for specific nodes
export const references: WeakMap<any, Set<string>> = new WeakMap();

// helper to check if a value should be returned as is
export function validNodeState(state: unknown): boolean {
  const isObject = Object.prototype.toString.call(state) === '[object Object]';
  const isArray = Array.isArray(state);

  const isNotPlainObjectOrArray = !isObject && !isArray;
  if (isNotPlainObjectOrArray) return false;

  return true;
}

export function node(options: NodeOptions): NodeInstance | any {
  const { config, state, root, parent, path = "$", ctx = {}, utils = {} } = options;
  
  if (instances.has(state)) {
    return state;
  }

  if (sources.has(state)) {
    return sources.get(state);
  }

  if (!validNodeState(state)) {
    return state;
  }

  const proxy = new Proxy(state, {
    get(target: Record<string, any>, prop: string | symbol): any {
      // If it's a symbol, return it as is
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop);
      }

      let value = target[prop as keyof typeof target];
    
      // Check for extensions
      const nodeExtensions = extensions.get(proxy);
      if (nodeExtensions && nodeExtensions.has(prop as string)) {
        const descriptor = nodeExtensions.get(prop as string);
        if (descriptor && descriptor.get) {
          // Getters are already bound, so just call directly
          value = descriptor.get();
        } else if (descriptor && 'value' in descriptor) {
          // Return value properties directly
          value = descriptor.value;
        }
      }

      // If it's a function or in references, return it as is
      const refs = references.get(proxy);
      if (typeof value === 'function' || (refs && refs.has(prop as string))) {
        return value;
      }

      const nextProp = !isNaN(Number(prop)) ? `[${String(prop)}]` : `.${String(prop)}`;
      const nextPath = `${path}${nextProp}`;

      // Notify the watcher that a value has been accessed
      const watcher = watchers.get(root || proxy);
      if (watcher) {
        watcher.onGet(nextPath);
      }

      // Update the context path and parent
      value = node({ 
        state: value, 
        config,
        root: root || proxy, 
        parent: proxy, 
        path: nextPath, 
        ctx, 
        utils 
      });

      return value;
    },
    set(target: Record<string, any>, prop: string | symbol, value: any): boolean {
      // Check for extensions
      const nodeExtensions = extensions.get(proxy);
      if (nodeExtensions && nodeExtensions.has(prop as string)) {
        const descriptor = nodeExtensions.get(prop as string);
        if (descriptor && descriptor.set) {
          // Setters are already bound, so just call directly
          descriptor.set(value);
        } else if (descriptor && 'value' in descriptor) {
          // Set the value directly if it's a value property
          descriptor.value = value;
        }
      } else {
        // Set the value directly if it's not an extension
        target[prop as keyof typeof target] = value;
      }

      // If there's a reference skip the watcher
      const refs = references.get(proxy);
      if (refs && refs.has(prop as string)) {
        return true;
      }
      
      // Calculate the path for this property
      const nextProp = !isNaN(Number(prop)) ? `[${String(prop)}]` : `.${String(prop)}`;
      const propPath = `${path}${nextProp}`;

      const watcher = watchers.get(root || proxy);
      if (watcher) {
        watcher.onSet(propPath);
      }
      
      return true;
    },
    deleteProperty(target: Record<string, any>, prop: string | symbol): boolean {
      // Calculate the path for this property
      const nextProp = !isNaN(Number(prop)) ? `[${String(prop)}]` : `.${String(prop)}`;
      const propPath = `${path}${nextProp}`;
      
      delete target[prop as keyof typeof target];
      
      // Use a local variable to reference receiver since it's not a parameter
      const watcher = watchers.get(root || proxy);
      if (watcher) {
        watcher.onDelete(propPath);
      }

      const refs = references.get(proxy);
      if (refs && refs.has(prop as string)) {
        refs.delete(prop as string);
      }
      return true;
    },
    has(target: Record<string, any>, prop: string | symbol): boolean {
      // Check if it's an extension property
      const nodeExtensions = extensions.get(proxy);
      if (nodeExtensions && nodeExtensions.has(prop as string)) {
        return true;
      }
      // Otherwise check the target
      return Reflect.has(target, prop);
    },
    ownKeys(target: Record<string, any>): ArrayLike<string | symbol> {
      // Get regular keys
      const regularKeys = Reflect.ownKeys(target);
      
      // Get extension keys
      const nodeExtensions = extensions.get(proxy);
      if (!nodeExtensions) {
        return regularKeys;
      }
      
      // Combine the regular keys with extension keys
      const extKeys = Array.from(nodeExtensions.keys());
      
      // Return unique keys
      return [...new Set([...regularKeys, ...extKeys])];
    },
    getOwnPropertyDescriptor(target: Record<string, any>, prop: string | symbol): PropertyDescriptor | undefined {
      // Check extensions first
      const nodeExtensions = extensions.get(proxy);
      if (nodeExtensions && nodeExtensions.has(prop as string)) {
        // Use the stored descriptor but ensure it's configurable
        const descriptor = nodeExtensions.get(prop as string);
        return { ...descriptor, configurable: true };
      }
      
      // Otherwise return the regular descriptor
      return Reflect.getOwnPropertyDescriptor(target, prop);
    }
  });

  // If this is the root node, create a watcher and define the methods
  if (!root) {
    const watcher = createWatcher();
    watchers.set(proxy, watcher);

    for(const method of ['watch', 'batch', 'ignore'] as const) {
      Object.defineProperty(proxy, method, {
        value: watcher[method],
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
  }

  // Add toJSON method
  Object.defineProperties(proxy, {
    toJSON: {
      value: function() {
        const result: Record<string, any> = Array.isArray(state) ? [] : {};
        for (const [key, value] of Object.entries(state)) {
          if (value && typeof value === 'object') {
            if (sources.has(value)) {
              const nodeValue = sources.get(value);
              result[key] = nodeValue.toJSON();
            } else {
              result[key] = JSON.parse(JSON.stringify(value));
            }
          } else {
            result[key] = value;
          }
        }
        return result;
      },
      writable: true,
      enumerable: false,
      configurable: true
    }
  });

  // Mark this as a node instance and remember its source
  instances.add(proxy);
  sources.set(state, proxy);
  references.set(proxy, new Set());
  extensions.set(proxy, new Map());

  // Apply extenders
  if (config) {
    processConfig({ config, path, state, node: proxy, root: root || proxy, parent, ctx, utils });
  }

  // Access all the props to initialize
  for(const prop in state) {
    proxy[prop];
  }

  // Return the proxy
  return proxy as NodeInstance;
}