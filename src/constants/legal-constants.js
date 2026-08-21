/**
 * Portuguese Tax & Social Security Legal Constants (2025/2026 Fiscal Year)
 * 
 * Statutory References:
 * - CIRS (Código do Imposto sobre o Rendimento das Pessoas Singulares)
 * - CRCSPSS (Código dos Regimes Contributivos do Sistema Previdencial de Segurança Social)
 * - CIVA (Código do Imposto sobre o Valor Acrescentado)
 * - CIRC (Código do Imposto sobre o Rendimento das Pessoas Coletivas)
 * - EBF (Estatuto dos Benefícios Fiscais)
 */

export const LEGAL_CONSTANTS = {
  // Indexante dos Apoios Sociais & Salário Mínimo
  // IAS 2026 = 537.13 € (Portaria n.º 480-A/2025/1, de 30 de dezembro)
  // IAS 2025 = 522.50 € (Portaria n.º 8-A/2025, de 10 de janeiro)
  IAS_2026: 537.13,
  IAS_2025: 522.50,
  // RMMG 2026 = 920.00 € (Decreto-Lei n.º 139/2025, de 29 de dezembro)
  // RMMG 2025 = 870.00 € (Decreto-Lei n.º 112/2024, de 30 de dezembro)
  SALARIO_MINIMO_2026: 920.00,
  SALARIO_MINIMO_2025: 870.00,
  // Mínimo de existência (Art. 70.º CIRS) = maior de 12.880 € ou 1,5 x 14 x IAS — Lei n.º 73-A/2025 (OE 2026)
  MINIMO_EXISTENCIA_2026: 12880.00,

  // CIRS - Regime Simplificado (Art. 31.º)
  DEDUCAO_ESPECIFICA_PADRAO: 4104.00, // CIRS Art. 31.º n.º 13 al. a)
  SIMPLIFICADO_CEILING: 200000.00,   // Limite anual para Contabilidade Organizada obrigatória (Art. 28.º)
  SIMPLIFICADO_EXPENSE_RATIO: 0.15,  // 15% de despesas a justificar (Art. 31.º n.º 13)

  // Coeficientes do Regime Simplificado (Art. 31.º n.º 1 CIRS)
  COEFICIENTES_SIMPLIFICADO: {
    SERVICOS_PROFISSIONAIS: 0.75, // Art. 31.º n.º 1 al. b) (TI, Médicos, Engenheiros, Advogados, Consultores - Tabela 151)
    OUTROS_SERVICOS: 0.35,        // Art. 31.º n.º 1 al. c) (Outras prestações de serviços e subsídios)
    VENDAS_MERCADORIAS: 0.15,     // Art. 31.º n.º 1 al. a) (Vendas de mercadorias e produtos)
    ALOJAMENTO_LOCAL_CONTENCAO: 0.50,
    ALOJAMENTO_LOCAL_GERAL: 0.35,
    SUBSIDIOS_EXPLORACAO: 0.10,
    OUTROS_RENDIMENTOS_CAT_B: 0.10
  },

  // Benefício de Início de Atividade (Art. 31.º n.º 10 CIRS)
  DESCONTO_INICIO_ATIVIDADE: {
    ANO_1: 0.50, // 50% de redução no rendimento tributável
    ANO_2: 0.25  // 25% de redução no rendimento tributável
  },

  // Segurança Social (CRCSPSS Art. 139.º - 168.º)
  TAXAS_SEGURANCA_SOCIAL: {
    TRABALHADOR_INDEPENDENTE_SERVICOS: 0.214, // 21.40% Prestadores de serviços
    TRABALHADOR_INDEPENDENTE_PRODUTOS: 0.252, // 25.20% Venda de bens / Produção
    ENTIDADE_CONTRATANTE_80: 0.10,            // 10% se > 80% dependência económica (Art. 140.º)
    ENTIDADE_CONTRATANTE_50_80: 0.07,         // 7% se 50% a 80% dependência económica
    TSU_TRABALHADOR_CONTA_OUTREM: 0.11,       // 11% trabalhador
    TSU_EMPREGADOR: 0.2375,                   // 23.75% entidade patronal
    TSU_ORGAOS_SOCIAIS: 0.3475                // 34.75% MOE / Gerente (11% + 23.75%)
  },

  // Escalões do IRS 2026 (Art. 68.º CIRS, atualizado pela Lei n.º 73-A/2025 — OE 2026, DR 1.ª série, 30 dez. 2025)
  // Limites +3.51% face a 2025; taxas normais do 2.º ao 5.º escalão -0.3 p.p.
  // taxaMedia confirmada junto do Portal das Finanças (info.portaldasfinancas.gov.pt, Art. 68.º CIRS);
  // abatimento recalculado pelo método recursivo oficial: abatimento_i = abatimento_(i-1) + limite_(i-1) x (taxa_i - taxa_(i-1)).
  ESCALOES_IRS_2025: [
    { limite: 7703, taxaNormal: 0.13, taxaMedia: 0.13, abatimento: 0 },
    { limite: 11623, taxaNormal: 0.165, taxaMedia: 0.1418, abatimento: 269.61 },
    { limite: 16472, taxaNormal: 0.22, taxaMedia: 0.1648, abatimento: 908.88 },
    { limite: 21321, taxaNormal: 0.25, taxaMedia: 0.1842, abatimento: 1403.04 },
    { limite: 27146, taxaNormal: 0.32, taxaMedia: 0.2134, abatimento: 2895.51 },
    { limite: 39791, taxaNormal: 0.355, taxaMedia: 0.2585, abatimento: 3845.62 },
    { limite: 51997, taxaNormal: 0.435, taxaMedia: 0.2999, abatimento: 7028.90 },
    { limite: 81199, taxaNormal: 0.45, taxaMedia: 0.3539, abatimento: 7808.86 },
    { limite: Infinity, taxaNormal: 0.48, taxaMedia: 0.48, abatimento: 10244.83 }
  ],
  ESCALOES_IRS: [
    { limite: 8342, taxaNormal: 0.125, taxaMedia: 0.125, abatimento: 0 },
    { limite: 12587, taxaNormal: 0.157, taxaMedia: 0.13579, abatimento: 266.94 },
    { limite: 17838, taxaNormal: 0.212, taxaMedia: 0.15823, abatimento: 959.23 },
    { limite: 23089, taxaNormal: 0.241, taxaMedia: 0.17705, abatimento: 1476.53 },
    { limite: 29397, taxaNormal: 0.311, taxaMedia: 0.20579, abatimento: 3092.76 },
    { limite: 43090, taxaNormal: 0.349, taxaMedia: 0.25130, abatimento: 4209.85 },
    { limite: 46566, taxaNormal: 0.431, taxaMedia: 0.26472, abatimento: 7743.23 },
    { limite: 86634, taxaNormal: 0.446, taxaMedia: 0.34856, abatimento: 8441.72 },
    { limite: Infinity, taxaNormal: 0.48, taxaMedia: 0.48, abatimento: 11387.28 }
  ],

  // Retenções na Fonte de IRS (Art. 101.º CIRS)
  TAXAS_RETENCAO_FONTE: {
    // Taxa geral reduzida de 25% para 23% pela Lei n.º 2/2025 (OE 2025), mantida em 2026 pela Lei n.º 73-A/2025.
    // A taxa de 25% permanece disponível por opção do sujeito passivo.
    SERVICOS_PROFISSIONAIS_TABELA_151: 0.23,
    SERVICOS_PROFISSIONAIS_TABELA_151_OPCIONAL_25: 0.25,
    OUTROS_SERVICOS: 0.165,
    PROPRIEDADE_INTELECTUAL: 0.165,
    COMISSOES_E_OUTROS: 0.115,
    DISPENSA_RETENCAO_LIMITE_ANUAL: 15000.00, // Art. 101.º-B n.º 1 al. a)
    DISPENSA_RETENCAO_POR_RECIBO: 25.00 // Dispensa por recibo desde julho de 2024 (Art. 101.º n.º 10 CIRS)
  },

  // Categoria G - Mais-Valias (Art. 72.º CIRS)
  IRS_MAIS_VALIAS_TAXA_AUTONOMA: 0.28, // Valores mobiliários e criptoativos detidos < 365 dias (Art. 72.º n.º 1 al. c) CIRS)
  IRS_MAIS_VALIAS_CRIPTO_ISENCAO_DIAS: 365, // Art. 10.º, n.os 19-21 do CIRS (isenção para criptoativos detidos >= 365 dias)

  // CIVA - Limites e Isenções
  IVA: {
    LIMITE_ISENCAO_ART53: 15000.00, // Limite de faturação anual para isenção
    TAXA_NORMAL: 0.23,
    TAXA_INTERMEDIA: 0.13,
    TAXA_REDUZIDA: 0.06
  },

  // IRC - Sociedades (Art. 87.º CIRC)
  CIRC: {
    TAXA_PME_PRIMEIROS_50K: 0.17, // 17% até 50.000€ de matéria coletável
    TAXA_NORMAL: 0.21,
    TAXA_AUTONOMA_VIATURA_ELETRICA_ATE_62K: 0.00, // 0% tributação autónoma para elétricos até 62.500€
    SUBSIDIO_ALIMENTACAO_ISENTO_CARTAO: 9.60,      // Isento de IRS e TSU em vale/cartão refeição
    SUBSIDIO_ALIMENTACAO_ISENTO_DINHEIRO: 6.00
  },

  // Deduções à Coleta no IRS (Art. 78.º CIRS)
  DEDUCOES_COLETA: {
    despesasGerais: { label: 'Despesas Gerais Familiares', rate: 0.35, maxSingle: 250, maxCouple: 500, legal: 'Art. 78.º-B CIRS' },
    saude: { label: 'Saúde e Seguros de Saúde', rate: 0.15, max: 1000, legal: 'Art. 78.º-C CIRS' },
    educacao: { label: 'Educação e Formação', rate: 0.30, max: 800, maxDisplaced: 1000, legal: 'Art. 78.º-D CIRS' },
    habitacao: { label: 'Habitação (Rendas)', rate: 0.15, maxRent: 600, maxHighIncomeRent: 900, legal: 'Art. 78.º-E CIRS' },
    lares: { label: 'Lares e Apoio Domiciliário', rate: 0.25, max: 403.75, legal: 'Art. 78.º-F CIRS' },
    ivaBeneficio: {
      label: 'Exigência de Fatura (Benefício IVA: Restauração, Reparação Auto/Moto, Cabeleireiros, Passes, Ginásios, Veterinários)',
      rate: 0.15, // 15% do IVA suportado (ou 100% nos passes sociais)
      max: 250,
      legal: 'Art. 78.º-F (IVA) e Lei do OE'
    },
    ppr: {
      label: 'Planos Poupança Reforma (PPR)',
      rate: 0.20,
      maxUnder35: 400,
      max35to50: 350,
      maxOver50: 300,
      legal: 'Art. 21.º EBF'
    }
  }
};
