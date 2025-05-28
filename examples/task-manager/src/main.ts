import { taskStore } from './store';
import { ProjectService } from './services/projectService';
import { TaskService } from './services/taskService';
import { PriorityLevel, Task } from './types';

// DOM references
const projectList = document.getElementById('project-list') as HTMLUListElement;
const projectInput = document.getElementById('project-input') as HTMLInputElement;
const addProjectBtn = document.getElementById('add-project-btn') as HTMLButtonElement;
const currentProjectName = document.getElementById('current-project-name') as HTMLHeadingElement;
const taskInput = document.getElementById('task-input') as HTMLInputElement;
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement;
const addTaskBtn = document.getElementById('add-task-btn') as HTMLButtonElement;
const taskList = document.getElementById('task-list') as HTMLUListElement;
const emptyState = document.getElementById('empty-state') as HTMLDivElement;
const totalTasks = document.getElementById('total-tasks') as HTMLDivElement;
const completedTasks = document.getElementById('completed-tasks') as HTMLDivElement;
const pendingTasks = document.getElementById('pending-tasks') as HTMLDivElement;

// =============================================================
// RENDER FUNCTIONS
// =============================================================

/**
 * Render the project list
 */
function renderProjects() {
  projectList.innerHTML = '';
  
  // Add "All Tasks" option
  const allTasksItem = document.createElement('li');
  allTasksItem.className = `project-item ${!taskStore.currentProjectId ? 'active' : ''}`;
  
  const allTasksName = document.createElement('span');
  allTasksName.className = 'project-name';
  allTasksName.textContent = 'All Tasks';
  
  const allTasksCount = document.createElement('span');
  allTasksCount.className = 'project-count';
  allTasksCount.textContent = `(${taskStore.tasks.length})`;
  
  allTasksItem.appendChild(allTasksName);
  allTasksItem.appendChild(allTasksCount);
  
  allTasksItem.addEventListener('click', () => {
    ProjectService.setCurrentProject(null);
  });
  
  projectList.appendChild(allTasksItem);
  
  // Add each project
  const projects = ProjectService.getAllProjects();
  
  if (projects.length === 0) {
    // Show a placeholder message if no projects exist
    const noProjects = document.createElement('li');
    noProjects.textContent = 'No projects yet';
    noProjects.style.padding = '0.75rem 1rem';
    noProjects.style.color = 'var(--gray-500)';
    noProjects.style.fontStyle = 'italic';
    noProjects.style.textAlign = 'center';
    projectList.appendChild(noProjects);
  } else {
    // Render each project
    projects.forEach(project => {
      const li = document.createElement('li');
      li.className = `project-item ${taskStore.currentProjectId === project.id ? 'active' : ''}`;
      
      // Project info div
      const projectInfo = document.createElement('div');
      projectInfo.style.display = 'flex';
      projectInfo.style.alignItems = 'center';
      
      // Project name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'project-name';
      nameSpan.textContent = project.name;
      projectInfo.appendChild(nameSpan);
      
      // Project count
      const countSpan = document.createElement('span');
      countSpan.className = 'project-count';
      countSpan.textContent = `(${project.taskCount})`;
      projectInfo.appendChild(countSpan);
      
      li.appendChild(projectInfo);
      
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${project.name}" and all its tasks?`)) {
          ProjectService.deleteProject(project.id);
        }
      });
      
      li.appendChild(deleteBtn);
      
      // Set as current project when clicked
      li.addEventListener('click', () => {
        ProjectService.setCurrentProject(project.id);
      });
      
      projectList.appendChild(li);
    });
  }
}

/**
 * Render the task list
 */
function renderTasks() {
  taskList.innerHTML = '';
  
  // Get tasks for current project
  const tasks = TaskService.getCurrentProjectTasks();
  
  // Show empty state if no tasks
  if (tasks.length === 0) {
    emptyState.style.display = 'block';
    taskList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    taskList.style.display = 'block';
    
    // Sort tasks - completed at the bottom
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Render each task
    sortedTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';

      if (!task) return

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        TaskService.toggleTask(task.id);
      });
      
      // Task content
      const content = document.createElement('div');
      content.className = 'task-content';
      
      // Task title
      const title = document.createElement('h3');
      title.className = `task-title ${task.completed ? 'completed' : ''}`;
      title.textContent = task.title;
      content.appendChild(title);
      
      // Task metadata
      const meta = document.createElement('div');
      meta.className = 'task-meta';
      
      // Creation date
      const createdDate = document.createElement('span');
      createdDate.className = 'task-date';
      
      const date = new Date(task.createdAt);
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
      }).format(date);
      
      createdDate.textContent = `Created: ${formattedDate}`;
      meta.appendChild(createdDate);
      
      // Add completion date if available
      if (task.completed && task.completedAt) {
        const completedDateEl = document.createElement('span');
        completedDateEl.className = 'task-date';
        
        const completedDate = new Date(task.completedAt);
        const formattedCompletedDate = new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
        }).format(completedDate);
        
        completedDateEl.textContent = `Completed: ${formattedCompletedDate}`;
        meta.appendChild(completedDateEl);
      }
      
      // Priority badge
      const priorityBadge = document.createElement('span');
      priorityBadge.className = `task-priority priority-${task.priority}`;
      priorityBadge.textContent = task.priority;
      meta.appendChild(priorityBadge);
      
      content.appendChild(meta);
      
      // Actions
      const actions = document.createElement('div');
      actions.className = 'task-actions';
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        TaskService.deleteTask(task.id);
      });
      
      actions.appendChild(deleteBtn);
      
      // Assemble task item
      li.appendChild(checkbox);
      li.appendChild(content);
      li.appendChild(actions);
      
      taskList.appendChild(li);
    });
  }
  
  // Update stats
  updateTaskStats();
}

/**
 * Update task statistics
 */
function updateTaskStats() {
  // Display total counts from the store
  if (taskStore.currentProjectId) {
    // Show stats for current project
    const stats = ProjectService.getProjectStats(taskStore.currentProjectId);
    totalTasks.textContent = stats.taskCount.toString();
    completedTasks.textContent = stats.completedTaskCount.toString();
    pendingTasks.textContent = stats.pendingTaskCount.toString();
  } else {
    // Show stats for all tasks
    totalTasks.textContent = taskStore.tasks.length.toString();
    completedTasks.textContent = TaskService.getCompletedTasks().length.toString();
    pendingTasks.textContent = TaskService.getActiveTasks().length.toString();
  }
}

/**
 * Update the current project title
 */
function updateProjectTitle() {
  if (taskStore.currentProjectId) {
    const project = ProjectService.getCurrentProject();
    currentProjectName.textContent = project ? project.name : 'All Tasks';
  } else {
    currentProjectName.textContent = 'All Tasks';
  }
}

// =============================================================
// EVENT HANDLERS
// =============================================================

// Add new project
addProjectBtn.addEventListener('click', () => {
  const name = projectInput.value.trim();
  if (name) {
    ProjectService.createProject(name);
    projectInput.value = '';
    projectInput.focus();
  }
});

// Handle Enter key in project input
projectInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const name = projectInput.value.trim();
    if (name) {
      ProjectService.createProject(name);
      projectInput.value = '';
    }
  }
});

// Add new task
addTaskBtn.addEventListener('click', () => {
  const title = taskInput.value.trim();
  if (title) {
    TaskService.createTask(
      title,
      prioritySelect.value as PriorityLevel
    );
    
    taskInput.value = '';
    taskInput.focus();
  }
});

// Handle Enter key in task input
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const title = taskInput.value.trim();
    if (title) {
      TaskService.createTask(
        title,
        prioritySelect.value as PriorityLevel
      );
      
      taskInput.value = '';
    }
  }
});

// =============================================================
// WATCH FOR STORE CHANGES
// =============================================================

// Subscribe to state changes and update UI
taskStore.watch(() => {
  renderProjects();
  renderTasks();
  updateProjectTitle();
});

// Initial render
renderProjects();
renderTasks();
updateProjectTitle(); 