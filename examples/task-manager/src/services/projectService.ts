import { EnhancedProject, Project, Task } from '../types';
import { taskStore } from '../store';

/**
 * Project service for handling project-related operations
 */
export class ProjectService {
  /**
   * Get all projects with their statistics
   */
  static getAllProjects(): EnhancedProject[] {
    return taskStore.projects.map(project => {
      // Calculate project stats manually since we don't have direct access
      // to the computed method from the store outside
      const projectTasks = taskStore.tasks.filter(task => task.projectId === project.id);
      const totalCount = projectTasks.length;
      const completedCount = projectTasks.filter(task => task.completed).length;
      const pendingCount = totalCount - completedCount;
      const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
      
      return {
        ...project,
        taskCount: totalCount,
        completedTaskCount: completedCount,
        pendingTaskCount: pendingCount,
        completionRate
      };
    });
  }
  
  /**
   * Create a new project
   */
  static createProject(name: string): void {
    if (!name.trim()) {
      throw new Error('Project name cannot be empty');
    }
    
    // Manually add project
    (taskStore.projects as Project[]).push({
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString()
    });
  }
  
  /**
   * Delete a project and its tasks
   */
  static deleteProject(id: string): void {
    // Check if there are tasks associated with this project
    const hasTasks = taskStore.tasks.some(task => task.projectId === id);
    
    // Use batch to make all changes in one update
    taskStore.batch(() => {
      // Remove all tasks associated with this project
      if (hasTasks) {
        // Find indexes of tasks to remove
        const taskIndexes: number[] = [];
        for (let i = 0; i < taskStore.tasks.length; i++) {
          if (taskStore.tasks[i].projectId === id) {
            taskIndexes.unshift(i); // Add to front for reverse removal
          }
        }
        
        // Remove tasks in reverse order
        for (const index of taskIndexes) {
          (taskStore.tasks as Task[]).splice(index, 1);
        }
      }
      
      // Find project index
      const projectIndex = taskStore.projects.findIndex(project => project.id === id);
      if (projectIndex !== -1) {
        // Remove the project
        (taskStore.projects as Project[]).splice(projectIndex, 1);
      }
      
      // If this was the current project, reset the current project
      if (taskStore.currentProjectId === id) {
        taskStore.currentProjectId = null;
      }
    });
  }
  
  /**
   * Set the current active project
   */
  static setCurrentProject(id: string | null): void {
    taskStore.currentProjectId = id;
  }
  
  /**
   * Get the current active project
   */
  static getCurrentProject(): Project | null {
    if (!taskStore.currentProjectId) return null;
    return taskStore.projects.find(project => project.id === taskStore.currentProjectId) || null;
  }
  
  /**
   * Get project statistics
   */
  static getProjectStats(id: string): {
    taskCount: number;
    completedTaskCount: number;
    pendingTaskCount: number;
    completionRate: number;
  } {
    const projectTasks = taskStore.tasks.filter(task => task.projectId === id);
    const totalCount = projectTasks.length;
    const completedCount = projectTasks.filter(task => task.completed).length;
    const pendingCount = totalCount - completedCount;
    const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    
    return {
      taskCount: totalCount,
      completedTaskCount: completedCount,
      pendingTaskCount: pendingCount,
      completionRate
    };
  }
} 