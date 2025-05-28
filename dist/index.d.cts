/**
 * Plugin extension context
 * @internal
 */
interface ExtensionArgs {
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
type ExtensionFunction = (context: ExtensionArgs) => Record<string, any> | null;
/**
 * Options for extend plugin
 * @internal
 */
type Options = ExtensionFunction;
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

/**
 * Options for target plugin
 * @internal
 */
interface TargetContext {
    /** Current path in object tree */
    path?: string;
    /** Current state */
    state: any;
}
/**
 * Function that evaluates whether a target condition is met
 * @internal
 */
type TargetFunction = (context: TargetContext) => boolean;
/**
 * By Plugin convention we extend the Config object to type the config chaing
 * and export Node, State, Utils, and Ctx interfaces to describe any modifications made
 * so that userland developers can type extension and plugin arguments.
 */
declare global {
    namespace Plugins {
        interface Config {
            target(options: boolean | TargetFunction): Config;
        }
    }
}

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
 * Creates a configuration builder with chainable API
 * @type {ConfigFunction}
 */
declare function config(): Plugins.Config;

/**
 * Callback function for watchers
 * @public
 */
type WatchCallback = () => any;
/**
 * Function to stop watching (unsubscribe)
 * @public
 */
type StopFunction = () => void;
/**
 * Function to be executed in a batch context
 * @public
 */
type BatchCallback = () => any;
/**
 * Function to be executed in an ignore context
 * @public
 */
type IgnoreCallback = () => any;

/**
 * Praxys instance methods available on every store
 * @public
 */
interface Praxys {
    /** Watch for changes in the state */
    watch: (fn: WatchCallback) => StopFunction;
    /** Batch multiple changes into a single update */
    batch: (fn: BatchCallback) => void;
    /** Ignore a function from dependency tracking */
    ignore: (fn: IgnoreCallback) => void;
}
/**
 * Create a reactive node with configuration
 *
 * @param S - Initial state object
 * @param $ - Configuration object
 * @returns A reactive node instance with Praxys methods
 * @public
 */
declare function praxys<T extends Record<string, any> = Record<string, any>>(S?: T, $?: Plugins.Config): T & Praxys;

/**
 * Plugin function signature
 */
type PluginFunction = (args: any) => any;
/**
 * Register a plugin at runtime.
 */
declare function register(key: string, pluginFn: PluginFunction): void;
/**
 * Pulls out the raw Function for runtime use
 */
declare function resolve(key: string): Function | undefined;

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
type Ref<T> = T;

/**
 * Praxys - Data Made Practical
 * A state management library combining declarative configuration, fine-grained reactivity, and a extension/plugin system.
 *
 * Global namespace declarations for Praxys plugins
 */
declare global {
    namespace Plugins {
        /**
         * Configuration object
         */
        interface Config {
        }
    }
}

export { type BatchCallback, type IgnoreCallback, type PluginFunction, type Praxys, type Ref, type StopFunction, type WatchCallback, config, praxys, register, resolve };
