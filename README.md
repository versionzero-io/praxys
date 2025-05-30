# Praxys

Data Made Practical - A reactive state management library combining declarative configuration, fine-grained reactivity, and a flexible plugin system.

## Why Praxys?

Praxys offers a fresh approach to state management by combining three powerful concepts: declarative configuration, fine-grained reactivity, and a flexible plugin system. By defining your state's behavior upfront, you gain clarity and organization in your codebase. This approach makes your application easier to reason about and test — especially as it grows.

## Features

- **Declarative Configuration**: Define your state's behavior using a clear, composable configuration system
- **Fine-grained Reactivity**: Automatically track dependencies and trigger updates only when relevant data changes
- **Flexible Plugin System**: Enhance functionality with plugins that cleanly separate concerns and promote reusability
- **Path-based Targeting**: Apply methods to specific parts of your state tree with powerful selectors
- **Batch & Ignore Utilities**: Control when and how updates trigger reactions
- **TypeScript Support**: First-class type safety with advanced patterns for non-reactive data
- **Lightweight & Framework-Agnostic**: Small bundle size with zero dependencies, works with any UI framework

## Installation

You can install Praxys directly from the GitHub repository:

```bash
# Install from GitHub repository
npm install versionzero-io/praxys
```

Or if you need a specific branch or version:

```bash
# Install from a specific branch
npm install versionzero-io/praxys#main
```

Once the package is published to npm, you'll be able to install it with:

```bash
npm install @versionzero-io/praxys
```

## Quick Example

```javascript
import { praxys, config } from 'praxys';

// Create configuration
const $ = config();

// Define behavior
$.extend(({ node }) => ({
  increment() { node.count++; },
  decrement() { node.count--; },
  get isPositive() { return node.count > 0; }
}));

// Create reactive state
const store = praxys({ count: 0 }, $);

// Use your store
store.increment();
console.log(store.count); // 1
console.log(store.isPositive); // true

// React to changes
const stop = store.watch(() => {
  console.log(`Count is now: ${store.count}`);
});
```

## Advanced Features

### Path Targeting

```javascript
// Apply methods to todos array
$.todos.extend(({ node }) => ({
  addTodo(text) { 
    node.push({ id: Date.now(), text, completed: false }); 
  }
}));

// Apply methods to individual todo items
$.target(({ path }) => path.match(/^\$\.todos\[\d+\]$/))
  .extend(({ node }) => ({
    toggle() { 
      node.completed = !node.completed; 
    }
  }));
```

### Batch Updates

```javascript
store.batch(() => {
  store.todos[0].completed = true;
  store.todos[1].completed = false;
  // Watchers run only once after all changes
});
```

### Plugin System

```javascript
import { register } from 'praxys';

// Register a plugin
register('formatDate', ({ node, opts = {} }) => ({
  format() {
    return new Date(node[opts.key]).toLocaleDateString();
  }
}));

// Use in configuration
$.user.formatDate({ key: 'birthdate' });
```

## Documentation

📖 **[Visit the full documentation](https://versionzero-io.github.io/praxys/)** for comprehensive guides and API references.

The documentation includes:
- [Getting Started Guide](https://versionzero-io.github.io/praxys/guides/get-started.html)
- [API Reference](https://versionzero-io.github.io/praxys/api/)
- [Configuration Patterns](https://versionzero-io.github.io/praxys/guides/config-patterns.html)
- [Creating Plugins](https://versionzero-io.github.io/praxys/guides/creating-plugins.html)
- [Performance Optimization](https://versionzero-io.github.io/praxys/guides/performance-optimization.html)
- [Comprehensive Cheat Sheet](https://versionzero-io.github.io/praxys/cheat-sheet.html)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build the library
npm run build
```
## License

MIT © 2025 Versionzero.io

