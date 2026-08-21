import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';
import { calculateProgressiveIRS } from './simplificado.js';

/**
 * IRS Jovem Engine (Artigo 12.º-B do CIRS)
 * 
 * Major tax relief regime for young professionals in Portugal:
 * - Applicable to Category A (salaried) and Category B (independent workers / Recibos Verdes).
 * - Age eligibility: 18 to 35 years old (inclusive).
 * - Applicable during the first years of income after completing a cycle of studies (Secondary/Vocational level 4/5, Bachelor's level 6, Master's level 7, or PhD level 8).
 * - Exemption percentages and annual IAS caps:
 *   - Year 1: 100% exemption (Capped at 55 x IAS or 40 x IAS)
 *   - Year 2: 75% exemption
 *   - Year 3: 50% exemption
 *   - Year 4: 50% exemption
 *   - Year 5: 25% exemption
 *   - Years 6-10: 25% exemption (Extended framework)
 * 
 * @param {object} params
 * @param {number} params.annualTaxableIncome - Rendimento Coletável (após coeficiente ou deduções)
 * @param {number} params.age - Age of the taxpayer (must be <= 35)
 * @param {number} [params.yearOfBenefit=1] - Consecutive year enjoying IRS Jovem (1 to 10)
 * @param {number} [params.educationLevel=6] - National Qualifications Framework level (4: Profissional, 6: Licenciatura, 7: Mestrado, 8: Doutoramento)
 * @returns {object} Exemption amount, adjusted IRS payable, net tax savings, and legal guidance
 */
export function simulateIRSJovem({
  annualTaxableIncome = 30000,
  age = 27,
  yearOfBenefit = 1,
  educationLevel = 6
}) {
  if (annualTaxableIncome <= 0) {
    throw new Error('Annual taxable income must be greater than 0.');
  }

  const ias = LEGAL_CONSTANTS.IAS_2026;

  // 1. Eligibility verification
  const isAgeEligible = age <= 35;
  const isEducationEligible = educationLevel >= 4;
  const isEligible = isAgeEligible && isEducationEligible && yearOfBenefit >= 1 && yearOfBenefit <= 10;

  if (!isEligible) {
    const reason = !isAgeEligible 
      ? 'Idade superior a 35 anos (limite legal do regime IRS Jovem).'
      : !isEducationEligible 
      ? 'Nível de qualificação escolar inferior ao nível 4 do QNQ.'
      : 'Ano de benefício fora do intervalo elegível (1 a 10 anos).';

    const standardIRS = calculateProgressiveIRS(annualTaxableIncome);

    return {
      isEligible: false,
      ineligibilityReason: reason,
      standardIRSTax: standardIRS.tax,
      irsJovemTax: standardIRS.tax,
      netTaxSavingsEUR: 0
    };
  }

  // 2. Exemption schedule & statutory IAS caps
  let exemptionRate = 0;
  let iasCapMultiplier = 55; // 2025/2026 reformed caps

  if (yearOfBenefit === 1) {
    exemptionRate = 1.00; // 100%
    iasCapMultiplier = 55;
  } else if (yearOfBenefit === 2) {
    exemptionRate = 0.75; // 75%
    iasCapMultiplier = 40;
  } else if (yearOfBenefit === 3 || yearOfBenefit === 4) {
    exemptionRate = 0.50; // 50%
    iasCapMultiplier = 27.5;
  } else {
    exemptionRate = 0.25; // 25% (Years 5 to 10)
    iasCapMultiplier = 15;
  }

  const maximumExemptionEUR = iasCapMultiplier * ias;
  const rawExemptionAmount = annualTaxableIncome * exemptionRate;
  const actualExemptionAmount = Math.min(rawExemptionAmount, maximumExemptionEUR);

  const taxableIncomeAfterIRSJovem = Math.max(0, annualTaxableIncome - actualExemptionAmount);

  // 3. Tax calculations
  const standardIRS = calculateProgressiveIRS(annualTaxableIncome);
  const irsJovemTaxResult = calculateProgressiveIRS(taxableIncomeAfterIRSJovem);

  const netSavings = Math.max(0, standardIRS.tax - irsJovemTaxResult.tax);
  const savingsPercentage = standardIRS.tax > 0 ? (netSavings / standardIRS.tax) * 100 : 0;

  return {
    isEligible: true,
    userParameters: {
      age,
      educationLevel,
      yearOfBenefit,
      annualTaxableIncome
    },
    exemptionDetails: {
      exemptionRatePercent: exemptionRate * 100,
      statutoryIASCap: `${iasCapMultiplier}x IAS (${Math.round(maximumExemptionEUR).toLocaleString('pt-PT')} €)`,
      isCappedByIAS: rawExemptionAmount > maximumExemptionEUR,
      exemptIncomeAmountEUR: Math.round(actualExemptionAmount * 100) / 100,
      taxableIncomeAfterExemptionEUR: Math.round(taxableIncomeAfterIRSJovem * 100) / 100,
      legalReference: 'Artigo 12.º-B do Código do IRS'
    },
    taxComparison: {
      standardProgressiveTaxEUR: standardIRS.tax,
      taxWithIRSJovemEUR: irsJovemTaxResult.tax,
      netAnnualTaxSavingsEUR: Math.round(netSavings * 100) / 100,
      taxDiscountPercentage: Math.round(savingsPercentage * 10) / 10
    },
    actionableAdvice: [
      `No Modelo 3 de IRS, selecione o Quadro 4F (Anexo A para dependente) ou Quadro 4C do Anexo B (Recibos Verdes) para assinalar a opção do IRS Jovem.`,
      `Tenha consigo o certificado de conclusão de curso (Nível ${educationLevel} do QNQ) com o ano de conclusão para validação automática da AT.`,
      `Poupança direta de ${Math.round(netSavings).toLocaleString('pt-PT')} € no imposto a liquidar.`
    ]
  };
}
