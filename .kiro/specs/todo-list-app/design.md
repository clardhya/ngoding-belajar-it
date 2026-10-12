# Design Document: Todo-List App

## Overview

Aplikasi To-Do List adalah single-page web application yang berjalan sepenuhnya di browser. Tidak ada server-side, tidak ada dependensi eksternal — hanya HTML, CSS, dan JavaScript vanilla. State aplikasi disimpan di `localStorage` sehingga data tetap ada setelah halaman ditutup atau di-refresh.

Tujuan desain utama:

- **Simplicity**: Satu file HTML, satu file CSS, satu file JS — tidak perlu build tool atau bundler.
- **Reliability**: Setiap mutasi state (tambah, toggle, hapus) langsung dipersistensikan ke `localStorage`.
- **Accessibility**: Semua elemen interaktif memiliki accessible name yang valid.
- **Correctness**: Serialisasi dan deserialisasi Task harus round-trip tanpa kehilangan data.

---

## Architecture

Aplikasi mengikuti pola **Model-View-Controller (MVC)** sederhana yang diimplementasikan dalam satu file JavaScript:

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐ │
│  │   View   │◄───│Controller│───►│   Model    │ │
│  │  (DOM)   │    │  (JS)    │    │   (State)  │ │
│  └──────────┘    └──────────┘    └────────────┘ │
│                                        │         │
│                                  ┌─────▼──────┐  │
│                                  │LocalStorage│  │
│                                  └────────────┘  │
└─────────────────────────────────────────────────┘
```

**Model**: Array of `Task` objects yang dikelola di memory dan disinkronkan ke `localStorage`.

**View**: Fungsi `render()` yang me-rebuild DOM Task_List dari state terbaru. Pendekatan ini sederhana dan menghindari kompleksitas diffing.

**Controller**: Event listeners yang menangani input pengguna, memvalidasi, memanggil Model, lalu memanggil View.

---

## Components and Interfaces

### File Structure

```
todo-list-app/
├── index.html      — Struktur halaman, referensi ke CSS dan JS
├── style.css       — Seluruh styling aplikasi
└── app.js          — Seluruh logika aplikasi (Model + Controller + View)
```

### HTML Structure (`index.html`)

```html
<div id="app">
  <h1>Todo List</h1>

  <!-- Input Area -->
  <div id="input-area">
    <label for="task-input">Tugas baru</label>
    <input
      type="text"
      id="task-input"
      aria-label="Tugas baru"
      maxlength="200"
      placeholder="Tambahkan tugas baru..."
    />
    <button id="add-btn" aria-label="Tambah tugas">Tambah</button>
    <p id="error-msg" role="alert" aria-live="polite"></p>
  </div>

  <!-- Task List -->
  <ul id="task-list" aria-label="Daftar tugas" role="list"></ul>

  <!-- Empty State -->
  <p id="empty-msg">Belum ada tugas. Tambahkan tugas pertama kamu!</p>
</div>
```

Setiap Task item di-render secara dinamis oleh `app.js` dengan struktur:

```html
<li data-id="{id}">
  <input
    type="checkbox"
    id="toggle-{id}"
    aria-label="Tandai selesai: {text}"
    [checked]
  />
  <label for="toggle-{id}" class="task-text [completed]">{text}</label>
  <button aria-label="Hapus tugas: {text}">Hapus</button>
</li>
```

### JavaScript API (`app.js`)

#### State Management

```javascript
// State global
let tasks = [];  // Task[]

// Memuat state dari localStorage ke memory
function loadTasks(): void

// Menyimpan state dari memory ke localStorage
function saveTasks(): void
```

#### Task Operations

```javascript
// Membuat Task baru; melempar error jika input tidak valid atau list penuh
function addTask(text: string): Task

// Mengubah status selesai Task; melempar error jika id tidak ditemukan
function toggleTask(id: string): void

// Menghapus Task dari list; melempar error jika id tidak ditemukan
function deleteTask(id: string): void
```

#### Validation

```javascript
// Mengembalikan string error atau null jika valid
function validateTaskText(text: string): string | null

// Mengecek apakah task list sudah penuh (>= 100)
function isTaskListFull(): boolean
```

#### View

```javascript
// Merender ulang seluruh Task_List ke DOM
function render(): void

// Menampilkan atau menyembunyikan pesan error
function showError(message: string): void
function clearError(): void
```

#### ID Generation

```javascript
// Menghasilkan unique ID menggunakan crypto.randomUUID() dengan fallback ke Date.now()
function generateId(): string
```

---

## Data Models

### Task

```javascript
/**
 * @typedef {Object} Task
 * @property {string}  id        — Unique identifier (UUID atau timestamp string)
 * @property {string}  text      — Deskripsi tugas, sudah di-trim, 1–200 karakter
 * @property {boolean} completed — true jika tugas sudah selesai
 */
```

**Contoh:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "text": "Belajar JavaScript",
  "completed": false
}
```

### LocalStorage Schema

```
key:   "todo-list-tasks"
value: JSON.stringify(Task[])
```

**Contoh nilai tersimpan:**
```json
[
  {"id":"abc123","text":"Belajar JavaScript","completed":false},
  {"id":"def456","text":"Buat portfolio","completed":true}
]
```

**Error handling saat load:**
- `localStorage` tidak memiliki key → kembalikan `[]`
- Nilai `null` → kembalikan `[]`
- String yang tidak bisa di-parse sebagai JSON → kembalikan `[]`, jangan throw error
- Array valid tetapi item tidak memiliki field wajib → skip item yang rusak, lanjutkan dengan item valid

### Validation Rules

| Field     | Constraint                                      |
|-----------|-------------------------------------------------|
| `text`    | Setelah di-trim: panjang 1–200 karakter         |
| `id`      | Non-empty string, unik di dalam Task_List       |
| `completed` | Boolean                                       |
| Task_List | Maksimal 100 Task                               |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Serialisasi Task adalah Round-Trip

*For any* valid Task object (dengan id non-empty, text 1–200 karakter, completed boolean), menyerialisasi Task tersebut ke JSON dan kemudian mendeserialisasinya kembali harus menghasilkan Task dengan nilai `id`, `text`, dan `completed` yang identik dengan Task aslinya.

**Validates: Requirements 4.6**

---

### Property 2: Menambah Task yang Valid Menambah Panjang List

*For any* Task_List dengan panjang N (0 ≤ N < 100) dan string teks valid (setelah di-trim panjangnya 1–200 karakter), memanggil `addTask(text)` harus menghasilkan Task_List dengan panjang N+1.

**Validates: Requirements 1.2**

---

### Property 3: Input Whitespace Ditolak

*For any* string yang seluruhnya terdiri dari karakter whitespace (spasi, tab, newline), memanggil `addTask(text)` harus ditolak — `validateTaskText` mengembalikan pesan error, dan panjang Task_List tidak berubah.

**Validates: Requirements 1.4**

---

### Property 4: Toggle Dua Arah Mengembalikan Status Semula

*For any* Task dengan status `completed` awal S, melakukan toggle dua kali berturut-turut (toggle → toggle) harus mengembalikan status `completed` Task tersebut ke nilai S yang semula.

**Validates: Requirements 2.2, 2.3**

---

### Property 5: Task yang Ditambahkan Tersimpan di LocalStorage

*For any* string teks valid, setelah memanggil `addTask(text)` dan `saveTasks()`, membaca dan mem-parse nilai dari `localStorage["todo-list-tasks"]` harus menghasilkan array yang mengandung Task dengan teks yang sama.

**Validates: Requirements 4.1**

---

### Property 6: Menambah Task Lebih dari 100 Ditolak

*For any* Task_List yang sudah memiliki 100 Task, mencoba memanggil `addTask(text)` dengan teks valid harus ditolak — fungsi mengembalikan error, dan panjang Task_List tetap 100.

**Validates: Requirements 1.6, 1.7**

---

### Property 7: Urutan Task Dipertahankan Setelah Round-Trip Storage

*For any* Task_List dengan urutan Task tertentu, menyimpan ke `localStorage` lalu membacanya kembali harus menghasilkan array Task dengan urutan yang identik (Task pertama tetap di indeks 0, dst.).

**Validates: Requirements 4.4, 5.3**

---

## Error Handling

### Validasi Input (Requirement 1.4, 1.7)

| Kondisi Error                          | Pesan yang Ditampilkan                                      |
|----------------------------------------|-------------------------------------------------------------|
| Input kosong / hanya whitespace        | "Tugas tidak boleh kosong."                                 |
| Input > 200 karakter                   | "Tugas tidak boleh melebihi 200 karakter."                  |
| Task_List sudah mencapai 100 Task      | "Batas maksimum 100 tugas telah tercapai."                  |

Pesan error ditampilkan di elemen `#error-msg` dengan `role="alert"` dan `aria-live="polite"` agar screen reader mengumumkannya. Error dibersihkan otomatis ketika pengguna berhasil menambah task atau mulai mengetik kembali.

### LocalStorage Errors (Requirement 4.5)

- `JSON.parse` gagal → catch exception, kembalikan `[]`, tidak ada pesan error ke user
- `localStorage` tidak tersedia (misal: private mode penuh) → catch exception, aplikasi tetap berjalan dengan state in-memory saja, tampilkan warning di console

### Dialog Konfirmasi Hapus (Requirement 3.4, 3.5)

Menggunakan `window.confirm()` native browser:
- User klik "OK" → lanjutkan hapus
- User klik "Cancel" → batalkan, task tetap ada

Ini menghindari kebutuhan modal kustom tanpa library eksternal.

---

## Testing Strategy

### Dual Testing Approach

Pengujian menggunakan dua lapis:
1. **Unit tests** — verifikasi contoh spesifik, edge case, dan kondisi error
2. **Property-based tests** — verifikasi properti universal dengan input yang di-generate secara acak (minimum 100 iterasi per properti)

### Property-Based Testing Library

Gunakan **[fast-check](https://github.com/dubzzz/fast-check)** — library PBT untuk JavaScript/TypeScript yang mature dan tidak memerlukan TypeScript. Dapat dijalankan di Node.js tanpa framework.

**Instalasi (dev only):**
```bash
npm install --save-dev fast-check vitest
```

### Property Tests

Setiap property test di bawah mereference properti dari Correctness Properties section di atas.

```javascript
// Tag format: Feature: todo-list-app, Property {N}: {property_text}

import fc from 'fast-check';
import { addTask, toggleTask, saveTasks, loadTasks } from './app.js';

// Feature: todo-list-app, Property 1: Serialisasi Task adalah Round-Trip
test('task serialization round-trip', () => {
  fc.assert(fc.property(
    fc.record({
      id: fc.uuid(),
      text: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
      completed: fc.boolean(),
    }),
    (task) => {
      const serialized = JSON.stringify(task);
      const deserialized = JSON.parse(serialized);
      expect(deserialized.id).toBe(task.id);
      expect(deserialized.text).toBe(task.text);
      expect(deserialized.completed).toBe(task.completed);
    }
  ), { numRuns: 100 });
});

// Feature: todo-list-app, Property 2: Menambah Task yang Valid Menambah Panjang List
test('addTask grows list by 1', () => {
  fc.assert(fc.property(
    fc.array(validTaskArb, { maxLength: 99 }),
    fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length >= 1),
    (initialTasks, text) => {
      const state = [...initialTasks];
      const result = addTask(state, text);
      expect(result.length).toBe(state.length + 1);
    }
  ), { numRuns: 100 });
});

// Feature: todo-list-app, Property 3: Input Whitespace Ditolak
test('whitespace-only input is rejected', () => {
  fc.assert(fc.property(
    fc.string().filter(s => s.trim().length === 0),
    (whitespaceText) => {
      expect(validateTaskText(whitespaceText)).not.toBeNull();
    }
  ), { numRuns: 100 });
});

// Feature: todo-list-app, Property 4: Toggle Dua Arah Mengembalikan Status Semula
test('double toggle restores original status', () => {
  fc.assert(fc.property(
    fc.boolean(),
    (initialCompleted) => {
      const task = { id: '1', text: 'Test', completed: initialCompleted };
      const afterFirst = { ...task, completed: !task.completed };
      const afterSecond = { ...afterFirst, completed: !afterFirst.completed };
      expect(afterSecond.completed).toBe(initialCompleted);
    }
  ), { numRuns: 100 });
});

// Feature: todo-list-app, Property 6: Menambah Task Lebih dari 100 Ditolak
test('addTask rejects when list is full (100 tasks)', () => {
  fc.assert(fc.property(
    fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length >= 1),
    (text) => {
      const fullList = Array.from({ length: 100 }, (_, i) => ({
        id: String(i), text: `Task ${i}`, completed: false
      }));
      expect(() => addTask(fullList, text)).toThrow();
    }
  ), { numRuns: 100 });
});
```

### Unit Tests

```javascript
// Edge cases dan integrasi yang tidak dicakup property tests

describe('LocalStorage handling', () => {
  test('loads empty array when key does not exist', () => { ... });
  test('loads empty array when value is null', () => { ... });
  test('loads empty array when JSON is malformed', () => { ... });
  test('skips corrupted task items but keeps valid ones', () => { ... });
});

describe('Confirmation dialog', () => {
  test('cancel confirmation keeps task in list', () => { ... });
  test('confirm confirmation removes task from list', () => { ... });
});

describe('UI rendering', () => {
  test('empty state message shown when no tasks', () => { ... });
  test('empty state message hidden when tasks exist', () => { ... });
  test('task order preserved (first added = first in DOM)', () => { ... });
  test('completed task text has strikethrough class', () => { ... });
});

describe('Accessibility', () => {
  test('task-input has accessible name via label', () => { ... });
  test('add-btn has aria-label', () => { ... });
  test('each toggle has aria-label referencing task text', () => { ... });
  test('each delete button has aria-label referencing task text', () => { ... });
});
```

### Test Runner Command

```bash
# Single run (non-watch mode)
npx vitest --run
```
