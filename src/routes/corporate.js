import express from 'express';
import { calculateMonthlyPayroll } from '../engines/corporate-payroll.js';
import { generateAT_DMR, generateModelo10 } from '../engines/corporate-irs-retention.js';
import { calculateIRC } from '../engines/irc-engine.js';
import { generateSAFT } from '../engines/saft-generator.js';
import { generateIES } from '../engines/ies-engine.js';
import { CorporateLedger } from '../engines/corporate-ledger.js';

const router = express.Router();

/**
 * @route POST /api/v1/corporate/payroll/simulate
 * @desc Simulate monthly payroll for Sócio-Gerente or employees
 */
router.post('/payroll/simulate', (req, res) => {
  try {
    const params = req.body;
    // Default values if not provided
    const result = calculateMonthlyPayroll({
      baseSalary: params.baseSalary || 870,
      mealAllowanceDays: params.mealAllowanceDays || 22,
      mealAllowancePerDay: params.mealAllowancePerDay || 0,
      mealAllowanceInCard: params.mealAllowanceInCard || false,
      isManager: params.isManager !== undefined ? params.isManager : true,
      irsRetentionRate: params.irsRetentionRate || 0.0
    });
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/v1/corporate/tax/irc
 * @desc Calculate Corporate Income Tax (IRC) and related taxes
 */
router.post('/tax/irc', (req, res) => {
  try {
    const params = req.body;
    const result = calculateIRC({
      salesRevenue: params.salesRevenue || 0,
      servicesRevenue: params.servicesRevenue || 0,
      otherIncome: params.otherIncome || 0,
      cogs: params.cogs || 0,
      personnelCosts: params.personnelCosts || 0,
      externalServices: params.externalServices || 0,
      depreciations: params.depreciations || 0,
      financialExpenses: params.financialExpenses || 0,
      autonomousTaxableExpenses: params.autonomousTaxableExpenses || [],
      isSME: params.isSME !== undefined ? params.isSME : true,
      derramaRate: params.derramaRate || 0.015,
      paymentsOnAccount: params.paymentsOnAccount || 0
    });
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/v1/corporate/tax/retentions
 * @desc Generate DMR-AT and Modelo 10 data
 */
router.post('/tax/retentions', (req, res) => {
  try {
    const { companyNIPC, year, month, employees } = req.body;
    const dmr = generateAT_DMR({
      companyNIPC: companyNIPC || '517551624',
      year: year || new Date().getFullYear(),
      month: month || new Date().getMonth() + 1,
      employees: employees || []
    });
    res.json({ status: 'success', data: { dmr } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/v1/corporate/ledger/saft
 * @desc Generate SAFT-PT XML file
 */
router.post('/ledger/saft', (req, res) => {
  try {
    const params = req.body;
    const result = generateSAFT({
      companyName: params.companyName,
      companyNIPC: params.companyNIPC,
      year: params.year,
      month: params.month,
      invoices: params.invoices || [],
      ledgerTransactions: params.ledgerTransactions || [],
      saftType: params.saftType || 'F'
    });
    
    // Set headers for XML download if requested, otherwise return JSON with XML string
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename=SAFT_${params.saftType || 'F'}_${params.year}.xml`);
      res.send(result.xml);
    } else {
      res.json({ status: 'success', xml: result.xml, json: result.json });
    }
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/v1/corporate/tax/ies
 * @desc Generate IES summary data
 */
router.post('/tax/ies', (req, res) => {
  try {
    const params = req.body;
    const result = generateIES({
      companyNIPC: params.companyNIPC || '517551624',
      year: params.year || new Date().getFullYear(),
      accountingData: params.accountingData || { totalAssets: 0, totalLiabilities: 0, equity: 0, totalIncome: 0, totalOperatingExpenses: 0, netIncome: 0 },
      taxData: params.taxData || { taxableProfit: 0, totalIRC: 0 },
      socialSecurityData: params.socialSecurityData || { headcount: 0, totalPayrollCosts: 0 }
    });
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

export default router;
