import { Task, PriorityLevel } from '../types';
import { taskStore } from '../store';

/**
 * Task service for handling task-related operations
 */
export class TaskService {
  /**
   * Create a new task
   */
  static createTask(title: string, priority: PriorityLevel = 'medium', projectId?: string): void {
    if (!title.trim()) {
      throw new Error('Task title cannot be empty');
    }
    
    // Use the current project ID if not specified, fallback to 'default'
    const targetProjectId = projectId || taskStore.currentProjectId || 'default';
    
    // Add task to store
    (taskStore.tasks as Task[]).push({
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      priority,
      projectId: targetProjectId
    });
  }
  
  /**
   * Delete a task by ID
   */
  static deleteTask(id: string): void {
    const index = taskStore.tasks.findIndex(task => task.id === id);
    if (index !== -1) {
      (taskStore.tasks as Task[]).splice(index, 1);
    }
  }
  
  /**
   * Toggle task completion status
   */
  static toggleTask(id: string): void {
    const task = taskStore.tasks.find(task => task.id === id);
    if (task) {
      // Use batch to group operations
      taskStore.batch(() => {
        task.completed = !task.completed;
        
        // Update completedAt date
        if (task.completed) {
          task.completedAt = new Date().toISOString();
        } else {
          delete task.completedAt;
        }
      });
    }
  }
  
  /**
   * Update task priority
   */
  static updatePriority(id: string, priority: PriorityLevel): void {
    const task = taskStore.tasks.find(task => task.id === id);
    if (task) {
      task.priority = priority;
    }
  }
  
  /**
   * Update task title
   */
  static updateTitle(id: string, title: string): void {
    if (!title.trim()) {
      throw new Error('Task title cannot be empty');
    }
    
    const task = taskStore.tasks.find(task => task.id === id);
    if (task) {
      task.title = title.trim();
    }
  }
  
  /**
   * Get tasks for a specific project
   */
  static getTasksByProject(projectId: string): Task[] {
    return taskStore.tasks.filter(task => task.projectId === projectId);
  }
  
  /**
   * Get tasks for the current project
   */
  static getCurrentProjectTasks(): Task[] {
    return taskStore.currentProjectId 
      ? this.getTasksByProject(taskStore.currentProjectId)
      : taskStore.tasks;
  }
  
  /**
   * Get completed tasks
   */
  static getCompletedTasks(): Task[] {
    return taskStore.tasks.filter(task => task.completed);
  }
  
  /**
   * Get active (incomplete) tasks
   */
  static getActiveTasks(): Task[] {
    return taskStore.tasks.filter(task => !task.completed);
  }
} 