# ignore()

Temporarily suspends reactivity, allowing you to modify state without triggering watchers.

## Syntax

```typescript
function ignore<T>(callback: () => T): T;
```

## Parameters

- `callback`: A function containing state modifications that should not trigger watchers.

## Return Value

Returns the value returned by the callback function.

## Description

The `ignore()` method temporarily disables watcher notifications when modifying state. It provides a way to:

1. **Make silent updates** - Change state properties without triggering any watchers
2. **Break dependency cycles** - Prevent infinite update loops in complex reactive systems
3. **Perform bulk operations** - Initialize large data structures without triggering intermediate updates

Key points about `ignore()`:
- It only affects **notifications** of changes, not the tracking of dependencies
- It doesn't prevent dependencies from being established when reading properties
- Changes made inside `ignore()` are still made to the state, they just don't trigger watchers
- It's useful when you need to update derived state without triggering further updates

## Examples

### Making Silent Updates

```typescript
import { praxys } from 'praxys';

const store = praxys({
  count: 0,
  lastUpdated: null
});

// Set up a watcher that depends on count
store.watch(() => {
  console.log(`Count changed: ${store.count}`);
});

// This triggers the watcher
store.count = 1; // Logs: "Count changed: 1"

// This doesn't trigger the watcher even though we modify count
store.ignore(() => {
  store.count = 2; // No log output - watcher is not triggered
  store.lastUpdated = new Date();
});

console.log(store.count); // 2 - The state was updated, just silently
```

### Breaking Dependency Cycles

```typescript
const store = praxys({
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe'
});

// Watch firstName and lastName to update fullName
store.watch(() => {
  // Update fullName without triggering the other watcher
  store.ignore(() => {
    store.fullName = `${store.firstName} ${store.lastName}`;
  });
});

// Watch fullName to update firstName/lastName
store.watch(() => {
  const nameParts = store.fullName.split(' ');
  
  if (nameParts.length === 2) {
    // Update firstName/lastName without triggering the first watcher
    store.ignore(() => {
      store.firstName = nameParts[0];
      store.lastName = nameParts[1];
    });
  }
});

// This triggers only the first watcher
store.firstName = 'Jane'; // fullName becomes "Jane Doe" without triggering the second watcher

// This triggers only the second watcher
store.fullName = 'Alice Smith'; // firstName becomes "Alice", lastName becomes "Smith" without triggering the first watcher
```

### Loading Large Datasets

```typescript
const store = praxys({
  items: [],
  stats: {
    total: 0,
    processed: 0,
    lastUpdated: null
  }
});

// Set up a watcher that would be expensive to run repeatedly
store.watch(() => {
  console.log(`Processing ${store.items.length} items...`);
  // Imagine some expensive UI updates here
});

// Load a large dataset without triggering watchers
function loadData() {
  // Fetch data from API
  const data = fetchLargeDataset(); // Imagine this returns 10,000 items
  
  // Update store silently to avoid expensive processing during load
  store.ignore(() => {
    store.items = data;
    store.stats.total = data.length;
    store.stats.processed = 0;
    store.stats.lastUpdated = new Date();
  });
  
  console.log('Data loaded, ready for processing');
}

// Later, explicitly notify watchers when we're ready
function processData() {
  // This empty batch will cause watchers to run with the current state
  store.batch(() => {});
}

loadData();
processData(); // Now the watcher runs once with all data loaded
```

### Updating Computed Values

```typescript
const store = praxys({
  items: [
    { id: 1, value: 10 },
    { id: 2, value: 20 }
  ],
  total: 0 // This is a derived value
});

// Set up a watcher to keep total in sync with items
store.watch(() => {
  // Sum all item values
  const sum = store.items.reduce((total, item) => total + item.value, 0);
  
  // Update total without triggering other watchers
  store.ignore(() => {
    store.total = sum;
  });
});

// Set up a watcher that uses the total
store.watch(() => {
  console.log(`Total: ${store.total}`);
});

// This triggers both watchers if we didn't use ignore()
// With ignore() in the first watcher, only the first watcher is triggered
store.items.push({ id: 3, value: 30 }); // First watcher updates total to 60
```

## When to Use ignore()

- When updating derived state based on other state changes
- When initializing or resetting large portions of state
- When breaking circular update dependencies
- When updating state from inside a watcher to avoid infinite loops

## See Also

- [watch()](./watch) - Set up a reactive watcher
- [batch()](./batch) - Group multiple updates into a single notification 