# Creating Plugins

Learn how to create custom plugins that extend Praxys's functionality.

## Plugin Basics

A Praxys plugin is a function that receives context about the node being configured and returns an object containing properties and methods to be added to that node. Plugins allow you to create reusable functionality that can be applied anywhere in your state tree.

## Plugin Function Interface

A plugin function follows this interface:

```typescript
interface PluginArgs {
  node: any;        // The current node being configured
  state: any;       // Internal plugin state that persists between calls
  path: string;     // The path to the current node (e.g., "todos.0.completed")
  opts?: any;       // Options passed when using the plugin
  ctx: {            // Shared context across plugins
    root: any;      // The root state object
    [key: string]: any;  // Other context properties
  };
  utils: {          // Utility functions
    createProxy: (target: any) => any;
    isProxy: (obj: any) => boolean;
    getTarget: (proxy: any) => any;
    // Other utility functions
  };
}

type PluginFunction = (args: PluginArgs) => Record<string, any>;
```

Each argument provides specific capabilities:

- `node`: Direct access to modify the current node being configured
- `state`: Persistent storage for plugin state across invocations
- `path`: String path from the root to the current node
- `opts`: Options passed when the plugin is invoked in a configuration
- `ctx`: Shared context accessible by all plugins
- `utils`: Helper functions for working with Praxys internals

## Creating a Plugin

To create a plugin:

1. Define a function that accepts the `PluginArgs` interface
2. Process any options passed to the plugin
3. Return an object with properties and methods to add to the node
4. Register the plugin using the `register()` function

## Examples

### Basic Plugin

```typescript
import { register } from 'praxys';

// Create a simple date formatter plugin
register('formatDate', ({ node, opts = {} }) => {
  // Get options with defaults
  const key = opts.key || 'date';
  const format = opts.format || 'medium';
  const locale = opts.locale || 'en-US';
  
  // Return a getter that formats the date
  return {
    get formattedDate() {
      const value = node[key];
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(locale, { 
        dateStyle: format 
      }).format(date);
    }
  };
});
```

### Plugin with Methods

```typescript
import { register } from 'praxys';

// Create a validation plugin
register('validate', ({ node, state, opts = {} }) => {
  // Initialize state if needed
  if (!state.errors) {
    state.errors = {};
  }
  
  // Get validation rules from options
  const rules = opts.rules || {};
  
  // Return validation methods and properties
  return {
    validate() {
      // Reset validation state
      state.errors = {};
      let isValid = true;
      
      // Apply each rule
      Object.entries(rules).forEach(([field, ruleFn]) => {
        if (typeof ruleFn === 'function') {
          const error = ruleFn(node[field], field, node);
          if (error) {
            isValid = false;
            state.errors[field] = error;
          }
        }
      });
      
      return isValid;
    },
    
    get isValid() {
      return Object.keys(state.errors).length === 0;
    },
    
    get errors() {
      return { ...state.errors };
    },
    
    hasError(field) {
      return field in state.errors;
    }
  };
});
```

### Plugin Using Shared Context

```typescript
import { register } from 'praxys';

// Create an activity tracking plugin
register('trackActivity', ({ node, ctx, path }) => {
  // Initialize context if needed
  if (!ctx.lastUpdated) {
    ctx.lastUpdated = {};
  }
  
  // Use path as a unique identifier for this node
  return {
    trackActivity() {
      ctx.lastUpdated[path] = new Date();
    },
    
    get lastActivity() {
      return ctx.lastUpdated[path] || null;
    },
    
    get formattedLastActivity() {
      const date = ctx.lastUpdated[path];
      if (!date) return 'Never';
      
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    }
  };
});
```

## Using Plugins

Once registered, plugins can be used in your configuration:

```typescript
import { config, praxys } from 'praxys';

// Create configuration
const $ = config();

// Use the date formatter plugin
$.user.formatDate({
  key: 'birthdate',
  format: 'long',
  locale: 'en-US'
});

// Use the validation plugin
$.user.validate({
  rules: {
    email: value => !value.includes('@') ? 'Invalid email format' : null,
    age: value => value < 18 ? 'Must be at least 18' : null
  }
});

// Use the activity tracking plugin
$.user.trackActivity();

// Initialize store
const store = praxys({
  user: {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    birthdate: '1990-01-01',
    age: 33
  }
}, $);

// Access plugin-provided functionality
console.log(store.user.formattedDate); // "January 1, 1990"
console.log(store.user.validate()); // true

// Trigger validation errors
store.user.email = 'invalid';
console.log(store.user.validate()); // false
console.log(store.user.errors); // { email: 'Invalid email format' }

// Track activity
store.user.trackActivity();
console.log(store.user.formattedLastActivity); // "Jun 15, 2023, 3:42 PM"
```

## Best Practices

When creating plugins:

1. **Provide clear documentation** - Document the purpose, options, and return values
2. **Use sensible defaults** - Make options optional when possible
3. **Handle errors gracefully** - Validate inputs and provide helpful error messages
4. **Persist state properly** - Use the `state` parameter for plugin-specific state
5. **Share context carefully** - Use the `ctx` parameter for sharing across plugins
6. **Be mindful of performance** - Avoid expensive operations in getters
7. **Add TypeScript declarations** - See [Plugin Types](./types) for detailed TypeScript integration

## See Also

- [register()](../core/register) - Register a plugin
- [Plugin Registration](./registration) - How to register and use plugins
- [Plugin Types](./types) - Type definitions for plugins 