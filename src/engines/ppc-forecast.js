/**
 * Pagamentos por Conta (PPC) Forecast & Legal Suspension Engine (Artigo 102.º do CIRS)
 * 
 * In Portugal, when a Category B self-employed taxpayer invoices foreign or domestic clients
 * without full withholding tax at source, the Tax Authority (AT) issues 3 advance tax instalments
 * (Pagamentos por Conta) due in July, September, and December.
 */

/**
 * Calculates mandatory PPC instalments and determines eligibility to legally suspend the 3rd payment.
 * 
 * @param {object} params
 * @param {number} params.priorYearNetTax - Coleta líquida do ano fiscal anterior
 * @param {number} [params.priorYearWithholding=0] - Retenções na fonte do ano anterior
 * @param {number} [params.currentYearEstimatedTax=0] - Estimated total tax for current fiscal year
 * @param {number} [params.currentYearWithholding=0] - Withholding tax already suffered in current year
 * @returns {object} PPC breakdown, instalment payment schedule, and Art. 102.º n.º 7 suspension check
 */
export function calculatePagamentosPorConta({
  priorYearNetTax = 10000,
  priorYearWithholding = 0,
  currentYearEstimatedTax = 8000,
  currentYearWithholding = 0
}) {
  // Base of PPC calculation (Art. 102.º n.º 2 CIRS):
  // PPC Total = (Prior Year Net Tax - Prior Year Withholding) * 76.5%
  const difference = Math.max(0, priorYearNetTax - priorYearWithholding);
  const totalPPCDue = difference * 0.765;

  // Dispensed if total is less than 50 € (Art. 102.º n.º 3)
  if (totalPPCDue < 50) {
    return {
      isPPCRequired: false,
      totalPPCDue: 0,
      reason: 'Montante total de Pagamentos por Conta inferior a 50,00 € (Art. 102.º n.º 3 CIRS).'
    };
  }

  const instalmentAmount = Math.round((totalPPCDue / 3) * 100) / 100;

  // Schedule
  const schedule = [
    { instalment: 1, month: 'Julho', deadline: '20 de Julho', amountEUR: instalmentAmount, status: 'OBRIGATÓRIO' },
    { instalment: 2, month: 'Setembro', deadline: '20 de Setembro', amountEUR: instalmentAmount, status: 'OBRIGATÓRIO' },
    { instalment: 3, month: 'Dezembro', deadline: '20 de Dezembro', amountEUR: instalmentAmount, status: 'SUSPENSÍVEL' }
  ];

  // Suspension Check under Art. 102.º n.º 7 CIRS:
  // If (Instalment 1 + Instalment 2 + Current Year Withholding) >= Current Year Estimated Tax,
  // the taxpayer can legally limit or completely suspend the 3rd payment!
  const paidOrRetainedBeforeDecember = (instalmentAmount * 2) + currentYearWithholding;
  const canSuspendThirdPayment = paidOrRetainedBeforeDecember >= currentYearEstimatedTax && currentYearEstimatedTax > 0;
  const excessPaid = Math.max(0, paidOrRetainedBeforeDecember - currentYearEstimatedTax);

  return {
    isPPCRequired: true,
    priorYearBasis: {
      netTaxPriorYearEUR: priorYearNetTax,
      withheldTaxPriorYearEUR: priorYearWithholding,
      taxDifferenceEUR: difference
    },
    ppcSummary: {
      totalAnnualPPCEUR: Math.round(totalPPCDue * 100) / 100,
      instalmentValueEUR: instalmentAmount,
      numberOfInstalments: 3,
      legalFramework: 'Artigo 102.º do Código do IRS'
    },
    schedule,
    thirdPaymentSuspensionAnalysis: {
      isEligibleToSuspendDecemberPayment: canSuspendThirdPayment,
      legalBasis: 'Artigo 102.º, n.º 7 do CIRS (Limitação e Cessação de Pagamentos por Conta)',
      explanation: canSuspendThirdPayment
        ? `Os pagamentos efetuados em Julho e Setembro (${instalmentAmount * 2} €) mais as retenções do ano (${currentYearWithholding} €) já cobrem o imposto total estimado (${currentYearEstimatedTax} €). Pode legalmente NÃO pagar a guia de Dezembro sem qualquer juro ou penalização.`
        : 'O imposto estimado para o ano corrente ainda supera o total antecipado. A 3.ª prestação de Dezembro deve ser liquidada.',
      excessCoverageEUR: Math.round(excessPaid * 100) / 100
    }
  };
}
