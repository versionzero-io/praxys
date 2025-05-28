# API Reference

This section provides detailed documentation for the Praxys API. Use this reference to understand the available functions, methods, and types in the Praxys library.

## Overview

Praxys provides several core functions for creating and configuring reactive state:

- [praxys()](./core/praxys) - Create a reactive state store
- [config()](./core/config) - Create a configuration object
- [register()](./core/register) - Register a plugin

## Reactivity

These methods are available on store instances and manage reactivity:

- [watch()](./reactivity/watch) - Set up a reactive watcher
- [batch()](./reactivity/batch) - Batch multiple updates
- [ignore()](./reactivity/ignore) - Temporarily suspend reactivity

## Configuration

These methods are available on configuration objects:

- [extend()](./config/extend) - Add functionality to state
- [target()](./config/target) - Target specific parts of state
- [use()](./config/use) - Compose configurations

## Plugin System

Learn how to create and use plugins:

- [Plugin Creation](./plugins/creation) - Creating custom plugins
- [Plugin Registration](./plugins/registration) - Registering plugins
- [Plugin Types](./plugins/types) - Type definitions for plugins

## Types

TypeScript type definitions:

- [`Ref<T>`](./types/ref) - Non-reactive property type
- [Core Types](./types/core) - Core type definitions 