# SimCH Business — Sprint 02

Version: 1.0 (Tycoon + AI + AFK Concept)  
Status: Proposed  

---

## Rencana Utama (Sprint Goal)

Membangun **Core Simulation Loop** (Manajemen Waktu, State Utama, AI Karyawan Pertama, Operasional Toko Dasar, dan Laporan Keuangan Harian). 

Pada akhir Sprint 2, game sudah memiliki simulasi otomatis berjalan di mana waktu berputar, pelanggan datang, karyawan AI melayani di kasir secara visual, stok berkurang, uang bertambah, dan pemain mengevaluasi laporan keuangan di akhir hari.

---

## Definition of Done (DoD)

Sprint 2 dianggap selesai apabila:
* Siklus waktu (Jam & Hari) berjalan otomatis dan dapat di-pause/play/fast-forward.
* State terpusat (`GameState`) melacak uang, hari, stok, dan daftar karyawan secara konsisten.
* AI Karyawan pertama (`EMPLOYEE`) dapat direkrut, memiliki status (Energy & Mood), serta rutinitas harian visual (berangkat kerja, melayani di meja kasir, istirahat, pulang).
* Pelanggan datang secara dinamis pada jam operasional dan membeli barang jika harga cocok.
* Antarmuka Dashboard HR dan Laporan Keuangan Harian (HTML Overlay) tampil dan berfungsi.
* Game dapat dimainkan penuh dari hari ke hari tanpa crash.
* Lolos verifikasi build (`npm run build`).

---

## Tahapan Implementasi (Task List)

### Phase 1 — Core Systems (State & Waktu)
* **Task 1.1: Pembuatan GameState Singleton**
  * Membuat file `src/features/branches/GameState.ts` untuk menyimpan total kas, hari, stok cabang, harga jual, dan status operasional toko.
* **Task 1.2: Implementasi TimeSystem**
  * Membuat kelas `src/shared/utils/TimeSystem.ts` untuk mengelola jam operasional (08:00 - 17:00), konversi waktu (1 jam game = 10 detik nyata), serta tombol kontrol kecepatan (Pause, 1x Speed, 3x Speed).
  * Memancarkan event `EVENT_TIME_TICK` dan `EVENT_DAY_ENDED` melalui `EventBus`.

### Phase 2 — AI NPC Basic Engine (Karyawan Pertama)
* **Task 2.1: Struktur Data Employee**
  * Menulis tipe data `Employee` lengkap dengan atribut Personality, Energy, Mood, dan Gaji di `src/shared/types/game.types.ts`.
* **Task 2.2: Finite State Machine (FSM) Karyawan**
  * Membuat logika behavior sederhana di `src/features/employees/EmployeeAgent.ts` untuk memproses transisi state karyawan (`SLEEPING` -> `COMMUTING` -> `WORKING` -> `BREAKING` -> `LEAVING`).
* **Task 2.3: Visualisasi NPC di Phaser**
  * Menggambar karakter karyawan sederhana (sprite/shape berwarna) di meja kasir pada `GameScene`.
  * Membuat visualisasi state: karyawan berada di kasir saat `WORKING`, bergerak ke ruang istirahat saat `BREAKING`, dan menghilang saat `LEAVING/SLEEPING`.

### Phase 3 — Simulasi Operasional & Transaksi
* **Task 3.1: Logika Datang & Antrean Pelanggan (Customer Spawning)**
  * Membuat generator kedatangan pelanggan di `GameScene` berdasarkan tingkat reputasi toko.
  * Menampilkan antrean pelanggan berjalan menuju meja kasir.
* **Task 3.2: Logika Keputusan Beli & Pelayanan Kasir**
  * Membuat perhitungan evaluasi harga jual vs harga pasar psikologis pelanggan.
  * Karyawan memproses transaksi di meja kasir: stok berkurang, kas bertambah, energi karyawan berkurang, memunculkan emoticon transaksi (sukses `💰` atau kemahalan `😡`).

### Phase 4 — Dashboard HR & Kontrol Pemain (HTML Overlay)
* **Task 4.1: Pembuatan Top HUD**
  * Menampilkan informasi Kas Perusahaan, Hari, Jam Operasional, dan kontrol kecepatan game di bagian atas layar menggunakan HTML glassmorphism.
* **Task 4.2: Pembuatan Panel Kontrol Toko & Daftar Staf**
  * Membuat panel samping untuk:
    * Mengatur harga jual barang (slider harga).
    * Memantau daftar karyawan (Nama, Role: Employee, Status Energy & Mood).

### Phase 5 — Laporan Keuangan Harian (End Day Report)
* **Task 5.1: Panel Rekapitulasi Akhir Hari**
  * Ketika waktu menunjukkan pukul 17:00, pemicu transisi menampilkan overlay Laporan Keuangan Harian:
    * Total Pendapatan Kotor.
    * Total Pengeluaran (Gaji Karyawan + Biaya Operasional Toko).
    * Keuntungan/Kerugian Bersih.
  * Tombol "Mulai Hari Berikutnya" untuk merestart siklus hari ke `day + 1`.

---

## Risiko & Mitigasi
* **Risiko**: Sinkronisasi antara siklus waktu Phaser dengan render HTML Overlay terlambat (desync).
* **Mitigasi**: Mengikat pembacaan waktu HTML secara ketat ke event tick terpusat dari `TimeSystem` yang berjalan di Phaser delta loop.
