import { test } from 'node:test';
import assert from 'node:assert';
import { determineVIESAndVATCompliance } from '../src/engines/vies-compliance.js';

test('VIES Compliance - EU B2B with valid VIES gets 0% Reverse Charge and mandatory clause', () => {
  const result = determineVIESAndVATCompliance({
    clientType: 'EU_B2B',
    invoiceAmount: 5000,
    hasValidVIES: true
  });

  assert.strictEqual(result.financials.vatRatePercent, 0);
  assert.strictEqual(result.financials.vatAmount, 0);
  assert.strictEqual(result.compliance.viesRecapitulativaMandatory, true);
  assert.ok(result.compliance.invoiceMandatoryClause.includes('Autoliquidação'));
});

test('VIES Compliance - Non-EU client gets 0% export without VIES obligation', () => {
  const result = determineVIESAndVATCompliance({
    clientType: 'NON_EU',
    invoiceAmount: 5000
  });

  assert.strictEqual(result.financials.vatRatePercent, 0);
  assert.strictEqual(result.compliance.viesRecapitulativaMandatory, false);
});
