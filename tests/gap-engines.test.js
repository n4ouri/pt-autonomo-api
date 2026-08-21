import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateContabilidadeOrganizada } from '../src/engines/contabilidade-organizada.js';
import { calculateSeguroAcidentesTrabalho } from '../src/engines/seguro-acidentes-trabalho.js';
import { calculateRendimentosPrediais } from '../src/engines/categoria-f.js';
import { calculateMaisValiasCategoriaG } from '../src/engines/categoria-g.js';
import { calculateProgressiveIRS } from '../src/engines/simplificado.js';

test('Contabilidade Organizada - taxable profit is revenue minus expenses, depreciations and SS', () => {
  const result = simulateContabilidadeOrganizada({
    annualGrossRevenue: 100000,
    deductibleExpenses: 20000,
    depreciations: 5000,
    annualSSPaid: 7000,
    monthlyAccountingFeeOCC: 200
  });

  assert.strictEqual(result.taxableProfit, 68000);
  assert.strictEqual(result.mandatoryCosts.annualAccountingCost, 2400);
  assert.ok(result.taxEstimation.estimatedGrossIRSTax > 0);
  assert.ok(result.simplificadoComparison);
});

test('Contabilidade Organizada - flags mandatory regime above the Simplificado ceiling', () => {
  const result = simulateContabilidadeOrganizada({
    annualGrossRevenue: 250000,
    deductibleExpenses: 50000
  });

  assert.strictEqual(result.eligibility.isMandatoryAboveCeiling, true);
});

test('Contabilidade Organizada - throws on non-positive revenue', () => {
  assert.throws(() => simulateContabilidadeOrganizada({ annualGrossRevenue: 0 }));
});

test('Seguro de Acidentes de Trabalho - estimates a premium band scaled by risk class', () => {
  const baixo = calculateSeguroAcidentesTrabalho({ annualInsuredIncome: 30000, riskClass: 'BAIXO' });
  const alto = calculateSeguroAcidentesTrabalho({ annualInsuredIncome: 30000, riskClass: 'ALTO' });

  assert.strictEqual(baixo.isMandatory, true);
  assert.ok(baixo.estimatedAnnualPremium.midpointEUR < alto.estimatedAnnualPremium.midpointEUR);
  assert.ok(baixo.estimatedAnnualPremium.minEUR >= 60);
});

test('Seguro de Acidentes de Trabalho - self-consumption-only production is exempt', () => {
  const result = calculateSeguroAcidentesTrabalho({ annualInsuredIncome: 10000, isExemptSelfConsumptionOnly: true });
  assert.strictEqual(result.isMandatory, false);
});

test('Categoria F - applies the correct autonomous rate per contract type', () => {
  const geral = calculateRendimentosPrediais({ annualGrossRent: 12000, deductibleExpenses: 2000, contractType: 'HABITACIONAL_GERAL' });
  const moderada = calculateRendimentosPrediais({ annualGrossRent: 12000, deductibleExpenses: 2000, contractType: 'HABITACIONAL_RENDA_MODERADA' });
  const naoHabitacional = calculateRendimentosPrediais({ annualGrossRent: 12000, deductibleExpenses: 2000, contractType: 'NAO_HABITACIONAL' });

  assert.strictEqual(geral.autonomousTaxation.appliedRatePercent, 25);
  assert.strictEqual(moderada.autonomousTaxation.appliedRatePercent, 10);
  assert.strictEqual(naoHabitacional.autonomousTaxation.appliedRatePercent, 28);
  assert.strictEqual(geral.netPredialIncome, 10000);
  assert.strictEqual(geral.autonomousTaxation.estimatedTaxEUR, 2500);
});

test('Categoria G - securities and short-term crypto gains taxed at 28%, long-term crypto exempt', () => {
  const result = calculateMaisValiasCategoriaG({
    securitiesGains: 5000,
    securitiesLosses: 1000,
    cryptoGainsShortTerm: 2000,
    cryptoGainsLongTerm: 3000
  });

  assert.strictEqual(result.securities.taxableBalance, 4000);
  assert.strictEqual(result.securities.estimatedTaxEUR, 1120);
  assert.strictEqual(result.cryptoAssets.shortTerm.estimatedTaxEUR, 560);
  assert.strictEqual(result.cryptoAssets.longTerm.isExempt, true);
  assert.strictEqual(result.cryptoAssets.longTerm.estimatedTaxEUR, 0);
  assert.strictEqual(result.totalAutonomousTaxEUR, 1680);
});

test('Categoria G - net losses in securities do not produce negative tax', () => {
  const result = calculateMaisValiasCategoriaG({ securitiesGains: 1000, securitiesLosses: 4000 });
  assert.strictEqual(result.securities.netBalance, -3000);
  assert.strictEqual(result.securities.taxableBalance, 0);
  assert.strictEqual(result.securities.estimatedTaxEUR, 0);
  assert.ok(result.securities.lossCarryforwardNote);
});

test('Mínimo de existência - income below the Art. 70.º CIRS floor is fully untaxed', () => {
  const result = calculateProgressiveIRS(10000);
  assert.strictEqual(result.minimoExistenciaApplied, true);
  assert.strictEqual(result.tax, 0);
});

test('Mínimo de existência - can be disabled explicitly', () => {
  const withFloor = calculateProgressiveIRS(10000);
  const withoutFloor = calculateProgressiveIRS(10000, { applyMinimoExistencia: false });
  assert.ok(withoutFloor.tax >= withFloor.tax);
});
