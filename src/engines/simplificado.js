import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Calculates progressive IRS tax using official statutory tax brackets (Art. 68.º CIRS),
 * capped by the mínimo de existência floor (Art. 70.º CIRS): net income after IRS can never
 * be pushed below that legal subsistence threshold.
 * @param {number} taxableIncome - Rendimento Coletável
 * @param {object} [opts]
 * @param {boolean} [opts.applyMinimoExistencia=true] - Whether to cap tax at Art. 70.º CIRS
 * @returns {{ tax: number, effectiveRate: number, bracket: object, minimoExistenciaApplied: boolean }}
 */
export function calculateProgressiveIRS(taxableIncome, { applyMinimoExistencia = true } = {}) {
  if (taxableIncome <= 0) {
    return { tax: 0, effectiveRate: 0, bracket: LEGAL_CONSTANTS.ESCALOES_IRS[0], minimoExistenciaApplied: false };
  }

  let matchedBracket = LEGAL_CONSTANTS.ESCALOES_IRS[0];
  for (const bracket of LEGAL_CONSTANTS.ESCALOES_IRS) {
    if (taxableIncome <= bracket.limite) {
      matchedBracket = bracket;
      break;
    }
  }

  const rawTax = (taxableIncome * matchedBracket.taxaNormal) - matchedBracket.abatimento;
  let tax = Math.max(0, rawTax);

  // Art. 70.º CIRS: o rendimento líquido não pode ser reduzido, por aplicação do IRS,
  // para um valor inferior ao mínimo de existência.
  const minimoExistenciaCap = Math.max(0, taxableIncome - LEGAL_CONSTANTS.MINIMO_EXISTENCIA_2026);
  const minimoExistenciaApplied = applyMinimoExistencia && tax > minimoExistenciaCap;
  if (minimoExistenciaApplied) {
    tax = minimoExistenciaCap;
  }

  const effectiveRate = taxableIncome > 0 ? (tax / taxableIncome) : 0;

  return {
    tax: Math.round(tax * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 10000) / 100, // as percentage (e.g. 21.34)
    bracket: matchedBracket,
    minimoExistenciaApplied
  };
}

/**
 * Simulates Regime Simplificado (CIRS Art. 31.º) for Portuguese Autónomos (Recibos Verdes / ENI).
 * 
 * @param {object} params
 * @param {number} params.annualGrossServices - Gross income from professional services (Art. 151)
 * @param {number} [params.annualGrossSales=0] - Gross income from sales of goods
 * @param {number} [params.annualGrossOtherServices=0] - Gross income from other general services
 * @param {number} [params.activityYear=3] - Year of activity (1 = 1st year, 2 = 2nd year, 3+ = standard)
 * @param {number} [params.annualSSPaid=0] - Total Social Security paid in the fiscal year
 * @param {number} [params.businessExpenses=0] - Validated business expenses with NIF
 * @param {number} [params.homeOfficeEligibleExpenses=0] - Home electricity, internet, rent (25% applied)
 * @param {number} [params.withheldTax=0] - Total IRS already withheld at source (Retenção na fonte)
 * @returns {object} Detailed tax breakdown, expense deficit, IRS estimation, and legal notes
 */
export function simulateRegimeSimplificado({
  annualGrossServices = 0,
  annualGrossSales = 0,
  annualGrossOtherServices = 0,
  annualGrossIP = 0, // Direitos de Autor (Art 58 CIRS)
  activityYear = 3,
  annualSSPaid = 0,
  businessExpenses = 0,
  homeOfficeEligibleExpenses = 0,
  withheldTax = 0
}) {
  const totalGrossIncome = annualGrossServices + annualGrossSales + annualGrossOtherServices + annualGrossIP;
  
  if (totalGrossIncome <= 0) {
    throw new Error('Total gross income must be greater than 0.');
  }

  const coefServices = LEGAL_CONSTANTS.COEFICIENTES_SIMPLIFICADO.SERVICOS_PROFISSIONAIS; // 0.75
  const coefOther = LEGAL_CONSTANTS.COEFICIENTES_SIMPLIFICADO.OUTROS_SERVICOS; // 0.35
  const coefSales = LEGAL_CONSTANTS.COEFICIENTES_SIMPLIFICADO.VENDAS_MERCADORIAS; // 0.15

  // Standard taxable base calculation
  // Artigo 58.º CIRS - Direitos de Autor (50% exemption up to 10,000€)
  let ipExemptAmount = 0;
  let ipTaxableBase = 0;
  if (annualGrossIP > 0) {
    const calculatedExemption = annualGrossIP * 0.5;
    ipExemptAmount = Math.min(calculatedExemption, 10000); // Max 10,000€ exemption
    ipTaxableBase = annualGrossIP - ipExemptAmount;
  }
  
  const rawTaxableBase = ipTaxableBase + (annualGrossServices * coefServices) +
                         (annualGrossOtherServices * coefOther) +
                         (annualGrossSales * coefSales);

  // Apply Start of Activity Discount (Art. 31.º n.º 10 CIRS)
  let activityDiscountRate = 0;
  let activityDiscountAmount = 0;
  if (activityYear === 1) {
    activityDiscountRate = LEGAL_CONSTANTS.DESCONTO_INICIO_ATIVIDADE.ANO_1; // 50%
    activityDiscountAmount = rawTaxableBase * activityDiscountRate;
  } else if (activityYear === 2) {
    activityDiscountRate = LEGAL_CONSTANTS.DESCONTO_INICIO_ATIVIDADE.ANO_2; // 25%
    activityDiscountAmount = rawTaxableBase * activityDiscountRate;
  }

  const taxableBaseAfterStartBonus = Math.max(0, rawTaxableBase - activityDiscountAmount);

  // 15% Mandatory Expense Justification (Art. 31.º n.º 13 CIRS)
  // Only applies to service coefficients (0.75 & 0.35), where 15% is the presumed non-deductible buffer.
  const servicesGross = annualGrossServices + annualGrossOtherServices + annualGrossIP;
  const target15PercentExpenses = servicesGross * LEGAL_CONSTANTS.SIMPLIFICADO_EXPENSE_RATIO;

  // What automatically counts as justified expense:
  // a) Specific deduction (4.104 €) OR total SS contributions if higher (Art. 31.º n.º 13 al. a))
  const automaticSpecificDeduction = Math.max(LEGAL_CONSTANTS.DEDUCAO_ESPECIFICA_PADRAO, annualSSPaid);
  
  // b) 25% of home office expenses (Art. 31.º n.º 13 al. d))
  const homeOfficeDeduction = homeOfficeEligibleExpenses * 0.25;

  // c) Total actual justified expenses
  const totalJustifiedExpenses = automaticSpecificDeduction + businessExpenses + homeOfficeDeduction;

  // Deficit in expense justification
  const expenseDeficit = Math.max(0, target15PercentExpenses - totalJustifiedExpenses);

  // Final taxable income after adding back any deficit
  const finalTaxableIncome = taxableBaseAfterStartBonus + expenseDeficit;

  // IRS Calculation
  const irsResult = calculateProgressiveIRS(finalTaxableIncome);
  const estimatedTaxPayable = irsResult.tax;
  const balanceDue = estimatedTaxPayable - withheldTax;

  // Estimated penalty or extra tax caused solely by the expense deficit
  const taxWithoutDeficit = calculateProgressiveIRS(taxableBaseAfterStartBonus).tax;
  const deficitTaxPenalty = Math.max(0, estimatedTaxPayable - taxWithoutDeficit);

  return {
    grossIncome: {
      servicesTabela151: annualGrossServices,
      otherServices: annualGrossOtherServices,
      direitosDeAutorIP: annualGrossIP,
      sales: annualGrossSales,
      total: totalGrossIncome
    },
    simplificado: {
      standardTaxableBase: Math.round(rawTaxableBase * 100) / 100,
      activityYearBonus: {
        eligible: activityYear <= 2,
        year: activityYear,
        discountPercentage: activityDiscountRate * 100,
        discountAmount: Math.round(activityDiscountAmount * 100) / 100,
        legalReference: 'Artigo 31.º, n.º 10 do CIRS'
      },
      direitosDeAutorExemption: {
        exemptAmount: ipExemptAmount,
        taxableIPAmount: ipTaxableBase,
        legalReference: 'Artigo 58.º do CIRS'
      },
      expenseJustification: {
        targetRequired15Percent: Math.round(target15PercentExpenses * 100) / 100,
        automaticSpecificDeduction: Math.round(automaticSpecificDeduction * 100) / 100,
        homeOfficeDeduction: Math.round(homeOfficeDeduction * 100) / 100,
        businessExpensesReported: Math.round(businessExpenses * 100) / 100,
        totalJustifiedExpenses: Math.round(totalJustifiedExpenses * 100) / 100,
        expenseDeficit: Math.round(expenseDeficit * 100) / 100,
        deficitTaxPenalty: Math.round(deficitTaxPenalty * 100) / 100,
        isFullyJustified: expenseDeficit === 0,
        legalReference: 'Artigo 31.º, n.º 13 do CIRS'
      },
      finalTaxableIncome: Math.round(finalTaxableIncome * 100) / 100
    },
    taxEstimation: {
      estimatedGrossIRSTax: estimatedTaxPayable,
      effectiveIRSRate: irsResult.effectiveRate,
      withheldTaxAlreadyPaid: withheldTax,
      netIRSBalance: Math.round(balanceDue * 100) / 100,
      status: balanceDue > 0 ? 'TO_PAY' : balanceDue < 0 ? 'REFUND' : 'NEUTRAL',
      minimoExistencia: {
        applied: irsResult.minimoExistenciaApplied,
        thresholdEUR: LEGAL_CONSTANTS.MINIMO_EXISTENCIA_2026,
        legalReference: 'Artigo 70.º do CIRS'
      }
    },
    obligations: {
      isMandatoryOrganizedAccounting: totalGrossIncome > LEGAL_CONSTANTS.SIMPLIFICADO_CEILING,
      thresholdCeiling: LEGAL_CONSTANTS.SIMPLIFICADO_CEILING,
      ivaExemptionEligible: totalGrossIncome <= LEGAL_CONSTANTS.IVA.LIMITE_ISENCAO_ART53
    }
  };
}
