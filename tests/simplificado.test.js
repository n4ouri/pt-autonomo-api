import { test } from 'node:test';
import assert from 'node:assert';
import { simulateRegimeSimplificado, calculateProgressiveIRS } from '../src/engines/simplificado.js';

test('Regime Simplificado - Year 3 Standard Services (75% base & 15% expenses)', () => {
  const result = simulateRegimeSimplificado({
    annualGrossServices: 60000,
    activityYear: 3,
    annualSSPaid: 7200,
    businessExpenses: 2000,
    homeOfficeEligibleExpenses: 2400
  });

  assert.strictEqual(result.grossIncome.total, 60000);
  assert.strictEqual(result.simplificado.standardTaxableBase, 45000); // 60000 * 0.75
  
  // 15% target is 9000
  assert.strictEqual(result.simplificado.expenseJustification.targetRequired15Percent, 9000);

  // Automatic deduction = max(4104, 7200) = 7200
  assert.strictEqual(result.simplificado.expenseJustification.automaticSpecificDeduction, 7200);

  // Home office 25% of 2400 = 600
  assert.strictEqual(result.simplificado.expenseJustification.homeOfficeDeduction, 600);

  // Total justified = 7200 + 2000 + 600 = 9800 (> 9000 target) -> deficit is 0
  assert.strictEqual(result.simplificado.expenseJustification.totalJustifiedExpenses, 9800);
  assert.strictEqual(result.simplificado.expenseJustification.expenseDeficit, 0);
  assert.strictEqual(result.simplificado.expenseJustification.isFullyJustified, true);
  assert.strictEqual(result.simplificado.finalTaxableIncome, 45000);
});

test('Regime Simplificado - Year 1 Start of Activity Discount (50% cut in taxable base)', () => {
  const result = simulateRegimeSimplificado({
    annualGrossServices: 40000,
    activityYear: 1,
    annualSSPaid: 0 // Exempt 1st year
  });

  // Base is 40000 * 0.75 = 30000. 50% discount = 15000
  assert.strictEqual(result.simplificado.activityYearBonus.eligible, true);
  assert.strictEqual(result.simplificado.activityYearBonus.discountPercentage, 50);
  assert.strictEqual(result.simplificado.activityYearBonus.discountAmount, 15000);
});

test('Regime Simplificado - Deficit in expenses increases taxable base', () => {
  const result = simulateRegimeSimplificado({
    annualGrossServices: 100000,
    activityYear: 3,
    annualSSPaid: 4104, // only standard deduction
    businessExpenses: 0,
    homeOfficeEligibleExpenses: 0
  });

  // Target 15% is 15000. Justified is 4104. Deficit = 10896
  assert.strictEqual(result.simplificado.expenseJustification.targetRequired15Percent, 15000);
  assert.strictEqual(result.simplificado.expenseJustification.expenseDeficit, 10896);
  assert.strictEqual(result.simplificado.finalTaxableIncome, 75000 + 10896);
});

test('Progressive IRS calculation returns positive tax for taxable income', () => {
  const irs = calculateProgressiveIRS(30000);
  assert.ok(irs.tax > 0);
  assert.ok(irs.effectiveRate > 0);
});
