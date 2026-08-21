# 🇵🇹 pt-autonomo-api — Operations & Accounting Assistant for Portuguese Autónomos

[![CI](https://github.com/n4ouri/pt-autonomo-api/actions/workflows/ci.yml/badge.svg)](https://github.com/n4ouri/pt-autonomo-api/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen.svg)](https://nodejs.org)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-blue.svg)](http://localhost:3000/docs)

> **Being an autónomo in Portugal means running a business inside a system that never explains itself.**
> Quarterly Segurança Social declarations, e-Fatura deduction caps, the 15% expense-justification rule,
> Pagamentos por Conta — all real, all deadline-driven, and none of it explained in plain language
> anywhere the Estado publishes it. Most autónomos either overpay, underpay, or find out about a rule
> the day a fine arrives.

`pt-autonomo-api` is a **local-first, zero-credential** system that does two things:

1. **Calculates** — 15+ statutory simulation engines for CIRS, CRCSPSS, CIVA and CIRC, each backed by
   the actual article of law.
2. **Remembers and explains** — a persistent profile + income/expense ledger that auto-derives *your*
   personalized "what's due, when, and how much" obligations timeline and a plain-language guidance note
   on every response, so you're never handed a number without knowing what it means or why the law says so.

---

## 🌟 What it does

### Layer 1 — Instant tax & Social Security simulators (stateless, no signup needed)

- 📑 **CIRS Regime Simplificado (Art. 31.º CIRS)** — taxable income across service codes (75% / 35% / 15%
  coefficients), start-of-activity discount (50% yr 1, 25% yr 2), and the 15% mandatory expense-justification
  check that most autónomos don't find out about until it costs them.
- 🛡️ **Segurança Social Trimestral & Escalão Variation (Art. 163.º CRCSPSS)** — relevant quarterly income,
  monthly base (capped at 12 IAS), and the -25%/+25% adjustment trade-off between cash flow now and
  parental/sickness benefits later.
- 🏢 **Sociedade Unipessoal vs. Recibos Verdes break-even** — progressive IRS vs. 17% IRC + payroll + accounting costs.
- 🧾 **e-Fatura deduction caps optimizer (Art. 78.º CIRS)** — remaining headroom per category before year-end.
- 🇪🇺 **VIES & cross-border VAT compliance (Art. 6.º CIVA)** — reverse-charge clauses and VIES deadlines.
- 📅 Plus NHR/IFICI, IRS Jovem, PPC forecasting, quarterly IVA apuramento, withholding tax, tax-free
  allowances, SS benefits, and a 360º audit — see the full endpoint table below.

### Layer 2 — Persistent operations (the part that actually manages things for you)

- 👤 **Profile** — one identity (`regimeIVA`, service type, activity start date) everything else hangs off.
- 📒 **Transaction ledger** — log real income/expenses once; every simulator downstream reads from it
  instead of you re-typing totals every time.
- 🗓️ **Personalized obligations timeline** — combines the official statutory calendar with your regime and
  your ledger to tell you the *real next due date* and an *estimated amount*, not just a legal-text date range.
- 📊 **Dashboard** — one call: current-period ledger, a 360º fiscal/SS health score, and what's coming due.
- 💬 **Guidance on every response** — a `guidance` block (PT + EN) explaining what the numbers mean, the
  legal basis, and the mistakes autónomos actually make.

### What this is *not*

This is a local system of record and calculator — **not** an auto-filer. It does not submit anything to
Finanças, Segurança Social, or e-Fatura on your behalf (that requires government-issued credentials this
project can't obtain). It tells you exactly what to submit, where, and by when.

---

## 🚀 Quickstart

### 1. Run with Node.js
```bash
git clone https://github.com/n4ouri/pt-autonomo-api.git
cd pt-autonomo-api
npm install
npm start
```
The server starts at `http://localhost:3000`:
- **Interactive Web UI & Playground**: `http://localhost:3000/`
- **Swagger / OpenAPI Documentation**: `http://localhost:3000/docs`
- **Raw OpenAPI JSON Spec**: `http://localhost:3000/openapi.json`

The persistent layer writes to a local SQLite file (`./data/autonomo.db` by default — configurable via
`DATABASE_PATH` in `.env`, see `.env.example`). Nothing leaves your machine.

### 2. Run with Docker
```bash
docker build -t pt-autonomo-api .
docker run -p 3000:3000 -v $(pwd)/data:/app/data pt-autonomo-api
```

---

## 🔌 API Endpoints Reference

### Simulators (stateless — no auth)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/simulate/regime-simplificado` | CIRS Art. 31 calculations, 15% expenses, IRS brackets |
| `POST` | `/api/v1/simulate/irs-jovem` | IRS Jovem exemption (up to 100% year 1, capped at 55x IAS) |
| `POST` | `/api/v1/simulate/nhr` | NHR (Residente Não Habitual / IFICI) 20% flat tax rate |
| `POST` | `/api/v1/simulate/ss-quarterly` | Segurança Social base & -25%/+25% variation (Art. 163º) |
| `POST` | `/api/v1/simulate/ss-benefits` | Parentalidade 100% subsidy, baixa médica & desemprego TI |
| `POST` | `/api/v1/simulate/company-vs-recibos` | Unipessoal Lda (IRC 17%) vs. Recibos Verdes break-even |
| `POST` | `/api/v1/simulate/tax-free-allowances` | Tax-free Km (0.40€/km), meal card, and per diems |
| `POST` | `/api/v1/simulate/ppc` | Pagamentos por Conta (PPC) forecast & suspension (Art. 102º) |
| `POST` | `/api/v1/simulate/iva-periodic` | Periodic VAT declaration & Quadro 06 assessment |
| `POST` | `/api/v1/simulate/withholding-tax` | Category B IRS withholding tax rates (23%, 16.5%, 0%) |
| `POST` | `/api/v1/efatura/optimize` | Statutory e-Fatura deduction caps & headroom remaining |
| `POST` | `/api/v1/vies/check` | Cross-border EU/non-EU invoice clause & VIES deadlines |
| `GET`  | `/api/v1/calendar` | Official Portuguese tax deadlines (SS, IVA, IRS, PPC) |
| `GET`  | `/api/v1/constants` | Legal parameters (IAS 2026, minimum wage, brackets) |
| `POST` | `/api/v1/audit` | 360º automated tax health audit & alerts (manual snapshot) |
| `GET`  | `/api/v1/health` | Health check & API version |

Every simulator response now also includes a `guidance` field — a plain-language explanation, legal
reference, and common mistakes for that topic.

### Operations layer (persistent — requires an API key)

| Method | Endpoint | Description |
|---|---|---|
| `POST`   | `/api/v1/profiles` | Create a profile, returns an API key **once** |
| `GET`    | `/api/v1/me` | Get the authenticated profile |
| `PATCH`  | `/api/v1/me` | Update profile settings (regime, service type, ...) |
| `POST`   | `/api/v1/me/transactions` | Log an income or expense entry |
| `GET`    | `/api/v1/me/transactions` | List transactions (filter by `from`, `to`, `type`, `category`) |
| `PATCH`  | `/api/v1/me/transactions/:id` | Update a transaction |
| `DELETE` | `/api/v1/me/transactions/:id` | Delete a transaction |
| `GET`    | `/api/v1/me/ledger/summary` | Period summary (`?year=2026&quarter=1`): gross income by CIRS category, expenses, VAT |
| `GET`    | `/api/v1/me/obligations` | Personalized "what's due, when, how much" timeline, derived from your ledger |
| `PATCH`  | `/api/v1/me/obligations/:key` | Mark an obligation paid/pending |
| `GET`    | `/api/v1/me/dashboard` | Current-period ledger + 360º health audit + upcoming obligations, in one call |

Authenticate with `Authorization: Bearer <apiKey>` from the `POST /api/v1/profiles` response.

---

## 💻 Example: from raw ledger entries to a personalized obligations timeline

```bash
# 1. Create a profile (save the apiKey — shown once)
curl -X POST http://localhost:3000/api/v1/profiles \
  -H "Content-Type: application/json" \
  -d '{ "name": "Maria Silva", "nif": "123456789", "regimeIVA": "trimestral" }'
# => { "data": { "apiKey": "pta_...", "profile": { "id": "...", ... } } }

API_KEY="pta_..."

# 2. Log real invoices/expenses as they happen — no manual totals
curl -X POST http://localhost:3000/api/v1/me/transactions \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{ "type": "income", "date": "2026-02-10", "amount": 5000, "category": "SERVICOS_PROFISSIONAIS", "vatRate": 0.23 }'

curl -X POST http://localhost:3000/api/v1/me/transactions \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{ "type": "expense", "date": "2026-02-15", "amount": 800, "category": "EQUIPAMENTO", "vatRate": 0.23, "isJustifiedExpense": true }'

# 3. Ask what's due, when, and how much — computed from the ledger above, not re-typed
curl http://localhost:3000/api/v1/me/obligations -H "Authorization: Bearer $API_KEY"

# 4. Or get the whole picture in one call
curl http://localhost:3000/api/v1/me/dashboard -H "Authorization: Bearer $API_KEY"
```

### Stateless simulator example (still works exactly as before)

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

Every simulator response now carries a `guidance` block alongside `data`:

```json
{
  "status": "success",
  "data": { "...": "unchanged response shape" },
  "guidance": {
    "summary": "Estimate of your yearly IRS as a self-employed worker under Regime Simplificado.",
    "plainLanguage": { "pt": "...", "en": "..." },
    "legalBasis": "Artigo 31.º do CIRS",
    "commonMistakes": ["..."],
    "disclaimer": "Informational estimate, not a substitute for a licensed accountant."
  }
}
```

---

## 📦 Direct Node.js SDK Usage

Calculation engines can be imported directly without running HTTP:

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

```bash
npm test
```

Runs the full Node native test-runner suite: every calculation engine, plus the operations layer
(profile auth, transaction CRUD, ledger aggregation, obligations derivation, dashboard) against an
in-memory SQLite database.

---

## ⚖️ Legal Framework & Portuguese Law References

- **CIRS**: Artigos 31.º (Regime Simplificado), 68.º (Escalões de IRS), 70.º (Mínimo de Existência), 78.º (Deduções à Coleta), 101.º/101.º-B (Retenção na Fonte), 102.º (Pagamentos por Conta).
- **CRCSPSS**: Artigos 139.º a 168.º (Regime dos Trabalhadores Independentes, Declarações Trimestrais e Variação de Escalão).
- **CIVA**: Artigos 6.º (Regras de Localização e Autoliquidação), 29.º (Obrigações e VIES), 53.º (Regime de Isenção).
- **CIRC**: Artigo 87.º (Taxa Reduzida de PME a 17%).

Legal constants (IAS, salário mínimo, escalões, retenção) are versioned per fiscal year in
[`src/constants/legal-constants.js`](src/constants/legal-constants.js) with the diploma that set each value —
check there for the current sourcing rather than this README, which will drift.

---

## 📄 License

MIT © [Portuguese Autónomos Community](https://github.com/n4ouri/pt-autonomo-api)
