import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import crypto from 'node:crypto';
import worker from '../src/worker.js';

/* Assertion test untuk Fase 1: dompet & skor otoritatif di server. */
const sql = new DatabaseSync(':memory:');
sql.exec(fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
const DB = {
  prepare: (q) => {
    let args = [];
    const st = sql.prepare(q.replace(/\?\d+/g, (m) => '?' + m.slice(1)));
    const o = {
      bind: (...a) => { args = a; return o; },
      run: async () => { const r = st.run(...args); return { meta: { changes: Number(r.changes) } }; },
      first: async () => st.get(...args) ?? null,
      all: async () => ({ results: st.all(...args) }),
    };
    return o;
  },
  batch: async (arr) => { const out = []; for (const s of arr) out.push(await s.run()); return out; },
};
const env = { DB, SAWERIA_STREAM_KEY: 'sk', ADMIN_KEY: 'adm', ALLOWED_ORIGIN: 'https://game.test', GOOGLE_CLIENT_ID: 'cid.apps.googleusercontent.com' };

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const idt = (p) => {
  const h = b64({ alg: 'RS256', kid: 'k1', typ: 'JWT' });
  const b = b64({ iss: 'https://accounts.google.com', aud: env.GOOGLE_CLIENT_ID, exp: Math.floor(Date.now() / 1000) + 600,
    iat: Math.floor(Date.now() / 1000), email_verified: true, ...p });
  const sig = crypto.sign('RSA-SHA256', Buffer.from(h + '.' + b), privateKey).toString('base64url');
  return h + '.' + b + '.' + sig;
};
const call = async (path, opt = {}, tok) => {
  const r = await worker.fetch(new Request('https://w.test' + path, { ...opt,
    headers: { 'Content-Type': 'application/json', Origin: 'https://game.test', ...(tok ? { Authorization: 'Bearer ' + tok } : {}), ...(opt.headers || {}) } }), env);
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j };
};
async function login(sub, email) {
  const r = await call('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential: idt({ sub, email, name: 'Pemain' + sub }) }) });
  assert.equal(r.s, 200);
  return r.j.token;
}
const A = await login('f1-a', 'a@x.com');
const B = await login('f1-b', 'b@x.com');
const codeB = (await call('/api/me', {}, B)).j.user.code;
const gemOf = async (tok) => (await call('/api/wallet', {}, tok)).j.wallet.gem;

test('dompet awal berasal dari server', async () => {
  const r = await call('/api/wallet', {}, A);
  assert.equal(r.s, 200);
  assert.equal(r.j.wallet.coin, 5000000);
  assert.equal(r.j.wallet.gem, 20);
  assert.equal(r.j.wallet.seq, 0);
});

test('sinkron dompet: laju dibatasi, idempoten, penurunan dicek saldo', async () => {
  const v0 = (await call('/api/wallet', {}, A)).j.wallet.version;
  const r1 = await call('/api/wallet/sync', { method: 'POST', body: JSON.stringify({ coin: 5002000, gem: 20, seq: 1, ver: v0 }) }, A);
  assert.equal(r1.s, 200);
  assert.equal(r1.j.wallet.coin, 5002000);

  const dup = await call('/api/wallet/sync', { method: 'POST', body: JSON.stringify({ coin: 9000000, gem: 99, seq: 1, ver: r1.j.wallet.version }) }, A);
  assert.equal(dup.j.duplicate, true);
  assert.equal(dup.j.wallet.coin, 5002000);

  const big = await call('/api/wallet/sync', { method: 'POST', body: JSON.stringify({ coin: 1e12, gem: 20, seq: 2, ver: r1.j.wallet.version }) }, A);
  assert.equal(big.j.clamped, true);
  assert.ok(big.j.wallet.coin < 1e9);

  const spend = await call('/api/wallet/sync', { method: 'POST', body: JSON.stringify({ coin: 1000, gem: 20, seq: 3, ver: big.j.wallet.version }) }, A);
  assert.equal(spend.j.wallet.coin, 1000);
  const over = await call('/api/wallet/sync', { method: 'POST', body: JSON.stringify({ coin: -5000, gem: 20, seq: 4, ver: spend.j.wallet.version }) }, A);
  assert.equal(over.j.wallet.coin, 0);
});

test('blob simpanan tidak bisa menanam saldo palsu', async () => {
  const blob = JSON.stringify({ v: 19, items: [], wallet: { coin: 999999999999, gem: 999999 } });
  const put = await call('/api/save', { method: 'PUT', body: JSON.stringify({ blob, savedAt: 2000, v: 19 }) }, A);
  assert.equal(put.s, 200);
  const get = await call('/api/save', {}, A);
  const stored = JSON.parse(get.j.blob);
  assert.equal(stored.wallet.coin, 0);
  assert.equal(stored.wallet.gem, 20);
  assert.equal(get.j.wallet.coin, 0);
});

test('skor papan peringkat dihitung Worker, bukan dari angka klien', async () => {
  const forged = 9999999999999;
  const r = await call('/api/leaderboard', { method: 'POST',
    body: JSON.stringify({ shop: 'Server Shop', score: forged, lvl: 3, rep: 4.5, done: 12, day: 4 }) }, A);
  assert.equal(r.s, 200);
  const w = (await call('/api/wallet', {}, A)).j.wallet;
  const expected = Math.round(w.coin + w.gem * 5000 + 3 * 500000 + 12 * 50000 + 4.5 * 200000 + 4 * 100000);
  assert.equal(r.j.score, expected);
  assert.notEqual(r.j.score, forged);
  const board = await call('/api/leaderboard?scope=global', {}, A);
  assert.equal(board.j.rows.find((x) => x.shop === 'Server Shop').score, expected);

  const turun = await call('/api/leaderboard', { method: 'POST',
    body: JSON.stringify({ shop: 'Server Shop', score: 1, lvl: 1, rep: 1, done: 1, day: 1 }) }, A);
  // rep boleh berubah, tetapi lvl/done/day tidak boleh mundur; skor tetap dari server.
  assert.equal(turun.j.score, expected - 3.5 * 200000);
  assert.notEqual(turun.j.score, 1);
});

async function webhook(id, amount, message) {
  const p = { version: '2022.01', id, type: 'donation', amount_raw: amount, donator_name: 'A', donator_email: 'a', message };
  const sig = crypto.createHmac('sha256', 'sk').update(['version', 'id', 'amount_raw', 'donator_name', 'donator_email'].map((k) => p[k]).join('')).digest('hex');
  const r = await worker.fetch(new Request('https://w.test/saweria/webhook', {
    method: 'POST', headers: { 'Saweria-Callback-Signature': sig }, body: JSON.stringify(p),
  }), env);
  assert.equal(r.status, 200);
}

test('top-up Saweria: hadiah dihitung server dan idempoten', async () => {
  await webhook('f1-tx1', 15000, 'isi ' + codeB);
  const before = await gemOf(B);
  const ack = await call('/api/credits/ack', { method: 'POST', body: JSON.stringify({ ids: ['f1-tx1'] }) }, B);
  assert.equal(ack.j.acked, 1);
  assert.equal(ack.j.rewards[0].gems, 60);
  assert.equal(await gemOf(B), before + 60);

  const asing = await call('/api/credits/ack', { method: 'POST', body: JSON.stringify({ ids: ['f1-tx1'] }) }, A);
  assert.equal(asing.j.acked, 0);
  assert.equal(await gemOf(A), 20);

  const lagi = await call('/api/credits/ack', { method: 'POST', body: JSON.stringify({ ids: ['f1-tx1'] }) }, B);
  assert.equal(lagi.j.acked, 0);
  assert.equal(await gemOf(B), before + 60);
});

test('paket pemula: kas tambahan hanya sekali per akun', async () => {
  await webhook('f1-tx2', 29000, 'isi ' + codeB);
  const before = await gemOf(B);
  const ack = await call('/api/credits/ack', { method: 'POST', body: JSON.stringify({ ids: ['f1-tx2'] }) }, B);
  const rw = ack.j.rewards[0];
  assert.equal(rw.gems, 100);
  assert.equal(rw.cash, 3000000);
  assert.equal(rw.starter, true);
  assert.equal((await call('/api/wallet', {}, B)).j.wallet.coin, 8000000);
  assert.equal(await gemOf(B), before + 100);

  await webhook('f1-tx3', 29000, 'isi ' + codeB);
  const ack2 = await call('/api/credits/ack', { method: 'POST', body: JSON.stringify({ ids: ['f1-tx3'] }) }, B);
  assert.equal(ack2.j.rewards[0].starter, false);
  assert.equal(ack2.j.rewards[0].cash, 0);
});

test('hadiah turnamen dari peringkat server, sekali per minggu', async () => {
  const wk = '2026-W48';
  await call('/api/tour', { method: 'POST', body: JSON.stringify({ wk, kind: 'orders', score: 100, shop: 'A' }) }, A);
  await call('/api/tour', { method: 'POST', body: JSON.stringify({ wk, kind: 'orders', score: 50, shop: 'B' }) }, B);
  const before = await gemOf(A);
  const c1 = await call('/api/tour/claim', { method: 'POST', body: JSON.stringify({ wk }) }, A);
  assert.equal(c1.j.rank, 1);
  assert.equal(c1.j.prize, 100);
  assert.equal(await gemOf(A), before + 100);
  const c2 = await call('/api/tour/claim', { method: 'POST', body: JSON.stringify({ wk }) }, A);
  assert.equal(c2.j.prize, 0);
  assert.equal(await gemOf(A), before + 100);
});

test('klien yang belum melihat mutasi server tidak bisa menurunkan saldo', async () => {
  const w = (await call('/api/wallet', {}, B)).j.wallet;
  const sync = await call('/api/wallet/sync', { method: 'POST',
    body: JSON.stringify({ coin: 1, gem: 1, seq: w.seq + 1, ver: 0 }) }, B);
  assert.equal(sync.j.applied.coin, 0);
  assert.equal(sync.j.applied.gem, 0);
  assert.equal(sync.j.wallet.coin, w.coin);
  assert.equal(sync.j.wallet.gem, w.gem);
});
