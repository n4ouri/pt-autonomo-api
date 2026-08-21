import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';
import { simulateRegimeSimplificado } from './simplificado.js';

/**
 * NHR (Non-Habitual Resident / Residente Não Habitual & IFICI) Tax Simulator
 * 
 * Under NHR / Portaria n.º 12/2010, high added-value professional activities
 * (Software engineers, IT architects, consultants, researchers, executive directors)
 * are taxed at a flat 20% rate in CIRS Category B rather than progressive rates up to 48%.
 * 
 * Effective rate under Regime Simplificado:
 * 75% taxable coefficient * 20% flat rate = 15.00% effective tax on gross invoicing!
 * 
 * @param {object} params
 * @param {number} params.annualGrossServices - Annual gross invoicing from high-value activities
 * @param {number} [params.annualSSPaid=0] - Total annual Social Security paid
 * @param {number} [params.businessExpenses=0] - Business expenses
 * @param {number} [params.withheldTax=0] - Tax already withheld at source
 * @param {boolean} [params.isEligibleHighValueActivity=true] - Whether profession matches official NHR high value list
 * @returns {object} Detailed NHR calculation, comparison against standard IRS rates, and annual tax savings
 */
export function simulateNHRTax({
  annualGrossServices = 60000,
  annualSSPaid = 0,
  businessExpenses = 0,
  withheldTax = 0,
  isEligibleHighValueActivity = true
}) {
  if (annualGrossServices <= 0) {
    throw new Error('Annual gross services must be greater than 0.');
  }

  // 1. Standard Regime Simplificado simulation (for comparison)
  const standardSim = simulateRegimeSimplificado({
    annualGrossServices,
    annualSSPaid,
    businessExpenses,
    withheldTax
  });

  const standardTaxableBase = standardSim.simplificado.finalTaxableIncome;
  const standardIRSTax = standardSim.taxEstimation.estimatedGrossIRSTax;

  // 2. NHR Calculation: Flat 20% on taxable base (Portaria n.º 12/2010 & Art. 72.º n.º 10 CIRS)
  const nhrRate = 0.20;
  const nhrIRSTax = isEligibleHighValueActivity ? (standardTaxableBase * nhrRate) : standardIRSTax;
  const nhrEffectiveRate = (nhrIRSTax / annualGrossServices) * 100;

  const annualTaxSavingsWithNHR = Math.max(0, standardIRSTax - nhrIRSTax);
  const netBalanceDue = nhrIRSTax - withheldTax;

  return {
    annualGrossServices,
    taxableBase: standardTaxableBase,
    nhrStatus: {
      isEligibleHighValueActivity,
      flatRatePercent: isEligibleHighValueActivity ? 20 : null,
      legalFramework: 'Artigo 72.º, n.º 10 do CIRS & Portaria n.º 12/2010 (Atividades de Elevado Valor Acrescentado)'
    },
    nhrResults: {
      grossIRSTax: Math.round(nhrIRSTax * 100) / 100,
      effectiveTaxRatePercent: Math.round(nhrEffectiveRate * 100) / 100,
      withheldTaxAlreadyPaid: withheldTax,
      netIRSBalanceDue: Math.round(netBalanceDue * 100) / 100,
      balanceStatus: netBalanceDue > 0 ? 'TO_PAY' : netBalanceDue < 0 ? 'REFUND' : 'NEUTRAL'
    },
    comparisonWithStandardIRS: {
      standardProgressiveIRSTax: standardIRSTax,
      standardEffectiveRatePercent: standardSim.taxEstimation.effectiveIRSRate,
      nhrGrossIRSTax: Math.round(nhrIRSTax * 100) / 100,
      annualSavingsWithNHR: Math.round(annualTaxSavingsWithNHR * 100) / 100,
      taxReductionPercentage: standardIRSTax > 0 ? Math.round(((standardIRSTax - nhrIRSTax) / standardIRSTax) * 1000) / 10 : 0
    },
    actionableAdvice: [
      'Preencha obrigatoriamente o Anexo L no Modelo 3 de IRS para acionar a tributação autónoma à taxa especial de 20%.',
      `Poupança anual de ${Math.round(annualTaxSavingsWithNHR).toLocaleString('pt-PT')} € face ao regime progressivo geral.`,
      'Assegure-se de que o código CAE/CIRS da sua atividade corresponde à lista de atividades de elevado valor acrescentado (Código 213/105 - Especialistas de TI, Consultores, Engenheiros).'
    ]
  };
}
