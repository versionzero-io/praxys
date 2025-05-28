/**
 * Plugin type definition
 * For type-level documentation only
 */
export interface Plugin<Ctx, Utils, Opts, Props> {
  context:    Ctx
  utilities:  Utils
  options:    Opts
  properties: Props
}

/**
 * Plugin function signature
 */
export type PluginFunction = (args: any) => any;

/**
 * Registry for storing plugin functions
 */
export interface Registry {
  /** Register a plugin with the system */
  register: (key: string, pluginFn: PluginFunction) => void;
  
  /** Resolve a plugin function by key */
  resolve: (key: string) => Function | undefined;
} 

// Runtime storage of plugin functions
export const plugins = new Map<string, Function>();

/**
 * Register a plugin at runtime.
 */
export function register(key: string, pluginFn: PluginFunction): void {
  // check if the key is falsy
  if (!key) {
    throw new Error('Invalid plugin key');
  }

  if (plugins.has(key)) {
    throw new Error(`Plugin ${key} already registered`);
  }
  plugins.set(key, pluginFn);
}

/** 
 * Pulls out the raw Function for runtime use
 */
export function resolve(key: string): Function | undefined {
  return plugins.get(key);
}
