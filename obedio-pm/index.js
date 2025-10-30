#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'tasks.json');

// Categories for OBEDIO project
const CATEGORIES = {
  webapp: { name: 'WebApp', icon: '🌐', color: '\x1b[36m' },
  case: { name: 'Case Design', icon: '📦', color: '\x1b[35m' },
  pcb: { name: 'PCB', icon: '⚡', color: '\x1b[33m' },
  metstrade: { name: 'METSTRADE', icon: '⚓', color: '\x1b[32m' },
  marketing: { name: 'Marketing', icon: '🎨', color: '\x1b[95m' },
  website: { name: 'Website', icon: '🌍', color: '\x1b[94m' }
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Initialize data file
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: [], nextId: 1 }, null, 2));
  }
}

// Load data
function loadData() {
  initData();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Save data
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Add task
function addTask(description, category) {
  const data = loadData();

  if (!category || !CATEGORIES[category.toLowerCase()]) {
    console.log(`${COLORS.red}Error: Invalid category. Use: webapp, case, pcb, metstrade, marketing, website${COLORS.reset}`);
    return;
  }

  const task = {
    id: data.nextId++,
    description,
    category: category.toLowerCase(),
    status: 'pending',
    priority: 'medium',
    order: data.tasks.length,
    createdAt: new Date().toISOString(),
    subtasks: []
  };

  data.tasks.push(task);
  saveData(data);

  const cat = CATEGORIES[category.toLowerCase()];
  console.log(`${COLORS.green}✓ Added task #${task.id}:${COLORS.reset} ${description}`);
  console.log(`  ${cat.color}${cat.icon} ${cat.name}${COLORS.reset}`);
}

// Add subtask
function addSubtask(taskId, description) {
  const data = loadData();
  const task = data.tasks.find(t => t.id === parseInt(taskId));

  if (!task) {
    console.log(`${COLORS.red}Error: Task #${taskId} not found${COLORS.reset}`);
    return;
  }

  const subtask = {
    id: task.subtasks.length + 1,
    description,
    status: 'pending'
  };

  task.subtasks.push(subtask);
  saveData(data);

  console.log(`${COLORS.green}✓ Added subtask to #${taskId}:${COLORS.reset} ${description}`);
}

// Mark task as done
function markDone(taskId, subtaskId = null) {
  const data = loadData();
  const task = data.tasks.find(t => t.id === parseInt(taskId));

  if (!task) {
    console.log(`${COLORS.red}Error: Task #${taskId} not found${COLORS.reset}`);
    return;
  }

  if (subtaskId) {
    const subtask = task.subtasks.find(s => s.id === parseInt(subtaskId));
    if (!subtask) {
      console.log(`${COLORS.red}Error: Subtask #${subtaskId} not found${COLORS.reset}`);
      return;
    }
    subtask.status = 'done';
    console.log(`${COLORS.green}✓ Marked subtask #${taskId}.${subtaskId} as done${COLORS.reset}`);
  } else {
    task.status = 'done';
    task.completedAt = new Date().toISOString();
    console.log(`${COLORS.green}✓ Marked task #${taskId} as done${COLORS.reset}`);
  }

  saveData(data);
}

// Delete task
function deleteTask(taskId) {
  const data = loadData();
  const index = data.tasks.findIndex(t => t.id === parseInt(taskId));

  if (index === -1) {
    console.log(`${COLORS.red}Error: Task #${taskId} not found${COLORS.reset}`);
    return;
  }

  const task = data.tasks[index];
  data.tasks.splice(index, 1);
  saveData(data);

  console.log(`${COLORS.yellow}⚠ Deleted task #${taskId}:${COLORS.reset} ${task.description}`);
}

// Set task priority
function setPriority(taskId, priority) {
  const validPriorities = ['urgent', 'high', 'medium', 'low'];

  if (!validPriorities.includes(priority.toLowerCase())) {
    console.log(`${COLORS.red}Error: Invalid priority. Use: urgent, high, medium, low${COLORS.reset}`);
    return;
  }

  const data = loadData();
  const task = data.tasks.find(t => t.id === parseInt(taskId));

  if (!task) {
    console.log(`${COLORS.red}Error: Task #${taskId} not found${COLORS.reset}`);
    return;
  }

  const oldPriority = task.priority || 'medium';
  task.priority = priority.toLowerCase();
  saveData(data);

  const priorityIcon = {
    urgent: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  };

  console.log(`${COLORS.green}✓ Changed priority for task #${taskId}${COLORS.reset}`);
  console.log(`  ${oldPriority} → ${priorityIcon[task.priority]} ${task.priority}`);
}

// Move task position
function moveTask(taskId, direction) {
  const data = loadData();
  const taskIndex = data.tasks.findIndex(t => t.id === parseInt(taskId));

  if (taskIndex === -1) {
    console.log(`${COLORS.red}Error: Task #${taskId} not found${COLORS.reset}`);
    return;
  }

  const task = data.tasks[taskIndex];

  if (direction === 'up' && taskIndex > 0) {
    // Swap with previous task
    [data.tasks[taskIndex], data.tasks[taskIndex - 1]] = [data.tasks[taskIndex - 1], data.tasks[taskIndex]];
    // Update order values
    data.tasks[taskIndex].order = taskIndex;
    data.tasks[taskIndex - 1].order = taskIndex - 1;
    console.log(`${COLORS.green}✓ Moved task #${taskId} up${COLORS.reset}`);
  } else if (direction === 'down' && taskIndex < data.tasks.length - 1) {
    // Swap with next task
    [data.tasks[taskIndex], data.tasks[taskIndex + 1]] = [data.tasks[taskIndex + 1], data.tasks[taskIndex]];
    // Update order values
    data.tasks[taskIndex].order = taskIndex;
    data.tasks[taskIndex + 1].order = taskIndex + 1;
    console.log(`${COLORS.green}✓ Moved task #${taskId} down${COLORS.reset}`);
  } else if (direction === 'top') {
    // Move to top
    data.tasks.splice(taskIndex, 1);
    data.tasks.unshift(task);
    // Reorder all
    data.tasks.forEach((t, i) => t.order = i);
    console.log(`${COLORS.green}✓ Moved task #${taskId} to top${COLORS.reset}`);
  } else if (direction === 'bottom') {
    // Move to bottom
    data.tasks.splice(taskIndex, 1);
    data.tasks.push(task);
    // Reorder all
    data.tasks.forEach((t, i) => t.order = i);
    console.log(`${COLORS.green}✓ Moved task #${taskId} to bottom${COLORS.reset}`);
  } else {
    console.log(`${COLORS.yellow}Cannot move task in that direction${COLORS.reset}`);
    return;
  }

  saveData(data);
}

// List tasks
function listTasks(filter = 'all') {
  const data = loadData();

  let tasks = data.tasks;
  if (filter === 'pending') {
    tasks = tasks.filter(t => t.status === 'pending');
  } else if (filter === 'done') {
    tasks = tasks.filter(t => t.status === 'done');
  }

  if (tasks.length === 0) {
    console.log(`${COLORS.gray}No tasks found.${COLORS.reset}`);
    return;
  }

  console.log(`\n${COLORS.bright}OBEDIO Project Tasks${COLORS.reset}\n`);

  // Group by category
  Object.keys(CATEGORIES).forEach(catKey => {
    const catTasks = tasks.filter(t => t.category === catKey);
    if (catTasks.length === 0) return;

    const cat = CATEGORIES[catKey];
    console.log(`${cat.color}${COLORS.bright}${cat.icon} ${cat.name}${COLORS.reset}`);
    console.log(`${COLORS.gray}${'─'.repeat(50)}${COLORS.reset}`);

    // Sort by priority then by order
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    catTasks.sort((a, b) => {
      const priorityA = priorityOrder[a.priority || 'medium'];
      const priorityB = priorityOrder[b.priority || 'medium'];
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (a.order || 0) - (b.order || 0);
    });

    catTasks.forEach(task => {
      const statusIcon = task.status === 'done' ? '✓' : '○';
      const statusColor = task.status === 'done' ? COLORS.green : COLORS.yellow;

      const priorityIcon = {
        urgent: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      };
      const priorityDisplay = task.priority ? ` ${priorityIcon[task.priority]}` : '';

      console.log(`${statusColor}${statusIcon}${COLORS.reset} #${task.id}${priorityDisplay} ${task.description}`);

      if (task.subtasks.length > 0) {
        task.subtasks.forEach((sub, subIndex) => {
          const subIcon = sub.status === 'done' ? '✓' : '○';
          const subColor = sub.status === 'done' ? COLORS.green : COLORS.gray;
          const isLast = subIndex === task.subtasks.length - 1;
          const connector = isLast ? '└─' : '├─';
          console.log(`  ${COLORS.gray}${connector}${COLORS.reset} ${subColor}${subIcon}${COLORS.reset} ${sub.description}`);
        });
        console.log(`  ${COLORS.gray}└${'─'.repeat(48)}${COLORS.reset}`);
      }
      console.log('');
    });
  });

  // Stats
  const pending = tasks.filter(t => t.status === 'pending').length;
  const done = tasks.filter(t => t.status === 'done').length;
  console.log(`${COLORS.gray}Total: ${tasks.length} | Pending: ${pending} | Done: ${done}${COLORS.reset}\n`);
}

// Show categories
function showCategories() {
  console.log(`\n${COLORS.bright}OBEDIO Project Categories${COLORS.reset}\n`);

  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    console.log(`${cat.color}${cat.icon} ${cat.name}${COLORS.reset} (${key})`);

    if (key === 'webapp') {
      console.log(`  ${COLORS.gray}→ Software bugs, features, improvements${COLORS.reset}`);
    } else if (key === 'case') {
      console.log(`  ${COLORS.gray}→ Case design files, contractor communication${COLORS.reset}`);
    } else if (key === 'pcb') {
      console.log(`  ${COLORS.gray}→ PCB design, testing plans, orders${COLORS.reset}`);
    } else if (key === 'metstrade') {
      console.log(`  ${COLORS.gray}→ Trade show preparation and materials${COLORS.reset}`);
    } else if (key === 'marketing') {
      console.log(`  ${COLORS.gray}→ 3D animations, flyers, promo materials${COLORS.reset}`);
    } else if (key === 'website') {
      console.log(`  ${COLORS.gray}→ OBEDIO website development and content${COLORS.reset}`);
    }
    console.log('');
  });
}

// Show help
function showHelp() {
  console.log(`
${COLORS.bright}OBEDIO Project Manager${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node index.js <command> [options]

${COLORS.cyan}Commands:${COLORS.reset}
  ${COLORS.bright}list [filter]${COLORS.reset}              List all tasks (filter: all, pending, done)
  ${COLORS.bright}add <description> <category>${COLORS.reset} Add a new task
  ${COLORS.bright}sub <taskId> <description>${COLORS.reset}  Add a subtask to existing task
  ${COLORS.bright}done <taskId> [subtaskId]${COLORS.reset}  Mark task/subtask as done
  ${COLORS.bright}delete <taskId>${COLORS.reset}            Delete a task
  ${COLORS.bright}priority <taskId> <level>${COLORS.reset}  Set priority (urgent, high, medium, low)
  ${COLORS.bright}move <taskId> <direction>${COLORS.reset}  Move task (up, down, top, bottom)
  ${COLORS.bright}categories${COLORS.reset}                 Show all categories
  ${COLORS.bright}help${COLORS.reset}                       Show this help

${COLORS.cyan}Categories:${COLORS.reset}
  webapp, case, pcb, metstrade, marketing, website

${COLORS.cyan}Examples:${COLORS.reset}
  node index.js add "Fix login bug" webapp
  node index.js sub 1 "Check authentication flow"
  node index.js priority 1 urgent
  node index.js move 1 top
  node index.js done 1 2
  node index.js list pending
  `);
}

// Main CLI
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help') {
  showHelp();
} else if (command === 'list') {
  listTasks(args[1] || 'all');
} else if (command === 'add') {
  const description = args.slice(1, -1).join(' ');
  const category = args[args.length - 1];
  addTask(description, category);
} else if (command === 'sub') {
  const taskId = args[1];
  const description = args.slice(2).join(' ');
  addSubtask(taskId, description);
} else if (command === 'done') {
  markDone(args[1], args[2]);
} else if (command === 'delete') {
  deleteTask(args[1]);
} else if (command === 'priority') {
  setPriority(args[1], args[2]);
} else if (command === 'move') {
  moveTask(args[1], args[2]);
} else if (command === 'categories') {
  showCategories();
} else {
  console.log(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
  console.log(`Run 'node index.js help' for usage information.`);
}
