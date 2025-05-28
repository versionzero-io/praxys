# config()

Creates a configuration object that can be used to define extensions and behavior for a Praxys store.

## Syntax

```typescript
function config(): Config;
```

## Parameters

None.

## Return Value

Returns a configuration object with the following properties and methods:

- **Property Access**: Access properties to target specific paths (e.g., `$.users`)
- **Array Access**: Access array indices to target specific items (e.g., `$.users[0]`)
- **Methods**:
  - `extend()`: Add functionality to the current path
  - `target()`: Target specific parts of the state tree
  - `use()`: Compose with other configurations
- **Registered Plugins**: Any plugins registered via `register()` are available as methods on the configuration object

## Description

The `config()` function creates a configuration object that defines how your Praxys state behaves. It's the foundation of Praxys's declarative API, allowing you to:

1. **Target specific parts** of your state tree using property access notation
2. **Add methods and computed properties** to those parts using `extend()`
3. **Select nodes conditionally** using `target()`
4. **Compose configurations** using `use()`

The configuration object is typically assigned to a variable named `$` by convention, representing the root of your state tree. You navigate through the state tree using familiar property and array access notation.

## Examples

### Basic Configuration

```typescript
import { config, praxys } from 'praxys';

// Create a configuration object
const $ = config();

// Add methods to the root level
$.extend(({ node }) => ({
  reset() {
    Object.assign(node, { count: 0, message: '' });
  },
  get isEmpty() {
    return Object.keys(node).length === 0;
  }
}));

// Add methods to a specific property
$.count.extend(({ node }) => ({
  increment(amount = 1) {
    return node + amount;  // node refers to the count value directly
  },
  decrement(amount = 1) {
    return node - amount;
  }
}));

// Create a store with the configuration
const store = praxys({
  count: 0,
  message: ''
}, $);

// Use the configured methods
store.reset();
store.count = store.count.increment(5); // Sets count to 5
console.log(store.isEmpty); // false
```

### Nested Configuration

```typescript
import { config, praxys } from 'praxys';

const $ = config();

// Configure the todos array
$.todos.extend(({ node }) => ({
  // Add methods to the todos array
  addTodo(text) {
    node.push({
      id: Date.now(),
      text,
      completed: false
    });
  },
  
  // Add computed properties
  get active() {
    return node.filter(todo => !todo.completed);
  },
  
  get completed() {
    return node.filter(todo => todo.completed);
  },
  
  get stats() {
    return {
      total: node.length,
      active: this.active.length,
      completed: this.completed.length
    };
  }
}));

// Configure individual todo items
$.todos[].extend(({ node }) => ({
  toggle() {
    node.completed = !node.completed;
  },
  
  get isOverdue() {
    return node.dueDate && new Date(node.dueDate) < new Date();
  }
}));

// Create store with the configuration
const store = praxys({
  todos: []
}, $);

// Use the configured methods
store.todos.addTodo('Learn Praxys');
store.todos[0].toggle(); // Mark as completed
console.log(store.todos.stats); // { total: 1, active: 0, completed: 1 }
```

### Using Target

```typescript
import { config, praxys } from 'praxys';

const $ = config();

// Target all objects with a 'price' property
$.target(({ state }) => typeof state === 'object' && 'price' in state)
  .extend(({ node }) => ({
    applyDiscount(percent) {
      node.price = node.price * (1 - percent / 100);
    },
    
    get priceWithTax() {
      return node.price * 1.08; // 8% tax
    }
  }));

// Target arrays with numeric values
$.target(({ state, path }) => 
  Array.isArray(state) && 
  state.every(item => typeof item === 'number')
)
  .extend(({ node }) => ({
    sum() {
      return node.reduce((total, n) => total + n, 0);
    },
    
    average() {
      return this.sum() / node.length || 0;
    }
  }));

// Create store with various data
const store = praxys({
  products: [
    { name: 'Laptop', price: 1000 },
    { name: 'Phone', price: 800 }
  ],
  cart: {
    items: [
      { product: 'Laptop', price: 1000, quantity: 1 }
    ],
    price: 1000
  },
  metrics: [10, 20, 30, 40]
}, $);

// Methods are available where they match the target conditions
store.products[0].applyDiscount(10); // Laptop price is now 900
console.log(store.cart.priceWithTax); // 1080
console.log(store.metrics.sum()); // 100
console.log(store.metrics.average()); // 25
```

### Using Registered Plugins

```typescript
import { config, register, praxys } from 'praxys';

// Register a plugin
register('formatDate', ({ node, opts = {} }) => {
  const format = opts.format || 'short';
  const key = opts.key || 'date';
  
  return {
    get formattedDate() {
      return new Intl.DateTimeFormat('en-US', { 
        dateStyle: format 
      }).format(new Date(node[key]));
    }
  };
});

// Create configuration
const $ = config();

// Use the registered plugin
$.users.formatDate({
  key: 'createdAt',
  format: 'medium'
});

// Chain plugins with other configuration methods
$.products.target(({ state }) => state.price > 100)
  .formatDate({ key: 'releaseDate' })
  .extend(({ node }) => ({
    applyDiscount(percent) {
      node.price *= (1 - percent/100);
    }
  }));

// Initialize state with the configuration
const store = praxys({
  users: [{ id: 1, name: 'John', createdAt: '2023-06-15' }],
  products: [
    { id: 1, name: 'Budget Item', price: 50, releaseDate: '2023-01-10' },
    { id: 2, name: 'Premium Item', price: 150, releaseDate: '2023-05-20' }
  ]
}, $);

// Use the configured properties and methods
console.log(store.users[0].formattedDate); // "Jun 15, 2023"
console.log(store.products[1].formattedDate); // "May 20, 2023"
store.products[1].applyDiscount(10); // Reduces price to 135
```

## See Also

- [praxys()](./praxys) - Create a reactive state store
- [extend()](../config/extend) - Add functionality to state
- [target()](../config/target) - Target specific parts of state
- [use()](../config/use) - Compose configurations 