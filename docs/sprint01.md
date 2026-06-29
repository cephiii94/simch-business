# SimCH Business — Sprint 01

Version: 1.0

Status: Planned

---

# Sprint Goal

Membangun fondasi proyek sehingga siap memasuki pengembangan gameplay pada Sprint 2.

Sprint ini hanya berfokus pada setup proyek, struktur folder, dokumentasi, dan arsitektur dasar.

**Tidak ada implementasi gameplay pada sprint ini.**

---

# Definition of Done (DoD)

Sprint dianggap selesai apabila:

* Repository GitHub telah dibuat.
* Project Phaser + TypeScript + Vite dapat dijalankan.
* Struktur folder telah dibuat.
* Dokumentasi awal telah tersedia.
* Game menampilkan scene awal (Hello SimCH).
* Git workflow sudah siap digunakan.

---

# Deliverable

* Project dapat dijalankan menggunakan `npm run dev`.
* Halaman game muncul di browser.
* Struktur proyek rapi.
* Dokumentasi tersedia pada folder `docs`.

---

# Task List

---

## Phase 1 — Repository

### Task 1.1

**Membuat repository GitHub**

Checklist

* [x] Buat repository `simch-business`
* [x] Tambahkan LICENSE (MIT)
* [x] Tambahkan README.md
* [x] Tambahkan `.gitignore`
* [x] Clone repository ke komputer

Output

Repository siap digunakan.

---

### Task 1.2 (SKIP)

**Menentukan branching strategy**

Checklist

* [ ] Gunakan branch `main`
* [ ] Gunakan branch `develop`
* [ ] Tentukan format branch feature

Contoh

```text
feature/shop
feature/customer
feature/save
```

Output

Workflow Git telah ditentukan.

---

## Phase 2 — Project Setup

### Task 2.1

Membuat project menggunakan Vite.

Checklist

* [x] Create Project
* [x] Install dependency
* [x] Jalankan project

Output

Project berhasil berjalan.

---

### Task 2.2

Install Phaser.

Checklist

* [x] Install Phaser
* [x] Pastikan TypeScript mengenali Phaser

Output

Phaser siap digunakan.

---

### Task 2.3

Konfigurasi TypeScript.

Checklist

* [ ] tsconfig sesuai kebutuhan
* [ ] Tidak ada error TypeScript

Output

Environment stabil.

---

## Phase 3 — Project Structure

### Task 3.1

Membuat struktur folder awal.

```text
src/
│
├── assets/
│
├── scenes/
│
├── game/
│
├── ui/
│
├── systems/
│
├── managers/
│
├── config/
│
├── types/
│
└── main.ts
```

Output

Struktur proyek siap dikembangkan.

---

### Task 3.2

Membuat folder asset.

```text
public/
assets/
```

Output

Asset pipeline siap.

---

## Phase 4 — Documentation

### Task 4.1

Membuat folder docs.

Checklist

* [x] GDD.md
* [x] Roadmap.md
* [x] Sprint-01.md
* [x] Decisions.md
* [x] Framework-Candidates.md
* [x] Architecture.md
* [x] Glossary.md

Output

Dokumentasi awal lengkap.

---

### Task 4.2

Menentukan coding convention.

Contoh

* PascalCase → Class
* camelCase → Variable
* kebab-case → Folder
* SCREAMING_SNAKE_CASE → Constant

Output

Style coding konsisten.

---

## Phase 5 — First Game

### Task 5.1

Membuat konfigurasi Phaser.

Checklist

* [ ] Width
* [ ] Height
* [ ] Background Color

Output

Game berhasil dibuat.

---

### Task 5.2

Membuat scene pertama.

Nama scene

```text
BootScene
```

Fungsi

* Load asset awal (jika ada)
* Pindah ke MainMenuScene

Output

BootScene berjalan.

---

### Task 5.3

Membuat Main Menu sederhana.

Isi

* Logo SimCH Business
* Tombol Start Game (belum berfungsi)
* Versi game

Output

Main Menu tampil.

---

### Task 5.4

Menampilkan teks.

```text
Hello SimCH Business
```

Output

Project berhasil berjalan.

---

## Phase 6 — Git Workflow

### Task 6.1

Commit pertama.

Contoh

```text
chore: initial project setup
```

---

### Task 6.2

Push ke GitHub.

Checklist

* [ ] Push branch develop
* [ ] Merge ke main (opsional)

---

# Framework Candidate

Belum ada.

Sprint ini hanya membangun fondasi.

---

# Risiko

* Konfigurasi TypeScript tidak sesuai.
* Dependency Phaser bermasalah.
* Struktur folder berubah di sprint berikutnya.

Risiko tersebut masih dapat diterima karena belum ada gameplay yang dibangun.

---

# Sprint Review

Sprint dinyatakan berhasil apabila:

* Proyek dapat dijalankan tanpa error.
* Dokumentasi lengkap.
* Struktur proyek siap dikembangkan.
* Main Menu tampil.
* Tim siap memasuki Sprint 2.

---

# Sprint Retrospective

Pertanyaan yang akan dijawab setelah sprint selesai:

1. Apakah struktur folder sudah nyaman digunakan?
2. Apakah setup terlalu rumit?
3. Apakah ada konfigurasi yang sebaiknya dipindahkan ke Sprint berikutnya?
4. Apakah dokumentasi sudah cukup jelas untuk melanjutkan pengembangan?
