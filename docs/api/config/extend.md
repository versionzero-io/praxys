# extend()

Adds methods, computed properties, and other functionality to a specific part of your state tree.

## Syntax

```typescript
function extend(extensionFunction: ({ node, state, path, ctx, utils }) => object): Plugins.Config;
```

## Parameters

- `extensionFunction`: A function that receives context objects and returns an object containing methods and properties to add to the node. This function receives:
  - `node`: The node being extended (the target of the extension)
  - `state`: The root state object
  - `path`: The JSON path to the current node
  - `ctx`: A shared context object available to all extensions and plugins
  - `utils`: Utility functions available to extensions and plugins

## Return Value

Returns the configuration object for chaining.

## Description

The `extend()` method is a core part of Praxys's declarative configuration system. It allows you to add functionality to specific parts of your state tree. Extensions can include:

- Methods that modify the state
- Computed properties (getters) that derive values from the state
- Utility functions specific to a part of your state
- Non-reactive properties using the Ref pattern

Extensions are applied to a specific path in your state tree, determined by where you call `extend()` in your configuration chain.

## Examples

### Basic Extension

```typescript
import { praxys, config } from 'praxys';

// Create configuration
const $ = config();

// Add methods to the root
$.extend(({ node }) => ({
  reset() {
    node.count = 0;
    node.message = '';
  },
  
  increment() {
    node.count++;
  },
  
  get doubled() {
    return node.count * 2;
  }
}));

// Initialize store with configuration
const store = praxys({
  count: 0,
  message: 'Hello'
}, $);

// Use the configured methods
store.increment();
console.log(store.count); // 1
console.log(store.doubled); // 2
store.reset();
console.log(store.count); // 0
```

### Creating Non-Reactive Properties

You can create non-reactive properties using the `Ref` pattern. Here's how it works:

Important notes about the `Ref` pattern:
- In your extension, you define properties with the `Ref` suffix (in the getter/setter names)
- In the actual state object and when accessing via the store, there is NO `Ref` suffix
- When using TypeScript, you mark state properties as non-reactive using the `Ref<T>` type

```typescript
import { praxys, config, Ref } from 'praxys';

// Define state interface with non-reactive property types
interface AppState {
  count: number;
  // Mark non-reactive properties with Ref<T> type, but the name is normal
  largeDataset: Ref<Record<string, any>>;
}

// Create configuration
const $ = config();

// Add non-reactive properties using the Ref suffix in the EXTENSION ONLY
$.extend(({ node }) => ({
  // The property name in the EXTENSION has the "Ref" suffix
  get largeDatasetRef() {
    // The node property name has NO suffix
    return node.largeDataset;
  },
  set largeDatasetRef(value) {
    // The node property name has NO suffix
    node.largeDataset = value;
  },
  
  processData() {
    // Process the large dataset without triggering reactivity
    const result = computeFromLargeDataset(node.largeDataset);
    
    // This update will trigger reactivity
    this.count = result;
  }
}));

// Initialize store with normal property names (no Ref suffix)
const store = praxys<AppState>({
  count: 0,
  largeDataset: {} // No Ref suffix in the actual state
}, $);

// When using the store, you access properties with their normal names (NO Ref suffix)
store.largeDataset = fetchLargeDataset(); // No watchers triggered

// Use the property (without Ref suffix)
store.watch(() => {
  console.log(`Count is now: ${store.count}`);
  // Reading largeDataset doesn't create a dependency because it was configured with Ref pattern
  console.log(`Dataset has ${Object.keys(store.largeDataset).length} items`);
});

// This doesn't trigger the watcher because it uses a non-reactive property
store.largeDataset = { ...store.largeDataset, newItem: 'value' };

// This triggers the watcher
store.processData();
```

### Nested Extensions

```typescript
// Configure multiple parts of the state tree
$.users.extend(({ node }) => ({
  add(user) {
    node.push(user);
  },
  
  remove(id) {
    const index = node.findIndex(user => user.id === id);
    if (index !== -1) {
      node.splice(index, 1);
    }
  },
  
  get active() {
    return node.filter(user => user.active);
  }
}));

// Individual items in an array
$.users[0].extend(({ node }) => ({
  activate() {
    node.active = true;
  },
  
  deactivate() {
    node.active = false;
  },
  
  get isAdmin() {
    return node.role === 'admin';
  }
}));

// Initialize with nested state
const store = praxys({
  users: [
    { id: 1, name: 'Alice', role: 'admin', active: false }
  ]
}, $);

// Use configured methods
store.users.add({ id: 2, name: 'Bob', role: 'user', active: true });
console.log(store.users.active.length); // 1
store.users[0].activate();
console.log(store.users.active.length); // 2
console.log(store.users[0].isAdmin); // true
```

### Using Context and State

```typescript
const $ = config();

// Root-level extension with access to the full state
$.extend(({ node, state, ctx }) => {
  // Initialize shared context
  ctx.lastAccess = new Date();
  
  return {
    updateUser(id, data) {
      const user = state.users.find(u => u.id === id);
      if (user) {
        Object.assign(user, data);
        ctx.lastAccess = new Date();
      }
    },
    
    get lastAccessTime() {
      return ctx.lastAccess;
    }
  };
});

// User-level extension that also uses context
$.users[0].extend(({ node, ctx }) => ({
  update(data) {
    Object.assign(node, data);
    ctx.lastAccess = new Date();
  }
}));

// Initialize store
const store = praxys({
  users: [
    { id: 1, name: 'Alice' }
  ]
}, $);

// Use methods that share context
store.users[0].update({ name: 'Alicia' });
console.log(store.lastAccessTime); // Shows when the user was updated
```

## When to Use Non-Reactive Properties

Non-reactive properties are useful for:

- **Large datasets**: When you have large data structures that don't need reactivity
- **Performance-critical data**: For data that changes frequently but doesn't need to trigger updates
- **Cached values**: For storing derived values that don't need to trigger reactivity when updated
- **Internal state**: For implementation details that shouldn't trigger UI updates
- **Breaking dependency cycles**: To avoid circular reactive dependencies

## Type Safety

With TypeScript, you can ensure your extensions are type-safe:

```typescript
import { praxys, config, Ref } from 'praxys';

interface User {
  id: number;
  name: string;
  active: boolean;
}

interface AppState {
  users: User[];
  settings: {
    theme: string;
  };
  // Non-reactive property in state (no Ref suffix in name)
  userCache: Ref<Map<number, User>>;
}

const $ = config();

// Type-safe extension with non-reactive property
$.extend(({ node }: { node: AppState }) => ({
  // Define the non-reactive property WITH Ref suffix in extension only
  get userCacheRef(): Map<number, User> {
    // Access the state property WITHOUT Ref suffix
    return node.userCache;
  },
  set userCacheRef(value: Map<number, User>) {
    // Access the state property WITHOUT Ref suffix
    node.userCache = value;
  },
  
  // Add a user to both the reactive list and non-reactive cache
  addUser(user: User): void {
    node.users.push(user);
    // Access the non-reactive property WITHOUT Ref suffix
    node.userCache.set(user.id, user);
  }
}));

// Type-safe extension for users array
$.users.extend(({ node }: { node: User[] }) => ({
  add(user: User): void {
    node.push(user);
  },
  
  get active(): User[] {
    return node.filter(user => user.active);
  }
}));

// Initialize with typed state
const store = praxys<AppState>({
  users: [],
  settings: { theme: 'light' },
  userCache: new Map() // State property has NO Ref suffix
}, $);

// Type-safe operations
store.addUser({ id: 1, name: 'Alice', active: true });
// Access the non-reactive property WITHOUT Ref suffix
console.log(store.userCache.size);
``` 