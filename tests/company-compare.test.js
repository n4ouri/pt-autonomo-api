import { test } from 'node:test';
import assert from 'node:assert';
import { compareCompanyVsRecibosVerdes } from '../src/engines/company-compare.js';

test('Company Comparison - Recommends Recibos Verdes for low turnover (< 30k)', () => {
  const result = compareCompanyVsRecibosVerdes({
    annualGrossRevenue: 25000,
    annualOperationalExpenses: 2000,
    monthlyDirectorSalary: 1000
  });

  assert.strictEqual(result.verdict.recommendedStructure, 'RECIBOS_VERDES');
  assert.ok(result.comparison.recibosVerdes.totalTaxesAndSS > 0);
});

test('Company Comparison - Recommends Sociedade Unipessoal for higher turnover (> 60k)', () => {
  const result = compareCompanyVsRecibosVerdes({
    annualGrossRevenue: 75000,
    annualOperationalExpenses: 6000,
    monthlyDirectorSalary: 1400
  });

  assert.strictEqual(result.verdict.recommendedStructure, 'SOCIEDADE_UNIPESSOAL');
  assert.ok(result.verdict.netAdvantageAnnualEUR > 0);
  assert.ok(result.comparison.sociedadeUnipessoal.taxFreeMealAllowanceAnnual > 0);
});
