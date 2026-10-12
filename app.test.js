// app.test.js — entry point untuk pengujian
import { describe, test, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  validateTaskText,
  isTaskListFull,
  addTask,
  toggleTask,
  deleteTask,
  saveTasks,
  loadTasks,
  getTasks,
  setTasks,
} from './app.js';

// ---------------------------------------------------------------------------
// localStorage mock (in-memory, no browser needed)
// ---------------------------------------------------------------------------
function createLocalStorageMock() {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

// ---------------------------------------------------------------------------
// saveTasks / loadTasks — unit tests (Requirements 4.1 – 4.6)
// ---------------------------------------------------------------------------
describe('LocalStorage handling', () => {
  let storage;

  beforeEach(() => {
    storage = createLocalStorageMock();
    vi.stubGlobal('localStorage', storage);
    setTasks([]);
  });

  // Req 4.1 — saveTasks persists tasks to localStorage
  test('saveTasks stores tasks under "todo-list-tasks" key', () => {
    addTask('Belajar JavaScript');
    saveTasks();
    const raw = storage.getItem('todo-list-tasks');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toBe('Belajar JavaScript');
  });

  // Req 4.2 — saveTasks serialises every task field correctly
  test('saveTasks serialises id, text, and completed for each task', () => {
    addTask('Task A');
    addTask('Task B');
    getTasks()[0].completed = true; // manually mark first as done
    saveTasks();
    const parsed = JSON.parse(storage.getItem('todo-list-tasks'));
    expect(typeof parsed[0].id).toBe('string');
    expect(parsed[0].text).toBe('Task A');
    expect(parsed[0].completed).toBe(true);
    expect(parsed[1].completed).toBe(false);
  });

  // Req 4.3 — saveTasks does not throw when localStorage is unavailable
  test('saveTasks logs a warning and does not throw when localStorage is unavailable', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new Error('Storage full'); },
      getItem: () => null,
    });
    expect(() => saveTasks()).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // Req 4.4 — loadTasks restores tasks in original order
  test('loadTasks restores tasks in original insertion order', () => {
    addTask('First');
    addTask('Second');
    addTask('Third');
    saveTasks();
    setTasks([]); // reset in-memory state
    loadTasks();
    const loaded = getTasks();
    expect(loaded.map(t => t.text)).toEqual(['First', 'Second', 'Third']);
  });

  // Req 4.5 — loadTasks returns [] when key does not exist
  test('loads empty array when key does not exist', () => {
    loadTasks();
    expect(getTasks()).toEqual([]);
  });

  // Req 4.5 — loadTasks returns [] when value is null
  test('loads empty array when stored value is null', () => {
    storage.setItem('todo-list-tasks', null);
    // getItem will return the string "null"; override to return actual null
    storage.getItem = () => null;
    loadTasks();
    expect(getTasks()).toEqual([]);
  });

  // Req 4.5 — loadTasks returns [] when JSON is malformed
  test('loads empty array when JSON is malformed', () => {
    storage.setItem('todo-list-tasks', '{ not valid json }');
    loadTasks();
    expect(getTasks()).toEqual([]);
  });

  // Req 4.5 — loadTasks returns [] when value is a non-array JSON value
  test('loads empty array when stored value is not a JSON array', () => {
    storage.setItem('todo-list-tasks', JSON.stringify({ id: '1', text: 'x', completed: false }));
    loadTasks();
    expect(getTasks()).toEqual([]);
  });

  // Req 4.6 — loadTasks skips corrupted items but keeps valid ones
  test('skips corrupted task items but keeps valid ones', () => {
    const mixed = [
      { id: 'a1', text: 'Valid task', completed: false },
      { text: 'Missing id', completed: false },           // no id
      { id: '', text: 'Empty id', completed: false },    // empty id
      { id: 'b2', completed: true },                      // no text
      { id: 'c3', text: 'Missing completed' },            // no completed
      { id: 'd4', text: 'Also valid', completed: true },
    ];
    storage.setItem('todo-list-tasks', JSON.stringify(mixed));
    loadTasks();
    const loaded = getTasks();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('a1');
    expect(loaded[1].id).toBe('d4');
  });
});

// ─── Task 2.1: validateTaskText unit tests (Requirements 1.4) ───────────────

describe('validateTaskText', () => {
  test('returns error for empty string', () => {
    expect(validateTaskText('')).toBe('Tugas tidak boleh kosong.');
  });

  test('returns error for string with only spaces', () => {
    expect(validateTaskText('   ')).toBe('Tugas tidak boleh kosong.');
  });

  test('returns error for string with only tabs and newlines', () => {
    expect(validateTaskText('\t\n')).toBe('Tugas tidak boleh kosong.');
  });

  test('returns error for null gracefully', () => {
    expect(validateTaskText(null)).toBe('Tugas tidak boleh kosong.');
  });

  test('returns error for undefined gracefully', () => {
    expect(validateTaskText(undefined)).toBe('Tugas tidak boleh kosong.');
  });

  test('returns error for text longer than 200 characters', () => {
    expect(validateTaskText('a'.repeat(201))).toBe('Tugas tidak boleh melebihi 200 karakter.');
  });

  test('returns null for text exactly at the 200-character limit', () => {
    expect(validateTaskText('a'.repeat(200))).toBeNull();
  });

  test('returns null for a single valid character', () => {
    expect(validateTaskText('a')).toBeNull();
  });

  test('returns null for normal valid text', () => {
    expect(validateTaskText('Belajar JavaScript')).toBeNull();
  });

  test('trims whitespace before checking: "  hello  " is valid', () => {
    expect(validateTaskText('  hello  ')).toBeNull();
  });

  test('leading/trailing whitespace counted out — "  " + 200 chars is still trimmed to 200 and valid', () => {
    expect(validateTaskText('  ' + 'a'.repeat(200) + '  ')).toBeNull();
  });
});

// ─── Task 2.1: isTaskListFull unit tests (Requirements 1.6) ─────────────────

describe('isTaskListFull', () => {
  beforeEach(() => {
    setTasks([]);
  });

  test('returns false when tasks array is empty', () => {
    expect(isTaskListFull()).toBe(false);
  });

  test('returns false when tasks has 99 items', () => {
    setTasks(Array.from({ length: 99 }, (_, i) => ({ id: String(i), text: `Task ${i}`, completed: false })));
    expect(isTaskListFull()).toBe(false);
  });

  test('returns true when tasks has exactly 100 items', () => {
    setTasks(Array.from({ length: 100 }, (_, i) => ({ id: String(i), text: `Task ${i}`, completed: false })));
    expect(isTaskListFull()).toBe(true);
  });

  test('returns true when tasks has more than 100 items', () => {
    setTasks(Array.from({ length: 105 }, (_, i) => ({ id: String(i), text: `Task ${i}`, completed: false })));
    expect(isTaskListFull()).toBe(true);
  });
});
