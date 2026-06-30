# SimCH Business — Sprint 03

Version: 1.0 (Tycoon + AI + AFK Concept)  
Status: Proposed  

---

## Rencana Utama (Sprint Goal)

Mengimplementasikan **Sistem Main Quest terpandu**, **Mekanik Reputasi & Kepuasan Pelanggan**, serta **Sistem Event Acak Harian** untuk memandu jalannya permainan dan membuat dinamika ekonomi game terasa lebih hidup.

---

## Definition of Done (DoD)

Sprint 3 dianggap selesai apabila:
* Panel "Main Quest" tampil di sidebar dengan misi terpandu (Membeli stok, melayani manual, menyewa karyawan, dll) beserta sistem reward kas otomatis.
* Indikator Rating Bintang (0 s.d. 5 Bintang) tampil di Top HUD, dipengaruhi oleh kepuasan antrean pelanggan.
* Pelanggan memiliki batas waktu sabar antre (patience timer). Jika mengantre terlalu lama saat kasir kosong, mereka pergi dengan kecewa dan mengurangi rating reputasi toko.
* Sistem Event Acak (Random Events) berjalan di awal hari (seperti inflasi harga grosir, festival keramaian, dll) dengan notifikasi pop-up awal hari.
* Lolos verifikasi build (`npm run build`).

---

## Tahapan Implementasi (Task List)

### Phase 1 — Sistem Main Quest (Gameplay Quests)
* **Task 1.1: Pembuatan Quest Engine**
  * Membuat struktur data `Quest` di `src/shared/types/game.types.ts` (id, title, description, targetType, targetValue, currentValue, rewardCash, isCompleted).
  * Menambahkan array `quests` dan logika pelacakan progres quest di `GameState.ts`.
* **Task 1.2: Rangkaian Quest Awal (Misi Pemandu)**
  * Membuat daftar 4 quest awal:
    1. *Misi 1: Kulakan Pertama* (Beli stok grosir pertama kali. Reward: Rp 10.000).
    2. *Misi 2: Layanan Mandiri* (Layani 5 pelanggan secara manual. Reward: Rp 20.000).
    3. *Misi 3: Bos Besar* (Sewa Karyawan AI Budi. Reward: Rp 50.000).
    4. *Misi 4: Riset Pasar* (Ubah harga jual menjadi Rp 8.000. Reward: Rp 15.000).
* **Task 1.3: Panel Quest di Sidebar**
  * Menambahkan panel "Main Quest" di sidebar HTML untuk menampilkan detail misi aktif saat ini.
  * Menampilkan notifikasi Toast/Pop-Up melayang saat quest selesai dan reward kas masuk.

### Phase 2 — Kepuasan & Batas Kesabaran Pelanggan
* **Task 2.1: Rating Bintang Toko (Star Rating)**
  * Mengonversi nilai reputasi (0-100) menjadi rating bintang visual (0 s.d. 5 bintang) di Top HUD.
  * Meningkatkan spawn rate pelanggan jika rating bintang tinggi.
* **Task 2.2: Timer Kesabaran Antrean Pelanggan**
  * Setiap pelanggan yang mengantre di kasir memiliki bar waktu tunggu (patience bar) yang menyusut perlahan (terutama saat kasir kosong/karyawan istirahat).
  * Jika bar habis, pelanggan pergi memunculkan teks `⌛ Lama!` atau `😡 Kasir Kosong!`, mengurangi reputasi toko sebesar -2 poin, dan dicatat sebagai pelanggan marah.

### Phase 3 — Event Acak Harian (Daily Random Events)
* **Task 3.1: Logika Generator Event Harian**
  * Membuat modul event acak harian di awal hari (pukul 08:00 saat toko buka).
  * Macam-macam Event:
    * *Hari Raya (Festival)*: Kedatangan pelanggan meningkat +50% hari ini.
    * *Inflasi Grosir (Inflation)*: Harga pokok grosir (HPP) naik dari Rp 5.000 menjadi Rp 6.000 hari ini.
    * *Krisis Energi (Energy Drain)*: Energi karyawan berkurang 20% lebih cepat hari ini.
* **Task 3.2: Pop-Up Notifikasi Event Harian**
  * Memunculkan notifikasi modal glassmorphism di awal hari yang memperingatkan pemain tentang event yang aktif hari ini.
  * Mengatur agar efek event acak dibersihkan kembali saat pergantian hari.

---

## Risiko & Mitigasi
* **Risiko**: Pelanggan menumpuk dan pergi secara massal jika pemain kewalahan di awal hari manual, memicu rating langsung jatuh ke 0 bintang (death spiral).
* **Mitigasi**: Batas waktu kesabaran pelanggan diatur lebih longgar pada hari-hari pertama (Day 1 - 2) untuk memberi waktu adaptasi bagi pemain baru.
