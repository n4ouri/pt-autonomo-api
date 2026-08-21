import express from 'express';
import { runCompleteTaxAudit } from '../engines/audit-engine.js';
import { getLedgerSummary, toSegSocialInputs } from '../engines/ledger-engine.js';
import { generateObligations } from '../engines/obligations-engine.js';
import { getStatusMap } from '../db/obligationStatus.js';
import { requireAuth } from '../middleware/auth.js';
import { withGuidance } from '../lib/guidance.js';

export const router = express.Router();

function currentQuarter(date) {
  return Math.floor(date.getUTCMonth() / 3) + 1;
}

/**
 * The single "state of my business" view: reuses the existing 360º audit engine, but feeds it
 * from the real ledger instead of a hand-built snapshot, plus the upcoming obligations timeline.
 */
router.get('/me/dashboard', requireAuth, (req, res) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const quarter = currentQuarter(now);

  const quarterSummary = getLedgerSummary(req.profile.id, { year, quarter });
  const yearSummary = getLedgerSummary(req.profile.id, { year });
  const { quarterlyGrossServices, quarterlyGrossSales } = toSegSocialInputs(quarterSummary);
  const relevantIncomeServices = quarterlyGrossServices * 0.70;
  const relevantIncomeSales = quarterlyGrossSales * 0.20;

  const snapshot = {
    segSocial: {
      situacaoContributiva: 'Regularizada',
      trabalhadorIndependente: { rendimentoRelevanteTrimestral: relevantIncomeServices + relevantIncomeSales }
    },
    at: {
      situacaoFiscal: 'Regularizada',
      regimeSimplificado: { despesasAtividade: quarterSummary.expenses.justified }
    },
    efatura: {}
  };

  const audit = runCompleteTaxAudit(snapshot);

  const statusMap = getStatusMap(req.profile.id);
  const obligations = generateObligations(req.profile)
    .map((item) => {
      const stored = statusMap.get(item.obligationKey);
      return { ...item, status: stored?.status ?? 'pending' };
    })
    .filter((item) => item.status !== 'paid')
    .slice(0, 8);

  res.json(withGuidance('dashboard', {
    status: 'success',
    data: {
      profile: { id: req.profile.id, name: req.profile.name, regimeIVA: req.profile.regimeIVA },
      currentPeriod: { year, quarter },
      ledger: { currentQuarter: quarterSummary, yearToDate: yearSummary },
      audit,
      upcomingObligations: obligations
    }
  }));
});
