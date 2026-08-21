/**
 * Seguro Obrigatório de Acidentes de Trabalho para Trabalhadores Independentes.
 *
 * Statutory References:
 * - Artigo 3.º do Decreto-Lei n.º 159/99, de 11 de maio
 * - Lei n.º 98/2009, de 4 de setembro (Lei dos Acidentes de Trabalho)
 *
 * Every self-employed worker in Portugal is legally required to hold work-accident insurance,
 * except those whose production is exclusively for their own or their household's consumption.
 * Unlike Segurança Social contributions or IRS withholding, the premium itself is NOT set by a
 * government tariff — it is priced by private insurers based on declared insured income and
 * activity risk class. The bands below are indicative market ranges (2025/2026), not statutory
 * rates; always request quotes from at least two insurers before choosing a policy.
 */

const PREMIUM_RATE_BANDS = {
  BAIXO: { label: 'Risco baixo (escritório, TI, consultoria, atividades administrativas)', min: 0.008, max: 0.015 },
  MEDIO: { label: 'Risco médio (comércio, restauração, atividades manuais ligeiras)', min: 0.015, max: 0.03 },
  ALTO: { label: 'Risco alto (construção, indústria, trabalho em altura ou com maquinaria)', min: 0.03, max: 0.06 }
};

const MARKET_MINIMUM_ANNUAL_PREMIUM_EUR = 60;

/**
 * Estimates the mandatory work-accident insurance premium for a self-employed worker.
 *
 * @param {object} params
 * @param {number} params.annualInsuredIncome - Capital seguro anual declarado ao segurador (base para o cálculo do prémio)
 * @param {('BAIXO'|'MEDIO'|'ALTO')} [params.riskClass='BAIXO'] - Activity risk class as classified by the insurer
 * @param {boolean} [params.isExemptSelfConsumptionOnly=false] - Whether production is exclusively for own/household consumption (Art. 3.º DL 159/99 exemption)
 * @returns {object} Indicative annual premium range, monthly equivalent, and legal framework
 */
export function calculateSeguroAcidentesTrabalho({
  annualInsuredIncome = 0,
  riskClass = 'BAIXO',
  isExemptSelfConsumptionOnly = false
}) {
  if (annualInsuredIncome < 0) {
    throw new Error('Annual insured income cannot be negative.');
  }

  if (isExemptSelfConsumptionOnly) {
    return {
      isMandatory: false,
      exemptionReason: 'Produção destinada exclusivamente ao consumo ou utilização pelo próprio trabalhador e seu agregado familiar (Artigo 3.º do Decreto-Lei n.º 159/99).',
      legalReference: 'Artigo 3.º do Decreto-Lei n.º 159/99, de 11 de maio'
    };
  }

  const band = PREMIUM_RATE_BANDS[riskClass] || PREMIUM_RATE_BANDS.BAIXO;
  const minAnnualPremium = Math.max(MARKET_MINIMUM_ANNUAL_PREMIUM_EUR, annualInsuredIncome * band.min);
  const maxAnnualPremium = Math.max(minAnnualPremium, annualInsuredIncome * band.max);
  const midAnnualPremium = (minAnnualPremium + maxAnnualPremium) / 2;

  return {
    isMandatory: true,
    annualInsuredIncome,
    riskClass: { code: riskClass, ...band },
    estimatedAnnualPremium: {
      minEUR: Math.round(minAnnualPremium * 100) / 100,
      midpointEUR: Math.round(midAnnualPremium * 100) / 100,
      maxEUR: Math.round(maxAnnualPremium * 100) / 100,
      monthlyEquivalentEUR: Math.round((midAnnualPremium / 12) * 100) / 100
    },
    disclaimer: 'Estimativa de mercado, não uma tarifa estatutária: cada seguradora fixa o seu próprio prémio consoante a classe de risco, idade e coberturas contratadas. Peça cotações a pelo menos duas seguradoras antes de contratar.',
    legalReference: 'Artigo 3.º do Decreto-Lei n.º 159/99, de 11 de maio, conjugado com a Lei n.º 98/2009, de 4 de setembro (Lei dos Acidentes de Trabalho)'
  };
}
