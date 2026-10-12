# Requirements Document

## Introduction

Aplikasi To-Do List sederhana berbasis web yang memungkinkan pengguna mengelola daftar tugas harian secara mandiri di browser. Aplikasi dibangun menggunakan HTML, CSS murni, dan JavaScript tanpa framework atau library eksternal. Data tugas disimpan di LocalStorage browser sehingga tetap tersedia setelah halaman di-refresh atau browser ditutup.

Fitur utama meliputi: menambah tugas baru, menandai tugas sebagai selesai, menghapus tugas, dan persistensi data menggunakan LocalStorage.

## Glossary

- **App**: Aplikasi To-Do List secara keseluruhan yang berjalan di browser.
- **Task**: Satu item tugas yang memiliki teks deskripsi dan status selesai/belum selesai.
- **Task_List**: Kumpulan seluruh Task yang dikelola oleh App.
- **LocalStorage**: Mekanisme penyimpanan data browser berbasis key-value yang persisten antar sesi.
- **Task_Input**: Elemen input teks tempat pengguna mengetikkan tugas baru.
- **Add_Button**: Tombol atau aksi yang memicu penambahan Task baru ke Task_List.
- **Complete_Toggle**: Mekanisme (checkbox atau klik) untuk mengubah status selesai/belum selesai pada sebuah Task.
- **Delete_Button**: Tombol yang menghapus satu Task dari Task_List.

---

## Requirements

### Requirement 1: Menambah Tugas Baru

**User Story:** Sebagai pengguna, saya ingin menambah tugas baru ke daftar, agar saya dapat mencatat pekerjaan yang perlu diselesaikan.

#### Acceptance Criteria

1. THE App SHALL menampilkan Task_Input dan Add_Button pada halaman utama.
2. WHEN pengguna mengisi Task_Input dengan teks yang telah di-trim (spasi di awal dan akhir dihilangkan) sepanjang 1–200 karakter dan mengaktifkan Add_Button, THE App SHALL menambahkan Task baru dengan teks yang telah di-trim tersebut ke Task_List dan menampilkannya di halaman.
3. WHEN pengguna mengaktifkan Add_Button dengan Task_Input yang valid, THE App SHALL mengosongkan Task_Input dalam waktu ≤100ms setelah Task berhasil ditambahkan.
4. IF pengguna mengaktifkan Add_Button dengan Task_Input kosong, hanya berisi spasi, atau melebihi 200 karakter, THEN THE App SHALL menampilkan pesan kesalahan yang menjelaskan alasan penolakan dan tidak menambahkan Task ke Task_List.
5. WHEN pengguna menekan tombol Enter pada Task_Input, THE App SHALL memperlakukan aksi tersebut sama seperti mengaktifkan Add_Button.
6. THE App SHALL membatasi jumlah Task dalam Task_List maksimal 100 Task.
7. IF pengguna mengaktifkan Add_Button atau menekan Enter pada Task_Input ketika Task_List telah mencapai 100 Task, THEN THE App SHALL menampilkan pesan kesalahan yang menginformasikan batas maksimum tercapai dan tidak menambahkan Task baru ke Task_List.

---

### Requirement 2: Menandai Tugas sebagai Selesai

**User Story:** Sebagai pengguna, saya ingin menandai tugas yang sudah selesai, agar saya dapat melacak progres pekerjaan saya.

#### Acceptance Criteria

1. THE App SHALL menampilkan Complete_Toggle dalam kondisi tidak aktif pada setiap Task yang baru ditambahkan ke Task_List.
2. WHEN pengguna mengaktifkan Complete_Toggle pada sebuah Task yang belum selesai, THE App SHALL mengubah status Task tersebut menjadi selesai.
3. WHEN pengguna mengaktifkan Complete_Toggle pada sebuah Task yang sudah selesai, THE App SHALL mengubah status Task tersebut kembali menjadi belum selesai.
4. WHILE sebuah Task berstatus selesai dan Complete_Toggle-nya aktif, THE App SHALL menampilkan teks Task tersebut dengan gaya strikethrough.
5. WHEN App dimuat ulang di browser, THE App SHALL mempertahankan status selesai/belum selesai setiap Task sesuai dengan kondisi terakhir sebelum halaman ditutup atau di-refresh.

---

### Requirement 3: Menghapus Tugas

**User Story:** Sebagai pengguna, saya ingin menghapus tugas yang tidak relevan, agar daftar tugas saya tetap bersih dan terorganisir.

#### Acceptance Criteria

1. THE App SHALL menampilkan Delete_Button pada setiap Task di Task_List.
2. WHEN pengguna mengaktifkan Delete_Button pada sebuah Task, THE App SHALL menghapus Task tersebut dari Task_List dan memperbarui tampilan halaman dalam waktu kurang dari 1 detik.
3. WHEN semua Task telah dihapus, THE App SHALL menampilkan pesan kosong yang menginformasikan bahwa belum ada tugas yang tersisa.
4. WHEN pengguna mengaktifkan Delete_Button pada sebuah Task, THE App SHALL menampilkan dialog konfirmasi yang meminta pengguna memastikan penghapusan sebelum Task dihapus dari Task_List.
5. IF pengguna membatalkan dialog konfirmasi, THEN THE App SHALL membatalkan penghapusan dan mempertahankan Task tersebut di Task_List tanpa perubahan.

---

### Requirement 4: Persistensi Data dengan LocalStorage

**User Story:** Sebagai pengguna, saya ingin tugas-tugas saya tersimpan secara otomatis, agar data tidak hilang ketika saya menutup atau me-refresh browser.

#### Acceptance Criteria

1. WHEN pengguna menambahkan sebuah Task, THE App SHALL menyimpan state Task_List terbaru ke LocalStorage.
2. WHEN pengguna mengubah status selesai sebuah Task, THE App SHALL menyimpan state Task_List terbaru ke LocalStorage.
3. WHEN pengguna menghapus sebuah Task, THE App SHALL menyimpan state Task_List terbaru ke LocalStorage.
4. WHEN App dimuat di browser, THE App SHALL membaca Task_List dari LocalStorage dan menampilkan seluruh Task yang tersimpan.
5. IF LocalStorage tidak mengandung kunci Task_List, bernilai null, atau menyimpan nilai yang tidak dapat di-parse sebagai JSON yang valid, THEN THE App SHALL memuat Task_List dalam kondisi kosong tanpa menampilkan pesan error.
6. THE App SHALL memastikan bahwa setiap Task yang diserialisasi ke LocalStorage dan kemudian dideserialisasi kembali menghasilkan Task dengan nilai id, teks, dan status selesai yang identik dengan Task sebelum serialisasi.

---

### Requirement 5: Tampilan dan Aksesibilitas Antarmuka

**User Story:** Sebagai pengguna, saya ingin antarmuka yang bersih dan mudah digunakan, agar saya dapat mengelola tugas dengan nyaman.

#### Acceptance Criteria

1. THE App SHALL menampilkan seluruh konten utama (Task_Input, Add_Button, dan Task_List) dalam satu halaman tanpa memerlukan navigasi halaman.
2. THE App SHALL menerapkan atribut aksesibilitas pada Task_Input, Add_Button, Complete_Toggle, dan Delete_Button sehingga setiap elemen memiliki accessible name yang tidak kosong, baik melalui elemen `<label>` yang terhubung maupun atribut `aria-label`.
3. WHEN Task_List memiliki setidaknya satu Task, THE App SHALL menampilkan seluruh Task secara berurutan sesuai urutan penambahan, dari Task pertama ditambahkan di posisi teratas hingga Task terakhir ditambahkan di posisi terbawah.
4. THE App SHALL menggunakan hanya HTML, CSS, dan JavaScript tanpa ketergantungan pada framework atau library eksternal.
5. WHEN Task_List tidak memiliki Task, THE App SHALL menampilkan pesan kosong yang menginformasikan bahwa belum ada tugas yang ditambahkan.
