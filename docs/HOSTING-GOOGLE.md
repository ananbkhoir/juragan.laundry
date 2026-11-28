# Juragan Laundry versi host sendiri: login Google, peringkat global & teman

Versi ini mewajibkan pemain **masuk dengan akun Google**. Setelah masuk, pemain mendapat:

- **Simpanan cloud**: progres bisa dilanjutkan dari perangkat lain dengan akun Google yang sama.
- **Peringkat global**: 50 laundry teratas, plus posisimu sendiri kalau di luar 50 besar.
- **Peringkat teman**: tambah teman lewat **ID Pemain** (`JL-XXXXXX`) atau tautan undangan, lalu bersaing hanya dengan mereka.
- **Top-up Saweria otomatis**: diamond masuk ke akun Google pemilik ID Pemain.

Link artifact Claude tetap berjalan seperti biasa dengan akun Claude. Halaman artifact tidak bisa memuat layanan Google, jadi login Google hanya ada di versi host sendiri.

```
Pemain ──(tombol Google)──► Google memberi ID token
   │
   └──POST /api/auth/google──► Worker Cloudflare ── cek tanda tangan token dengan kunci publik Google
                                   │              ── buat akun + ID Pemain, beri token sesi 30 hari
                                   ▼
                               D1: users, sessions, saves, leaderboard, friends, credits, wallets, wallet_ops
```

Yang kamu butuhkan: akun Google, akun Cloudflare gratis, dan Node.js untuk menjalankan `wrangler`.

---

## 1. Buat OAuth Client ID di Google Cloud

1. Buka <https://console.cloud.google.com/> dan buat project baru, misalnya **Juragan Laundry**.
2. Buka **APIs & Services → OAuth consent screen** (di konsol baru namanya **Google Auth Platform → Branding**).
   - User type: **External**.
   - Isi nama aplikasi (**Juragan Laundry**), email dukungan, dan logo kalau mau.
   - Scope cukup bawaan: `openid`, `email`, `profile`. Ketiganya tidak sensitif, jadi tidak perlu verifikasi Google.
   - Di bagian **Audience / Publishing status**, klik **Publish app** supaya semua orang bisa masuk, bukan hanya akun penguji.
3. Buka **Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: alamat game-mu, misalnya `https://juragan-laundry.pages.dev`. Tambahkan juga `http://localhost:8788` kalau mau mencoba di komputer sendiri.
   - **Authorized redirect URIs** dibiarkan kosong (login memakai popup).
4. Salin **Client ID**-nya. Bentuknya `1234567890-xxxx.apps.googleusercontent.com`. Ini bukan rahasia, boleh ditaruh di kode.

## 2. Siapkan backend (Worker + D1)

Kalau sudah memasang backend Saweria sebelumnya, cukup jalankan ulang skema. Semua tabel memakai `CREATE TABLE IF NOT EXISTS`, jadi data lama aman.

```bash
cd saweria-backend
npm install -g wrangler && wrangler login           # sekali saja
wrangler d1 create juragan-laundry                   # lewati kalau sudah ada; salin database_id ke wrangler.toml
wrangler d1 execute juragan-laundry --remote --file=schema.sql
# Kalau database sudah dipakai sebelum Fase 1, jalankan migrasi dompet:
wrangler d1 execute juragan-laundry --remote --file=migrate-fase1.sql
```

Ubah `wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGIN = "https://juragan-laundry.pages.dev"          # HANYA origin produksi; localhost ada di [env.dev]
GOOGLE_CLIENT_ID = "1234567890-xxxx.apps.googleusercontent.com"
```

Simpan rahasia (webhook gagal 500 bila stream key tidak terpasang), lalu deploy:

```bash
wrangler secret put SAWERIA_STREAM_KEY
wrangler secret put ADMIN_KEY
wrangler secret put ADMIN_SUBS        # sub Google admin (utama); fallback: ADMIN_EMAILS
wrangler deploy
```

Catat alamat Worker-nya, misalnya `https://juragan-laundry-api.namamu.workers.dev`.

## 3. Isi `config.js` di folder game

```js
window.JL_CONFIG = {
  backendUrl: 'https://juragan-laundry-api.namamu.workers.dev',
  googleClientId: '1234567890-xxxx.apps.googleusercontent.com',
  saweriaUser: 'username-saweria-mu',
  admins: ['emailmu@gmail.com']   // boleh melihat menu Admin di game
};
```

Kalau `backendUrl` dan `googleClientId` terisi, game otomatis masuk mode host sendiri dan menampilkan layar **Masuk dengan Google** sebelum bermain.

## 4. Unggah game (pilih salah satu)

**Cloudflare Pages.** Satu akun dengan Worker, jadi paling ringkas. Dari folder utama game (yang berisi `index.html`, `config.js`, `assets/`, `audio/`):

```bash
mkdir -p dist && cp -r index.html config.js assets audio dist/
wrangler pages deploy dist --project-name juragan-laundry
```

**GitHub Pages.** Unggah isi folder ke repo `juragan.laundry`, lalu buka **Settings → Pages**, pilih branch `main` dan folder `/ (root)`. Alamatnya akan berbentuk `https://ananbkhoir.github.io/juragan.laundry/`. Tambahkan origin `https://ananbkhoir.github.io` ke **Authorized JavaScript origins** di Google dan ke `ALLOWED_ORIGIN` di Worker.

## 5. Coba

1. Buka alamat game, lalu klik **Masuk dengan Google**.
2. Isi nama laundry. Progres kini tersimpan di cloud.
3. Buka **Peringkat → Teman**, salin kode atau tautan undangan, lalu kirim ke teman.
4. Temanmu masuk dengan Google lalu memasukkan kodemu, atau langsung membuka tautan undangan. Kamu akan melihat permintaan pertemanan dan tinggal klik **Terima**.
5. Kalian sekarang saling muncul di **Peringkat teman**.

## Catatan

- **Pindah progres dari link artifact.** Di link artifact, buka menu ☰ → **Simpan & cadangan → Salin kode cadangan**. Di versi Google, pilih **Pulihkan dari cadangan** lalu tempel kodenya.
- **ID Pemain di versi Google berbeda** dari ID di artifact, karena terikat ke akun Google. Untuk top-up Saweria, pemain menulis ID yang tampil di game versi Google.
- **Keluar** ada di menu ☰ → **Akun & profil** dan di tab **Akun**.
- **Keamanan peringkat & saldo (Fase 1).** Skor dihitung Worker dari dompet server + statistik; field `score` yang dikirim game diabaikan. Saldo tidak dipercaya dari blob simpanan — Worker selalu menimpanya dengan nilai server. Klien hanya mengusulkan perubahan lewat `/api/wallet/sync` dengan `seq` naik 1; duplikat diabaikan dan loncatan ditolak. Field `ver` memberi tahu server versi dompet terakhir yang dilihat klien; bila tertinggal, penurunan saldo diabaikan supaya top-up yang belum di-ack tidak hilang. Kenaikan dibatasi ±24 jam terakhir (maks. Rp5 juta dan 200 diamond per jam), sedangkan penurunan tidak boleh melebihi saldo. Top-up dan hadiah turnamen dicetak server dengan kunci idempotensi.
- **Privasi.** Yang disimpan hanya ID Google (`sub`), nama, nama depan, foto, dan email. Di peringkat hanya nama depan dan nama laundry yang tampil; email tidak pernah dikirim ke pemain lain.

## Endpoint baru di Worker

| Metode | Path | Keterangan |
|---|---|---|
| POST | `/api/auth/google` | `{credential}` (ID token Google) → `{token, user}` |
| GET | `/api/me` | profil pemain dari token sesi |
| POST | `/api/logout` | hapus sesi |
| GET/PUT | `/api/save` | simpanan cloud; menolak (409) simpanan yang lebih lama dari yang ada di server |
| GET | `/api/wallet` | saldo server + 30 mutasi terakhir |
| POST | `/api/wallet/sync` | `{coin, gem, seq, ver}` → sinkron usulan dompet; `ver` harus versi terakhir yang dilihat klien, skor tidak dikirim lagi |
| POST | `/api/leaderboard` | kirim `shop`, `lvl`, `rep`, `done`, `day`; Worker yang menghitung `score` |
| GET | `/api/leaderboard?scope=global\|friends&sort=score\|rep\|done` | papan peringkat |
| GET | `/api/friends` | teman, permintaan masuk, permintaan keluar |
| POST | `/api/friends/request` | `{code}`; otomatis berteman kalau orang itu sudah mengajak duluan |
| POST | `/api/friends/respond` | `{code, accept}` |
| POST | `/api/friends/remove` | `{code}` |
| GET | `/api/credits` | dengan token sesi: top-up milik akun ini |
| POST | `/api/credits/ack` | `{ids}` → hadiah dicetak server; mengembalikan `{acked, rewards, wallet}` |
| POST | `/api/tour/claim` | `{wk}` → hadiah turnamen dari peringkat server, sekali per minggu |

Semua endpoint pemain memakai header `Authorization: Bearer <token sesi>`.

## Halaman admin (`admin.html`)

Halaman admin terpisah dari game dan hanya bisa dibuka oleh akun Google yang emailnya **terverifikasi** dan terdaftar di backend (berdasarkan `sub` Google).

1. Pasang secret `ADMIN_SUBS` berisi sub Google admin (pisahkan koma). Untuk kompatibilitas, `ADMIN_EMAILS` masih diterima, tetapi tidak lagi ditaruh di `wrangler.toml` — gunakan `wrangler secret put ADMIN_EMAILS`. Contoh: `wrangler secret put ADMIN_SUBS` lalu isi `1234567890,0987654321`.
2. Jalankan ulang `schema.sql` (lokal: `--local`, produksi: `--remote`) agar tabel `balance` dibuat. Perintahnya aman diulang.
3. Buka `http://localhost:8000/admin.html` (atau `https://alamat-game-mu/admin.html`) lalu masuk dengan Google.

Isi halaman admin:

- **Keseimbangan game**: ubah waktu mesin, harga layanan, upah, kebutuhan karyawan, permintaan, sewa, dan harga bahan. Setiap simpanan menjadi versi bernomor dengan catatan. Pemain memuat versi terbaru saat membuka game dan melihat ringkasan perubahannya.
- **Top-up tanpa ID**: tautkan pembayaran Saweria yang pesannya tidak memuat ID Pemain.

Daftar parameter dan nilai bawaannya ada di `balance.js`. Pemeriksaan admin dilakukan di backend (`/api/admin/*`), jadi daftar `admins` di `config.js` hanya mengatur munculnya menu Admin di game.
