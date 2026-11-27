# Juragan Laundry

Game web simulasi bisnis laundry kiloan dengan tampilan isometrik 2D yang berjalan real-time, dilengkapi ekosistem online.

- **Simulasi**: pelanggan datang dari jalan raya dan antre satu petak per orang. Kasir wajib berjaga. Karyawan mengambil deterjen dan pewangi, lalu cucian melewati alur cuci → kering → setrika → lipat. Ada kebutuhan karyawan (makan, minum, toilet, tenaga), pembagian tugas, dinding dan ruangan, cuaca, siklus pagi sampai malam, riset, promosi, misi harian/mingguan/bulanan, dan pemasukan saat game ditutup.
- **Online**: akun (Claude), cloud save, leaderboard, diamond, top-up dan donasi lewat Saweria (QRIS).

## Struktur

```
index.html              game lengkap (satu file: CSS + JS)
audio/                  efek suara (hujan, bel pintu)
saweria-backend/        Cloudflare Worker + D1 untuk webhook Saweria otomatis
docs/icon-prompts.md    prompt ikon menu untuk generator gambar
```

## Menjalankan secara lokal

```bash
npx serve .          # atau: python3 -m http.server 8080
```

Buka `http://localhost:3000` (atau port yang dipakai). Tanpa backend, game berjalan dalam **mode tamu**: progres tersimpan di browser.

## Arsitektur singkat (di dalam `index.html`)

1. **Konten**: katalog item, layanan, staf, riset, misi, cuaca, dan promosi disimpan sebagai data.
2. **Simulasi**: berjalan sebagai tick deterministik tanpa DOM, sehingga bisa dipindah ke server.
3. **Layanan**: Auth, Saves, Economy, Credits (Saweria), Leaderboard, dan Sfx dibuat sebagai adapter.
4. **Render**: kanvas isometrik.
5. **UI**: topbar, menu ☰, rail kiri, panel cuaca dan misi, dok bawah, laci, dan modal.

Save memakai skema berversi dengan migrasi berurutan (`MIGRATIONS`).

## Top-up otomatis

Lihat `saweria-backend/README.md`. Setelah Worker terpasang, isi `CFG.backendUrl` dan `CFG.saweriaUser` di `index.html`, lalu hosting game ini sendiri, misalnya di Cloudflare Pages.

## Catatan

- Kontrol kecepatan game tersembunyi secara bawaan. Admin bisa menampilkannya lewat menu ☰ → Admin, atau mengizinkannya untuk semua pemain dari Konsol pengelola.
- Ekonomi diamond masih dihitung di sisi klien. Untuk versi komersial, pindahkan saldo ke server.
