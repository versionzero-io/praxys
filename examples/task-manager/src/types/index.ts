/**
 * Task priority level
 */
export type PriorityLevel = 'low' | 'medium' | 'high';

/**
 * Task model
 */
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  priority: PriorityLevel;
  projectId: string;
}

/**
 * Project model
 */
export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Application state
 */
export interface AppState {
  tasks: Task[];
  projects: Project[];
  currentProjectId: string | null;
}

/**
 * Enhanced Task with computed properties
 */
export interface EnhancedTask extends Task {
  formattedCreatedAt: string;
  formattedCompletedAt?: string;
  isOverdue?: boolean;
}

/**
 * Enhanced Project with computed properties
 */
export interface EnhancedProject extends Project {
  taskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  completionRate: number;
} 