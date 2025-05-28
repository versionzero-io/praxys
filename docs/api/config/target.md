# target()

Targets specific parts of your state tree based on patterns or conditions for applying extensions.

## Syntax

```typescript
function target(
  pattern: ({ path, state }) => boolean | boolean
): Config;
```

## Parameters

- `pattern`: Either a function that returns a boolean, or a boolean value:
  - **Function**: Takes an object with `path` (string) and `state` (any) properties and returns `true` if the node should be targeted, `false` otherwise
  - **Boolean**: If provided directly, applies the extension when the value is `true`

## Return Value

Returns the configuration object for chaining.

## Description

The `target()` method provides a powerful way to apply extensions to parts of your state tree that match specific criteria. Instead of explicitly specifying paths, you can define patterns or conditions that determine where extensions should be applied.

This is particularly useful for:

- Applying consistent behavior to similar objects throughout your state tree
- Targeting nodes with specific properties or values
- Handling dynamic parts of your state tree that may not exist when you create the configuration

When using `target()` with a function pattern, Praxys traverses the state tree and evaluates your function for each node. If your function returns `true`, the extensions are applied to that node.

## Examples

### Targeting Based on Path Pattern

```typescript
import { praxys, config } from 'praxys';

// Create configuration
const $ = config();

// Target all array items in the users array
$.target(({ path }) => path.match(/^\$\.users\[\d+\]$/))
  .extend(({ node }) => ({
    activate() {
      node.active = true;
    },
    
    deactivate() {
      node.active = false;
    },
    
    get isActive() {
      return !!node.active;
    }
  }));

// Initialize with users array
const store = praxys({
  users: [
    { id: 1, name: 'Alice', active: false },
    { id: 2, name: 'Bob', active: true }
  ]
});

// Methods are available on each user object
store.users[0].activate();
console.log(store.users[0].isActive); // true
console.log(store.users[1].isActive); // true
```

### Targeting Based on Node Properties

```typescript
// Target all objects with a price property
$.target(({ state }) => state && typeof state.price === 'number')
  .extend(({ node }) => ({
    get formattedPrice() {
      return `$${node.price.toFixed(2)}`;
    },
    
    applyDiscount(percent) {
      node.price = node.price * (1 - percent / 100);
    }
  }));

// Initialize with various objects that have price properties
const store = praxys({
  products: [
    { id: 1, name: 'Widget', price: 19.99 },
    { id: 2, name: 'Gadget', price: 49.95 }
  ],
  cart: {
    items: [
      { productId: 1, quantity: 2, price: 19.99 }
    ],
    shipping: { standard: { price: 5.99 }, express: { price: 12.99 } }
  }
});

// All price-containing objects have the extension methods
console.log(store.products[0].formattedPrice); // "$19.99"
store.cart.items[0].applyDiscount(10);
console.log(store.cart.items[0].price); // 17.99
console.log(store.cart.shipping.express.formattedPrice); // "$12.99"
```

### Conditional Targeting with Boolean Value

```typescript
// Feature flag for enabling debug features
const isDev = process.env.NODE_ENV === 'development';

// Only apply debug extensions in development mode
$.target(isDev)
  .extend(({ node, state }) => ({
    debug() {
      console.log('Current node:', node);
      console.log('Full state:', state);
    },
    
    logChanges() {
      // Set up change logging
    }
  }));

// Initialize store
const store = praxys({ /* ... */ }, $);

// In development mode, debug methods are available
if (isDev) {
  store.debug();
}
```

### Complex Targeting Conditions

```typescript
// Target active products with a price over $100
$.target(({ state, path }) => {
  // Only target product objects
  if (!path.includes('products')) return false;
  
  // Check that it's an object with required properties
  if (!state || typeof state !== 'object') return false;
  
  // Apply specific business rules
  return state.active === true && 
         typeof state.price === 'number' && 
         state.price > 100;
})
.extend(({ node }) => ({
  get isPremium() {
    return true;
  },
  
  applyPremiumDiscount() {
    node.price *= 0.85; // 15% off
  }
}));
```

## Optimistic Targeting

One powerful feature of Praxys's targeting system is its optimistic nature. Extensions are applied to:

1. Existing nodes that match the targeting criteria when the configuration is created
2. New nodes that are added later and match the criteria
3. Nodes that are modified to match the criteria after initially not matching

This means you can configure behavior for parts of your state tree that don't even exist yet.

```typescript
// Initialize with empty state
const store = praxys({}, $);

// Add users array later - extensions are automatically applied
store.users = [
  { id: 1, name: 'Alice', active: false }
];

// The previously configured methods now work
store.users[0].activate();
console.log(store.users[0].isActive); // true
```

## Type Safety

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

// Type-safe targeting
$.target(({ state }: { state: any, path: string }) => 
  state && 
  typeof state.price === 'number' && 
  state.active === true
)
.extend(({ node }: { node: Product }) => ({
  applyDiscount(percent: number): void {
    node.price = node.price * (1 - percent / 100);
  }
}));
``` 