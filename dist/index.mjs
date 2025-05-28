// src/watch.ts
var createWatcher = () => {
  const state = {
    // Dependency tracking
    tracking: {
      activeDependency: null,
      // Track which paths a callback depends on
      pathDependencies: /* @__PURE__ */ new Map(),
      // path -> Set of callbacks
      // Track which paths a callback is watching
      callbackPaths: /* @__PURE__ */ new Map()
      // callback -> Set of paths
    },
    // Execution modes
    mode: {
      batchMode: false,
      ignoreMode: false
    },
    // Batch operation state
    batch: {
      pendingPaths: /* @__PURE__ */ new Set(),
      // Track the nesting level
      batchLevel: 0
    },
    // Notification management
    notification: {
      inProgress: /* @__PURE__ */ new Set(),
      unwatchedCallbacks: /* @__PURE__ */ new Set()
    }
  };
  function runCallbacks(callbacks, collectionSet = null) {
    callbacks.forEach((fn) => {
      if (!state.notification.unwatchedCallbacks.has(fn)) {
        if (collectionSet) {
          collectionSet.add(fn);
        }
      }
    });
  }
  function addDependency(path, callback) {
    if (!state.tracking.pathDependencies.has(path)) {
      state.tracking.pathDependencies.set(path, /* @__PURE__ */ new Set());
    }
    const callbacks = state.tracking.pathDependencies.get(path);
    callbacks.add(callback);
    if (!state.tracking.callbackPaths.has(callback)) {
      state.tracking.callbackPaths.set(callback, /* @__PURE__ */ new Set());
    }
    const paths = state.tracking.callbackPaths.get(callback);
    paths.add(path);
  }
  function removeDependency(path, callback) {
    if (state.tracking.pathDependencies.has(path)) {
      const callbacks = state.tracking.pathDependencies.get(path);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        state.tracking.pathDependencies.delete(path);
      }
    }
  }
  function onGet(path) {
    if (state.tracking.activeDependency) {
      addDependency(path, state.tracking.activeDependency);
    }
  }
  function addToBatch(path) {
    state.batch.pendingPaths.add(path);
  }
  function notify(path) {
    if (state.mode.ignoreMode) return;
    if (state.mode.batchMode) {
      addToBatch(path);
      return;
    }
    if (state.notification.inProgress.has(path)) return;
    state.notification.inProgress.add(path);
    try {
      const callbacksToRun = /* @__PURE__ */ new Set();
      if (state.tracking.pathDependencies.has(path)) {
        const callbacks = state.tracking.pathDependencies.get(path);
        runCallbacks(callbacks, callbacksToRun);
      }
      callbacksToRun.forEach((fn) => fn());
    } finally {
      state.notification.inProgress.delete(path);
    }
  }
  function onSet(path) {
    notify(path);
  }
  function onDelete(path) {
    notify(path);
  }
  function watch(callback) {
    const runFn = () => {
      state.tracking.activeDependency = runFn;
      try {
        callback();
      } finally {
        state.tracking.activeDependency = null;
      }
    };
    runFn();
    return () => {
      state.notification.unwatchedCallbacks.add(runFn);
      if (state.tracking.callbackPaths.has(runFn)) {
        const paths = state.tracking.callbackPaths.get(runFn);
        paths.forEach((path) => {
          removeDependency(path, runFn);
        });
        state.tracking.callbackPaths.delete(runFn);
      }
    };
  }
  function ignore(fn) {
    const previousIgnoreMode = state.mode.ignoreMode;
    state.mode.ignoreMode = true;
    try {
      return fn();
    } finally {
      state.mode.ignoreMode = previousIgnoreMode;
    }
  }
  function batch(fn) {
    state.batch.batchLevel++;
    const isTopLevelBatch = state.batch.batchLevel === 1;
    if (isTopLevelBatch) {
      state.mode.batchMode = true;
    }
    try {
      const result = fn();
      state.batch.batchLevel--;
      if (isTopLevelBatch) {
        processBatchNotifications();
      }
      return result;
    } catch (e) {
      state.batch.batchLevel--;
      if (isTopLevelBatch) {
        state.mode.batchMode = false;
        state.batch.pendingPaths.clear();
      }
      throw e;
    }
  }
  function processBatchNotifications() {
    state.mode.batchMode = false;
    const callbacksToRun = /* @__PURE__ */ new Set();
    state.batch.pendingPaths.forEach((changedPath) => {
      if (state.tracking.pathDependencies.has(changedPath)) {
        const callbacks = state.tracking.pathDependencies.get(changedPath);
        runCallbacks(callbacks, callbacksToRun);
      }
    });
    callbacksToRun.forEach((fn) => fn());
    state.batch.pendingPaths.clear();
  }
  const watcher = {
    onGet,
    onSet,
    onDelete,
    watch,
    ignore,
    batch
  };
  if (process.env.NODE_ENV === "test") {
    watcher.__state = state;
  }
  return watcher;
};

// src/registry.ts
var plugins = /* @__PURE__ */ new Map();
function register(key, pluginFn) {
  if (!key) {
    throw new Error("Invalid plugin key");
  }
  if (plugins.has(key)) {
    throw new Error(`Plugin ${key} already registered`);
  }
  plugins.set(key, pluginFn);
}
function resolve(key) {
  return plugins.get(key);
}

// src/config.ts
function config() {
  const chains = [];
  function chainProxy(pathArr, chain) {
    const configFn = function() {
      let methodName = String(pathArr[pathArr.length - 1]);
      let parentPathArr = pathArr.slice(0, -1);
      let parentPath = parentPathArr.map(String).join(".");
      if (!resolve(methodName)) {
        for (let i = pathArr.length - 2; i >= 1; i--) {
          const nsName = pathArr.slice(i, pathArr.length).map(String).join(".");
          if (resolve(nsName)) {
            methodName = nsName;
            parentPathArr = pathArr.slice(0, i);
            parentPath = parentPathArr.map(String).join(".");
            break;
          }
        }
      }
      if (!resolve(methodName)) {
        throw new Error(`Method ${methodName} not found`);
      }
      chain._path = parentPath;
      chain._plugins.push({
        name: methodName,
        opts: arguments[0]
        // Store options with consistent naming
      });
      return chainProxy(parentPathArr, chain);
    };
    return new Proxy(configFn, {
      get(_, prop) {
        if (prop === "_path") return chain._path;
        if (prop === "_plugins") return chain._plugins;
        if (prop === "_chains") return chains;
        const newPathArr = [...pathArr, prop];
        return chainProxy(newPathArr, chain);
      }
    });
  }
  return new Proxy({}, {
    get(_, prop) {
      if (prop === "_chains") return chains;
      if (prop === "use") {
        return function(otherConfig) {
          if (otherConfig._chains) {
            for (const otherChain of otherConfig._chains) {
              const chainCopy = {
                _path: otherChain._path,
                _plugins: []
              };
              for (const plugin of otherChain._plugins) {
                chainCopy._plugins.push({
                  name: plugin.name,
                  opts: plugin.opts
                  // Preserve original options without copying
                });
              }
              chains.push(chainCopy);
            }
          }
          return this;
        };
      }
      const chain = { _path: `$.${String(prop)}`, _plugins: [] };
      chains.push(chain);
      return chainProxy(["$", prop], chain);
    }
  });
}
function processConfig(args) {
  const { config: config2, path } = args;
  if (!config2._chains?.length) return;
  const chains = config2._chains.filter((chain) => path.startsWith(chain._path));
  if (!chains?.length) return;
  for (const chain of chains) {
    const targeters = chain._plugins.filter((plugin) => plugin.name === "target");
    const hasTargeters = targeters.length > 0;
    const isExactPath = chain._path === path;
    if (!hasTargeters && !isExactPath) continue;
    let isTargeted = true;
    for (const targeter of targeters) {
      const targetPlugin = resolve("target");
      if (!targetPlugin) {
        throw new Error("Target plugin not found but targeting was specified");
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
      if (plug.name === "target") continue;
      const { name, opts } = plug;
      const pluginFn = resolve(name);
      if (!pluginFn) {
        throw new Error(`Plugin ${name} not found`);
      }
      args.opts = function(innerArgs) {
        innerArgs.opts = opts;
        return pluginFn(innerArgs);
      };
      extend(args);
    }
  }
}

// src/node.ts
var instances = /* @__PURE__ */ new WeakSet();
var sources = /* @__PURE__ */ new WeakMap();
var watchers = /* @__PURE__ */ new WeakMap();
var extensions = /* @__PURE__ */ new WeakMap();
var references = /* @__PURE__ */ new WeakMap();
function validNodeState(state) {
  const isObject = Object.prototype.toString.call(state) === "[object Object]";
  const isArray = Array.isArray(state);
  const isNotPlainObjectOrArray = !isObject && !isArray;
  if (isNotPlainObjectOrArray) return false;
  return true;
}
function node(options) {
  const { config: config2, state, root, parent, path = "$", ctx = {}, utils = {} } = options;
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
    get(target2, prop) {
      if (typeof prop === "symbol") {
        return Reflect.get(target2, prop);
      }
      let value = target2[prop];
      const nodeExtensions = extensions.get(proxy);
      if (nodeExtensions && nodeExtensions.has(prop)) {
        const descriptor = nodeExtensions.get(prop);
        if (descriptor && descriptor.get) {
          value = descriptor.get();
        } else if (descriptor && "value" in descriptor) {
          value = descriptor.value;
        }
      }
      const refs = references.get(proxy);
      if (typeof value === "function" || refs && refs.has(prop)) {
        return value;
      }
      const nextProp = !isNaN(Number(prop)) ? `[${String(prop)}]` : `.${String(prop)}`;
      const nextPath = `${path}${nextProp}`;
      const watcher = watchers.get(root || proxy);
      if (watcher) {
        watcher.onGet(nextPath);
      }
      value = node({
        state: value,
        config: config2,
        root: root || proxy,
        parent: proxy,
        path: nextPath,
        ctx,
        utils
      });
      return value;
    },
    set(target2, prop, value) {
      const nodeExtensions = extensions.get(proxy);
      if (nodeExtensions && nodeExtensions.has(prop)) {
        const descriptor = nodeExtensions.get(prop);
        if (descriptor && descriptor.set) {
          descriptor.set(value);
        } else if (descriptor && "value" in descriptor) {
          descriptor.value = value;
        }
      } else {
        target2[prop] = value;
      }
      const refs = references.get(proxy);
      if (refs && refs.has(prop)) {
        return true;
      }
      const nextProp = !isNaN(Number(prop)) ? `[${String(prop)}]` : `.${String(prop)}`;
      const propPath = `${path}${nextProp}`;
      const watcher = watchers.get(root || proxy);
      if (watcher) {
        watcher.onSet(propPath);
      }
      return true;
    },
    deleteProperty(target2, prop) {
      const nextProp = !isNaN(Number(prop)) ? `[${String(prop)}]` : `.${String(prop)}`;
      const propPath = `${path}${nextProp}`;
      delete target2[prop];
      const watcher = watchers.get(root || proxy);
      if (watcher) {
        watcher.onDelete(propPath);
      }
      const refs = references.get(proxy);
      if (refs && refs.has(prop)) {
        refs.delete(prop);
      }
      return true;
    },
    has(target2, prop) {
      const nodeExtensions = extensions.get(proxy);
      if (nodeExtensions && nodeExtensions.has(prop)) {
        return true;
      }
      return Reflect.has(target2, prop);
    },
    ownKeys(target2) {
      const regularKeys = Reflect.ownKeys(target2);
      const nodeExtensions = extensions.get(proxy);
      if (!nodeExtensions) {
        return regularKeys;
      }
      const extKeys = Array.from(nodeExtensions.keys());
      return [.../* @__PURE__ */ new Set([...regularKeys, ...extKeys])];
    },
    getOwnPropertyDescriptor(target2, prop) {
      const nodeExtensions = extensions.get(proxy);
      if (nodeExtensions && nodeExtensions.has(prop)) {
        const descriptor = nodeExtensions.get(prop);
        return { ...descriptor, configurable: true };
      }
      return Reflect.getOwnPropertyDescriptor(target2, prop);
    }
  });
  if (!root) {
    const watcher = createWatcher();
    watchers.set(proxy, watcher);
    for (const method of ["watch", "batch", "ignore"]) {
      Object.defineProperty(proxy, method, {
        value: watcher[method],
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
  }
  Object.defineProperties(proxy, {
    toJSON: {
      value: function() {
        const result = Array.isArray(state) ? [] : {};
        for (const [key, value] of Object.entries(state)) {
          if (value && typeof value === "object") {
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
  instances.add(proxy);
  sources.set(state, proxy);
  references.set(proxy, /* @__PURE__ */ new Set());
  extensions.set(proxy, /* @__PURE__ */ new Map());
  if (config2) {
    processConfig({ config: config2, path, state, node: proxy, root: root || proxy, parent, ctx, utils });
  }
  for (const prop in state) {
    proxy[prop];
  }
  return proxy;
}

// src/extend.ts
function extend(params) {
  const { opts: extendFn, node: node2, ...rest } = params;
  const nodePrototype = extendFn({ node: node2, ...rest });
  if (!nodePrototype) return node2;
  const descriptors = Object.getOwnPropertyDescriptors(nodePrototype);
  const extensionsMap = extensions.get(node2) || /* @__PURE__ */ new Map();
  if (descriptors.toJSON) {
    const originalToJSON = node2.toJSON;
    const pluginToJSON = descriptors.toJSON.value;
    Object.defineProperty(node2, "toJSON", {
      value: function() {
        const baseResult = originalToJSON.call(this);
        const pluginResult = pluginToJSON ? pluginToJSON.call(this) : {};
        return { ...baseResult, ...pluginResult };
      },
      enumerable: false,
      configurable: true,
      writable: true
    });
    delete descriptors.toJSON;
  }
  for (const [key, descriptor] of Object.entries(descriptors)) {
    const isRef = key.endsWith("Ref");
    const name = isRef ? key.slice(0, -3) : key;
    if (descriptor.get) {
      descriptor.get = descriptor.get.bind(node2);
    }
    if (descriptor.set) {
      descriptor.set = descriptor.set.bind(node2);
    }
    if (isRef) {
      const refs = references.get(node2);
      if (refs) {
        refs.add(name);
      }
    }
    extensionsMap.set(name, descriptor);
    if ("value" in descriptor) {
      if (typeof descriptor.value === "function") {
        descriptor.enumerable = false;
      }
      Object.defineProperty(node2, key, descriptor);
    }
  }
  extensions.set(node2, extensionsMap);
}
register("extend", extend);

// src/target.ts
function target(args) {
  return (options) => {
    return typeof options === "boolean" ? options : options({
      path: args.path,
      state: args.state
    });
  };
}
register("target", target);

// src/praxys.ts
function praxys(S = {}, $ = config()) {
  const path = "$";
  const parent = void 0;
  const root = void 0;
  const ctx = {};
  const utils = {};
  return node({
    state: S,
    config: $,
    path,
    parent,
    root,
    ctx,
    utils
  });
}
export {
  config,
  praxys,
  register,
  resolve
};
//# sourceMappingURL=index.mjs.map