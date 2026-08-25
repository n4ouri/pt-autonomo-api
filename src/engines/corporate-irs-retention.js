/**
 * Generator for Corporate IRS Retentions (AT DMR & Modelo 10)
 * 
 * AT DMR (Declaração Mensal de Remunerações) is submitted monthly to Finanças by the 10th
 * of the following month, detailing salaries and IRS withheld.
 * Modelo 10 is an annual declaration of incomes and retentions not reported in DMR.
 */

export function generateAT_DMR({ companyNIPC, year, month, employees }) {
  // Simplistic generation of DMR structure
  const declaration = {
    header: {
      type: 'DMR-AT',
      companyNIPC,
      year,
      month,
      submissionDate: new Date().toISOString()
    },
    incomes: employees.map(emp => {
      const code = emp.isManager ? 'A - Categoria A (Trabalho Dependente)' : 'A';
      return {
        nif: emp.nif,
        incomeCode: code,
        grossIncome: emp.payroll.breakdown.taxableIncomeIRS, // AT only wants taxable income here or specific breakdowns
        irsWithheld: emp.payroll.deductions.irsRetention,
        ssWithheld: emp.payroll.deductions.employeeSS, // mandatory social security contributions
        sindicato: 0
      };
    })
  };

  // Summarize totals for payment (Guia de Pagamento)
  let totalIRSWithheld = 0;
  for (const inc of declaration.incomes) {
    totalIRSWithheld += inc.irsWithheld;
  }

  declaration.summary = {
    totalIRSWithheld: Math.round(totalIRSWithheld * 100) / 100,
    paymentDeadline: `${year}-${String(month + 1).padStart(2, '0')}-20` // generally by the 20th of the following month
  };

  return declaration;
}

export function generateModelo10({ companyNIPC, year, incomes }) {
  // Simplistic Model 10 (annual) for independent workers or rents paid by the company
  const declaration = {
    header: {
      type: 'Modelo 10',
      companyNIPC,
      year,
      submissionDate: new Date().toISOString()
    },
    incomes: incomes.map(inc => ({
      nif: inc.nif,
      incomeCode: inc.code, // e.g. B - Rendimentos Empresariais/Profissionais
      grossIncome: inc.grossAmount,
      irsWithheld: inc.irsWithheld
    }))
  };

  return declaration;
}
