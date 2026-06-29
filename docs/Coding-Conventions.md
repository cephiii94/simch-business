# SimCH Business — Coding Conventions

Dokumen ini mendefinisikan standar penulisan kode, konvensi penamaan, dan aturan TypeScript yang wajib diikuti selama pengembangan game SimCH Business.

---

## 1. Konvensi Penamaan (Naming Conventions)

### A. Penulisan File & Folder
* **Folder**: Menggunakan **kebab-case** (huruf kecil semua, dipisah tanda hubung).  
  *Contoh:* `core/scenes/`, `shared/utils/`
* **File non-Class**: Menggunakan **kebab-case**.  
  *Contoh:* `game-types.ts`, `event-bus.ts`
* **File Class**: Menggunakan **PascalCase** sesuai nama Class di dalamnya.  
  *Contoh:* `BootScene.ts`, `TimeSystem.ts`

### B. Kode Program (TypeScript)
* **Class & Interface**: Menggunakan **PascalCase**.  
  *Contoh:* `class GameState`, `interface Employee`
* **Fungsi, Metode, & Variabel**: Menggunakan **camelCase**.  
  *Contoh:* `cash`, `isWorking`, `calculateDailyRevenue()`
* **Konstanta & Event**: Menggunakan **SCREAMING_SNAKE_CASE**.  
  *Contoh:* `EVENT_CASH_CHANGED`, `BASE_HPP = 5000`

---

## 2. Aturan TypeScript (Strictness)

* **No-Implicit-Any**: Tipe data `any` sangat tidak disarankan. Semua parameter fungsi, variabel, dan nilai kembalian (return value) wajib memiliki deklarasi tipe data yang jelas.
* **Interface vs Type**:
  * Gunakan `interface` untuk mendefinisikan objek terstruktur atau cetak biru data (contoh: `Employee`, `BranchState`).
  * Gunakan `type` untuk tipe data gabungan (union types) atau alias (contoh: `type Role = 'EMPLOYEE' | 'LEADER' | 'MANAGER'`).
* **Optional Fields**: Gunakan tanda tanya (`?`) atau deklarasi union `| null` secara eksplisit untuk field data yang boleh kosong.

---

## 3. Konvensi Kode Game (Phaser 3)

### A. Alur Siklus Scene (Lifecycle Methods)
Setiap scene Phaser wajib menuliskan fungsi daur hidup secara berurutan sesuai alur eksekusinya:
```typescript
class ShopScene extends Phaser.Scene {
  // 1. Inisialisasi data scene
  init(data: any): void { }

  // 2. Memuat asset visual/audio
  preload(): void { }

  // 3. Membuat game object & inisialisasi UI
  create(): void { }

  // 4. Update berkala per frame (jika ada)
  update(time: number, delta: number): void { }
}
```

### B. Manajemen Kunci Aset (Asset Keys)
Dilarang menggunakan string literal langsung (hardcoded string) untuk memuat atau menampilkan aset. Semua kunci aset wajib didefinisikan dalam objek konstanta:
```typescript
// Contoh konstanta di file config/assets.ts
export const ASSETS = {
  IMAGES: {
    CUSTOMER_IDLE: 'customer_idle',
    BACKGROUND_SHOP: 'bg_shop'
  },
  AUDIO: {
    CLICK: 'click_sound'
  }
} as const;

// Cara penggunaan di Scene:
this.load.image(ASSETS.IMAGES.CUSTOMER_IDLE, 'assets/customer.png');
```

---

## 4. Format Pesan Commit Git (Conventional Commits)

Untuk menjaga kerapian riwayat git, gunakan format **Conventional Commits**:
* `feat: ...` -> Fitur baru (misal: `feat: tambah sistem auto order manager`)
* `fix: ...` -> Perbaikan bug (misal: `fix: perbaikan perhitungan kalkulasi energi NPC`)
* `docs: ...` -> Pembaruan dokumentasi (misal: `docs: buat panduan coding convention`)
* `chore: ...` -> Perubahan administratif/build/dependensi (misal: `chore: update tsconfig`)
* `refactor: ...` -> Restrukturisasi kode tanpa mengubah fungsionalitas.
