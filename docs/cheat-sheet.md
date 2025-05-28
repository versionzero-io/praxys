# Praxys AI Cheat Sheet

## Core Concepts

### What is Praxys?
- Reactive state management library
- Combines: declarative configuration + fine-grained reactivity + plugin system
- Framework-agnostic, zero dependencies
- Uses proxy-based reactivity with dependency tracking

### Core Functions
```javascript
import { praxys, config, register } from 'praxys';
// Only Ref is exported for typing non-reactive props in extension
import type { Ref } from 'praxys'; 

// Create reactive store
const store = praxys(initialState, configuration);

// Create configuration
const $ = config();

// Register plugins
register('pluginName', pluginFunction);
```

## Reactivity System

### How Dependencies Work
- Dependencies are ONLY created inside `watch()` functions
- Accessing `store.todos` creates dependency on array reference
- Accessing `store.todos.length` creates dependency on array length  
- Accessing `store.todos[0]` creates dependency on that specific index
- Accessing `store.todos[0].completed` creates dependency on that property

### Array Filtering Dependencies
```javascript
store.todos.filter(t => t.completed)
// Creates dependencies on:
// - $.todos (array reference)
// - $.todos.length (filter accesses length internally)
// - $.todos[0], $.todos[1], etc. (each index accessed)
// - $.todos[0].completed, $.todos[1].completed (each property accessed)
```

### Core Methods Available on Store Root
```javascript
// Only available at root level, NOT on nested objects
store.watch(() => { /* reactive callback */ });
store.batch(() => { /* multiple updates */ });
store.ignore(() => { /* non-reactive updates */ });
```

### Watch Function Details
```javascript
const stop = store.watch(() => {
  // Dependencies created by property access here
  console.log(store.count);
});
stop(); // Stop watching

// Key behaviors:
// - Runs immediately when created
// - Dependencies re-tracked on each execution (dynamic dependencies)
// - Conditional dependencies based on runtime logic
// - Returns stop function for cleanup
```

### Batch Updates Details
```javascript
store.batch(() => {
  store.count = 5;
  store.user.name = 'Jane';
  // All watchers run once after batch completes
  // Deduplication: watchers with multiple changed deps run only once
  // Consistency: watchers see final state after all changes
  return someValue; // Return value is passed through
});

// Nested batches are supported
// Performance: prevents unnecessary intermediate re-renders
```

### Ignore Function Details
```javascript
store.ignore(() => {
  store.count++; // No watchers triggered
  // State IS modified, just silently
  // Useful for derived state updates, bulk operations, breaking cycles
  return someValue; // Return value is passed through
});

// Key use cases:
// - Updating derived state from within watchers
// - Loading large datasets without triggering expensive watchers
// - Breaking circular update dependencies
// - Initializing state without notifications
```

### Circular Update Protection
- Praxys prevents infinite loops during notification cycles
- Uses `inProgress` set to prevent recursive notifications within same cycle
- Watcher can still be triggered in future cycles from other sources

## Configuration System

### Basic Extension
```javascript
const $ = config();
$.extend(({ node }) => ({
  someMethod() {
    // node is the current object
  },
  get computedValue() {
    return node.someProperty * 2;
  }
}));
```

### Path Targeting Details
```javascript
// Direct path targeting
$.users.extend(/* ... */);
$.users[0].profile.extend(/* ... */);

// Function-based targeting
$.target(({ path }) => path.match(/^\$\.users\[\d+\]$/))
  .extend(/* ... */);

// Target with state condition
$.target(({ path, state }) => 
  path.match(/\[\d+\]$/) && state.type === 'premium'
).extend(/* ... */);

// Boolean targeting (feature flags)
$.target(typeof window !== 'undefined')
  .extend(/* browser-only functionality */);

// Complex conditions
$.target(({ state, path }) => {
  return path.includes('products') && 
         state?.active === true && 
         state?.price > 100;
}).extend(/* premium product methods */);
```

### Forward-Looking Targeting (Optimistic)
- Extensions apply immediately to existing matching paths
- Automatically applied to new paths that match later
- Continuously monitors state tree for matches
- Works even for state that doesn't exist yet when config is created

### Configuration Composition
```javascript
const baseConfig = config();
const userConfig = config();

const $ = config();
$.use(baseConfig).use(userConfig);
```

## `Ref<T>` Pattern (Non-Reactive Properties)

### Key Pattern
1. **In TypeScript interface**: Mark with `Ref<T>` type
2. **In extension**: Define getters/setters with `Ref` suffix
3. **In state/usage**: Access with normal names (no suffix)

```javascript
import type { Ref } from 'praxys';

interface AppState {
  count: number; // reactive
  largeDataset: Ref<Record<string, any>>; // non-reactive
}

const $ = config();
$.extend(({ node }) => ({
  // Extension has Ref suffix
  get largeDatasetRef() {
    return node.largeDataset;
  },
  set largeDatasetRef(value) {
    node.largeDataset = value;
  }
}));

const store = praxys({
  count: 0,
  largeDataset: {} // State has no Ref suffix
}, $);

// Usage does not have the Ref suffix
store.largeDataset = data; // No watchers triggered
console.log(store.largeDataset); // No dependency created
```

## Plugin System

### Plugin Function Signature
```javascript
function pluginFunction({ node, opts = {}, state, root, path }) {
  // node: current object being extended
  // opts: options passed when using plugin
  // state: raw state object
  // root: root state object
  // path: JSON path string
  
  return {
    // methods and properties to add
  };
}
```

### Plugin Registration Strategies
```javascript
// Basic registration
register('pluginName', pluginFunction);

// Namespaced plugins
register('format.date', dateFormatterPlugin);
register('format.currency', currencyFormatterPlugin);
register('validate.email', emailValidatorPlugin);

// Self-registering modules
// plugins/date-formatter.js
import { register } from 'praxys';
function dateFormatter({ node, opts = {} }) { /* ... */ }
register('formatDate', dateFormatter); // Self-register

// Plugin library pattern
const formatters = { date: /* ... */, currency: /* ... */ };
Object.entries(formatters).forEach(([name, plugin]) => {
  register(`format.${name}`, plugin);
});
```

### Plugin Usage Patterns
```javascript
// Use in configuration
$.target(/* selector */).pluginName({ option: 'value' });

// Chaining
$.user
  .formatDate({ key: 'birthdate' })
  .formatCurrency({ key: 'salary' })
  .extend(({ node }) => ({ /* additional methods */ }));

// Namespaced usage
$.user.format.date({ key: 'birthdate' });
$.user.validate.email();
```

### Plugin Import Requirement
**CRITICAL**: Must import plugin files for registration to execute!
```javascript
import './plugins/formatters'; // This runs register() calls
import { praxys, config } from 'praxys';
// Now plugins are available
```

## Performance Patterns

### Dependency Optimization
- Only access properties you need to track
- Use computed properties for derived values
- Maintain counters instead of recalculating
- Use batch for multiple related updates

### Large Dataset Strategies
- Use `Ref<T>` for non-reactive large data
- Implement pagination
- Use ignore() for bulk operations
- Store data outside reactive state when possible

### The "Once" Pattern
```javascript
const stop = store.watch(() => {
  console.log('Runs once');
  stop(); // Stop immediately after first run
});
```

### Performance Considerations
- Each watcher creates memory overhead
- Watchers with many dependencies are expensive to track
- Access only specific properties needed inside watchers
- Call stop() function to prevent memory leaks
- Use computed properties or caching for expensive calculations

## TypeScript Integration

### Module Augmentation for Plugins
```typescript
// Plugin authors: Add your plugin methods to the global namespace
declare global {
  namespace Plugins {
    interface Config {
      formatCurrency(opts: {
        key: string;
        currency?: string;
      }): Plugins.Config;
    }
  }
}

// Plugin authors should also export Node, State, Utils, Ctx types
// (Praxys core doesn't export these - plugin authors need to provide them)
export type Node = any; // Define your node type
export type State = any; // Define your state type  
export type Utils = any; // Define your utility types
export type Ctx = any; // Define your context type

// Users can then import these from your plugin library:
// import type { Node, State, Utils, Ctx } from 'your-plugin-library';
```

### State Interfaces
```typescript
interface TodoState {
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  cache: Ref<Map<number, TodoItem>>; // Non-reactive
}
```

## Common Patterns

### Todo App Pattern
```javascript
const $ = config();

// Array methods
$.todos.extend(({ node }) => ({
  addTodo(text) { node.push({ id: Date.now(), text, completed: false }); },
  get completedCount() { return node.filter(t => t.completed).length; }
}));

// Individual item methods
$.target(({ path }) => path.match(/^\$\.todos\[\d+\]$/))
  .extend(({ node }) => ({
    toggle() { node.completed = !node.completed; }
  }));
```

### Data Table Pattern
```javascript
// Target all tables
$.target(({ path }) => path.match(/^\$\.tables\.[^.]+$/))
  .extend(({ node, path }) => {
    const tableName = path.split('.')[2];
    return {
      sort(column, direction = 'asc') {
        node.sorting = { column, direction };
      }
    };
  });
```

### Derived State Pattern
```javascript
// Calculate derived values without triggering other watchers
store.watch(() => {
  const sum = store.items.reduce((total, item) => total + item.value, 0);
  
  store.ignore(() => {
    store.total = sum; // Update derived state silently
  });
});
```

### Conditional Dependencies Pattern
```javascript
store.watch(() => {
  console.log(`Name: ${store.user.name}`); // Always depends on name
  
  if (store.showDetails) {
    console.log(`Email: ${store.user.email}`); // Conditionally depends on email
  }
  // Dependencies change based on showDetails flag
});
```

## Error Handling & Debugging

### Debugging Reactivity
```javascript
// Add diagnostic watchers
store.watch(() => console.log('Value changed:', store.someValue));

// Track watcher executions
const counts = {};
function trackWatcher(name, watchFn) {
  counts[name] = 0;
  return store.watch(() => {
    counts[name]++;
    console.log(`${name}: ${counts[name]} executions`);
    return watchFn();
  });
}

// Example usage of trackWatcher
trackWatcher('userStatus', () => store.userIsActive);

// Or with a more complex watch function
trackWatcher('filteredItems', () => {
  return store.items.filter(item => item.price > store.minPrice);
});
```

### Performance Profiling
```javascript
performance.mark('update-start');
store.batch(() => { /* updates */ });
performance.mark('update-end');
performance.measure('update', 'update-start', 'update-end');
```

### Plugin Error Handling
```javascript
// Safe plugin registration
try {
  register('formatDate', dateFormatterPlugin);
} catch (error) {
  console.error('Failed to register plugin:', error);
}

function safeRegister(name, plugin) {
  try {
    register(name, plugin);
    return true;
  } catch (error) {
    if (error.message.includes('already registered')) {
      console.warn(`Plugin ${name} is already registered`);
      return false;
    }
    throw error;
  }
}
```

## Common Pitfalls

### Watchers Not Running
- Property not accessed in watcher
- Property modified in ignore() function
- Incorrect property path

### Watchers Running Too Often
- Accessing unneeded properties
- Missing batch() for related updates
- Unintentional property access

### Plugin Issues
- Forgetting to import plugin files
- Plugin name conflicts
- Missing required options

## Key Implementation Details

### Proxy System
- Uses Proxy to intercept property access/modification
- Tracks dependencies during watch() execution
- Notifies watchers when tracked properties change

### Path Tracking
- Uses JSON path strings like `$.users[0].name`
- Exact path matching for dependency tracking
- Forward-looking targeting for configuration

### Extension System
- Extensions stored in WeakMap keyed by node
- Properties defined with Object.defineProperty
- Ref pattern uses special naming convention

### Watch Implementation
- Uses Set to track dependencies per watcher
- Prevents circular updates with inProgress set
- Batches notifications for performance
- Dynamic dependency re-tracking on each execution

### Batch Implementation
- Collects changes during callback execution
- Delays notifications until callback completes
- Deduplicates watchers that depend on multiple changed properties
- Maintains atomicity and consistency

### Ignore Implementation
- Only affects notifications, not dependency tracking
- Changes are still made to state, just silently
- Useful for breaking cycles and bulk operations

## Best Practices

1. **Structure state for granular reactivity**
2. **Use computed properties for derived values**
3. **Apply `Ref<T>` for large non-reactive data**
4. **Batch related updates together**
5. **Import plugin files before using**
6. **Use targeting for reusable functionality**
7. **Follow naming conventions (Ref suffix)**
8. **Profile performance in complex apps**
9. **Call stop() functions to prevent memory leaks**
10. **Use ignore() for derived state updates**
11. **Prefer larger batches over multiple smaller ones**
12. **Structure plugins with clear namespaces**
