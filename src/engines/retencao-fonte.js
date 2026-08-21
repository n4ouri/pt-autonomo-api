import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Category B IRS Withholding (Retenção na Fonte) Engine (Artigos 101.º e 101.º-B do CIRS)
 * 
 * In Portugal, entities with organized accounting that pay professional fees to freelancers
 * are legally required to withhold IRS at source.
 * 
 * Rates:
 * - 23.0%: Specific professional activities (Tabela Art. 151.º CIRS - IT, Doctors, Lawyers, Consultants, Architects).
 *   Reduced from 25% by Lei n.º 2/2025 (OE 2025), maintained in 2026 by Lei n.º 73-A/2025; 25% remains available by option.
 * - 16.5%: Other service provisions (Art. 101.º n.º 1 al. d) & Intellectual Property/Copyrights.
 * - 11.5%: Commercial commissions & acts of commerce (Art. 101.º n.º 1 al. a).
 * - 0.0%: Exemption under Art. 101.º-B (Turnover < 15.000 €/year) OR Invoicing to Foreign Clients without PE in Portugal.
 * - 0.0%: Per-invoice de minimis exemption for amounts <= 25 € (Art. 101.º n.º 10 CIRS, since jul. 2024).
 *
 * @param {object} params
 * @param {number} params.invoiceAmount - Gross invoice value before withholding
 * @param {('TABELA_151'|'OUTROS_SERVICOS'|'DIREITOS_AUTOR'|'COMISSOES')} [params.serviceType='TABELA_151']
 * @param {boolean} [params.isClientForeignEntity=false] - Invoicing a client outside Portugal (No withholding possible)
 * @param {boolean} [params.isClientParticularB2C=false] - Invoicing an individual consumer without organized accounting
 * @param {boolean} [params.optForArt101BExemption=false] - Under 15.000€ annual turnover exemption
 * @returns {object} Applicable withholding rate, net amount received, and May IRS balance impact
 */
export function calculateWithholdingTaxAtSource({
  invoiceAmount = 1000,
  serviceType = 'TABELA_151',
  isClientForeignEntity = false,
  isClientParticularB2C = false,
  optForArt101BExemption = false
}) {
  if (invoiceAmount <= 0) {
    throw new Error('Invoice amount must be greater than 0.');
  }

  let rate = 0;
  let reason = '';
  let mandatoryInvoiceClause = '';

  if (isClientForeignEntity) {
    rate = 0;
    reason = 'Sem retenção na fonte por a entidade adquirente não possuir sede nem estabelecimento estável em Portugal.';
    mandatoryInvoiceClause = 'Sem retenção na fonte - Não residente sem estabelecimento estável';
  } else if (isClientParticularB2C) {
    rate = 0;
    reason = 'Sem retenção na fonte: o cliente é um particular (sem contabilidade organizada).';
    mandatoryInvoiceClause = 'Sem retenção na fonte - Particular / Não sujeito a retenção';
  } else if (invoiceAmount <= LEGAL_CONSTANTS.TAXAS_RETENCAO_FONTE.DISPENSA_RETENCAO_POR_RECIBO) {
    rate = 0;
    reason = 'Dispensa de retenção na fonte por o valor do recibo não exceder 25 € (Artigo 101.º, n.º 10 do CIRS).';
    mandatoryInvoiceClause = 'Sem retenção - Artigo 101.º, n.º 10 do CIRS';
  } else if (optForArt101BExemption) {
    rate = 0;
    reason = 'Dispensa de retenção na fonte por volume de negócios inferior ao limite legal de 15.000 € (Artigo 101.º-B, n.º 1, alínea a) do CIRS).';
    mandatoryInvoiceClause = 'Sem retenção - Artigo 101.º-B, n.º 1, al. a) do CIRS';
  } else {
    switch (serviceType) {
      case 'TABELA_151':
        rate = LEGAL_CONSTANTS.TAXAS_RETENCAO_FONTE.SERVICOS_PROFISSIONAIS_TABELA_151; // 23%
        reason = 'Taxa geral de 23% para atividades profissionais da Tabela do Artigo 151.º do CIRS (25% disponível por opção do sujeito passivo).';
        mandatoryInvoiceClause = 'Retenção na fonte de IRS à taxa de 23% (Art. 101.º n.º 1 al. b) CIRS)';
        break;
      case 'OUTROS_SERVICOS':
      case 'DIREITOS_AUTOR':
        rate = LEGAL_CONSTANTS.TAXAS_RETENCAO_FONTE.OUTROS_SERVICOS; // 16.5%
        reason = 'Taxa reduzida de 16.5% para outras prestações de serviços e direitos de autor (Artigo 101.º n.º 1 alínea d) do CIRS).';
        mandatoryInvoiceClause = 'Retenção na fonte de IRS à taxa de 16.5% (Art. 101.º n.º 1 al. d) CIRS)';
        break;
      case 'COMISSOES':
        rate = LEGAL_CONSTANTS.TAXAS_RETENCAO_FONTE.COMISSOES_E_OUTROS; // 11.5%
        reason = 'Taxa de 11.5% para atos isolados e comissões de intermediação.';
        mandatoryInvoiceClause = 'Retenção na fonte de IRS à taxa de 11.5% (Art. 101.º n.º 1 al. a) CIRS)';
        break;
      default:
        rate = LEGAL_CONSTANTS.TAXAS_RETENCAO_FONTE.SERVICOS_PROFISSIONAIS_TABELA_151;
        mandatoryInvoiceClause = 'Retenção na fonte de IRS à taxa de 23%';
    }
  }

  const withheldTaxAmount = invoiceAmount * rate;
  const netReceivedByAutonomo = invoiceAmount - withheldTaxAmount;

  return {
    invoiceFinancials: {
      grossAmountEUR: invoiceAmount,
      withholdingRatePercent: rate * 100,
      withheldTaxAmountEUR: Math.round(withheldTaxAmount * 100) / 100,
      netCashReceivedEUR: Math.round(netReceivedByAutonomo * 100) / 100
    },
    legalFramework: {
      mandatoryInvoiceClause,
      reason,
      statutoryArticle: 'Artigo 101.º e 101.º-B do CIRS'
    },
    cashflowAndSettlementAnalysis: {
      isExemptFromWithholding: rate === 0,
      irsSettlementWarning: rate === 0 ? {
        warning: 'Ao faturar com 0% de retenção na fonte, o imposto total de IRS será cobrado integralmente na liquidação de Maio/Junho do ano seguinte.',
        recommendation: 'Reserve entre 20% e 30% do valor de cada fatura numa conta poupança dedicada para evitar surpresas no acerto do IRS.'
      } : null
    }
  };
}
