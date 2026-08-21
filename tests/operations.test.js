process.env.DATABASE_PATH = ':memory:';

import { test, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.js';

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

async function createProfile(overrides = {}) {
  const res = await fetch(`${baseUrl}/api/v1/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Autónomo', nif: '123456789', regimeIVA: 'trimestral', ...overrides })
  });
  const body = await res.json();
  return { res, body };
}

function authHeaders(apiKey) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
}

test('POST /api/v1/profiles creates a profile and returns a one-time API key', async () => {
  const { res, body } = await createProfile();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.status, 'success');
  assert.ok(body.data.apiKey.startsWith('pta_'));
  assert.strictEqual(body.data.profile.name, 'Test Autónomo');
  assert.ok(body.guidance);
});

test('POST /api/v1/profiles rejects an invalid NIF', async () => {
  const { res, body } = await createProfile({ nif: 'abc' });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.status, 'error');
});

test('GET /api/v1/me requires auth', async () => {
  const res = await fetch(`${baseUrl}/api/v1/me`);
  assert.strictEqual(res.status, 401);
});

test('GET /api/v1/me rejects an unknown API key', async () => {
  const res = await fetch(`${baseUrl}/api/v1/me`, { headers: authHeaders('pta_doesnotexist') });
  assert.strictEqual(res.status, 401);
});

test('GET /api/v1/me returns the authenticated profile', async () => {
  const { body: created } = await createProfile();
  const res = await fetch(`${baseUrl}/api/v1/me`, { headers: authHeaders(created.data.apiKey) });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.data.id, created.data.profile.id);
});

test('PATCH /api/v1/me updates profile settings', async () => {
  const { body: created } = await createProfile();
  const res = await fetch(`${baseUrl}/api/v1/me`, {
    method: 'PATCH',
    headers: authHeaders(created.data.apiKey),
    body: JSON.stringify({ regimeIVA: 'mensal' })
  });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.data.regimeIVA, 'mensal');
});

test('transaction CRUD: create, list, update, delete', async () => {
  const { body: created } = await createProfile();
  const headers = authHeaders(created.data.apiKey);

  const createRes = await fetch(`${baseUrl}/api/v1/me/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'income', date: '2026-02-10', amount: 1000, category: 'SERVICOS_PROFISSIONAIS', vatRate: 0.23 })
  });
  const createBody = await createRes.json();
  assert.strictEqual(createRes.status, 201);
  const id = createBody.data.id;

  const listRes = await fetch(`${baseUrl}/api/v1/me/transactions`, { headers });
  const listBody = await listRes.json();
  assert.strictEqual(listBody.data.length, 1);

  const patchRes = await fetch(`${baseUrl}/api/v1/me/transactions/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ amount: 1500 })
  });
  const patchBody = await patchRes.json();
  assert.strictEqual(patchBody.data.amount, 1500);

  const delRes = await fetch(`${baseUrl}/api/v1/me/transactions/${id}`, { method: 'DELETE', headers });
  assert.strictEqual(delRes.status, 204);

  const listAfter = await fetch(`${baseUrl}/api/v1/me/transactions`, { headers });
  const listAfterBody = await listAfter.json();
  assert.strictEqual(listAfterBody.data.length, 0);
});

test('income transaction category must be a valid CIRS coefficient bucket', async () => {
  const { body: created } = await createProfile();
  const res = await fetch(`${baseUrl}/api/v1/me/transactions`, {
    method: 'POST',
    headers: authHeaders(created.data.apiKey),
    body: JSON.stringify({ type: 'income', date: '2026-02-10', amount: 1000, category: 'NOT_A_REAL_CATEGORY' })
  });
  assert.strictEqual(res.status, 400);
});

test('a transaction is only visible to its own profile', async () => {
  const { body: ownerA } = await createProfile();
  const { body: ownerB } = await createProfile();

  await fetch(`${baseUrl}/api/v1/me/transactions`, {
    method: 'POST',
    headers: authHeaders(ownerA.data.apiKey),
    body: JSON.stringify({ type: 'income', date: '2026-02-10', amount: 1000, category: 'SERVICOS_PROFISSIONAIS' })
  });

  const listB = await fetch(`${baseUrl}/api/v1/me/transactions`, { headers: authHeaders(ownerB.data.apiKey) });
  const bodyB = await listB.json();
  assert.strictEqual(bodyB.data.length, 0);
});

test('GET /api/v1/me/ledger/summary aggregates income/expenses by CIRS category and VAT', async () => {
  const { body: created } = await createProfile();
  const headers = authHeaders(created.data.apiKey);

  await fetch(`${baseUrl}/api/v1/me/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'income', date: '2026-02-10', amount: 5000, category: 'SERVICOS_PROFISSIONAIS', vatRate: 0.23 })
  });
  await fetch(`${baseUrl}/api/v1/me/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'expense', date: '2026-02-15', amount: 800, category: 'EQUIPAMENTO', vatRate: 0.23, isJustifiedExpense: true })
  });

  const res = await fetch(`${baseUrl}/api/v1/me/ledger/summary?year=2026&quarter=1`, { headers });
  const body = await res.json();

  assert.strictEqual(body.data.income.total, 5000);
  assert.strictEqual(body.data.income.byCategory.SERVICOS_PROFISSIONAIS, 5000);
  assert.strictEqual(body.data.expenses.justified, 800);
  assert.strictEqual(body.data.vat.collected, 1150);
  assert.strictEqual(body.data.vat.deductible, 184);
});

test('GET /api/v1/me/obligations returns a personalized timeline with due dates and guidance', async () => {
  const { body: created } = await createProfile({ regimeIVA: 'trimestral' });
  const headers = authHeaders(created.data.apiKey);

  const res = await fetch(`${baseUrl}/api/v1/me/obligations`, { headers });
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((o) => o.obligationKey && o.dueDate && o.status === 'pending'));
  assert.ok(body.guidance);

  const ivaObligations = body.data.filter((o) => o.calendarCode === 'IVA_TRIMESTRAL');
  assert.ok(ivaObligations.length > 0, 'IVA obligations should appear for a trimestral-regime profile');
});

test('IVA obligations are absent for a profile exempt from VAT (regimeIVA=isento)', async () => {
  const { body: created } = await createProfile({ regimeIVA: 'isento' });
  const res = await fetch(`${baseUrl}/api/v1/me/obligations`, { headers: authHeaders(created.data.apiKey) });
  const body = await res.json();
  const ivaObligations = body.data.filter((o) => o.calendarCode === 'IVA_TRIMESTRAL');
  assert.strictEqual(ivaObligations.length, 0);
});

test('PATCH /api/v1/me/obligations/:key marks an obligation as paid and it persists', async () => {
  const { body: created } = await createProfile();
  const headers = authHeaders(created.data.apiKey);

  const listRes = await fetch(`${baseUrl}/api/v1/me/obligations`, { headers });
  const listBody = await listRes.json();
  const key = listBody.data[0].obligationKey;

  const patchRes = await fetch(`${baseUrl}/api/v1/me/obligations/${key}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'paid', amountPaid: 42, paidDate: '2026-03-01' })
  });
  assert.strictEqual(patchRes.status, 200);

  const listAfter = await fetch(`${baseUrl}/api/v1/me/obligations`, { headers });
  const listAfterBody = await listAfter.json();
  const updated = listAfterBody.data.find((o) => o.obligationKey === key);
  assert.strictEqual(updated.status, 'paid');
  assert.strictEqual(updated.amountPaid, 42);
});

test('PATCH /api/v1/me/obligations/:key rejects an unknown obligationKey', async () => {
  const { body: created } = await createProfile();
  const res = await fetch(`${baseUrl}/api/v1/me/obligations/NOT_A_REAL_KEY`, {
    method: 'PATCH',
    headers: authHeaders(created.data.apiKey),
    body: JSON.stringify({ status: 'paid' })
  });
  assert.strictEqual(res.status, 404);
});

test('GET /api/v1/me/dashboard combines the ledger, the 360º audit, and upcoming obligations', async () => {
  const { body: created } = await createProfile();
  const headers = authHeaders(created.data.apiKey);

  await fetch(`${baseUrl}/api/v1/me/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'income', date: new Date().toISOString().slice(0, 10), amount: 3000, category: 'SERVICOS_PROFISSIONAIS' })
  });

  const res = await fetch(`${baseUrl}/api/v1/me/dashboard`, { headers });
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.ok(typeof body.data.audit.healthScore === 'number');
  assert.ok(body.data.ledger.currentQuarter);
  assert.ok(Array.isArray(body.data.upcomingObligations));
  assert.ok(body.guidance);
});

test('existing /simulate/regime-simplificado keeps its response shape and gains a guidance field', async () => {
  const res = await fetch(`${baseUrl}/api/v1/simulate/regime-simplificado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ annualGrossServices: 60000, activityYear: 3 })
  });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.data.taxEstimation);
  assert.ok(body.guidance.plainLanguage.en);
});

test('existing /simulate/regime-simplificado rejects non-numeric input instead of propagating NaN', async () => {
  const res = await fetch(`${baseUrl}/api/v1/simulate/regime-simplificado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ annualGrossServices: 'not-a-number' })
  });
  assert.strictEqual(res.status, 400);
});

test('unknown route returns a JSON 404', async () => {
  const res = await fetch(`${baseUrl}/api/v1/does-not-exist`);
  assert.strictEqual(res.status, 404);
  const body = await res.json();
  assert.strictEqual(body.status, 'error');
});
