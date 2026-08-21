/**
 * Segurança Social Social Protection & Benefits Engine for Independent Workers (TI)
 * 
 * Statutory References:
 * - Decreto-Lei n.º 91/2009 (Proteção Social na Parentalidade)
 * - Decreto-Lei n.º 28/2004 & CRCSPSS (Proteção Social na Doença / Baixa Médica)
 * - Decreto-Lei n.º 12/2013 (Subsídio por Cessação de Atividade para Trabalhadores Independentes)
 */

/**
 * Calculates parental benefits, sickness benefits, and eligibility check for independent workers.
 * 
 * @param {object} params
 * @param {number} params.monthlyContributionBase - Average monthly contribution base registered in SS
 * @param {number} [params.registeredMonthsInLastYear=12] - Number of months with active contributions in past 12 months
 * @param {number} [params.economicDependencePercentage=0] - Percentage of revenue from top single client (0 to 100)
 * @param {boolean} [params.hasDebtToSS=false] - Whether taxpayer has active unpaid debt to SS
 * @returns {object} Comprehensive benefits calculation, daily and monthly subsidy estimates, and guarantee period checks
 */
export function calculateSegurancaSocialBenefits({
  monthlyContributionBase = 3000,
  registeredMonthsInLastYear = 12,
  economicDependencePercentage = 0,
  hasDebtToSS = false
}) {
  if (monthlyContributionBase <= 0) {
    throw new Error('Monthly contribution base must be greater than 0.');
  }

  // 1. Qualifying Period (Prazo de Garantia)
  // Parentalidade & Doença: 6 months with registered earnings in the past 12 months (or last 6 months for parental leave)
  const isPrazoGarantiaMet = registeredMonthsInLastYear >= 6;
  const isSituationRegularized = !hasDebtToSS;
  const isEligibleForBenefits = isPrazoGarantiaMet && isSituationRegularized;

  // Reference Daily Remuneration (RR / 30)
  const dailyBase = monthlyContributionBase / 30;

  // =========================================================================
  // 2. PARENTALIDADE (Subsídio Parental Inicial - DL 91/2009)
  // =========================================================================
  const parental120DaysDaily = dailyBase * 1.00; // 100% of RR
  const parental120DaysTotal = parental120DaysDaily * 120;
  const parental120DaysMonthlyEquivalent = parental120DaysDaily * 30;

  const parental150DaysDaily = dailyBase * 0.83; // 83% of RR
  const parental150DaysTotal = parental150DaysDaily * 150;
  const parental150DaysMonthlyEquivalent = parental150DaysDaily * 30;

  const parental180DaysDaily = dailyBase * 0.83; // 83% of RR (shared between parents)
  const parental180DaysTotal = parental180DaysDaily * 180;

  // =========================================================================
  // 3. DOENÇA / BAIXA MÉDICA (DL 28/2004)
  // =========================================================================
  // Note: Independent workers receive sickness benefit starting only on the 11th day of incapacity (10-day waiting period)!
  const sicknessWaitingPeriodDays = 10;
  const sicknessRates = [
    { period: '11.º ao 30.º dia (até 30 dias)', rate: 0.55, dailyEUR: dailyBase * 0.55, monthlyEUR: dailyBase * 0.55 * 30 },
    { period: '31.º ao 90.º dia (1 a 3 meses)', rate: 0.60, dailyEUR: dailyBase * 0.60, monthlyEUR: dailyBase * 0.60 * 30 },
    { period: '91.º ao 365.º dia (3 a 12 meses)', rate: 0.70, dailyEUR: dailyBase * 0.70, monthlyEUR: dailyBase * 0.70 * 30 },
    { period: 'Mais de 365 dias (> 1 ano)', rate: 0.75, dailyEUR: dailyBase * 0.75, monthlyEUR: dailyBase * 0.75 * 30 }
  ];

  // =========================================================================
  // 4. SUBSÍDIO POR CESSAÇÃO DE ATIVIDADE (Desemprego TI - DL 12/2013)
  // =========================================================================
  // Requires: Economic dependence on a single entity >= 50% OR 80% (Entidade Contratante) AND at least 360 days of activity.
  const isCessacaoEligible = economicDependencePercentage >= 50 && registeredMonthsInLastYear >= 12 && isSituationRegularized;
  const cessacaoDailyEstimate = dailyBase * 0.65; // 65% of reference remuneration

  return {
    eligibilityCheck: {
      isEligible: isEligibleForBenefits,
      hasRequired6MonthsContributions: isPrazoGarantiaMet,
      registeredMonthsInLastYear,
      isContributionStatusRegularized: isSituationRegularized,
      blockReason: !isPrazoGarantiaMet 
        ? 'Falta cumprir o prazo de garantia (mínimo de 6 meses com registo de remunerações).'
        : hasDebtToSS 
        ? 'Dívidas ativas ou situação contributiva não regularizada impedem a concessão de prestações sociais.'
        : null
    },
    referenceRemuneration: {
      monthlyBaseIncidenceEUR: monthlyContributionBase,
      dailyReferenceRemunerationEUR: Math.round(dailyBase * 100) / 100
    },
    parentalBenefits: {
      option120Days: {
        percentageOfRemuneration: 100,
        dailySubsidyEUR: Math.round(parental120DaysDaily * 100) / 100,
        monthlyEquivalentEUR: Math.round(parental120DaysMonthlyEquivalent * 100) / 100,
        totalSubsidy120DaysEUR: Math.round(parental120DaysTotal * 100) / 100
      },
      option150Days: {
        percentageOfRemuneration: 83,
        dailySubsidyEUR: Math.round(parental150DaysDaily * 100) / 100,
        monthlyEquivalentEUR: Math.round(parental150DaysMonthlyEquivalent * 100) / 100,
        totalSubsidy150DaysEUR: Math.round(parental150DaysTotal * 100) / 100
      },
      option180DaysShared: {
        percentageOfRemuneration: 83,
        dailySubsidyEUR: Math.round(parental180DaysDaily * 100) / 100,
        totalSubsidy180DaysEUR: Math.round(parental180DaysTotal * 100) / 100
      },
      legalReference: 'Decreto-Lei n.º 91/2009'
    },
    sicknessBenefits: {
      waitingPeriodDays: sicknessWaitingPeriodDays,
      waitingPeriodRule: 'Os Trabalhadores Independentes recebem subsídio de doença apenas a partir do 11.º dia de baixa (os primeiros 10 dias não são pagos pela Segurança Social).',
      schedules: sicknessRates.map(s => ({
        period: s.period,
        ratePercent: s.rate * 100,
        dailySubsidyEUR: Math.round(s.dailyEUR * 100) / 100,
        monthlyEquivalentEUR: Math.round(s.monthlyEUR * 100) / 100
      })),
      legalReference: 'Decreto-Lei n.º 28/2004 & Artigo 139.º CRCSPSS'
    },
    unemploymentCessationBenefit: {
      isEligible: isCessacaoEligible,
      economicDependencePercentage,
      economicDependenceRule: 'Apenas os Trabalhadores Independentes com dependência económica (>= 50% da faturação para a mesma empresa contratante) têm direito ao subsídio de cessação de atividade.',
      estimatedMonthlySubsidyEUR: isCessacaoEligible ? Math.round(cessacaoDailyEstimate * 30 * 100) / 100 : 0,
      legalReference: 'Decreto-Lei n.º 12/2013'
    }
  };
}
