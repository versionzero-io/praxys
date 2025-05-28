import { register } from './registry';

/**
 * Options for target plugin
 * @internal
 */
export interface TargetContext {
  /** Current path in object tree */
  path?: string;
  /** Current state */
  state: any;
}

/**
 * Function that evaluates whether a target condition is met
 * @internal
 */
export type TargetFunction = (context: TargetContext) => boolean;

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

// Empty interfaces for plugin authors to extend
export interface Node {}
export interface State {}
export interface Utils {}
export interface Ctx {}

/**
 * Boolean value or function that determines if targeting conditions are met
 */
export type Options = boolean | TargetFunction;

/**
 * Plugin for conditional application of other plugins
 * - Allows targeting plugins based on path or state criteria
 */
function target(args: { path?: string, state: any }) {
  return (options: Options): boolean => {
    return typeof options === 'boolean' ? 
      options : options({ 
        path: args.path, 
        state: args.state 
      });
  };
}

// Register the target plugin with the registry
register('target', target);

// Export for direct usage
export { target };

