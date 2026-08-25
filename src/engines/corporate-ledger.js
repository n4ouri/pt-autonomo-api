/**
 * Corporate Ledger (SNC - Sistema de Normalização Contabilística)
 * Basic double-entry bookkeeping engine.
 */

export class CorporateLedger {
  constructor() {
    this.transactions = [];
    this.accounts = new Map();
  }

  /**
   * Add a double-entry transaction.
   * @param {Date|string} date 
   * @param {string} description 
   * @param {Array<{account: string, debit?: number, credit?: number}>} entries 
   */
  addTransaction(date, description, entries) {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      if (entry.debit) totalDebit += entry.debit;
      if (entry.credit) totalCredit += entry.credit;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Transaction unbalance: Debits (${totalDebit}) !== Credits (${totalCredit})`);
    }

    const transaction = { id: this.transactions.length + 1, date, description, entries };
    this.transactions.push(transaction);

    // Update balances
    for (const entry of entries) {
      const current = this.accounts.get(entry.account) || { debit: 0, credit: 0, balance: 0 };
      if (entry.debit) current.debit += entry.debit;
      if (entry.credit) current.credit += entry.credit;
      
      // Asset/Expense accounts (classes 1, 2, 3, 6) increase with debit.
      // Liability/Equity/Revenue accounts (classes 2, 4, 5, 7) increase with credit.
      // We store raw debit/credit and calculate standard balance loosely.
      current.balance = current.debit - current.credit; 
      
      this.accounts.set(entry.account, current);
    }
  }

  getTrialBalance() {
    const balancete = [];
    for (const [account, data] of this.accounts.entries()) {
      balancete.push({
        account,
        totalDebit: data.debit,
        totalCredit: data.credit,
        balance: data.balance
      });
    }
    balancete.sort((a, b) => a.account.localeCompare(b.account));
    return balancete;
  }
}
