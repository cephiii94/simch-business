# SimCH Business — Sprint 04

Version: 1.0 (Tycoon + AI + AFK Concept)  
Status: Proposed  

---

## Rencana Utama (Sprint Goal)

Mengimplementasikan **Sistem Upgrade Toko secara Visual** (ekspansi Rak Barang C/D dan kapasitas gudang dinamis) serta **Ekspansi HR** (fitur rekrutmen staf baru Citra/Dedi/Eka dengan kepribadian unik dan sistem pelatihan staf) untuk memberikan progresi jangka panjang yang memuaskan.

---

## Definition of Done (DoD)

Sprint 4 dianggap selesai apabila:
* Pemain dapat mengakses menu **Tab Navigasi Sidebar**: "Operasional" vs "SDM" vs "Upgrade Toko".
* Fitur **Upgrade Gudang** tersedia di Tab Upgrade. Kapasitas maksimum stok naik (30 -> 60 -> 100), dan Phaser menggambar tumpukan kardus stok secara dinamis di area belakang toko.
* Fitur **Beli Rak Baru (Rak C & D)** tersedia di Tab Upgrade. Ketika dibeli, Rak C/D digambar di Phaser Canvas, dan pelanggan secara acak mengunjungi rak-rak baru tersebut.
* Fitur **Rekrutmen Banyak Karyawan** aktif (maksimal 3 karyawan aktif). Pemain dapat memilih menyewa Citra, Dedi, atau Eka dengan kepribadian unik.
* Fitur **Pelatihan Karyawan (Training)** aktif di Tab SDM untuk menambah XP staf secara instan.
* Lolos verifikasi build (`npm run build`).

---

## Tahapan Implementasi (Task List)

### Phase 1 — Menu Tab Sidebar & HR Expansion (Multiple Employees)
* **Task 1.1: Pembuatan Tab Menu Sidebar**
  * Memodifikasi layout HTML sidebar di `main.ts` agar mendukung tombol tab:
    * `Tab Operasional` (Harga, Beli Stok, Quest).
    * `Tab SDM` (Status Karyawan, Rekrut Karyawan Baru, Tombol Training).
    * `Tab Upgrade` (Upgrade Gudang, Beli Rak C/D).
* **Task 1.2: Rekrutmen Karyawan Baru (Citra, Dedi, Eka)**
  * Menambah template staf rekrutmen baru di GameState:
    * **Citra** (Personality: `FRIENDLY`, Gaji Rp 35.000, meningkatkan reputasi sedikit setiap melayani transaksi).
    * **Dedi** (Personality: `LAZY`, Gaji Rp 15.000, energi berkurang 1.5x lebih cepat).
    * **Eka** (Personality: `AMBITIOUS`, Gaji Rp 45.000, kecepatan transaksi +30%, namun mood turun lebih cepat).
  * Mengaktifkan rekrutmen berulang di sidebar (maksimal 3 staf) dan menampilkan list card-nya secara dinamis.
* **Task 1.3: Tombol Latih Staf (Employee Training)**
  * Membuat metode `trainEmployee(employeeId)` di `GameState.ts` yang memotong kas Rp 50.000 dan menambah +150 XP ke karyawan.

### Phase 2 — Upgrade Toko & Visualisasi Phaser Dinamis
* **Task 2.1: Upgrade Kapasitas Gudang (Warehouse Expansion)**
  * Menambahkan status `warehouseLevel` di GameState (Max Stock: Level 1 = 30 unit, Level 2 = 60 unit, Level 3 = 100 unit).
  * Menggambar tumpukan kardus stok secara dinamis di pojok kanan bawah Phaser Canvas sesuai volume stok saat ini (misal: stok 0-20 = 1 tumpukan, 21-50 = 2 tumpukan, >50 = 3 tumpukan kardus).
* **Task 2.2: Slot Rak Barang Baru C & D**
  * Menambahkan status boolean kepemilikan `hasShelfC` dan `hasShelfD` di GameState.
  * Memodifikasi `GameScene.ts` agar menggambar Rak C (`x = 220, y = 230`) dan Rak D (`x = 420, y = 230`) secara fisik di canvas jika statusnya dibeli (`true`).
  * Memodifikasi alur pelanggan (`spawnCustomer`) agar tujuan rak yang dikunjungi terbagi secara acak ke seluruh rak yang sudah dimiliki (A, B, C, D).

---

## Risiko & Mitigasi
* **Risiko**: Visualisasi tumpukan kardus bertabrakan dengan sofa istirahat karyawan atau area kasir.
* **Mitigasi**: Posisi tumpukan kardus gudang diletakkan di koordinat `x = 680, y = 480` (pojok kanan bawah layar) yang jauh dari kasir (`x = 100`) dan area istirahat (`x = 650, y = 150`).
