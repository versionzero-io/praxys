# Understanding Reactivity

Praxys features a fine-grained reactivity system that keeps your application in sync with state changes. This guide explains how Praxys's reactivity works and how to use it effectively.

## Reactivity Basics

Praxys implements reactivity by:

1. **Tracking dependencies** when you access properties inside a watch function
2. **Detecting changes** when properties are modified
3. **Notifying watchers** when their dependencies change

Here's a simple example:

```javascript
import { praxys } from 'praxys';

// Create a reactive state
const store = praxys({
  count: 0,
  user: { name: 'John' }
});

// Watch for changes
store.watch(() => {
  console.log(`Count: ${store.count}`);
  // Accessing store.count inside watch creates a dependency
});

// This triggers the watcher
store.count = 1; // Logs: "Count: 1"

// Reading outside of watch doesn't create dependencies
const currentCount = store.count; // No dependency created
console.log(currentCount);
```

## The Watch Function

The `watch` function is how you respond to state changes:

```javascript
const stopWatching = store.watch(() => {
  // This runs initially and whenever accessed properties change
  document.getElementById('count').textContent = store.count;
});

// Stop watching when no longer needed
stopWatching();
```

Watchers automatically track and respond only to the specific properties they access:

```javascript
// Only watches theme setting
store.watch(() => {
  document.body.className = store.settings.theme;
});

// Only watches todo count
store.watch(() => {
  updateBadge(store.todos.length);
});
```

## Array Reactivity

Arrays in Praxys are fully reactive with granular dependency tracking:

```javascript
const store = praxys({
  todos: [
    { id: 1, text: 'Learn Praxys', completed: false },
    { id: 2, text: 'Build app', completed: true }
  ]
});

// Watch the array and its items
store.watch(() => {
  console.log(`Todos: ${store.todos.length}`); // Creates dependency on $.todos.length
  console.log(`Completed: ${store.todos.filter(t => t.completed).length}`); // Creates multiple dependencies
});

// All these operations trigger the watcher:
store.todos.push({ id: 3, text: 'New task', completed: false });
store.todos[0].completed = true;
store.todos.splice(0, 1);
store.todos = [{ id: 3, text: 'New todo', completed: false }];
```

### How Array Filtering Creates Dependencies

When you use array methods like `filter`, Praxys creates very specific dependencies:

```javascript
store.watch(() => {
  // This creates dependencies on:
  // 1. $.todos (the array reference)
  // 2. $.todos.length (accessed by filter() internally)
  // 3. $.todos[0], $.todos[1], etc. (each array index accessed)
  // 4. $.todos[0].completed, $.todos[1].completed, etc. (each item's completed property)
  const completedTodos = store.todos.filter(t => t.completed);
  console.log(`${completedTodos.length} completed`);
});
```

**Dependencies created:**
- `$.todos` - for complete array replacement
- `$.todos.length` - for array length changes (push, pop, splice, etc.)
- `$.todos[0]`, `$.todos[1]`, etc. - for individual item replacement
- `$.todos[0].completed`, `$.todos[1].completed`, etc. - for each accessed property

**What triggers re-execution:**
- ✅ `store.todos[0].completed = true` → triggers (exact property changed)
- ✅ `store.todos.push(newTodo)` → triggers (array length changed)
- ✅ `store.todos.splice(0, 1)` → triggers (array length changed)
- ✅ `store.todos = newArray` → triggers (array reference changed)
- ❌ `store.todos[0].text = 'Updated'` → does NOT trigger (only `completed` is tracked)

This granular tracking means your filters are highly efficient - they only re-run when the specific properties they read actually change.

### Array Method Dependency Patterns

Different array operations create different dependency patterns:

```javascript
const store = praxys({
  users: [
    { name: 'Alice', age: 25, active: true },
    { name: 'Bob', age: 30, active: false }
  ]
});

// Only depends on the 'active' property of each user + array structure
store.watch(() => {
  const activeUsers = store.users.filter(u => u.active);
  updateActiveUsersList(activeUsers);
  // Dependencies: $.users, $.users.length, $.users[0], $.users[1], $.users[0].active, $.users[1].active
});

// Only depends on the 'age' property of each user + array structure  
store.watch(() => {
  const averageAge = store.users.reduce((sum, u) => sum + u.age, 0) / store.users.length;
  updateAgeDisplay(averageAge);
  // Dependencies: $.users, $.users.length, $.users[0], $.users[1], $.users[0].age, $.users[1].age
});

// Depends on both 'name' and 'active' properties + array structure
store.watch(() => {
  const activeNames = store.users
    .filter(u => u.active)
    .map(u => u.name);
  updateNamesList(activeNames);
  // Dependencies: $.users, $.users.length, $.users[0], $.users[1], 
  //               $.users[0].active, $.users[1].active, $.users[0].name, $.users[1].name
});
```

**Key insight:** Praxys uses exact path matching. It only notifies watchers that depend on the exact property path that changed, making your reactive updates extremely efficient.

## Batch Updates

Use `batch` to make multiple state changes with only one update cycle:

```javascript
store.batch(() => {
  // Multiple changes
  store.count = 5;
  store.user.name = 'Jane';
  store.todos.push({ id: 3, text: 'New task', completed: false });
  
  // Watchers run once after all changes are complete
});
```

This is useful for:
- Making related changes simultaneously
- Updating multiple properties that affect the same UI
- Maintaining consistency between interdependent state

## Ignoring Watchers

Dependencies are only created when accessing state inside a `watch` function. The `ignore` function lets you modify state without triggering any watchers:

```javascript
// Normal access outside watch doesn't create dependencies
const count = store.count; // No dependency created

// Make changes without triggering any watchers
store.ignore(() => {
  store.count++; // This change won't trigger any watchers
  store.user.name = 'Bob'; // No watchers will be notified
});

// Normal changes outside ignore will trigger watchers as usual
store.count++; // This will trigger watchers
```

Common use cases for `ignore`:
- Initializing data without triggering UI updates
- Making background updates that shouldn't affect the UI
- Performance optimization by preventing unnecessary updates
- Internal state maintenance that users shouldn't see

## Advanced Patterns

### The "Once" Pattern

Sometimes you need a watcher that runs only once when initialized. This is particularly handy when your state tree has computed properties, getters, or reactive derived values that you want to read once:

```javascript
const store = praxys({
  user: { name: 'Alice', theme: 'light' },
  todos: [
    { id: 1, text: 'Learn Praxys', completed: false },
    { id: 2, text: 'Build app', completed: true }
  ]
});

// Run once when the watcher is first created
const stop = store.watch(() => {
  console.log('Initial setup:', store.user.name);
  console.log('Initial todos:', store.todos.length);
  console.log('Completed count:', store.todos.filter(t => t.completed).length);
  
  // Stop the watcher immediately after first run
  stop();
});

// This is useful for:
// - One-time initialization based on computed properties
// - Reading reactive derived values without ongoing watching
// - Setting up initial UI state from complex state calculations
// - Logging initial values for debugging
```

> **Note:** For basic state trees with simple data, you'd typically just access the properties directly in a function rather than using this pattern. The "once" pattern shines when you need to leverage Praxys's reactivity system for a single read.

You can also create a helper function for this pattern:

```javascript
function once(store, callback) {
  const stop = store.watch(() => {
    callback();
    stop();
  });
  return stop;
}

// Usage:
once(store, () => {
  console.log('This runs exactly once');
  initializeUI(store.user.theme);
});
```

### Chaining Reactive Effects

Create reactive workflows by chaining watchers:

```javascript
const store = praxys({
  preferences: {
    theme: 'light',
    fontSize: 'medium'
  },
  derived: {
    cssVariables: {}
  }
});

// First watcher: Calculate derived values
store.watch(() => {
  const { theme, fontSize } = store.preferences;
  
  store.derived.cssVariables = {
    '--bg-color': theme === 'dark' ? '#121212' : '#ffffff',
    '--text-color': theme === 'dark' ? '#ffffff' : '#121212',
    '--font-size': fontSize === 'large' ? '18px' : '14px'
  };
});

// Second watcher: Apply to DOM
store.watch(() => {
  Object.entries(store.derived.cssVariables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
});

// Changing a preference triggers the chain:
store.preferences.theme = 'dark';
```

### Creating Derived State

Derive state from one store for use in another:

```javascript
const tasks = praxys({ items: [] });
const stats = praxys({ completed: 0, active: 0, total: 0 });

// Keep stats in sync with tasks
tasks.watch(() => {
  stats.batch(() => {
    stats.total = tasks.items.length;
    stats.completed = tasks.items.filter(task => task.completed).length;
    stats.active = stats.total - stats.completed;
  });
});
```

## Debugging Reactivity

When troubleshooting reactivity issues:

1. **Add diagnostic watchers**:
   ```javascript
   store.watch(() => console.log('Value changed:', store.someValue));
   ```

2. **Use batch to isolate changes**:
   ```javascript
   store.batch(() => store.someValue = 123);
   ```

3. **Isolate properties with selective updates**:
   ```javascript
   // To determine which property triggers a watcher:
   store.prop1 = newValue1; // If watcher triggers, prop1 is watched
   store.prop2 = newValue2; // If watcher triggers, prop2 is watched
   
   // When you need to update without any triggers
   store.ignore(() => {
     // No watchers will trigger for any changes here
     store.prop1 = newValue;
     store.prop2 = newValue;
   });
   ```

## Common Pitfalls

### Watchers Not Running
- Make sure you're accessing the property in your watcher
- Check if the property was modified in an `ignore` function
- Verify the property path is correct

### Watchers Running Too Often
- Make watchers more specific by only accessing needed properties
- Use `batch` for multiple related updates
- Check for unintentional property access

### Circular Updates

Praxys has built-in protection against infinite loops during notification cycles:

```javascript
// This is safe and won't cause an infinite loop
store.watch(() => {
  if (store.count > 10) {
    store.count = 10; // Won't re-trigger this watcher during the same notification cycle
  }
});
```

Praxys prevents recursive notifications within the same notification cycle (see the `inProgress` set in the watch implementation), avoiding infinite loops without requiring explicit use of `ignore()`. However, the watcher can still be triggered again in future notification cycles if the dependency changes from other sources.

## What You've Learned

With Praxys's reactivity system, you can build applications that efficiently respond to state changes with minimal code:

- Use `watch` to respond to state changes
- Remember that dependencies are only created inside watch functions
- Use `batch` for multiple related updates
- Use `ignore` to make changes without triggering any watchers
- Leverage computed properties for derived values
- Structure your state for granular reactivity