# 🇵🇹 Portuguese Autónomo & Tax Optimization API (`pt-autonomo-api`)

[![CI](https://github.com/n4ouri/pt-autonomo-api/actions/workflows/ci.yml/badge.svg)](https://github.com/n4ouri/pt-autonomo-api/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen.svg)](https://nodejs.org)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-blue.svg)](http://localhost:3000/docs)

> **Universal Open Source Tax & Social Security Engine for Portuguese Freelancers, Recibos Verdes, and Independent Workers.**
> Accurate, zero-credential, local-first legal calculation API covering **CIRS, CRCSPSS, CIVA, CIRC, and e-Fatura**.

---

## 🌟 Features

- 📑 **CIRS Regime Simplificado Simulator (Art. 31.º CIRS)**:
  - Precise taxable income calculations across service codes (Tabela Art. 151.º: 75% vs. Other services: 35% vs. Sales: 15%).
  - **Start of Activity Tax Cut (Art. 31.º n.º 10)**: 50% discount in Year 1, 25% discount in Year 2.
  - **15% Mandatory Expense Justification (Art. 31.º n.º 13)**: Automatically factors 4.104 € specific deduction, Social Security contributions, business expenses, and 25% home office deductions to detect and quantify tax penalties.
- 🛡️ **Segurança Social Trimestral & Escalão Variation (Art. 163.º CRCSPSS)**:
  - Computes relevant quarterly income (70% services / 20% sales) and monthly base (capped at 12 IAS).
  - Simulates the **-25% to +25% escalão adjustment** to balance immediate liquidity vs. maximizing IRS deductions / parental leave benefits.
- 🏢 **Sociedade Unipessoal vs. Recibos Verdes Break-Even Engine**:
  - Detailed financial comparison between Category B progressive IRS (up to 48%) and Unipessoal Lda (17% IRC on first 50k, director salary, 9.60 €/day tax-free meal card allowance, accounting costs, and electric vehicle VAT perks).
- 🧾 **e-Fatura Deduction Caps Optimizer (Art. 78.º CIRS)**:
  - Real-time headroom calculator for Saúde (1.000 €), Educação (800 €), Habitação (600 €), Despesas Gerais (250 € / 500 €), Benefício IVA (250 €), and PPR (up to 400 €).
- 🇪🇺 **VIES & Cross-Border VAT Compliance (Art. 6.º CIVA)**:
  - Generates statutory reverse-charge invoice clauses for EU B2B and Non-EU exports with VIES recapitulativa declaration alerts.
- 📅 **Official Portuguese Statutory Tax Calendar**:
  - All critical deadlines for SS quarterly declarations, IVA trimestral, Modelo 3 IRS, and Pagamentos por Conta (PPC).

---

## 🚀 Quickstart

### 1. Run with Node.js
```bash
git clone https://github.com/n4ouri/pt-autonomo-api.git
cd pt-autonomo-api
npm install
npm start
```
The server will start at `http://localhost:3000`:
- **Interactive Web UI & Playground**: `http://localhost:3000/`
- **Swagger / OpenAPI Documentation**: `http://localhost:3000/docs`
- **Raw OpenAPI JSON Spec**: `http://localhost:3000/openapi.json`

### 2. Run with Docker
```bash
docker build -t pt-autonomo-api .
docker run -p 3000:3000 pt-autonomo-api
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/simulate/regime-simplificado` | CIRS Art. 31 calculations, 15% expenses, IRS brackets |
| `POST` | `/api/v1/simulate/nhr` | NHR (Residente Não Habitual / IFICI) 20% flat tax rate |
| `POST` | `/api/v1/simulate/ss-quarterly` | Segurança Social base & -25%/+25% variation (Art. 163º) |
| `POST` | `/api/v1/simulate/company-vs-recibos` | Unipessoal Lda (IRC 17%) vs. Recibos Verdes break-even |
| `POST` | `/api/v1/simulate/tax-free-allowances` | Tax-free Km (0.40€/km), meal card, and per diems |
| `POST` | `/api/v1/simulate/ppc` | Pagamentos por Conta (PPC) forecast & suspension (Art. 102º) |
| `POST` | `/api/v1/efatura/optimize` | Statutory e-Fatura deduction caps & headroom remaining |
| `POST` | `/api/v1/vies/check` | Cross-border EU/non-EU invoice clause & VIES deadlines |
| `GET`  | `/api/v1/calendar` | Official Portuguese tax deadlines (SS, IVA, IRS, PPC) |
| `GET`  | `/api/v1/constants` | Legal parameters (IAS 2026, minimum wage, brackets) |
| `POST` | `/api/v1/audit` | 360º automated tax health audit & alerts |
| `GET`  | `/api/v1/health` | Health check & API version |

---

## 💻 Example API Calls

### 1. Simulate Regime Simplificado & 15% Expense Deficit

```bash
curl -X POST http://localhost:3000/api/v1/simulate/regime-simplificado \
  -H "Content-Type: application/json" \
  -d '{
    "annualGrossServices": 60000,
    "activityYear": 3,
    "annualSSPaid": 7200,
    "businessExpenses": 1500,
    "homeOfficeEligibleExpenses": 2400,
    "withheldTax": 12000
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "grossIncome": { "servicesTabela151": 60000, "total": 60000 },
    "simplificado": {
      "standardTaxableBase": 45000,
      "expenseJustification": {
        "targetRequired15Percent": 9000,
        "automaticSpecificDeduction": 7200,
        "homeOfficeDeduction": 600,
        "businessExpensesReported": 1500,
        "totalJustifiedExpenses": 9300,
        "expenseDeficit": 0,
        "isFullyJustified": true
      },
      "finalTaxableIncome": 45000
    },
    "taxEstimation": {
      "estimatedGrossIRSTax": 12698.41,
      "effectiveIRSRate": 28.22,
      "withheldTaxAlreadyPaid": 12000,
      "netIRSBalance": 698.41,
      "status": "TO_PAY"
    }
  }
}
```

---

### 2. Simulate Segurança Social Escalão Variation (-25% vs +25%)

```bash
curl -X POST http://localhost:3000/api/v1/simulate/ss-quarterly \
  -H "Content-Type: application/json" \
  -d '{
    "quarterlyGrossServices": 15000
  }'
```

---

### 3. Compare Sociedade Unipessoal vs. Recibos Verdes

```bash
curl -X POST http://localhost:3000/api/v1/simulate/company-vs-recibos \
  -H "Content-Type: application/json" \
  -d '{
    "annualGrossRevenue": 70000,
    "annualOperationalExpenses": 6000
  }'
```

---

## 📦 Direct Node.js SDK Usage

You can also import calculation engines directly without running HTTP:

```javascript
import { 
  simulateRegimeSimplificado, 
  simulateSegurancaSocialQuarterly,
  compareCompanyVsRecibosVerdes,
  optimizeEFaturaDeductions 
} from 'pt-autonomo-api';

const sim = simulateRegimeSimplificado({
  annualGrossServices: 50000,
  activityYear: 1 // First year: 50% discount!
});

console.log(sim.simplificado.activityYearBonus);
```

---

## 🧪 Testing

Run the automated test suite with Node's native test runner:

```bash
npm test
```

---

## ⚖️ Legal Framework & Portuguese Law References

- **CIRS**: Artigos 31.º (Regime Simplificado), 68.º (Escalões de IRS), 78.º (Deduções à Coleta), 101.º (Retenção na Fonte), 102.º (Pagamentos por Conta).
- **CRCSPSS**: Artigos 139.º a 168.º (Regime dos Trabalhadores Independentes, Declarações Trimestrais e Variação de Escalão).
- **CIVA**: Artigos 6.º (Regras de Localização e Autoliquidação), 29.º (Obrigações e VIES), 53.º (Regime de Isenção).
- **CIRC**: Artigo 87.º (Taxa Reduzida de PME a 17%).

---

## 📄 License

MIT © [Portuguese Autónomos Community](https://github.com/n4ouri/pt-autonomo-api)
