#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'tasks.json');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

const VALID_CATEGORIES = ['webapp', 'case', 'pcb', 'metstrade', 'marketing', 'website'];

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

// Parse task file
function parseTaskFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const tasks = [];
  let currentTask = null;
  let currentCategory = null;

  lines.forEach((line, index) => {
    line = line.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) return;

    // Category header: [WebApp] or ## WebApp
    const categoryMatch = line.match(/^[\[#]*\s*(webapp|case|pcb|metstrade|marketing|website)\s*[\]#]*/i);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].toLowerCase();
      return;
    }

    // Main task: - Task description or * Task description or 1. Task description
    const taskMatch = line.match(/^[-*\d]+[\.\)]\s*(.+)/);
    if (taskMatch && !line.startsWith('  ')) {
      if (currentTask) {
        tasks.push(currentTask);
      }

      currentTask = {
        description: taskMatch[1],
        category: currentCategory || 'webapp',
        subtasks: []
      };
      return;
    }

    // Subtask: indented line
    if (line.startsWith('  ') || line.startsWith('\t')) {
      const subtaskMatch = line.match(/^\s*[-*\d]+[\.\)]\s*(.+)/);
      if (subtaskMatch && currentTask) {
        currentTask.subtasks.push(subtaskMatch[1]);
      }
    }
  });

  // Add last task
  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks;
}

// Import tasks
function importTasks(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`${COLORS.red}Error: File not found: ${filePath}${COLORS.reset}`);
    return;
  }

  console.log(`${COLORS.cyan}Importing tasks from: ${filePath}${COLORS.reset}\n`);

  const parsedTasks = parseTaskFile(filePath);

  if (parsedTasks.length === 0) {
    console.log(`${COLORS.yellow}No tasks found in file.${COLORS.reset}`);
    return;
  }

  const data = loadData();
  let addedCount = 0;

  parsedTasks.forEach(parsedTask => {
    const task = {
      id: data.nextId++,
      description: parsedTask.description,
      category: parsedTask.category,
      status: 'pending',
      createdAt: new Date().toISOString(),
      subtasks: parsedTask.subtasks.map((sub, i) => ({
        id: i + 1,
        description: sub,
        status: 'pending'
      }))
    };

    data.tasks.push(task);
    addedCount++;

    console.log(`${COLORS.green}✓ Added #${task.id}:${COLORS.reset} ${task.description} ${COLORS.cyan}[${task.category}]${COLORS.reset}`);
    task.subtasks.forEach(sub => {
      console.log(`  ${COLORS.yellow}○${COLORS.reset} ${sub.description}`);
    });
    console.log('');
  });

  saveData(data);

  console.log(`${COLORS.bright}${COLORS.green}Successfully imported ${addedCount} tasks!${COLORS.reset}\n`);
}

// Show example format
function showExample() {
  console.log(`
${COLORS.bright}Task Import File Format${COLORS.reset}

You can create a text file with tasks in the following formats:

${COLORS.cyan}Example 1: With category headers${COLORS.reset}

[WebApp]
- Fix login bug
  - Check authentication flow
  - Test with different browsers
- Add dark mode

[PCB]
- Order 10 prototypes from JLCPCB
- Test battery life

${COLORS.cyan}Example 2: Markdown style${COLORS.reset}

## marketing
1. Create 3D product animation
2. Design flyers for METSTRADE
   - Print version
   - Digital version

## website
* Update landing page
* Add testimonials section

${COLORS.cyan}Example 3: Simple list (defaults to webapp)${COLORS.reset}

- Task 1
- Task 2
  - Subtask 2.1
  - Subtask 2.2
- Task 3

${COLORS.cyan}Usage:${COLORS.reset}
  node import.js <file-path>
  node import.js example

${COLORS.cyan}Supported formats:${COLORS.reset}
  - Bullet points: -, *, •
  - Numbered: 1., 2., etc.
  - Category headers: [category] or ## category
  - Subtasks: indent with 2 spaces or tab

${COLORS.cyan}Valid categories:${COLORS.reset}
  webapp, case, pcb, metstrade, marketing, website
  `);
}

// Main CLI
const args = process.argv.slice(2);
const filePath = args[0];

if (!filePath || filePath === 'help' || filePath === 'example') {
  showExample();
} else {
  importTasks(filePath);
}
