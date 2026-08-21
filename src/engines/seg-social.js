import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Simulates Portuguese Social Security (Segurança Social Direta) quarterly obligations
 * and contribution options for Trabalhadores Independentes (CRCSPSS Art. 139.º - 168.º).
 * 
 * @param {object} params
 * @param {number} params.quarterlyGrossServices - Total invoiced services in the preceding quarter
 * @param {number} [params.quarterlyGrossSales=0] - Total sales of goods in the preceding quarter
 * @param {boolean} [params.isFirstYearExempt=false] - Whether user is in 12-month start-of-activity exemption (Art. 157.º)
 * @param {boolean} [params.hasConcurrentEmployment=false] - Whether user also has TCO employment with salary >= 1 IAS
 * @returns {object} Detailed breakdown with -25% / Normal / +25% variations and legal strategies
 */
export function simulateSegurancaSocialQuarterly({
  quarterlyGrossServices = 0,
  quarterlyGrossSales = 0,
  isFirstYearExempt = false,
  hasConcurrentEmployment = false
}) {
  const ias = LEGAL_CONSTANTS.IAS_2026;
  const rateServices = LEGAL_CONSTANTS.TAXAS_SEGURANCA_SOCIAL.TRABALHADOR_INDEPENDENTE_SERVICOS; // 21.4%
  const rateSales = LEGAL_CONSTANTS.TAXAS_SEGURANCA_SOCIAL.TRABALHADOR_INDEPENDENTE_PRODUTOS; // 25.2%

  // 1. Relevant Quarterly Income (Art. 162.º CRCSPSS)
  // 70% of services + 20% of sales
  const relevantIncomeServices = quarterlyGrossServices * 0.70;
  const relevantIncomeSales = quarterlyGrossSales * 0.20;
  const totalRelevantQuarterlyIncome = relevantIncomeServices + relevantIncomeSales;

  // 2. Monthly Base of Incidence (Art. 162.º n.º 2 CRCSPSS)
  const rawMonthlyBase = totalRelevantQuarterlyIncome / 3;

  // Statutory limits:
  // - Minimum monthly contribution when income exists: 20.00 € (or based on 1/5 IAS ~ 101.85 €)
  // - Maximum monthly base ceiling: 12 * IAS (approx 6.111,12 €)
  const maxMonthlyBaseCeiling = 12 * ias;
  const clampedMonthlyBase = Math.min(rawMonthlyBase, maxMonthlyBaseCeiling);

  // Standard monthly payment
  const standardMonthlyContribution = clampedMonthlyBase > 0 
    ? clampedMonthlyBase * rateServices 
    : 20.00; // Minimum statutory flat rate for active quarterly declarations with 0 income

  // 3. Escalão Strategic Variations (-25% to +25% under Art. 163.º CRCSPSS)
  const variations = [-0.25, -0.20, -0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15, 0.20, 0.25].map(v => {
    const adjustedBase = clampedMonthlyBase * (1 + v);
    const monthlyPayment = clampedMonthlyBase > 0 ? (adjustedBase * rateServices) : 20.00;
    const quarterlyTotal = monthlyPayment * 3;
    const annualTotal = monthlyPayment * 12;

    return {
      variationPercentage: Math.round(v * 100),
      monthlyBase: Math.round(adjustedBase * 100) / 100,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      quarterlyTotal: Math.round(quarterlyTotal * 100) / 100,
      annualTotal: Math.round(annualTotal * 100) / 100
    };
  });

  const optionMinus25 = variations.find(v => v.variationPercentage === -25);
  const optionNormal = variations.find(v => v.variationPercentage === 0);
  const optionPlus25 = variations.find(v => v.variationPercentage === 25);

  const monthlyCashflowSavedMinus25 = optionNormal.monthlyPayment - optionMinus25.monthlyPayment;
  const annualCashflowSavedMinus25 = monthlyCashflowSavedMinus25 * 12;

  const monthlyExtraContributedPlus25 = optionPlus25.monthlyPayment - optionNormal.monthlyPayment;
  const annualExtraContributedPlus25 = monthlyExtraContributedPlus25 * 12;

  // Maternity / Parental Benefit Reference
  // Parental leave in Portugal pays 100% of reference remuneration over the 6 months prior to leave
  const estimatedParentalDailyBenefitNormal = (clampedMonthlyBase / 30);
  const estimatedParentalDailyBenefitPlus25 = ((clampedMonthlyBase * 1.25) / 30);

  return {
    quarterlyGrossIncome: {
      services: quarterlyGrossServices,
      sales: quarterlyGrossSales,
      total: quarterlyGrossServices + quarterlyGrossSales
    },
    relevantIncome: {
      services70Percent: Math.round(relevantIncomeServices * 100) / 100,
      sales20Percent: Math.round(relevantIncomeSales * 100) / 100,
      totalRelevantQuarterly: Math.round(totalRelevantQuarterlyIncome * 100) / 100,
      monthlyBaseIncidence: Math.round(clampedMonthlyBase * 100) / 100,
      isCappedAt12IAS: rawMonthlyBase > maxMonthlyBaseCeiling,
      maxCeiling12IAS: Math.round(maxMonthlyBaseCeiling * 100) / 100
    },
    standardMonthlyContribution: Math.round(standardMonthlyContribution * 100) / 100,
    exemptionStatus: {
      isFirstYearExempt,
      hasConcurrentEmployment,
      legalNote: isFirstYearExempt 
        ? 'Isenção nos primeiros 12 meses de início de atividade (Art. 157.º CRCSPSS).' 
        : hasConcurrentEmployment 
        ? 'Acumulação com trabalho dependente com remuneração >= 1 IAS confere isenção de contribuições independentes se base mensal < 4x IAS (Art. 152.º).'
        : 'Enquadramento obrigatório no Regime dos Trabalhadores Independentes.'
    },
    strategicVariations: {
      minus25Percent: {
        ...optionMinus25,
        monthlyCashflowSaved: Math.round(monthlyCashflowSavedMinus25 * 100) / 100,
        annualCashflowLiberation: Math.round(annualCashflowSavedMinus25 * 100) / 100,
        strategicRecommendation: 'Ideal para meses de quebra de faturação ou reinvestimento de capital próprio a curto prazo.'
      },
      normal: optionNormal,
      plus25Percent: {
        ...optionPlus25,
        monthlyExtraCost: Math.round(monthlyExtraContributedPlus25 * 100) / 100,
        annualExtraCost: Math.round(annualExtraContributedPlus25 * 100) / 100,
        parentalBenefitIncreaseMonthly: Math.round((estimatedParentalDailyBenefitPlus25 - estimatedParentalDailyBenefitNormal) * 30 * 100) / 100,
        strategicRecommendation: 'Recomendado 6 meses antes de licença de parentalidade ou para maximizar despesas dedutíveis no IRS (Anexo B).'
      },
      allStepVariations: variations
    }
  };
}
