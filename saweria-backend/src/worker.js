/**
 * Juragan Laundry — backend top-up Saweria (Cloudflare Worker + D1)
 *
 * Alur:
 *   Pemain bayar di saweria.co/<kamu> dengan pesan berisi ID Pemain (mis. "JL-3L3B76")
 *   -> Saweria POST ke /saweria/webhook (ditandatangani dengan stream key)
 *   -> Worker memverifikasi tanda tangan, membaca ID Pemain dari pesan, menyimpan ke tabel credits
 *   -> Game (CFG.backendUrl) menarik /api/credits tiap 15 detik, memberi diamond, lalu /api/credits/ack
 *
 * Akun pemain (versi host sendiri):
 *   Login wajib dengan Google (Google Identity Services). Game mengirim ID token ke /api/auth/google,
 *   Worker memverifikasi tanda tangannya dengan kunci publik Google, lalu memberi token sesi 30 hari.
 *   Sesi dipakai untuk simpanan cloud, papan peringkat global & teman, dan top-up.
 *
 * Secrets (wrangler secret put ...):
 *   SAWERIA_STREAM_KEY  wajib. Stream key dari dashboard Saweria (webhook fail-closed jika kosong)
 *   ADMIN_KEY           kunci acak panjang untuk endpoint /api/admin/*
 *   ADMIN_SUBS          sub Google admin (prioritas), pisahkan koma; fallback: ADMIN_EMAILS
 * Vars (wrangler.toml):
 *   ALLOWED_ORIGIN      origin game produksi; origin localhost ada di [env.dev]
 *   GOOGLE_CLIENT_ID    OAuth Client ID (Web) dari Google Cloud Console
 * Catatan: endpoint lama /api/register + X-Player-Token sudah dihapus; top-up hanya lewat sesi Google.
 */

const CODE_RE = /JL-[A-HJ-NP-Z2-9]{6}/i;
const HMAC_KEYS = ['version', 'id', 'amount_raw', 'donator_name', 'donator_email'];

/* ---------- aturan dompet: sumber kebenaran ada di sini, bukan di klien ---------- */
const GEM_PACKS = [
  { gems: 60, bonus: 0, price: 15000 }, { gems: 160, bonus: 12, price: 39000 },
  { gems: 420, bonus: 40, price: 99000 }, { gems: 1000, bonus: 150, price: 229000 },
];
const STARTER = { gems: 100, cash: 3000000, price: 29000 };
const MAX_COIN = 1e13, MAX_GEM = 1e8;
const rp = (n) => 'Rp' + Math.round(num(n, 0, MAX_COIN)).toLocaleString('id-ID');
function rewardFor(amount, gemRate = 250) {
  const p = GEM_PACKS.find((x) => x.price === amount);
  if (p) return { gems: p.gems + p.bonus, label: `Paket ${p.gems + p.bonus} diamond` };
  if (amount === STARTER.price) return { gems: STARTER.gems, cash: STARTER.cash, starter: true, label: 'Paket Pemula' };
  return { gems: Math.floor(amount / gemRate), label: `Kurs ${rp(gemRate)} per diamond` };
}
async function walletFor(env, uid) {
  let w = await env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?1').bind(uid).first();
  if (!w) {
    const vals = (await getBalance(env)).values;
    const coin = Math.round(num(vals.startCash ?? 5000000, 0, MAX_COIN));
    const gem = Math.round(num(vals.startGem ?? 20, 0, MAX_GEM));
    await env.DB.prepare('INSERT OR IGNORE INTO wallets (user_id, coin, gem, version, seq, updated_at) VALUES (?1,?2,?3,0,0,?4)')
      .bind(uid, coin, gem, Date.now()).run();
    w = await env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?1').bind(uid).first();
  }
  return w;
}
const walletView = (w) => ({ coin: w.coin, gem: w.gem, version: w.version, seq: w.seq });
async function mint(env, uid, cur, amount, reason, idem) {
  if (!['coin', 'gem'].includes(cur)) throw httpErr(400, 'invalid_currency');
  const n = Math.round(num(amount, 0, cur === 'coin' ? MAX_COIN : MAX_GEM));
  if (n <= 0) return false;
  const w = await walletFor(env, uid), now = Date.now();
  const key = String(idem).slice(0, 120);
  // UPDATE dulu dengan syarat idem belum dipakai, baru catat idemnya. Kalau dibalik,
  // INSERT OR IGNORE gagal tapi UPDATE tetap menambah saldo saat repeat.
  const add = env.DB.prepare(`UPDATE wallets SET ${cur} = MIN(?, ${cur} + ?), version = version + 1, updated_at = ?
    WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM wallet_ops WHERE idem = ? AND user_id = ?)`)
    .bind(cur === 'coin' ? MAX_COIN : MAX_GEM, n, now, uid, key, uid);
  const mark = env.DB.prepare('INSERT OR IGNORE INTO wallet_ops (idem, user_id, cur, delta, reason, version, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)')
    .bind(key, uid, cur, n, String(reason).slice(0, 120), w.version + 1, now);
  // batch = transaksi: kalau salah satu gagal, saldo tidak berubah.
  const rs = await env.DB.batch([add, mark]);
  return rs[0].meta?.changes > 0;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsHeaders(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      if (url.pathname === '/saweria/webhook' && req.method === 'POST') return await webhook(req, env);
      if (url.pathname === '/api/credits' && req.method === 'GET') return json(await listCredits(req, env), cors);
      if (url.pathname === '/api/credits/ack' && req.method === 'POST') return json(await ack(req, env), cors);
      if (url.pathname === '/api/admin/unmatched' && req.method === 'GET') return json(await unmatched(req, env), cors);
      if (url.pathname === '/api/admin/assign' && req.method === 'POST') return json(await assign(req, env), cors);
      if (url.pathname === '/api/auth/google' && req.method === 'POST') return json(await googleLogin(req, env), cors);
      if (url.pathname === '/api/me' && req.method === 'GET') return json({ user: publicUser(await sessionUser(req, env)) }, cors);
      if (url.pathname === '/api/logout' && req.method === 'POST') return json(await logout(req, env), cors);
      if (url.pathname === '/api/wallet' && req.method === 'GET') return json(await getWallet(req, env), cors);
      if (url.pathname === '/api/wallet/sync' && req.method === 'POST') return json(await syncWallet(req, env), cors);
      if (url.pathname === '/api/save' && req.method === 'GET') return json(await getSave(req, env), cors);
      if (url.pathname === '/api/save' && (req.method === 'PUT' || req.method === 'POST')) return json(await putSave(req, env), cors);
      if (url.pathname === '/api/leaderboard' && req.method === 'POST') return json(await submitScore(req, env), cors);
      if (url.pathname === '/api/leaderboard' && req.method === 'GET') return json(await leaderboard(req, env, url), cors);
      if (url.pathname === '/api/friends' && req.method === 'GET') return json(await listFriends(req, env), cors);
      if (url.pathname === '/api/friends/request' && req.method === 'POST') return json(await friendRequest(req, env), cors);
      if (url.pathname === '/api/friends/respond' && req.method === 'POST') return json(await friendRespond(req, env), cors);
      if (url.pathname === '/api/friends/remove' && req.method === 'POST') return json(await friendRemove(req, env), cors);
      if (url.pathname === '/api/tour' && req.method === 'POST') return json(await submitTour(req, env), cors);
      if (url.pathname === '/api/tour/claim' && req.method === 'POST') return json(await claimTour(req, env), cors);
      if (url.pathname === '/api/tour' && req.method === 'GET') return json(await tourBoard(req, env, url), cors);
      if (url.pathname === '/api/layout' && (req.method === 'PUT' || req.method === 'POST')) return json(await putLayout(req, env), cors);
      if (url.pathname === '/api/visit' && req.method === 'GET') return json(await visit(req, env, url), cors);
      if (url.pathname === '/api/visit/like' && req.method === 'POST') return json(await likeVisit(req, env), cors);
      if (url.pathname === '/api/balance' && req.method === 'GET') return json(await getBalance(env), cors);
      if (url.pathname === '/api/admin/balance' && req.method === 'POST') return json(await putBalance(req, env), cors);
      if (url.pathname === '/api/admin/credit' && req.method === 'POST') return json(await manualCredit(req, env), cors);
      if (url.pathname === '/api/admin/check' && req.method === 'GET') return json(await adminCheck(req, env), cors);
      if (url.pathname === '/health') return json({ ok: true }, cors);
      return json({ error: 'not_found' }, cors, 404);
    } catch (e) {
      const status = e.status || 500;
      return json({ error: e.message || 'error', ...(e.extra || {}) }, cors, status);
    }
  },
};

/* ---------- webhook Saweria ---------- */
async function webhook(req, env) {
  const raw = await req.text();
  let p;
  try { p = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }
  // Fail-closed: tanpa stream key, HMAC dengan kunci kosong bisa dihitung siapa pun.
  if (!env.SAWERIA_STREAM_KEY) return new Response('server_misconfigured', { status: 500 });
  const sig = req.headers.get('Saweria-Callback-Signature') || '';
  if (!sig) return new Response('missing signature', { status: 401 });
  const data = HMAC_KEYS.map((k) => p[k] ?? '').join('');
  const expected = await hmacHex(env.SAWERIA_STREAM_KEY, data);
  if (!timingSafeEqual(expected, sig.toLowerCase())) return new Response('invalid signature', { status: 403 });

  if (p.type && p.type !== 'donation') return new Response('ignored', { status: 200 });
  const amount = Math.round(Number(p.amount_raw) || 0);
  if (!p.id || amount <= 0) return new Response('ignored', { status: 200 });

  const message = String(p.message || '').slice(0, 500);
  const m = message.toUpperCase().match(CODE_RE);
  const code = m ? m[0].toUpperCase() : null;          // null = tak cocok, ditinjau lewat /api/admin/unmatched
  const type = /\bDONASI\b/i.test(message) ? 'donasi' : 'topup';

  // INSERT OR IGNORE: webhook yang dikirim ulang dengan id sama tidak dicatat dua kali
  await env.DB.prepare(
    `INSERT OR IGNORE INTO credits (id, code, type, amount, donator, message, created_at, claimed)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0)`
  ).bind(String(p.id), code, type, amount, String(p.donator_name || '').slice(0, 80), message, Date.now()).run();

  return new Response('ok', { status: 200 });
}

/* ---------- API pemain: wajib sesi Google (jalur X-Player-Token dihapus) ---------- */
async function listCredits(req, env) {
  const u = await sessionUser(req, env);
  const { results } = await env.DB.prepare(
    'SELECT id, type, amount, created_at FROM credits WHERE code = ?1 AND claimed = 0 ORDER BY created_at LIMIT 50'
  ).bind(u.code).all();
  return { credits: results || [] };
}
async function ack(req, env) {
  const u = await sessionUser(req, env);
  const body = await req.json();
  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 50).map(String) : [];
  const now = Date.now(), rewards = [];
  let n = 0;
  for (const id of ids) {
    const c = await env.DB.prepare('SELECT id, code, type, amount, claimed FROM credits WHERE id = ?1').bind(id).first();
    if (!c || c.code !== u.code || c.claimed) continue;
    const r = await env.DB.prepare('UPDATE credits SET claimed = 1, claimed_at = ?1 WHERE id = ?2 AND code = ?3 AND claimed = 0')
      .bind(now, id, u.code).run();
    if (!(r.meta?.changes)) continue;
    n++;
    if (c.type === 'donasi') continue;
    // Hadiah dihitung SERVER, bukan dari angka yang dikirim game.
    const rw = rewardFor(c.amount, (await getBalance(env)).values.gemRate);
    const gems = await mint(env, u.id, 'gem', rw.gems, `Top-up Saweria ${rp(c.amount)} (${rw.label})`, 'cr:' + id);
    const out = { id, gems: gems ? rw.gems : 0, label: rw.label };
    if (rw.starter) {
      const starterOk = await mint(env, u.id, 'coin', rw.cash, 'Paket Pemula: kas tambahan', 'starter:' + u.id);
      out.cash = starterOk ? rw.cash : 0; out.starter = starterOk; out.starterId = id;
    }
    rewards.push(out);
  }
  return { ok: true, acked: n, rewards, wallet: walletView(await walletFor(env, u.id)) };
}

/* ---------- API pengelola (pembayaran tanpa ID Pemain yang valid) ---------- */
const csvSet = (v) => new Set(String(v || '').split(',').map((x) => x.trim()).filter(Boolean));
// Admin = kunci ADMIN_KEY (skrip) atau sesi Google terverifikasi yang sub-nya ada di
// ADMIN_SUBS (utama) / email-nya ada di ADMIN_EMAILS (fallback kompatibilitas).
function isAdminUser(u, env) {
  if (!u || !u.sub) return false;
  const subs = csvSet(env.ADMIN_SUBS);
  if (subs.size) return subs.has(u.sub);
  const emails = new Set([...csvSet(env.ADMIN_EMAILS)].map((x) => x.toLowerCase()));
  return !!u.email && emails.has(String(u.email).toLowerCase());
}
async function adminOnly(req, env) {
  const h = req.headers.get('Authorization') || '';
  if (env.ADMIN_KEY && timingSafeEqual(h, 'Bearer ' + env.ADMIN_KEY)) return { email: 'admin-key' };
  const u = await sessionUser(req, env);
  if (!isAdminUser(u, env)) throw httpErr(403, 'forbidden');
  return u;
}
// catat pembayaran secara manual (mis. webhook tidak sampai karena backend belum online)
async function manualCredit(req, env) {
  const u = await adminOnly(req, env);
  const b = await req.json().catch(() => ({}));
  const m = String(b.code || '').toUpperCase().match(CODE_RE);
  const amount = Math.round(Number(b.amount) || 0);
  if (!m || amount <= 0 || amount > 100000000) throw httpErr(400, 'invalid');
  const type = b.type === 'donasi' ? 'donasi' : 'topup';
  const id = 'manual-' + crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO credits (id, code, type, amount, donator, message, created_at, claimed) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0)`)
    .bind(id, m[0].toUpperCase(), type, amount, 'manual: ' + String(u.email || 'admin').slice(0, 60), String(b.note || '').slice(0, 300), Date.now()).run();
  return { ok: true, id };
}
async function adminCheck(req, env) {
  const u = await sessionUser(req, env);
  return { admin: isAdminUser(u, env), email: u.email, name: u.name };
}
/* ---------- keseimbangan game: versi bernomor + catatan perubahan ---------- */
async function getBalance(env) {
  const { results } = await env.DB.prepare('SELECT version, vals, note, changes, by_email, created_at FROM balance ORDER BY version DESC LIMIT 30').all();
  const rows = results || [];
  if (!rows.length) return { version: 0, values: {}, log: [] };
  const mask = (s) => String(s || '').replace(/^(.).*(@.*)$/, '$1***$2'); // email admin tidak dipajang publik
  return { version: rows[0].version, values: JSON.parse(rows[0].vals || '{}'),
    log: rows.map((r) => ({ version: r.version, note: r.note || '', changes: JSON.parse(r.changes || '[]'), by: mask(r.by_email), at: r.created_at })) };
}
async function putBalance(req, env) {
  const u = await adminOnly(req, env);
  const b = await req.json().catch(() => ({}));
  const vals = b.values && typeof b.values === 'object' ? b.values : null;
  if (!vals) throw httpErr(400, 'invalid');
  const clean = {};
  for (const [k, v] of Object.entries(vals)) { if (/^[a-zA-Z0-9_.]{1,80}$/.test(k) && typeof v === 'number' && isFinite(v)) clean[k] = v; }
  if (Object.keys(clean).length > 2000) throw httpErr(400, 'too_many');
  const cur = await env.DB.prepare('SELECT MAX(version) AS v FROM balance').first();
  const curV = (cur && cur.v) || 0;
  if (Number(b.base) !== curV) throw httpErr(409, 'conflict');
  const changes = Array.isArray(b.changes) ? b.changes.slice(0, 500).map((c) => ({ key: String(c.key || '').slice(0, 80), label: String(c.label || '').slice(0, 120), from: Number(c.from), to: Number(c.to) })) : [];
  const v = curV + 1;
  await env.DB.prepare('INSERT INTO balance (version, vals, note, changes, by_email, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(v, JSON.stringify(clean), String(b.note || '').slice(0, 500), JSON.stringify(changes), String(u.email || ''), Date.now()).run();
  return { ok: true, version: v };
}
async function unmatched(req, env) {
  await adminOnly(req, env);
  const { results } = await env.DB.prepare(
    'SELECT id, type, amount, donator, message, created_at FROM credits WHERE code IS NULL ORDER BY created_at DESC LIMIT 100'
  ).all();
  return { credits: results || [] };
}
async function assign(req, env) {
  await adminOnly(req, env);
  const { id, code } = await req.json();
  if (!id || !CODE_RE.test(code || '')) throw httpErr(400, 'invalid');
  const r = await env.DB.prepare('UPDATE credits SET code = ?1 WHERE id = ?2 AND code IS NULL').bind(code.toUpperCase(), String(id)).run();
  return { ok: true, updated: r.meta?.changes || 0 };
}

/* ---------- akun Google & sesi ---------- */
const SESSION_DAYS = 30;
let jwksCache = { keys: null, at: 0 };
async function googleKeys(env, force) {
  if (!force && jwksCache.keys && Date.now() - jwksCache.at < 3600e3) return jwksCache.keys;
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!r.ok) throw httpErr(502, 'google_keys');
  jwksCache = { keys: (await r.json()).keys || [], at: Date.now() };
  return jwksCache.keys;
}
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
async function verifyGoogleIdToken(token, env) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw httpErr(400, 'bad_token');
  let header, payload;
  try { header = JSON.parse(new TextDecoder().decode(b64u(parts[0]))); payload = JSON.parse(new TextDecoder().decode(b64u(parts[1]))); }
  catch { throw httpErr(400, 'bad_token'); }
  if (header.alg !== 'RS256' || !header.kid) throw httpErr(401, 'bad_token');
  let jwk = (await googleKeys(env)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(env, true)).find((k) => k.kid === header.kid);
  if (!jwk) throw httpErr(401, 'unknown_key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) throw httpErr(401, 'bad_signature');
  const now = Math.floor(Date.now() / 1000);
  const auds = String(env.GOOGLE_CLIENT_ID || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) throw httpErr(401, 'bad_issuer');
  if (!auds.length || !auds.includes(payload.aud)) throw httpErr(401, 'bad_audience');
  if (!(payload.exp > now + 30)) throw httpErr(401, 'expired');
  if (payload.iat > now + 60 || (payload.nbf && payload.nbf > now + 30)) throw httpErr(401, 'bad_time');
  if (!payload.sub) throw httpErr(401, 'no_subject');
  return payload;
}
// sama persis dengan playerCode() di game, agar ID Pemain tetap konsisten
function hashStr(str) { let h1 = 0x811c9dc5, h2 = 0x9e3779b1; for (const ch of String(str)) { const c = ch.charCodeAt(0); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 ^ c, 2246822519) >>> 0; } return [h1, h2]; }
function playerCode(id) { const [h1, h2] = hashStr(id); const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) { const v = i < 3 ? h1 : h2; s += A[(v >>> ((i % 3) * 5)) & 31]; } return 'JL-' + s; }
const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, '').slice(0, n);
function publicUser(u) { return u && { id: u.id, name: u.name, given: u.given || (u.name || '').split(' ')[0], picture: u.picture, code: u.code, email: u.email }; }
async function googleLogin(req, env) {
  const { credential } = await req.json().catch(() => ({}));
  const p = await verifyGoogleIdToken(credential, env);
  // Setiap sesi yang terbit harus berasal dari email Google yang terverifikasi.
  if (p.email_verified !== true) throw httpErr(403, 'email_unverified');
  const id = 'g:' + p.sub, now = Date.now();
  let u = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first();
  if (!u) {
    let code = playerCode(id);
    for (let n = 1; await env.DB.prepare('SELECT 1 FROM users WHERE code = ?1').bind(code).first() || await env.DB.prepare('SELECT 1 FROM players WHERE code = ?1').bind(code).first(); n++) code = playerCode(id + '#' + n);
    await env.DB.prepare('INSERT INTO users (id, sub, email, name, given, picture, code, created_at, last_login) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)')
      .bind(id, p.sub, clip(p.email, 120), clip(p.name, 80), clip(p.given_name, 40), clip(p.picture, 300), code, now).run();
  } else {
    await env.DB.prepare('UPDATE users SET email = ?2, name = ?3, given = ?4, picture = ?5, last_login = ?6 WHERE id = ?1')
      .bind(id, clip(p.email, 120), clip(p.name, 80), clip(p.given_name, 40), clip(p.picture, 300), now).run();
  }
  u = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first();
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1 AND expires_at < ?2').bind(id, now).run();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)').bind(await sha256Hex(token), id, now + SESSION_DAYS * 864e5).run();
  return { token, user: publicUser(u) };
}
async function sessionUser(req, env) {
  const h = req.headers.get('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!/^[0-9a-f]{64}$/.test(token)) throw httpErr(401, 'unauthorized');
  const u = await env.DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?1 AND s.expires_at > ?2')
    .bind(await sha256Hex(token), Date.now()).first();
  if (!u) throw httpErr(401, 'unauthorized');
  return u;
}
async function logout(req, env) {
  const h = req.headers.get('Authorization') || '';
  if (h.startsWith('Bearer ')) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(await sha256Hex(h.slice(7).trim())).run();
  return { ok: true };
}

/* ---------- dompet otoritatif ---------- */
async function getWallet(req, env) {
  const u = await sessionUser(req, env);
  const w = await walletFor(env, u.id);
  const { results } = await env.DB.prepare(
    'SELECT cur, delta, reason, created_at FROM wallet_ops WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 30'
  ).bind(u.id).all();
  return { wallet: walletView(w), ledger: results || [] };
}
async function syncWallet(req, env) {
  const u = await sessionUser(req, env);
  const b = await req.json().catch(() => ({}));
  const seq = Math.round(Number(b.seq) || 0);
  if (seq <= 0 || seq > 1e12) throw httpErr(400, 'invalid_seq');
  let w = await walletFor(env, u.id);
  if (seq <= w.seq) return { ok: true, duplicate: true, wallet: walletView(w) };
  if (seq > w.seq + 1) throw httpErr(409, 'seq_gap');

  // Kenaikan dibatasi laju: klien boleh mencatat pendapatan gameplay, tetapi tidak boleh
  // menaikkan saldo seketika ke angka sembarangan. Penurunan (belanja) dicek saldonya.
  const elapsed = Math.max(2000, Date.now() - w.updated_at);
  const hours = Math.min(24, elapsed / 3600000);
  const capCoin = Math.round(5e6 * hours), capGem = Math.round(200 * hours);
  let dc = Math.round(num(b.coin, -MAX_COIN, MAX_COIN)) - w.coin;
  let dg = Math.round(num(b.gem, -MAX_GEM, MAX_GEM)) - w.gem;
  const clamped = dc > capCoin || dg > capGem;
  // `ver` adalah versi dompet terakhir yang dilihat klien. Bila tertinggal (top-up/klaim
  // belum di-ack, atau sinkron dari perangkat lain), saldo lama tidak boleh dipakai untuk
  // menurunkan saldo server.
  if (Math.round(num(b.ver, 0, 1e12)) < w.version) { dc = Math.max(dc, 0); dg = Math.max(dg, 0); }
  dc = Math.max(Math.min(dc, capCoin), -w.coin);
  dg = Math.max(Math.min(dg, capGem), -w.gem);

  const now = Date.now(), v = w.version + 1, ops = [];
  if (dc) ops.push(env.DB.prepare('INSERT INTO wallet_ops (idem, user_id, cur, delta, reason, version, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)')
    .bind('sync:' + seq + ':c', u.id, 'coin', dc, 'Sinkron game', v, now));
  if (dg) ops.push(env.DB.prepare('INSERT INTO wallet_ops (idem, user_id, cur, delta, reason, version, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)')
    .bind('sync:' + seq + ':g', u.id, 'gem', dg, 'Sinkron game', v, now));
  ops.push(env.DB.prepare('UPDATE wallets SET coin = coin + ?1, gem = gem + ?2, version = ?3, seq = ?4, updated_at = ?5 WHERE user_id = ?6')
    .bind(dc, dg, v, seq, now, u.id));
  await env.DB.batch(ops);
  w = await walletFor(env, u.id);
  return { ok: true, wallet: walletView(w), applied: { coin: dc, gem: dg }, clamped };
}

/* ---------- simpanan cloud ---------- */
async function getSave(req, env) {
  const u = await sessionUser(req, env);
  const r = await env.DB.prepare('SELECT blob, saved_at, v FROM saves WHERE user_id = ?1').bind(u.id).first();
  const w = await walletFor(env, u.id);
  return r ? { blob: r.blob, savedAt: r.saved_at, v: r.v, wallet: walletView(w) } : { wallet: walletView(w) };
}
async function putSave(req, env) {
  const u = await sessionUser(req, env);
  const b = await req.json().catch(() => ({}));
  if (typeof b.blob !== 'string' || b.blob.length > 950000 || !Number.isFinite(+b.savedAt)) throw httpErr(400, 'invalid');
  const cur = await env.DB.prepare('SELECT saved_at FROM saves WHERE user_id = ?1').bind(u.id).first();
  if (cur && cur.saved_at > +b.savedAt && !b.force) { const e = httpErr(409, 'newer_on_server'); e.extra = { savedAt: cur.saved_at }; throw e; }
  // Dompet di dalam blob sudah tidak dipercaya: selalu timpa dengan saldo server.
  let blob = b.blob;
  try {
    const obj = JSON.parse(b.blob);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      obj.wallet = walletView(await walletFor(env, u.id));
      blob = JSON.stringify(obj);
    }
  } catch {}
  await env.DB.prepare('INSERT OR REPLACE INTO saves (user_id, blob, saved_at, v, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(u.id, blob, Math.round(+b.savedAt), Math.round(+b.v || 0), Date.now()).run();
  return { ok: true, savedAt: Math.round(+b.savedAt) };
}

/* ---------- papan peringkat ---------- */
const SORTS = { score: 'score', rep: 'rep', done: 'done' };
const num = (x, lo, hi) => Math.min(hi, Math.max(lo, Number(x) || 0));
async function submitScore(req, env) {
  const u = await sessionUser(req, env);
  const b = await req.json().catch(() => ({}));
  // Klien tidak lagi mengirim `score`. Skor dihitung dari dompet server + statistik
  // yang dibatasi dan tidak boleh mundur.
  const w = await walletFor(env, u.id);
  const prev = await env.DB.prepare('SELECT lvl, done, day FROM leaderboard WHERE user_id = ?1').bind(u.id).first();
  const lvl = Math.max(prev ? prev.lvl : 1, Math.round(num(b.lvl, 1, 999)));
  const done = Math.max(prev ? prev.done : 0, Math.round(num(b.done, 0, 1e9)));
  const day = Math.max(prev ? prev.day : 1, Math.round(num(b.day, 1, 1e6)));
  const rep = Math.round(num(b.rep, 0, 5) * 100) / 100;
  const score = Math.round(w.coin + w.gem * 5000 + lvl * 500000 + done * 50000 + rep * 200000 + day * 100000);
  await env.DB.prepare('INSERT OR REPLACE INTO leaderboard (user_id, shop, score, lvl, rep, done, day, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)')
    .bind(u.id, clip(b.shop, 32) || 'Laundry', score, lvl, rep, done, day, Date.now()).run();
  return { ok: true, score };
}
const LB_COLS = 'l.user_id AS id, l.shop, l.score, l.lvl, l.rep, l.done, l.day, u.given, u.name, u.picture, u.code';
async function friendIds(env, uid) {
  const { results } = await env.DB.prepare(
    "SELECT CASE WHEN from_id = ?1 THEN to_id ELSE from_id END AS fid FROM friends WHERE status = 'accepted' AND (from_id = ?1 OR to_id = ?1)"
  ).bind(uid).all();
  return (results || []).map((r) => r.fid);
}
async function leaderboard(req, env, url) {
  const u = await sessionUser(req, env);
  const col = SORTS[url.searchParams.get('sort')] || 'score';
  const scope = url.searchParams.get('scope') === 'friends' ? 'friends' : 'global';
  let rows;
  if (scope === 'friends') {
    const ids = [u.id, ...(await friendIds(env, u.id))].slice(0, 300);
    const ph = ids.map((_, i) => '?' + (i + 1)).join(',');
    rows = (await env.DB.prepare(`SELECT ${LB_COLS} FROM leaderboard l JOIN users u ON u.id = l.user_id WHERE l.user_id IN (${ph}) ORDER BY l.${col} DESC LIMIT 300`).bind(...ids).all()).results || [];
  } else {
    rows = (await env.DB.prepare(`SELECT ${LB_COLS} FROM leaderboard l JOIN users u ON u.id = l.user_id ORDER BY l.${col} DESC LIMIT 50`).all()).results || [];
  }
  const mine = await env.DB.prepare(`SELECT ${col} AS v FROM leaderboard WHERE user_id = ?1`).bind(u.id).first();
  const rank = mine ? (await env.DB.prepare(`SELECT COUNT(*) AS n FROM leaderboard WHERE ${col} > ?1`).bind(mine.v).first()).n + 1 : null;
  const total = (await env.DB.prepare('SELECT COUNT(*) AS n FROM leaderboard').first()).n;
  return { scope, sort: col, rows: rows.map((r) => ({ ...r, name: r.given || (r.name || '').split(' ')[0] || 'Pemain' })), myRank: scope === 'global' ? rank : null, total };
}

/* ---------- pertemanan (lewat ID Pemain) ---------- */
async function userByCode(env, code) {
  const c = String(code || '').toUpperCase().trim();
  if (!CODE_RE.test(c)) throw httpErr(400, 'invalid_code');
  const t = await env.DB.prepare('SELECT * FROM users WHERE code = ?1').bind(c.match(CODE_RE)[0]).first();
  if (!t) throw httpErr(404, 'player_not_found');
  return t;
}
async function listFriends(req, env) {
  const u = await sessionUser(req, env);
  const q = (sql) => env.DB.prepare(sql).bind(u.id).all().then((r) => r.results || []);
  const cols = "u.code, COALESCE(NULLIF(u.given, ''), u.name) AS name, u.picture, l.shop, l.score, l.lvl";
  const friends = await q(`SELECT ${cols} FROM friends f JOIN users u ON u.id = CASE WHEN f.from_id = ?1 THEN f.to_id ELSE f.from_id END LEFT JOIN leaderboard l ON l.user_id = u.id WHERE f.status = 'accepted' AND (f.from_id = ?1 OR f.to_id = ?1) ORDER BY name`);
  const incoming = await q(`SELECT ${cols} FROM friends f JOIN users u ON u.id = f.from_id LEFT JOIN leaderboard l ON l.user_id = u.id WHERE f.to_id = ?1 AND f.status = 'pending' ORDER BY f.created_at DESC`);
  const outgoing = await q(`SELECT ${cols} FROM friends f JOIN users u ON u.id = f.to_id LEFT JOIN leaderboard l ON l.user_id = u.id WHERE f.from_id = ?1 AND f.status = 'pending' ORDER BY f.created_at DESC`);
  return { code: u.code, friends, incoming, outgoing };
}
async function friendRequest(req, env) {
  const u = await sessionUser(req, env);
  const t = await userByCode(env, (await req.json().catch(() => ({}))).code);
  if (t.id === u.id) throw httpErr(400, 'self');
  const rel = await env.DB.prepare('SELECT from_id, status FROM friends WHERE (from_id = ?1 AND to_id = ?2) OR (from_id = ?2 AND to_id = ?1)').bind(u.id, t.id).first();
  if (rel && rel.status === 'accepted') return { status: 'already', name: t.given || (t.name || '').split(' ')[0] };
  if (rel && rel.from_id === t.id) { // dia sudah lebih dulu mengajak: langsung berteman
    await env.DB.prepare("UPDATE friends SET status = 'accepted' WHERE from_id = ?1 AND to_id = ?2").bind(t.id, u.id).run();
    return { status: 'accepted', name: t.given || (t.name || '').split(' ')[0] };
  }
  if (rel) return { status: 'pending', name: t.given || (t.name || '').split(' ')[0] };
  const n = (await env.DB.prepare("SELECT COUNT(*) AS n FROM friends WHERE (from_id = ?1 OR to_id = ?1)").bind(u.id).first()).n;
  if (n >= 300) throw httpErr(429, 'too_many_friends');
  await env.DB.prepare("INSERT OR IGNORE INTO friends (from_id, to_id, status, created_at) VALUES (?1, ?2, 'pending', ?3)").bind(u.id, t.id, Date.now()).run();
  return { status: 'sent', name: t.given || (t.name || '').split(' ')[0] };
}
async function friendRespond(req, env) {
  const u = await sessionUser(req, env);
  const b = await req.json().catch(() => ({}));
  const t = await userByCode(env, b.code);
  if (b.accept) await env.DB.prepare("UPDATE friends SET status = 'accepted' WHERE from_id = ?1 AND to_id = ?2 AND status = 'pending'").bind(t.id, u.id).run();
  else await env.DB.prepare("DELETE FROM friends WHERE from_id = ?1 AND to_id = ?2 AND status = 'pending'").bind(t.id, u.id).run();
  return { ok: true };
}
async function friendRemove(req, env) {
  const u = await sessionUser(req, env);
  const t = await userByCode(env, (await req.json().catch(() => ({}))).code);
  await env.DB.prepare('DELETE FROM friends WHERE (from_id = ?1 AND to_id = ?2) OR (from_id = ?2 AND to_id = ?1)').bind(u.id, t.id).run();
  return { ok: true };
}

/* ---------- util ---------- */
async function hmacHex(key, data) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key || ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data));
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function corsHeaders(env, req) {
  const origin = req.headers.get('Origin') || '';
  const list = String(env.ALLOWED_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
  return {
    'Access-Control-Allow-Origin': origin && list.includes(origin) ? origin : (list[0] || ''),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}
function json(obj, headers, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }

export const _test = { hmacHex, timingSafeEqual, CODE_RE, HMAC_KEYS, playerCode, verifyGoogleIdToken };

/* ---------- turnamen mingguan ---------- */
const WK_RE = /^\d{4}-W\d{2}$/;
async function submitTour(req, env) {
  const u = await sessionUser(req, env);
  const b = await req.json().catch(() => ({}));
  if (!WK_RE.test(String(b.wk || ''))) throw httpErr(400, 'invalid_week');
  await env.DB.prepare('INSERT OR REPLACE INTO tour (user_id, wk, kind, score, shop, updated_at) VALUES (?1,?2,?3,?4,?5,?6)')
    .bind(u.id, b.wk, clip(b.kind, 16) || 'orders', Math.round(num(b.score, 0, 1e13) * 100) / 100, clip(b.shop, 32) || 'Laundry', Date.now()).run();
  return { ok: true };
}
async function claimTour(req, env) {
  const u = await sessionUser(req, env);
  const wk = String((await req.json().catch(() => ({}))).wk || '');
  if (!WK_RE.test(wk)) throw httpErr(400, 'invalid_week');
  const mine = await env.DB.prepare('SELECT score FROM tour WHERE user_id = ?1 AND wk = ?2').bind(u.id, wk).first();
  if (!mine) throw httpErr(404, 'no_score');
  const rank = (await env.DB.prepare('SELECT COUNT(*) AS n FROM tour WHERE wk = ?1 AND score > ?2').bind(wk, mine.score).first()).n + 1;
  const prize = rank <= 3 ? [100, 60, 40][rank - 1] : rank <= 10 ? 20 : 5;
  const granted = await mint(env, u.id, 'gem', prize, `Hadiah turnamen ${wk} (peringkat #${rank})`, 'tour:' + wk);
  return { ok: true, rank, prize: granted ? prize : 0, wallet: walletView(await walletFor(env, u.id)) };
}
async function tourBoard(req, env, url) {
  const u = await sessionUser(req, env);
  const wk = url.searchParams.get('wk') || '';
  if (!WK_RE.test(wk)) throw httpErr(400, 'invalid_week');
  const scope = url.searchParams.get('scope') === 'friends' ? 'friends' : 'global';
  const cols = "t.user_id AS id, t.shop, t.score, COALESCE(NULLIF(u.given,''), u.name) AS name, u.picture, u.code";
  let rows;
  if (scope === 'friends') {
    const ids = [u.id, ...(await friendIds(env, u.id))].slice(0, 300);
    const ph = ids.map((_, i) => '?' + (i + 2)).join(',');
    rows = (await env.DB.prepare(`SELECT ${cols} FROM tour t JOIN users u ON u.id = t.user_id WHERE t.wk = ?1 AND t.user_id IN (${ph}) ORDER BY t.score DESC LIMIT 300`).bind(wk, ...ids).all()).results || [];
  } else rows = (await env.DB.prepare(`SELECT ${cols} FROM tour t JOIN users u ON u.id = t.user_id WHERE t.wk = ?1 ORDER BY t.score DESC LIMIT 50`).bind(wk).all()).results || [];
  const mine = await env.DB.prepare('SELECT score FROM tour WHERE user_id = ?1 AND wk = ?2').bind(u.id, wk).first();
  const rank = mine ? (await env.DB.prepare('SELECT COUNT(*) AS n FROM tour WHERE wk = ?1 AND score > ?2').bind(wk, mine.score).first()).n + 1 : null;
  const total = (await env.DB.prepare('SELECT COUNT(*) AS n FROM tour WHERE wk = ?1').bind(wk).first()).n;
  return { wk, scope, rows: rows.map((r) => ({ ...r, name: String(r.name || 'Pemain').split(' ')[0] })), myRank: rank, myScore: mine ? mine.score : null, total };
}

/* ---------- kunjungi laundry teman ---------- */
async function putLayout(req, env) {
  const u = await sessionUser(req, env);
  const b = await req.json().catch(() => ({}));
  const data = typeof b.data === 'string' ? b.data : JSON.stringify(b.data || {});
  if (data.length > 60000) throw httpErr(413, 'too_large');
  try { JSON.parse(data); } catch (e) { throw httpErr(400, 'invalid_layout'); }
  await env.DB.prepare('INSERT INTO layouts (user_id, data, likes, updated_at) VALUES (?1, ?2, 0, ?3) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at')
    .bind(u.id, data, Date.now()).run();
  return { ok: true };
}
async function friendTarget(env, u, code) {
  const t = await userByCode(env, code);
  if (t.id !== u.id && !(await friendIds(env, u.id)).includes(t.id)) throw httpErr(403, 'not_friends');
  return t;
}
async function visit(req, env, url) {
  const u = await sessionUser(req, env);
  const t = await friendTarget(env, u, url.searchParams.get('code'));
  const row = await env.DB.prepare('SELECT data, likes, updated_at FROM layouts WHERE user_id = ?1').bind(t.id).first();
  if (!row) throw httpErr(404, 'no_layout');
  const liked = await env.DB.prepare('SELECT 1 FROM likes WHERE from_id = ?1 AND to_id = ?2 AND day = ?3').bind(u.id, t.id, new Date().toISOString().slice(0, 10)).first();
  return { code: t.code, name: t.given || String(t.name || 'Pemain').split(' ')[0], picture: t.picture, data: JSON.parse(row.data), likes: row.likes, likedToday: !!liked, updatedAt: row.updated_at };
}
async function likeVisit(req, env) {
  const u = await sessionUser(req, env);
  const t = await friendTarget(env, u, (await req.json().catch(() => ({}))).code);
  if (t.id === u.id) throw httpErr(400, 'self');
  const day = new Date().toISOString().slice(0, 10);
  const r = await env.DB.prepare('INSERT OR IGNORE INTO likes (from_id, to_id, day) VALUES (?1, ?2, ?3)').bind(u.id, t.id, day).run();
  if (r.meta && r.meta.changes) await env.DB.prepare('UPDATE layouts SET likes = likes + 1 WHERE user_id = ?1').bind(t.id).run();
  const row = await env.DB.prepare('SELECT likes FROM layouts WHERE user_id = ?1').bind(t.id).first();
  return { ok: true, already: !(r.meta && r.meta.changes), likes: row ? row.likes : 0 };
}
