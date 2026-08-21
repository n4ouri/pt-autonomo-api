/**
 * Official Portuguese Statutory Tax & Social Security Calendar for Autónomos & Companies.
 */

export const TAX_CALENDAR = {
  fiscalYear: 2026,
  recurringObligations: [
    {
      code: 'SS_TRIMESTRAL_Q1',
      name: 'Segurança Social: Declaração Trimestral (1.º Trimestre)',
      period: '1 a 30 de Abril',
      description: 'Declaração dos rendimentos auferidos em Janeiro, Fevereiro e Março. Fixa as mensalidades de Maio, Junho e Julho.',
      target: 'Trabalhadores Independentes com contabilidade não organizada',
      legalReference: 'Artigo 151.º do CRCSPSS'
    },
    {
      code: 'SS_TRIMESTRAL_Q2',
      name: 'Segurança Social: Declaração Trimestral (2.º Trimestre)',
      period: '1 a 31 de Julho',
      description: 'Declaração dos rendimentos auferidos em Abril, Maio e Junho. Fixa as mensalidades de Agosto, Setembro e Outubro.',
      target: 'Trabalhadores Independentes',
      legalReference: 'Artigo 151.º do CRCSPSS'
    },
    {
      code: 'SS_TRIMESTRAL_Q3',
      name: 'Segurança Social: Declaração Trimestral (3.º Trimestre)',
      period: '1 a 31 de Outubro',
      description: 'Declaração dos rendimentos auferidos em Julho, Agosto e Setembro. Fixa as mensalidades de Novembro, Dezembro e Janeiro.',
      target: 'Trabalhadores Independentes',
      legalReference: 'Artigo 151.º do CRCSPSS'
    },
    {
      code: 'SS_TRIMESTRAL_Q4',
      name: 'Segurança Social: Declaração Trimestral (4.º Trimestre)',
      period: '1 a 31 de Janeiro (do ano seguinte)',
      description: 'Declaração dos rendimentos auferidos em Outubro, Novembro e Dezembro. Fixa as mensalidades de Fevereiro, Março e Abril.',
      target: 'Trabalhadores Independentes',
      legalReference: 'Artigo 151.º do CRCSPSS'
    },
    {
      code: 'SS_PAGAMENTO_MENSAL',
      name: 'Pagamento Mensal da Segurança Social',
      period: 'Dia 10 a 20 de cada mês',
      description: 'Pagamento da contribuição mensal devida calculada pela declaração trimestral em vigor.',
      target: 'Todos os Trabalhadores Independentes e MOE',
      legalReference: 'Artigo 164.º do CRCSPSS'
    },
    {
      code: 'IVA_TRIMESTRAL',
      name: 'Declaração Periódica de IVA (Regime Trimestral)',
      period: 'Até ao dia 20 do segundo mês seguinte ao trimestre (Fev, Maio, Ago, Nov)',
      paymentDeadline: 'Até ao dia 25 do mesmo mês',
      description: 'Submissão do IVA liquidado e dedutível do trimestre anterior.',
      target: 'Trabalhadores e empresas no regime normal trimestral de IVA',
      legalReference: 'Artigo 29.º e 41.º do CIVA'
    },
    {
      code: 'IVA_VIES_RECAPITULATIVA',
      name: 'Declaração Recapitulativa de IVA (VIES)',
      period: 'Até ao dia 20 do mês/trimestre seguinte à prestação de serviços intracomunitários',
      description: 'Comunicação obrigatória de faturas emitidas a clientes B2B na UE com isenção por autoliquidação.',
      target: 'Quem fatura para a União Europeia com Art. 6.º n.º 6 al. a) CIVA',
      legalReference: 'Artigo 29.º n.º 1 al. c) do CIVA'
    },
    {
      code: 'IRS_MODELO_3',
      name: 'Entrega da Declaração de Rendimentos (Modelo 3 IRS)',
      period: '1 de Abril a 30 de Junho',
      description: 'Submissão da declaração de IRS (Anexo B para recibos verdes, Anexo A para trabalho dependente, Anexo H para benefícios fiscais).',
      target: 'Todos os contribuintes singulares',
      legalReference: 'Artigo 60.º do CIRS'
    },
    {
      code: 'PPC_JULHO',
      name: '1.º Pagamento por Conta de IRS (PPC)',
      period: 'Até 20 de Julho',
      description: 'Primeira prestação do imposto por conta quando não existiu retenção na fonte suficiente no ano anterior.',
      target: 'Trabalhadores Independentes sem retenção na fonte',
      legalReference: 'Artigo 102.º do CIRS'
    },
    {
      code: 'PPC_SETEMBRO',
      name: '2.º Pagamento por Conta de IRS (PPC)',
      period: 'Até 20 de Setembro',
      description: 'Segunda prestação do imposto por conta.',
      target: 'Trabalhadores Independentes sem retenção na fonte',
      legalReference: 'Artigo 102.º do CIRS'
    },
    {
      code: 'PPC_DEZEMBRO',
      name: '3.º Pagamento por Conta de IRS (PPC)',
      period: 'Até 20 de Dezembro',
      description: 'Terceira prestação do imposto por conta (pode ser suspensa se comprovado que o imposto devido já foi atingido).',
      target: 'Trabalhadores Independentes sem retenção na fonte',
      legalReference: 'Artigo 102.º n.º 7 do CIRS'
    },
    {
      code: 'EFATURA_VALIDACAO',
      name: 'Validação de Faturas no e-Fatura',
      period: 'Até 25 de Fevereiro',
      description: 'Prazo limite para associar e validar faturas com NIF no portal e-Fatura para o IRS do ano transato.',
      target: 'Todos os contribuintes',
      legalReference: 'Artigo 78.º-B do CIRS'
    }
  ]
};
