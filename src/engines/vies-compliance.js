import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Determines VAT treatment, legal invoice annotations, and reporting obligations
 * for Portuguese Autónomos invoicing domestic or international clients.
 * 
 * @param {object} params
 * @param {('PT'|'EU_B2B'|'EU_B2C'|'NON_EU')} params.clientType - Geographic & entity nature of the client
 * @param {number} params.invoiceAmount - Gross invoice value in EUR
 * @param {boolean} [params.hasValidVIES=true] - Whether EU B2B customer has a validated VAT ID in VIES
 * @param {boolean} [params.isArt53Exempt=false] - Whether user operates under Article 53 CIVA exemption (< 15.000€)
 * @returns {object} VAT rate, invoice mention, reporting requirements and legal citations
 */
export function determineVIESAndVATCompliance({
  clientType = 'PT',
  invoiceAmount = 1000,
  hasValidVIES = true,
  isArt53Exempt = false
}) {
  if (invoiceAmount < 0) {
    throw new Error('Invoice amount must be non-negative.');
  }

  let vatRate = 0;
  let vatAmount = 0;
  let invoiceMandatoryMention = '';
  let viesRecapitulativaRequired = false;
  let reportingQuadro = '';
  let legalCitation = '';

  switch (clientType) {
    case 'EU_B2B':
      if (hasValidVIES) {
        vatRate = 0;
        vatAmount = 0;
        invoiceMandatoryMention = 'IVA - Autoliquidação (Artigo 6.º, n.º 6, alínea a) do CIVA) / Reverse Charge - Art. 196 Directive 2006/112/EC';
        viesRecapitulativaRequired = true;
        reportingQuadro = 'Declaração Recapitulativa de IVA (VIES) + Campo 8 Quadro 06 da Declaração Periódica';
        legalCitation = 'Artigo 6.º, n.º 6, al. a) do CIVA & Diretiva 2006/112/CE';
      } else {
        vatRate = LEGAL_CONSTANTS.IVA.TAXA_NORMAL;
        vatAmount = invoiceAmount * vatRate;
        invoiceMandatoryMention = 'IVA - À taxa legal de 23% (Cliente UE sem número VIES válido)';
        viesRecapitulativaRequired = false;
        reportingQuadro = 'Quadro 06 da Declaração Periódica de IVA (Campo 3/4)';
        legalCitation = 'Artigo 1.º e 18.º do CIVA';
      }
      break;

    case 'NON_EU':
      vatRate = 0;
      vatAmount = 0;
      invoiceMandatoryMention = 'IVA - Não sujeito ou isento (Regras de Localização - Artigo 6.º, n.º 6, alínea a) do CIVA)';
      viesRecapitulativaRequired = false;
      reportingQuadro = 'Campo 8 Quadro 06 da Declaração Periódica de IVA (Não requer VIES)';
      legalCitation = 'Artigo 6.º, n.º 6, al. a) do CIVA (Operações fora da UE)';
      break;

    case 'EU_B2C':
      vatRate = LEGAL_CONSTANTS.IVA.TAXA_NORMAL;
      vatAmount = invoiceAmount * vatRate;
      invoiceMandatoryMention = 'IVA - À taxa legal de 23% (Prestação de serviços a consumidor final na UE / OSS)';
      viesRecapitulativaRequired = false;
      reportingQuadro = 'Quadro 06 da Declaração Periódica de IVA / Balcão Único OSS';
      legalCitation = 'Artigo 6.º, n.º 1 e Artigo 18.º do CIVA';
      break;

    case 'PT':
    default:
      if (isArt53Exempt) {
        vatRate = 0;
        vatAmount = 0;
        invoiceMandatoryMention = 'IVA - Regime de isenção [Artigo 53.º do CIVA]';
        viesRecapitulativaRequired = false;
        reportingQuadro = 'Dispensado de entrega de Declaração Periódica de IVA (desde que mantenha isenção)';
        legalCitation = 'Artigo 53.º do CIVA';
      } else {
        vatRate = LEGAL_CONSTANTS.IVA.TAXA_NORMAL;
        vatAmount = invoiceAmount * vatRate;
        invoiceMandatoryMention = 'IVA - À taxa normal de 23%';
        viesRecapitulativaRequired = false;
        reportingQuadro = 'Quadro 06 da Declaração Periódica de IVA';
        legalCitation = 'Artigo 18.º do CIVA';
      }
      break;
  }

  const totalInvoiceValue = invoiceAmount + vatAmount;

  return {
    clientType,
    financials: {
      netAmount: invoiceAmount,
      vatRatePercent: vatRate * 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      totalGrossInvoice: Math.round(totalInvoiceValue * 100) / 100
    },
    compliance: {
      invoiceMandatoryClause: invoiceMandatoryMention,
      viesRecapitulativaMandatory: viesRecapitulativaRequired,
      reportingObligation: reportingQuadro,
      legalFramework: legalCitation
    },
    deadlines: viesRecapitulativaRequired ? {
      viesSubmissionDeadline: 'Até ao dia 20 do mês seguinte (se mensal) ou do trimestre seguinte no Portal das Finanças.',
      nonComplianceFine: 'Coima de 50 € a 3.750 € por omissão de declaração recapitulativa (RGIT).'
    } : null
  };
}
