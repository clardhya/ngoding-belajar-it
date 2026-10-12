// ============================================================
// Todo List App — app.js
// Pola MVC sederhana, vanilla JS, tanpa dependensi eksternal
// ============================================================

// ===== STATE =====
var tasks = [];
var STORAGE_KEY = 'todo-list-tasks';
var MAX_TASKS = 100;
var MAX_TEXT_LENGTH = 200;

// ===== UTILITY =====

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9);
}

// ===== VALIDATION =====

function validateTaskText(text) {
  var trimmed = text.trim();
  if (trimmed.length === 0) {
    return 'Tugas tidak boleh kosong.';
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return 'Tugas tidak boleh melebihi 200 karakter.';
  }
  return null;
}

function isTaskListFull() {
  return tasks.length >= MAX_TASKS;
}

// ===== MODEL =====

function addTask(text) {
  var errorMsg = validateTaskText(text);
  if (errorMsg !== null) {
    throw new Error(errorMsg);
  }
  if (isTaskListFull()) {
    throw new Error('Batas maksimum 100 tugas telah tercapai.');
  }
  var task = {
    id: generateId(),
    text: text.trim(),
    completed: false
  };
  tasks.push(task);
  return task;
}

function toggleTask(id) {
  var task = tasks.find(function(t) { return t.id === id; });
  if (!task) {
    throw new Error('Task tidak ditemukan: ' + id);
  }
  task.completed = !task.completed;
}

function deleteTask(id) {
  var index = tasks.findIndex(function(t) { return t.id === id; });
  if (index === -1) {
    throw new Error('Task tidak ditemukan: ' + id);
  }
  tasks.splice(index, 1);
}

// ===== PERSISTENCE =====

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Tidak dapat menyimpan ke localStorage:', e);
  }
}

function loadTasks() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      tasks = [];
      return;
    }
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      tasks = [];
      return;
    }
    tasks = parsed.filter(function(item) {
      return (
        item !== null &&
        typeof item === 'object' &&
        typeof item.id === 'string' && item.id.length > 0 &&
        typeof item.text === 'string' &&
        typeof item.completed === 'boolean'
      );
    });
  } catch (e) {
    tasks = [];
  }
}

// ===== VIEW =====

function render() {
  var list = document.getElementById('task-list');
  var emptyMsg = document.getElementById('empty-msg');

  // Bersihkan list
  list.innerHTML = '';

  if (tasks.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  tasks.forEach(function(task) {
    var li = document.createElement('li');
    li.setAttribute('data-id', task.id);

    // Checkbox
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'toggle-' + task.id;
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Tandai selesai: ' + task.text);

    // Label (task text)
    var label = document.createElement('label');
    label.setAttribute('for', 'toggle-' + task.id);
    label.className = 'task-text' + (task.completed ? ' completed' : '');
    label.textContent = task.text;

    // Tombol hapus
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', 'Hapus tugas: ' + task.text);
    deleteBtn.textContent = 'Hapus';

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function showError(message) {
  var errorEl = document.getElementById('error-msg');
  errorEl.textContent = message;
}

function clearError() {
  var errorEl = document.getElementById('error-msg');
  errorEl.textContent = '';
}

// ===== CONTROLLER =====

document.addEventListener('DOMContentLoaded', function() {
  var taskInput = document.getElementById('task-input');
  var addBtn = document.getElementById('add-btn');
  var taskList = document.getElementById('task-list');

  // Muat data dari localStorage lalu render
  loadTasks();
  render();

  // Tambah task: klik tombol
  addBtn.addEventListener('click', function() {
    handleAddTask();
  });

  // Tambah task: tekan Enter
  taskInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  });

  // Bersihkan error saat user mulai mengetik
  taskInput.addEventListener('input', function() {
    clearError();
  });

  // Event delegation pada task list (toggle & hapus)
  taskList.addEventListener('click', function(e) {
    var target = e.target;
    var li = target.closest('li[data-id]');
    if (!li) return;
    var id = li.getAttribute('data-id');

    // Klik checkbox → toggle
    if (target.type === 'checkbox') {
      try {
        toggleTask(id);
        saveTasks();
        render();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Klik tombol hapus
    if (target.classList.contains('delete-btn')) {
      var confirmed = window.confirm('Hapus tugas ini?');
      if (confirmed) {
        try {
          deleteTask(id);
          saveTasks();
          render();
        } catch (err) {
          console.error(err);
        }
      }
      return;
    }
  });
});

function handleAddTask() {
  var taskInput = document.getElementById('task-input');
  var text = taskInput.value;

  clearError();

  try {
    addTask(text);
    saveTasks();
    render();
    // Kosongkan input dalam <=100ms (sinkron, langsung)
    taskInput.value = '';
    taskInput.focus();
  } catch (err) {
    showError(err.message);
  }
}
