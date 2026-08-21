import { test } from 'node:test';
import assert from 'node:assert';
import { simulateNHRTax } from '../src/engines/nhr-simulator.js';
import { calculateTaxFreeAllowances } from '../src/engines/tax-free-allowances.js';
import { calculatePagamentosPorConta } from '../src/engines/ppc-forecast.js';

test('NHR Simulator - Applies flat 20% tax on 75% taxable base for high-value activities', () => {
  const result = simulateNHRTax({
    annualGrossServices: 80000,
    annualSSPaid: 8000,
    businessExpenses: 4000,
    isEligibleHighValueActivity: true
  });

  // Base = 80000 * 0.75 = 60000. 20% flat tax = 12000
  assert.strictEqual(result.nhrResults.grossIRSTax, 12000);
  assert.strictEqual(result.nhrResults.effectiveTaxRatePercent, 15); // 12000 / 80000 = 15%
  assert.ok(result.comparisonWithStandardIRS.annualSavingsWithNHR > 5000);
});

test('Tax Free Allowances - Calculates Km and Meal card correctly', () => {
  const result = calculateTaxFreeAllowances({
    monthlyKmDriven: 1000,
    workDaysPerMonth: 22,
    nationalTravelDaysPerYear: 5,
    foreignTravelDaysPerYear: 2
  });

  // 12000 km * 0.40 = 4800 €
  assert.strictEqual(result.breakdown.kmAllowance.annualTaxFreeAmountEUR, 4800);
  // 242 days * 10.20 = 2468.40 €
  assert.strictEqual(result.breakdown.mealCardAllowance.annualTaxFreeAmountEUR, 2468.40);
  assert.ok(result.summary.totalAnnualTaxFreeNetCashEUR > 7000);
});

test('PPC Forecast - Suspends 3rd instalment when estimated tax is already covered', () => {
  const result = calculatePagamentosPorConta({
    priorYearNetTax: 12000,
    priorYearWithholding: 0,
    currentYearEstimatedTax: 6000,
    currentYearWithholding: 1000
  });

  assert.strictEqual(result.isPPCRequired, true);
  assert.strictEqual(result.schedule.length, 3);
  // 12000 * 0.765 = 9180 total PPC -> 3060 per instalment.
  // Instalment 1 + 2 = 6120 + 1000 withholding = 7120 > 6000 estimated tax -> eligible to suspend!
  assert.strictEqual(result.thirdPaymentSuspensionAnalysis.isEligibleToSuspendDecemberPayment, true);
});
