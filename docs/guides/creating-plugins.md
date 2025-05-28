# Creating Plugins

Plugins provide a powerful way to extend Praxys with reusable functionality. This guide demonstrates how to create, register, and use plugins through practical examples.

## Creating a Currency Formatter Plugin

Let's create a simple currency formatter plugin:

```typescript
import { register } from 'praxys';

function currency({ node, opts = {} }) {
  if (!opts.key) {
    throw new Error('currency plugin requires a key');
  }
  
  // Default options
  const currency = opts.currency || 'USD';
  const locale = opts.locale || 'en-US';
  const prop = `formatted${opts.key.charAt(0).toUpperCase() + opts.key.slice(1)}`;
  
  return {
    // Define a computed property with the name 'formatted{Key}'
    get [prop]() {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(node[opts.key]);
    }
  };
}

// Register the plugin
register('formatCurrency', currency);
```

This plugin:
1. Takes a `key` option to specify which property to format
2. Creates a computed property named `formatted{Key}` (e.g., `formattedPrice`)
3. Returns the formatted value when the property is accessed

## Creating a Date Formatter Plugin

Similarly, here's a date formatter plugin:

```typescript
function dateFormat({ node, opts = {} }) {
  if (!opts.key) {
    throw new Error('dateFormat plugin requires a key');
  }
  
  const locale = opts.locale || 'en-US';
  const dateStyle = opts.dateStyle || 'medium';
  const prop = `formatted${opts.key.charAt(0).toUpperCase() + opts.key.slice(1)}`;
  
  return {
    get [prop]() {
      const value = node[opts.key];
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(locale, {
        dateStyle: dateStyle
      }).format(date);
    }
  };
}

// Register the plugin
register('formatDate', dateFormat);
```

## Using Plugins

Once registered, plugins can be used in your configuration:

> **Important:** Remember to import your plugin files so the registration code runs! If you define plugins in separate files, you must import them before using them in your configuration.

```javascript
import { praxys, config } from 'praxys';
// Import your plugin files to ensure registration happens
import './plugins/formatters'; // This file contains the register() calls

// Create configuration
const $ = config();

// Initial state
const initialState = {
  products: [
    { 
      id: 1,
      name: 'Laptop Pro', 
      price: 1299.99, 
      releaseDate: '2023-06-15'
    },
    { 
      id: 2,
      name: 'Smartphone X', 
      price: 899.5, 
      releaseDate: '2023-08-22'
    }
  ]
};

// Apply formatters to each product
$.target(({path, state}) => path.match(/^\$\.products\[\d+\]$/))
  .formatCurrency({
    key: 'price',
    currency: 'USD'
  })
  .formatDate({
    key: 'releaseDate',
    dateStyle: 'medium'
  });

// Initialize Praxys
const catalog = praxys(initialState, $);

// Access the formatted values
catalog.products.forEach(product => {
  console.log(`${product.name}: ${product.formattedPrice}`);
  console.log(`Released: ${product.formattedReleaseDate}`);
});
```

> **Note:** The target function receives `path` and `state` parameters, where `state` represents the current node value being evaluated. This is consistent across all Praxys targeting functions.

## Adding Type Safety

If you're using TypeScript, add type definitions for your plugins:

```typescript
// Extend the global Config interface for your plugins
declare global {
  namespace Plugins {
    interface Config {
      formatCurrency(opts: {
        key: string;
        currency?: string;
        locale?: string;
      }): Plugins.Config;
      
      formatDate(opts: {
        key: string;
        locale?: string;
        dateStyle?: 'full' | 'long' | 'medium' | 'short';
      }): Plugins.Config;
    }
  }
}

// Export interfaces for properties your plugin adds
export interface Node {
  formattedPrice?: string;
  formattedReleaseDate?: string;
  // Add all properties your plugin might add
}

// Export other interfaces as needed
export interface State extends Node {}
export interface Utils {}
export interface Ctx {}
```

Consumers of your plugin can then use these types:

```typescript
// Import the plugin interfaces
import { Node as FormatterNode } from 'formatter-plugin';

// Product data type
interface Product {
  id: number;
  name: string;
  price: number;
  releaseDate: string;
}

// Extend with plugin properties
type ProductWithFormatting = Product & FormatterNode;

// Application state
interface AppState {
  products: ProductWithFormatting[];
}

// Type-safe initialization
const initialState: AppState = {
  products: [/* ... */]
};
const catalog = praxys(initialState, $);

// Type-safe access with autocompletion
console.log(catalog.products[0].formattedPrice);
```

## Complete Example

Here's a minimal working example:

```html
<div id="product-container"></div>

<script type="module">
  import { praxys, config, register } from 'praxys';
  
  // Define and register the formatter plugins
  // (currency and dateFormat implementations from above)
  register('formatCurrency', currency);
  register('formatDate', dateFormat);
  
  // Create configuration
  const $ = config();
  
  // Initial state
  const initialState = {
    products: [
      { 
        id: 1,
        name: 'Laptop Pro', 
        price: 1299.99, 
        releaseDate: '2023-06-15'
      },
      { 
        id: 2,
        name: 'Smartphone X', 
        price: 899.5, 
        releaseDate: '2023-08-22'
      }
    ]
  };
  
  // Apply formatters
  $.target(({path}) => path.match(/^\$\.products\[\d+\]$/))
    .formatCurrency({ key: 'price' })
    .formatDate({ key: 'releaseDate' });
  
  // Initialize Praxys
  const catalog = praxys(initialState, $);
  
  // Render products
  const container = document.getElementById('product-container');
  catalog.products.forEach(product => {
    container.innerHTML += `
      <div class="product">
        <h3>${product.name}</h3>
        <div>${product.formattedPrice}</div>
        <div>Released: ${product.formattedReleaseDate}</div>
      </div>
    `;
  });
</script>
```

## What You've Learned

In this guide, you've learned:

1. **Creating Plugins** - Building reusable functionality that can be shared
2. **Computed Properties** - Using getters to create reactive values
3. **Dynamic Property Names** - Using computed property names based on options
4. **Targeted Configuration** - Applying plugins to specific parts of the state tree
5. **Type Safety** - Adding TypeScript definitions for better developer experience

Congratulations! You've created your first Praxys plugins.
