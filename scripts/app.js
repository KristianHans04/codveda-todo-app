/* ============================================
   Level-2-Todo-App — Feature-Rich Task Manager
   CRUD, localStorage, drag-and-drop, priorities,
   due dates, categories, search, undo, stats
   ============================================ */
(function() {
  'use strict';

  // State
  let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];
  let filter = 'all'; // all | active | completed
  let priorityFilter = null; // null | low | medium | high | urgent
  let searchQuery = '';
  let selectedIds = new Set();
  let undoStack = []; // { task, timeout }
  let dragSrcId = null;

  // DOM refs
  const form = document.getElementById('add-form');
  const taskInput = document.getElementById('task-input');
  const prioritySelect = document.getElementById('priority-select');
  const dateInput = document.getElementById('date-input');
  const categoryInput = document.getElementById('category-input');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const bulkBar = document.getElementById('bulk-bar');
  const bulkCount = document.getElementById('bulk-count');
  const toastContainer = document.getElementById('toast-container');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const totalBadge = document.getElementById('total-badge');

  // Stats
  const statTotal = document.getElementById('stat-total');
  const statCompleted = document.getElementById('stat-completed');
  const statPending = document.getElementById('stat-pending');
  const statOverdue = document.getElementById('stat-overdue');

  // Persist
  function save() {
    localStorage.setItem('todo_tasks', JSON.stringify(tasks));
    updateStats();
  }

  // Generate unique ID
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Add Task
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    const task = {
      id: uid(),
      text,
      completed: false,
      priority: prioritySelect.value || 'medium',
      dueDate: dateInput.value || null,
      category: categoryInput.value.trim() || null,
      notes: '',
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    save();
    render();
    taskInput.value = '';
    categoryInput.value = '';
    dateInput.value = '';
    taskInput.focus();
  });

  // Toggle complete
  function toggleComplete(id) {
    const t = tasks.find(t => t.id === id);
    if (t) { t.completed = !t.completed; save(); render(); }
  }

  // Delete with undo
  function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const removed = tasks.splice(idx, 1)[0];
    save();
    render();
    showUndo(removed);
  }

  function showUndo(task) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>Task deleted</span><button class="toast-undo">Undo</button>`;
    toastContainer.appendChild(toast);

    const timeout = setTimeout(() => removeToast(toast), 5000);
    toast.querySelector('.toast-undo').addEventListener('click', () => {
      tasks.unshift(task);
      save();
      render();
      removeToast(toast);
      clearTimeout(timeout);
    });
  }

  function removeToast(el) {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }

  // Edit task text
  function editTask(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    const item = document.querySelector(`[data-id="${id}"]`);
    const textEl = item.querySelector('.task-text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = t.text;
    textEl.replaceWith(input);
    input.focus();
    input.select();

    function finish() {
      const val = input.value.trim();
      if (val) { t.text = val; save(); }
      render();
    }
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish();
      if (e.key === 'Escape') render();
    });
  }

  // Toggle notes
  function toggleNotes(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    const notes = item.querySelector('.task-notes');
    notes.classList.toggle('visible');
    if (notes.classList.contains('visible')) notes.focus();
  }

  function updateNotes(id, value) {
    const t = tasks.find(t => t.id === id);
    if (t) { t.notes = value; save(); }
  }

  // Filters
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filter = tab.dataset.filter;
      render();
    });
  });

  document.querySelectorAll('.priority-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const p = pill.dataset.p;
      if (priorityFilter === p) { priorityFilter = null; pill.classList.remove('active'); }
      else {
        document.querySelectorAll('.priority-pill').forEach(pp => pp.classList.remove('active'));
        pill.classList.add('active');
        priorityFilter = p;
      }
      render();
    });
  });

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase();
    render();
  });

  // Bulk actions
  function updateBulkBar() {
    if (selectedIds.size > 0) {
      bulkBar.classList.add('visible');
      bulkCount.textContent = `${selectedIds.size} selected`;
    } else {
      bulkBar.classList.remove('visible');
    }
  }

  document.getElementById('bulk-complete').addEventListener('click', () => {
    tasks.forEach(t => { if (selectedIds.has(t.id)) t.completed = true; });
    selectedIds.clear(); save(); render(); updateBulkBar();
  });
  document.getElementById('bulk-delete').addEventListener('click', () => {
    tasks = tasks.filter(t => !selectedIds.has(t.id));
    selectedIds.clear(); save(); render(); updateBulkBar();
  });
  document.getElementById('bulk-cancel').addEventListener('click', () => {
    selectedIds.clear(); render(); updateBulkBar();
  });

  // Drag and drop
  function handleDragStart(e) {
    dragSrcId = e.currentTarget.dataset.id;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }
  function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }
  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const targetId = e.currentTarget.dataset.id;
    if (dragSrcId && dragSrcId !== targetId) {
      const srcIdx = tasks.findIndex(t => t.id === dragSrcId);
      const targetIdx = tasks.findIndex(t => t.id === targetId);
      const [moved] = tasks.splice(srcIdx, 1);
      tasks.splice(targetIdx, 0, moved);
      save();
      render();
    }
  }
  function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    dragSrcId = null;
  }

  // Render
  function render() {
    let filtered = [...tasks];
    if (filter === 'active') filtered = filtered.filter(t => !t.completed);
    if (filter === 'completed') filtered = filtered.filter(t => t.completed);
    if (priorityFilter) filtered = filtered.filter(t => t.priority === priorityFilter);
    if (searchQuery) filtered = filtered.filter(t => t.text.toLowerCase().includes(searchQuery) || (t.category && t.category.toLowerCase().includes(searchQuery)));

    taskList.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.classList.add('visible');
    } else {
      emptyState.classList.remove('visible');
      filtered.forEach(task => {
        const el = document.createElement('div');
        el.className = `task-item${task.completed ? ' completed' : ''}`;
        el.dataset.id = task.id;
        el.dataset.priority = task.priority;
        el.draggable = true;

        const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
        let metaHtml = '';
        if (task.priority) metaHtml += `<span class="meta-badge">${task.priority}</span>`;
        if (task.dueDate) metaHtml += `<span class="meta-badge ${isOverdue ? 'overdue' : ''}">${isOverdue ? 'Overdue: ' : ''}${task.dueDate}</span>`;
        if (task.category) metaHtml += `<span class="meta-badge category">${task.category}</span>`;

        el.innerHTML = `
          <div class="task-checkbox" role="checkbox" aria-checked="${task.completed}" tabindex="0">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="task-body">
            <span class="task-text">${escapeHtml(task.text)}</span>
            ${metaHtml ? `<div class="task-meta">${metaHtml}</div>` : ''}
            <textarea class="task-notes ${task.notes ? 'visible' : ''}" placeholder="Add notes...">${escapeHtml(task.notes)}</textarea>
          </div>
          <div class="task-actions">
            <button class="notes-btn" title="Toggle notes" aria-label="Toggle notes">&#9998;</button>
            <button class="edit-btn" title="Edit task" aria-label="Edit task">&#9998;</button>
            <button class="delete-btn" title="Delete task" aria-label="Delete task">&times;</button>
          </div>
        `;

        // Events
        el.querySelector('.task-checkbox').addEventListener('click', () => toggleComplete(task.id));
        el.querySelector('.task-checkbox').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleComplete(task.id); }});
        el.querySelector('.edit-btn').addEventListener('click', () => editTask(task.id));
        el.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
        el.querySelector('.notes-btn').addEventListener('click', () => toggleNotes(task.id));
        el.querySelector('.task-notes').addEventListener('input', (e) => updateNotes(task.id, e.target.value));

        // Long press for bulk select
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (selectedIds.has(task.id)) selectedIds.delete(task.id);
          else selectedIds.add(task.id);
          el.classList.toggle('selected');
          updateBulkBar();
        });

        // Drag
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragover', handleDragOver);
        el.addEventListener('dragleave', handleDragLeave);
        el.addEventListener('drop', handleDrop);
        el.addEventListener('dragend', handleDragEnd);

        taskList.appendChild(el);
      });
    }
    updateBulkBar();
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()).length;
    statTotal.textContent = total;
    statCompleted.textContent = completed;
    statPending.textContent = pending;
    statOverdue.textContent = overdue;
    totalBadge.textContent = total;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Footer actions
  document.getElementById('clear-completed').addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    save(); render();
  });
  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tasks.json'; a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('import-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) { tasks = imported; save(); render(); }
        } catch { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Don't trigger if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); taskInput.focus(); }
    if (e.key === '?') { shortcutsModal.classList.toggle('active'); }
    if (e.key === 'Escape') { shortcutsModal.classList.remove('active'); }
  });
  document.getElementById('close-shortcuts').addEventListener('click', () => {
    shortcutsModal.classList.remove('active');
  });

  // Init
  render();
  updateStats();
})();
