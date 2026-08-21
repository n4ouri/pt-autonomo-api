import { test } from 'node:test';
import assert from 'node:assert';
import { runCompleteTaxAudit } from '../src/engines/audit-engine.js';

test('Audit - empty snapshot yields a perfect health score with no alerts or debts', () => {
  const result = runCompleteTaxAudit({});
  assert.strictEqual(result.healthScore, 100);
  assert.strictEqual(result.alerts.length, 0);
  assert.strictEqual(result.statusOverview.totalActiveDebts, 0);
  assert.strictEqual(result.statusOverview.fiscalStatus, 'Regularizada');
  assert.strictEqual(result.statusOverview.ssStatus, 'Regularizada');
});

test('Audit - non-regularized SS situation raises a CRITICAL alert and docks 40 points', () => {
  const result = runCompleteTaxAudit({ segSocial: { situacaoContributiva: 'Em Divida' } });
  assert.strictEqual(result.healthScore, 60);
  const alert = result.alerts.find((a) => a.title.includes('Situação Contributiva'));
  assert.ok(alert);
  assert.strictEqual(alert.priority, 'CRITICAL');
});

test('Audit - SS debts and AT debts both accumulate into totalActiveDebts and stack score penalties', () => {
  const result = runCompleteTaxAudit({
    segSocial: { dividas: { total: 500 } },
    at: { dividas: { total: 1000 } }
  });
  assert.strictEqual(result.statusOverview.totalActiveDebts, 1500);
  assert.strictEqual(result.healthScore, 100 - 20 - 35);
  assert.ok(result.alerts.some((a) => a.priority === 'HIGH' && a.source === 'Segurança Social Direta'));
  assert.ok(result.alerts.some((a) => a.priority === 'CRITICAL' && a.source === 'Autoridade Tributária (AT)'));
});

test('Audit - pending e-Fatura invoices cap their penalty at 20 points regardless of volume', () => {
  const few = runCompleteTaxAudit({ efatura: { faturasPendentes: 3 } });
  const many = runCompleteTaxAudit({ efatura: { faturasPendentes: 50 } });
  assert.strictEqual(few.healthScore, 100 - 6);
  assert.strictEqual(many.healthScore, 100 - 20);
  assert.strictEqual(many.statusOverview.pendingInvoicesToValidate, 50);
});

test('Audit - health score never drops below 0 even when every penalty applies', () => {
  const result = runCompleteTaxAudit({
    segSocial: { situacaoContributiva: 'Em Divida', dividas: { total: 5000 } },
    at: { situacaoFiscal: 'Em Divida', dividas: { total: 5000 } },
    efatura: { faturasPendentes: 50 }
  });
  assert.strictEqual(result.healthScore, 0);
});

test('Audit - positive quarterly income runs the downstream simplificado/SS/company engines and surfaces the SS escalão opportunity', () => {
  const result = runCompleteTaxAudit({
    segSocial: { trabalhadorIndependente: { rendimentoRelevanteTrimestral: 7000 } }
  });
  assert.ok(result.engines.simplificado);
  assert.ok(result.engines.segurancaSocial);
  assert.ok(result.engines.companyVsRecibos);
  assert.ok(result.opportunities.some((o) => o.title.includes('Ajuste Estratégico de Escalão')));
});

test('Audit - an unjustified expense deficit surfaces as an opportunity and docks 10 points', () => {
  const result = runCompleteTaxAudit({
    segSocial: { trabalhadorIndependente: { rendimentoRelevanteTrimestral: 7000 } },
    at: { regimeSimplificado: { despesasAtividade: 0 } }
  });
  assert.ok(result.opportunities.some((o) => o.title.includes('Défice de Justificação de Despesas')));
  assert.strictEqual(result.healthScore, 100 - 10);
});

test('Audit - zero relevant income skips the downstream engines entirely', () => {
  const result = runCompleteTaxAudit({});
  assert.strictEqual(result.engines.simplificado, null);
  assert.strictEqual(result.engines.segurancaSocial, null);
  assert.strictEqual(result.engines.companyVsRecibos, null);
  assert.ok(result.engines.efatura);
});
