// Pure financial calculations, shared between the browser app (loaded via
// <script src="calc.js">, exposes window.BudgetCalc) and the test suite
// (loaded via require("./calc.js") in Node). No DOM, no I/O — this file
// only computes numbers from a state object, so it's safe to unit test.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BudgetCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function sum(arr, key) {
    key = key || "amount";
    return arr.reduce((a, x) => a + x[key], 0);
  }

  // Net change in savings over a set of entries: deposits add, withdrawals subtract.
  function savingsBalance(arr) {
    return arr.reduce((a, s) => a + (s.type === "withdraw" ? -s.amount : s.amount), 0);
  }

  // Everything that makes up one month's cash flow.
  // net = money in, minus expenses, minus liability payments, minus net savings moved away.
  function totals(state, m) {
    const income = sum(state.income.filter((i) => i.date.startsWith(m)));
    const expenses = sum(state.expenses.filter((e) => e.date.startsWith(m)));
    const debt = sum(state.payments.filter((p) => p.month === m));
    const saved = savingsBalance(state.savings.filter((s) => s.date.startsWith(m)));
    return { income, expenses, debt, saved, net: income - expenses - debt - saved };
  }

  // A liability saved before "original" existed only has a balance + payment
  // history; reconstruct what it started at so progress bars still work.
  function ensureOriginal(liability, paymentsForLiability) {
    if (liability.original) return liability.original;
    return +(liability.balance + sum(paymentsForLiability)).toFixed(2);
  }

  function budgetProgress(spent, limit) {
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    return { pct, over: spent > limit, overBy: Math.max(0, +(spent - limit).toFixed(2)) };
  }

  // Is a liability's payment due soon or overdue, given "today" and whether
  // it has already been paid this month? Returns null, "overdue", or "soon".
  function dueStatus(liability, paidThisMonth, today) {
    if (!liability.dueDay || liability.balance <= 0 || paidThisMonth) return null;
    const day = today.getDate();
    if (day > liability.dueDay) return "overdue";
    if (liability.dueDay - day <= 5) return "soon";
    return null;
  }

  return { sum, savingsBalance, totals, ensureOriginal, budgetProgress, dueStatus };
});
