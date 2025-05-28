# praxys()

Creates a reactive state store with optional configuration.

## Syntax

```typescript
function praxys<T>(initialState: T, config?: Plugins.Config): T & Praxys;
```

## Parameters

- `initialState`: The initial state object that will be made reactive.
- `config` *(optional)*: A configuration object created with `config()` that defines extensions and behavior.

## Return Value

Returns a proxy object that wraps the initial state, making it reactive. The returned object includes:

1. Your complete state tree with all properties from `initialState`
2. All methods and computed properties defined in the configuration (if provided)
3. These additional core methods available at the root level only:
   - `watch()`: Sets up a reactive watcher that runs when dependencies change
   - `batch()`: Groups multiple updates into a single notification
   - `ignore()`: Performs state changes without triggering watchers

The core methods are not available on nested objects within the state tree, but any plugin extensions will be available where they were configured to be.

## Description

The `praxys()` function is the main entry point for creating a reactive state store. It transforms a plain JavaScript object into a reactive state tree where:

1. **Property access is tracked** - When you access properties inside a `watch()` callback, Praxys records these as dependencies
2. **Property changes trigger updates** - When you modify properties, Praxys automatically notifies any watchers that depend on those properties
3. **Nested objects are reactive** - All nested objects and arrays are also made reactive
4. **Methods are preserved** - Any methods on the initial state object are preserved and work normally

When a configuration object is provided, Praxys applies all the defined extensions, computed properties, and methods to the appropriate parts of the state tree.

## Examples

### Basic Usage

```typescript
import { praxys } from 'praxys';

// Create a simple reactive store
const store = praxys({
  count: 0,
  user: {
    name: 'John',
    email: 'john@example.com'
  }
});

// Watch for changes to count
store.watch(() => {
  console.log(`Count changed to ${store.count}`);
});

// Update count - triggers the watcher
store.count = 1; // Logs: "Count changed to 1"
```

### With Configuration

```typescript
import { praxys, config } from 'praxys';

// Create configuration
const $ = config();

// Add methods to the root
$.extend(({ node }) => ({
  increment() {
    node.count++;
  },
  decrement() {
    node.count--;
  },
  get doubled() {
    return node.count * 2;
  }
}));

// Create store with configuration
const store = praxys({
  count: 0
}, $);

// Use the configured methods
store.increment();
console.log(store.count); // 1
console.log(store.doubled); // 2
```

### With Nested Configuration

```typescript
import { praxys, config } from 'praxys';

const $ = config();

// Configure nested properties
$.todos.extend(({ node }) => ({
  addTodo(text) {
    node.push({
      id: Date.now(),
      text,
      completed: false
    });
  },
  get active() {
    return node.filter(todo => !todo.completed);
  },
  get completed() {
    return node.filter(todo => todo.completed);
  }
}));

// Create store with nested state
const store = praxys({
  todos: []
}, $);

// Use configured methods
store.todos.addTodo('Learn Praxys');
console.log(store.todos.length); // 1
console.log(store.todos.active.length); // 1
```

## TypeScript Usage

```typescript
import { praxys, config } from 'praxys';

// Define state interface
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
}

// Create configuration
const $ = config();

// Add typed extensions
$.todos.extend(({ node }) => ({
  addTodo(text: string) {
    node.push({
      id: Date.now(),
      text,
      completed: false
    });
  },
  toggle(id: number) {
    const todo = node.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }
}));

// Create typed store
const store = praxys<TodoState>({
  todos: [],
  filter: 'all'
}, $);

// TypeScript knows the shape of the store
store.todos.addTodo('Learn TypeScript with Praxys');
store.filter = 'active'; // Type-checked
```

## See Also

- [config()](./config) - Create a configuration object
- [watch()](../reactivity/watch) - Set up a reactive watcher
- [batch()](../reactivity/batch) - Group multiple updates
- [ignore()](../reactivity/ignore) - Modify state without triggering watchers 