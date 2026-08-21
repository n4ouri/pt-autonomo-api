import express from 'express';
import { simulateRegimeSimplificado } from '../engines/simplificado.js';
import { simulateSegurancaSocialQuarterly } from '../engines/seg-social.js';
import { compareCompanyVsRecibosVerdes } from '../engines/company-compare.js';
import { optimizeEFaturaDeductions } from '../engines/efatura-optimizer.js';
import { determineVIESAndVATCompliance } from '../engines/vies-compliance.js';
import { simulateNHRTax } from '../engines/nhr-simulator.js';
import { calculateTaxFreeAllowances } from '../engines/tax-free-allowances.js';
import { calculatePagamentosPorConta } from '../engines/ppc-forecast.js';
import { simulateIRSJovem } from '../engines/irs-jovem.js';
import { calculateSegurancaSocialBenefits } from '../engines/ss-benefits.js';
import { calculateIVAPeriodicAssessment } from '../engines/iva-apuramento.js';
import { calculateWithholdingTaxAtSource } from '../engines/retencao-fonte.js';
import { runCompleteTaxAudit } from '../engines/audit-engine.js';
import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';
import { TAX_CALENDAR } from '../constants/tax-calendar.js';
import { withGuidance } from '../lib/guidance.js';
import { num } from '../lib/numbers.js';

export const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
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
      annualGrossServices: num(annualGrossServices),
      annualGrossSales: num(annualGrossSales),
      annualGrossOtherServices: num(annualGrossOtherServices),
      activityYear: num(activityYear, 3),
      annualSSPaid: num(annualSSPaid),
      businessExpenses: num(businessExpenses),
      homeOfficeEligibleExpenses: num(homeOfficeEligibleExpenses),
      withheldTax: num(withheldTax)
    });

    res.json(withGuidance('regime-simplificado', { status: 'success', data: result }));
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
      quarterlyGrossServices: num(quarterlyGrossServices),
      quarterlyGrossSales: num(quarterlyGrossSales),
      isFirstYearExempt: Boolean(isFirstYearExempt),
      hasConcurrentEmployment: Boolean(hasConcurrentEmployment)
    });

    res.json(withGuidance('ss-quarterly', { status: 'success', data: result }));
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
      annualGrossRevenue: num(annualGrossRevenue, 60000),
      annualOperationalExpenses: num(annualOperationalExpenses, 6000),
      monthlyDirectorSalary: num(monthlyDirectorSalary, 1400),
      monthlyAccountingFee: num(monthlyAccountingFee, 150)
    });

    res.json(withGuidance('company-vs-recibos', { status: 'success', data: result }));
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
      pprInvested: num(pprInvested),
      age: num(age, 30),
      isMarried: Boolean(isMarried)
    });

    res.json(withGuidance('efatura', { status: 'success', data: result }));
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
      invoiceAmount: num(invoiceAmount, 1000),
      hasValidVIES: Boolean(hasValidVIES),
      isArt53Exempt: Boolean(isArt53Exempt)
    });

    res.json(withGuidance('vies', { status: 'success', data: result }));
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
    res.json(withGuidance('audit', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * NHR / Residente Não Habitual 20% Flat Rate Simulation
 */
router.post('/simulate/nhr', (req, res) => {
  try {
    const {
      annualGrossServices = 60000,
      annualSSPaid = 0,
      businessExpenses = 0,
      withheldTax = 0,
      isEligibleHighValueActivity = true
    } = req.body || {};

    const result = simulateNHRTax({
      annualGrossServices: num(annualGrossServices, 60000),
      annualSSPaid: num(annualSSPaid),
      businessExpenses: num(businessExpenses),
      withheldTax: num(withheldTax),
      isEligibleHighValueActivity: Boolean(isEligibleHighValueActivity)
    });

    res.json(withGuidance('nhr', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Tax-Free Allowances & Liquidity Extraction (Km, Meal Card, Per Diems)
 */
router.post('/simulate/tax-free-allowances', (req, res) => {
  try {
    const {
      monthlyKmDriven = 800,
      workDaysPerMonth = 22,
      nationalTravelDaysPerYear = 10,
      foreignTravelDaysPerYear = 5,
      isCompanyManagingPartner = true
    } = req.body || {};

    const result = calculateTaxFreeAllowances({
      monthlyKmDriven: num(monthlyKmDriven, 800),
      workDaysPerMonth: num(workDaysPerMonth, 22),
      nationalTravelDaysPerYear: num(nationalTravelDaysPerYear, 10),
      foreignTravelDaysPerYear: num(foreignTravelDaysPerYear, 5),
      isCompanyManagingPartner: Boolean(isCompanyManagingPartner)
    });

    res.json(withGuidance('tax-free-allowances', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Pagamentos por Conta (PPC) Forecast & Suspension Calculator
 */
router.post('/simulate/ppc', (req, res) => {
  try {
    const {
      priorYearNetTax = 10000,
      priorYearWithholding = 0,
      currentYearEstimatedTax = 8000,
      currentYearWithholding = 0
    } = req.body || {};

    const result = calculatePagamentosPorConta({
      priorYearNetTax: num(priorYearNetTax, 10000),
      priorYearWithholding: num(priorYearWithholding),
      currentYearEstimatedTax: num(currentYearEstimatedTax, 8000),
      currentYearWithholding: num(currentYearWithholding)
    });

    res.json(withGuidance('ppc', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * IRS Jovem (Artigo 12.º-B do CIRS) Simulation
 */
router.post('/simulate/irs-jovem', (req, res) => {
  try {
    const {
      annualTaxableIncome = 30000,
      age = 27,
      yearOfBenefit = 1,
      educationLevel = 6
    } = req.body || {};

    const result = simulateIRSJovem({
      annualTaxableIncome: num(annualTaxableIncome, 30000),
      age: num(age, 27),
      yearOfBenefit: num(yearOfBenefit, 1),
      educationLevel: num(educationLevel, 6)
    });

    res.json(withGuidance('irs-jovem', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Segurança Social Social Protection & Benefits (Parentalidade, Baixa Médica, Desemprego TI)
 */
router.post('/simulate/ss-benefits', (req, res) => {
  try {
    const {
      monthlyContributionBase = 3000,
      registeredMonthsInLastYear = 12,
      economicDependencePercentage = 0,
      hasDebtToSS = false
    } = req.body || {};

    const result = calculateSegurancaSocialBenefits({
      monthlyContributionBase: num(monthlyContributionBase, 3000),
      registeredMonthsInLastYear: num(registeredMonthsInLastYear, 12),
      economicDependencePercentage: num(economicDependencePercentage),
      hasDebtToSS: Boolean(hasDebtToSS)
    });

    res.json(withGuidance('ss-benefits', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Declaração Periódica de IVA & Apuramento Trimestral (Quadro 06 CIVA)
 */
router.post('/simulate/iva-periodic', (req, res) => {
  try {
    const {
      grossInvoicedNormalRate = 0,
      grossInvoicedIntermediateRate = 0,
      grossInvoicedReducedRate = 0,
      grossInvoicedIntraEU = 0,
      grossInvoicedExportNonEU = 0,
      deductibleVATEquipment = 0,
      deductibleVATGeneralExpenses = 0,
      priorPeriodVATCredit = 0
    } = req.body || {};

    const result = calculateIVAPeriodicAssessment({
      grossInvoicedNormalRate: num(grossInvoicedNormalRate),
      grossInvoicedIntermediateRate: num(grossInvoicedIntermediateRate),
      grossInvoicedReducedRate: num(grossInvoicedReducedRate),
      grossInvoicedIntraEU: num(grossInvoicedIntraEU),
      grossInvoicedExportNonEU: num(grossInvoicedExportNonEU),
      deductibleVATEquipment: num(deductibleVATEquipment),
      deductibleVATGeneralExpenses: num(deductibleVATGeneralExpenses),
      priorPeriodVATCredit: num(priorPeriodVATCredit)
    });

    res.json(withGuidance('iva-periodic', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/**
 * Retenção na Fonte de IRS Categoria B (Artigos 101.º e 101.º-B CIRS)
 */
router.post('/simulate/withholding-tax', (req, res) => {
  try {
    const {
      invoiceAmount = 1000,
      serviceType = 'TABELA_151',
      isClientForeignEntity = false,
      isClientParticularB2C = false,
      optForArt101BExemption = false
    } = req.body || {};

    const result = calculateWithholdingTaxAtSource({
      invoiceAmount: num(invoiceAmount, 1000),
      serviceType,
      isClientForeignEntity: Boolean(isClientForeignEntity),
      isClientParticularB2C: Boolean(isClientParticularB2C),
      optForArt101BExemption: Boolean(optForArt101BExemption)
    });

    res.json(withGuidance('withholding-tax', { status: 'success', data: result }));
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});
