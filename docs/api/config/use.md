# use()

Composes configurations by applying another configuration to your current configuration.

## Syntax

```typescript
function use(otherConfig: Plugins.Config): Plugins.Config;
```

## Parameters

- `otherConfig`: Another configuration object created with `config()` that will be composed with this one

## Return Value

Returns the configuration object for chaining.

## Description

The `use()` method allows you to compose configurations together. This enables a modular approach to building your state configuration by combining smaller, focused configurations.

Unlike plugins (which are registered with the `register()` function), `use()` works with other configuration objects. It effectively merges the functionality defined in the other configuration into the current one.

This is particularly useful for:

- Organizing configuration by feature or domain
- Creating reusable configuration modules
- Combining configurations from different parts of your application

## Examples

### Basic Configuration Composition

```typescript
import { praxys, config } from 'praxys';

// Create base configuration for users
const userConfig = config();
userConfig.users.extend(({ node }) => ({
  add(user) {
    node.push(user);
  },
  remove(id) {
    const index = node.findIndex(u => u.id === id);
    if (index !== -1) {
      node.splice(index, 1);
    }
  }
}));

// Create configuration for products
const productConfig = config();
productConfig.products.extend(({ node }) => ({
  add(product) {
    node.push(product);
  },
  findById(id) {
    return node.find(p => p.id === id);
  }
}));

// Create main configuration and compose others
const mainConfig = config();
mainConfig.use(userConfig);
mainConfig.use(productConfig);

// Add app-level functionality
mainConfig.extend(({ node }) => ({
  reset() {
    node.users = [];
    node.products = [];
  }
}));

// Initialize store with composed configuration
const store = praxys({
  users: [],
  products: []
}, mainConfig);

// Use methods from all configurations
store.users.add({ id: 1, name: 'Alice' });
store.products.add({ id: 101, name: 'Widget', price: 19.99 });
console.log(store.products.findById(101)); // { id: 101, name: 'Widget', price: 19.99 }
store.reset(); // Clears both users and products
```

### Feature-Based Configuration

```typescript
import { praxys, config } from 'praxys';

// Configuration for authentication features
const authConfig = config();
authConfig.user.extend(({ node }) => ({
  login(credentials) {
    // Simulate login
    node.isLoggedIn = true;
    node.profile = { name: credentials.username, role: 'user' };
  },
  logout() {
    node.isLoggedIn = false;
    node.profile = null;
  },
  get isAuthenticated() {
    return node.isLoggedIn;
  }
}));

// Configuration for cart features
const cartConfig = config();
cartConfig.cart.extend(({ node }) => ({
  addItem(product, quantity = 1) {
    const existing = node.items.find(item => item.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      node.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity
      });
    }
    this.updateTotals();
  },
  updateTotals() {
    node.subtotal = node.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    );
    node.tax = node.subtotal * 0.1;
    node.total = node.subtotal + node.tax;
  }
}));

// Main app configuration
const appConfig = config();
appConfig.use(authConfig);
appConfig.use(cartConfig);

// Initialize store
const store = praxys({
  user: {
    isLoggedIn: false,
    profile: null
  },
  cart: {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  }
}, appConfig);

// Use composed functionality
store.user.login({ username: 'alice', password: 'secret' });
console.log(store.user.isAuthenticated); // true

const product = { id: 1, name: 'Widget', price: 19.99 };
store.cart.addItem(product, 2);
console.log(store.cart.total); // 43.98 (plus tax)
```

### Reusable Configuration Modules

```typescript
import { praxys, config } from 'praxys';

// Create a reusable timestamp configuration
const timestampConfig = config();
timestampConfig.target(({ state }) => 
  state && typeof state === 'object' && !Array.isArray(state)
)
.extend(({ node }) => ({
  updateTimestamp() {
    node.updatedAt = new Date().toISOString();
  }
}));

// Create a reusable list configuration
const listConfig = config();
listConfig.target(({ state }) => Array.isArray(state))
.extend(({ node }) => ({
  sortBy(field) {
    node.sort((a, b) => 
      a[field] < b[field] ? -1 : 
      a[field] > b[field] ? 1 : 0
    );
  },
  first() {
    return node[0] || null;
  },
  last() {
    return node.length ? node[node.length - 1] : null;
  }
}));

// Application configuration
const appConfig = config();
appConfig.use(timestampConfig);
appConfig.use(listConfig);

// Initialize with various data structures
const store = praxys({
  user: {
    name: 'Alice',
    updatedAt: new Date().toISOString()
  },
  products: [
    { id: 1, name: 'Widget', price: 19.99 },
    { id: 2, name: 'Gadget', price: 29.99 }
  ]
}, appConfig);

// Use shared functionality
store.user.name = 'Alicia';
store.user.updateTimestamp(); // Updates the timestamp

store.products.sortBy('price');
console.log(store.products.first().name); // "Widget" (cheapest)
console.log(store.products.last().name); // "Gadget" (most expensive)
```

## Type Safety

With TypeScript, you can ensure your composed configurations are type-safe:

```typescript
import { praxys, config, Config } from 'praxys';

interface User {
  id: number;
  name: string;
  isActive: boolean;
}

interface AppState {
  users: User[];
  settings: {
    theme: string;
    notifications: boolean;
  };
}

// Type-safe user configuration
const createUserConfig = (): Config => {
  const cfg = config();
  
  cfg.users.extend(({ node }: { node: User[] }) => ({
    add(user: User): void {
      node.push(user);
    },
    
    get active(): User[] {
      return node.filter(user => user.isActive);
    }
  }));
  
  return cfg;
};

// Type-safe settings configuration
const createSettingsConfig = (): Config => {
  const cfg = config();
  
  cfg.settings.extend(({ node }: { node: AppState['settings'] }) => ({
    toggleTheme(): void {
      node.theme = node.theme === 'light' ? 'dark' : 'light';
    }
  }));
  
  return cfg;
};

// Compose configurations
const mainConfig = config();
mainConfig.use(createUserConfig());
mainConfig.use(createSettingsConfig());

// Initialize with composed configuration
const store = praxys<AppState>({
  users: [],
  settings: { 
    theme: 'light',
    notifications: true
  }
}, mainConfig);

// Type-safe operations
store.users.add({ id: 1, name: 'Alice', isActive: true });
store.settings.toggleTheme();
``` 