import { test } from 'node:test';
import assert from 'node:assert';
import { simulateIRSJovem } from '../src/engines/irs-jovem.js';
import { calculateSegurancaSocialBenefits } from '../src/engines/ss-benefits.js';
import { calculateIVAPeriodicAssessment } from '../src/engines/iva-apuramento.js';
import { calculateWithholdingTaxAtSource } from '../src/engines/retencao-fonte.js';

test('IRS Jovem - Year 1 grants 100% exemption capped by 55 IAS', () => {
  const result = simulateIRSJovem({
    annualTaxableIncome: 25000,
    age: 26,
    yearOfBenefit: 1,
    educationLevel: 6
  });

  assert.strictEqual(result.isEligible, true);
  assert.strictEqual(result.exemptionDetails.exemptionRatePercent, 100);
  assert.strictEqual(result.exemptionDetails.taxableIncomeAfterExemptionEUR, 0);
  assert.strictEqual(result.taxComparison.taxWithIRSJovemEUR, 0);
  assert.ok(result.taxComparison.netAnnualTaxSavingsEUR > 3000);
});

test('IRS Jovem - Rejects ineligible age (> 35)', () => {
  const result = simulateIRSJovem({
    annualTaxableIncome: 30000,
    age: 37
  });

  assert.strictEqual(result.isEligible, false);
  assert.strictEqual(result.netTaxSavingsEUR, 0);
});

test('SS Benefits - Computes 100% parental leave and 10-day sickness waiting period', () => {
  const result = calculateSegurancaSocialBenefits({
    monthlyContributionBase: 3000,
    registeredMonthsInLastYear: 12,
    hasDebtToSS: false
  });

  assert.strictEqual(result.eligibilityCheck.isEligible, true);
  assert.strictEqual(result.parentalBenefits.option120Days.percentageOfRemuneration, 100);
  assert.strictEqual(result.parentalBenefits.option120Days.monthlyEquivalentEUR, 3000);
  assert.strictEqual(result.sicknessBenefits.waitingPeriodDays, 10);
});

test('IVA Periodic Assessment - Calculates Quadro 06 and Net VAT to Pay / Credit', () => {
  const result = calculateIVAPeriodicAssessment({
    grossInvoicedNormalRate: 10000, // 2300 € VAT
    deductibleVATEquipment: 500,
    deductibleVATGeneralExpenses: 300
  });

  assert.strictEqual(result.assessmentResult.totalIVALiquidadoEUR, 2300);
  assert.strictEqual(result.assessmentResult.totalIVADedutivelEUR, 800);
  assert.strictEqual(result.assessmentResult.netVATBalanceEUR, 1500);
  assert.strictEqual(result.assessmentResult.status, 'IVA_A_PAGAR');
});

test('Retenção na Fonte - Correctly selects 25% for Tabela 151 and 0% for Foreign Clients', () => {
  const t151 = calculateWithholdingTaxAtSource({
    invoiceAmount: 2000,
    serviceType: 'TABELA_151'
  });
  assert.strictEqual(t151.invoiceFinancials.withholdingRatePercent, 25);
  assert.strictEqual(t151.invoiceFinancials.withheldTaxAmountEUR, 500);

  const foreign = calculateWithholdingTaxAtSource({
    invoiceAmount: 4000,
    isClientForeignEntity: true
  });
  assert.strictEqual(foreign.invoiceFinancials.withholdingRatePercent, 0);
  assert.strictEqual(foreign.cashflowAndSettlementAnalysis.isExemptFromWithholding, true);
});
