/**
 * Statutory Tax-Free Allowances & Liquidity Extraction Engine
 * 
 * Portuguese legislation permits specific tax-exempt mechanisms for self-employed
 * workers, managing partners (MOE / Gerentes), and employees to extract liquidity
 * legally with 0% IRS and 0% Social Security.
 */

export const ALLOWANCE_LIMITS_2026 = {
  KM_VIATURA_PROPRIA_RATE: 0.40, // 0.40 € / km (Portaria n.º 1553-D/2007 & OE)
  SUBSIDIO_ALIMENTACAO_CARTAO_DIA: 10.20, // 10.20 € / dia útil em cartão refeição
  SUBSIDIO_ALIMENTACAO_DINHEIRO_DIA: 6.00, // 6.00 € / dia em numerário
  DIARIA_DESLOCACAO_NACIONAL: 50.20, // Ajudas de custo diárias em território nacional (DL 106/98)
  DIARIA_DESLOCACAO_ESTRANGEIRO: 89.35, // Ajudas de custo diárias no estrangeiro
  CHEQUE_DIGITAL_IEFP_MAX: 750.00 // Fundo perdido Cheque-Formação Digital PRR
};

/**
 * Calculates total tax-free liquidity extraction potential and IRC corporate savings.
 * 
 * @param {object} params
 * @param {number} [params.monthlyKmDriven=800] - Estimated monthly business km driven in private vehicle
 * @param {number} [params.workDaysPerMonth=22] - Working days per month
 * @param {number} [params.nationalTravelDaysPerYear=10] - Days traveling within Portugal for client work
 * @param {number} [params.foreignTravelDaysPerYear=5] - Days traveling abroad for client work / conferences
 * @param {boolean} [params.isCompanyManagingPartner=true] - Whether user is managing partner of a company (MOE)
 * @returns {object} Breakdown of net tax-free cash extracted and legal justification rules
 */
export function calculateTaxFreeAllowances({
  monthlyKmDriven = 800,
  workDaysPerMonth = 22,
  nationalTravelDaysPerYear = 10,
  foreignTravelDaysPerYear = 5,
  isCompanyManagingPartner = true
}) {
  // 1. Km Allowances in Private Vehicle (0.40 € / km)
  const annualKm = monthlyKmDriven * 12;
  const annualKmCash = annualKm * ALLOWANCE_LIMITS_2026.KM_VIATURA_PROPRIA_RATE;

  // 2. Meal Allowance in Card (10.20 € / day for 11 working months ~ 220-242 days)
  const annualWorkDays = workDaysPerMonth * 11;
  const annualMealCardCash = annualWorkDays * ALLOWANCE_LIMITS_2026.SUBSIDIO_ALIMENTACAO_CARTAO_DIA;
  const mealAllowanceExcessVsCash = annualWorkDays * (ALLOWANCE_LIMITS_2026.SUBSIDIO_ALIMENTACAO_CARTAO_DIA - ALLOWANCE_LIMITS_2026.SUBSIDIO_ALIMENTACAO_DINHEIRO_DIA);

  // 3. Travel Per-Diems (Ajudas de Custo)
  const annualNationalTravelCash = nationalTravelDaysPerYear * ALLOWANCE_LIMITS_2026.DIARIA_DESLOCACAO_NACIONAL;
  const annualForeignTravelCash = foreignTravelDaysPerYear * ALLOWANCE_LIMITS_2026.DIARIA_DESLOCACAO_ESTRANGEIRO;
  const totalTravelPerDiemCash = annualNationalTravelCash + annualForeignTravelCash;

  // Total Tax-Free Cash Extracted per Year
  const totalTaxFreeNetCash = annualKmCash + annualMealCardCash + totalTravelPerDiemCash;

  // Equivalent gross salary needed to take home this amount under standard progressive rates (approx ~35% tax + 11% SS = 46%)
  const equivalentGrossSalaryNeeded = totalTaxFreeNetCash / 0.54;
  const estimatedTaxSaved = equivalentGrossSalaryNeeded - totalTaxFreeNetCash;

  return {
    summary: {
      totalAnnualTaxFreeNetCashEUR: Math.round(totalTaxFreeNetCash * 100) / 100,
      monthlyAverageTaxFreeNetCashEUR: Math.round((totalTaxFreeNetCash / 12) * 100) / 100,
      estimatedIRSandSSSavingsEUR: Math.round(estimatedTaxSaved * 100) / 100,
      taxRate: '0.00% (100% Isento de IRS e Segurança Social)'
    },
    breakdown: {
      kmAllowance: {
        annualKm,
        ratePerKmEUR: ALLOWANCE_LIMITS_2026.KM_VIATURA_PROPRIA_RATE,
        annualTaxFreeAmountEUR: Math.round(annualKmCash * 100) / 100,
        monthlyAverageEUR: Math.round((annualKmCash / 12) * 100) / 100,
        legalReference: 'Decreto-Lei n.º 106/98 & Portaria n.º 1553-D/2007',
        requirements: 'Mapa mensal de itinerários com matrícula da viatura própria, datas, locais de partida/chegada e motivo profissional.'
      },
      mealCardAllowance: {
        annualWorkDays,
        ratePerDayEUR: ALLOWANCE_LIMITS_2026.SUBSIDIO_ALIMENTACAO_CARTAO_DIA,
        annualTaxFreeAmountEUR: Math.round(annualMealCardCash * 100) / 100,
        monthlyAverageEUR: Math.round((annualMealCardCash / 12) * 100) / 100,
        advantageOverCashPaymentEUR: Math.round(mealAllowanceExcessVsCash * 100) / 100,
        legalReference: 'Artigo 2.º, n.º 3, alínea b), ponto 2 do CIRS',
        requirements: 'Emitido em cartão/vale refeição eletrónico em dias de trabalho efetivo.'
      },
      travelPerDiems: {
        nationalDays: nationalTravelDaysPerYear,
        foreignDays: foreignTravelDaysPerYear,
        annualTaxFreeAmountEUR: Math.round(totalTravelPerDiemCash * 100) / 100,
        legalReference: 'Decreto-Lei n.º 106/98 (Ajudas de Custo Nacionais e Estrangeiras)',
        requirements: 'Comprovativo de deslocação profissional fora do município habitual (conferências, clientes, formação).'
      }
    },
    publicGrantsAvailable: {
      chequeDigitalIEFP: {
        name: 'Cheque-Formação Digital (PRR / IEFP)',
        grantAmountEUR: ALLOWANCE_LIMITS_2026.CHEQUE_DIGITAL_IEFP_MAX,
        type: '100% a fundo perdido (não reembolsável)',
        target: 'Trabalhadores Independentes e Gerentes de PME',
        legalReference: 'Portaria n.º 246/2022 (PRR - Plano de Recuperação e Resiliência)',
        portal: 'https://iefponline.iefp.pt'
      }
    }
  };
}
