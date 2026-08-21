import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';
import { simulateRegimeSimplificado } from './simplificado.js';
import { simulateSegurancaSocialQuarterly } from './seg-social.js';

/**
 * Compares tax efficiency between Freelancer / Recibos Verdes (Regime Simplificado)
 * and creating a Limited Liability Company (Sociedade Unipessoal por Quotas / IRC).
 * 
 * @param {object} params
 * @param {number} params.annualGrossRevenue - Total gross invoicing per year
 * @param {number} [params.annualOperationalExpenses=6000] - Actual business operating expenses (software, gear, internet)
 * @param {number} [params.monthlyDirectorSalary=1400] - Target monthly salary for managing partner (MOE)
 * @param {number} [params.monthlyAccountingFee=150] - Monthly Certified Accountant (OCC) retainer fee
 * @returns {object} Comprehensive break-even financial comparison and legal advantages
 */
export function compareCompanyVsRecibosVerdes({
  annualGrossRevenue = 60000,
  annualOperationalExpenses = 6000,
  monthlyDirectorSalary = 1400,
  monthlyAccountingFee = 150
}) {
  if (annualGrossRevenue <= 0) {
    throw new Error('Annual gross revenue must be greater than 0.');
  }

  // =========================================================================
  // 1. SCENARIO A: RECIBOS VERDES (Trabalhador Independente)
  // =========================================================================
  const quarterlyGross = annualGrossRevenue / 4;
  const ssSimulation = simulateSegurancaSocialQuarterly({ quarterlyGrossServices: quarterlyGross });
  const annualSSContributions = ssSimulation.standardMonthlyContribution * 12;

  const simplificadoSimulation = simulateRegimeSimplificado({
    annualGrossServices: annualGrossRevenue,
    annualSSPaid: annualSSContributions,
    businessExpenses: annualOperationalExpenses
  });

  const irsGrossTax = simplificadoSimulation.taxEstimation.estimatedGrossIRSTax;
  const totalTaxAndSSRecibos = irsGrossTax + annualSSContributions;
  const netTakeHomeRecibos = Math.max(0, annualGrossRevenue - totalTaxAndSSRecibos - annualOperationalExpenses);
  const effectiveRateRecibos = (totalTaxAndSSRecibos / annualGrossRevenue) * 100;

  // =========================================================================
  // 2. SCENARIO B: SOCIEDADE UNIPESSOAL (IRC + Salário MOE + Dividendos)
  // =========================================================================
  const annualDirectorGrossSalary = monthlyDirectorSalary * 14; // 14 months
  const annualAccountingCost = monthlyAccountingFee * 12;
  
  // Tax-free meal card allowance (220 business days * 9.60 €/day = 2,112.00 € / year 100% tax-free)
  const annualMealAllowance = LEGAL_CONSTANTS.CIRC.SUBSIDIO_ALIMENTACAO_ISENTO_CARTAO * 22 * 10; // 10-11 months ~ 2.112 €

  // TSU on Director Salary (34.75%: 23.75% company + 11% director)
  const companyTSU = annualDirectorGrossSalary * LEGAL_CONSTANTS.TAXAS_SEGURANCA_SOCIAL.TSU_EMPREGADOR;
  const directorPersonalTSU = annualDirectorGrossSalary * LEGAL_CONSTANTS.TAXAS_SEGURANCA_SOCIAL.TSU_TRABALHADOR_CONTA_OUTREM;

  // Estimated personal IRS on Director Salary (Category A withholding/effective)
  const directorEstimatedIRS = annualDirectorGrossSalary * 0.14; // Approximate effective rate for mid salary

  // Deductible Company Expenses:
  const totalCompanyDeductions = annualDirectorGrossSalary + companyTSU + annualOperationalExpenses + annualAccountingCost + annualMealAllowance;

  // Taxable Profit for Corporate Tax (IRC):
  const taxableProfitIRC = Math.max(0, annualGrossRevenue - totalCompanyDeductions);

  // IRC Tax calculation: 17% on first 50.000 € (PME rate), 21% above
  const ircAt17Percent = Math.min(50000, taxableProfitIRC) * LEGAL_CONSTANTS.CIRC.TAXA_PME_PRIMEIROS_50K;
  const ircAt21Percent = Math.max(0, taxableProfitIRC - 50000) * LEGAL_CONSTANTS.CIRC.TAXA_NORMAL;
  const totalIRCTax = ircAt17Percent + ircAt21Percent;

  // Total taxes paid under company structure (IRC + TSU Company + TSU Director + Director IRS + Accounting):
  const totalCompanyTaxesAndCosts = totalIRCTax + companyTSU + directorPersonalTSU + directorEstimatedIRS + annualAccountingCost;
  
  // Net cash after all taxes (Director net salary + Meal allowance + Company retained earnings/net profit)
  const netDirectorSalary = annualDirectorGrossSalary - directorPersonalTSU - directorEstimatedIRS;
  const netCompanyRetainedProfit = taxableProfitIRC - totalIRCTax;
  const totalNetValueExtractedOrRetained = netDirectorSalary + annualMealAllowance + netCompanyRetainedProfit;

  const annualTaxSavings = totalTaxAndSSRecibos - (totalIRCTax + companyTSU + directorPersonalTSU + directorEstimatedIRS);
  const breakEvenAdvantage = totalNetValueExtractedOrRetained - netTakeHomeRecibos;

  // Recommendation logic
  let recommendedStructure = 'RECIBOS_VERDES';
  let recommendationSummary = 'Para este nível de faturação, o Regime Simplificado de Recibos Verdes é mais económico e livre de burocracia contabilística.';

  if (annualGrossRevenue >= 50000 || breakEvenAdvantage > 2500) {
    recommendedStructure = 'SOCIEDADE_UNIPESSOAL';
    recommendationSummary = `Vantagem clara de constituir Sociedade Unipessoal: Poupança fiscal estimada de ${Math.round(breakEvenAdvantage).toLocaleString('pt-PT')} €/ano e teto de IRC a 17%.`;
  }

  return {
    annualGrossRevenue,
    comparison: {
      recibosVerdes: {
        irsTax: Math.round(irsGrossTax * 100) / 100,
        segurancaSocial: Math.round(annualSSContributions * 100) / 100,
        operationalExpenses: annualOperationalExpenses,
        totalTaxesAndSS: Math.round(totalTaxAndSSRecibos * 100) / 100,
        effectiveTaxRatePercent: Math.round(effectiveRateRecibos * 10) / 10,
        netAnnualTakeHome: Math.round(netTakeHomeRecibos * 100) / 100
      },
      sociedadeUnipessoal: {
        accountingAnnualCost: annualAccountingCost,
        directorGrossSalaryAnnual: annualDirectorGrossSalary,
        taxFreeMealAllowanceAnnual: Math.round(annualMealAllowance * 100) / 100,
        totalTSUPaid: Math.round((companyTSU + directorPersonalTSU) * 100) / 100,
        directorIRSWithholding: Math.round(directorEstimatedIRS * 100) / 100,
        taxableProfitIRC: Math.round(taxableProfitIRC * 100) / 100,
        ircTax: Math.round(totalIRCTax * 100) / 100,
        totalTaxesAndCosts: Math.round(totalCompanyTaxesAndCosts * 100) / 100,
        netDirectorTakeHome: Math.round((netDirectorSalary + annualMealAllowance) * 100) / 100,
        companyRetainedProfitNet: Math.round(netCompanyRetainedProfit * 100) / 100,
        totalNetValue: Math.round(totalNetValueExtractedOrRetained * 100) / 100
      }
    },
    verdict: {
      recommendedStructure,
      summary: recommendationSummary,
      netAdvantageAnnualEUR: Math.round(breakEvenAdvantage * 100) / 100,
      breakEvenRevenueThresholdEUR: 48000.00
    },
    keyCompanyAdvantages: [
      'IRC a 17% (taxa reduzida de PME) até 50.000 € de matéria coletável vs IRS que chega a 48%.',
      `Subsídio de Refeição em Cartão isento de impostos: até ${Math.round(annualMealAllowance)} €/ano líquidos sem IRS nem TSU.`,
      'Viatura 100% Elétrica: Dedução de 100% do IVA até 62.500 €, 0% de tributação autónoma e custos dedutíveis.',
      'Possibilidade de reter e reinvestir lucros na empresa sem tributação imediata no IRS pessoal.',
      'Proteção total do património pessoal: dívidas comerciais ficam limitadas ao capital social da sociedade.'
    ]
  };
}
