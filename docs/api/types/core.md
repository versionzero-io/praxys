# Core Types

This page documents the core TypeScript types and interfaces used in Praxys.

## Core Function Types

### Praxys

```typescript
interface Praxys {
  /** Watch for changes to dependencies */
  watch(callback: WatchCallback): StopFunction;
  
  /** Batch multiple updates into a single notification */
  batch(callback: BatchCallback): void;
  
  /** Perform updates without triggering reactivity */
  ignore(callback: IgnoreCallback): void;
}
```

The `Praxys` interface defines the methods that are available on every Praxys store instance. These methods are added to your state object when you create a store with `praxys()`.

- `watch()`: Creates a reactive watcher that automatically runs when its dependencies change
- `batch()`: Groups multiple state changes into a single update operation for better performance
- `ignore()`: Temporarily disables reactivity to make changes without triggering watchers

### Config

```typescript
// This interface is defined in the Plugins namespace
interface Config {
  /** Extends a node with properties and methods */
  extend(factory: ExtensionFactory): Plugins.Config;
  
  /** Targets nodes matching a pattern */
  target(selector: TargetSelector): Plugins.Config;
  
  /** Uses another configuration */
  use(otherConfig: Plugins.Config): Plugins.Config;
  
  /** Dynamic property access creates new configuration chains */
  [key: string]: any;
}
```

The `Config` interface represents a configuration object created with `config()`. It provides methods for configuring your state and supports dynamic property access for nested configurations.

## Reactivity Types

### WatchCallback

```typescript
/**
 * A function that will be called when watched dependencies change
 */
type WatchCallback = () => any;
```

A function that will be called immediately and then re-executed whenever any of its dependencies change.

### BatchCallback

```typescript
/**
 * A function containing multiple state changes to be batched together
 */
type BatchCallback = () => any;
```

A function that contains multiple state changes that will be batched into a single update.

### IgnoreCallback

```typescript
/**
 * A function containing state changes that will not trigger reactivity
 */
type IgnoreCallback = () => any;
```

A function containing state changes that should not trigger watchers.

### StopFunction

```typescript
/**
 * A function that stops a watcher when called
 */
type StopFunction = () => void;
```

A function that stops a watcher from running when called.

## Extension Types

### ExtensionFactory

```typescript
/**
 * Function that creates extensions for a node
 */
type ExtensionFactory<T = any> = (context: ExtensionContext<T>) => Record<string, any>;

/**
 * Context provided to extension factories
 */
interface ExtensionContext<T = any> {
  /** The current node being extended */
  node: T;
  
  /** Path to the current node from the root */
  path: string;
  
  /** The root state object */
  root: any;
}
```

An extension factory function receives context about the node being configured and returns an object with properties and methods to be added to that node.

### TargetSelector

```typescript
/**
 * Function that selects nodes to target
 */
type TargetSelector = boolean | ((context: TargetContext) => boolean);

/**
 * Context provided to target selectors
 */
interface TargetContext {
  /** The current state value at this node */
  state: any;
  
  /** Path to the current node from the root */
  path: string;
}
```

A target selector is either a boolean or a function that determines whether a node should be targeted for extension.

## Plugin Types

### PluginFunction

```typescript
/**
 * Function that implements a plugin
 */
type PluginFunction<T = Record<string, any>> = (args: PluginArgs) => T;

/**
 * Arguments passed to a plugin function
 */
interface PluginArgs {
  /** The current node being configured */
  node: any;
  
  /** Plugin state that persists between calls */
  state: Record<string, any>;
  
  /** Path to the current node from the root */
  path: string;
  
  /** Options passed when using the plugin */
  opts?: any;
  
  /** Reference to the root state object */
  root?: any;
  
  /** Parent node reference */
  parent?: any;
  
  /** Shared context object across plugins */
  ctx?: Record<string, any>;
  
  /** Empty utility object that can be extended by plugins */
  utils?: Record<string, any>;
}
```

A plugin function receives context about the node being configured and returns an object with properties and methods to be added to that node.

### Plugin Extension Interfaces

By convention, plugin authors should export these empty interfaces that users can import to type their state:

```typescript
// Properties and methods added to nodes by the plugin
export interface Node {
  myProperty?: string;
  myMethod?(): void;
}

// Internal state used by the plugin
export interface State {
  myInternalCounter?: number;
}

// Utility functions the plugin might add
export interface Utils {
  myUtilityFunction?(): void;
}

// Context properties the plugin might use
export interface Ctx {
  myPluginSettings?: Record<string, any>;
}
```

Users can then import and extend these interfaces to properly type their application state:

```typescript
import { Node as MyPluginNode } from 'my-plugin';

interface MyState {
  items: Array<{ id: number } & MyPluginNode>;
}
```

## Global Namespace

Praxys uses TypeScript's declaration merging to extend its types through the global `Plugins` namespace:

```typescript
declare global {
  namespace Plugins {
    /** Configuration object */
    interface Config {
      /** Extends a node with properties and methods */
      extend(factory: ExtensionFactory): Config;
      
      /** Targets nodes matching a pattern */
      target(selector: TargetSelector): Config;
      
      /** Uses another configuration */
      use(otherConfig: Config): Config;
      
      /** Plugin methods are added here by plugin authors */
      
      /** Dynamic property access creates new chains */
      [key: string]: any;
    }
    
    /** Shared context available to plugins */
    interface Context {
      /** Plugin-specific context properties */
      [key: string]: any;
    }
    
    /** Utility functions available to plugins */
    interface Utilities {
      /** Plugin-specific utility functions */
      [key: string]: any;
    }
  }
}
```

## Type Utilities

### Ref\<T\>

```typescript
/**
 * Marks a property as non-reactive
 */
type Ref<T> = T;
```

A type utility that marks properties as non-reactive. While it doesn't transform the type (it's an identity type alias), it serves as documentation to indicate that a property won't participate in the reactivity system.

See [Ref\<T\>](./ref) for more details on non-reactive properties.

## Usage Examples

### Basic Type Usage

```typescript
import { praxys, config, Ref } from 'praxys';

// Define state interfaces
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  // Non-reactive property
  stats: Ref<{
    total: number;
    active: number;
    completed: number;
  }>;
}

// Create configuration with type safety
const $ = config();

// Type-safe extension
$.extend(({ node }: { node: TodoState }) => ({
  addTodo(text: string) {
    node.todos.push({
      id: Date.now(),
      text,
      completed: false
    });
  },
  
  toggleTodo(id: number) {
    const todo = node.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  },
  
  get active() {
    return node.todos.filter(t => !t.completed);
  },
  
  get completed() {
    return node.todos.filter(t => t.completed);
  }
}));

// Create store with type safety
const store = praxys<TodoState>({
  todos: [],
  filter: 'all',
  stats: {
    total: 0,
    active: 0,
    completed: 0
  }
}, $);

// TypeScript enforces correct usage
store.addTodo('Learn Praxys'); // ✓
store.filter = 'active';       // ✓
store.filter = 'invalid';      // ✗ Type error
```

### Using with Plugins

```typescript
import { praxys, config, register } from 'praxys';

// Define plugin options type
interface SortableOptions {
  key?: string;
  direction?: 'asc' | 'desc';
}

// Define plugin interfaces
export interface Node {
  sort?(): any[];
}

export interface State {}
export interface Utils {}
export interface Ctx {}

// Register plugin with TypeScript
register('sortable', ({ node, opts = {} }: {
  node: any[],
  opts?: SortableOptions
}) => {
  const key = opts.key;
  const direction = opts.direction || 'asc';
  
  return {
    sort() {
      return [...node].sort((a, b) => {
        const valueA = key ? a[key] : a;
        const valueB = key ? b[key] : b;
        return direction === 'asc' 
          ? valueA > valueB ? 1 : -1
          : valueA < valueB ? 1 : -1;
      });
    }
  };
});

// Add type declarations
declare global {
  namespace Plugins {
    interface Config {
      sortable(options?: SortableOptions): Config;
    }
  }
}

// Define state interfaces with plugin methods
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface TodosArray extends Array<TodoItem>, Node {
  sort(): TodoItem[];
}

interface TodoState {
  todos: TodosArray;
}

// Create configuration
const $ = config();
$.todos.sortable({ key: 'text' });

// Create store with type safety
const store = praxys<TodoState>({
  todos: []
}, $);

// TypeScript knows about the plugin method
const sortedTodos = store.todos.sort();
```
