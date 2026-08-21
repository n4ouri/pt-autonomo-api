import express from 'express';
import { simulateRegimeSimplificado } from '../engines/simplificado.js';
import { simulateSegurancaSocialQuarterly } from '../engines/seg-social.js';
import { compareCompanyVsRecibosVerdes } from '../engines/company-compare.js';
import { optimizeEFaturaDeductions } from '../engines/efatura-optimizer.js';
import { determineVIESAndVATCompliance } from '../engines/vies-compliance.js';
import { runCompleteTaxAudit } from '../engines/audit-engine.js';
import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';
import { TAX_CALENDAR } from '../constants/tax-calendar.js';

export const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'pt-autonomo-api',
    fiscalYear: 2026,
    timestamp: new Date().toISOString()
  });
});

/**
 * Constants & Statutory limits endpoint
 */
router.get('/constants', (req, res) => {
  res.json({
    status: 'success',
    data: LEGAL_CONSTANTS
  });
});

/**
 * Tax Calendar endpoint
 */
router.get('/calendar', (req, res) => {
  res.json({
    status: 'success',
    data: TAX_CALENDAR
  });
});

/**
 * CIRS Regime Simplificado simulation
 */
router.post('/simulate/regime-simplificado', (req, res) => {
  try {
    const {
      annualGrossServices = 0,
      annualGrossSales = 0,
      annualGrossOtherServices = 0,
      activityYear = 3,
      annualSSPaid = 0,
      businessExpenses = 0,
      homeOfficeEligibleExpenses = 0,
      withheldTax = 0
    } = req.body || {};

    const result = simulateRegimeSimplificado({
      annualGrossServices: Number(annualGrossServices),
      annualGrossSales: Number(annualGrossSales),
      annualGrossOtherServices: Number(annualGrossOtherServices),
      activityYear: Number(activityYear),
      annualSSPaid: Number(annualSSPaid),
      businessExpenses: Number(businessExpenses),
      homeOfficeEligibleExpenses: Number(homeOfficeEligibleExpenses),
      withheldTax: Number(withheldTax)
    });

    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Segurança Social Quarterly declaration simulation
 */
router.post('/simulate/ss-quarterly', (req, res) => {
  try {
    const {
      quarterlyGrossServices = 0,
      quarterlyGrossSales = 0,
      isFirstYearExempt = false,
      hasConcurrentEmployment = false
    } = req.body || {};

    const result = simulateSegurancaSocialQuarterly({
      quarterlyGrossServices: Number(quarterlyGrossServices),
      quarterlyGrossSales: Number(quarterlyGrossSales),
      isFirstYearExempt: Boolean(isFirstYearExempt),
      hasConcurrentEmployment: Boolean(hasConcurrentEmployment)
    });

    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Unipessoal Lda vs Recibos Verdes break-even simulator
 */
router.post('/simulate/company-vs-recibos', (req, res) => {
  try {
    const {
      annualGrossRevenue = 60000,
      annualOperationalExpenses = 6000,
      monthlyDirectorSalary = 1400,
      monthlyAccountingFee = 150
    } = req.body || {};

    const result = compareCompanyVsRecibosVerdes({
      annualGrossRevenue: Number(annualGrossRevenue),
      annualOperationalExpenses: Number(annualOperationalExpenses),
      monthlyDirectorSalary: Number(monthlyDirectorSalary),
      monthlyAccountingFee: Number(monthlyAccountingFee)
    });

    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * e-Fatura deduction optimizer
 */
router.post('/efatura/optimize', (req, res) => {
  try {
    const {
      categories = {},
      pprInvested = 0,
      age = 30,
      isMarried = false
    } = req.body || {};

    const result = optimizeEFaturaDeductions({
      categories,
      pprInvested: Number(pprInvested),
      age: Number(age),
      isMarried: Boolean(isMarried)
    });

    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * VIES & VAT cross-border compliance check
 */
router.post('/vies/check', (req, res) => {
  try {
    const {
      clientType = 'PT',
      invoiceAmount = 1000,
      hasValidVIES = true,
      isArt53Exempt = false
    } = req.body || {};

    const result = determineVIESAndVATCompliance({
      clientType,
      invoiceAmount: Number(invoiceAmount),
      hasValidVIES: Boolean(hasValidVIES),
      isArt53Exempt: Boolean(isArt53Exempt)
    });

    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * 360º Tax & Social Security Health Audit
 */
router.post('/audit', (req, res) => {
  try {
    const snapshot = req.body || {};
    const result = runCompleteTaxAudit(snapshot);
    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});
