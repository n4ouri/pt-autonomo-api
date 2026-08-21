import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';
import { calculateProgressiveIRS, simulateRegimeSimplificado } from './simplificado.js';

/**
 * Regime de Contabilidade Organizada (real-expense Category B taxation) — Artigos 28.º, 32.º
 * and 33.º do CIRS.
 *
 * Mandatory once annual gross income exceeds the Regime Simplificado ceiling (200.000 €) for
 * two consecutive years (Art. 28.º n.º 2 CIRS), or by voluntary election communicated to AT by
 * end of March of the year it is to apply (Art. 28.º n.º 4 CIRS). Taxable income is computed
 * per the IRC rules (Art. 32.º CIRS remits to the CIRC), i.e. actual accounting profit —
 * revenue minus deductible expenses, depreciations, and Social Security contributions — rather
 * than a flat coefficient. Requires a Contabilista Certificado (Art. 12.º do EOCC).
 *
 * @param {object} params
 * @param {number} params.annualGrossRevenue - Total invoiced revenue for the fiscal year
 * @param {number} [params.deductibleExpenses=0] - Documented business expenses with NIF (rent, materials, subcontracting, software...)
 * @param {number} [params.depreciations=0] - Amortizações/depreciações of equipment and assets affected to the activity (Art. 31.º CIRC)
 * @param {number} [params.annualSSPaid=0] - Social Security contributions paid (deductible as an expense under Contabilidade Organizada)
 * @param {number} [params.monthlyAccountingFeeOCC=150] - Certified Accountant (OCC) monthly retainer, mandatory under this regime
 * @param {number} [params.withheldTax=0] - IRS already withheld at source
 * @param {number} [params.comparisonCoefficient=0.75] - Regime Simplificado coefficient to use for the side-by-side comparison
 * @returns {object} Taxable profit, IRS estimation, mandatory accounting cost, and comparison against Regime Simplificado
 */
export function simulateContabilidadeOrganizada({
  annualGrossRevenue = 0,
  deductibleExpenses = 0,
  depreciations = 0,
  annualSSPaid = 0,
  monthlyAccountingFeeOCC = 150,
  withheldTax = 0,
  comparisonCoefficient = 0.75
}) {
  if (annualGrossRevenue <= 0) {
    throw new Error('Annual gross revenue must be greater than 0.');
  }

  const totalDeductions = deductibleExpenses + depreciations + annualSSPaid;
  const taxableProfit = Math.max(0, annualGrossRevenue - totalDeductions);

  const irsResult = calculateProgressiveIRS(taxableProfit);
  const annualAccountingCost = monthlyAccountingFeeOCC * 12;
  const netIRSBalance = irsResult.tax - withheldTax;

  // Side-by-side comparison against the coefficient-based Regime Simplificado, using the same
  // gross revenue as if it were entirely services taxed at `comparisonCoefficient`.
  let simplificadoComparison = null;
  if (annualGrossRevenue <= LEGAL_CONSTANTS.SIMPLIFICADO_CEILING * 1.5) {
    const simplificado = simulateRegimeSimplificado({
      annualGrossServices: comparisonCoefficient === LEGAL_CONSTANTS.COEFICIENTES_SIMPLIFICADO.SERVICOS_PROFISSIONAIS ? annualGrossRevenue : 0,
      annualGrossOtherServices: comparisonCoefficient === LEGAL_CONSTANTS.COEFICIENTES_SIMPLIFICADO.OUTROS_SERVICOS ? annualGrossRevenue : 0,
      annualSSPaid,
      businessExpenses: deductibleExpenses,
      withheldTax
    });
    simplificadoComparison = {
      estimatedIRSTax: simplificado.taxEstimation.estimatedGrossIRSTax,
      finalTaxableIncome: simplificado.simplificado.finalTaxableIncome,
      cheaperRegime: simplificado.taxEstimation.estimatedGrossIRSTax <= irsResult.tax + annualAccountingCost ? 'SIMPLIFICADO' : 'CONTABILIDADE_ORGANIZADA'
    };
  }

  return {
    revenueAndDeductions: {
      annualGrossRevenue,
      deductibleExpenses,
      depreciations,
      annualSSPaid,
      totalDeductions: Math.round(totalDeductions * 100) / 100
    },
    taxableProfit: Math.round(taxableProfit * 100) / 100,
    taxEstimation: {
      estimatedGrossIRSTax: irsResult.tax,
      effectiveIRSRate: irsResult.effectiveRate,
      withheldTaxAlreadyPaid: withheldTax,
      netIRSBalance: Math.round(netIRSBalance * 100) / 100,
      status: netIRSBalance > 0 ? 'TO_PAY' : netIRSBalance < 0 ? 'REFUND' : 'NEUTRAL',
      minimoExistencia: {
        applied: irsResult.minimoExistenciaApplied,
        thresholdEUR: LEGAL_CONSTANTS.MINIMO_EXISTENCIA_2026
      }
    },
    mandatoryCosts: {
      monthlyAccountingFeeOCC,
      annualAccountingCost,
      legalReference: 'Artigo 12.º do Estatuto da Ordem dos Contabilistas Certificados (EOCC)'
    },
    eligibility: {
      isMandatoryAboveCeiling: annualGrossRevenue > LEGAL_CONSTANTS.SIMPLIFICADO_CEILING,
      ceilingEUR: LEGAL_CONSTANTS.SIMPLIFICADO_CEILING,
      note: 'Obrigatório quando o rendimento anual ilíquido excede este limite durante 2 exercícios consecutivos (Art. 28.º n.º 2 CIRS). Também pode ser exercido por opção, comunicada até final de março do ano em que se pretende aplicar (Art. 28.º n.º 4 CIRS).',
      legalReference: 'Artigos 28.º, 32.º e 33.º do CIRS'
    },
    simplificadoComparison
  };
}
