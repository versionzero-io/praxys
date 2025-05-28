# watch()

Sets up a reactive watcher function that automatically runs when its dependencies change.

## Syntax

```typescript
function watch<T>(callback: () => T): () => void;
```

## Parameters

- `callback`: A function that will be executed immediately and then re-executed whenever any of its dependencies change.

## Return Value

Returns a stop function that, when called, stops the watcher from running.

## Description

The `watch()` method creates a reactive watcher that automatically tracks dependencies and responds to changes. The tracking mechanism works as follows:

1. **Initial execution** - The callback runs immediately when watch is called
2. **Dependency tracking** - During execution, any property accessed on the store is recorded as a dependency
3. **Change detection** - When a property that was accessed during the callback changes, the callback is scheduled to run again
4. **Dynamic dependencies** - Dependencies are re-tracked on each execution, so they can change based on conditional logic

This automatic dependency tracking eliminates the need for explicit subscription code. Watchers simply "react" to whatever properties they use.

## Examples

### Basic Usage

```typescript
import { praxys } from 'praxys';

const store = praxys({
  count: 0,
  message: 'Hello'
});

// Set up a watcher that logs when count changes
const stopWatching = store.watch(() => {
  console.log(`Count is now: ${store.count}`);
});
// Logs immediately: "Count is now: 0"

// This triggers the watcher
store.count = 1; // Logs: "Count is now: 1"

// This doesn't trigger the watcher (not a dependency)
store.message = 'Hi'; // No log

// Stop watching when no longer needed
stopWatching();

// This no longer triggers anything
store.count = 2; // No log
```

### Conditional Dependencies

```typescript
const store = praxys({
  showDetails: false,
  user: {
    basic: { name: 'John' },
    details: { email: 'john@example.com', phone: '555-1234' }
  }
});

// Dependencies change based on showDetails flag
store.watch(() => {
  console.log('User info updated:');
  
  // Always depends on name and showDetails
  console.log(`Name: ${store.user.basic.name}`);
  
  // Conditionally depends on details
  if (store.showDetails) {
    console.log(`Email: ${store.user.details.email}`);
    console.log(`Phone: ${store.user.details.phone}`);
  }
});

// This triggers the watcher
store.user.basic.name = 'Jane'; // Logs updated info with just the name

// This triggers the watcher and changes future dependencies
store.showDetails = true; // Logs updated info with name, email and phone

// This now triggers the watcher because showDetails is true
store.user.details.email = 'jane@example.com'; // Logs updated info with all fields

// If we turn off details again
store.showDetails = false; // Logs updated info with just the name

// This no longer triggers the watcher
store.user.details.phone = '555-5678'; // No log (not a dependency when showDetails is false)
```

### Watching Arrays

```typescript
const store = praxys({
  todos: [
    { id: 1, text: 'Learn Praxys', completed: false }
  ]
});

// Watch array operations and properties of array items
store.watch(() => {
  const completedCount = store.todos.filter(todo => todo.completed).length;
  console.log(`${completedCount} of ${store.todos.length} completed`);
});
// Logs immediately: "0 of 1 completed"

// These operations all trigger the watcher:
store.todos.push({ id: 2, text: 'Build app', completed: false }); 
// Logs: "0 of 2 completed"

store.todos[0].completed = true; 
// Logs: "1 of 2 completed"

store.todos = []; 
// Logs: "0 of 0 completed"
```

### Derived State

```typescript
const store = praxys({
  items: [
    { price: 10, quantity: 2 },
    { price: 15, quantity: 1 }
  ],
  shipping: 5,
  total: 0 // Will be calculated
});

// Calculate total whenever items or shipping changes
store.watch(() => {
  const itemsTotal = store.items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0);
  
  // Update total without triggering other watchers
  store.ignore(() => {
    store.total = itemsTotal + store.shipping;
  });
});

// Display the total
store.watch(() => {
  console.log(`Order total: $${store.total}`);
});
// Logs immediately: "Order total: $35"

// Changing an item triggers recalculation
store.items[0].quantity = 3; // Logs: "Order total: $45"

// Changing shipping triggers recalculation
store.shipping = 10; // Logs: "Order total: $50"
```

## Performance Considerations

- Each watcher creates some memory overhead, so avoid creating too many watchers
- Watchers with many dependencies can be expensive to track
- Try to access only the specific properties you need inside watchers
- For expensive calculations, consider using computed properties or caching
- When a watcher is no longer needed, call the returned stop function to prevent memory leaks

## See Also

- [batch()](./batch) - Group multiple updates into a single notification
- [ignore()](./ignore) - Modify state without triggering watchers

