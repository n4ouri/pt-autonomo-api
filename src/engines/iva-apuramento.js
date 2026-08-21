import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Declaração Periódica de IVA & Apuramento Trimestral (Quadro 06 do CIVA)
 * 
 * Computes output VAT collected (IVA Liquidado), deductible input VAT (IVA Dedutível),
 * net balance due to the Tax Authority (AT) or VAT credit carried forward.
 * 
 * @param {object} params
 * @param {number} [params.grossInvoicedNormalRate=0] - Sales/Services invoiced at standard 23% rate (Base Tributável)
 * @param {number} [params.grossInvoicedIntermediateRate=0] - Sales/Services at 13%
 * @param {number} [params.grossInvoicedReducedRate=0] - Sales/Services at 6%
 * @param {number} [params.grossInvoicedIntraEU=0] - Services invoiced to EU B2B (Art. 6.º n.º 6 al. a CIVA / Reverse Charge)
 * @param {number} [params.grossInvoicedExportNonEU=0] - Export services to Non-EU (Art. 6.º n.º 6 al. a CIVA)
 * @param {number} [params.deductibleVATEquipment=0] - Input VAT on hardware/computers/tools (Campo 20 / 22)
 * @param {number} [params.deductibleVATGeneralExpenses=0] - Input VAT on internet, software, office supplies (Campo 24)
 * @param {number} [params.priorPeriodVATCredit=0] - Excess VAT credit from previous quarter (Campo 61)
 * @returns {object} Full Quadro 06 field mapping, net payable / recoverable balance, and payment deadlines
 */
export function calculateIVAPeriodicAssessment({
  grossInvoicedNormalRate = 0,
  grossInvoicedIntermediateRate = 0,
  grossInvoicedReducedRate = 0,
  grossInvoicedIntraEU = 0,
  grossInvoicedExportNonEU = 0,
  deductibleVATEquipment = 0,
  deductibleVATGeneralExpenses = 0,
  priorPeriodVATCredit = 0
}) {
  // 1. IVA Liquidado (Output VAT)
  const ivaLiquidadoNormal = grossInvoicedNormalRate * LEGAL_CONSTANTS.IVA.TAXA_NORMAL; // 23%
  const ivaLiquidadoIntermediate = grossInvoicedIntermediateRate * LEGAL_CONSTANTS.IVA.TAXA_INTERMEDIA; // 13%
  const ivaLiquidadoReduced = grossInvoicedReducedRate * LEGAL_CONSTANTS.IVA.TAXA_REDUZIDA; // 6%

  const totalIVALiquidado = ivaLiquidadoNormal + ivaLiquidadoIntermediate + ivaLiquidadoReduced;

  // 2. IVA Dedutível (Input VAT)
  const totalIVADedutivel = deductibleVATEquipment + deductibleVATGeneralExpenses + priorPeriodVATCredit;

  // 3. Apuramento (Net Balance)
  const netVATBalance = totalIVALiquidado - totalIVADedutivel;
  const isPaymentDue = netVATBalance > 0;
  const isCreditCarriedForward = netVATBalance < 0;

  const totalInvoicedTurnover = grossInvoicedNormalRate + grossInvoicedIntermediateRate + grossInvoicedReducedRate +
                                grossInvoicedIntraEU + grossInvoicedExportNonEU;

  return {
    turnoverSummary: {
      domesticTaxableNormalEUR: grossInvoicedNormalRate,
      domesticTaxableIntermediateEUR: grossInvoicedIntermediateRate,
      domesticTaxableReducedEUR: grossInvoicedReducedRate,
      intraEUB2BReverseChargeEUR: grossInvoicedIntraEU,
      exportNonEUEUR: grossInvoicedExportNonEU,
      totalInvoicedTurnoverEUR: Math.round(totalInvoicedTurnover * 100) / 100
    },
    quadro06Mapping: {
      campo01_BaseTributavel23: grossInvoicedNormalRate,
      campo02_IVALiquidado23: Math.round(ivaLiquidadoNormal * 100) / 100,
      campo03_BaseTributavel13: grossInvoicedIntermediateRate,
      campo04_IVALiquidado13: Math.round(ivaLiquidadoIntermediate * 100) / 100,
      campo05_BaseTributavel06: grossInvoicedReducedRate,
      campo06_IVALiquidado06: Math.round(ivaLiquidadoReduced * 100) / 100,
      campo08_OperacoesIsentasComDeducao_VIES: grossInvoicedIntraEU + grossInvoicedExportNonEU,
      campo20_IVADedutivelImobilizado: deductibleVATEquipment,
      campo24_IVADedutivelOutrosBensEServicos: deductibleVATGeneralExpenses,
      campo61_ExcessoReportarPeriodoAnterior: priorPeriodVATCredit
    },
    assessmentResult: {
      totalIVALiquidadoEUR: Math.round(totalIVALiquidado * 100) / 100,
      totalIVADedutivelEUR: Math.round(totalIVADedutivel * 100) / 100,
      netVATBalanceEUR: Math.round(Math.abs(netVATBalance) * 100) / 100,
      status: isPaymentDue ? 'IVA_A_PAGAR' : isCreditCarriedForward ? 'CREDITO_IVA_A_REPORTAR' : 'NULO',
      paymentInstructions: isPaymentDue ? {
        submissionDeadline: 'Até ao dia 20 do segundo mês seguinte ao trimestre.',
        paymentDeadline: 'Até ao dia 25 do segundo mês seguinte ao trimestre.',
        method: 'Emitir DUC (Documento Único de Cobrança) no Portal das Finanças e pagar via Multibanco / Homebanking.'
      } : {
        creditInstructions: `O montante de ${Math.round(Math.abs(netVATBalance) * 100) / 100} € fica como crédito a reportar (Campo 61) para abater no IVA do trimestre seguinte, ou pode solicitar reembolso se o crédito for superior a 3.000 € (ou 250 € após 12 meses).`
      }
    }
  };
}
