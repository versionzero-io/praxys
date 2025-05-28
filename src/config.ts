import { extend, ExtensionArgs, ExtensionFunction } from './extend';
import { resolve } from './registry';

/**
 * Plugin configuration entry
 * @internal
 */
interface PluginConfig {
  /** Name of the plugin */
  name: string;
  /** Options to pass to the plugin */
  opts: any;
}

/**
 * Configuration chain
 * @internal
 */
interface ConfigChain {
  /** Path for this configuration chain */
  _path: string;
  /** Plugins configured in this chain */
  _plugins: PluginConfig[];
}

/**
 * Configuration proxy returned by the config() function
 */
declare global {
  namespace Plugins {
    interface Config {
      /** All configuration chains */
      _chains: ConfigChain[];
      /** Use another configuration */
      use(otherConfig: Config): Config;
      /** Dynamic property access creates new chains */
      [key: string]: any;
    }
  }
}

/**
 * Type alias for Plugins.Config
 * @internal
 */
type Config = Plugins.Config;

/**
 * Arguments for the processConfig function
 * @internal
 */
interface ProcessConfigArgs {
  /** Configuration object */
  config: Config;
  /** Current path in the object tree */
  path: string;
  /** Node being processed */
  node?: any;
  /** State object */
  state?: any;
  /** Root object reference */
  root?: any;
  /** Plugin options */
  opts?: any;
  /** Other properties */
  [key: string]: any;
}

/**
 * Creates a configuration builder with chainable API
 * @type {ConfigFunction}
 */
function config(): Plugins.Config {
  const chains: ConfigChain[] = [];

  /**
   * Creates a chainable proxy for configuration
   */
  function chainProxy(pathArr: string[], chain: ConfigChain): any {
    // Create a function that contains all the logic that was previously in the apply handler
    const configFn = function () {
      // Create a safe string version of the method name
      let methodName = String(pathArr[pathArr.length - 1]);
      let parentPathArr = pathArr.slice(0, -1);
      let parentPath = parentPathArr.map(String).join('.');

      // Namespace support: check for namespaced methods in the store
      if (!resolve(methodName)) {
        for (let i = pathArr.length - 2; i >= 1; i--) { // skip '$' at index 0
          const nsName = pathArr.slice(i, pathArr.length).map(String).join('.');
          if (resolve(nsName)) {
            methodName = nsName;
            parentPathArr = pathArr.slice(0, i);
            parentPath = parentPathArr.map(String).join('.');
            break;
          }
        }
      }

      // Throw if the method is not registered
      if (!resolve(methodName)) {
        throw new Error(`Method ${methodName} not found`);
      }

      chain._path = parentPath;
      chain._plugins.push({ 
        name: methodName, 
        opts: arguments[0] // Store options with consistent naming
      });
      return chainProxy(parentPathArr, chain);
    };

    return new Proxy(configFn, {
      get(_, prop) {
        // Special properties should return accurate information
        if (prop === '_path') return chain._path;
        if (prop === '_plugins') return chain._plugins;
        if (prop === '_chains') return chains;

        // Extend the path for property chaining
        const newPathArr = [...pathArr, prop as string];
        return chainProxy(newPathArr, chain);
      }
    });
  }

  return new Proxy({} as Config, {
    get(_, prop) {
      if (prop === '_chains') return chains;
      
      // Handle the use method to merge configurations
      if (prop === 'use') {
        return function(this: Config, otherConfig: Config) {
          // Merge chains from the other config
          if (otherConfig._chains) {
            for (const otherChain of otherConfig._chains) {
              // Create a new chain with the same path
              const chainCopy: ConfigChain = {
                _path: otherChain._path,
                _plugins: []
              };
              
              // Add all plugins with their original options (no deep copy)
              for (const plugin of otherChain._plugins) {
                chainCopy._plugins.push({
                  name: plugin.name,
                  opts: plugin.opts // Preserve original options without copying
                });
              }

              // Add the chain to our chains
              chains.push(chainCopy);
            }
          }
          
          // Return this config for chaining
          return this;
        };
      }
      
      // Start a new chain for each first-level property
      const chain: ConfigChain = { _path: `$.${String(prop)}`, _plugins: [] };
      chains.push(chain); // Add the chain to the chains array
      return chainProxy(['$', prop as string], chain);
    },
  });
}

/**
 * Process configuration and apply it to the target
 */
function processConfig(args: ProcessConfigArgs): void {
  const { config, path } = args;
  if (!config._chains?.length) return;
  
  // Build up extensions for the node by running the plugins in the chains
  // That match the configuration provided by the user
  const chains = config._chains
    .filter(chain => path.startsWith(chain._path));
  
  if (!chains?.length) return;  

  for (const chain of chains) {
    const targeters = chain._plugins.filter(plugin => plugin.name === 'target');
    const hasTargeters = targeters.length > 0;
    const isExactPath = chain._path === path;

    if (!hasTargeters && !isExactPath) continue;

    let isTargeted = true;

    for (const targeter of targeters) {
      const targetPlugin = resolve('target');
      if (!targetPlugin) {
        throw new Error('Target plugin not found but targeting was specified');
      }
      
      const targetFunc = targetPlugin(args);
      const targeted = targetFunc(targeter.opts);
      if (!targeted) {
        isTargeted = false;
        break;
      }
    }

    if (!isTargeted) continue;

    for (const plug of chain._plugins) {
      if (plug.name === 'target') continue;

      const { name, opts } = plug;
      // Handle both direct plugin names and namespaced plugins
      const pluginFn = resolve(name);

      if (!pluginFn) {
        throw new Error(`Plugin ${name} not found`);
      }

      // Create the opts function that the extend plugin expects
      args.opts = function(innerArgs: ExtensionArgs) {
        innerArgs.opts = opts;
        return pluginFn(innerArgs);
      };

      extend(args as { opts: ExtensionFunction } & ExtensionArgs);
    }
  }
}

// export for consumers and testing
export { config, processConfig };