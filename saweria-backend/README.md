# Backend Juragan Laundry: top-up Saweria, login Google, peringkat & teman

> Login Google, simpanan cloud, peringkat global, dan peringkat teman dijelaskan di [`docs/HOSTING-GOOGLE.md`](../docs/HOSTING-GOOGLE.md). Bagian di bawah ini khusus top-up Saweria.

Backend kecil (Cloudflare Worker + database D1) yang menerima webhook Saweria. Diamond lalu masuk otomatis ke akun pemain berdasarkan **ID Pemain** (format `JL-XXXXXX`) yang ditulis pemain di kolom pesan Saweria.

```
Pemain bayar QRIS di saweria.co/kamu  (pesan: "JL-3L3B76")
        │
        ▼
Saweria ──POST /saweria/webhook──► Worker  ── cek tanda tangan (stream key)
                                     │       ── baca ID Pemain dari pesan
                                     ▼
                                 D1: credits + wallets/wallet_ops (id transaksi unik → tidak bisa dobel)
                                     ▲
Game (CFG.backendUrl) ──GET /api/credits tiap 15 dtk──┘  → POST /api/credits/ack → Worker mencetak diamond di server
```

## Kenapa perlu hosting sendiri

Versi game yang sekarang jalan di halaman artifact Claude tidak bisa menerima webhook dan tidak bisa menghubungi server luar. Karena itu, di versi artifact pembayaran dicatat lewat **Konsol pengelola** (tab Akun). Supaya prosesnya otomatis penuh, game perlu di-hosting sendiri, misalnya di Cloudflare Pages, lalu disambungkan ke Worker ini.

## Langkah pemasangan

1. Pasang Wrangler (perlu akun Cloudflare gratis):
   ```bash
   npm install -g wrangler
   wrangler login
   ```
2. Buat database dan pasang skemanya:
   ```bash
   wrangler d1 create juragan-laundry        # salin database_id ke wrangler.toml
   wrangler d1 execute juragan-laundry --remote --file=schema.sql
    # Database lama (sebelum Fase 1) perlu tabel dompet:
    wrangler d1 execute juragan-laundry --remote --file=migrate-fase1.sql
   ```
3. Simpan rahasia (wajib — webhook **fail-closed** bila stream key kosong):
   ```bash
   wrangler secret put SAWERIA_STREAM_KEY    # stream key dari dashboard Saweria
   wrangler secret put ADMIN_KEY             # buat string acak panjang
   wrangler secret put ADMIN_SUBS            # sub Google admin, pisahkan koma (fallback: ADMIN_EMAILS)
   ```
   Sub Google bisa dilihat di Google Cloud Console. Semua login wajib memakai email Google yang `email_verified = true`.
4. Ubah `ALLOWED_ORIGIN` di `[vars]` `wrangler.toml` ke alamat game produksimu (origin `localhost` hanya ada di `[env.dev]`), lalu deploy:
   ```bash
   wrangler deploy
   wrangler deploy --env dev        # hanya jika butuh lingkungan pengembangan
   ```
   Secret untuk `--env dev` dipasang terpisah: `wrangler secret put <nama> --env dev`.
   Kamu akan mendapat alamat seperti `https://juragan-laundry-api.<akun>.workers.dev`.
5. Di dashboard Saweria, buka pengaturan integrasi webhook dan isi URL:
   `https://juragan-laundry-api.<akun>.workers.dev/saweria/webhook`
6. Di `index.html` game, isi:
   ```js
   backendUrl:'https://juragan-laundry-api.<akun>.workers.dev',
   saweriaUser:'username-saweria-mu',
   ```
   Lalu hosting `index.html` (misalnya `wrangler pages deploy` dari folder berisi file itu).

## Uji coba sebelum dipakai pemain

```bash
node send-test-webhook.mjs https://juragan-laundry-api.<akun>.workers.dev <stream-key> JL-XXXXXX 15000
```
Jawaban `200 ok` berarti tanda tangan valid dan transaksi tercatat. Buka game dengan ID Pemain tersebut. Dalam ±15 detik akan muncul "+60 diamond".

**Penting:** cara verifikasi tanda tangan di sini (HMAC-SHA256 atas `version + id + amount_raw + donator_name + donator_email` dengan stream key) diambil dari pustaka komunitas `saweria-webhook-express`, bukan dari dokumentasi resmi Saweria. Sebelum membuka top-up untuk umum, lakukan satu pembayaran sungguhan bernominal kecil dan pastikan Worker menjawab 200, bukan 403. Kalau hasilnya 403, cek log dengan `wrangler tail` dan sesuaikan `HMAC_KEYS` di `src/worker.js`.

## Tes otomatis

Dari folder `saweria-backend` dengan Node.js 22 ke atas:

```bash
npm test
```

Tes memakai database SQLite in-memory (tanpa Cloudflare) dan berisi assertion untuk sinkron dompet, sanitasi simpanan, skor server, top-up/paket pemula, dan klaim turnamen. Tes lama (`auth.test.mjs`, `balance.test.mjs`) ikut dijalankan dan kini bisa dipanggil dari folder mana pun.

## Endpoint

| Metode | Jalur | Untuk |
|---|---|---|
| POST | `/saweria/webhook` | Dipanggil Saweria (wajib tanda tangan & stream key terpasang) |
| GET | `/api/credits` | Game menarik top-up yang belum diklaim (**wajib sesi Google**) |
| POST | `/api/credits/ack` | `{ids}` → `{acked, rewards, wallet}`; hadiah dicetak server, aman diulang (**wajib sesi Google**) |
| GET | `/api/wallet` | Saldo server (`coin`, `gem`, `seq`) + 30 mutasi terakhir |
| POST | `/api/wallet/sync` | `{coin, gem, seq, ver}` → usulan perubahan dompet; `seq` harus naik 1, duplikat diabaikan, `ver` adalah versi dompet terakhir yang dilihat klien |
| POST | `/api/tour/claim` | `{wk}` → hadiah turnamen dari peringkat server, sekali per minggu |

Jalur lama `/api/register` dan header `X-Player-Token` sudah dihapus: ID Pemain tidak bisa lagi "diklaim" dengan token buatan.

| GET | `/api/admin/unmatched` | Pembayaran tanpa ID Pemain yang valid (`Authorization: Bearer ADMIN_KEY`) |
| POST | `/api/admin/assign` | Menautkan pembayaran tadi ke ID Pemain yang benar |

## Aturan nominal (sama dengan di game)

- Nominal sama persis dengan paket mendapat diamond sesuai paket (Rp15.000 → 60, Rp39.000 → 172, Rp99.000 → 460, Rp229.000 → 1.150).
- Rp29.000 untuk pertama kali dihitung sebagai Paket Pemula (100 diamond + kas Rp3 juta).
- Nominal lain dihitung Rp250 per diamond.
- Pesan yang mengandung kata `DONASI` dicatat sebagai donasi dan tidak memberi diamond.

## Batasan yang perlu diketahui

- **Saldo dan skor ada di server (Fase 1).** Klien hanya mengusulkan perubahan lewat `/api/wallet/sync`; Worker membatasi kenaikan (maks. Rp5 juta/jam dan 200 diamond/jam, paling lama 24 jam sekali sinkron) dan menolak penurunan di bawah saldo. `seq` yang mundur dianggap duplikat, `seq` yang loncat ditolak (409), dan `ver` yang tertinggal membuat penurunan saldo diabaikan (melindungi top-up yang belum di-ack).
- Isian `wallet` di blob `/api/save` selalu ditimpa dengan saldo server, jadi menyunting file simpanan tidak menaikkan saldo. Skor papan peringkat dihitung dari dompet server + statistik yang tidak boleh mundur; angka `score` yang dikirim klien diabaikan.
- Top-up dan hadiah turnamen dicetak server dengan kunci idempotensi, jadi mengulang `ack`/klaim tidak menambah diamond dua kali.
- Saweria memotong biaya layanan (`cut` di payload). Diamond dihitung dari nominal kotor (`amount_raw`).
- Ketentuan Saweria tentang penjualan barang digital, termasuk item game, sebaiknya dicek dulu sebelum diluncurkan.
