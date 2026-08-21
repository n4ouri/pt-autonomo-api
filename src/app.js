import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './routes/api.js';
import { router as profilesRouter } from './routes/profiles.js';
import { router as transactionsRouter } from './routes/transactions.js';
import { router as ledgerRouter } from './routes/ledger.js';
import { router as obligationsRouter } from './routes/obligations.js';
import { router as dashboardRouter } from './routes/dashboard.js';
import { router as extendedSimulationsRouter } from './routes/extended-simulations.js';
import { router as connectorsRouter } from './routes/connectors.js';
import { router as importRouter } from './routes/import.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Mount API routes — stateless calculators first, then the persistent operations layer
// (profile, ledger, obligations, dashboard) that turns them into a system of record.
app.use('/api/v1', apiRouter);
app.use('/api/v1', profilesRouter);
app.use('/api/v1', transactionsRouter);
app.use('/api/v1', ledgerRouter);
app.use('/api/v1', obligationsRouter);
app.use('/api/v1', dashboardRouter);
app.use('/api/v1', extendedSimulationsRouter);
app.use('/api/v1', connectorsRouter);
app.use('/api/v1', importRouter);

// Serve OpenAPI JSON spec
app.get('/openapi.json', (req, res) => {
  const specPath = path.join(__dirname, 'docs', 'openapi.json');
  if (fs.existsSync(specPath)) {
    res.sendFile(specPath);
  } else {
    res.status(404).json({ error: 'OpenAPI specification not found' });
  }
});

// Interactive Swagger / Scalar API Docs
app.get('/docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Portuguese Autónomo & Tax Optimization API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f172a; }
    .swagger-ui { background: #0f172a; filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

// Landing Page & Interactive API Playground
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portuguese Autónomo & Tax Optimization Public API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #111726;
      --card-alt: #162035;
      --border: #1e293b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --green: #10b981;
      --emerald: #34d399;
      --blue: #38bdf8;
      --amber: #fbbf24;
      --purple: #a855f7;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background: var(--bg); color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.6; padding: 40px 20px; }
    .container { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }
    
    .hero { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px 20px 20px; }
    .badge { background: rgba(16, 185, 129, 0.15); color: var(--emerald); border: 1px solid rgba(16, 185, 129, 0.3); padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; }
    h1 { font-size: 38px; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #ffffff 40%, var(--emerald) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .lead { font-size: 17px; color: var(--muted); max-width: 720px; }
    
    .action-links { display: flex; gap: 14px; margin-top: 8px; }
    .btn { padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; cursor: pointer; transition: 0.2s; border: none; }
    .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary { background: #1e293b; color: #fff; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; }

    .grid-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; }
    .feat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
    .feat-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--emerald); letter-spacing: 0.5px; }
    .feat-title { font-size: 18px; font-weight: 700; color: #fff; }
    .feat-desc { font-size: 13.5px; color: var(--muted); }
    
    .playground { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 28px; display: flex; flex-direction: column; gap: 20px; }
    .play-header { display: flex; justify-content: space-between; align-items: center; }
    .play-title { font-size: 20px; font-weight: 700; }
    
    .tabs { display: flex; gap: 10px; flex-wrap: wrap; }
    .tab-btn { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .tab-btn.active { background: var(--green); color: #fff; border-color: var(--green); }
    
    .code-box { background: #0b0f19; border: 1px solid var(--border); border-radius: 8px; padding: 18px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: #e2e8f0; overflow-x: auto; max-height: 400px; }
    .btn-run { background: #3b82f6; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; align-self: flex-start; }
    .btn-run:hover { background: #2563eb; }

    footer { text-align: center; color: var(--muted); font-size: 13px; border-top: 1px solid var(--border); padding-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <span class="badge">Open Source Portuguese Tax Engine</span>
      <h1>Portuguese Autónomo & Tax API</h1>
      <p class="lead">Universal calculation and simulation engine for Recibos Verdes, Regime Simplificado (Art. 31º CIRS), Segurança Social quarterly variation (-25%/+25%), e-Fatura caps, and Unipessoal vs. Recibos Verdes break-even analysis.</p>
      
      <div class="action-links">
        <a href="/docs" class="btn btn-primary">📖 Interactive Swagger Docs</a>
        <a href="https://github.com/n4ouri/pt-autonomo-api" target="_blank" class="btn btn-secondary">⭐ GitHub Repository</a>
      </div>
    </div>

    <div class="grid-features">
      <div class="feat-card">
        <span class="feat-tag">CIRS Art. 31.º</span>
        <h3 class="feat-title">Regime Simplificado & 15% Despesas</h3>
        <p class="feat-desc">Calculates taxable income, start-of-activity cuts (50% yr 1, 25% yr 2), and exact 15% expense justification deficit to avoid IRS penalties.</p>
      </div>

      <div class="feat-card">
        <span class="feat-tag">CRCSPSS Art. 163.º</span>
        <h3 class="feat-title">Segurança Social Trimestral (-25% / +25%)</h3>
        <p class="feat-desc">Simulates monthly base of incidence, quarterly declarations, and cash-flow impact of -25% vs +25% escalão adjustment.</p>
      </div>

      <div class="feat-card">
        <span class="feat-tag">IRC vs CIRS</span>
        <h3 class="feat-title">Unipessoal Lda Break-Even Simulator</h3>
        <p class="feat-desc">Compares Recibos Verdes progressive IRS against Unipessoal Lda (17% IRC on first 50k, director salary, meal card allowance, electric car tax perks).</p>
      </div>

      <div class="feat-card">
        <span class="feat-tag">CIVA & VIES</span>
        <h3 class="feat-title">EU Reverse Charge & Invoicing</h3>
        <p class="feat-desc">Determines mandatory invoice legal clauses (Art. 6.º n.º 6 al. a CIVA), VAT rates, and VIES recapitulativa declaration deadlines.</p>
      </div>
    </div>

    <div class="playground">
      <div class="play-header">
        <h2 class="play-title">⚡ Live API Playground</h2>
        <span style="font-size:13px; color:var(--emerald);">Endpoint: POST /api/v1/simulate/regime-simplificado</span>
      </div>

      <div class="tabs">
        <button class="tab-btn active" onclick="loadExample('simplificado')">Regime Simplificado</button>
        <button class="tab-btn" onclick="loadExample('nhr')">NHR (20% Flat Rate)</button>
        <button class="tab-btn" onclick="loadExample('ss')">Segurança Social (-25%/+25%)</button>
        <button class="tab-btn" onclick="loadExample('company')">Unipessoal vs Recibos</button>
        <button class="tab-btn" onclick="loadExample('allowances')">Ajudas de Custo (Km & Refeição)</button>
        <button class="tab-btn" onclick="loadExample('ppc')">Pagamentos por Conta (PPC)</button>
        <button class="tab-btn" onclick="loadExample('efatura')">e-Fatura Deduções</button>
      </div>

      <button class="btn-run" onclick="executeCurrentRequest()">▶ Run Simulation</button>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
        <div>
          <div style="font-size:12px; color:var(--muted); font-weight:700; margin-bottom:6px;">REQUEST PAYLOAD:</div>
          <pre id="req-box" class="code-box" contenteditable="true"></pre>
        </div>
        <div>
          <div style="font-size:12px; color:var(--muted); font-weight:700; margin-bottom:6px;">API RESPONSE (LIVE):</div>
          <pre id="res-box" class="code-box">// Click 'Run Simulation' to test</pre>
        </div>
      </div>
    </div>

    <footer>
      <p>MIT Licensed • Created for Portuguese Autónomos & Freelancers • 2026 Fiscal Rules</p>
    </footer>
  </div>

  <script>
    const examples = {
      simplificado: {
        url: '/api/v1/simulate/regime-simplificado',
        payload: {
          annualGrossServices: 55000,
          activityYear: 3,
          annualSSPaid: 6500,
          businessExpenses: 2000,
          homeOfficeEligibleExpenses: 2400,
          withheldTax: 12000
        }
      },
      nhr: {
        url: '/api/v1/simulate/nhr',
        payload: {
          annualGrossServices: 75000,
          annualSSPaid: 7500,
          businessExpenses: 3750,
          withheldTax: 15000,
          isEligibleHighValueActivity: true
        }
      },
      ss: {
        url: '/api/v1/simulate/ss-quarterly',
        payload: {
          quarterlyGrossServices: 14000,
          isFirstYearExempt: false,
          hasConcurrentEmployment: false
        }
      },
      company: {
        url: '/api/v1/simulate/company-vs-recibos',
        payload: {
          annualGrossRevenue: 65000,
          annualOperationalExpenses: 6000,
          monthlyDirectorSalary: 1400,
          monthlyAccountingFee: 150
        }
      },
      allowances: {
        url: '/api/v1/simulate/tax-free-allowances',
        payload: {
          monthlyKmDriven: 1000,
          workDaysPerMonth: 22,
          nationalTravelDaysPerYear: 10,
          foreignTravelDaysPerYear: 5,
          isCompanyManagingPartner: true
        }
      },
      ppc: {
        url: '/api/v1/simulate/ppc',
        payload: {
          priorYearNetTax: 12000,
          priorYearWithholding: 0,
          currentYearEstimatedTax: 8000,
          currentYearWithholding: 2000
        }
      },
      efatura: {
        url: '/api/v1/efatura/optimize',
        payload: {
          categories: {
            despesasGerais: 600,
            saude: 750,
            educacao: 400,
            habitacao: 3600,
            ivaRestauracao: 1200
          },
          pprInvested: 1500,
          age: 32
        }
      }
    };

    let currentKey = 'simplificado';

    function loadExample(key) {
      currentKey = key;
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('req-box').innerText = JSON.stringify(examples[key].payload, null, 2);
    }

    async function executeCurrentRequest() {
      const endpoint = examples[currentKey].url;
      const resBox = document.getElementById('res-box');
      resBox.innerText = 'Loading...';
      try {
        const payload = JSON.parse(document.getElementById('req-box').innerText);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        resBox.innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        resBox.innerText = 'Error: ' + err.message;
      }
    }

    // Init first example
    document.getElementById('req-box').innerText = JSON.stringify(examples.simplificado.payload, null, 2);
  </script>
</body>
</html>`);
});

app.use(notFoundHandler);
app.use(errorHandler);
