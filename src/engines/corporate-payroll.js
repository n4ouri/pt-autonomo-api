import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Calculate the monthly payroll for an employee or a Managing Partner (Sócio-Gerente).
 *
 * @param {object} params
 * @param {number} params.baseSalary - The gross base salary (vencimento base).
 * @param {number} params.mealAllowanceDays - Number of days the meal allowance is paid.
 * @param {number} params.mealAllowancePerDay - Meal allowance value per day.
 * @param {boolean} params.mealAllowanceInCard - True if meal allowance is paid via meal card (higher exemption limit).
 * @param {boolean} params.isManager - True if the person is a Membro de Órgãos Estatutários (Sócio-Gerente).
 * @param {number} params.irsRetentionRate - The IRS retention rate applicable from the official AT tables (0.0 to 1.0).
 * @returns {object} Payroll calculation breakdown including TSU, IRS, net pay, and company cost.
 */
export function calculateMonthlyPayroll({
  baseSalary,
  mealAllowanceDays = 22,
  mealAllowancePerDay = 0,
  mealAllowanceInCard = false,
  isManager = false,
  irsRetentionRate = 0.0
}) {
  // 1. MEAL ALLOWANCE (Subsídio de Refeição)
  // Legal exemption limits for meal allowances (OE2024 / 2025/2026 limits applied)
  const MEAL_ALLOWANCE_LIMIT_CASH = 6.00;
  const MEAL_ALLOWANCE_LIMIT_CARD = 9.60;

  const exemptionLimit = mealAllowanceInCard ? MEAL_ALLOWANCE_LIMIT_CARD : MEAL_ALLOWANCE_LIMIT_CASH;
  const taxableMealAllowancePerDay = Math.max(0, mealAllowancePerDay - exemptionLimit);
  const totalMealAllowance = mealAllowanceDays * mealAllowancePerDay;
  const taxableMealAllowanceTotal = mealAllowanceDays * taxableMealAllowancePerDay;

  // 2. GROSS & TAXABLE BASE
  const totalGrossIncome = baseSalary + totalMealAllowance;
  const taxableIncomeSS = baseSalary + taxableMealAllowanceTotal; // SS base
  const taxableIncomeIRS = baseSalary + taxableMealAllowanceTotal; // IRS base

  // 3. SOCIAL SECURITY (TSU)
  let employeeSSRate = LEGAL_CONSTANTS.TAXAS_SEGURANCA_SOCIAL.TSU_TRABALHADOR_CONTA_OUTREM; // 11%
  let employerSSRate = LEGAL_CONSTANTS.TAXAS_SEGURANCA_SOCIAL.TSU_EMPREGADOR; // 23.75%

  if (isManager) {
    // Sócio-Gerente (MOE) standard rates
    employeeSSRate = 0.11;
    employerSSRate = 0.2375;
  }

  const employeeSS = taxableIncomeSS * employeeSSRate;
  const employerSS = taxableIncomeSS * employerSSRate;
  const totalSS = employeeSS + employerSS; // Declaração de Remunerações (DMR) total SS

  // 4. IRS RETENTION
  // Real world applications use complex tables for this. We use the provided effective rate to estimate the retention.
  const irsRetention = taxableIncomeIRS * irsRetentionRate;

  // 5. NET PAY
  const netPay = totalGrossIncome - employeeSS - irsRetention;

  // 6. TOTAL COST TO COMPANY
  const totalCompanyCost = totalGrossIncome + employerSS;

  return {
    breakdown: {
      baseSalary: Math.round(baseSalary * 100) / 100,
      mealAllowance: Math.round(totalMealAllowance * 100) / 100,
      taxableMealAllowance: Math.round(taxableMealAllowanceTotal * 100) / 100,
      grossIncome: Math.round(totalGrossIncome * 100) / 100,
      taxableIncomeSS: Math.round(taxableIncomeSS * 100) / 100,
      taxableIncomeIRS: Math.round(taxableIncomeIRS * 100) / 100
    },
    deductions: {
      employeeSS: Math.round(employeeSS * 100) / 100,
      employerSS: Math.round(employerSS * 100) / 100,
      totalSS: Math.round(totalSS * 100) / 100,
      irsRetention: Math.round(irsRetention * 100) / 100
    },
    netPay: Math.round(netPay * 100) / 100,
    totalCompanyCost: Math.round(totalCompanyCost * 100) / 100
  };
}
