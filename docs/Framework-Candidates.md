# SimCH Engine — Framework Candidates

Dokumen ini mencatat modul-modul yang berpotensi diekstraksi menjadi bagian dari **SimCH Engine** setelah MVP SimCH Business selesai. Setiap modul yang dicantumkan di sini wajib dirancang se-generic mungkin selama masa pengembangan agar tidak bergantung pada logika spesifik game ini.

---

## Kriteria Evaluasi Framework Candidate

Modul dinyatakan layak menjadi kandidat framework apabila memenuhi kriteria berikut:
1. **Zero Business Logic**: Tidak mengandung aturan bisnis SimCH Business (tidak ada variabel bernama `rupiah`, `toko`, `pelanggan_kelontong`, dll).
2. **Reusability**: Dapat diimpor langsung dan digunakan pada game simulasi/RPG SimCH lain tanpa memodifikasi kodenya.
3. **Generic Interface**: Menggunakan tipe data standar TypeScript (string, number, boolean, array, object) dalam parameter fungsinya.

---

## Daftar Framework Candidates

### 1. TimeSystem (Sistem Manajemen Waktu)
* **Deskripsi**: Modul pengatur siklus waktu (detik, menit, jam, hari) dengan dukungan jeda (pause), resume, dan percepatan waktu (fast-forward).
* **Mengapa Layak**: Hampir semua game simulasi SimCH akan membutuhkan manajemen waktu harian atau siklus siang-malam.
* **Desain Generic**:
  ```typescript
  interface TimeConfig {
    secondsPerHour: number;
    startHour: number;
    endHour: number;
  }
  ```

### 2. EventBus (Sistem Event / Pub-Sub)
* **Deskripsi**: Sistem komunikasi publish-subscribe berbasis string event untuk decoupling antar komponen.
* **Mengapa Layak**: Sangat penting untuk menghubungkan logika data dengan visual rendering tanpa interkoneksi langsung.
* **Desain Generic**: Implementasi generic `EventEmitter` TypeScript yang mendukung penambahan listener, penghapusan listener, dan emisi event beserta payload-nya.

### 3. InventorySystem (Sistem Slot & Kapasitas Stok)
* **Deskripsi**: Logika penyimpanan barang dasar yang membatasi kapasitas, mendukung penambahan/pengurangan item, dan memeriksa status penuh/kosong.
* **Mengapa Layak**: Game simulasi lain seperti SimCH Farm atau SimCH Cafe pasti membutuhkan sistem penyimpanan barang yang mirip.
* **Desain Generic**: Mengelola koleksi item generik `{ id: string, quantity: number }` dengan batas kapasitas volume (`maxCapacity`).

### 4. SaveLoadSystem (Sistem Penyimpanan Data)
* **Deskripsi**: Modul pembungkus (wrapper) untuk menyimpan dan memuat objek state terkompresi ke media penyimpanan (awalnya `localStorage`).
* **Mengapa Layak**: Semua game SimCH membutuhkan fitur save/load progress pemain.
* **Desain Generic**: Menyediakan fungsi `save(key: string, data: any)` dan `load<T>(key: string): T | null` dengan enkripsi string dasar (seperti pengaburan Base64) agar tidak mudah diubah manual oleh pemain lewat console browser.
