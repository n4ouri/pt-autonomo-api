process.env.DATABASE_PATH = ':memory:';
process.env.CONNECTOR_ENCRYPTION_KEY = '0'.repeat(63) + '1';

import { test, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.js';
import { encryptCookie, decryptCookie } from '../src/lib/cookieVault.js';
import { parseBankCsv, parseBankOfx } from '../src/connectors/bankStatement.js';

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function createProfile() {
  const res = await fetch(`${baseUrl}/api/v1/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Connector Test Autónomo' })
  });
  return res.json();
}

function authHeaders(apiKey) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
}

// --- cookieVault ---

test('cookieVault: encrypt/decrypt round-trips the original plaintext', () => {
  const plaintext = 'JSESSIONID=abc123; some_other_cookie=value';
  const blob = encryptCookie(plaintext);
  assert.notStrictEqual(blob, plaintext);
  assert.strictEqual(decryptCookie(blob), plaintext);
});

test('cookieVault: tampering with the ciphertext blob is detected', () => {
  const blob = encryptCookie('sensitive-session-value');
  const tampered = blob.slice(0, -4) + (blob.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA');
  assert.throws(() => decryptCookie(tampered));
});

// --- bankStatement: CSV ---

test('parseBankCsv: splits income (credit) vs expense (debit) via a single signed amount column', () => {
  const csv = 'Data;Descrição;Montante\n2026-01-15;Client X invoice;1200,00\n2026-01-18;Office supplies;-45,90\n';
  const rows = parseBankCsv(csv);
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].type, 'income');
  assert.strictEqual(rows[0].amount, 1200);
  assert.strictEqual(rows[0].date, '2026-01-15');
  assert.strictEqual(rows[0].source, 'bank_import');
  assert.strictEqual(rows[1].type, 'expense');
  assert.strictEqual(rows[1].amount, 45.9);
});

test('parseBankCsv: supports separate debit/credit columns', () => {
  const csv = 'Data;Descrição;Débito;Crédito\n2026-02-01;Sale;;500,00\n2026-02-02;Supplies;120,00;\n';
  const rows = parseBankCsv(csv);
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].type, 'income');
  assert.strictEqual(rows[0].amount, 500);
  assert.strictEqual(rows[1].type, 'expense');
  assert.strictEqual(rows[1].amount, 120);
});

test('parseBankCsv: accepts DD/MM/YYYY dates and skips zero-amount rows', () => {
  const csv = 'Data;Descrição;Montante\n15/01/2026;Client Y;300,00\n16/01/2026;No-op;0,00\n';
  const rows = parseBankCsv(csv);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].date, '2026-01-15');
});

test('parseBankCsv: throws a clear error when required columns are missing', () => {
  assert.throws(() => parseBankCsv('Foo;Bar\n1;2\n'), /date column/i);
});

// --- bankStatement: OFX ---

test('parseBankOfx: extracts STMTTRN blocks into normalized rows', () => {
  const ofx = `
    <STMTTRN>
      <TRNTYPE>CREDIT
      <DTPOSTED>20260115120000
      <TRNAMT>1200.00
      <MEMO>Client X invoice
    </STMTTRN>
    <STMTTRN>
      <TRNTYPE>DEBIT
      <DTPOSTED>20260118120000
      <TRNAMT>-45.90
      <NAME>Office supplies
    </STMTTRN>
  `;
  const rows = parseBankOfx(ofx);
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].type, 'income');
  assert.strictEqual(rows[0].date, '2026-01-15');
  assert.strictEqual(rows[0].description, 'Client X invoice');
  assert.strictEqual(rows[1].type, 'expense');
  assert.strictEqual(rows[1].amount, 45.9);
});

// --- HTTP: bank statement import route ---

test('POST /me/import/bank-statement creates ledger transactions tagged source=bank_import', async () => {
  const { data } = await createProfile();
  const headers = authHeaders(data.apiKey);

  const importRes = await fetch(`${baseUrl}/api/v1/me/import/bank-statement`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ format: 'csv', content: 'Data;Descrição;Montante\n2026-03-01;Client Z;800,00\n' })
  });
  const importBody = await importRes.json();
  assert.strictEqual(importRes.status, 201);
  assert.strictEqual(importBody.data.transactionsCreated, 1);

  const listRes = await fetch(`${baseUrl}/api/v1/me/transactions`, { headers });
  const listBody = await listRes.json();
  assert.strictEqual(listBody.data.length, 1);
  assert.strictEqual(listBody.data[0].source, 'bank_import');
});

// --- HTTP: connector session/sync lifecycle ---

test('connectors lifecycle: PUT session -> GET status -> POST sync (501 stub) -> cooldown -> DELETE', async () => {
  const { data } = await createProfile();
  const headers = authHeaders(data.apiKey);

  const emptyStatus = await (await fetch(`${baseUrl}/api/v1/me/connectors`, { headers })).json();
  assert.deepStrictEqual(emptyStatus.data.map((s) => s.provider).sort(), ['financas', 'segsocial']);
  assert.ok(emptyStatus.data.every((s) => s.capturedAt === null));

  const putRes = await fetch(`${baseUrl}/api/v1/me/connectors/financas/session`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ cookie: 'JSESSIONID=fake-test-value', label: 'test capture' })
  });
  const putBody = await putRes.json();
  assert.strictEqual(putRes.status, 201);
  assert.ok(!('cookieEnc' in putBody.data), 'the encrypted cookie must never be returned by the API');
  assert.ok(!('cookie' in putBody.data), 'the plaintext cookie must never be returned by the API');

  const syncRes = await fetch(`${baseUrl}/api/v1/me/connectors/financas/sync`, { method: 'POST', headers });
  const syncBody = await syncRes.json();
  assert.strictEqual(syncRes.status, 501);
  assert.ok(syncBody.needed, 'unimplemented adapters must explain what to capture next');

  const cooldownRes = await fetch(`${baseUrl}/api/v1/me/connectors/financas/sync`, { method: 'POST', headers });
  assert.strictEqual(cooldownRes.status, 429);

  const delRes = await fetch(`${baseUrl}/api/v1/me/connectors/financas/session`, { method: 'DELETE', headers });
  assert.strictEqual(delRes.status, 204);

  const delAgainRes = await fetch(`${baseUrl}/api/v1/me/connectors/financas/session`, { method: 'DELETE', headers });
  assert.strictEqual(delAgainRes.status, 404);
});

test('connectors: unknown provider is rejected with 400', async () => {
  const { data } = await createProfile();
  const headers = authHeaders(data.apiKey);

  const res = await fetch(`${baseUrl}/api/v1/me/connectors/unknown-provider/session`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ cookie: 'x' })
  });
  assert.strictEqual(res.status, 400);
});

test('connectors: syncing without a stored session is rejected with 400', async () => {
  const { data } = await createProfile();
  const headers = authHeaders(data.apiKey);

  const res = await fetch(`${baseUrl}/api/v1/me/connectors/segsocial/sync`, { method: 'POST', headers });
  assert.strictEqual(res.status, 400);
});

test('connectors: routes require authentication', async () => {
  const res = await fetch(`${baseUrl}/api/v1/me/connectors`);
  assert.strictEqual(res.status, 401);
});
