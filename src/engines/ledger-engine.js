import { listTransactions } from '../db/transactions.js';

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function sum(rows, pick) {
  return rows.reduce((acc, row) => acc + (typeof pick === 'function' ? pick(row) : row[pick] ?? 0), 0);
}

export function quarterOf(dateStr) {
  const d = new Date(dateStr);
  return Math.floor(d.getUTCMonth() / 3) + 1;
}

function inPeriod(t, { year, quarter }) {
  const d = new Date(t.date);
  if (year && d.getUTCFullYear() !== year) return false;
  if (quarter && quarterOf(t.date) !== quarter) return false;
  return true;
}

/**
 * Aggregates a profile's raw transaction ledger into a period summary that plugs directly
 * into the existing stateless tax/SS simulators (no manual re-entry of totals).
 */
export function getLedgerSummary(profileId, { year, quarter } = {}) {
  const all = listTransactions(profileId, {});
  const filtered = year || quarter ? all.filter((t) => inPeriod(t, { year, quarter })) : all;

  const income = filtered.filter((t) => t.type === 'income');
  const expenses = filtered.filter((t) => t.type === 'expense');

  const grossByIncomeCategory = {
    SERVICOS_PROFISSIONAIS: round2(sum(income.filter((t) => t.category === 'SERVICOS_PROFISSIONAIS'), 'amount')),
    OUTROS_SERVICOS: round2(sum(income.filter((t) => t.category === 'OUTROS_SERVICOS'), 'amount')),
    VENDAS_MERCADORIAS: round2(sum(income.filter((t) => t.category === 'VENDAS_MERCADORIAS'), 'amount'))
  };

  const grossIncome = round2(sum(income, 'amount'));
  const totalExpenses = round2(sum(expenses, 'amount'));
  const justifiedExpenses = round2(sum(expenses.filter((t) => t.isJustifiedExpense), 'amount'));

  const vatByRate = { r23: 0, r13: 0, r06: 0, other: 0 };
  for (const t of income) {
    const base = t.amount;
    if (t.vatRate === 0.23) vatByRate.r23 += base;
    else if (t.vatRate === 0.13) vatByRate.r13 += base;
    else if (t.vatRate === 0.06) vatByRate.r06 += base;
    else if (t.vatRate > 0) vatByRate.other += base;
  }

  const vatCollected = round2(sum(income, (t) => t.amount * (t.vatRate || 0)));
  const vatDeductible = round2(sum(expenses, (t) => t.amount * (t.vatRate || 0)));

  const byCategory = {};
  for (const t of filtered) {
    byCategory[t.category] = round2((byCategory[t.category] || 0) + t.amount);
  }

  return {
    period: { year: year ?? null, quarter: quarter ?? null },
    transactionCount: filtered.length,
    income: {
      total: grossIncome,
      byCategory: grossByIncomeCategory,
      taxableBaseByVATRate: {
        normal23: round2(vatByRate.r23),
        intermediate13: round2(vatByRate.r13),
        reduced06: round2(vatByRate.r06),
        other: round2(vatByRate.other)
      }
    },
    expenses: {
      total: totalExpenses,
      justified: justifiedExpenses
    },
    netResult: round2(grossIncome - totalExpenses),
    vat: {
      collected: vatCollected,
      deductible: vatDeductible,
      balance: round2(vatCollected - vatDeductible)
    },
    byCategory
  };
}

/** Maps a ledger summary onto the input shape expected by simulateRegimeSimplificado / simulateSegurancaSocialQuarterly. */
export function toTaxEngineInputs(summary) {
  return {
    annualGrossServices: summary.income.byCategory.SERVICOS_PROFISSIONAIS,
    annualGrossOtherServices: summary.income.byCategory.OUTROS_SERVICOS,
    annualGrossSales: summary.income.byCategory.VENDAS_MERCADORIAS,
    businessExpenses: summary.expenses.justified
  };
}

export function toSegSocialInputs(summary) {
  return {
    quarterlyGrossServices: summary.income.byCategory.SERVICOS_PROFISSIONAIS + summary.income.byCategory.OUTROS_SERVICOS,
    quarterlyGrossSales: summary.income.byCategory.VENDAS_MERCADORIAS
  };
}

export function toIVAInputs(summary) {
  return {
    grossInvoicedNormalRate: summary.income.taxableBaseByVATRate.normal23,
    grossInvoicedIntermediateRate: summary.income.taxableBaseByVATRate.intermediate13,
    grossInvoicedReducedRate: summary.income.taxableBaseByVATRate.reduced06,
    deductibleVATGeneralExpenses: summary.vat.deductible
  };
}
