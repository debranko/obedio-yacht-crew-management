const API_URL = 'http://localhost:3333/api';

let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

let CATEGORIES = {
    webapp: { name: 'WebApp', icon: '🌐' },
    case: { name: 'Case Design', icon: '📦' },
    pcb: { name: 'PCB', icon: '⚡' },
    metstrade: { name: 'METSTRADE', icon: '⚓' },
    marketing: { name: 'Marketing', icon: '🎨' },
    website: { name: 'Website', icon: '🌍' }
};

// Load custom categories from localStorage
function loadCategories() {
    const saved = localStorage.getItem('obedio_categories');
    if (saved) {
        try {
            const customCategories = JSON.parse(saved);
            CATEGORIES = { ...CATEGORIES, ...customCategories };
        } catch (e) {
            console.error('Error loading categories:', e);
        }
    }
}

// Save categories to localStorage
function saveCategories() {
    try {
        localStorage.setItem('obedio_categories', JSON.stringify(CATEGORIES));
    } catch (e) {
        console.error('Error saving categories:', e);
    }
}

// Load tasks on page load
window.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadTasks();
    setupEventListeners();
});

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        const data = await response.json();
        tasks = data.tasks || [];
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    // Add task modal
    const addModal = document.getElementById('addTaskModal');
    const editModal = document.getElementById('editTaskModal');

    document.getElementById('addTaskBtn').addEventListener('click', () => {
        addModal.classList.add('active');
        document.getElementById('taskDescription').focus();
    });

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            addModal.classList.remove('active');
            editModal.classList.remove('active');
        });
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
        addModal.classList.remove('active');
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        editModal.classList.remove('active');
    });

    // Save new task
    document.getElementById('saveTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskDescription').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Edit task
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
    document.getElementById('deleteTaskBtn').addEventListener('click', deleteTask);
    document.getElementById('addSubtaskBtn').addEventListener('click', addSubtask);

    // Categories management
    document.getElementById('manageCategoriesBtn').addEventListener('click', () => {
        openCategoriesModal();
    });

    document.getElementById('closeCategoriesBtn').addEventListener('click', () => {
        document.getElementById('categoriesModal').classList.remove('active');
    });

    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);

    // Floating AI Toggle
    document.getElementById('aiTrigger').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('floatingAI').classList.toggle('collapsed');
    });

    document.getElementById('sendChatCompactBtn').addEventListener('click', sendChatMessageCompact);
    document.getElementById('chatInputCompact').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessageCompact();
    });

    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            document.getElementById('chatInputCompact').value = text;
            sendChatMessageCompact();
        });
    });

    // File upload
    document.getElementById('fileUpload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFileUpload(file);
            e.target.value = ''; // Reset input
        }
    });
}

async function addTask() {
    const description = document.getElementById('taskDescription').value.trim();
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;

    if (!description) return;

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, category, priority })
        });

        const newTask = await response.json();
        tasks.push(newTask);

        renderTasks();
        updateStats();

        // Reset form
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('addTaskModal').classList.remove('active');
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

function renderTasks() {
    const container = document.getElementById('kanbanBoard');

    // Filter tasks
    let filteredTasks = tasks;
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(t => t.status === 'pending');
    } else if (currentFilter === 'done') {
        filteredTasks = tasks.filter(t => t.status === 'done');
    }

    // Group by category
    const groupedTasks = {};
    Object.keys(CATEGORIES).forEach(cat => {
        groupedTasks[cat] = filteredTasks.filter(t => t.category === cat);
    });

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    Object.keys(groupedTasks).forEach(cat => {
        groupedTasks[cat].sort((a, b) => {
            const priorityA = priorityOrder[a.priority || 'medium'];
            const priorityB = priorityOrder[b.priority || 'medium'];
            if (priorityA !== priorityB) return priorityA - priorityB;
            return (a.order || 0) - (b.order || 0);
        });
    });

    // Render Kanban Board
    container.innerHTML = '';

    // Render all categories as columns (even if empty)
    Object.entries(CATEGORIES).forEach(([catKey, category]) => {
        const catTasks = groupedTasks[catKey] || [];

        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.dataset.category = catKey;

        column.innerHTML = `
            <div class="kanban-column-header">
                <span class="kanban-column-icon">${category.icon}</span>
                <span class="kanban-column-title">${category.name}</span>
                <span class="kanban-column-count">${catTasks.length}</span>
            </div>
            <div class="kanban-column-body">
                ${catTasks.length === 0 ?
                    '<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.9rem;">No tasks</div>' :
                    catTasks.map(task => renderKanbanCard(task)).join('')
                }
            </div>
        `;

        container.appendChild(column);
    });

    // Add click handlers for kanban cards
    document.querySelectorAll('.kanban-card-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = parseInt(e.target.dataset.taskId);
            toggleTask(taskId);
        });
    });

    document.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't open modal if clicking checkbox or delete button
            if (e.target.classList.contains('kanban-card-checkbox') ||
                e.target.classList.contains('kanban-card-delete')) return;
            const taskId = parseInt(card.dataset.taskId);
            openEditModal(taskId);
        });
    });

    // Delete button handlers
    document.querySelectorAll('.kanban-card-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const taskId = parseInt(e.target.dataset.taskId);
            if (confirm('Da li si siguran da želiš da obrišeš ovaj task?')) {
                await deleteTaskQuick(taskId);
            }
        });
    });
}

function renderKanbanCard(task) {
    const priorityEmoji = { urgent: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    const doneClass = task.status === 'done' ? 'done' : '';

    const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.status === 'done').length : 0;
    const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

    return `
        <div class="kanban-card ${doneClass}" data-task-id="${task.id}">
            <div class="kanban-card-header">
                <div class="kanban-card-checkbox ${task.status === 'done' ? 'checked' : ''}" data-task-id="${task.id}"></div>
                <span class="kanban-card-priority">${priorityEmoji[task.priority || 'medium']}</span>
            </div>
            ${task.title ? `
                <div class="kanban-card-title">${task.title}</div>
                ${task.description ? `<div class="kanban-card-desc">${task.description}</div>` : ''}
            ` : `
                <div class="kanban-card-title">${task.description}</div>
            `}
            ${task.url ? `
                <div class="kanban-card-link">
                    <a href="${task.url}" target="_blank" onclick="event.stopPropagation()">
                        🔗 Link
                    </a>
                </div>
            ` : ''}
            ${totalSubtasks > 0 || true ? `
                <div class="kanban-card-footer">
                    ${totalSubtasks > 0 ? `
                        <span class="kanban-card-subtasks">
                            ✓ ${completedSubtasks}/${totalSubtasks}
                        </span>
                    ` : ''}
                    <button class="kanban-card-delete" data-task-id="${task.id}">🗑️</button>
                </div>
            ` : ''}
        </div>
    `;
}

function renderTask(task) {
    const priorityClass = `priority-${task.priority || 'medium'}`;
    const priorityEmoji = { urgent: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    const doneClass = task.status === 'done' ? 'done' : '';

    return `
        <div class="task-item ${doneClass}" data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}" data-task-id="${task.id}"></div>
                <span class="priority-badge ${priorityClass}">
                    ${priorityEmoji[task.priority || 'medium']} ${task.priority || 'medium'}
                </span>
                <span class="task-id">#${task.id}</span>
                <span class="task-description">${task.description}</span>
                <button class="btn-delete-task" data-task-id="${task.id}" title="Delete task">🗑️</button>
            </div>
            ${task.subtasks && task.subtasks.length > 0 ? `
                <div class="subtasks">
                    ${task.subtasks.map(sub => `
                        <div class="subtask-item">
                            <div class="subtask-checkbox ${sub.status === 'done' ? 'checked' : ''}"
                                 data-task-id="${task.id}"
                                 data-subtask-id="${sub.id}"></div>
                            <span>${sub.description}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

async function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'pending' : 'done';

    try {
        await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        task.status = newStatus;

        // Auto-switch to "done" filter when task is completed
        if (newStatus === 'done') {
            currentFilter = 'done';
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === 'done') {
                    btn.classList.add('active');
                }
            });
        }

        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

async function deleteTaskQuick(taskId) {
    try {
        await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });

        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

async function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    subtask.status = subtask.status === 'done' ? 'pending' : 'done';

    try {
        await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subtasks: task.subtasks })
        });

        renderTasks();
    } catch (error) {
        console.error('Error toggling subtask:', error);
    }
}

function openEditModal(taskId) {
    editingTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskPriority').value = task.priority || 'medium';

    renderSubtasksInModal(task);

    document.getElementById('editTaskModal').classList.add('active');
}

function renderSubtasksInModal(task) {
    const container = document.getElementById('subtasksList');
    if (!task.subtasks || task.subtasks.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No subtasks yet.</p>';
        return;
    }

    container.innerHTML = task.subtasks.map(sub => `
        <div class="subtask-item">
            <div class="subtask-checkbox ${sub.status === 'done' ? 'checked' : ''}"
                 data-task-id="${task.id}"
                 data-subtask-id="${sub.id}"></div>
            <span>${sub.description}</span>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            const taskId = parseInt(e.target.dataset.taskId);
            const subtaskId = parseInt(e.target.dataset.subtaskId);
            toggleSubtask(taskId, subtaskId);
            setTimeout(() => {
                const updatedTask = tasks.find(t => t.id === taskId);
                renderSubtasksInModal(updatedTask);
            }, 100);
        });
    });
}

async function addSubtask() {
    const description = document.getElementById('newSubtaskDescription').value.trim();
    if (!description) return;

    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    if (!task.subtasks) task.subtasks = [];

    const newSubtask = {
        id: task.subtasks.length + 1,
        description,
        status: 'pending'
    };

    task.subtasks.push(newSubtask);

    try {
        await fetch(`${API_URL}/tasks/${editingTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subtasks: task.subtasks })
        });

        document.getElementById('newSubtaskDescription').value = '';
        renderSubtasksInModal(task);
        renderTasks();
    } catch (error) {
        console.error('Error adding subtask:', error);
    }
}

async function saveEdit() {
    const description = document.getElementById('editTaskDescription').value.trim();
    const priority = document.getElementById('editTaskPriority').value;

    if (!description) return;

    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    try {
        await fetch(`${API_URL}/tasks/${editingTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, priority })
        });

        task.description = description;
        task.priority = priority;

        renderTasks();
        document.getElementById('editTaskModal').classList.remove('active');
    } catch (error) {
        console.error('Error saving task:', error);
    }
}

async function deleteTask() {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        await fetch(`${API_URL}/tasks/${editingTaskId}`, {
            method: 'DELETE'
        });

        tasks = tasks.filter(t => t.id !== editingTaskId);

        renderTasks();
        updateStats();
        document.getElementById('editTaskModal').classList.remove('active');
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function updateStats() {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status === 'pending').length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('urgentTasks').textContent = urgent;
}

function openCategoriesModal() {
    renderCategoriesList();
    updateCategoryDropdowns();
    document.getElementById('categoriesModal').classList.add('active');
}

function renderCategoriesList() {
    const container = document.getElementById('categoriesList');

    const html = Object.entries(CATEGORIES).map(([key, cat]) => {
        const taskCount = tasks.filter(t => t.category === key).length;
        return `
            <div class="category-item">
                <div class="category-info">
                    <span class="category-item-icon">${cat.icon}</span>
                    <div class="category-item-details">
                        <div class="category-item-name">${cat.name}</div>
                        <div class="category-item-key">${key}</div>
                    </div>
                </div>
                <span class="category-count">${taskCount} tasks</span>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function addCategory() {
    const key = document.getElementById('newCategoryKey').value.trim().toLowerCase();
    const icon = document.getElementById('newCategoryIcon').value.trim();
    const name = document.getElementById('newCategoryName').value.trim();

    if (!key || !name) {
        alert('Please fill in both category key and name');
        return;
    }

    if (CATEGORIES[key]) {
        alert('Category key already exists!');
        return;
    }

    if (!/^[a-z0-9_-]+$/.test(key)) {
        alert('Category key can only contain lowercase letters, numbers, dashes, and underscores');
        return;
    }

    CATEGORIES[key] = {
        name,
        icon: icon || '📁'
    };

    saveCategories();
    updateCategoryDropdowns();
    renderCategoriesList();

    // Clear form
    document.getElementById('newCategoryKey').value = '';
    document.getElementById('newCategoryIcon').value = '';
    document.getElementById('newCategoryName').value = '';

    alert(`Category "${name}" added successfully!`);
}

function updateCategoryDropdowns() {
    // Update add task modal dropdown
    const addSelect = document.getElementById('taskCategory');
    addSelect.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) => {
        return `<option value="${key}">${cat.icon} ${cat.name}</option>`;
    }).join('');
}

// File Upload Handler
async function handleFileUpload(file) {
    // Show user message
    addCompactMessage('user', `📎 Upload: ${file.name}`);

    // Show loading message
    addCompactMessage('ai', '🔄 Analiziram fajl...');

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('categories', JSON.stringify(CATEGORIES));

        const response = await fetch(`${API_URL}/ai/analyze-file`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        // Remove loading message
        const messagesContainer = document.getElementById('chatMessagesCompact');
        messagesContainer.removeChild(messagesContainer.lastChild);

        // Create tasks from AI response
        const tasksCreated = [];
        if (result.tasks && result.tasks.length > 0) {
            for (const taskData of result.tasks) {
                const newTask = await createTask(
                    taskData.description,
                    taskData.category,
                    taskData.priority
                );
                if (newTask) {
                    tasksCreated.push(newTask);
                }
            }
        }

        // Add AI response
        addCompactMessage('ai', result.response, tasksCreated);

        // Refresh task list
        if (tasksCreated.length > 0) {
            await loadTasks();
        }
    } catch (error) {
        console.error('File upload error:', error);

        // Remove loading message
        const messagesContainer = document.getElementById('chatMessagesCompact');
        messagesContainer.removeChild(messagesContainer.lastChild);

        addCompactMessage('ai', '❌ Greška pri analizi fajla. Pokušaj ponovo.');
    }
}

// AI Chat Functions
function addChatMessage(sender, message, tasksCreated = null) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    const avatar = sender === 'user' ? '👤' : '🤖';
    let content = `
        <div class="chat-avatar">${avatar}</div>
        <div class="chat-bubble">
            ${message}
    `;

    if (tasksCreated && tasksCreated.length > 0) {
        content += `
            <div class="task-preview">
                <div style="font-weight: 600; margin-bottom: 8px;">✅ Kreirani taskovi:</div>
                ${tasksCreated.map(t => `
                    <div class="task-preview-item">
                        ${t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : t.priority === 'medium' ? '🟡' : '🟢'}
                        <span>${t.description}</span>
                        <span style="font-size: 0.8rem; opacity: 0.7;">(${CATEGORIES[t.category].name})</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    content += `</div>`;
    messageDiv.innerHTML = content;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// Compact Chat Functions
async function sendChatMessageCompact() {
    const input = document.getElementById('chatInputCompact');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addCompactMessage('user', message);
    input.value = '';

    // Process with AI
    const result = await processAIMessage(message);

    // Add AI response
    addCompactMessage('ai', result.response, result.tasksCreated, result.categoryCreated);

    // Refresh task list
    if (result.tasksCreated && result.tasksCreated.length > 0) {
        await loadTasks();
    }

    // Update category dropdowns if new category was created
    if (result.categoryCreated) {
        updateCategoryDropdowns();
    }
}

function addCompactMessage(sender, message, tasksCreated = null, categoryCreated = null) {
    const container = document.getElementById('chatMessagesCompact');
    const messageDiv = document.createElement('div');
    messageDiv.className = `compact-message ${sender}`;

    let content = message;

    if (tasksCreated && tasksCreated.length > 0) {
        content += `<div class="tasks-created">✅ ${tasksCreated.length} task${tasksCreated.length > 1 ? 'a' : ''}: `;
        content += tasksCreated.map(t => {
            const icon = t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : t.priority === 'medium' ? '🟡' : '🟢';
            return `<span class="tasks-created-item">${icon} ${t.description}</span>`;
        }).join('');
        content += `</div>`;
    }

    if (categoryCreated) {
        content += `<div class="tasks-created">🎯 Nova kategorija: ${categoryCreated}</div>`;
    }

    messageDiv.innerHTML = content;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;

    // Keep only last 10 messages
    while (container.children.length > 10) {
        container.removeChild(container.firstChild);
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addChatMessage('user', message);
    input.value = '';

    // Process with AI
    const result = await processAIMessage(message);

    // Add AI response
    addChatMessage('ai', result.response, result.tasksCreated);

    // Refresh task list
    if (result.tasksCreated && result.tasksCreated.length > 0) {
        await loadTasks();
    }
}

async function processAIMessage(message) {
    try {
        // Call real AI backend
        const response = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                categories: CATEGORIES
            })
        });

        const aiResult = await response.json();

        // Handle new category if AI created one
        if (aiResult.newCategory) {
            const { key, name, icon } = aiResult.newCategory;
            CATEGORIES[key] = { name, icon };
            saveCategories();
        }

        // Create tasks from AI response
        const tasksCreated = [];
        if (aiResult.tasks && aiResult.tasks.length > 0) {
            for (const taskData of aiResult.tasks) {
                const newTask = await createTask(
                    taskData.description,
                    taskData.category,
                    taskData.priority
                );
                if (newTask) {
                    tasksCreated.push(newTask);
                }
            }
        }

        return {
            response: aiResult.response || 'Task kreiran!',
            tasksCreated,
            categoryCreated: aiResult.newCategory ? `${aiResult.newCategory.icon} ${aiResult.newCategory.name}` : null
        };
    } catch (error) {
        console.error('AI Error:', error);
        // Fallback to hardcoded logic if AI fails
        return await processAIMessageFallback(message);
    }
}

// Helper function to create a task
async function createTask(description, category, priority) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, category, priority })
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating task:', error);
        return null;
    }
}

// Fallback to hardcoded logic if AI is not available
async function processAIMessageFallback(message) {
    const lowerMessage = message.toLowerCase();

    // Detect priority
    let priority = 'medium';
    if (lowerMessage.includes('hitno') || lowerMessage.includes('urgent') || lowerMessage.includes('odmah') || lowerMessage.includes('asap')) {
        priority = 'urgent';
    } else if (lowerMessage.includes('važno') || lowerMessage.includes('high') || lowerMessage.includes('visok')) {
        priority = 'high';
    } else if (lowerMessage.includes('low') || lowerMessage.includes('kasnije') || lowerMessage.includes('nije hitno')) {
        priority = 'low';
    }

    // Check if user wants to create a new category
    let categoryCreated = null;
    const newCategoryMatch = lowerMessage.match(/(?:kreiraj|napravi|dodaj)\s+(?:novu\s+)?kategoriju\s+[""']?([a-z0-9_-]+)[""']?/i);
    if (newCategoryMatch) {
        const newCatKey = newCategoryMatch[1].toLowerCase();
        if (!CATEGORIES[newCatKey]) {
            // Extract icon if provided
            const iconMatch = message.match(/ikona\s*[:\-]?\s*([^\s]+)/i) || message.match(/icon\s*[:\-]?\s*([^\s]+)/i);
            const icon = iconMatch ? iconMatch[1] : '📁';

            // Capitalize category name
            const catName = newCatKey.charAt(0).toUpperCase() + newCatKey.slice(1);

            CATEGORIES[newCatKey] = {
                name: catName,
                icon: icon
            };

            saveCategories();
            categoryCreated = `${icon} ${catName}`;

            return {
                response: `✅ Super! Kreirao sam novu kategoriju "${catName}" ${icon}. Sada možeš da dodaješ taskove u ovu kategoriju!`,
                tasksCreated: [],
                categoryCreated
            };
        }
    }

    // Detect category
    let category = 'webapp'; // default
    if (lowerMessage.includes('login') || lowerMessage.includes('bug') || lowerMessage.includes('softver') || lowerMessage.includes('kod') || lowerMessage.includes('api')) {
        category = 'webapp';
    } else if (lowerMessage.includes('pcb') || lowerMessage.includes('štampan') || lowerMessage.includes('ploč') || lowerMessage.includes('prototip')) {
        category = 'pcb';
    } else if (lowerMessage.includes('kućišt') || lowerMessage.includes('case') || lowerMessage.includes('dizajn')) {
        category = 'case';
    } else if (lowerMessage.includes('metstrade') || lowerMessage.includes('sajam') || lowerMessage.includes('izložb')) {
        category = 'metstrade';
    } else if (lowerMessage.includes('marketing') || lowerMessage.includes('flyer') || lowerMessage.includes('flajer') || lowerMessage.includes('promo') || lowerMessage.includes('animacij')) {
        category = 'marketing';
    } else if (lowerMessage.includes('website') || lowerMessage.includes('web') || lowerMessage.includes('sajt')) {
        category = 'website';
    }

    // Check for custom categories in message
    Object.keys(CATEGORIES).forEach(catKey => {
        if (lowerMessage.includes(catKey)) {
            category = catKey;
        }
    });

    // Split into multiple tasks if contains "i", "pa", "onda", "zatim"
    const taskSeparators = [
        ' i ',
        ' pa ',
        ' onda ',
        ' zatim ',
        ', i ',
        ', pa ',
        ', onda '
    ];

    let taskDescriptions = [message];
    for (const sep of taskSeparators) {
        if (lowerMessage.includes(sep)) {
            taskDescriptions = message.split(new RegExp(sep, 'gi'));
            break;
        }
    }

    // Create tasks
    const tasksCreated = [];

    for (let desc of taskDescriptions) {
        desc = desc.trim();

        // Clean up description
        desc = desc.replace(/^(treba mi|treba|moram|trebam|hoću|želim|da)\s+/gi, '');
        desc = desc.replace(/\s+(hitno|urgent|odmah|asap|važno|high|kasnije|low)$/gi, '');

        if (desc.length < 3) continue;

        // Capitalize first letter
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: desc,
                    category,
                    priority
                })
            });

            const newTask = await response.json();
            tasks.push(newTask);
            tasksCreated.push(newTask);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    }

    // Generate response
    let response = '';
    if (tasksCreated.length === 0) {
        response = 'Nisam siguran šta tačno treba da uradim. Možeš li da preciziraš? Npr: "Popravi login bug" ili "Testiraj na mobitelu". Takođe možeš kreirati kategoriju: "Kreiraj kategoriju hardware"';
    } else if (tasksCreated.length === 1) {
        response = `Super! Kreirao sam task sa ${priority === 'urgent' ? 'URGENT' : priority.toUpperCase()} prioritetom u ${CATEGORIES[category].name}. Šta još treba?`;
    } else {
        response = `Odlično! Kreirao sam ${tasksCreated.length} taska u ${CATEGORIES[category].name}. Šta još treba da dodamo?`;
    }

    return {
        response,
        tasksCreated,
        categoryCreated
    };
}
