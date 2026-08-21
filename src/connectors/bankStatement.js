export const name = 'bankStatement';

const CSV_HEADER_ALIASES = {
  date: ['date', 'data', 'data valor', 'data mov.', 'transaction date'],
  description: ['description', 'descrição', 'descricao', 'memo', 'histórico', 'historico'],
  amount: ['amount', 'montante', 'valor'],
  debit: ['debit', 'débito', 'debito'],
  credit: ['credit', 'crédito', 'credito']
};

function normalizeHeader(h) {
  return h.trim().toLowerCase();
}

function resolveColumns(headerRow) {
  const headers = headerRow.map(normalizeHeader);
  const resolved = {};
  for (const [field, aliases] of Object.entries(CSV_HEADER_ALIASES)) {
    const idx = headers.findIndex((h) => aliases.includes(h));
    if (idx !== -1) resolved[field] = idx;
  }
  return resolved;
}

function parseCsvLine(line, delimiter) {
  return line.split(delimiter).map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'));
}

function parseAmount(str) {
  if (!str) return null;
  const normalized = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Parses a bank CSV export into normalized transaction inputs. Supports either a
 * single signed "amount" column, or separate "debit"/"credit" columns — whichever
 * the export uses. Category for income defaults to OUTROS_SERVICOS (bank statements
 * don't carry enough context to tell services from sales); recategorize afterward
 * via PATCH /api/v1/me/transactions/:id if needed.
 */
export function parseBankCsv(text, { delimiter = ';' } = {}) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const columns = resolveColumns(parseCsvLine(lines[0], delimiter));
  if (columns.date === undefined || (columns.amount === undefined && columns.debit === undefined && columns.credit === undefined)) {
    throw new Error('CSV header must include a date column and either an amount column or debit/credit columns.');
  }

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line, delimiter);
    const dateRaw = cells[columns.date];
    if (!dateRaw) continue;

    let amount;
    if (columns.amount !== undefined) {
      amount = parseAmount(cells[columns.amount]);
    } else {
      const debit = columns.debit !== undefined ? parseAmount(cells[columns.debit]) : null;
      const credit = columns.credit !== undefined ? parseAmount(cells[columns.credit]) : null;
      amount = (credit || 0) - (debit || 0);
    }
    if (amount === null || amount === 0) continue;

    rows.push({
      date: normalizeDate(dateRaw),
      amount: Math.abs(amount),
      type: amount > 0 ? 'income' : 'expense',
      category: amount > 0 ? 'OUTROS_SERVICOS' : 'DESPESAS_GERAIS',
      description: columns.description !== undefined ? cells[columns.description] : null,
      vatRate: 0,
      isJustifiedExpense: false,
      source: 'bank_import'
    });
  }
  return rows;
}

function normalizeDate(raw) {
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const euMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (euMatch) {
    const [, d, m, y] = euMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  throw new Error(`Unrecognized date format: "${raw}" (expected YYYY-MM-DD or DD/MM/YYYY).`);
}

/** Parses OFX/QFX bank exports (STMTTRN blocks) into the same normalized shape as parseBankCsv. */
export function parseBankOfx(text) {
  const rows = [];
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
  for (const block of blocks) {
    const amountMatch = block.match(/<TRNAMT>([-\d.]+)/i);
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const memoMatch = block.match(/<MEMO>([^\n<]*)/i) || block.match(/<NAME>([^\n<]*)/i);
    if (!amountMatch || !dateMatch) continue;

    const amount = Number.parseFloat(amountMatch[1]);
    if (!Number.isFinite(amount) || amount === 0) continue;

    const raw = dateMatch[1];
    rows.push({
      date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
      amount: Math.abs(amount),
      type: amount > 0 ? 'income' : 'expense',
      category: amount > 0 ? 'OUTROS_SERVICOS' : 'DESPESAS_GERAIS',
      description: memoMatch ? memoMatch[1].trim() : null,
      vatRate: 0,
      isJustifiedExpense: false,
      source: 'bank_import'
    });
  }
  return rows;
}
