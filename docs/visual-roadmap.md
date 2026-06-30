# 🗺️ Visual Roadmap — SimCH Business
> Berdasarkan audit lengkap codebase per 30 Juni 2026.
> Backend sudah oke — fokus ke **feel, juice, dan visual identity**.

---

## 📊 Status Terkini

| Kategori | Total Elemen | Pakai PNG | Masih Graphics API |
|---|---|---|---|
| Background / Environment | 8 | 0 | 8 |
| Objek Toko | 6 | 1 (kasir) | 5 |
| Karakter (NPC) | 2 tipe | 0 | 2 |
| Animasi | 18+ | — | Sudah oke |
| Audio SFX | 4 | 0 | Procedural (oke) |

> [!CAUTION]
> **Bug Ditemukan:** `shelf-rack.png` sudah di-load di `BootScene` dengan key `prop_shelf_rack`, tapi **tidak pernah dipanggil** di `ShelfGroup.ts` — class ini masih 100% Graphics API. **Fix ini dulu sebelum lanjut.**

---

## 🔴 PHASE 1 — Critical Fix + Quick Wins
> Dampak paling besar. Kerjakan duluan.

### 1.0 🚨 Bug Fix — ShelfGroup tidak pakai PNG

| File | Action |
|---|---|
| [`ShelfGroup.ts`](file:///d:/ME/VSCODE/simch-business/src/core/components/ShelfGroup.ts) | Tambahkan `scene.add.image()` pakai `ASSETS.IMAGES.SHELF` sebagai background body rak, produk Graphics tetap di atas |
| [`GameScene.ts`](file:///d:/ME/VSCODE/simch-business/src/core/scenes/GameScene.ts) | `shelfImages[]` sudah disiapkan, pastikan depth order benar (shelf PNG < produk Graphics) |

---

### 1.1 🏪 Asset Objek Toko (Perlu Generate)

| Objek | Kondisi Sekarang | Asset Dibutuhkan |
|---|---|---|
| **Kulkas (Fridge)** | 2 kotak biru + produk warna-warni Graphics | `fridge-unit.png` ❌ |
| **Area Istirahat** | Sofa biru + meja kopi Graphics | `break-room.png` ❌ |
| **Gudang** | Kotak karton cokelat Graphics | `warehouse-bg.png` ❌ |
| **Tanaman (×3)** | Lingkaran hijau + pot Graphics | `plant-pot.png` ❌ |
| **Pintu Masuk** | Teks "🚪 MASUK" + mat Graphics | `store-door.png` ❌ |

**Prompt style generate:**
> *"Isometric 2D sprite, [nama objek], transparent background, top-left 45° view, dark purple accent, clean pixel art style, no cast shadow"*

---

### 1.2 ✨ Juice & Micro-Animation (Code Only, No Asset)

| Efek | Trigger | Implementasi |
|---|---|---|
| **Coin particle burst** | Sale berhasil | Phaser `ParticleEmitter` coin kuning muncul di posisi kasir, 0.5s |
| **Screen shake ringan** | Pelanggan marah / walk-out | `this.cameras.main.shake(200, 0.008)` |
| **Bintang ⭐ meledak** | Karyawan level up | Tween 5–8 bintang menyebar dari posisi karyawan, fade out |
| **Glow merah berkedip di rak** | Stok = 0 | Tween `alpha` Graphics overlay merah di atas ShelfGroup, loop |
| **Aisle arrows beranimasi** | Always | Tween `alpha` atau `x` arrows bergerak ke arah kasir, loop |

---

## 🟡 PHASE 2 — Character Polish
> Karakter sekarang hanya ellipse + lingkaran. Perlu "nyawa".

### 2.1 👷 Sprite Karyawan (4 PNG)

| Karakter | Kepribadian | Visual Target | Asset |
|---|---|---|---|
| **Budi** | `DILIGENT` | Serius, rapi, apron bersih | `char-budi.png` ❌ |
| **Citra** | `FRIENDLY` | Senyum, ramah, tanda tangan 👋 | `char-citra.png` ❌ |
| **Dedi** | `LAZY` | Lesu, kantung mata | `char-dedi.png` ❌ |
| **Eka** | `AMBITIOUS` | Semangat, pose tegap | `char-eka.png` ❌ |

**Style:** Top-down 3/4, isometrik, 64×64px asset (display 32×32px)

---

### 2.2 🛒 Sprite Pelanggan (3 PNG)

| Tipe | Warna Sekarang | Visual Target | Asset |
|---|---|---|---|
| **Cheapskate** | Kuning ellipse | Ibu-ibu, tas kresek kecil | `char-customer-cheap.png` ❌ |
| **Normal** | Hijau ellipse | Orang biasa, kantong standar | `char-customer-normal.png` ❌ |
| **Big Spender** | Biru ellipse | Pakai kacamata, tas mewah | `char-customer-bigspender.png` ❌ |

---

### 2.3 🎭 Animasi Karakter (Code Only)

| Animasi | Target | Implementasi |
|---|---|---|
| **Idle bob** | Karyawan saat WORKING | Tween `y ±3`, 1200ms, yoyo, loop -1 |
| **Idle bounce** | Pelanggan saat antri | Tween `y ±2`, 900ms, yoyo, loop -1 |
| **Break slouch** | Karyawan saat BREAKING | Tween `alpha 0.7`, scale sedikit lebih kecil |
| **Thought bubble** | Saat customer di rak | Upgrade dari emoji teks ke PNG bubble + ikon produk |

---

## 🟢 PHASE 3 — Store Environment Detail
> Membuat dunia toko terasa "hidup".

### 3.1 🌆 Atmosfer Visual

| Elemen | Action |
|---|---|
| **Lampu toko LED** | PNG strip lampu di langit-langit (depth rendah), dengan tween glow subtle |
| **Papan nama toko** | PNG signboard di atas entry mat dengan nama branch |
| **Queue barrier** | PNG rope/tiang antrian di depan kasir |
| **Price tag di rak** | Small floating label saat harga berubah (HTML overlay atau Phaser text) |

### 3.2 🌙 Siklus Waktu Visual (Code Only)

| Jam | Visual |
|---|---|
| 08:00–11:59 | Normal (sekarang) |
| 12:00–14:59 | Overlay warm `0xffa500` opacity 0.03 |
| 15:00–17:00 | Overlay golden `0xff8c00` opacity 0.06 |
| 17:01+ | Overlay dark blue `0x001a33` opacity 0.15 + sign "TUTUP" |

```typescript
// Implementasi di GameScene update():
private applyTimeOfDayTint(): void {
  const hour = this.timeSystem.hour;
  const cam = this.cameras.main;
  if (hour >= 15) cam.setBackgroundColor('#0a0a1a');
  // dst...
}
```

### 3.3 📦 Animasi Stok Masuk

| Trigger | Animasi |
|---|---|
| Tombol "Beli Stok" diklik | Pallet/kotak muncul dari kiri layar, slide ke zona gudang, 600ms ease bounce |

---

## 🔵 PHASE 4 — UI/UX Polish
> Sidebar & HUD sudah fungsional. Perlu dipercantik.

### 4.1 🎨 HUD Enhancements (HTML/CSS)

| Item | Sekarang | Target |
|---|---|---|
| **Rating toko** | `4.2 / 5.0` teks biasa | Ganti ke ★★★★☆ bintang SVG/unicode berwarna |
| **Event badge** | Tidak ada di HUD | Badge animasi `FESTIVAL 🎉` / `INFLASI 📈` muncul di HUD top saat event aktif |
| **Kas counter** | Langsung update | CSS `transition + counter animation` saat nilai berubah |
| **Jam digital** | Teks monospace biasa | Tambah icon ⏰ + glow ungu saat speed 3x aktif |

### 4.2 📋 Sidebar Polish

| Item | Target |
|---|---|
| **Kartu karyawan** | Tambah avatar placeholder ikon kepribadian (🟣/🔵/🟡/🟠) |
| **Tab icons** | Tambah ikon per tab: `📦 Ops` / `👤 SDM` / `⬆️ Upgrade` |
| **Quest progress** | Animated progress bar saat nilai naik |
| **Notif quest complete** | Banner besar di tengah canvas saat quest selesai (sekarang hanya toast) |

### 4.3 🎭 Main Menu Polish

| Item | Sekarang | Target |
|---|---|---|
| **Logo** | Float animation ✅ | Tambah glow pulse tween ungu |
| **Tombol Start** | Purple gradient ✅ | Shimmer sweep animation kiri→kanan, 2s loop |
| **Background** | Grid + 15 partikel ✅ | Tambah bintang jatuh (meteor) sesekali |

---

## 📋 Priority Queue — Urutan Kerjakan

```
🚨 BUG FIX (Sekarang)
[x] shelf-rack.png sudah diload → pastikan ditampilkan di GameScene ✅ (sudah ada di shelfImages[])
[ ] Verifikasi shelf PNG tampil di bawah ShelfGroup products

🔴 PHASE 1 (Minggu ini)
[ ] Generate & pasang: fridge-unit.png
[ ] Generate & pasang: break-room.png
[ ] Generate & pasang: plant-pot.png
[ ] Generate & pasang: warehouse-bg.png
[ ] Generate & pasang: store-door.png
[ ] Code: coin particle burst saat transaksi
[ ] Code: cameras.shake() saat pelanggan marah
[ ] Code: animasi bintang ⭐ level up karyawan
[ ] Code: glow merah berkedip saat stok = 0

🟡 PHASE 2 (Minggu depan)
[ ] Generate & pasang: 4 sprite karyawan (Budi/Citra/Dedi/Eka)
[ ] Generate & pasang: 3 sprite pelanggan
[ ] Code: idle bob animation karyawan
[ ] Code: idle bounce animation pelanggan antri

🟢 PHASE 3 (2 minggu lagi)
[ ] Code: time-of-day color overlay
[ ] Code: animasi pallet stok masuk
[ ] Generate & pasang: queue-barrier.png, store-sign.png

🔵 PHASE 4 (Polish akhir)
[ ] HTML/CSS: rating bintang visual
[ ] HTML/CSS: event badge di HUD
[ ] HTML/CSS: quest complete banner
[ ] HTML/CSS: tab icons
```

---

## 🛠️ Cara Generate Asset (Konsisten)

Template prompt untuk semua asset:

```
Isometric 2D flat game sprite, [NAMA OBJEK],
transparent PNG background, viewed from upper-left
45-degree isometric angle, clean cartoon style,
dark wood / dark purple accent colors,
no cast shadow outside object, centered on canvas,
suitable for top-down store simulation game.
```

---

*Audit: 30 Juni 2026 | Subagent Visual Auditor | SimCH Business v0.1.0*
