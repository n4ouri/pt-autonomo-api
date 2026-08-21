/**
 * Plain-language guidance layer. Every simulation number in this API comes from a real
 * article of Portuguese law, but the law itself is opaque to most autónomos — this module
 * attaches a short "what this means / what to do next" explanation to API responses so the
 * numbers are never handed over without context.
 */
const TOPICS = {
  'regime-simplificado': {
    summary: 'Estimate of your yearly IRS (income tax) as a self-employed worker under Regime Simplificado.',
    plainLanguage: {
      pt: 'A Finanças não tributa 100% do que fatura: aplica um "coeficiente" (75% para serviços, 35% para outros serviços, 15% para vendas) e depois tributa o que sobra pelos escalões de IRS. Se não conseguir justificar despesas equivalentes a 15% da sua faturação de serviços, paga IRS sobre um valor maior.',
      en: 'Portugal does not tax 100% of your invoiced income — a coefficient (75% for professional services, 35% for other services, 15% for goods) determines the taxable slice, which then falls into IRS brackets. If you can’t document expenses worth 15% of your service income, you’re taxed on more than that slice.'
    },
    legalBasis: 'Artigo 31.º do CIRS',
    commonMistakes: [
      'Not tracking Social Security payments and business expenses with NIF, which count toward the mandatory 15% expense justification.',
      'Forgetting the 50%/25% start-of-activity discount only applies in years 1 and 2.'
    ]
  },
  'ss-quarterly': {
    summary: 'Your monthly Social Security contribution, fixed every quarter by a declaration of relevant income.',
    plainLanguage: {
      pt: 'Todos os trimestres declara o que faturou; a Segurança Social usa 70% dos serviços e 20% das vendas para calcular uma base mensal, e cobra 21,4% (serviços) sobre essa base durante os 3 meses seguintes. Pode ajustar essa base entre -25% e +25% para equilibrar liquidez imediata com proteção social futura (subsídio de parentalidade, doença, desemprego).',
      en: 'Every quarter you declare what you invoiced; Social Security uses 70% of services and 20% of goods sold to set a monthly base, charged at 21.4% (services) for the next 3 months. You can shift that base -25% to +25% to trade off short-term cash flow against future benefits (parental leave, sick pay, unemployment).'
    },
    legalBasis: 'Artigos 139.º a 168.º do CRCSPSS',
    commonMistakes: [
      'Missing the quarterly declaration deadline, which defaults you to the previous base.',
      'Always choosing -25% without realizing it also lowers your future parental/sickness benefit.'
    ]
  },
  'nhr': {
    summary: 'Simulation of the 20% flat IRS rate for high-value-added activities under NHR / IFICI.',
    plainLanguage: {
      pt: 'Em vez dos escalões normais de IRS (até 48%), atividades de elevado valor acrescentado podem ser tributadas a uma taxa fixa de 20% sobre o rendimento líquido do Regime Simplificado, se o regime NHR/IFICI estiver ativo.',
      en: 'Instead of the normal progressive IRS brackets (up to 48%), high-value-added activities can be taxed at a flat 20% on the Regime Simplificado net income, while an active NHR/IFICI status applies.'
    },
    legalBasis: 'Estatuto NHR / IFICI',
    commonMistakes: ['Assuming eligibility is automatic — the activity must be on the statutory high-value-added list and the status must be formally requested.']
  },
  'irs-jovem': {
    summary: 'IRS Jovem exemption simulation for young taxpayers in their first years of activity.',
    plainLanguage: {
      pt: 'Se tem entre 18 e 35 anos e concluiu um ciclo de estudos, pode ficar isento de parte do IRS nos primeiros anos de atividade — a percentagem de isenção diminui a cada ano e está limitada a um múltiplo do IAS.',
      en: 'If you’re 18–35 and completed a level of education, part of your IRS can be exempt in your first years of activity — the exemption percentage decreases each year and is capped at a multiple of the IAS.'
    },
    legalBasis: 'Artigo 12.º-B do CIRS',
    commonMistakes: ['Not tracking which "year of benefit" you’re in, since the exemption percentage steps down annually.']
  },
  'ss-benefits': {
    summary: 'What Social Security actually owes you back — parental leave, sick pay, unemployment for the self-employed.',
    plainLanguage: {
      pt: 'As contribuições que paga não são só um custo: dão direito a subsídio de parentalidade (até 100% da remuneração de referência), baixa médica e, em certas condições, subsídio por cessação de atividade. O valor depende diretamente da base mensal que declarou nos últimos 12 meses.',
      en: 'Your contributions aren’t just a cost — they entitle you to parental leave pay (up to 100% of reference remuneration), sick pay, and, under conditions, unemployment support for the self-employed. The amount depends directly on the monthly base you declared over the last 12 months.'
    },
    legalBasis: 'CRCSPSS — proteção social dos trabalhadores independentes',
    commonMistakes: ['Minimizing the SS base every quarter for cash flow, then being surprised by a small benefit when it’s actually needed.']
  },
  'company-vs-recibos': {
    summary: 'Break-even comparison: staying as Recibos Verdes vs. incorporating a Sociedade Unipessoal.',
    plainLanguage: {
      pt: 'Como Recibos Verdes paga IRS progressivo (até 48%) sobre o rendimento tributável. Como sociedade unipessoal paga IRC (17% até 50 mil euros de lucro), mais IRS sobre o salário que a empresa lhe pagar, mais custos de contabilidade organizada. Compensa sobretudo a partir de um certo volume de faturação.',
      en: 'As Recibos Verdes you pay progressive IRS (up to 48%) on taxable income. As a one-person company you pay IRC (17% up to €50k profit), plus IRS on whatever salary the company pays you, plus mandatory accounting costs. It typically only pays off above a certain revenue threshold.'
    },
    legalBasis: 'Artigo 87.º do CIRC vs. Artigo 68.º do CIRS',
    commonMistakes: ['Ignoring the mandatory accounting fee and payroll TSU (23.75%) when comparing the two regimes.']
  },
  'tax-free-allowances': {
    summary: 'Legally tax-free liquidity: per-km travel, meal allowance, and per diems.',
    plainLanguage: {
      pt: 'Certas ajudas de custo (quilómetros ao próprio serviço, cartão refeição até 9,60 €/dia, ajudas de custo em deslocação) estão isentas de IRS e de contribuições até um limite legal — é dinheiro que pode extrair da atividade sem ser tributado como rendimento.',
      en: 'Certain allowances (mileage, meal card up to €9.60/day, travel per diems) are exempt from IRS and Social Security up to a legal cap — money you can extract from the business without it being taxed as income.'
    },
    legalBasis: 'CIRC Art. 87.º-A e portarias de ajudas de custo',
    commonMistakes: ['Paying these informally without a mileage log or per-diem record, which is what Finanças asks for if it’s ever checked.']
  },
  ppc: {
    summary: 'Advance IRS installments (Pagamentos por Conta) due July, September and December.',
    plainLanguage: {
      pt: 'Se no ano anterior pagou IRS sem retenção suficiente, a Finanças cobra-lhe 3 adiantamentos do imposto do ano corrente. Se as retenções e os 2 primeiros pagamentos já cobrirem o imposto estimado do ano, pode dispensar legalmente a 3.ª prestação de Dezembro.',
      en: 'If last year you owed IRS without enough withholding, the Tax Authority collects 3 advance installments against this year’s tax. If withholding plus the first two installments already cover this year’s estimated tax, you can legally skip the December installment.'
    },
    legalBasis: 'Artigo 102.º do CIRS',
    commonMistakes: ['Paying the December installment out of caution without checking the Art. 102.º n.º 7 suspension test first.']
  },
  'iva-periodic': {
    summary: 'Quarterly VAT settlement: what you collected vs. what you can deduct.',
    plainLanguage: {
      pt: 'Todos os trimestres apura a diferença entre o IVA que liquidou nas faturas emitidas e o IVA que suportou em compras dedutíveis. Se o saldo for positivo, paga à Finanças; se for negativo, fica com crédito para o trimestre seguinte (ou pode pedir reembolso acima de certos limites).',
      en: 'Every quarter you net the VAT you charged on invoices against deductible VAT on purchases. A positive balance is owed to the Tax Authority; a negative one carries forward as credit (or can be refunded above certain thresholds).'
    },
    legalBasis: 'Artigos 29.º e 41.º do CIVA',
    commonMistakes: ['Forgetting to claim deductible VAT on equipment and general business expenses, overpaying every quarter.']
  },
  'withholding-tax': {
    summary: 'How much IRS your client must withhold before paying your invoice.',
    plainLanguage: {
      pt: 'Clientes empresariais em Portugal são obrigados a reter uma percentagem do valor da fatura (normalmente 25% para a Tabela 151) e entregá-la diretamente à Finanças por sua conta. Abaixo de 15.000 €/ano de faturação, pode pedir dispensa de retenção.',
      en: 'Business clients in Portugal must withhold a percentage of your invoice (usually 25% for Tabela 151 activities) and pay it directly to the Tax Authority on your behalf. Below €15,000/year in turnover, you can request an exemption from withholding.'
    },
    legalBasis: 'Artigos 101.º e 101.º-B do CIRS',
    commonMistakes: ['Not stating the Art. 101.º-B exemption on the invoice when eligible, causing an unnecessary cash-flow hit.']
  },
  efatura: {
    summary: 'How much headroom is left in each e-Fatura deduction category before you hit the statutory cap.',
    plainLanguage: {
      pt: 'Cada categoria de despesa (saúde, educação, habitação, despesas gerais, benefício de IVA, PPR) tem um teto legal de dedução ao IRS. Faturas com o seu NIF acima desse teto deixam de reduzir o imposto — vale a pena saber onde ainda tem margem antes do fim do ano.',
      en: 'Each expense category (health, education, housing, general expenses, VAT benefit, PPR) has a statutory IRS deduction cap. Invoices above that cap stop reducing your tax — worth knowing where you still have headroom before year-end.'
    },
    legalBasis: 'Artigo 78.º do CIRS',
    commonMistakes: ['Concentrating all deductible spending in one category instead of spreading it to use up multiple caps.']
  },
  vies: {
    summary: 'Invoice clause and VIES obligations for cross-border EU/non-EU clients.',
    plainLanguage: {
      pt: 'Faturas a empresas de outros países da UE normalmente não levam IVA português (autoliquidação pelo cliente), mas exigem uma menção legal na fatura e a comunicação na declaração recapitulativa VIES. Faturas fora da UE seguem regras de exportação de serviços.',
      en: 'Invoices to EU business clients usually carry no Portuguese VAT (reverse charge by the client) but need a specific legal clause on the invoice and reporting via the VIES recapitulative declaration. Non-EU invoices follow export-of-services rules instead.'
    },
    legalBasis: 'Artigo 6.º e 29.º do CIVA',
    commonMistakes: ['Charging Portuguese VAT to an EU business client by mistake, or forgetting the monthly VIES declaration.']
  },
  audit: {
    summary: '360º snapshot of fiscal and Social Security health, built from whatever data you supplied.',
    plainLanguage: {
      pt: 'Este endpoint aceita um "retrato" pontual da sua situação (dívidas, faturas pendentes, rendimentos) e devolve alertas e oportunidades. Para um retrato sempre atualizado sem reintroduzir dados manualmente, use o dashboard do seu perfil (/api/v1/me/dashboard), que lê diretamente do seu livro de lançamentos.',
      en: 'This endpoint accepts a point-in-time snapshot (debts, pending invoices, income) and returns alerts and opportunities. For an always-current view without re-entering data by hand, use your profile dashboard (/api/v1/me/dashboard), which reads directly from your transaction ledger.'
    },
    legalBasis: null,
    commonMistakes: []
  },
  dashboard: {
    summary: 'Your business, derived automatically from the transactions you’ve logged — no manual re-entry.',
    plainLanguage: {
      pt: 'Este painel combina o seu livro de lançamentos com o calendário fiscal oficial para lhe dizer o que deve, a quem, e quando — sem ter de voltar a introduzir os totais em cada simulador.',
      en: 'This dashboard combines your logged transactions with the official tax calendar to tell you what’s owed, to whom, and when — without re-entering totals into each simulator by hand.'
    },
    legalBasis: null,
    commonMistakes: ['Logging income without a category (SERVICOS_PROFISSIONAIS / OUTROS_SERVICOS / VENDAS_MERCADORIAS) — the coefficient and SS calculation depend on it.']
  },
  'contabilidade-organizada': {
    summary: 'Real-expense Category B taxation for when Regime Simplificado no longer applies or stops paying off.',
    plainLanguage: {
      pt: 'Acima de 200.000 €/ano de faturação (2 anos seguidos) o Regime Simplificado deixa de estar disponível: passa a pagar IRS sobre o lucro contabilístico real (faturação menos despesas, amortizações e Segurança Social documentadas), com um Contabilista Certificado obrigatório.',
      en: 'Above €200,000/year in revenue (2 consecutive years) Regime Simplificado stops being available: IRS is charged on real accounting profit (revenue minus documented expenses, depreciations and Social Security) instead of a flat coefficient, and a Certified Accountant becomes mandatory.'
    },
    legalBasis: 'Artigos 28.º, 32.º e 33.º do CIRS',
    commonMistakes: ['Comparing only the tax rate difference and ignoring the mandatory monthly accounting fee, which can erase the savings for smaller revenue levels.']
  },
  'seguro-acidentes-trabalho': {
    summary: 'Mandatory work-accident insurance cost estimate for self-employed workers.',
    plainLanguage: {
      pt: 'Ao contrário da Segurança Social, este seguro não tem uma tabela oficial de preços — cada seguradora fixa o prémio consoante o risco da atividade e o rendimento que declarar. Os valores devolvidos são uma faixa indicativa de mercado, não uma tarifa legal.',
      en: 'Unlike Social Security, this insurance has no official price table — each insurer sets the premium based on activity risk and declared income. The figures returned are an indicative market band, not a legal tariff.'
    },
    legalBasis: 'Artigo 3.º do Decreto-Lei n.º 159/99 e Lei n.º 98/2009',
    commonMistakes: ['Assuming this is optional because it isn’t collected automatically like Social Security — it is a legal obligation with its own enforcement risk if uninsured.']
  },
  'categoria-f': {
    summary: 'Rental income (Categoria F): net taxable rent and the applicable autonomous IRS rate.',
    plainLanguage: {
      pt: 'A renda bruta é reduzida pelas despesas de manutenção, conservação e IMI do imóvel arrendado, e o saldo é tributado autonomamente a uma taxa que depende do tipo de contrato — pode compensar optar pelo englobamento se a sua taxa marginal de IRS for mais baixa.',
      en: 'Gross rent is reduced by maintenance, conservation and IMI costs on the let property, and the balance is taxed autonomously at a rate that depends on the contract type — englobamento can pay off if your marginal IRS rate is lower.'
    },
    legalBasis: 'Artigos 8.º, 41.º e 72.º do CIRS',
    commonMistakes: ['Not keeping invoices for maintenance/conservation works, which are exactly what Finanças asks for if the deduction is checked.']
  },
  'categoria-g': {
    summary: 'Capital gains (Categoria G) on securities and crypto-assets: what is taxed, at what rate, and what is exempt.',
    plainLanguage: {
      pt: 'Mais-valias de ações/ETFs são tributadas a 28% sobre o saldo positivo do ano. Em criptoativos, só as posições detidas há menos de 365 dias pagam 28% — as detidas há 365 dias ou mais estão isentas, mas continuam a ter de ser declaradas.',
      en: 'Gains on shares/ETFs are taxed at 28% on the year’s net positive balance. For crypto-assets, only positions held under 365 days pay 28% — those held 365 days or more are exempt, but still have to be declared.'
    },
    legalBasis: 'Artigos 10.º e 72.º do CIRS',
    commonMistakes: ['Forgetting that the 365-day exemption still requires declaring the gain in Anexo G1 — “exempt” isn’t “don’t report”.']
  },
  obligations: {
    summary: 'Your personalized deadline timeline, computed from the statutory calendar and your ledger.',
    plainLanguage: {
      pt: 'Cada obrigação mostra a data limite real (não apenas o texto legal), o valor estimado com base no que já lançou, e uma nota a explicar de onde veio o número. Isto não submete nada às Finanças ou à Segurança Social — apenas organiza o que você precisa de fazer.',
      en: 'Each obligation shows a real due date (not just legal text), an amount estimated from what you’ve already logged, and a note explaining where the number came from. This does not file anything with the Tax Authority or Social Security — it only organizes what you need to do.'
    },
    legalBasis: null,
    commonMistakes: []
  }
};

export function buildGuidance(topic) {
  const entry = TOPICS[topic];
  if (!entry) return null;
  return {
    topic,
    summary: entry.summary,
    plainLanguage: entry.plainLanguage,
    legalBasis: entry.legalBasis,
    commonMistakes: entry.commonMistakes,
    disclaimer: 'Informational estimate, not a substitute for a licensed accountant (Contabilista Certificado) or official filing.'
  };
}

export function withGuidance(topic, data) {
  const guidance = buildGuidance(topic);
  return guidance ? { ...data, guidance } : data;
}
