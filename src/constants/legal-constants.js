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
  IAS_2026: 509.26,
  IAS_2025: 509.26,
  SALARIO_MINIMO_2026: 870.00,
  SALARIO_MINIMO_2025: 870.00,

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

  // Escalões do IRS 2025/2026 (Art. 68.º CIRS)
  ESCALOES_IRS: [
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

  // Retenções na Fonte de IRS (Art. 101.º CIRS)
  TAXAS_RETENCAO_FONTE: {
    SERVICOS_PROFISSIONAIS_TABELA_151: 0.25,
    OUTROS_SERVICOS: 0.165,
    PROPRIEDADE_INTELECTUAL: 0.165,
    COMISSOES_E_OUTROS: 0.115,
    DISPENSA_RETENCAO_LIMITE_ANUAL: 15000.00 // Art. 101.º-B n.º 1 al. a)
  },

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
