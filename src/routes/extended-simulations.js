import express from 'express';
import { simulateContabilidadeOrganizada } from '../engines/contabilidade-organizada.js';
import { calculateSeguroAcidentesTrabalho } from '../engines/seguro-acidentes-trabalho.js';
import { calculateRendimentosPrediais } from '../engines/categoria-f.js';
import { calculateMaisValiasCategoriaG } from '../engines/categoria-g.js';
import { withGuidance } from '../lib/guidance.js';
import { num } from '../lib/numbers.js';

/**
 * Stateless simulators for the tax/SS domains identified as coverage gaps in the source-of-truth
 * audit: Contabilidade Organizada, mandatory work-accident insurance, Categoria F (rendas) and
 * Categoria G (mais-valias mobiliárias e criptoativos). Kept in a dedicated router, mirroring the
 * split already used for the profile/ledger/obligations layer, so it can be mounted independently.
 */
export const router = express.Router();

/**
 * Regime de Contabilidade Organizada (Artigos 28.º, 32.º e 33.º do CIRS)
 */
router.post('/simulate/contabilidade-organizada', (req, res) => {
  try {
    const {
      annualGrossRevenue = 0,
      deductibleExpenses = 0,
      depreciations = 0,
      annualSSPaid = 0,
      monthlyAccountingFeeOCC = 150,
      withheldTax = 0,
      comparisonCoefficient = 0.75
    } = req.body || {};

    const result = simulateContabilidadeOrganizada({
      annualGrossRevenue: num(annualGrossRevenue),
      deductibleExpenses: num(deductibleExpenses),
      depreciations: num(depreciations),
      annualSSPaid: num(annualSSPaid),
      monthlyAccountingFeeOCC: num(monthlyAccountingFeeOCC, 150),
      withheldTax: num(withheldTax),
      comparisonCoefficient: num(comparisonCoefficient, 0.75)
    });

    res.json(withGuidance('contabilidade-organizada', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Seguro Obrigatório de Acidentes de Trabalho (Art. 3.º DL 159/99 + Lei n.º 98/2009)
 */
router.post('/simulate/seguro-acidentes-trabalho', (req, res) => {
  try {
    const {
      annualInsuredIncome = 0,
      riskClass = 'BAIXO',
      isExemptSelfConsumptionOnly = false
    } = req.body || {};

    const result = calculateSeguroAcidentesTrabalho({
      annualInsuredIncome: num(annualInsuredIncome),
      riskClass,
      isExemptSelfConsumptionOnly: Boolean(isExemptSelfConsumptionOnly)
    });

    res.json(withGuidance('seguro-acidentes-trabalho', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Categoria F - Rendimentos Prediais (Artigos 8.º, 41.º e 72.º do CIRS)
 */
router.post('/simulate/categoria-f', (req, res) => {
  try {
    const {
      annualGrossRent = 0,
      deductibleExpenses = 0,
      imiPaid = 0,
      contractType = 'HABITACIONAL_GERAL'
    } = req.body || {};

    const result = calculateRendimentosPrediais({
      annualGrossRent: num(annualGrossRent),
      deductibleExpenses: num(deductibleExpenses),
      imiPaid: num(imiPaid),
      contractType
    });

    res.json(withGuidance('categoria-f', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Categoria G - Mais-Valias de Valores Mobiliários e Criptoativos (Artigos 10.º e 72.º do CIRS)
 */
router.post('/simulate/categoria-g', (req, res) => {
  try {
    const {
      securitiesGains = 0,
      securitiesLosses = 0,
      cryptoGainsShortTerm = 0,
      cryptoGainsLongTerm = 0,
      cryptoLossesShortTerm = 0
    } = req.body || {};

    const result = calculateMaisValiasCategoriaG({
      securitiesGains: num(securitiesGains),
      securitiesLosses: num(securitiesLosses),
      cryptoGainsShortTerm: num(cryptoGainsShortTerm),
      cryptoGainsLongTerm: num(cryptoGainsLongTerm),
      cryptoLossesShortTerm: num(cryptoLossesShortTerm)
    });

    res.json(withGuidance('categoria-g', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});
