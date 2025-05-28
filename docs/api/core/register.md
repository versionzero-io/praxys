# register()

Registers a plugin function that can be used in Praxys configurations.

## Syntax

```typescript
function register(name: string, plugin: PluginFunction): void;
```

## Parameters

- `name`: A string identifier for the plugin. This will be used to access the plugin in configurations.
- `plugin`: A function that implements the plugin's behavior.

## Return Value

None.

## Description

The `register()` function adds custom plugins to Praxys's configuration system. Plugins extend Praxys with reusable functionality that can be applied to any part of your state tree.

Key aspects of the plugin system:

1. **Chainable API** - Registered plugins become methods on configuration objects, allowing for a fluent, chainable API
2. **Context-Aware** - Plugins receive context about the node they're being applied to
3. **Option-Based** - Plugins can accept options to customize their behavior
4. **Composable** - Multiple plugins can be applied to the same part of the state tree

Once registered, plugins can be used in any configuration by calling a method with the plugin's name, making them a powerful way to share functionality across different Praxys applications.

## Plugin Function Interface

A plugin function receives an object with the following properties:

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
```

Plugin functions should return an object containing properties and methods to be added to the configured node.

## Examples

### Basic Plugin

```typescript
import { register, config, praxys } from 'praxys';

// Register a date formatter plugin
register('formatDate', ({ node, opts = {} }) => {
  // Get options with defaults
  const format = opts.format || 'short';
  const key = opts.key || 'date';
  
  return {
    get formattedDate() {
      // Format the date property using Intl.DateTimeFormat
      return new Intl.DateTimeFormat('en-US', { 
        dateStyle: format 
      }).format(new Date(node[key]));
    }
  };
});

// Use the plugin in a configuration
const $ = config();
$.users.formatDate({ format: 'medium' });

// Create store with the configuration
const store = praxys({
  users: [
    { id: 1, name: 'John', date: '2023-01-15' }
  ]
}, $);

// Access the formatted date
console.log(store.users[0].formattedDate); // "Jan 15, 2023"
```

### Advanced Plugin with State

```typescript
import { register, config, praxys } from 'praxys';

// Register a validation plugin that maintains error state
register('validate', ({ node, state, opts = {} }) => {
  // Initialize plugin state if needed
  if (!state.errors) {
    state.errors = {};
  }
  
  // Get validation rules from options
  const rules = opts.rules || {};
  
  return {
    // Method to validate the current node
    validate() {
      const errors = {};
      
      // Apply validation rules
      Object.entries(rules).forEach(([field, validators]) => {
        if (!Array.isArray(validators)) {
          validators = [validators];
        }
        
        // Run each validator
        validators.forEach(validator => {
          if (typeof validator === 'function') {
            const error = validator(node[field], field, node);
            if (error) {
              if (!errors[field]) errors[field] = [];
              errors[field].push(error);
            }
          }
        });
      });
      
      // Update error state
      state.errors = Object.keys(errors).length ? errors : null;
      
      return Object.keys(errors).length === 0;
    },
    
    // Get current validation errors
    get errors() {
      return state.errors;
    },
    
    // Check if a specific field has errors
    hasError(field) {
      return state.errors && field in state.errors;
    },
    
    // Get errors for a specific field
    getFieldErrors(field) {
      return (state.errors && state.errors[field]) || [];
    }
  };
});

// Create validation rules
const required = value => !value ? 'This field is required' : null;
const minLength = min => value => 
  value && value.length < min ? `Must be at least ${min} characters` : null;
const email = value => 
  value && !/\S+@\S+\.\S+/.test(value) ? 'Invalid email format' : null;

// Use the plugin in a configuration
const $ = config();
$.user.validate({
  rules: {
    name: [required, minLength(3)],
    email: [required, email]
  }
});

// Create a store with the configuration
const store = praxys({
  user: {
    name: '',
    email: ''
  }
}, $);

// Validate the user data
const isValid = store.user.validate();
console.log(isValid); // false
console.log(store.user.errors); 
// { name: ['This field is required', 'Must be at least 3 characters'], email: ['This field is required'] }

// Update data and validate again
store.user.name = 'John';
store.user.email = 'invalid';
store.user.validate();
console.log(store.user.hasError('name')); // false
console.log(store.user.getFieldErrors('email')); // ['Invalid email format']
```

## TypeScript Support

To provide TypeScript support for your plugin, extend the `Plugins.Config` interface:

```typescript
import { register } from 'praxys';

// Declare plugin options type
interface FormatDateOptions {
  format?: 'short' | 'medium' | 'long';
  key?: string;
}

// Extend the global Plugins namespace
declare global {
  namespace Plugins {
    interface Config {
      formatDate(options?: FormatDateOptions): Config;
    }
  }
}

// Register the plugin
register('formatDate', ({ node, opts = {} }: { 
  node: any, 
  opts?: FormatDateOptions 
}) => {
  // Plugin implementation
  // ...
});
```

## See Also

- [config()](./config) - Create a configuration object
- [plugins/creation](../plugins/creation) - More details on creating plugins
- [plugins/types](../plugins/types) - Type definitions for plugins 