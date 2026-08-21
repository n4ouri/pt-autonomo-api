import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Categoria F — Rendimentos Prediais (Artigos 8.º, 41.º e 72.º do CIRS)
 *
 * Net rental income (rendimento líquido) = gross rent minus deductible maintenance,
 * conservation, condominium fees, IMI and insurance directly tied to the let property
 * (Art. 41.º CIRS). By default it is taxed autonomously (taxa liberatória), separately from
 * the taxpayer's other Category B income, with an option to englobar if that is more favorable
 * (relevant when total income falls in a lower IRS bracket than the autonomous rate).
 *
 * 2026 rates (Lei n.º 73-A/2025, alterando o Art. 72.º CIRS):
 * - 10%: contratos de arrendamento habitacional de renda moderada (até 2.300 €/mês), duração
 *   mínima de 3 anos — regime em vigor até 2029.
 * - 25%: arrendamento habitacional em geral.
 * - 28%: arrendamento não habitacional (comercial, lojas, escritórios, prédios rústicos).
 *
 * @param {object} params
 * @param {number} params.annualGrossRent - Total rent invoiced/received for the fiscal year
 * @param {number} [params.deductibleExpenses=0] - Obras de manutenção/conservação, condomínio, seguros, comissões de gestão (Art. 41.º CIRS)
 * @param {number} [params.imiPaid=0] - IMI paid on the let property (deductible)
 * @param {('HABITACIONAL_GERAL'|'HABITACIONAL_RENDA_MODERADA'|'NAO_HABITACIONAL')} [params.contractType='HABITACIONAL_GERAL']
 * @returns {object} Net predial income, applicable autonomous rate, and tax due
 */
export function calculateRendimentosPrediais({
  annualGrossRent = 0,
  deductibleExpenses = 0,
  imiPaid = 0,
  contractType = 'HABITACIONAL_GERAL'
}) {
  if (annualGrossRent <= 0) {
    throw new Error('Annual gross rent must be greater than 0.');
  }

  const totalDeductions = deductibleExpenses + imiPaid;
  const netPredialIncome = Math.max(0, annualGrossRent - totalDeductions);

  const rateTable = {
    HABITACIONAL_RENDA_MODERADA: { rate: 0.10, legal: 'Artigo 72.º, n.º 4 do CIRS (regime de renda moderada, Lei n.º 73-A/2025, em vigor até 2029)' },
    HABITACIONAL_GERAL: { rate: 0.25, legal: 'Artigo 72.º, n.º 1 do CIRS' },
    NAO_HABITACIONAL: { rate: 0.28, legal: 'Artigo 72.º, n.º 1 do CIRS (arrendamento não habitacional)' }
  };
  const applicable = rateTable[contractType] || rateTable.HABITACIONAL_GERAL;
  const autonomousTax = netPredialIncome * applicable.rate;

  return {
    grossRent: annualGrossRent,
    deductions: {
      maintenanceAndOther: deductibleExpenses,
      imiPaid,
      total: Math.round(totalDeductions * 100) / 100
    },
    netPredialIncome: Math.round(netPredialIncome * 100) / 100,
    autonomousTaxation: {
      contractType,
      appliedRatePercent: Math.round(applicable.rate * 100 * 100) / 100,
      estimatedTaxEUR: Math.round(autonomousTax * 100) / 100,
      legalReference: applicable.legal
    },
    englobamentoOption: {
      available: true,
      note: 'Pode optar pelo englobamento do rendimento predial líquido nos restantes rendimentos do agregado se a sua taxa marginal de IRS for inferior à taxa autónoma aplicável.',
      legalReference: 'Artigo 72.º, n.º 8 do CIRS'
    },
    moderateRentEligibility: contractType !== 'HABITACIONAL_RENDA_MODERADA' ? {
      note: 'Contratos de arrendamento habitacional com renda até 2.300 €/mês e duração mínima de 3 anos podem beneficiar da taxa reduzida de 10% em vez de 25%.',
      thresholdMonthlyRentEUR: 2300,
      minimumDurationYears: 3
    } : null
  };
}
