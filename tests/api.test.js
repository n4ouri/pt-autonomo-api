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

test('HTTP GET /api/v1/health returns 200 and health payload', async () => {
  const res = await fetch(`${baseUrl}/api/v1/health`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'ok');
  assert.strictEqual(body.service, 'pt-autonomo-api');
});

test('HTTP GET /api/v1/constants returns tax brackets and IAS', async () => {
  const res = await fetch(`${baseUrl}/api/v1/constants`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'success');
  assert.ok(body.data.IAS_2026 > 500);
});

test('HTTP POST /api/v1/simulate/regime-simplificado processes valid payload', async () => {
  const res = await fetch(`${baseUrl}/api/v1/simulate/regime-simplificado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      annualGrossServices: 50000,
      activityYear: 3,
      annualSSPaid: 6000,
      businessExpenses: 1500
    })
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'success');
  assert.strictEqual(body.data.grossIncome.servicesTabela151, 50000);
  assert.strictEqual(body.data.simplificado.standardTaxableBase, 37500);
});

test('HTTP POST /api/v1/simulate/company-vs-recibos compares structures', async () => {
  const res = await fetch(`${baseUrl}/api/v1/simulate/company-vs-recibos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      annualGrossRevenue: 70000,
      annualOperationalExpenses: 5000
    })
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'success');
  assert.strictEqual(body.data.verdict.recommendedStructure, 'SOCIEDADE_UNIPESSOAL');
});
