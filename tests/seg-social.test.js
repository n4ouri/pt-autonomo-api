import { test } from 'node:test';
import assert from 'node:assert';
import { simulateSegurancaSocialQuarterly } from '../src/engines/seg-social.js';

test('Segurança Social - 70% relevant income and monthly base calculation', () => {
  const result = simulateSegurancaSocialQuarterly({
    quarterlyGrossServices: 15000,
    quarterlyGrossSales: 0
  });

  // Relevant income = 15000 * 0.70 = 10500
  assert.strictEqual(result.relevantIncome.services70Percent, 10500);
  assert.strictEqual(result.relevantIncome.totalRelevantQuarterly, 10500);

  // Monthly base = 10500 / 3 = 3500
  assert.strictEqual(result.relevantIncome.monthlyBaseIncidence, 3500);

  // Standard monthly contribution = 3500 * 21.4% = 749
  assert.strictEqual(result.standardMonthlyContribution, 749);
});

test('Segurança Social - -25% and +25% escalão variations', () => {
  const result = simulateSegurancaSocialQuarterly({
    quarterlyGrossServices: 15000
  });

  const m25 = result.strategicVariations.minus25Percent;
  const p25 = result.strategicVariations.plus25Percent;

  // Monthly base under -25% = 3500 * 0.75 = 2625
  assert.strictEqual(m25.monthlyBase, 2625);
  // Monthly payment = 2625 * 0.214 = 561.75
  assert.strictEqual(m25.monthlyPayment, 561.75);
  assert.strictEqual(m25.monthlyCashflowSaved, 749 - 561.75); // 187.25

  // Monthly base under +25% = 3500 * 1.25 = 4375
  assert.strictEqual(p25.monthlyBase, 4375);
  // Monthly payment = 4375 * 0.214 = 936.25
  assert.strictEqual(p25.monthlyPayment, 936.25);
  assert.strictEqual(p25.monthlyExtraCost, 936.25 - 749); // 187.25
});

test('Segurança Social - 12 IAS cap works for high revenues', () => {
  const result = simulateSegurancaSocialQuarterly({
    quarterlyGrossServices: 100000
  });

  assert.strictEqual(result.relevantIncome.isCappedAt12IAS, true);
  assert.ok(result.relevantIncome.monthlyBaseIncidence <= result.relevantIncome.maxCeiling12IAS);
});
