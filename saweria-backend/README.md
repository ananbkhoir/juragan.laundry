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
                                 D1: tabel credits (id transaksi unik → tidak bisa dobel)
                                     ▲
Game (CFG.backendUrl) ──GET /api/credits tiap 15 dtk──┘  → beri diamond → POST /api/credits/ack
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
   ```
3. Simpan rahasia:
   ```bash
   wrangler secret put SAWERIA_STREAM_KEY    # stream key dari dashboard Saweria
   wrangler secret put ADMIN_KEY             # buat string acak panjang
   ```
4. Ubah `ALLOWED_ORIGIN` di `wrangler.toml` ke alamat game-mu, lalu deploy:
   ```bash
   wrangler deploy
   ```
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

## Endpoint

| Metode | Jalur | Untuk |
|---|---|---|
| POST | `/saweria/webhook` | Dipanggil Saweria (wajib tanda tangan valid) |
| POST | `/api/register` | Game mengikat ID Pemain ke token rahasianya (sekali, siapa duluan) |
| GET | `/api/credits?player=JL-…` | Game menarik top-up yang belum diklaim (header `X-Player-Token`) |
| POST | `/api/credits/ack` | Game menandai top-up sudah diberikan |
| GET | `/api/admin/unmatched` | Pembayaran tanpa ID Pemain yang valid (`Authorization: Bearer ADMIN_KEY`) |
| POST | `/api/admin/assign` | Menautkan pembayaran tadi ke ID Pemain yang benar |

## Aturan nominal (sama dengan di game)

- Nominal sama persis dengan paket mendapat diamond sesuai paket (Rp15.000 → 60, Rp39.000 → 172, Rp99.000 → 460, Rp229.000 → 1.150).
- Rp29.000 untuk pertama kali dihitung sebagai Paket Pemula (100 diamond + kas Rp3 juta).
- Nominal lain dihitung Rp250 per diamond.
- Pesan yang mengandung kata `DONASI` dicatat sebagai donasi dan tidak memberi diamond.

## Batasan yang perlu diketahui

- Pemberian diamond masih dilakukan oleh game di perangkat pemain. Pemain yang paham teknis bisa mengubah saldonya sendiri. Untuk versi komersial penuh, saldo diamond sebaiknya disimpan di server ini juga, dan game hanya meminta "pakai X diamond" ke server.
- Saweria memotong biaya layanan (`cut` di payload). Diamond dihitung dari nominal kotor (`amount_raw`).
- Ketentuan Saweria tentang penjualan barang digital, termasuk item game, sebaiknya dicek dulu sebelum diluncurkan.
