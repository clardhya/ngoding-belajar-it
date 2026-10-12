# Implementation Plan: Todo-List App

## Overview

Implementasi aplikasi To-Do List berbasis HTML, CSS, dan JavaScript vanilla menggunakan pola MVC sederhana. Tiga file utama: `index.html`, `style.css`, dan `app.js`. State disimpan di `localStorage` dan dirender ulang setiap kali ada mutasi.

## Tasks

- [x] 1. Buat struktur file proyek dan setup pengujian
  - [x] 1.1 Buat file `index.html` dengan struktur HTML dasar
    - Buat elemen `#app`, `#input-area` (label, input, tombol, `#error-msg`), `#task-list`, dan `#empty-msg`
    - Pasang atribut aksesibilitas: `for`/`id` pada label-input, `aria-label` pada tombol, `role="alert"` dan `aria-live="polite"` pada `#error-msg`
    - Referensikan `style.css` dan `app.js` dari file ini
    - _Requirements: 1.1, 5.1, 5.2, 5.4_

  - [x] 1.2 Buat file `style.css` dengan styling dasar
    - Style untuk layout halaman, `#input-area`, `#task-list`, item task, status selesai (strikethrough), tombol, pesan error, dan empty state
    - _Requirements: 2.4, 5.1_

  - [x] 1.3 Inisialisasi `app.js` dengan state global dan fungsi utilitas
    - Deklarasikan `let tasks = []` sebagai state global
    - Implementasikan `generateId()` menggunakan `crypto.randomUUID()` dengan fallback ke `Date.now().toString()`
    - _Requirements: 4.6_

  - [x] 1.4 Setup proyek Node.js dan install dev dependencies untuk pengujian
    - Jalankan `npm init -y` lalu `npm install --save-dev fast-check vitest`
    - Tambahkan script `"test": "vitest --run"` di `package.json`
    - Buat file `app.test.js` sebagai entry point pengujian
    - _Requirements: (Testing infrastructure)_

- [x] 2. Implementasi Model: validasi, operasi task, dan persistensi
  - [x] 2.1 Implementasikan `validateTaskText(text)` dan `isTaskListFull()`
    - `validateTaskText`: trim input, kembalikan pesan error string jika kosong/hanya whitespace, lebih dari 200 karakter, atau `null` jika valid
    - `isTaskListFull`: kembalikan `true` jika `tasks.length >= 100`
    - _Requirements: 1.4, 1.6_

  - [ ]* 2.2 Tulis property test untuk `validateTaskText` — Property 3
    - **Property 3: Input Whitespace Ditolak**
    - **Validates: Requirements 1.4**
    - Gunakan `fc.string().filter(s => s.trim().length === 0)` sebagai arbitrary
    - Pastikan `validateTaskText(whitespaceText)` tidak mengembalikan `null`

  - [x] 2.3 Implementasikan `addTask(text)`, `toggleTask(id)`, dan `deleteTask(id)`
    - `addTask`: validasi teks dan cek kapasitas, buat Task baru dengan `generateId()`, push ke `tasks`, kembalikan Task; lempar `Error` jika tidak valid atau list penuh
    - `toggleTask`: temukan Task by `id`, balik nilai `completed`; lempar `Error` jika tidak ditemukan
    - `deleteTask`: temukan Task by `id`, hapus dari array; lempar `Error` jika tidak ditemukan
    - _Requirements: 1.2, 1.4, 1.6, 1.7, 2.2, 2.3, 3.2_

  - [ ]* 2.4 Tulis property test untuk `addTask` — Property 2 dan Property 6
    - **Property 2: Menambah Task yang Valid Menambah Panjang List**
    - **Validates: Requirements 1.2**
    - **Property 6: Menambah Task Lebih dari 100 Ditolak**
    - **Validates: Requirements 1.6, 1.7**
    - Gunakan `fc.array` dengan `maxLength: 99` untuk Property 2; array 100 item untuk Property 6

  - [ ]* 2.5 Tulis property test untuk `toggleTask` — Property 4
    - **Property 4: Toggle Dua Arah Mengembalikan Status Semula**
    - **Validates: Requirements 2.2, 2.3**
    - Gunakan `fc.boolean()` sebagai arbitrary untuk status awal

  - [x] 2.6 Implementasikan `saveTasks()` dan `loadTasks()`
    - `saveTasks`: `JSON.stringify(tasks)` ke key `"todo-list-tasks"` di `localStorage`; catch exception jika `localStorage` tidak tersedia (log warning ke console)
    - `loadTasks`: baca dari `localStorage`, parse JSON; kembalikan `[]` jika key tidak ada, nilai `null`, atau JSON tidak valid; skip item yang tidak memiliki field wajib (`id`, `text`, `completed`)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 2.7 Tulis property test untuk serialisasi Task — Property 1 dan Property 7
    - **Property 1: Serialisasi Task adalah Round-Trip**
    - **Validates: Requirements 4.6**
    - **Property 7: Urutan Task Dipertahankan Setelah Round-Trip Storage**
    - **Validates: Requirements 4.4, 5.3**
    - Gunakan `fc.record` dengan `fc.uuid()`, `fc.string`, dan `fc.boolean()` sebagai arbitrary

  - [ ]* 2.8 Tulis property test untuk `addTask` + `saveTasks` + `loadTasks` — Property 5
    - **Property 5: Task yang Ditambahkan Tersimpan di LocalStorage**
    - **Validates: Requirements 4.1**
    - Mock `localStorage` atau gunakan implementasi in-memory untuk pengujian ini

- [x] 3. Checkpoint — Pastikan semua unit model lulus
  - Jalankan `npm test` dan pastikan semua tes di tahap 2 lulus sebelum melanjutkan ke View dan Controller.
  - Tanyakan ke user jika ada pertanyaan atau hambatan.

- [x] 4. Implementasi View: fungsi render dan pesan UI
  - [x] 4.1 Implementasikan `render()`, `showError(message)`, dan `clearError()`
    - `render`: bersihkan `#task-list`, iterasi `tasks`, buat elemen `<li>` per Task dengan checkbox (`id="toggle-{id}"`, `aria-label="Tandai selesai: {text}"`), label (class `completed` jika selesai → CSS strikethrough), dan tombol hapus (`aria-label="Hapus tugas: {text}"`); tampilkan/sembunyikan `#empty-msg` berdasarkan `tasks.length`
    - `showError`: isi `#error-msg` dengan pesan; `clearError`: kosongkan `#error-msg`
    - _Requirements: 2.4, 3.3, 5.2, 5.3, 5.5_

  - [ ]* 4.2 Tulis unit test untuk rendering dan aksesibilitas
    - Test: empty state ditampilkan ketika `tasks` kosong
    - Test: empty state disembunyikan ketika ada task
    - Test: urutan task sesuai urutan penambahan (pertama ditambahkan = pertama di DOM)
    - Test: task selesai memiliki class strikethrough
    - Test: setiap toggle dan tombol hapus memiliki `aria-label` yang valid
    - _Requirements: 2.4, 5.2, 5.3, 5.5_

- [ ] 5. Implementasi Controller: event listeners dan wiring
  - [ ] 5.1 Pasang event listeners dan hubungkan semua komponen di `app.js`
    - Listener pada `#add-btn` (click) dan `#task-input` (keydown Enter): validasi → `addTask` → `saveTasks` → `render` → kosongkan input dalam ≤100ms; tampilkan error via `showError` jika gagal
    - Listener pada `#task-list` (event delegation, click): deteksi klik pada checkbox → `toggleTask` → `saveTasks` → `render`; deteksi klik pada tombol hapus → `window.confirm()` → jika OK: `deleteTask` → `saveTasks` → `render`
    - Listener pada `#task-input` (input event): `clearError()` saat user mulai mengetik ulang
    - Panggil `loadTasks()` lalu `render()` saat `DOMContentLoaded`
    - _Requirements: 1.2, 1.3, 1.5, 2.2, 2.3, 3.2, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.2 Tulis unit test untuk alur Controller
    - Test: klik Add dengan input valid → task ditambahkan, input dikosongkan, render dipanggil
    - Test: klik Add dengan input kosong → pesan error ditampilkan, task tidak ditambahkan
    - Test: tekan Enter pada input → perilaku sama dengan klik Add
    - Test: klik checkbox task → status `completed` berubah, render dipanggil
    - Test: klik hapus → konfirmasi muncul; OK → task dihapus; Cancel → task tetap ada
    - Test: load halaman → task dari localStorage ditampilkan
    - _Requirements: 1.2, 1.3, 1.5, 2.2, 2.3, 3.2, 3.4, 3.5, 4.4_

- [ ] 6. Final Checkpoint — Semua tes harus lulus
  - Jalankan `npm test` dan pastikan semua tes (unit + property) lulus tanpa error.
  - Verifikasi manual di browser: tambah task, toggle, hapus, refresh halaman (data harus persisten).
  - Tanyakan ke user jika ada pertanyaan atau hambatan.

## Notes

- Task bertanda `*` adalah opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Property test menggunakan **fast-check** minimum 100 iterasi per properti
- Unit test menggunakan **vitest** sebagai test runner
- Jalankan tes dengan `npm test` (alias `npx vitest --run`)
- `window.confirm()` digunakan untuk dialog konfirmasi hapus — tidak perlu modal kustom
- Fungsi-fungsi di `app.js` perlu di-export (`export function`) agar bisa diimpor di test file

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.6"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5", "2.7", "2.8", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2"] }
  ]
}
```
