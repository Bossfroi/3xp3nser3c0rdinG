// Run with: node tests/calculations.test.js
// Plain Node assertions, no test framework — keeps the project dependency-free.
const assert = require("node:assert/strict");
const { sum, savingsBalance, totals, ensureOriginal, budgetProgress, dueStatus } = require("../calc.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (e) {
    console.error(`  FAIL - ${name}`);
    console.error(`    ${e.message}`);
    process.exitCode = 1;
  }
}

console.log("sum()");
test("adds amount fields", () => {
  assert.equal(sum([{ amount: 10 }, { amount: 5.5 }]), 15.5);
});
test("returns 0 for an empty array", () => {
  assert.equal(sum([]), 0);
});

console.log("savingsBalance()");
test("deposits increase the balance", () => {
  assert.equal(savingsBalance([{ type: "deposit", amount: 100 }]), 100);
});
test("withdrawals decrease the balance", () => {
  assert.equal(savingsBalance([{ type: "deposit", amount: 100 }, { type: "withdraw", amount: 40 }]), 60);
});

console.log("totals()");
const sampleState = {
  income: [
    { date: "2026-09-15", amount: 30000 },
    { date: "2026-09-20", amount: 5000 },
    { date: "2026-08-15", amount: 30000 }, // different month, must be excluded
  ],
  expenses: [
    { date: "2026-09-03", amount: 4500 },
    { date: "2026-09-10", amount: 2200 },
  ],
  payments: [
    { month: "2026-09", amount: 5000 },
    { month: "2026-08", amount: 5000 }, // different month, must be excluded
  ],
  savings: [
    { date: "2026-09-16", type: "deposit", amount: 3000 },
  ],
};
test("sums only the requested month's income and expenses", () => {
  const t = totals(sampleState, "2026-09");
  assert.equal(t.income, 35000);
  assert.equal(t.expenses, 6700);
});
test("includes liability payments and savings moved in net cash flow", () => {
  const t = totals(sampleState, "2026-09");
  assert.equal(t.debt, 5000);
  assert.equal(t.saved, 3000);
  assert.equal(t.net, 35000 - 6700 - 5000 - 3000);
});
test("a month with no activity returns all zeros", () => {
  const t = totals(sampleState, "2026-01");
  assert.deepEqual(t, { income: 0, expenses: 0, debt: 0, saved: 0, net: 0 });
});
test("a withdrawal that exceeds that month's deposits lowers net savings (raises cash flow)", () => {
  const state = { income: [], expenses: [], payments: [], savings: [{ date: "2026-09-01", type: "withdraw", amount: 200 }] };
  const t = totals(state, "2026-09");
  assert.equal(t.saved, -200);
  assert.equal(t.net, 200); // withdrawing cash counts as cash flowing in
});

console.log("ensureOriginal()");
test("uses the stored original amount when present", () => {
  assert.equal(ensureOriginal({ original: 75000, balance: 60000 }, []), 75000);
});
test("reconstructs the original from balance + payment history when missing", () => {
  const liability = { balance: 60000 }; // no "original" field (older data)
  const payments = [{ amount: 5000 }, { amount: 10000 }];
  assert.equal(ensureOriginal(liability, payments), 75000);
});

console.log("budgetProgress()");
test("under budget", () => {
  const p = budgetProgress(4000, 6000);
  assert.equal(p.over, false);
  assert.ok(Math.abs(p.pct - 66.6667) < 0.01);
  assert.equal(p.overBy, 0);
});
test("over budget", () => {
  const p = budgetProgress(7000, 6000);
  assert.equal(p.over, true);
  assert.equal(p.pct, 100);
  assert.equal(p.overBy, 1000);
});
test("zero limit does not divide by zero", () => {
  const p = budgetProgress(500, 0);
  assert.equal(p.pct, 0);
});

console.log("dueStatus()");
test("overdue when today is past the due day and unpaid", () => {
  const today = new Date(2026, 8, 20); // Sep 20
  assert.equal(dueStatus({ dueDay: 15, balance: 1000 }, false, today), "overdue");
});
test("due soon within 5 days and unpaid", () => {
  const today = new Date(2026, 8, 11); // Sep 11, due on 15th
  assert.equal(dueStatus({ dueDay: 15, balance: 1000 }, false, today), "soon");
});
test("no warning once this month is already paid", () => {
  const today = new Date(2026, 8, 20);
  assert.equal(dueStatus({ dueDay: 15, balance: 1000 }, true, today), null);
});
test("no warning once the liability is fully paid off", () => {
  const today = new Date(2026, 8, 20);
  assert.equal(dueStatus({ dueDay: 15, balance: 0 }, false, today), null);
});

console.log(`\n${passed} test(s) passed.`);
