# Config Patterns

Configuration is at the heart of Praxys. This guide explores configuration patterns with a focus on the targeting system that lets you apply functionality to specific parts of your state tree.

## Basic Configuration

Here's the basic configuration pattern:

```javascript
import { praxys, config } from 'praxys';

// Create configuration
const $ = config();

// Add functionality to the root
$.extend(({ node }) => ({
  someMethod() {
    // Do something with node
  }
}));

// Initialize with configuration
const state = praxys(initialState, $);
```

## Path Targeting

Praxys can target specific parts of your state tree for extension, allowing you to add functionality exactly where it's needed.

### Direct Path Targeting

The simplest form uses exact paths:

```javascript
// Target a specific property
$.users.extend(({ node }) => ({
  getActiveUsers() {
    return node.filter(user => user.active);
  }
}));

// Target a nested path
$.users[0].profile.extend(({ node }) => ({
  getFullName() {
    return `${node.firstName} ${node.lastName}`;
  }
}));
```

### Function-Based Targeting

For more flexibility, use function-based targeting with conditions:

```javascript
// Target all array items in the users array
$.target(({ path }) => path.match(/^\$\.users\[\d+\]$/))
  .extend(({ node }) => ({
    deactivate() {
      node.active = false;
    },
    
    activate() {
      node.active = true;
    }
  }));

// Target objects with specific properties
$.target(({ state }) => state && typeof state.price === 'number')
  .extend(({ node }) => ({
    get formattedPrice() {
      return `$${node.price.toFixed(2)}`;
    }
  }));
```

### Target Function Arguments

The target function receives:

- **`path`**: A JSON path string (like `$.users[0]`) representing the node's location
- **`state`**: The value at that location in the state tree

```javascript
// Target based on path and state properties
$.target(({ path, state }) => 
  path.match(/\[\d+\]$/) && state.type === 'premium'
)
.extend(/* ... */);
```

### Boolean Targeting

You can use a boolean value to conditionally apply configurations:

```javascript
// Check if we're running in a browser environment
const isClient = typeof window !== 'undefined';

// Configuration only applied in browser environments
$.target(isClient)
  .extend(({ node }) => ({
    saveToLocalStorage() {
      localStorage.setItem('data', JSON.stringify(node));
    }
  }));
```

### Pattern Matching with RegEx

Regular expressions are useful for targeting patterns:

```javascript
// Target all array items at any depth
$.target(({ path }) => path.match(/\[\d+\]$/))
  .extend(({ node, path }) => ({
    get index() {
      const match = path.match(/\[(\d+)\]$/);
      return match ? parseInt(match[1], 10) : -1;
    }
  }));
```

## Forward-Looking Targeting

Praxys's targeting is forward-looking - extensions are applied as soon as a matching path becomes available, even if it didn't exist when the configuration was created:

```javascript
// Initial state has no todos
const initialState = { user: { name: 'John' } };

// Configure todos even though they don't exist yet
$.todos.extend(({ node }) => ({
  addTodo(text) {
    node.push({ text, completed: false });
  }
}));

const state = praxys(initialState, $);

// Later, add the todos array
state.todos = [];

// Now we can use the method
state.todos.addTodo('Learn Praxys targeting');
```

When you configure a path or use targeting:

1. It applies immediately to any matching existing paths
2. It's automatically applied to new paths that match later
3. It continuously monitors the state tree for matches

## Multiple Configuration Layers

Configurations can be composed and layered:

```javascript
// Base configuration
const baseConfig = config();
baseConfig.extend(({ node }) => ({
  reset() {
    Object.assign(node, initialState);
  }
}));

// Feature-specific configuration
const userConfig = config();
userConfig.users.extend(({ node }) => ({
  getActiveUsers() {
    return node.filter(user => user.active);
  }
}));

// Combine configurations
const $ = config();
$.use(baseConfig).use(userConfig);

// Initialize with combined configuration
const state = praxys(initialState, $);
```

This approach lets you:
1. Modularize configuration into logical pieces
2. Create reusable configuration libraries
3. Apply conditional configuration based on runtime conditions

## Practical Example: Data Tables

Here's how targeting patterns can be used to configure data tables:

```javascript
const initialState = {
  tables: {
    users: {
      data: [
        { id: 1, name: 'Alice', role: 'Admin' },
        { id: 2, name: 'Bob', role: 'User' }
      ],
      pagination: { page: 1, pageSize: 10 },
      sorting: { column: 'name', direction: 'asc' },
      selection: []
    }
  }
};

const $ = config();

// Target all tables
$.target(({ path }) => path.match(/^\$\.tables\.[^.]+$/))
  .extend(({ node, path }) => {
    const tableName = path.split('.')[2];
    
    return {
      sort(column, direction = 'asc') {
        node.sorting = { column, direction };
      },
      
      setPage(page) {
        node.pagination.page = page;
      },
      
      get tableId() {
        return `table-${tableName}`;
      }
    };
  });

// Target individual data items
$.target(({ path }) => path.match(/^\$\.tables\.[^.]+\.data\[\d+\]$/))
  .extend(({ node, path }) => {
    const parts = path.split('.');
    const tableName = parts[2];
    
    return {
      select() {
        const table = this.$root.tables[tableName];
        if (!table.selection.includes(node.id)) {
          table.selection.push(node.id);
        }
      },
      
      get isSelected() {
        const table = this.$root.tables[tableName];
        return table.selection.includes(node.id);
      }
    };
  });

const appState = praxys(initialState, $);
```

## Using The Configured State

```javascript
// Get the users table
const usersTable = appState.tables.users;

// Sort by role
usersTable.sort('role');

// Select a user
usersTable.data[0].select();

// Get selected users
const selectedUsers = usersTable.data.filter(user => user.isSelected);
```

## What You've Learned

In this guide, you've learned:

1. **Direct Path Targeting** - Applying functionality to specific paths
2. **Function-Based Targeting** - Using conditions to determine where to apply extensions
3. **Regular Expression Patterns** - Using pattern matching for flexible targeting
4. **Forward-Looking Targeting** - Configuring behavior for state that doesn't exist yet
5. **Configuration Composition** - Combining multiple configuration layers
6. **Practical Applications** - Using targeting patterns for real-world components 