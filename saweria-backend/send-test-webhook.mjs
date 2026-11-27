// Kirim webhook palsu bertanda tangan ke Worker-mu untuk uji coba.
// Pakai: node send-test-webhook.mjs <url-worker> <stream-key> <ID-Pemain> [nominal]
import crypto from 'node:crypto';
const [url, key, code, amount = '15000'] = process.argv.slice(2);
if (!url || !key || !code) { console.log('node send-test-webhook.mjs <url-worker> <stream-key> <ID-Pemain> [nominal]'); process.exit(1); }
const p = {
  version: '2022.01', created_at: new Date().toISOString(), id: crypto.randomUUID(), type: 'donation',
  amount_raw: Number(amount), cut: Math.round(Number(amount) * 0.05),
  donator_name: 'Uji Coba', donator_email: 'uji@example.com', message: `Top-up ${code}`,
};
const data = ['version', 'id', 'amount_raw', 'donator_name', 'donator_email'].map((k) => p[k]).join('');
const sig = crypto.createHmac('sha256', key).update(data).digest('hex');
const r = await fetch(url.replace(/\/$/, '') + '/saweria/webhook', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Saweria-Callback-Signature': sig }, body: JSON.stringify(p),
});
console.log(r.status, await r.text(), '| id transaksi:', p.id);
