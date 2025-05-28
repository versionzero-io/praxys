# Ref\<T\>

A type utility that marks properties as non-reactive.

## Syntax

```typescript
type Ref<T> = T;
```

## Description

The `Ref<T>` type is a utility that marks properties as non-reactive in Praxys. While it doesn't actually transform the type (it's just an identity type alias), it serves as documentation to indicate that a property will not participate in Praxys's reactivity system.

When a property is marked with `Ref<T>`:
- Reading the property will not establish reactive dependencies
- Modifying the property will not trigger watchers

This is particularly useful for:
- Large data structures that don't need reactivity
- Properties that change frequently but shouldn't trigger updates
- Breaking dependency cycles
- Performance optimization

## Implementation Pattern

To implement non-reactive properties, follow this pattern:

1. **In your state interface**: Mark the property with `Ref<T>`
2. **In your configuration**: Create getters/setters with the `Ref` suffix
3. **In your application code**: Access the property normally (without suffix)

This pattern ensures your non-reactive properties work correctly while maintaining good TypeScript support.

## Examples

### Basic Usage

```typescript
import { praxys, config, Ref } from 'praxys';

// 1. Define interface with non-reactive property
interface AppState {
  count: number;
  message: string;
  // Mark as non-reactive with Ref<T>
  lastUpdated: Ref<Date>;
}

// 2. Create configuration with Ref suffix in extension
const $ = config();
$.extend(({ node, state }) => ({
  // Getter and setter WITH Ref suffix
  get lastUpdatedRef() {
    return state.lastUpdated;
  },
  set lastUpdatedRef(value) {
    state.lastUpdated = value;
  },
  
  increment() {
    // Update reactive property
    node.count++;
    
    // Update non-reactive property
    state.lastUpdated = new Date();
  }
}));

// 3. Create store
const store = praxys<AppState>({
  count: 0,
  message: 'Hello',
  lastUpdated: new Date()
});

// 4. Use in application code
store.watch(() => {
  // This creates a dependency on count
  console.log(`Count: ${store.count}`);
  
  // This does NOT create a dependency
  console.log(`Last updated: ${store.lastUpdated}`);
});

// This triggers the watcher
store.increment();

// This does NOT trigger the watcher
store.lastUpdated = new Date();
```

### Practical Use Case: Caching Data

```typescript
import { praxys, config, Ref } from 'praxys';

interface UserState {
  selectedUserId: number | null;
  isLoading: boolean;
  // Large dataset marked as non-reactive
  userCache: Ref<Record<number, User>>;
}

interface User {
  id: number;
  name: string;
  email: string;
  // ... more user data
}

const $ = config();
$.extend(({ node, state }) => ({
  // Non-reactive property with Ref suffix
  get userCacheRef() {
    return state.userCache;
  },
  set userCacheRef(value) {
    state.userCache = value;
  },
  
  // Methods that use the cache
  getUser(id: number) {
    return state.userCache[id];
  },
  
  async fetchUser(id: number) {
    node.isLoading = true;
    
    try {
      // Fetch user data
      const response = await fetch(`/api/users/${id}`);
      const user = await response.json();
      
      // Update non-reactive cache without triggering watchers
      state.userCache[id] = user;
      
      // Update reactive property to trigger UI updates
      node.selectedUserId = id;
    } finally {
      node.isLoading = false;
    }
  }
}));

// Create store
const store = praxys<UserState>({
  selectedUserId: null,
  isLoading: false,
  userCache: {}
});

// UI only reacts to selectedUserId and isLoading changes
store.watch(() => {
  if (store.isLoading) {
    showLoadingSpinner();
  } else if (store.selectedUserId) {
    // Get user from cache without creating dependency on the cache
    const user = store.getUser(store.selectedUserId);
    displayUserProfile(user);
  } else {
    showUserSelector();
  }
});

// This will trigger the watcher when selectedUserId changes
store.fetchUser(123);

// This won't trigger any watchers
store.userCache[456] = { 
  id: 456, 
  name: 'Jane Smith', 
  email: 'jane@example.com' 
};
```

## Best Practices

1. **Follow the naming convention** - Always use the `Ref` suffix for getters and setters in extensions
2. **Document non-reactive properties** - Make it clear in comments which properties are non-reactive
3. **Use for large data structures** - Ref is ideal for caches, large collections, or any data that shouldn't trigger UI updates
4. **Consider performance** - Use Ref for properties that change frequently but don't need to trigger updates

## TypeScript Usage

```typescript
import { praxys, config, Ref } from 'praxys';

// Define types with non-reactive properties
interface AppState {
  // Reactive properties
  count: number;
  settings: {
    theme: string;
  };
  
  // Non-reactive properties
  cache: Ref<Map<string, any>>;
  syncTimestamp: Ref<number>;
}

// Type-safe implementation
const $ = config();
$.extend(({ node, state }: { node: AppState, state: AppState }) => ({
  // Non-reactive property implementations
  get cacheRef(): Map<string, any> {
    return state.cache;
  },
  set cacheRef(value: Map<string, any>) {
    state.cache = value;
  },
  
  get syncTimestampRef(): number {
    return state.syncTimestamp;
  },
  set syncTimestampRef(value: number) {
    state.syncTimestamp = value;
  },
  
  // Methods using non-reactive properties
  updateCache(key: string, value: any): void {
    // Access without Ref suffix
    state.cache.set(key, value);
    state.syncTimestamp = Date.now();
  },
  
  getFromCache<T>(key: string): T | undefined {
    // Access without Ref suffix
    return state.cache.get(key) as T;
  }
}));

// Initialize store
const store = praxys<AppState>({
  count: 0,
  settings: { theme: 'light' },
  cache: new Map(),
  syncTimestamp: 0
});

// Type-safe usage
store.cache.set('user', { name: 'Alice' }); // No reactivity
store.count++; // Reactive update
const user = store.getFromCache<{ name: string }>('user');
```

## Performance Considerations

- Use `Ref<T>` for properties that don't need to trigger UI updates
- Non-reactive properties are especially useful for large data structures
- Consider using non-reactive properties for implementation details
- Be careful with shared state - non-reactive properties still affect the state
- Remember that non-reactive properties can be accessed but won't create dependencies

## Type Compatibility

The `Ref<T>` type is compatible with the underlying type `T` because it's just an identity type alias. This means:

```typescript
// These are equivalent types
type User = { name: string, age: number };
type NonReactiveUser = Ref<User>;

// You can assign between them
const user: User = { name: 'Alice', age: 30 };
const nonReactiveUser: NonReactiveUser = user; // Valid
const backToUser: User = nonReactiveUser; // Also valid
```

The `Ref<T>` type serves purely as documentation and doesn't affect type compatibility or runtime behavior. 