---
layout: home

hero:
  name: "Praxys"
  text: "Data Made Practical"
  tagline: Compose reactive state with declarative configuration and a plugin system
  actions:
    - theme: brand
      text: Get Started
      link: /guides/get-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/versionzero-io/praxys

features:
  - icon: 📝
    title: Declarative Configuration
    details: Define your state's behavior using a clear, composable configuration system
  - icon: 🧩
    title: Extensible Plugin Architecture
    details: Enhance functionality with plugins that cleanly separate concerns and promote reusability
  - icon: 🔄
    title: Fine-grained Reactivity
    details: Automatically track dependencies and trigger updates only when relevant data changes
  - icon: ⚡
    title: Lightweight & Framework-Agnostic
    details: Small bundle size with zero dependencies, works with any UI framework

---

## Why Praxys?

Praxys offers a fresh approach to state management by combining three concepts: declarative configuration, fine-grained reactivity, and a flexible extension system. By defining your state's behavior upfront, you gain clarity and organization in your codebase. This approach can make your application easier to reason about and easier to test — especially as your application grows.

## Installation

```bash
npm install @versionzero-io/praxys
```

## Example: Declarative Counter

```html
<!-- index.html -->
<div>
  <p>Count: <span id="count">0</span></p>
  <p>Status: <span id="status">Zero or negative</span></p>
  <button id="increment">Increment</button>
  <button id="decrement">Decrement</button>
</div>

<script type="module">
  import { praxys, config } from '@versionzero-io/praxys';
  // You could import these functions from a separate file
  // import { counterActions, counterStats } from './counter-functions.js';

  // counter-functions.js - Define reusable counter functionality
  function counterActions({ node }) {
    return {
      increment() { 
        node.count++; 
      },
      decrement() { 
        node.count--; 
      }
    };
  }

  function counterStats({ node }) {
    return {
      get isPositive() { 
        return node.count > 0; 
      }
    };
  }

  // counter-store.js - Create and configure the counter store
  const initialState = { count: 0 };
  
  // Create configuration
  const $ = config();
  
  // Compose functionality
  $.extend(counterActions)
    .extend(counterStats);

  // Create reactive state
  const counter = praxys(initialState, $);

  // main.js - Connect UI to the state
  document.getElementById('increment').onclick = () => counter.increment();
  document.getElementById('decrement').onclick = () => counter.decrement();

  // Automatically react to changes
  counter.watch(() => {
    document.getElementById('count').textContent = counter.count;
    document.getElementById('status').textContent = 
      counter.isPositive ? 'Positive' : 'Zero or negative';
  });
</script>

Ready to learn more? Check out our [Get Started](/guides/get-started) guide for a more comprehensive look at Praxys, or jump to the [Cheat Sheet](/cheat-sheet) for a complete reference.