import { test } from 'node:test';
import assert from 'node:assert';
import { optimizeEFaturaDeductions } from '../src/engines/efatura-optimizer.js';

test('e-Fatura Optimizer - Caps General Expenses at 250 € (single)', () => {
  const result = optimizeEFaturaDeductions({
    categories: {
      despesasGerais: 1000 // 1000 * 35% = 350, capped at 250
    },
    isMarried: false
  });

  assert.strictEqual(result.categories.despesasGerais.deductionObtained, 250);
  assert.strictEqual(result.categories.despesasGerais.isCapped, true);
  assert.strictEqual(result.categories.despesasGerais.headroomRemaining, 0);
});

test('e-Fatura Optimizer - Computes remaining headroom accurately', () => {
  const result = optimizeEFaturaDeductions({
    categories: {
      saude: 2000 // 2000 * 15% = 300 (max is 1000)
    }
  });

  assert.strictEqual(result.categories.saude.deductionObtained, 300);
  assert.strictEqual(result.categories.saude.isCapped, false);
  assert.strictEqual(result.categories.saude.headroomRemaining, 700);
  assert.strictEqual(result.categories.saude.spendNeededToMax, 4666.67);
});
