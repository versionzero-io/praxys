# Performance Optimization

While Praxys is efficient by default, understanding optimization techniques can help you build more responsive applications. This guide covers ways to minimize unnecessary updates and handle large datasets effectively.

## Understanding Dependency Tracking

Optimizing performance starts with understanding how dependencies are created:

```javascript
// Only creates dependency on the todos array reference
store.watch(() => {
  const todos = store.todos;
  updateUI(todos); // Won't run when todo items change internally
});

// Creates dependencies on each todo's completed property
store.watch(() => {
  const completedCount = store.todos.filter(t => t.completed).length;
  updateCompletedCount(completedCount);
});

// To watch all properties of todos items
store.watch(() => {
  // Explicitly access the properties you want to track
  const todosWithProps = store.todos.map(todo => ({
    id: todo.id,
    text: todo.text,
    completed: todo.completed
  }));
  updateUI(todosWithProps);
});
```

In Praxys:
- Accessing `store.todos` creates a dependency on the array reference only
- Accessing `store.todos.length` creates a dependency on the array length
- Accessing `store.todos[0]` creates a dependency on that specific array index
- Methods like `filter()` or `map()` create dependencies on each accessed property

Be mindful of which properties you access in your watchers to avoid unnecessary dependencies.

## Using Refs for Non-Reactive Properties

For data that doesn't need to be reactive, use the `Ref<T>` type:

```javascript
import { praxys, config } from 'praxys';
import type { Ref } from 'praxys';

// Define state with non-reactive properties
interface AppState {
  // Reactive properties
  count: number;
  
  // Non-reactive properties
  largeDataset: Ref<Record<string, any>>;
}

// Create configuration with ref implementation
const $ = config();
$.extend(({ node }) => ({
  get largeDatasetRef() {
    return node.largeDataset;
  },
  set largeDatasetRef(value) {
    node.largeDataset = value;
  }
}));

// Initialize the store
const store = praxys({
  count: 0,
  largeDataset: {} // No Ref suffix in the state
});

// Access using the Ref suffix
store.largeDatasetRef = loadHugeDataset();
```

Use Refs for:
- Large datasets that don't need reactivity
- Frequently changing values that shouldn't trigger updates
- Complex objects like Maps, Sets, or custom classes
- Cached computation results

## Optimizing Collection Operations

### 1. Use Computed Properties for Derived Values

```javascript
// Define computed properties
$.todos.extend(({ node }) => ({
  get completedCount() {
    return node.filter(todo => todo.completed).length;
  },
  get activeCount() {
    return node.length - this.completedCount;
  }
}));

// Watch the computed property directly
store.watch(() => {
  updateCounter(store.todos.completedCount);
});
```

### 2. Maintain Counters Instead of Recalculating

```javascript
// Initialize with counters
const store = praxys({
  todos: [],
  stats: {
    total: 0,
    completed: 0,
    active: 0
  }
});

// Update counters when todos change
$.extend(({ node }) => ({
  addTodo(text) {
    node.todos.push({
      id: Date.now(),
      text,
      completed: false
    });
    node.stats.total++;
    node.stats.active++;
  },
  
  toggleTodo(id) {
    const todo = node.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      if (todo.completed) {
        node.stats.completed++;
        node.stats.active--;
      } else {
        node.stats.completed--;
        node.stats.active++;
      }
    }
  }
}));
```

### 3. Use Batch Updates

```javascript
// Inefficient - triggers watchers multiple times
store.todos[0].completed = true;
store.todos[1].completed = true;

// Better - triggers watchers only once
store.batch(() => {
  store.todos.forEach(todo => {
    todo.completed = true;
  });
});
```

## Handling Large Datasets

### 1. Pagination

Only load and render what's visible:

```javascript
const store = praxys({
  items: [],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 0
  }
});

$.extend(({ node }) => ({
  async loadPage(page) {
    node.pagination.page = page;
    const response = await fetchItems(page, node.pagination.pageSize);
    node.items = response.items;
    node.pagination.totalItems = response.total;
  },
  
  get totalPages() {
    return Math.ceil(node.pagination.totalItems / node.pagination.pageSize);
  }
}));
```

### 2. Using ignore() for Bulk Operations

```javascript
// Load data without triggering watchers
store.ignore(() => {
  // Process large dataset in batches
  const items = fetchLargeDataset();
  
  // Process in chunks to avoid UI freezing
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    setTimeout(() => {
      store.batch(() => {
        batch.forEach(item => {
          if (isItemVisible(item)) {
            store.visibleItems.push(item);
          } else {
            store.hiddenItemsRef.push(item);
          }
        });
      });
    }, 0);
  }
});
```

### 3. Selective Updates

Only update what's changed:

```javascript
$.extend(({ node }) => ({
  updateItem(id, changes) {
    const index = node.items.findIndex(item => item.id === id);
    if (index !== -1) {
      // Only update properties that changed
      const item = node.items[index];
      store.batch(() => {
        Object.entries(changes).forEach(([key, value]) => {
          item[key] = value;
        });
      });
    }
  }
}));
```

## Debugging Performance

### Count Watcher Executions

```javascript
const counts = {};

function trackWatcher(name, watchFn) {
  counts[name] = 0;
  return store.watch(() => {
    counts[name]++;
    console.log(`${name}: ${counts[name]} executions`);
    return watchFn();
  });
}

trackWatcher('todoCounter', () => {
  const count = store.todos.filter(t => t.completed).length;
  updateCounter(count);
  return count;
});
```

### Profile Updates

```javascript
// Mark operations in Chrome DevTools Performance tab
performance.mark('update-start');

store.batch(() => {
  // Your updates
  store.todos.forEach(todo => todo.completed = true);
});

performance.mark('update-end');
performance.measure('update', 'update-start', 'update-end');
console.log(performance.getEntriesByName('update'));
```

## Summary

Performance optimization in Praxys involves:
- Creating appropriate dependencies
- Using Refs for non-reactive data
- Creating computed properties for derived values
- Batching related updates
- Implementing pagination for large datasets
- Using ignore() for bulk operations

Apply these techniques where needed to maintain reactivity while ensuring your application remains fast and responsive. 