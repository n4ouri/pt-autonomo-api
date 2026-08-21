import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Evaluates e-Fatura deductions, statutory caps, remaining tax headroom,
 * and recommends exact spending needed to hit maximum tax credits (Art. 78.º CIRS).
 * 
 * @param {object} params
 * @param {object} params.categories - Object with spending per category
 * @param {number} [params.categories.despesasGerais=0] - General family expenses
 * @param {number} [params.categories.saude=0] - Health and health insurance
 * @param {number} [params.categories.educacao=0] - Education & textbooks
 * @param {number} [params.categories.habitacao=0] - Housing rents / mortgage interest
 * @param {number} [params.categories.lares=0] - Elderly care & nursing homes
 * @param {number} [params.categories.ivaRestauracao=0] - Invoiced restaurant & catering
 * @param {number} [params.categories.ivaAutoMoto=0] - Car & motorcycle repair/maintenance
 * @param {number} [params.categories.ivaCabeleireiros=0] - Hairdressers and beauty salons
 * @param {number} [params.categories.ivaGinasios=0] - Gyms & fitness activities
 * @param {number} [params.categories.ivaPasses=0] - Monthly public transport passes
 * @param {number} [params.categories.ivaVeterinarios=0] - Veterinary care & medicine
 * @param {number} [params.pprInvested=0] - Annual contributions into PPR
 * @param {number} [params.age=30] - Age for PPR threshold calculation
 * @param {boolean} [params.isMarried=false] - Joint vs single filing for general expenses
 * @returns {object} Full category analysis with headroom, percentages, and actionable advice
 */
export function optimizeEFaturaDeductions({
  categories = {},
  pprInvested = 0,
  age = 30,
  isMarried = false
}) {
  const caps = LEGAL_CONSTANTS.DEDUCOES_COLETA;

  // 1. Despesas Gerais Familiares (35%, max 250 € single, 500 € couple)
  const spentGerais = categories.despesasGerais || 0;
  const maxGerais = isMarried ? caps.despesasGerais.maxCouple : caps.despesasGerais.maxSingle;
  const dedGerais = Math.min(maxGerais, spentGerais * caps.despesasGerais.rate);
  const targetSpentGerais = maxGerais / caps.despesasGerais.rate; // 714.28 €
  const remainingHeadroomGerais = Math.max(0, maxGerais - dedGerais);
  const spendNeededGerais = Math.max(0, targetSpentGerais - spentGerais);

  // 2. Saúde (15%, max 1000 €)
  const spentSaude = categories.saude || 0;
  const maxSaude = caps.saude.max;
  const dedSaude = Math.min(maxSaude, spentSaude * caps.saude.rate);
  const targetSpentSaude = maxSaude / caps.saude.rate; // 6,666.67 €
  const remainingHeadroomSaude = Math.max(0, maxSaude - dedSaude);
  const spendNeededSaude = Math.max(0, targetSpentSaude - spentSaude);

  // 3. Educação (30%, max 800 €)
  const spentEducacao = categories.educacao || 0;
  const maxEducacao = caps.educacao.max;
  const dedEducacao = Math.min(maxEducacao, spentEducacao * caps.educacao.rate);
  const targetSpentEducacao = maxEducacao / caps.educacao.rate; // 2,666.67 €
  const remainingHeadroomEducacao = Math.max(0, maxEducacao - dedEducacao);
  const spendNeededEducacao = Math.max(0, targetSpentEducacao - spentEducacao);

  // 4. Habitação (15%, max 600 €)
  const spentHabitacao = categories.habitacao || 0;
  const maxHabitacao = caps.habitacao.maxRent;
  const dedHabitacao = Math.min(maxHabitacao, spentHabitacao * caps.habitacao.rate);
  const targetSpentHabitacao = maxHabitacao / caps.habitacao.rate; // 4,000.00 €
  const remainingHeadroomHabitacao = Math.max(0, maxHabitacao - dedHabitacao);
  const spendNeededHabitacao = Math.max(0, targetSpentHabitacao - spentHabitacao);

  // 5. Lares (25%, max 403.75 €)
  const spentLares = categories.lares || 0;
  const maxLares = caps.lares.max;
  const dedLares = Math.min(maxLares, spentLares * caps.lares.rate);
  const targetSpentLares = maxLares / caps.lares.rate;
  const remainingHeadroomLares = Math.max(0, maxLares - dedLares);

  // 6. Benefício IVA (Exigência de Fatura - 15% do IVA suportado, 100% no passe social, max 250 €)
  // Estimated average IVA rate of 23% (or 13% for restaurants) -> ~ 3.45% of gross invoice value
  const spentIvaSectors = (categories.ivaRestauracao || 0) + 
                          (categories.ivaAutoMoto || 0) + 
                          (categories.ivaCabeleireiros || 0) + 
                          (categories.ivaGinasios || 0) + 
                          (categories.ivaVeterinarios || 0);
  const spentPasses = categories.ivaPasses || 0;

  // Approx. 15% of 23% VAT is ~ 3.45% of gross price; 100% of 6% VAT on transport passes is ~ 6%
  const dedIvaSectors = spentIvaSectors * 0.23 * 0.15;
  const dedIvaPasses = spentPasses * 0.06 * 1.00;
  const totalDedIva = Math.min(caps.ivaBeneficio.max, dedIvaSectors + dedIvaPasses);
  const remainingHeadroomIva = Math.max(0, caps.ivaBeneficio.max - totalDedIva);

  // 7. PPR (Art. 21.º EBF)
  let maxPPR = caps.ppr.max35to50;
  if (age < 35) maxPPR = caps.ppr.maxUnder35;
  else if (age > 50) maxPPR = caps.ppr.maxOver50;

  const dedPPR = Math.min(maxPPR, pprInvested * caps.ppr.rate);
  const targetInvestPPR = maxPPR / caps.ppr.rate;
  const remainingHeadroomPPR = Math.max(0, maxPPR - dedPPR);
  const investNeededPPR = Math.max(0, targetInvestPPR - pprInvested);

  // Total Summary
  const totalDeductionsAccumulated = dedGerais + dedSaude + dedEducacao + dedHabitacao + dedLares + totalDedIva + dedPPR;
  const totalPossibleCaps = maxGerais + maxSaude + maxEducacao + maxHabitacao + maxLares + caps.ivaBeneficio.max + maxPPR;
  const totalHeadroomRemaining = remainingHeadroomGerais + remainingHeadroomSaude + remainingHeadroomEducacao + 
                                  remainingHeadroomHabitacao + remainingHeadroomLares + remainingHeadroomIva + remainingHeadroomPPR;

  return {
    summary: {
      totalDeductionsAccumulated: Math.round(totalDeductionsAccumulated * 100) / 100,
      totalPossibleMax: Math.round(totalPossibleCaps * 100) / 100,
      totalHeadroomRemaining: Math.round(totalHeadroomRemaining * 100) / 100,
      overallEfficiencyPercentage: Math.round((totalDeductionsAccumulated / totalPossibleCaps) * 1000) / 10
    },
    categories: {
      despesasGerais: {
        label: caps.despesasGerais.label,
        currentSpent: spentGerais,
        deductionObtained: Math.round(dedGerais * 100) / 100,
        maxStatutoryCap: maxGerais,
        isCapped: dedGerais >= maxGerais,
        headroomRemaining: Math.round(remainingHeadroomGerais * 100) / 100,
        spendNeededToMax: Math.round(spendNeededGerais * 100) / 100,
        legalReference: caps.despesasGerais.legal
      },
      saude: {
        label: caps.saude.label,
        currentSpent: spentSaude,
        deductionObtained: Math.round(dedSaude * 100) / 100,
        maxStatutoryCap: maxSaude,
        isCapped: dedSaude >= maxSaude,
        headroomRemaining: Math.round(remainingHeadroomSaude * 100) / 100,
        spendNeededToMax: Math.round(spendNeededSaude * 100) / 100,
        legalReference: caps.saude.legal
      },
      educacao: {
        label: caps.educacao.label,
        currentSpent: spentEducacao,
        deductionObtained: Math.round(dedEducacao * 100) / 100,
        maxStatutoryCap: maxEducacao,
        isCapped: dedEducacao >= maxEducacao,
        headroomRemaining: Math.round(remainingHeadroomEducacao * 100) / 100,
        spendNeededToMax: Math.round(spendNeededEducacao * 100) / 100,
        legalReference: caps.educacao.legal
      },
      habitacao: {
        label: caps.habitacao.label,
        currentSpent: spentHabitacao,
        deductionObtained: Math.round(dedHabitacao * 100) / 100,
        maxStatutoryCap: maxHabitacao,
        isCapped: dedHabitacao >= maxHabitacao,
        headroomRemaining: Math.round(remainingHeadroomHabitacao * 100) / 100,
        spendNeededToMax: Math.round(spendNeededHabitacao * 100) / 100,
        legalReference: caps.habitacao.legal
      },
      ivaBeneficio: {
        label: caps.ivaBeneficio.label,
        currentSpentSectors: spentIvaSectors,
        currentSpentPasses: spentPasses,
        deductionObtained: Math.round(totalDedIva * 100) / 100,
        maxStatutoryCap: caps.ivaBeneficio.max,
        isCapped: totalDedIva >= caps.ivaBeneficio.max,
        headroomRemaining: Math.round(remainingHeadroomIva * 100) / 100,
        legalReference: caps.ivaBeneficio.legal
      },
      ppr: {
        label: caps.ppr.label,
        invested: pprInvested,
        userAge: age,
        deductionObtained: Math.round(dedPPR * 100) / 100,
        maxStatutoryCap: maxPPR,
        isCapped: dedPPR >= maxPPR,
        headroomRemaining: Math.round(remainingHeadroomPPR * 100) / 100,
        investNeededToMax: Math.round(investNeededPPR * 100) / 100,
        legalReference: caps.ppr.legal
      }
    },
    actionableAdvice: [
      spendNeededGerais > 0 
        ? `Falta gastar ${Math.round(spendNeededGerais)} € em despesas gerais (supermercado, combustível, vestuário) com NIF para atingir a dedução máxima de ${maxGerais} €.`
        : 'Teto de Despesas Gerais Familiares atingido com sucesso!',
      investNeededPPR > 0
        ? `Investir ${Math.round(investNeededPPR)} € num PPR até 31 de Dezembro abate diretamente ${Math.round(remainingHeadroomPPR)} € ao IRS a pagar.`
        : 'Teto de benefício fiscal em PPR atingido!',
      remainingHeadroomIva > 50
        ? `Peça NIF em restauração, oficinas, ginásios e veterinários: ainda pode recuperar até ${Math.round(remainingHeadroomIva)} € diretamente do IVA suportado.`
        : 'Benefício de IVA quase esgotado.'
    ]
  };
}
