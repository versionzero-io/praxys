# Plugin Registration

Learn how to register and use plugins in your Praxys application.

## Overview

Plugins extend the functionality of Praxys by adding new methods and properties to your state. Once registered, plugins become available as methods on your configuration objects, allowing you to apply them to specific parts of your state tree.

## Registering Plugins

Plugins are registered using the `register()` function. Once registered, they can be used in any configuration.

### Syntax

```typescript
import { register } from 'praxys';

register(name: string, pluginFunction: PluginFunction): void;
```

### Parameters

- `name`: A string identifier for the plugin. This will become the method name used to invoke the plugin in configurations.
- `pluginFunction`: A function that implements the plugin's behavior, following the `PluginFunction` interface.

## Using Registered Plugins

After registration, plugins can be used in your configuration chains:

```typescript
import { praxys, config, register } from 'praxys';

// Register a plugin
register('formatDate', ({ node, opts = {} }) => {
  const key = opts.key || 'date';
  const format = opts.format || 'medium';
  const locale = opts.locale || 'en-US';
  
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

// Create configuration
const $ = config();

// Use the plugin in your configuration
$.user.formatDate({
  key: 'birthdate',
  format: 'long'
});

// Initialize store
const store = praxys({
  user: {
    name: 'Alice',
    birthdate: '1990-01-01'
  }
}, $);

// Access the plugin-provided property
console.log(store.user.formattedDate); // "January 1, 1990"
```

## Advanced Registration Patterns

### Chaining Plugins

Plugins can be chained with other configuration methods:

```typescript
// Create configuration with multiple plugins and extensions
$.user
  .formatDate({ key: 'birthdate' })
  .formatDate({ 
    key: 'registrationDate',
    format: 'short'
  })
  .extend(({ node }) => ({
    get fullName() {
      return `${node.firstName} ${node.lastName}`;
    }
  }));
```

### Creating Plugin Namespaces

You can organize plugins into namespaces by using dot notation in the plugin name:

```typescript
// Register plugins in the 'format' namespace
register('format.date', dateFormatterPlugin);
register('format.currency', currencyFormatterPlugin);
register('format.number', numberFormatterPlugin);

// Register plugins in the 'validate' namespace
register('validate.email', emailValidatorPlugin);
register('validate.password', passwordValidatorPlugin);

// Use namespaced plugins
const $ = config();
$.user.format.date({ key: 'birthdate' });
$.user.validate.email();
```

### Plugin Registration Strategies

#### Global Registration

Register plugins at the application's entry point:

```typescript
// main.js or index.js
import { register } from 'praxys';
import { dateFormatter, currencyFormatter } from './plugins';

// Register all plugins
register('formatDate', dateFormatter);
register('formatCurrency', currencyFormatter);
```

#### Module-based Registration

Register plugins in their own modules:

```typescript
// plugins/date-formatter.js
import { register } from 'praxys';

function dateFormatter({ node, opts = {} }) {
  // Plugin implementation
  // ...
}

// Self-register
register('formatDate', dateFormatter);

export { dateFormatter };
```

#### Plugin Library

Create a plugin library that self-registers:

```typescript
// praxys-formatters.js
import { register } from 'praxys';

const formatters = {
  date: ({ node, opts = {} }) => {
    // Date formatter implementation
    // ...
  },
  
  currency: ({ node, opts = {} }) => {
    // Currency formatter implementation
    // ...
  },
  
  number: ({ node, opts = {} }) => {
    // Number formatter implementation
    // ...
  }
};

// Register all formatters
Object.entries(formatters).forEach(([name, plugin]) => {
  register(`format.${name}`, plugin);
});

export default formatters;
```

## Error Handling

When registering or using plugins, handle errors appropriately:

```typescript
// Safely register a plugin
try {
  register('formatDate', dateFormatterPlugin);
} catch (error) {
  console.error('Failed to register plugin:', error);
}

// Check if a plugin is already registered
function safeRegister(name, plugin) {
  try {
    register(name, plugin);
    return true;
  } catch (error) {
    if (error.message.includes('already registered')) {
      console.warn(`Plugin ${name} is already registered`);
      return false;
    }
    throw error;
  }
}

// Safely use a plugin in configuration
const $ = config();
try {
  $.user.formatDate({ key: 'birthdate' });
} catch (error) {
  console.error('Failed to use formatDate plugin:', error);
  // Fallback configuration
  $.user.extend(({ node }) => ({
    get formattedDate() {
      return new Date(node.birthdate).toLocaleDateString();
    }
  }));
}
```

## TypeScript Support

For TypeScript users, ensure your plugin registrations include proper type definitions:

```typescript
import { register } from 'praxys';

// Define plugin options interface
interface DateFormatterOptions {
  key?: string;
  format?: 'short' | 'medium' | 'long' | 'full';
  locale?: string;
}

// Register the plugin with type annotations
register('formatDate', ({ node, opts = {} }: { 
  node: any; 
  opts?: DateFormatterOptions 
}) => {
  // Plugin implementation
  // ...
});

// Add type declarations for plugin methods
declare global {
  namespace Plugins {
    interface Config {
      formatDate(options?: DateFormatterOptions): Config;
    }
  }
}
```

For detailed TypeScript integration information, see [Plugin Types](./types).

## Best Practices

1. **Register plugins early** - Register plugins at application startup before creating any configurations
2. **Use namespaces** - Organize related plugins into namespaces to avoid naming conflicts
3. **Handle errors** - Implement error handling for both registration and usage
4. **Consider dependencies** - If plugins depend on each other, register them in the correct order
5. **Document options** - Clearly document the options each plugin accepts
6. **Test registrations** - Verify that plugins register correctly and handle edge cases

## See Also

- [register()](../core/register) - Register a plugin function
- [Plugin Creation](./creation) - Learn how to create plugins
- [Plugin Types](./types) - TypeScript type definitions for plugins 