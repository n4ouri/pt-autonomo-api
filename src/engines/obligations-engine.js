import { TAX_CALENDAR } from '../constants/tax-calendar.js';
import { getLedgerSummary, toSegSocialInputs, toTaxEngineInputs, toIVAInputs } from './ledger-engine.js';
import { simulateSegurancaSocialQuarterly } from './seg-social.js';
import { simulateRegimeSimplificado } from './simplificado.js';
import { calculateIVAPeriodicAssessment } from './iva-apuramento.js';
import { calculatePagamentosPorConta } from './ppc-forecast.js';

function findCalendarEntry(code) {
  return TAX_CALENDAR.recurringObligations.find((o) => o.code === code) || null;
}

/** Next UTC date (this year, or next year if already passed) at 1-indexed month/day. */
function nextOccurrence(month, day, referenceDate) {
  const year = referenceDate.getUTCFullYear();
  let candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getTime() < startOfDay(referenceDate).getTime()) {
    candidate = new Date(Date.UTC(year + 1, month - 1, day));
  }
  return candidate;
}

function startOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysUntil(dueDate, referenceDate) {
  const ms = startOfDay(dueDate).getTime() - startOfDay(referenceDate).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function safeSimplificado(inputs, extra = {}) {
  if ((inputs.annualGrossServices || 0) + (inputs.annualGrossOtherServices || 0) + (inputs.annualGrossSales || 0) <= 0) {
    return null;
  }
  return simulateRegimeSimplificado({ ...inputs, ...extra });
}

const SS_QUARTERS = [
  { code: 'SS_TRIMESTRAL_Q1', dueMonth: 4, dueDay: 30, coveredQuarter: 1, coveredYearOffset: 0 },
  { code: 'SS_TRIMESTRAL_Q2', dueMonth: 7, dueDay: 31, coveredQuarter: 2, coveredYearOffset: 0 },
  { code: 'SS_TRIMESTRAL_Q3', dueMonth: 10, dueDay: 31, coveredQuarter: 3, coveredYearOffset: 0 },
  { code: 'SS_TRIMESTRAL_Q4', dueMonth: 1, dueDay: 31, coveredQuarter: 4, coveredYearOffset: -1 }
];

const IVA_QUARTERS = [
  { dueMonth: 2, dueDay: 25, coveredQuarter: 4, coveredYearOffset: -1 },
  { dueMonth: 5, dueDay: 25, coveredQuarter: 1, coveredYearOffset: 0 },
  { dueMonth: 8, dueDay: 25, coveredQuarter: 2, coveredYearOffset: 0 },
  { dueMonth: 11, dueDay: 25, coveredQuarter: 3, coveredYearOffset: 0 }
];

function buildItem({ obligationKey, calendarCode, dueDate, referenceDate, amountEstimated, currency = 'EUR', extra = {} }) {
  const entry = findCalendarEntry(calendarCode);
  return {
    obligationKey,
    calendarCode,
    name: entry?.name ?? calendarCode,
    legalReference: entry?.legalReference ?? null,
    target: entry?.target ?? null,
    dueDate: dueDate.toISOString().slice(0, 10),
    daysUntilDue: daysUntil(dueDate, referenceDate),
    amountEstimated: amountEstimated != null ? Math.round(amountEstimated * 100) / 100 : null,
    currency,
    ...extra
  };
}

/**
 * Builds the personalized "what's due, when, how much" timeline for a profile by combining
 * the statutory TAX_CALENDAR with the profile's regime and its real transaction ledger.
 * Pure derivation — nothing is persisted here; callers overlay stored obligation_status rows.
 */
export function generateObligations(profile, referenceDate = new Date()) {
  const items = [];

  // 1. Segurança Social quarterly declarations -> the monthly contribution they fix.
  for (const q of SS_QUARTERS) {
    const dueDate = nextOccurrence(q.dueMonth, q.dueDay, referenceDate);
    const coveredYear = dueDate.getUTCFullYear() + q.coveredYearOffset;
    const summary = getLedgerSummary(profile.id, { year: coveredYear, quarter: q.coveredQuarter });
    let amountEstimated = null;
    let note = 'Sem faturação registada no período coberto — declaração de valor zero (mínimo estatutário aplicável).';
    if (summary.transactionCount > 0) {
      const ss = simulateSegurancaSocialQuarterly(toSegSocialInputs(summary));
      amountEstimated = ss.standardMonthlyContribution;
      note = `Fixa a mensalidade de Segurança Social com base no rendimento relevante do ${q.coveredQuarter}.º trimestre de ${coveredYear}.`;
    }
    items.push(buildItem({
      obligationKey: `${q.code}_${coveredYear}`,
      calendarCode: q.code,
      dueDate,
      referenceDate,
      amountEstimated,
      extra: { type: 'declaration', coveredPeriod: { year: coveredYear, quarter: q.coveredQuarter }, note }
    }));
  }

  // 2. Monthly SS payment, amount fixed by the most recently completed quarterly declaration.
  {
    const dueDate = nextOccurrence(referenceDate.getUTCMonth() + 1, 20, referenceDate);
    const lastQuarterRef = new Date(dueDate.getTime());
    lastQuarterRef.setUTCMonth(lastQuarterRef.getUTCMonth() - 4); // roughly the quarter this month's payment was fixed by
    const coveredQuarter = Math.floor(lastQuarterRef.getUTCMonth() / 3) + 1;
    const coveredYear = lastQuarterRef.getUTCFullYear();
    const summary = getLedgerSummary(profile.id, { year: coveredYear, quarter: coveredQuarter });
    let amountEstimated = 20; // statutory minimum when no income is on record
    if (summary.transactionCount > 0) {
      amountEstimated = simulateSegurancaSocialQuarterly(toSegSocialInputs(summary)).standardMonthlyContribution;
    }
    items.push(buildItem({
      obligationKey: `SS_PAGAMENTO_MENSAL_${dueDate.toISOString().slice(0, 7)}`,
      calendarCode: 'SS_PAGAMENTO_MENSAL',
      dueDate,
      referenceDate,
      amountEstimated,
      extra: { type: 'payment' }
    }));
  }

  // 3. IVA trimestral — only if the profile is actually registered under the quarterly VAT regime.
  if (profile.regimeIVA === 'trimestral') {
    for (const q of IVA_QUARTERS) {
      const dueDate = nextOccurrence(q.dueMonth, q.dueDay, referenceDate);
      const coveredYear = dueDate.getUTCFullYear() + q.coveredYearOffset;
      const summary = getLedgerSummary(profile.id, { year: coveredYear, quarter: q.coveredQuarter });
      let amountEstimated = null;
      let note = 'Sem transações registadas no trimestre coberto.';
      if (summary.transactionCount > 0) {
        const iva = calculateIVAPeriodicAssessment(toIVAInputs(summary));
        amountEstimated = iva.assessmentResult.status === 'IVA_A_PAGAR' ? iva.assessmentResult.netVATBalanceEUR : 0;
        note = iva.assessmentResult.status === 'CREDITO_IVA_A_REPORTAR'
          ? `Crédito de IVA a reportar: ${iva.assessmentResult.netVATBalanceEUR} €.`
          : `Apuramento do IVA do ${q.coveredQuarter}.º trimestre de ${coveredYear}.`;
      }
      items.push(buildItem({
        obligationKey: `IVA_TRIMESTRAL_${coveredYear}Q${q.coveredQuarter}`,
        calendarCode: 'IVA_TRIMESTRAL',
        dueDate,
        referenceDate,
        amountEstimated,
        extra: { type: 'payment', coveredPeriod: { year: coveredYear, quarter: q.coveredQuarter }, note }
      }));
    }
  }

  // 4. IRS Modelo 3 (annual) — informational, based on the prior full calendar year.
  {
    const dueDate = nextOccurrence(6, 30, referenceDate);
    const coveredYear = dueDate.getUTCFullYear() - 1;
    const summary = getLedgerSummary(profile.id, { year: coveredYear });
    const result = safeSimplificado(toTaxEngineInputs(summary));
    items.push(buildItem({
      obligationKey: `IRS_MODELO_3_${coveredYear}`,
      calendarCode: 'IRS_MODELO_3',
      dueDate,
      referenceDate,
      amountEstimated: result ? result.taxEstimation.netIRSBalance : null,
      extra: {
        type: 'declaration',
        coveredPeriod: { year: coveredYear },
        note: result
          ? `Estimativa baseada nos ${summary.transactionCount} lançamentos registados para ${coveredYear}. Confirme retenções na fonte reais antes de submeter.`
          : `Sem lançamentos suficientes registados para ${coveredYear} para estimar o imposto.`
      }
    }));
  }

  // 5. Pagamentos por Conta — requires a full prior calendar year on record; assumes no
  //    withholding was tracked in the ledger (adjust manually if your invoices had retenção na fonte).
  {
    const julyDue = nextOccurrence(7, 20, referenceDate);
    const ppcYear = julyDue.getUTCFullYear();
    const priorSummary = getLedgerSummary(profile.id, { year: ppcYear - 1 });
    const priorResult = safeSimplificado(toTaxEngineInputs(priorSummary));

    if (priorResult) {
      const ppc = calculatePagamentosPorConta({
        priorYearNetTax: priorResult.taxEstimation.estimatedGrossIRSTax,
        priorYearWithholding: 0
      });
      if (ppc.isPPCRequired) {
        const installments = [
          { month: 7, day: 20, label: 'PPC_JULHO' },
          { month: 9, day: 20, label: 'PPC_SETEMBRO' },
          { month: 12, day: 20, label: 'PPC_DEZEMBRO' }
        ];
        for (const inst of installments) {
          const dueDate = nextOccurrence(inst.month, inst.day, referenceDate);
          items.push(buildItem({
            obligationKey: `${inst.label}_${dueDate.getUTCFullYear()}`,
            calendarCode: inst.label,
            dueDate,
            referenceDate,
            amountEstimated: ppc.ppcSummary.instalmentValueEUR,
            extra: {
              type: 'payment',
              note: `Baseado no imposto estimado de ${ppcYear - 1} (${priorResult.taxEstimation.estimatedGrossIRSTax} €). Assume retenção na fonte de 0 € nesse ano — ajuste se aplicável.`
            }
          }));
        }
      }
    }
  }

  // 6. e-Fatura validation deadline — informational, applies to everyone.
  {
    const dueDate = nextOccurrence(2, 25, referenceDate);
    items.push(buildItem({
      obligationKey: `EFATURA_VALIDACAO_${dueDate.getUTCFullYear()}`,
      calendarCode: 'EFATURA_VALIDACAO',
      dueDate,
      referenceDate,
      amountEstimated: null,
      extra: { type: 'declaration', note: 'Valide no portal e-Fatura todas as faturas emitidas com o seu NIF no ano transato.' }
    }));
  }

  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
