/**
 * Callback function for watchers
 * @public
 */
export type WatchCallback = () => any;

/**
 * Function to stop watching (unsubscribe)
 * @public
 */
export type StopFunction = () => void;

/**
 * Function to be executed in a batch context
 * @public
 */
export type BatchCallback = () => any;

/**
 * Function to be executed in an ignore context
 * @public
 */
export type IgnoreCallback = () => any;

/**
 * Watcher interface - the object returned by createWatcher
 */
export interface Watcher {
  /** Register a dependency when a property is accessed */
  onGet: (path: string) => void;
  
  /** Notify watchers when a property is changed */
  onSet: (path: string) => void;
  
  /** Notify watchers when a property is deleted */
  onDelete: (path: string) => void;
  
  /** Set up a reactive watch function */
  watch: (fn: WatchCallback) => StopFunction;
  
  /** Run a function without tracking dependencies */
  ignore: (fn: IgnoreCallback) => any;
  
  /** Execute a function in batch mode */
  batch: (fn: BatchCallback) => any;
  
  /** Internal state for testing */
  __state?: WatcherState;
}

/**
 * Internal state for tracking dependencies
 */
export interface WatcherState {
  tracking: {
    activeDependency: Function | null;
    pathDependencies: Map<string, Set<Function>>;
    callbackPaths: Map<Function, Set<string>>;
  };
  mode: {
    batchMode: boolean;
    ignoreMode: boolean;
  };
  batch: {
    pendingPaths: Set<string>;
    batchLevel: number;
  };
  notification: {
    inProgress: Set<string>;
    unwatchedCallbacks: Set<Function>;
  };
}

/**
 * Function to create a new watcher
 */
export type CreateWatcherFunction = () => Watcher; 

/**
 * Creates a watcher that manages reactivity for a specific node instance.
 * Each node root will have its own watcher with watch, batch, and ignore methods.
 */
export const createWatcher: CreateWatcherFunction = () => {
  // Organize state into logical groups
  const state: WatcherState = {
    // Dependency tracking
    tracking: {
      activeDependency: null,
      // Track which paths a callback depends on
      pathDependencies: new Map(), // path -> Set of callbacks
      // Track which paths a callback is watching
      callbackPaths: new Map(), // callback -> Set of paths
    },
    // Execution modes
    mode: {
      batchMode: false,
      ignoreMode: false,
    },
    // Batch operation state
    batch: {
      pendingPaths: new Set(),
      // Track the nesting level
      batchLevel: 0,
    },
    // Notification management
    notification: {
      inProgress: new Set(),
      unwatchedCallbacks: new Set(),
    }
  };

  /**
   * Helper to run callbacks safely
   * Note: collectionSet is always provided in the current implementation, which is why 
   * there's no 'else' branch for direct execution (it would be unreachable code).
   * Also, callbacks is always a Set from pathDependencies and never null.
   */
  function runCallbacks(callbacks: Set<Function>, collectionSet: Set<Function> | null = null): void {
    callbacks.forEach((fn) => {
      if (!state.notification.unwatchedCallbacks.has(fn)) {
        if (collectionSet) {
          collectionSet.add(fn);
        }
      }
    });
  }

  /**
   * Helper to add a dependency between a callback and a path
   */
  function addDependency(path: string, callback: Function): void {
    // Add to path dependencies
    if (!state.tracking.pathDependencies.has(path)) {
      state.tracking.pathDependencies.set(path, new Set());
    }
    const callbacks = state.tracking.pathDependencies.get(path)!;
    callbacks.add(callback);

    // Track paths for this callback
    if (!state.tracking.callbackPaths.has(callback)) {
      state.tracking.callbackPaths.set(callback, new Set());
    }
    const paths = state.tracking.callbackPaths.get(callback)!;
    paths.add(path);
  }

  /**
   * Helper to remove a dependency between a callback and a path
   */
  function removeDependency(path: string, callback: Function): void {
    // Remove from path dependencies
    if (state.tracking.pathDependencies.has(path)) {
      const callbacks = state.tracking.pathDependencies.get(path)!;
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        state.tracking.pathDependencies.delete(path);
      }
    }
  }

  /**
   * Register a dependency on a specific path
   */
  function onGet(path: string): void {
    if (state.tracking.activeDependency) {
      // Add to path dependencies
      addDependency(path, state.tracking.activeDependency);
    }
  }

  /**
   * Helper to add a path to the batch queue
   */
  function addToBatch(path: string): void {
    state.batch.pendingPaths.add(path);
  }

  /**
   * Notify watchers when a path has changed
   */
  function notify(path: string): void {
    // If in ignore mode, don't trigger notifications
    if (state.mode.ignoreMode) return;

    // If in batch mode, collect notifications to process later
    if (state.mode.batchMode) {
      addToBatch(path);
      return;
    }

    // Prevent recursive notifications
    if (state.notification.inProgress.has(path)) return;
    state.notification.inProgress.add(path);

    try {
      // Notify only dependencies that exactly match this path
      const callbacksToRun = new Set<Function>();
      
      // Find all callbacks that depend directly on this exact path
      if (state.tracking.pathDependencies.has(path)) {
        const callbacks = state.tracking.pathDependencies.get(path)!;
        runCallbacks(callbacks, callbacksToRun);
      }

      // Run the callbacks
      callbacksToRun.forEach(fn => fn());
    } finally {
      state.notification.inProgress.delete(path);
    }
  }

  /**
   * Notify watchers when a property is changed
   */
  function onSet(path: string): void {
    notify(path);
  }

  /**
   * Notify watchers when a property is deleted
   */
  function onDelete(path: string): void {
    notify(path);
  }

  /**
   * Set up a reactive watch with this watcher's state
   */
  function watch(callback: WatchCallback): StopFunction {
    const runFn = () => {
      state.tracking.activeDependency = runFn;

      try {
        callback();
      } finally {
        state.tracking.activeDependency = null;
      }
    };

    runFn(); // Initial run

    // Return a stop function
    return () => {
      // Mark as unwatched to prevent further calls
      state.notification.unwatchedCallbacks.add(runFn);

      // Clean up dependencies
      if (state.tracking.callbackPaths.has(runFn)) {
        const paths = state.tracking.callbackPaths.get(runFn)!;
        
        // Remove this callback from all path dependencies
        paths.forEach(path => {
          removeDependency(path, runFn);
        });
        
        // Remove tracked paths
        state.tracking.callbackPaths.delete(runFn);
      }
    };
  }

  /**
   * Run a function without tracking dependencies
   */
  function ignore(fn: IgnoreCallback): void {
    const previousIgnoreMode = state.mode.ignoreMode;
    state.mode.ignoreMode = true;

    try {
      return fn();
    } finally {
      state.mode.ignoreMode = previousIgnoreMode;
    }
  }

  /**
   * Execute a function in batch mode
   */
  function batch(fn: BatchCallback): void {
    // Track batch nesting level
    state.batch.batchLevel++;

    // Only initialize batch state at the top level
    const isTopLevelBatch = state.batch.batchLevel === 1;
    if (isTopLevelBatch) {
      state.mode.batchMode = true;
    }

    try {
      // Run the function in batch mode
      const result = fn();

      // Only process notifications if we're exiting the top-level batch
      state.batch.batchLevel--;
      if (isTopLevelBatch) {
        processBatchNotifications();
      }

      return result;
    } catch (e) {
      // Clean up on error - make sure to decrement batch level
      state.batch.batchLevel--;

      // Reset batch state if we're at the top level
      if (isTopLevelBatch) {
        state.mode.batchMode = false;
        state.batch.pendingPaths.clear();
      }
      throw e;
    }
  }

  /**
   * Process all pending notifications in batch mode
   */
  function processBatchNotifications(): void {
    state.mode.batchMode = false;

    // Collect all unique callbacks that need to be notified
    const callbacksToRun = new Set<Function>();

    // Find all callbacks that depend on any of the pending paths
    state.batch.pendingPaths.forEach(changedPath => {
      // Only notify callbacks that directly depend on the exact path that changed
      if (state.tracking.pathDependencies.has(changedPath)) {
        const callbacks = state.tracking.pathDependencies.get(changedPath)!;
        runCallbacks(callbacks, callbacksToRun);
      }
    });

    // Run each callback exactly once
    callbacksToRun.forEach((fn) => fn());

    // Clean up
    state.batch.pendingPaths.clear();
  }

  const watcher: Watcher = {
    onGet,
    onSet,
    onDelete,
    watch,
    ignore,
    batch,
  };

  // Expose internal state for testing only in test environment
  if (process.env.NODE_ENV === 'test') {
    (watcher as any).__state = state;
  }

  return watcher;
}
