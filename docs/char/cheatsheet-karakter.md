# 🎮 SimCH Business — Cheatsheet Karakter

---

## 👷 KARYAWAN (Employee)

### Daftar Rekrutan

| Karakter | Kepribadian | Gaji/hari | Kekuatan | Kelemahan |
|---|---|---|---|---|
| **Budi** 🟣 | `DILIGENT` | Rp 30.000 | Hemat energi (drain ×0.8) | — |
| **Citra** 🔵 | `FRIENDLY` | Rp 35.000 | +1 Reputasi per transaksi | Gaji lebih mahal |
| **Dedi** 🟡 | `LAZY` | Rp 15.000 | Gaji paling murah | Energi cepat habis (drain ×1.3 + serve ×1.5) |
| **Eka** 🟠 | `AMBITIOUS` | Rp 45.000 | Serve 30% lebih cepat | Gaji paling mahal |

> [!TIP]
> Untuk awal game: Hire **Budi** (hemat energi, murah) atau **Citra** (reputasi naik).
> Hindari **Dedi** jika belum punya cukup uang untuk sering istirahat.

---

### ⚡ Tipe Kepribadian

| Tipe | Energi Drain Kerja | Efek Ekstra |
|---|---|---|
| `DILIGENT` | `×0.8` (lebih lambat habis) | — |
| `FRIENDLY` | `×1.0` (normal) | +1 Reputasi tiap melayani pelanggan |
| `LAZY` | `×1.3` (cepat habis) | Energi drain saat serve ×1.5 |
| `AMBITIOUS` | `×1.0` (normal) | Waktu serve lebih cepat (×0.70 delay) |

---

### 🔄 State Karyawan (AgentState)

```
07:00 → COMMUTING (berangkat)
08:00 → WORKING   (bekerja di kasir)
  └─ jika energy ≤ 15 → BREAKING (istirahat paksa)
  └─ BREAKING berlanjut sampai energy ≥ 80
17:00 → WORKING   (beres-beres toko)
18:00 → LEAVING   (pulang)
22:00 → SLEEPING  (tidur, energi penuh)
```

| State | Energi | Visual |
|---|---|---|
| `WORKING` | Drain 0.5/menit × modifier | Berdiri di kasir, apron putih 🟣 |
| `BREAKING` | +2.0/menit (recovery) | Duduk di area istirahat 🔵 |
| `SLEEPING` | Reset ke max (100) | Tidak muncul |
| `COMMUTING` | Tidak berubah | Tidak muncul |
| `LEAVING` | Tidak berubah | Tidak muncul |

---

### 📈 Skill & Experience

| Kondisi | Efek |
|---|---|
| XP ≥ `skillLevel × 100` | **Level Up!** 🎵 |
| Skill naik | Waktu serve lebih cepat: `2000ms × (1 - skill×0.05)` |
| Training (`Rp 50.000`) | +150 XP langsung |
| Setiap item terjual | +2 XP per item |

> [!NOTE]
> Min. multiplier skill = 0.5 (skill sangat tinggi tidak bisa nol).

---

### 💰 Biaya Rekrut & Limit

| Item | Nilai |
|---|---|
| Biaya hire | **Rp 100.000** per karyawan |
| Maks karyawan | **3 orang** sekaligus |
| Biaya training | **Rp 50.000** |

---

## 🛒 PELANGGAN (VisualCustomer)

### Tipe Pelanggan

| Tipe | Warna | Ambang Harga | Qty Beli | Kesabaran |
|---|---|---|---|---|
| **Cheapskate** 🟡 | Kuning | Rp 6.000 – 7.600 | 1–3 unit | 15.000 ms |
| **Normal** 🟢 | Hijau | Rp 7.500 – 9.500 | 1–3 unit | 22.000 ms |
| **Big Spender** 🔵 | Biru | Rp 8.500 – 12.000 | 1–3 unit | 30.000 ms |

> [!IMPORTANT]
> Jika harga jual > ambang harga pelanggan → `😡 Kemahalan!` → -2 Reputasi.

### Perilaku Pelanggan

```
1. Spawn di bawah layar (ENTRY_Y = 740)
2. Jalan ke rak → browsing 1.5 detik 💬
3. Antri di kasir (maks 6 orang)
4. Bar kesabaran menyusut per milidetik
5. Jika kesabaran habis → pergi marah 😡
```

### Drain Kesabaran

| Kondisi | Multiplier Drain |
|---|---|
| Ada karyawan bekerja | `×1.0` (normal) |
| Tidak ada karyawan (manual) | `×2.5` (cepat sekali!) |
| Time paused | Berhenti (bar tidak bergerak) |

### Spawn Rate

```
delay = 6000 - (reputasi/100 × 3000) ms
Event FESTIVAL aktif → delay × 0.65 (lebih ramai!)
```

---

## 🎲 EVENT HARIAN (Random Daily Events)

| Event | Peluang | Efek |
|---|---|---|
| `INFLATION` | ~11.7% | — *(lihat implementasi main.ts)* |
| `FESTIVAL` | ~11.7% | Spawn pelanggan lebih cepat (×0.65) |
| `ENERGY_CRISIS` | ~11.7% | Drain energi karyawan saat serve ×1.20 |
| *(Tidak ada event)* | ~65% | Hari normal |

> [!NOTE]
> Total peluang event = 35%. Dipilih acak dari 3 event yang tersedia.

---

## 🏪 REFERENSI CEPAT

### Warna Karakter di Canvas

| Karakter | Warna Badan | Kode Hex |
|---|---|---|
| Karyawan aktif (WORKING) | Ungu tua | `#7d3c98` |
| Karyawan istirahat | Abu-abu | `#5d6d7e` |
| Pelanggan Cheapskate | Kuning | `#f4d03f` |
| Pelanggan Normal | Hijau | `#52be80` |
| Pelanggan Big Spender | Biru | `#5dade2` |

### Bar Energi Karyawan

| % Energi | Warna Bar |
|---|---|
| > 50% | 🟢 Hijau `#2ecc71` |
| 25–50% | 🟡 Kuning `#f1c40f` |
| < 25% | 🔴 Merah `#e74c3c` |

### Bar Kesabaran Pelanggan

| % Kesabaran | Warna Bar |
|---|---|
| > 50% | 🟢 Hijau `#2ecc71` |
| 25–50% | 🟡 Kuning `#f1c40f` |
| < 25% | 🔴 Merah `#e74c3c` |

---

## 📁 File Referensi

| Konsep | File |
|---|---|
| Tipe data karakter | [game.types.ts](file:///d:/ME/VSCODE/simch-business/src/shared/types/game.types.ts) |
| Logika state karyawan | [EmployeeAgent.ts](file:///d:/ME/VSCODE/simch-business/src/features/employees/EmployeeAgent.ts) |
| Data rekrutan & hire | [GameState.ts](file:///d:/ME/VSCODE/simch-business/src/features/branches/GameState.ts) |
| Spawn & perilaku pelanggan | [GameScene.ts](file:///d:/ME/VSCODE/simch-business/src/core/scenes/GameScene.ts) |
