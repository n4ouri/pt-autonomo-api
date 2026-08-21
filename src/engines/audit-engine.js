import { simulateRegimeSimplificado } from './simplificado.js';
import { simulateSegurancaSocialQuarterly } from './seg-social.js';
import { optimizeEFaturaDeductions } from './efatura-optimizer.js';
import { compareCompanyVsRecibosVerdes } from './company-compare.js';

/**
 * Runs a complete 360º fiscal and social security health audit from input data.
 * 
 * @param {object} snapshot
 * @returns {object} Health score, critical alerts, opportunities, and metric summaries
 */
export function runCompleteTaxAudit(snapshot = {}) {
  const alerts = [];
  const opportunities = [];
  let healthScore = 100;
  let totalDebts = 0;

  const ss = snapshot.segSocial || {};
  const at = snapshot.at || {};
  const ef = snapshot.efatura || {};

  // 1. Check SS debts & situation
  if (ss.situacaoContributiva && ss.situacaoContributiva !== 'Regularizada') {
    healthScore -= 40;
    alerts.push({
      priority: 'CRITICAL',
      source: 'Segurança Social Direta',
      title: 'Situação Contributiva NÃO Regularizada',
      description: 'Existem contribuições em atraso ou declarações omissas. Impede certidão de não dívida e acarreta juros de mora.',
      action: 'Aceder à Segurança Social Direta > Conta-Corrente e emitir DUC/Multibanco.'
    });
  }

  if (ss.dividas && ss.dividas.total > 0) {
    totalDebts += ss.dividas.total;
    healthScore -= 20;
    alerts.push({
      priority: 'HIGH',
      source: 'Segurança Social Direta',
      title: `Dívida ativa na Segurança Social: ${ss.dividas.total.toLocaleString('pt-PT')} €`,
      description: 'Montante em cobrança com risco de passagem a execução fiscal.',
      action: 'Regularizar de imediato ou requerer plano de prestações (Art. 196.º CRCSPSS).'
    });
  }

  // 2. Check AT Tax Debts
  if (at.dividas && at.dividas.total > 0) {
    totalDebts += at.dividas.total;
    healthScore -= 35;
    alerts.push({
      priority: 'CRITICAL',
      source: 'Autoridade Tributária (AT)',
      title: `Dívida Fiscal Ativa: ${at.dividas.total.toLocaleString('pt-PT')} €`,
      description: 'Processos de execução fiscal ativos com risco de penhora e retenção de reembolsos.',
      action: 'Consultar Portal das Finanças > Dívidas Fiscais e emitir DUC para liquidação.'
    });
  }

  // 3. Check Pending Invoices in e-Fatura
  const pendingInvoices = ef.faturasPendentes || 0;
  if (pendingInvoices > 0) {
    healthScore -= Math.min(20, pendingInvoices * 2);
    alerts.push({
      priority: 'MEDIUM',
      source: 'e-Fatura',
      title: `${pendingInvoices} Faturas com Classificação Setorial Pendente`,
      description: 'Faturas emitidas com o seu NIF aguardam associação a categoria no e-Fatura para contarem nas deduções de IRS.',
      action: 'Aceder a e-Fatura > Consumidor > Validar Faturas.'
    });
  }

  // 4. Autónomo Calculations & Optimizations
  const quarterlyIncome = ss.trabalhadorIndependente?.rendimentoRelevanteTrimestral || 
                          ss.trabalhadorIndependente?.ultimoRendimentoTrimestral || 
                          (at.regimeSimplificado?.rendimentoServicos ? at.regimeSimplificado.rendimentoServicos / 4 * 0.70 : 0);

  let ssAnalysis = null;
  let simplificadoAnalysis = null;
  let companyComparison = null;

  if (quarterlyIncome > 0) {
    const grossQuarter = quarterlyIncome / 0.70;
    const grossAnnual = grossQuarter * 4;

    ssAnalysis = simulateSegurancaSocialQuarterly({ quarterlyGrossServices: grossQuarter });
    simplificadoAnalysis = simulateRegimeSimplificado({
      annualGrossServices: grossAnnual,
      annualSSPaid: ssAnalysis.standardMonthlyContribution * 12,
      businessExpenses: at.regimeSimplificado?.despesasAtividade || 0
    });
    companyComparison = compareCompanyVsRecibosVerdes({ annualGrossRevenue: grossAnnual });

    // Check expense justification deficit
    if (simplificadoAnalysis.simplificado.expenseJustification.expenseDeficit > 0) {
      const def = simplificadoAnalysis.simplificado.expenseJustification.expenseDeficit;
      healthScore -= 10;
      opportunities.push({
        category: 'IRS Categoria B - Regime Simplificado',
        title: `Défice de Justificação de Despesas: Falta justificar ${def.toLocaleString('pt-PT')} €`,
        impact: `Evitar tributação acrescida no IRS (Artigo 31.º, n.º 13 CIRS)`,
        description: `15% da sua faturação deve ser justificada com despesas com NIF afetas à atividade ou Segurança Social.`,
        action: 'Afete faturas de comunicações, combustível, equipamento e formação à atividade no e-Fatura.'
      });
    }

    // SS Step variation opportunity
    opportunities.push({
      category: 'Segurança Social - Otimização Contributiva',
      title: 'Ajuste Estratégico de Escalão (-25% ou +25%) na Declaração Trimestral',
      impact: `Variação entre ${ssAnalysis.strategicVariations.minus25Percent.monthlyPayment.toLocaleString('pt-PT')} € e ${ssAnalysis.strategicVariations.plus25Percent.monthlyPayment.toLocaleString('pt-PT')} €/mês`,
      description: `Pode reduzir em 25% para aliviar tesouraria em ${ssAnalysis.strategicVariations.minus25Percent.annualCashflowLiberation.toLocaleString('pt-PT')} €/ano ou subir 25% para maximizar abates no IRS e proteção de parentalidade.`,
      action: 'Ajustar opção no formulário da Declaração Trimestral na Segurança Social Direta.'
    });
  }

  // Deductions analysis
  const efaturaOptimization = optimizeEFaturaDeductions({
    categories: ef.categorias || {},
    pprInvested: ef.pprInvestido || 0
  });

  return {
    auditTimestamp: new Date().toISOString(),
    healthScore: Math.max(0, Math.min(100, healthScore)),
    statusOverview: {
      fiscalStatus: at.situacaoFiscal || 'Regularizada',
      ssStatus: ss.situacaoContributiva || 'Regularizada',
      totalActiveDebts: totalDebts,
      pendingInvoicesToValidate: pendingInvoices
    },
    alerts,
    opportunities,
    engines: {
      simplificado: simplificadoAnalysis,
      segurancaSocial: ssAnalysis,
      efatura: efaturaOptimization,
      companyVsRecibos: companyComparison
    }
  };
}
