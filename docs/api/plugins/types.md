# Plugin Types

This page documents the TypeScript type definitions related to Praxys plugins.

## Core Plugin Types

### PluginFunction

The core type for plugin functions:

```typescript
/**
 * Function that implements a plugin
 */
type PluginFunction<T = Record<string, any>> = (args: PluginArgs) => T;
```

### PluginArgs

The arguments passed to plugin functions:

```typescript
/**
 * Arguments passed to a plugin function
 */
interface PluginArgs {
  /** The current node being configured */
  node: any;
  
  /** Plugin state that persists between calls */
  state: Record<string, any>;
  
  /** Path to the current node from the root (e.g., "todos.0.completed") */
  path: string;
  
  /** Options passed when using the plugin */
  opts?: any;
  
  /** Reference to the root state object */
  root?: any;
  
  /** Parent node reference */
  parent?: any;
  
  /** Shared context object across plugins */
  ctx?: Record<string, any>;
  
  /** Empty utility object that can be extended by plugins */
  utils?: Record<string, any>;
}
```

## Extending TypeScript Interfaces

When creating plugins, you extend Praxys's TypeScript interfaces through declaration merging. This provides proper type checking and autocompletion for users of your plugins.

### Config Interface

The `Config` interface represents a configuration object created with `config()`. Extend this interface to add your plugin methods:

```typescript
declare global {
  namespace Plugins {
    interface Config {
      // Add your plugin method
      myPlugin(options?: MyPluginOptions): Config;
    }
  }
}
```

### Plugin Extension Interfaces

In addition to extending the `Config` interface, plugin authors should export empty interfaces that users can import to type their state. By convention, these interfaces are:

```typescript
// Export interfaces for properties and methods your plugin adds
export interface Node {
  // Properties and methods added to nodes by your plugin
  myComputedProperty?: string;
  myMethod?(): void;
}

// State used by your plugin internally
export interface State {
  // Properties used in your plugin's state object
  myInternalCounter?: number;
}

// Utility functions your plugin might add
export interface Utils {
  // Utility functions your plugin adds
}

// Context properties your plugin might use
export interface Ctx {
  // Context properties your plugin uses
  myPluginSettings?: Record<string, any>;
}
```

Users can then import and extend these interfaces to type their state properly:

```typescript
// Import the plugin interfaces
import { Node as MyPluginNode } from 'my-plugin';

// Define base state
interface Product {
  id: number;
  name: string;
  price: number;
}

// Extend with plugin properties
type ProductWithPlugin = Product & MyPluginNode;

// Application state with proper typing
interface AppState {
  products: ProductWithPlugin[];
}
```

### Complete Plugin Registration Pattern

This example shows the complete pattern for registering a plugin with TypeScript support:

```typescript
import { register } from 'praxys';

// 1. Define plugin options interface
interface FormatOptions {
  locale?: string;
  currency?: string;
}

// 2. Extend Config interface through declaration merging
declare global {
  namespace Plugins {
    interface Config {
      // Define plugin method signature
      formatCurrency(options?: FormatOptions): Config;
    }
  }
}

// 3. Export interfaces for plugin consumers
export interface Node {
  // Properties and methods added to nodes
  formatted?: string;
  format?(options?: FormatOptions): string;
}

export interface State {
  // Internal state properties
  cachedFormat?: string;
}

export interface Utils {}
export interface Ctx {}

// 4. Implement the plugin
function formatCurrencyPlugin({ node, state, opts = {} }: PluginArgs): Record<string, any> {
  const locale = opts.locale || 'en-US';
  const currency = opts.currency || 'USD';
  
  return {
    // Methods and properties to add to the node
    get formatted() {
      // Cache the formatted value in state
      if (!state.cachedFormat) {
        state.cachedFormat = new Intl.NumberFormat(locale, { 
          style: 'currency', 
          currency 
        }).format(node);
      }
      return state.cachedFormat;
    },
    
    format(options = {}) {
      const customLocale = options.locale || locale;
      const customCurrency = options.currency || currency;
      
      return new Intl.NumberFormat(customLocale, { 
        style: 'currency', 
        currency: customCurrency 
      }).format(node);
    }
  };
}

// 5. Register the plugin
register('formatCurrency', formatCurrencyPlugin);
```

## Using Plugin Types in Application Code

When using plugins with TypeScript, define your state interfaces to include properties and methods added by plugins:

```typescript
import { praxys, config } from 'praxys';
import { Node as CurrencyNode } from 'currency-formatter-plugin';

// Define interfaces for your state
interface Product {
  id: number;
  name: string;
  price: number;
}

// Extend with plugin-provided properties and methods
interface ProductWithPlugins extends Product, CurrencyNode {
  // You can also add more type information if needed
  readonly formatted: string;
  format(options?: { locale?: string; currency?: string }): string;
}

interface AppState {
  products: ProductWithPlugins[];
  cart: {
    items: Array<ProductWithPlugins & { quantity: number }>;
    total: number;
  };
}

// Configure your state
const $ = config();
$.products[].formatCurrency({ locale: 'en-US', currency: 'USD' });
$.cart.total.formatCurrency();

// Create typed store
const store = praxys<AppState>({
  products: [
    { id: 1, name: 'Laptop', price: 1299.99 }
  ],
  cart: {
    items: [],
    total: 0
  }
}, $);

// TypeScript now recognizes plugin-provided properties
console.log(store.products[0].formatted); // "$1,299.99"
console.log(store.products[0].format({ currency: 'EUR' })); // "€1,299.99"
console.log(store.cart.total.formatted); // "$0.00"
```

## Best Practices

1. **Use Declaration Merging**: Always extend the global `Plugins.Config` interface
2. **Export Type Interfaces**: Export `Node`, `State`, `Utils`, and `Ctx` interfaces
3. **Document Your Plugin Types**: Add JSDoc comments to your plugin methods
4. **Provide Type Definitions**: Export interfaces for your plugin options
5. **Consider Return Types**: Make sure your plugin returns correctly typed objects
6. **Use Generics When Needed**: For plugins that work with specific data types

## See Also

- [register()](../core/register) - Register a plugin
- [Plugin Creation](./creation) - Creating custom plugins
- [Plugin Registration](./registration) - Registering plugins
- [Core Types](../types/core) - Core type definitions 