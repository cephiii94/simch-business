# SimCH Business — Architecture Decision Records (ADR)

Dokumen ini mencatat keputusan arsitektural penting yang selaras dengan konsep game Tycoon + AI + AFK.

---

## ADR 01: Core Tech Stack (Vite + TypeScript + Phaser 3)
* **Keputusan**: Tetap menggunakan Vite, TypeScript, dan Phaser 3.
* **Alasan**: Phaser 3 unggul untuk rendering antrean karyawan/pelanggan dan simulasi visual toko secara 2D. TypeScript krusial untuk mendefinisikan tipe data Employee dan Branch yang kompleks secara aman.

---

## ADR 02: Manajemen State Makro (Singleton GameState & EventBus)
* **Keputusan**: GameState terpusat yang menyimpan array daftar cabang (`branches`) dan array karyawan global (`employees`), digerakkan oleh `EventBus` kustom.
* **Alasan**: Konsep multi-cabang memerlukan sinkronisasi data real-time. Jika data diubah (misal: kas berkurang saat membayar gaji staf di Cabang A), `EventBus` akan memberi tahu dashboard UI makro untuk memperbarui total saldo kas secara instan.

---

## ADR 03: Arsitektur AI NPC (Finite State Machine / FSM)

### Konteks
Setiap NPC (Karyawan, Leader, Manager) memerlukan logika untuk beralih kondisi rutinitas harian (tidur, berangkat kerja, melayani kasir, istirahat) secara independen tanpa membebani kinerja game (terutama saat pemain memiliki banyak cabang dan puluhan staf).

### Keputusan
Menggunakan rancangan **Finite State Machine (FSM)** sederhana berbasis waktu. Setiap NPC memiliki properti `currentState` yang dievaluasi berkala. Pengaruh kepribadian (Personality) diterapkan sebagai angka koefisien pengali pada kecepatan kerja dan tingkat pengurangan energi.

### Alasan
* **Performa Ringan**: FSM jauh lebih hemat memori dan CPU dibandingkan dengan Behavior Tree (BT) atau Goal-Oriented Action Planning (GOAP) yang kompleks.
* **Kemudahan Serialisasi**: Status state NPC cukup disimpan berupa string literal (misal: `'WORKING'`), mempermudah proses save/load game.

---

## ADR 04: UI Berorientasi Dashboard Analitik (HTML/CSS Overlays)

### Konteks
Pemain dalam game ini bertindak sebagai manajer tingkat tinggi (CEO). Interaksi utama mereka adalah membaca grafik, meninjau tabel KPI, mengevaluasi laporan keuangan, dan memproses data HR (promosi/pelatihan).

### Keputusan
Mengutamakan pengembangan UI menggunakan **HTML/CSS Overlay** responsif dengan desain premium (dark mode, glassmorphism, grafik data sederhana menggunakan CSS/SVG) di atas canvas Phaser, daripada membuat tombol dan tabel menggunakan objek internal Phaser Canvas.

### Alasan
* Membuat komponen tabel interaktif, scroll list karyawan, formulir rekrutmen, dan grafik analitis harian jauh lebih rapi, cepat, dan mudah disesuaikan menggunakan tag HTML (`<div>`, `<table>`, `<button>`) dan CSS Grid/Flexbox dibandingkan menggambar secara manual di Phaser Canvas.
* Mempertahankan performa visual game: Canvas hanya digunakan untuk rendering visual dekoratif toko dan pergerakan NPC.

---

## ADR 05: Pendekatan Simulasi AFK (System Clock Delta)

### Konteks
Game harus dapat menghitung pendapatan pasif yang dihasilkan saat pemain menutup game dan kembali beberapa jam kemudian.

### Keputusan
Menggunakan perbandingan waktu **System Clock Delta** (menyimpan `exitTimestamp` saat game ditutup dan membandingkannya dengan `currentTimestamp` saat game dibuka kembali). Selisih detik dikonversi menjadi unit "Hari Game" fiktif dan diproses secara kalkulatif instan (offline calculation batch).

### Alasan
* Menghindari keharusan memiliki server background yang aktif terus-menerus. Simulasi diselesaikan dalam waktu kurang dari 1 detik di browser klien saat memuat game.
