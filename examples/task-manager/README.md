# Praxys Task Manager Example

This example demonstrates a comprehensive use case for the Praxys state management library, implementing a task manager application with projects, tasks, and various reactive features.

## Features Demonstrated

- **Typed Configuration**: Using TypeScript to define state and behavior
- **Reactive State**: Automatic UI updates when state changes
- **Custom Plugins**: Date formatting and validation plugins
- **Extension System**: Adding methods to state nodes
- **Path Targeting**: Applying plugins to specific nodes in the state tree
- **Batch Operations**: Grouping multiple state changes into single updates
- **Watch API**: Subscribing to state changes

## Project Structure

- `src/types`: TypeScript interfaces and types
- `src/plugins`: Custom plugins for formatting and validation
- `src/store`: Store configuration and initialization
- `src/services`: Service layer for business logic
- `src/main.ts`: Application entry point and UI interaction

## Key Concepts

### 1. Store Configuration

The example uses a hierarchical configuration approach to define behavior for different parts of the state:

```typescript
// Root level configuration
$.extend(({ node }) => ({
  setCurrentProject(projectId: string | null) {
    node.currentProjectId = projectId;
  }
}));

// Array-specific configuration
$.tasks.extend(({ node, state }) => ({
  addTask(title: string, priority: PriorityLevel = 'medium') {
    // Implementation
  }
}));
```

### 2. Plugin System

Custom plugins are registered and applied to specific parts of the state:

```typescript
// Register plugins
register('formatDate', formatDate);
register('validate', validate);

// Apply plugins using path targeting
$.target((context) => context.path.match(/^\$\.tasks\[\d+\]$/))
  .formatDate({
    key: 'createdAt',
    dateStyle: 'medium'
  });
```

### 3. Reactive UI

The UI automatically updates when the state changes:

```typescript
// Subscribe to state changes
taskStore.watch(() => {
  renderProjects();
  renderTasks();
  updateProjectTitle();
});
```

## Running the Example

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. Open the task manager example in your browser 