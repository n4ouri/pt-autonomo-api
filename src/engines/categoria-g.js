import { LEGAL_CONSTANTS } from '../constants/legal-constants.js';

/**
 * Categoria G — Mais-Valias de Valores Mobiliários e Criptoativos (Artigos 10.º e 72.º do CIRS)
 *
 * Securities (shares, ETFs, bonds, etc.): the net balance of capital gains minus capital losses
 * in the fiscal year is taxed autonomously at 28%, with an option to englobar (Art. 72.º n.º 1
 * al. c) CIRS).
 *
 * Crypto-assets: gains on digital assets held for less than 365 days are taxed at 28%; gains on
 * assets held for 365 days or more are exempt from IRS but must still be reported (Anexo G1) —
 * Art. 10.º, n.os 1 al. b) subalínea 5) e 19-21 do CIRS, framework introduced by the OE 2023 and
 * unchanged for 2026. Crypto-to-crypto swaps and NFTs representing unique non-fungible assets
 * are excluded from this framework and follow separate rules (out of scope here).
 *
 * Real-estate capital gains (imóveis) are NOT covered — they follow a materially different
 * regime (50% inclusion, reinvestment exclusions for own permanent housing) and are intentionally
 * left out to avoid presenting an oversimplified figure on the single highest-stakes case.
 *
 * @param {object} params
 * @param {number} [params.securitiesGains=0] - Gross capital gains from securities in the fiscal year
 * @param {number} [params.securitiesLosses=0] - Gross capital losses from securities in the fiscal year (same category, offsettable)
 * @param {number} [params.cryptoGainsShortTerm=0] - Crypto-asset gains from positions held < 365 days
 * @param {number} [params.cryptoGainsLongTerm=0] - Crypto-asset gains from positions held >= 365 days (exempt, informational only)
 * @param {number} [params.cryptoLossesShortTerm=0] - Crypto-asset losses from positions held < 365 days (offsettable against short-term gains)
 * @returns {object} Taxable balance per asset class, autonomous tax due, and exempt long-term crypto gains
 */
export function calculateMaisValiasCategoriaG({
  securitiesGains = 0,
  securitiesLosses = 0,
  cryptoGainsShortTerm = 0,
  cryptoGainsLongTerm = 0,
  cryptoLossesShortTerm = 0
}) {
  const autonomousRate = LEGAL_CONSTANTS.IRS_MAIS_VALIAS_TAXA_AUTONOMA ?? 0.28;

  const securitiesNetBalance = securitiesGains - securitiesLosses;
  const securitiesTaxableBalance = Math.max(0, securitiesNetBalance);
  const securitiesTax = securitiesTaxableBalance * autonomousRate;

  const cryptoNetShortTerm = cryptoGainsShortTerm - cryptoLossesShortTerm;
  const cryptoTaxableShortTerm = Math.max(0, cryptoNetShortTerm);
  const cryptoTax = cryptoTaxableShortTerm * autonomousRate;

  const totalAutonomousTax = securitiesTax + cryptoTax;

  return {
    securities: {
      gains: securitiesGains,
      losses: securitiesLosses,
      netBalance: Math.round(securitiesNetBalance * 100) / 100,
      taxableBalance: Math.round(securitiesTaxableBalance * 100) / 100,
      estimatedTaxEUR: Math.round(securitiesTax * 100) / 100,
      lossCarryforwardNote: securitiesNetBalance < 0
        ? 'Saldo negativo pode ser reportado para os 5 anos seguintes se optar pelo englobamento nesse ano (Artigo 55.º, n.º 1, al. d) do CIRS).'
        : null,
      legalReference: 'Artigo 10.º, n.º 1, al. b) e Artigo 72.º, n.º 1, al. c) do CIRS'
    },
    cryptoAssets: {
      shortTerm: {
        holdingPeriod: '< 365 dias',
        gains: cryptoGainsShortTerm,
        losses: cryptoLossesShortTerm,
        taxableBalance: Math.round(cryptoTaxableShortTerm * 100) / 100,
        estimatedTaxEUR: Math.round(cryptoTax * 100) / 100
      },
      longTerm: {
        holdingPeriod: '>= 365 dias',
        gains: cryptoGainsLongTerm,
        estimatedTaxEUR: 0,
        isExempt: true,
        note: 'Isento de IRS, mas de declaração obrigatória no Anexo G1.'
      },
      legalReference: 'Artigo 10.º, n.os 1, al. b), subalínea 5), e 19 a 21 do CIRS'
    },
    appliedAutonomousRatePercent: Math.round(autonomousRate * 100 * 100) / 100,
    totalAutonomousTaxEUR: Math.round(totalAutonomousTax * 100) / 100,
    englobamentoOption: {
      available: true,
      note: 'Pode optar pelo englobamento de todas as mais-valias sujeitas (não isentas) se a sua taxa marginal de IRS for inferior a 28% — a opção é obrigatoriamente para a totalidade dos rendimentos desta natureza.',
      legalReference: 'Artigo 72.º, n.º 8 do CIRS'
    },
    outOfScope: 'Mais-valias imobiliárias (venda de imóveis) não são calculadas por este motor — seguem um regime distinto (inclusão de 50% do saldo, exclusão por reinvestimento em habitação própria e permanente).'
  };
}
