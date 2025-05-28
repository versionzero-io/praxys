import { config } from "./config";
import { node } from "./node";
import type { WatchCallback, StopFunction, BatchCallback, IgnoreCallback } from './watch';

/**
 * Praxys instance methods available on every store
 * @public
 */
export interface Praxys {
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
export function praxys<T extends Record<string, any> = Record<string, any>>(
  S = {} as T, 
  $ = config()
): T & Praxys {
  const path = "$";
  const parent = undefined;
  const root = undefined;
  const ctx = {};
  const utils = {};

  return node({
    state: S,
    config: $,
    path,
    parent,
    root,
    ctx,
    utils,
  }) as T & Praxys;
}

// Re-export the config function
export { config };
