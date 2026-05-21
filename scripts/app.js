/**
 * app.js — Todo App with CRUD, localStorage persistence, and filtering.
 *
 * State shape: Array<{ id: string, text: string, completed: boolean }>
 * Uses crypto.randomUUID() for task IDs (unpredictable, no sequential ints).
 * Event delegation on the task list container for edit/delete/toggle.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'codveda-todo-tasks';

  // --- State ---
  var tasks = loadTasks();
  var currentFilter = 'all'; // 'all' | 'active' | 'completed'

  // --- DOM References ---
  var form = document.getElementById('add-form');
  var input = document.getElementById('task-input');
  var taskList = document.getElementById('task-list');
  var emptyState = document.getElementById('empty-state');
  var tabAll = document.getElementById('tab-all');
  var tabActive = document.getElementById('tab-active');
  var tabCompleted = document.getElementById('tab-completed');
  var countAll = document.getElementById('count-all');
  var countActive = document.getElementById('count-active');
  var countCompleted = document.getElementById('count-completed');
  var statsLeft = document.getElementById('stats-left');
  var clearBtn = document.getElementById('clear-completed');

  // --- localStorage ---
  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      // Storage full or unavailable — degrade gracefully
    }
  }

  // --- Unique ID ---
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  // --- CRUD ---
  function addTask(text) {
    var trimmed = text.trim();
    if (!trimmed) return;
    tasks.push({ id: generateId(), text: trimmed, completed: false });
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveTasks();
    render();
  }

  function toggleTask(id) {
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        tasks[i].completed = !tasks[i].completed;
        break;
      }
    }
    saveTasks();
    render();
  }

  function updateTask(id, newText) {
    var trimmed = newText.trim();
    if (!trimmed) { deleteTask(id); return; }
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        tasks[i].text = trimmed;
        break;
      }
    }
    saveTasks();
    render();
  }

  function clearCompleted() {
    tasks = tasks.filter(function (t) { return !t.completed; });
    saveTasks();
    render();
  }

  // --- Filtering ---
  function getFiltered() {
    if (currentFilter === 'active') return tasks.filter(function (t) { return !t.completed; });
    if (currentFilter === 'completed') return tasks.filter(function (t) { return t.completed; });
    return tasks;
  }

  // --- Render ---
  function render() {
    var filtered = getFiltered();

    // Counts
    var activeCount = tasks.filter(function (t) { return !t.completed; }).length;
    var completedCount = tasks.filter(function (t) { return t.completed; }).length;
    countAll.textContent = tasks.length;
    countActive.textContent = activeCount;
    countCompleted.textContent = completedCount;
    statsLeft.textContent = activeCount + ' item' + (activeCount !== 1 ? 's' : '') + ' left';

    // Filter tabs
    [tabAll, tabActive, tabCompleted].forEach(function (tab) { tab.classList.remove('active'); });
    if (currentFilter === 'all') tabAll.classList.add('active');
    else if (currentFilter === 'active') tabActive.classList.add('active');
    else tabCompleted.classList.add('active');

    // Empty state
    if (filtered.length === 0) {
      taskList.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    // Build task items
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var t = filtered[i];
      var cls = 'task-item' + (t.completed ? ' completed' : '');
      html += '<div class="' + cls + '" data-id="' + t.id + '">';
      html += '  <button class="task-check" aria-label="Toggle completion" data-action="toggle">';
      html += '    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>';
      html += '  </button>';
      html += '  <span class="task-text" data-action="edit">' + escapeHtml(t.text) + '</span>';
      html += '  <div class="task-actions">';
      html += '    <button class="edit-btn" aria-label="Edit task" data-action="edit-start">';
      html += '      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"/></svg>';
      html += '    </button>';
      html += '    <button class="delete-btn" aria-label="Delete task" data-action="delete">';
      html += '      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>';
      html += '    </button>';
      html += '  </div>';
      html += '</div>';
    }
    taskList.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Event Delegation on Task List ---
  taskList.addEventListener('click', function (e) {
    var actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;

    var taskItem = actionEl.closest('.task-item');
    if (!taskItem) return;
    var id = taskItem.getAttribute('data-id');
    var action = actionEl.getAttribute('data-action');

    if (action === 'toggle') {
      toggleTask(id);
    } else if (action === 'delete') {
      deleteTask(id);
    } else if (action === 'edit-start' || action === 'edit') {
      startInlineEdit(taskItem, id);
    }
  });

  function startInlineEdit(taskItem, id) {
    var span = taskItem.querySelector('.task-text');
    if (!span) return;

    var currentText = '';
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) { currentText = tasks[i].text; break; }
    }

    var editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-text editing';
    editInput.value = currentText;
    span.replaceWith(editInput);
    editInput.focus();
    editInput.select();

    function commit() {
      updateTask(id, editInput.value);
    }

    editInput.addEventListener('blur', commit);
    editInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { render(); }
    });
  }

  // --- Filter Tab Clicks ---
  tabAll.addEventListener('click', function () { currentFilter = 'all'; render(); });
  tabActive.addEventListener('click', function () { currentFilter = 'active'; render(); });
  tabCompleted.addEventListener('click', function () { currentFilter = 'completed'; render(); });

  // --- Clear Completed ---
  clearBtn.addEventListener('click', clearCompleted);

  // --- Add Form ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  // --- Initial Render ---
  render();
})();
