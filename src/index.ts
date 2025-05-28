/**
 * Praxys - Data Made Practical
 * A state management library combining declarative configuration, fine-grained reactivity, and a flexible extension/plugin system.
 * 
 * Global namespace declarations for Praxys plugins
 */
declare global {
  namespace Plugins {
    /**
     * Configuration object
     */
    interface Config {}
  }
}

// Initialize plugins
import './extend';
import './target';

// Core functionality
export { praxys } from './praxys';
export type { Praxys } from './praxys';

export { config } from './config';
export { register, resolve } from './registry';
export type { PluginFunction } from './registry';

// Type exports
export type {
  WatchCallback,
  BatchCallback,
  IgnoreCallback,
  StopFunction,
} from './watch';

export type {
  Ref,
} from './node';

