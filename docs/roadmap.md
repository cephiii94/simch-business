# SimCH Business — Roadmap MVP

Version: 0.1 (Draft)

---

# Tujuan Roadmap

Roadmap ini menjelaskan tahapan pengembangan SimCH Business dari proyek kosong hingga menjadi MVP yang dapat dimainkan.

Roadmap hanya berisi target besar setiap sprint. Detail implementasi akan dijelaskan pada dokumen Sprint masing-masing.

---

# Prinsip Pengembangan

* MVP First
* Gameplay Before Feature
* Documentation Before Implementation
* One Sprint One Goal
* Avoid Over Engineering
* Finish Before Expand

---

# Target MVP

Pada akhir MVP pemain dapat:

* Memulai permainan baru.
* Membeli stok barang.
* Mengatur harga jual.
* Membuka toko.
* Menjual barang kepada pelanggan.
* Mendapatkan keuntungan.
* Meng-upgrade toko.
* Menyimpan dan melanjutkan permainan.

Jika seluruh poin di atas telah berfungsi, maka MVP dianggap selesai.

---

# Roadmap

---

# Sprint 1 — Foundation

## Tujuan

Membangun fondasi proyek agar siap dikembangkan.

## Fokus

* Membuat repository GitHub.
* Setup Phaser + TypeScript + Vite.
* Menyusun struktur folder.
* Menyiapkan dokumentasi proyek.
* Menjalankan game pertama ("Hello SimCH").
* Menyiapkan workflow Git.

## Deliverable

* Proyek dapat dijalankan.
* Dokumentasi awal selesai.
* Struktur proyek rapi.
* Siap masuk pengembangan gameplay.

---

# Sprint 2 — Core Gameplay

## Tujuan

Membangun gameplay loop utama.

## Fokus

Implementasi sistem:

* Money
* Stock
* Price
* Day Cycle
* Buy Stock
* Open Shop
* End Day

Gameplay sudah dapat dimainkan meskipun masih sangat sederhana.

## Deliverable

Pemain sudah bisa:

* membeli stok
* membuka toko
* menjual barang
* memperoleh uang
* masuk ke hari berikutnya

---

# Sprint 3 — Customer & Economy

## Tujuan

Membuat toko terasa hidup.

## Fokus

Implementasi:

* Customer Spawn
* Buying Logic
* Profit Calculation
* Daily Report
* Random Event sederhana

Mulai balancing gameplay.

## Deliverable

Gameplay loop terasa utuh.

---

# Sprint 4 — Progression

## Tujuan

Memberikan tujuan jangka panjang kepada pemain.

## Fokus

Implementasi:

* Upgrade Toko
* Kapasitas Stok
* Peningkatan Jumlah Pelanggan
* Sistem Progress

Mulai memperbaiki UI.

## Deliverable

Pemain memiliki alasan untuk terus bermain.

---

# Sprint 5 — Save & Polish

## Tujuan

Menyelesaikan MVP.

## Fokus

Implementasi:

* Save Game
* Load Game
* Balancing
* Bug Fix
* UI Improvement
* Audio sederhana
* Persiapan build

## Deliverable

Game dapat dimainkan dari awal hingga beberapa hari permainan tanpa bug besar.

MVP selesai.

---

# Setelah MVP

Setelah MVP selesai, lakukan evaluasi.

Tentukan sistem yang layak dipindahkan menjadi SimCH Engine.

Contoh kandidat:

* Time System
* Save System
* Event System
* Inventory
* Scene Management
* UI Components
* Data Loader

Sistem tersebut tidak langsung dipindahkan selama pengembangan MVP agar fokus tetap pada gameplay.

---

# Framework Candidate

Selama pengembangan, setiap sistem yang memenuhi syarat berikut harus ditandai sebagai Framework Candidate:

* Tidak bergantung pada aturan bisnis SimCH Business.
* Dapat digunakan ulang pada game SimCH lain.
* Memiliki antarmuka yang cukup umum.
* Tidak mengandung logika spesifik toko atau ekonomi.

Framework Candidate akan didokumentasikan pada `Framework-Candidates.md`.

---

# Definisi MVP Selesai

MVP dianggap selesai apabila:

* Gameplay utama berjalan tanpa bug kritis.
* Pemain dapat menghasilkan keuntungan.
* Pemain dapat melakukan upgrade.
* Progress dapat disimpan.
* Game memiliki gameplay loop yang menyenangkan.
* Seluruh fitur inti telah diuji.

Setelah kondisi tersebut terpenuhi, pengembangan berpindah ke fase berikutnya yaitu refactoring dan ekstraksi sistem reusable ke SimCH Engine.
