# batch()

Groups multiple state updates into a single operation, improving performance by preventing unnecessary re-renders.

## Syntax

```typescript
function batch<T>(callback: () => T): T;
```

## Parameters

- `callback`: A function that contains multiple state changes to be batched together.

## Return Value

Returns the value returned by the callback function.

## Description

The `batch()` method allows you to group multiple state changes into a single update operation. When using `batch()`:

1. **Changes are collected** - During the callback execution, all state modifications are recorded
2. **Notifications are delayed** - Watchers are not triggered immediately for each change
3. **Deduplication occurs** - Watchers that depend on multiple changed properties run only once
4. **Consistency is maintained** - Watchers always see the final state after all changes are applied

This approach provides significant benefits:

- **Performance improvement** - Prevents unnecessary intermediate re-renders
- **Atomicity** - Ensures related changes are processed together
- **Predictability** - Guarantees watchers see a consistent state

## Examples

### Basic Usage

```typescript
import { praxys } from 'praxys';

const store = praxys({
  count: 0,
  total: 0,
  average: 0
});

// Set up a watcher that would normally run multiple times
store.watch(() => {
  console.log(`Stats: count=${store.count}, total=${store.total}, average=${store.average}`);
});

// Without batching, this would trigger the watcher 3 times
store.batch(() => {
  store.count = 10;
  store.total = 50;
  store.average = store.total / store.count;
  
  // The return value is passed through
  return store.average;
});
// Logs only once: "Stats: count=10, total=50, average=5"
// Returns: 5
```

### Updating Complex State

```typescript
const store = praxys({
  user: {
    profile: { name: 'John', email: '' },
    stats: { posts: 0, followers: 0 }
  }
});

// Watch for profile changes
store.watch(() => {
  console.log(`Profile updated: ${store.user.profile.name} (${store.user.profile.email})`);
});

// Watch for stats changes
store.watch(() => {
  console.log(`Stats updated: ${store.user.stats.posts} posts, ${store.user.stats.followers} followers`);
});

// Update multiple nested properties in one batch
store.batch(() => {
  // These would normally trigger the profile watcher twice
  store.user.profile.name = 'Jane';
  store.user.profile.email = 'jane@example.com';
  
  // These would normally trigger the stats watcher twice
  store.user.stats.posts = 42;
  store.user.stats.followers = 1000;
});
// Each watcher runs exactly once with the final values
```

### Array Operations

```typescript
const store = praxys({
  todos: [
    { id: 1, text: 'Learn Praxys', completed: false }
  ],
  stats: {
    total: 1,
    completed: 0
  }
});

// Watch todos and stats
store.watch(() => {
  console.log(`Todos: ${store.todos.length}, Completed: ${store.stats.completed}`);
});

// Batch multiple array changes and related updates
store.batch(() => {
  // Add multiple items
  store.todos.push(
    { id: 2, text: 'Build app', completed: false },
    { id: 3, text: 'Write docs', completed: true }
  );
  
  // Update statistics
  store.stats.total = store.todos.length;
  store.stats.completed = store.todos.filter(t => t.completed).length;
});
// Logs once: "Todos: 3, Completed: 1"
```

### Nested Batches

```typescript
const store = praxys({
  values: {
    a: 1,
    b: 2,
    c: 3
  },
  sum: 6
});

store.watch(() => {
  console.log(`Sum is now: ${store.sum}`);
});

// Outer batch
store.batch(() => {
  // These changes don't trigger the watcher yet
  store.values.a = 10;
  store.values.b = 20;
  
  // Nested batch
  store.batch(() => {
    // These changes also don't trigger the watcher
    store.values.c = 30;
  });
  
  // Calculate the sum of all values
  store.sum = store.values.a + store.values.b + store.values.c;
});
// Watcher runs once: "Sum is now: 60"
```

## Best Practices

- Use `batch()` whenever making multiple related state changes
- Prefer larger batches with complete operations over multiple smaller batches
- Calculate derived values inside the batch after their dependencies are updated
- For expensive operations, consider using `batch()` in combination with `ignore()`
- Remember that `batch()` only groups notifications, it doesn't change the actual modifications

## See Also

- [watch()](./watch) - Set up a reactive watcher
- [ignore()](./ignore) - Modify state without triggering watchers 