import { extensions, references } from './node';
import { register, resolve } from './registry';

/**
 * Plugin extension context
 * @internal
 */
export interface ExtensionArgs {
  /** The node being extended */
  node: any;
  /** The state of the node */
  state: any;
  /** The path of the node in the tree */
  path?: string;
  /** Any additional options passed to the plugin */
  opts?: any;
  /** The root node of the tree */
  root?: any;
  /** The parent node */
  parent?: any;
  /** Context object */
  ctx?: any;
  /** Utility functions */
  utils?: Record<string, any>;
}

/**
 * Extension function that returns properties to add to the node
 * @internal
 */
export type ExtensionFunction = (context: ExtensionArgs) => Record<string, any> | null;

/**
 * Options for extend plugin
 * @internal
 */
export type Options = ExtensionFunction;

/**
 * By Plugin convention we extend the Config object to type the config chaing
 * and export Node, State, Utils, and Ctx interfaces to describe any modifications made
 * so that userland developers can type extension and plugin arguments.
 */
declare global {
  namespace Plugins {
    interface Config {
      extend(options: Options): Config;
    }
  }
}

// Empty interfaces for plugin authors to extend
export interface Node {}
export interface State {}
export interface Utils {}
export interface Ctx {}

/**
 * Extend the node with the given function
 * @param {Object} params - Combined options and extension arguments
 */
export function extend(params: { opts: ExtensionFunction } & ExtensionArgs): any {
  const { opts: extendFn, node, ...rest } = params;
  
  // Call the extension function with the correct arguments
  const nodePrototype = extendFn({ node, ...rest });

  // If no extensions were added, return the node as is
  if (!nodePrototype) return node;

  // Get the descriptors of the extensions
  const descriptors = Object.getOwnPropertyDescriptors(nodePrototype);

  // Get existing extensions or create new one
  const extensionsMap = extensions.get(node) || new Map();

  // Special handling for toJSON if provided by the extension
  if (descriptors.toJSON) {
    // Store the original toJSON from the node
    const originalToJSON = node.toJSON;

    // Create a new toJSON that merges the results
    const pluginToJSON = descriptors.toJSON.value;

    Object.defineProperty(node, 'toJSON', {
      value: function () {
        // Call both and merge the results, with plugin taking precedence
        const baseResult = originalToJSON.call(this);
        const pluginResult = pluginToJSON ? pluginToJSON.call(this) : {};
        return { ...baseResult, ...pluginResult };
      },
      enumerable: false,
      configurable: true,
      writable: true
    });

    // Remove toJSON from descriptors to prevent it from being processed again
    delete descriptors.toJSON;
  }

  // Store full descriptors
  for (const [key, descriptor] of Object.entries(descriptors)) {
    const isRef = key.endsWith('Ref');
    const name = isRef ? key.slice(0, -3) : key;

    // Bind getters and setters to node
    if (descriptor.get) {
      descriptor.get = descriptor.get.bind(node);
    }
    if (descriptor.set) {
      descriptor.set = descriptor.set.bind(node);
    }

    if (isRef) {
      const refs = references.get(node);
      if (refs) {
        refs.add(name);
      }
    }

    extensionsMap.set(name, descriptor);

    // Define ALL properties on the node, not just value properties
    if ('value' in descriptor) {
      // if it's a function make sure it's not enumerable
      if (typeof descriptor.value === 'function') {
        descriptor.enumerable = false;
      }

      // For value properties (not getters/setters), define directly on node
      Object.defineProperty(node, key, descriptor);
    }
  }

  // Store the extensions
  extensions.set(node, extensionsMap);
}

// register the extend function
register('extend', extend);
