# SimCH Business — Sprint 05

Version: 1.0 (MVP Finalization)  
Status: Proposed  

---

## Rencana Utama (Sprint Goal)

Mengimplementasikan **Sistem Save & Load Game** berbasis `localStorage` untuk kelangsungan permainan, mengaktifkan tombol **Load Game** di Main Menu, melakukan **Auto-Save** di setiap pergantian hari, serta memoles visual antarmuka agar terasa premium dan bersih dari bug.

---

## Definition of Done (DoD)

Sprint 5 dianggap selesai apabila:
* Pemain dapat melihat tombol **Load Game** aktif di Main Menu jika memiliki riwayat simpanan.
* Game secara otomatis melakukan **Auto-Save** (menyimpan uang, hari, level gudang, status rak, karyawan yang disewa beserta level/XP mereka) ke `localStorage` setiap kali hari berakhir (setelah Laporan Keuangan Harian ditutup).
* Klik tombol **Load Game** berhasil memulihkan seluruh data permainan dan memulai Phaser `GameScene` dengan visual yang sesuai (rak C/D dan tumpukan kardus stok tergambar akurat).
* Lolos verifikasi build (`npm run build`).

---

## Tahapan Implementasi (Task List)

### Phase 1 — Sistem Save & Load di GameState
* **Task 1.1: Metode Serialisasi Save di GameState**
  * Membuat metode `saveGame()` di `GameState.ts` untuk mengonversi seluruh variabel state menjadi JSON string dan menyimpannya di `localStorage` dengan key `'simch_business_save'`.
* **Task 1.2: Metode Deserialisasi Load di GameState**
  * Membuat metode `loadGame(): boolean` untuk memuat data dari `localStorage`, memulihkan properti kas, hari, level gudang, rak terpasang, daftar karyawan aktif, dan quest.
  * Membuat metode `hasSaveGame(): boolean` untuk mendeteksi apakah data simpanan tersedia.

### Phase 2 — Integrasi UI Main Menu & Auto-Save Harian
* **Task 2.1: Tombol Load Game di Main Menu**
  * Memodifikasi `showMainMenu()` di `main.ts` agar memeriksa `gameState.hasSaveGame()`. Jika ada, aktifkan tombol "Load Game" dan pasang event listener klik untuk memicu `loadGame()`.
* **Task 2.2: Auto-Save Setiap Hari Berakhir**
  * Memasang pemicu `gameState.saveGame()` di dalam event handler tombol "Mulai Hari Berikutnya" (`btn-next-day`) di `main.ts`.
  * Menampilkan Toast pemberitahuan kecil `💾 Auto-save berhasil...` di pojok kanan bawah layar.

---

## Risiko & Mitigasi
* **Risiko**: Data karyawan AI yang tersimpan tidak ter-instansiasi ulang sebagai `EmployeeAgent` di `GameScene` setelah memuat game.
* **Mitigasi**: Pastikan metode `syncEmployeesFromState()` di `GameScene.ts` dipanggil saat scene di-restart/dimuat, untuk secara otomatis memeriksa daftar karyawan baru dari `GameState` dan membuat instansi `EmployeeAgent` baru.
