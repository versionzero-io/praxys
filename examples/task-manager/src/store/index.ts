import '../plugins'; // Import plugins first to ensure they're registered
import { praxys } from '../../../../src/index';
import { AppState, Project, Task } from '../types';
import { createConfig } from './config';

/**
 * Define initial state
 */
const initialState: AppState = {
  tasks: [
    {
      id: '1',
      title: 'Create project documentation',
      completed: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      priority: 'high',
      projectId: 'work'
    },
    {
      id: '2',
      title: 'Complete the task manager example',
      completed: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      priority: 'high',
      projectId: 'work'
    },
    {
      id: '3',
      title: 'Fix UI styling issues',
      completed: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      priority: 'medium',
      projectId: 'work'
    },
    {
      id: '4',
      title: 'Buy groceries',
      completed: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      priority: 'medium',
      projectId: 'personal'
    },
    {
      id: '5',
      title: 'Go to the gym',
      completed: true,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      priority: 'low',
      projectId: 'personal'
    },
    {
      id: '6',
      title: 'Plan weekend trip',
      completed: false,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      priority: 'low',
      projectId: 'personal'
    }
  ],
  projects: [
    {
      id: 'work',
      name: 'Work',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    },
    {
      id: 'personal',
      name: 'Personal',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
    }
  ],
  currentProjectId: null
};

/**
 * Create a typed store instance
 */
export function createStore() {
  // Create configuration
  const $ = createConfig();
  
  // Initialize and return the store
  return praxys<AppState>(initialState, $);
}

// Export a singleton instance of the store
export const taskStore = createStore(); 