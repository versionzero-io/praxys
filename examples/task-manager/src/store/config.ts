import { config } from '../../../../src/index';
import { PriorityLevel } from '../types';

/**
 * Create task-specific configuration
 */
function createTaskConfig() {
  const taskConfig = config();
  
  // Configuration for tasks array
  taskConfig.tasks.extend(({ node, state }) => ({
    /**
     * Add a new task
     */
    addTask(title: string, priority: PriorityLevel = 'medium', projectId: string | null = null) {
      if (!title.trim()) return;
      
      // Use current project ID if not specified
      const taskProjectId = projectId || state.root.currentProjectId || 'default';
      
      node.push({
        id: crypto.randomUUID(),
        title: title.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        priority,
        projectId: taskProjectId
      });
    },
    
    /**
     * Remove a task by ID
     */
    removeTask(id: string) {
      const index = node.findIndex(task => task.id === id);
      if (index !== -1) {
        node.splice(index, 1);
      }
    },
    
    /**
     * Toggle task completion status
     */
    toggleTask(id: string) {
      const task = node.find(task => task.id === id);
      if (task) {
        task.completed = !task.completed;
        
        // Update completedAt date
        if (task.completed) {
          task.completedAt = new Date().toISOString();
        } else {
          delete task.completedAt;
        }
      }
    },
    
    /**
     * Update task priority
     */
    updatePriority(id: string, priority: PriorityLevel) {
      const task = node.find(task => task.id === id);
      if (task) {
        task.priority = priority;
      }
    },
    
    /**
     * Update task title
     */
    updateTitle(id: string, title: string) {
      if (!title.trim()) return;
      
      const task = node.find(task => task.id === id);
      if (task) {
        task.title = title.trim();
      }
    },
    
    /**
     * Get tasks for current project
     */
    get currentProjectTasks() {
      const currentProjectId = state.root.currentProjectId;
      
      // Return all tasks if no project is selected
      if (!currentProjectId) return node;
      
      // Return tasks for the current project
      return node.filter(task => task.projectId === currentProjectId);
    },
    
    /**
     * Get total number of tasks
     */
    get totalCount() {
      return node.length;
    },
    
    /**
     * Get number of completed tasks
     */
    get completedCount() {
      return node.filter(task => task.completed).length;
    },
    
    /**
     * Get number of pending tasks
     */
    get pendingCount() {
      return node.length - node.filter(task => task.completed).length;
    },
    
    /**
     * Get completion rate as percentage
     */
    get completionRate() {
      if (node.length === 0) return 0;
      return Math.round((node.filter(task => task.completed).length / node.length) * 100);
    }
  }));

  // Add date formatting to tasks
  taskConfig.target(({ path }) => {
    return !!path && !!path.match(/^\$\.tasks\[\d+\]$/);
  })
    .formatDate({
      key: 'createdAt',
      dateStyle: 'medium'
    })
    .formatDate({
      key: 'completedAt',
      dateStyle: 'medium'
    });
    
  return taskConfig;
}

/**
 * Create project-specific configuration
 */
function createProjectConfig() {
  const projectConfig = config();
  
  // Configuration for projects array
  projectConfig.projects.extend(({ node }) => ({
    /**
     * Add a new project
     */
    addProject(name: string) {
      if (!name.trim()) return;
      
      node.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: new Date().toISOString()
      });
    },
    
    /**
     * Remove a project by ID
     */
    removeProject(id: string) {
      const index = node.findIndex(project => project.id === id);
      if (index !== -1) {
        node.splice(index, 1);
      }
    },
    
    /**
     * Update project name
     */
    updateName(id: string, name: string) {
      if (!name.trim()) return;
      
      const project = node.find(project => project.id === id);
      if (project) {
        project.name = name.trim();
      }
    }
  }));
  
  // Add date formatting to projects
  projectConfig.target(({ path }) => {
    return !!path && !!path.match(/^\$\.projects\[\d+\]$/);
  })
    .formatDate({
      key: 'createdAt',
      dateStyle: 'medium'
    });
    
  return projectConfig;
}

/**
 * Create root store configuration
 */
function createRootConfig() {
  const rootConfig = config();
  
  // Root store configuration
  rootConfig.extend(({ node, state }) => ({
    /**
     * Set the current project
     */
    setCurrentProject(projectId: string | null) {
      node.currentProjectId = projectId;
    },
    
    /**
     * Get the current project
     */
    get currentProject() {
      if (!node.currentProjectId) return null;
      return node.projects.find(project => project.id === node.currentProjectId) || null;
    },
    
    /**
     * Get project-specific statistics
     */
    getProjectStats(projectId: string) {
      const projectTasks = node.tasks.filter(task => task.projectId === projectId);
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
  }));
  
  // Add validation to the root store
  rootConfig.validate({
    rules: {
      currentProjectId: (value) => {
        if (value !== null && typeof value !== 'string') {
          return 'Current project ID must be a string or null';
        }
        return true;
      }
    }
  });
  
  return rootConfig;
}

/**
 * Create and configure the store with typed configuration
 */
export function createConfig() {
  // Create main configuration
  const $ = config();
  
  // Compose domain-specific configurations
  $.use(createTaskConfig());
  $.use(createProjectConfig());
  $.use(createRootConfig());
  
  return $;
} 