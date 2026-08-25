/**
 * Corporate Income Tax (IRC - Imposto sobre o Rendimento das Pessoas Coletivas)
 * Module to estimate IRC liability, Derrama, and Tributações Autónomas.
 */

export function calculateIRC({
  salesRevenue = 0,
  servicesRevenue = 0,
  otherIncome = 0,
  cogs = 0, // Cost of Goods Sold
  personnelCosts = 0,
  externalServices = 0,
  depreciations = 0,
  financialExpenses = 0,
  autonomousTaxableExpenses = [],
  isSME = true, // PME - Pequena e Média Empresa
  derramaRate = 0.015, // Municipal rate (0% to 1.5%)
  paymentsOnAccount = 0 // Pagamentos por Conta já efetuados
}) {
  const totalIncome = salesRevenue + servicesRevenue + otherIncome;
  const totalExpenses = cogs + personnelCosts + externalServices + depreciations + financialExpenses;

  // Accounting Profit (Resultado Antes de Impostos - RAI)
  const accountingProfit = totalIncome - totalExpenses;

  // Simplification: We assume no complex fiscal adjustments (added/subtracted).
  // Taxable Profit (Lucro Tributável) = RAI in this simple model.
  const taxableProfit = Math.max(0, accountingProfit);

  let baseIRC = 0;
  if (isSME) {
    // SME reduced rate for first 50,000€ (was 25,000€ in past years, typically 17% in mainland PT)
    const SME_BRACKET = 50000;
    const SME_RATE = 0.17;
    const STANDARD_RATE = 0.21;
    
    if (taxableProfit <= SME_BRACKET) {
      baseIRC = taxableProfit * SME_RATE;
    } else {
      baseIRC = (SME_BRACKET * SME_RATE) + ((taxableProfit - SME_BRACKET) * STANDARD_RATE);
    }
  } else {
    baseIRC = taxableProfit * 0.21; // Standard rate 21%
  }

  // Municipal Surtax (Derrama Municipal)
  const derrama = taxableProfit * derramaRate;

  // Autonomous Taxation (Tributações Autónomas - TA)
  // Example expenses: passenger vehicles (varies by cost and EV status), representation expenses (10%), per diems (5%).
  let tributacoesAutonomas = 0;
  for (const exp of autonomousTaxableExpenses) {
    tributacoesAutonomas += (exp.amount * exp.rate);
  }
  
  // If the company has a tax loss, Tributações Autónomas have a penalty (+10% in some cases, ignored here for simplicity).

  const totalIRC = baseIRC + derrama + tributacoesAutonomas;
  const netIRCBalance = totalIRC - paymentsOnAccount;

  return {
    accountingProfit: Math.round(accountingProfit * 100) / 100,
    taxableProfit: Math.round(taxableProfit * 100) / 100,
    taxBreakdown: {
      baseIRC: Math.round(baseIRC * 100) / 100,
      derrama: Math.round(derrama * 100) / 100,
      tributacoesAutonomas: Math.round(tributacoesAutonomas * 100) / 100
    },
    totalIRC: Math.round(totalIRC * 100) / 100,
    paymentsOnAccount: Math.round(paymentsOnAccount * 100) / 100,
    netTaxToPay: Math.round(netIRCBalance * 100) / 100
  };
}
