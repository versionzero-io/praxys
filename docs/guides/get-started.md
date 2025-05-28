# Getting Started with Praxys

Welcome to Praxys, a lightweight, reactive state management library. This guide will help you build a practical todo list application that demonstrates Praxys's key features.

By the end of this guide, you'll understand how to:
- Create reactive state
- Define behavior with declarative configuration
- Connect your state to a user interface

## Installation

```bash
npm install @versionzero-io/praxys
```

## Define State

Let's start by defining the state structure for our todo application:

```javascript
import { praxys, config } from 'praxys';

// Define the initial state structure
const initialState = {
  todos: [
    { id: 1, text: 'Learn Praxys', completed: false },
    { id: 2, text: 'Build a todo app', completed: false }
  ],
  filter: 'all' // Default filter: 'all', 'active', or 'completed'
};
```

## Create Configuration

Now, let's create a configuration that defines the functionality:

```javascript
// Create configuration
const $ = config();

// Add methods to the todos array
$.todos.extend(({ node }) => ({
  // Add a new todo
  addTodo(text) {
    if (!text.trim()) return;
    
    node.push({
      id: Date.now(),
      text: text.trim(),
      completed: false
    });
  },
  
  // Remove a todo by ID
  removeTodo(id) {
    const index = node.findIndex(todo => todo.id === id);
    if (index !== -1) {
      node.splice(index, 1);
    }
  },
  
  // Toggle completion status
  toggleTodo(id) {
    const todo = node.find(todo => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  },
  
  // Clear all completed todos
  clearCompleted() {
    for (let i = node.length - 1; i >= 0; i--) {
      if (node[i].completed) {
        node.splice(i, 1);
      }
    }
  },
  
  // Computed properties for statistics
  get completedCount() {
    return node.filter(todo => todo.completed).length;
  },
  
  get activeCount() {
    return node.length - this.completedCount;
  }
}));

// Add filter functionality
$.extend(({ node }) => ({
  // Filtered todos based on current filter
  get filteredTodos() {
    switch (node.filter) {
      case 'active':
        return node.todos.filter(todo => !todo.completed);
      case 'completed':
        return node.todos.filter(todo => todo.completed);
      default:
        return node.todos;
    }
  },
  
  // Set active filter
  setFilter(filter) {
    node.filter = filter;
  }
}));

// Add methods to individual todos
$.target(({ path }) => path.match(/^\$\.todos\[\d+\]$/))
  .extend(({ node }) => ({
    // Toggle completion status
    toggle() {
      node.completed = !node.completed;
    }
  }));
```

## Create Praxys Instance

Now let's create our reactive todo app by combining the state and configuration:

```javascript
// Create our todo app
const todoApp = praxys(initialState, $);
```

## Using Your Todo App

Let's see how to use our configured todo app:

```javascript
// Add a new todo
todoApp.todos.addTodo('Complete the tutorial');

// Toggle a todo's completion status
todoApp.todos.toggleTodo(1);

// Get statistics
console.log(`Active: ${todoApp.todos.activeCount}`);
console.log(`Completed: ${todoApp.todos.completedCount}`);

// Filter todos
todoApp.setFilter('active');
console.log('Active todos:', todoApp.filteredTodos);

// Using methods on individual todos
const firstTodo = todoApp.todos[0];
firstTodo.toggle();
```

## Reactive UI

To integrate with a user interface, use the `watch` method:

```javascript
// Watch for changes to render the UI
todoApp.watch(() => {
  // Update DOM with current state
  renderTodoList(todoApp.filteredTodos);
  updateTodoCount(todoApp.todos.activeCount);
});

function renderTodoList(todos) {
  const todoList = document.getElementById('todo-list');
  todoList.innerHTML = '';
  
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = todo.completed ? 'completed' : '';
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => {
      todoApp.todos.toggleTodo(todo.id);
    });
    
    // Create text element
    const span = document.createElement('span');
    span.textContent = todo.text;
    
    // Add elements to list item
    li.appendChild(checkbox);
    li.appendChild(span);
    todoList.appendChild(li);
  });
}

function updateTodoCount(count) {
  document.getElementById('todo-count').textContent = 
    `${count} item${count !== 1 ? 's' : ''} left`;
}
```

## What You've Learned

In this guide, you've learned:

1. **Creating Reactive State** - Building a responsive data model
2. **Declarative Configuration** - Defining behavior through configuration
3. **Computed Properties** - Adding derived state that updates automatically
4. **Path Targeting** - Applying functionality to specific parts of your state
5. **Reactive UI** - Connecting state changes to UI updates
