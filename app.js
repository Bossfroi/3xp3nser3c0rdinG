(() => {
  "use strict";

  // Login and data now live on the server: /api/auth/login checks the
  // username/password (kept in Vercel env vars) and sets an httpOnly cookie;
  // /api/data reads and writes db.json in GitHub. Nothing secret is in this file.
  const LANG_KEY = "budgetbook.lang";
  const CHECKLIST_KEY = "budgetbook.checklist.dismissed";
  const CATEGORIES = ["Food", "Transport", "Bills", "Rent", "Health", "Education", "Shopping", "Other"];

  /* ---------- language ---------- */
  const I18N = {
    en: {
      langBtn: "Tagalog",
      loginIntro: "Sign in to see your income, expenses, savings, liabilities and cash flow.",
      username: "Username", password: "Password", signIn: "Sign in",
      loginError: "Wrong username or password. Try again.",
      signingIn: "Signing in…", networkError: "Couldn't reach the server. Check your connection.",
      loadError: "Couldn't load your data: {m}",
      saving: "Saving…", savedStatus: "All changes saved", saveError: "Not saved",
      sessionExpired: "Your session expired. Please sign in again.",
      month: "Month", export: "Export JSON", import: "Import JSON", logout: "Log out",
      heroLabel: "Net cash flow for {m}",
      moneyIn: "Money in", expenses: "Expenses", liabPayments: "Liability payments",
      savedMonth: "Saved this month", totalSavings: "Total savings", totalOwed: "Total still owed",
      trend: "Last 6 months", legendIn: "Money in",
      legendOut: "Money out (expenses, liability payments, savings)",
      income: "Income", savings: "Savings", liabilities: "Liabilities", budgets: "Monthly budget",
      incSource: "Source (e.g. Salary)", amount: "Amount", date: "Date", category: "Category",
      addIncome: "Add income",
      expDesc: "What did you buy?", addExpense: "Add expense",
      savType: "Type", depositOpt: "Deposit (add to savings)", withdrawOpt: "Withdraw (take from savings)",
      savNote: "Note (e.g. Emergency fund)", addEntry: "Add entry",
      liabName: "Who do you owe? (e.g. Loan)", loanAmount: "Loan amount (e.g. 75000)",
      usualMonthly: "Usual monthly payment (optional)", dueDayPh: "Due day of month, 1-31 (optional)",
      addLiab: "Add liability",
      budgetLimit: "Monthly limit", setBudget: "Set budget",
      edit: "Edit", del: "Delete", remove: "Remove", cancel: "Cancel", saveChanges: "Save changes",
      delLiab: "Delete liability",
      emptyIncome: "No income this month. Add your first one above.",
      emptyExpense: "No expenses this month. Add one above.",
      emptySavings: "No savings entries this month.",
      emptyLiab: "No liabilities. Add a loan or debt above.",
      emptyBudget: "No budgets yet. Pick a category above.",
      remaining: "Remaining. Paid {p} of {o}", payAmount: "Payment amount", addPayment: "Add payment",
      fullyPaid: "Fully paid. No balance left.", paymentsIn: "Payments in {m}: {a}",
      dueOn: "Due on day {d} of each month", overdue: "Overdue", dueSoon: "Due soon",
      budgetOf: "{s} of {l} spent", overBy: "Over budget by {a}",
      depositLbl: "Deposit", withdrawLbl: "Withdrawal",
      noRecords: "Nothing recorded for this month yet.",
      overspent: "You spent more than you had coming in this month.",
      okNote: "Money in minus expenses, liability payments and savings.",
      noPayOne: "{n} liability has no payment yet this month.",
      noPayMany: "{n} liabilities have no payment yet this month.",
      confirmDelLiab: 'Delete "{n}" and its payment history?',
      confirmDelEntry: 'Delete "{n}"? This can\'t be undone.',
      confirmReplace: "Replace all current data with this file?",
      badFile: "That file is not valid JSON. Pick the data.json you exported.",
      cantWithdraw: "You can't withdraw more than your total savings ({a}).",
      catFood: "Food", catTransport: "Transport", catBills: "Bills", catRent: "Rent",
      catHealth: "Health", catEducation: "Education", catShopping: "Shopping", catOther: "Other",
      skipToContent: "Skip to main content", loadingApp: "Loading…",
      checklistTitle: "Getting started", dismiss: "Dismiss",
      checkIncome: "Add your first income entry", checkExpense: "Add your first expense",
      checkBudget: "Set a monthly budget for a category", checkSavings: "Record a savings deposit",
      checkLiability: "Add a loan or debt, if you have one (optional)",
      go: "Go",
    },
    tl: {
      langBtn: "English",
      loginIntro: "Mag-sign in para makita ang kita, gastos, ipon, utang at cash flow mo.",
      username: "Username", password: "Password", signIn: "Mag-sign in",
      loginError: "Mali ang username o password. Subukan ulit.",
      signingIn: "Nagsa-sign in…", networkError: "Hindi ma-reach ang server. I-check ang koneksyon mo.",
      loadError: "Hindi ma-load ang data mo: {m}",
      saving: "Sine-save…", savedStatus: "Naka-save na ang lahat", saveError: "Hindi na-save",
      sessionExpired: "Expired na ang session mo. Mag-sign in ulit.",
      month: "Buwan", export: "I-export ang JSON", import: "I-import ang JSON", logout: "Mag-log out",
      heroLabel: "Net cash flow para sa {m}",
      moneyIn: "Pumasok na pera", expenses: "Gastos", liabPayments: "Bayad sa utang",
      savedMonth: "Naipon ngayong buwan", totalSavings: "Kabuuang ipon", totalOwed: "Kabuuang utang pa",
      trend: "Huling 6 na buwan", legendIn: "Pumasok na pera",
      legendOut: "Lumabas na pera (gastos, bayad sa utang, ipon)",
      income: "Kita", savings: "Ipon", liabilities: "Utang", budgets: "Budget kada buwan",
      incSource: "Pinagmulan (hal. Sweldo)", amount: "Halaga", date: "Petsa", category: "Category",
      addIncome: "Magdagdag ng kita",
      expDesc: "Ano ang binili mo?", addExpense: "Magdagdag ng gastos",
      savType: "Uri", depositOpt: "Deposito (dagdag sa ipon)", withdrawOpt: "Withdraw (kuha sa ipon)",
      savNote: "Tala (hal. Emergency fund)", addEntry: "Idagdag",
      liabName: "Kanino ka may utang? (hal. Loan)", loanAmount: "Halaga ng utang (hal. 75000)",
      usualMonthly: "Karaniwang buwanang bayad (opsyonal)", dueDayPh: "Araw ng due sa buwan, 1-31 (opsyonal)",
      addLiab: "Magdagdag ng utang",
      budgetLimit: "Limit kada buwan", setBudget: "I-set ang budget",
      edit: "I-edit", del: "Burahin", remove: "Alisin", cancel: "Kanselahin", saveChanges: "I-save ang pagbabago",
      delLiab: "Burahin ang utang",
      emptyIncome: "Wala pang kita ngayong buwan. Magdagdag sa itaas.",
      emptyExpense: "Wala pang gastos ngayong buwan. Magdagdag sa itaas.",
      emptySavings: "Wala pang ipon na naitala ngayong buwan.",
      emptyLiab: "Wala pang utang. Magdagdag ng loan sa itaas.",
      emptyBudget: "Wala pang budget. Pumili ng category sa itaas.",
      remaining: "Natitira. Nabayaran na {p} sa {o}", payAmount: "Halaga ng bayad", addPayment: "Magdagdag ng bayad",
      fullyPaid: "Bayad na lahat. Wala nang natitira.", paymentsIn: "Mga bayad sa {m}: {a}",
      dueOn: "Due tuwing ika-{d} ng buwan", overdue: "Lampas na sa due", dueSoon: "Malapit na ang due",
      budgetOf: "{s} sa {l} ang nagastos", overBy: "Lampas sa budget ng {a}",
      depositLbl: "Deposito", withdrawLbl: "Withdraw",
      noRecords: "Wala pang naitala para sa buwang ito.",
      overspent: "Mas malaki ang lumabas kaysa pumasok ngayong buwan.",
      okNote: "Pumasok na pera bawas ang gastos, bayad sa utang at ipon.",
      noPayOne: "{n} utang ang wala pang bayad ngayong buwan.",
      noPayMany: "{n} utang ang wala pang bayad ngayong buwan.",
      confirmDelLiab: 'Burahin ang "{n}" at ang history ng bayad nito?',
      confirmDelEntry: 'Burahin ang "{n}"? Hindi na ito maibabalik.',
      confirmReplace: "Palitan ang lahat ng kasalukuyang data ng file na ito?",
      badFile: "Hindi valid na JSON ang file na iyon. Piliin ang data.json na na-export mo.",
      cantWithdraw: "Hindi ka pwedeng mag-withdraw ng higit sa kabuuang ipon mo ({a}).",
      catFood: "Pagkain", catTransport: "Pamasahe", catBills: "Bills", catRent: "Upa",
      catHealth: "Kalusugan", catEducation: "Edukasyon", catShopping: "Shopping", catOther: "Iba pa",
      skipToContent: "Lumaktaw papunta sa nilalaman", loadingApp: "Nilo-load…",
      checklistTitle: "Mga unang hakbang", dismiss: "Itago",
      checkIncome: "Magdagdag ng unang kita", checkExpense: "Magdagdag ng unang gastos",
      checkBudget: "Mag-set ng monthly budget sa isang category", checkSavings: "Mag-record ng deposito sa ipon",
      checkLiability: "Magdagdag ng utang, kung meron (opsyonal)",
      go: "Puntahan",
    },
  };

  let lang = "en";
  try { lang = localStorage.getItem(LANG_KEY) === "tl" ? "tl" : "en"; } catch (e) { /* ignore */ }

  const t = (key, vars = {}) => {
    let s = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
    return s;
  };
  const locale = () => (lang === "tl" ? "fil-PH" : "en-PH");

  /* ---------- basics ---------- */
  const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  // Pure financial math lives in calc.js (shared with the test suite in
  // tests/calculations.test.js) — reused here rather than duplicated.
  const { sum, savingsBalance, ensureOriginal: calcEnsureOriginal, budgetProgress, dueStatus: calcDueStatus } = window.BudgetCalc;

  let state = { income: [], expenses: [], savings: [], liabilities: [], payments: [], budgets: {} };
  let month = todayStr().slice(0, 7);
  const editing = { income: null, expense: null, savings: null, liab: null };
  const FORM_INFO = {
    income: { sel: "#income-form", label: "addIncome" },
    expense: { sel: "#expense-form", label: "addExpense" },
    savings: { sel: "#savings-form", label: "addEntry" },
    liab: { sel: "#liab-form", label: "addLiab" },
  };

  /* ---------- data: db.json in GitHub, read/written through /api/data ---------- */
  function normalize(d) {
    d = d || {};
    const arr = (x) => (Array.isArray(x) ? x : []);
    return {
      income: arr(d.income),
      expenses: arr(d.expenses),
      savings: arr(d.savings),
      liabilities: arr(d.liabilities),
      payments: arr(d.payments),
      budgets: d.budgets && typeof d.budgets === "object" && !Array.isArray(d.budgets) ? d.budgets : {},
    };
  }

  // Fetch the current db.json from the server. Throws with .unauthorized = true
  // if the session cookie is missing/expired, so callers can show the login form.
  async function loadData() {
    const res = await fetch("/api/data", { credentials: "same-origin", cache: "no-store" });
    if (res.status === 401) {
      const err = new Error("Not signed in");
      err.unauthorized = true;
      throw err;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to load data (${res.status})`);
    }
    return normalize(await res.json());
  }

  // Save the entire current state to db.json. Every call is one GitHub commit.
  let saveToken = 0;
  async function save() {
    const my = ++saveToken;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (res.status === 401) {
        if (my === saveToken) { setSaveStatus("error", t("sessionExpired")); showLogin(); }
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      if (my === saveToken) setSaveStatus("saved");
    } catch (e) {
      console.error(e);
      if (my === saveToken) setSaveStatus("error", e.message);
    }
  }

  function setSaveStatus(kind, message) {
    const el = $("#save-status");
    if (!el) return;
    el.className = "save-status " + kind;
    if (kind === "saving") el.textContent = t("saving");
    else if (kind === "saved") el.textContent = t("savedStatus");
    else el.textContent = message ? `${t("saveError")}: ${message}` : t("saveError");
  }

  /* ---------- helpers ---------- */
  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return n;
  }

  function monthLabel(m, style = "long") {
    const [y, mo] = m.split("-").map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString(locale(),
      style === "long" ? { month: "long", year: "numeric" } : { month: "short" });
  }

  function shiftMonth(m, delta) {
    const [y, mo] = m.split("-").map(Number);
    const d = new Date(y, mo - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }

  function fmtDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale(), { month: "short", day: "numeric" });
  }

  function totals(m) {
    return window.BudgetCalc.totals(state, m);
  }

  function defaultDate() {
    return todayStr().startsWith(month) ? todayStr() : `${month}-01`;
  }

  function readAmount(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }

  /* ---------- static text + language ---------- */
  function fillCategorySelects() {
    for (const sel of ["#expense-form select[name=category]", "#budget-form select[name=category]"]) {
      const select = $(sel);
      const current = select.value;
      select.replaceChildren(...CATEGORIES.map((c) => el("option", { value: c }, t("cat" + c))));
      if (current) select.value = current;
    }
  }

  function applyStaticText() {
    document.documentElement.lang = lang === "tl" ? "fil" : "en";
    $$("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
    $$("[data-i18n-ph]").forEach((n) => {
      const text = t(n.dataset.i18nPh);
      n.setAttribute("aria-label", text);
      if (n.tagName === "INPUT") n.setAttribute("placeholder", text);
    });
    $$(".lang-btn").forEach((b) => { b.textContent = t("langBtn"); });
    // keep "Save changes" on forms that are being edited
    for (const [key, info] of Object.entries(FORM_INFO)) {
      if (editing[key]) $(info.sel).querySelector(".submit-btn").textContent = t("saveChanges");
    }
  }

  /* ---------- edit mode ---------- */
  function startEdit(key, id, values) {
    editing[key] = id;
    const form = $(FORM_INFO[key].sel);
    for (const [name, val] of Object.entries(values)) form.elements[name].value = val;
    form.querySelector(".submit-btn").textContent = t("saveChanges");
    form.querySelector(".cancel-btn").hidden = false;
    form.elements[Object.keys(values)[0]].focus();
    form.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function endEdit(key) {
    editing[key] = null;
    const info = FORM_INFO[key];
    const form = $(info.sel);
    form.reset();
    if (form.elements.date) form.elements.date.value = defaultDate();
    form.querySelector(".submit-btn").textContent = t(info.label);
    form.querySelector(".cancel-btn").hidden = true;
    const err = form.querySelector(".form-error");
    if (err) err.hidden = true;
  }

  const editBtn = (name, fn) =>
    el("button", { class: "btn small ghost edit", type: "button", "aria-label": `${t("edit")}: ${name}`, onclick: fn }, t("edit"));
  const delBtn = (name, fn) =>
    el("button", { class: "btn small ghost", type: "button", "aria-label": `${t("del")}: ${name}`, onclick: fn }, t("del"));

  /* ---------- render: summary + trend ---------- */
  function renderSummary() {
    const tt = totals(month);
    $("#hero-title").textContent = t("heroLabel", { m: monthLabel(month) });
    const net = $("#hero-net");
    net.textContent = peso.format(tt.net);
    net.className = "hero-net " + (tt.net < 0 ? "neg" : "pos");

    $("#fig-income").textContent = peso.format(tt.income);
    $("#fig-expenses").textContent = peso.format(tt.expenses);
    $("#fig-debt").textContent = peso.format(tt.debt);
    $("#fig-saved").textContent = peso.format(tt.saved);
    $("#fig-savings").textContent = peso.format(savingsBalance(state.savings));
    $("#fig-owed").textContent = peso.format(sum(state.liabilities, "balance"));

    // Same rule as each liability card's badge: any unpaid liability with a
    // due day counts, whether or not it has a "usual monthly payment" set.
    const dueCount = state.liabilities.filter((l) => {
      const paidThisMonth = state.payments.some((p) => p.liabilityId === l.id && p.month === month);
      return dueStatus(l, paidThisMonth) !== null;
    }).length;
    let note;
    if (!tt.income && !tt.expenses && !tt.debt && !tt.saved) note = t("noRecords");
    else if (tt.net < 0) note = t("overspent");
    else note = t("okNote");
    if (dueCount) note += " " + t(dueCount > 1 ? "noPayMany" : "noPayOne", { n: dueCount });
    $("#hero-note").textContent = note;

    const bar = $("#split-bar");
    bar.replaceChildren();
    const saveOut = Math.max(tt.saved, 0);
    const extraIn = Math.max(-tt.saved, 0);
    const total = Math.max(tt.income + extraIn, tt.expenses + tt.debt + saveOut);
    if (total > 0) {
      const seg = (cls, val) => val > 0 && bar.append(el("span", { class: cls, style: `width:${(val / total) * 100}%` }));
      seg("expense", tt.expenses);
      seg("debt", tt.debt);
      seg("save", saveOut);
      seg("left", Math.max(tt.net, 0));
    }
    bar.setAttribute("aria-label",
      `${t("moneyIn")} ${peso.format(tt.income)}; ${t("expenses")} ${peso.format(tt.expenses)}; ` +
      `${t("liabPayments")} ${peso.format(tt.debt)}; ${t("savedMonth")} ${peso.format(tt.saved)}`);
  }

  function renderTrend() {
    const chart = $("#trend-chart");
    chart.replaceChildren();
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
    const data = months.map((m) => {
      const tt = totals(m);
      return { m, inn: tt.income + Math.max(-tt.saved, 0), out: tt.expenses + tt.debt + Math.max(tt.saved, 0) };
    });
    const max = Math.max(1, ...data.flatMap((d) => [d.inn, d.out]));
    for (const d of data) {
      chart.append(el("div", {
        class: "trend-col" + (d.m === month ? " current" : ""),
        title: `${monthLabel(d.m)}: ${peso.format(d.inn)} / ${peso.format(d.out)}`,
      },
        el("div", { class: "trend-bars" },
          el("i", { class: "in", style: `height:${(d.inn / max) * 100}%` }),
          el("i", { class: "outb", style: `height:${(d.out / max) * 100}%` })),
        el("span", { class: "trend-label" }, monthLabel(d.m, "short"))));
    }
  }

  /* ---------- render: lists ---------- */
  function fillList(ul, items, build, emptyText) {
    ul.replaceChildren();
    if (!items.length) { ul.append(el("li", { class: "empty" }, emptyText)); return; }
    items.forEach((it) => ul.append(build(it)));
  }

  const byDateDesc = (a, b) => b.date.localeCompare(a.date);

  function renderIncome() {
    const items = state.income.filter((i) => i.date.startsWith(month)).sort(byDateDesc);
    fillList($("#income-list"), items, (i) => el("li", {},
      el("span", { class: "title" }, i.description),
      el("span", { class: "amount income" }, peso.format(i.amount)),
      el("span", {}),
      el("span", { class: "meta" }, fmtDate(i.date)),
      el("span", { class: "actions" },
        editBtn(i.description, () => { showMonthOf(i.date); startEdit("income", i.id, { description: i.description, amount: i.amount, date: i.date }); }),
        delBtn(i.description, () => {
          if (!confirm(t("confirmDelEntry", { n: i.description }))) return;
          state.income = state.income.filter((x) => x.id !== i.id);
          if (editing.income === i.id) endEdit("income");
          commit();
        }))
    ), t("emptyIncome"));
  }

  function renderExpenses() {
    const items = state.expenses.filter((e) => e.date.startsWith(month)).sort(byDateDesc);
    fillList($("#expense-list"), items, (e) => el("li", {},
      el("span", { class: "title" }, e.description),
      el("span", { class: "amount expense" }, peso.format(e.amount)),
      el("span", {}),
      el("span", { class: "meta" }, `${t("cat" + e.category)} · ${fmtDate(e.date)}`),
      el("span", { class: "actions" },
        editBtn(e.description, () => startEdit("expense", e.id, { description: e.description, category: e.category, amount: e.amount, date: e.date })),
        delBtn(e.description, () => {
          if (!confirm(t("confirmDelEntry", { n: e.description }))) return;
          state.expenses = state.expenses.filter((x) => x.id !== e.id);
          if (editing.expense === e.id) endEdit("expense");
          commit();
        }))
    ), t("emptyExpense"));
  }

  function renderSavings() {
    $("#savings-total").textContent = peso.format(savingsBalance(state.savings));
    const items = state.savings.filter((s) => s.date.startsWith(month)).sort(byDateDesc);
    fillList($("#savings-list"), items, (s) => {
      const isW = s.type === "withdraw";
      const name = s.description || t(isW ? "withdrawLbl" : "depositLbl");
      return el("li", {},
        el("span", { class: "title" }, name),
        el("span", { class: "amount " + (isW ? "withdraw" : "save") }, (isW ? "−" : "+") + peso.format(s.amount)),
        el("span", {}),
        el("span", { class: "meta" }, `${t(isW ? "withdrawLbl" : "depositLbl")} · ${fmtDate(s.date)}`),
        el("span", { class: "actions" },
          editBtn(name, () => startEdit("savings", s.id, { type: s.type, description: s.description || "", amount: s.amount, date: s.date })),
          delBtn(name, () => {
            if (!confirm(t("confirmDelEntry", { n: name }))) return;
            state.savings = state.savings.filter((x) => x.id !== s.id);
            if (editing.savings === s.id) endEdit("savings");
            commit();
          })));
    }, t("emptySavings"));
  }

  function paymentsOf(l) { return state.payments.filter((p) => p.liabilityId === l.id); }

  // older saved data may not have "original"; work it out from balance + payments
  function ensureOriginal(l) {
    if (!l.original) l.original = calcEnsureOriginal(l, paymentsOf(l));
    return l.original;
  }

  function addPayment(l, amount) {
    ensureOriginal(l);
    amount = Math.min(amount, l.balance);
    if (!(amount > 0)) return;
    l.balance = +(l.balance - amount).toFixed(2);
    state.payments.push({ id: uid(), liabilityId: l.id, month, amount, date: defaultDate() });
    commit();
  }

  function removePayment(l, p) {
    ensureOriginal(l);
    l.balance = +(l.balance + p.amount).toFixed(2);
    state.payments = state.payments.filter((x) => x.id !== p.id);
    commit();
  }

  function dueStatus(l, paidThisMonth) {
    // Due reminders only make sense while looking at the real current month.
    if (month !== todayStr().slice(0, 7)) return null;
    return calcDueStatus(l, paidThisMonth, new Date());
  }

  function renderLiabilities() {
    fillList($("#liab-list"), state.liabilities, (l) => {
      const original = ensureOriginal(l);
      const paidTotal = Math.max(0, original - l.balance);
      const pct = original > 0 ? Math.min(100, (paidTotal / original) * 100) : 0;
      const thisMonth = paymentsOf(l).filter((p) => p.month === month)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const status = dueStatus(l, thisMonth.length > 0);

      const parts = [
        el("div", { class: "liab-head" },
          el("span", { class: "title" }, l.name),
          el("span", { class: "amount" }, peso.format(l.balance))),
        el("div", { class: "meta" }, t("remaining", { p: peso.format(paidTotal), o: peso.format(original) })),
        el("div", { class: "progress", role: "img", "aria-label": `${Math.round(pct)}%` }, el("span", { style: `width:${pct}%` })),
      ];

      if (l.dueDay) {
        parts.push(el("div", { class: "meta" }, t("dueOn", { d: l.dueDay }), " ",
          status ? el("span", { class: "badge " + status }, t(status === "overdue" ? "overdue" : "dueSoon")) : null));
      }

      if (l.balance > 0) {
        const input = el("input", {
          type: "number", name: "amount", min: "0.01", max: String(l.balance), step: "0.01", required: "",
          placeholder: t("payAmount"), "aria-label": `${t("payAmount")}: ${l.name}`,
          value: l.monthly > 0 ? String(Math.min(l.monthly, l.balance)) : "",
        });
        parts.push(el("form", {
          class: "pay-form",
          onsubmit: (e) => { e.preventDefault(); addPayment(l, readAmount(input.value)); },
        }, input, el("button", { class: "btn small primary", type: "submit" }, t("addPayment"))));
      } else {
        parts.push(el("p", { class: "paid" }, t("fullyPaid")));
      }

      if (thisMonth.length) {
        parts.push(el("div", { class: "meta" }, t("paymentsIn", { m: monthLabel(month), a: peso.format(sum(thisMonth)) })));
        parts.push(el("ul", { class: "pay-history" }, thisMonth.map((p) => el("li", {},
          el("span", {}, `${p.date ? fmtDate(p.date) : monthLabel(month, "short")}: ${peso.format(p.amount)}`),
          el("button", { class: "btn small ghost", type: "button",
            "aria-label": `${t("remove")}: ${peso.format(p.amount)}`,
            onclick: () => removePayment(l, p) }, t("remove"))))));
      }

      parts.push(el("div", { class: "actions" },
        editBtn(l.name, () => startEdit("liab", l.id, { name: l.name, balance: original, monthly: l.monthly || "", dueDay: l.dueDay || "" })),
        delBtn(l.name, () => {
          if (!confirm(t("confirmDelLiab", { n: l.name }))) return;
          state.liabilities = state.liabilities.filter((x) => x.id !== l.id);
          state.payments = state.payments.filter((p) => p.liabilityId !== l.id);
          if (editing.liab === l.id) endEdit("liab");
          commit();
        })));

      return el("li", { class: "liab" }, ...parts);
    }, t("emptyLiab"));
  }

  function renderBudgets() {
    const cats = CATEGORIES.filter((c) => state.budgets[c] > 0);
    fillList($("#budget-list"), cats, (c) => {
      const limit = state.budgets[c];
      const spent = sum(state.expenses.filter((e) => e.date.startsWith(month) && e.category === c));
      const { pct, over, overBy } = budgetProgress(spent, limit);
      return el("li", { class: "budget" },
        el("div", { class: "liab-head" },
          el("span", { class: "title" }, t("cat" + c)),
          el("span", { class: "meta" }, t("budgetOf", { s: peso.format(spent), l: peso.format(limit) }))),
        el("div", { class: "progress" + (over ? " over" : ""), role: "img", "aria-label": `${Math.round(pct)}%` },
          el("span", { style: `width:${pct}%` })),
        over ? el("p", { class: "over-note" }, t("overBy", { a: peso.format(overBy) })) : null,
        el("div", { class: "actions" },
          editBtn(t("cat" + c), () => {
            const f = $("#budget-form");
            f.elements.category.value = c; f.elements.limit.value = limit; f.elements.limit.focus();
          }),
          delBtn(t("cat" + c), () => { delete state.budgets[c]; commit(); })));
    }, t("emptyBudget"));
  }

  function checklistDismissed() {
    try { return localStorage.getItem(CHECKLIST_KEY) === "1"; } catch (e) { return false; }
  }

  // A short, dismissible "Getting started" list for a brand-new user. Each
  // item checks itself off as soon as the matching kind of record exists
  // anywhere in the data (not just the selected month), and clicking an
  // unfinished item jumps straight to the right form.
  function renderChecklist() {
    const section = $("#checklist");
    const allDone =
      state.income.length > 0 && state.expenses.length > 0 &&
      Object.keys(state.budgets).length > 0 && state.savings.length > 0;
    if (checklistDismissed() || allDone) { section.hidden = true; return; }
    section.hidden = false;

    const items = [
      { done: state.income.length > 0, key: "checkIncome", target: "#section-income", focus: "#income-form input[name=description]" },
      { done: state.expenses.length > 0, key: "checkExpense", target: "#section-expense", focus: "#expense-form input[name=description]" },
      { done: Object.keys(state.budgets).length > 0, key: "checkBudget", target: "#section-budget", focus: "#budget-form select[name=category]" },
      { done: state.savings.length > 0, key: "checkSavings", target: "#section-savings", focus: "#savings-form input[name=amount]" },
      { done: state.liabilities.length > 0, key: "checkLiability", target: "#section-liab", focus: "#liab-form input[name=name]" },
    ];
    $("#checklist-items").replaceChildren(...items.map((item) =>
      el("li", { class: "checklist-item" + (item.done ? " done" : "") },
        el("span", { class: "check-mark", "aria-hidden": "true" }, item.done ? "✓" : ""),
        el("span", { class: "check-text" }, t(item.key)),
        item.done ? null : el("button", {
          class: "btn small", type: "button",
          onclick: () => {
            const target = $(item.target);
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            const field = $(item.focus);
            if (field) setTimeout(() => field.focus(), 300);
          },
        }, t("go")))));
  }

  function renderAll() {
    renderChecklist();
    renderSummary();
    renderTrend();
    renderIncome();
    renderExpenses();
    renderSavings();
    renderLiabilities();
    renderBudgets();
  }

  function render() {
    $("#month-input").value = month;
    for (const [key, info] of Object.entries(FORM_INFO)) {
      const f = $(info.sel);
      if (!editing[key] && f.elements.date) f.elements.date.value = defaultDate();
    }
    renderAll();
  }

  function commit() {
    save();
    renderAll();
  }

  // if a date from another month was used, jump to that month so it is visible
  function showMonthOf(dateStr) {
    if (dateStr && !dateStr.startsWith(month)) {
      month = dateStr.slice(0, 7);
      $("#month-input").value = month;
    }
  }

  /* ---------- forms ---------- */
  function bindForms() {
    $("#income-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const amount = readAmount(f.amount.value);
      const description = f.description.value.trim();
      if (!amount || !description) return;
      const rec = { description, amount, date: f.date.value };
      if (editing.income) Object.assign(state.income.find((x) => x.id === editing.income) || {}, rec);
      else state.income.push({ id: uid(), ...rec });
      showMonthOf(rec.date);
      endEdit("income");
      commit();
    });

    $("#expense-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const amount = readAmount(f.amount.value);
      const description = f.description.value.trim();
      if (!amount || !description) return;
      const rec = { description, category: f.category.value, amount, date: f.date.value };
      if (editing.expense) Object.assign(state.expenses.find((x) => x.id === editing.expense) || {}, rec);
      else state.expenses.push({ id: uid(), ...rec });
      showMonthOf(rec.date);
      endEdit("expense");
      commit();
    });

    $("#savings-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      const f = form.elements;
      const amount = readAmount(f.amount.value);
      if (!amount) return;
      const rec = { type: f.type.value, description: f.description.value.trim(), amount, date: f.date.value };
      const others = state.savings.filter((x) => x.id !== editing.savings);
      const available = savingsBalance(others);
      const newBalance = available + (rec.type === "withdraw" ? -amount : amount);
      const err = form.querySelector(".form-error");
      if (newBalance < 0) {
        err.textContent = t("cantWithdraw", { a: peso.format(Math.max(available, 0)) });
        err.hidden = false;
        return;
      }
      err.hidden = true;
      if (editing.savings) Object.assign(state.savings.find((x) => x.id === editing.savings) || {}, rec);
      else state.savings.push({ id: uid(), ...rec });
      showMonthOf(rec.date);
      endEdit("savings");
      commit();
    });

    $("#liab-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const original = readAmount(f.balance.value);
      const monthly = readAmount(f.monthly.value) || 0;
      const dueDay = Math.min(31, Math.max(0, parseInt(f.dueDay.value, 10) || 0));
      const name = f.name.value.trim();
      if (!original || !name) return;
      if (editing.liab) {
        const l = state.liabilities.find((x) => x.id === editing.liab);
        if (l) {
          const paid = sum(paymentsOf(l));
          Object.assign(l, { name, original, monthly, dueDay, balance: Math.max(0, +(original - paid).toFixed(2)) });
        }
      } else {
        state.liabilities.push({ id: uid(), name, original, balance: original, monthly, dueDay });
      }
      endEdit("liab");
      commit();
    });

    $("#budget-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const limit = readAmount(f.limit.value);
      if (!limit) return;
      state.budgets[f.category.value] = limit;
      e.target.reset();
      fillCategorySelects();
      commit();
    });

    for (const [key, info] of Object.entries(FORM_INFO)) {
      $(info.sel).querySelector(".cancel-btn").addEventListener("click", () => endEdit(key));
    }
  }

  /* ---------- export / import ---------- */
  function bindBackup() {
    $("#export-btn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: "data.json" });
      document.body.append(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);
    });

    $("#import-btn").addEventListener("click", () => $("#import-file").click());
    $("#import-file").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      try {
        const parsed = normalize(JSON.parse(await file.text()));
        if (!confirm(t("confirmReplace"))) return;
        state = parsed;
        Object.keys(FORM_INFO).forEach((k) => editing[k] && endEdit(k));
        save();
        render();
      } catch (err) {
        alert(t("badFile"));
      }
    });
  }

  /* ---------- login ---------- */
  function showLogin(message) {
    $("#loading-view").hidden = true;
    $("#app-view").hidden = true;
    $("#login-view").hidden = false;
    if (message) {
      const err = $("#login-error");
      err.textContent = message;
      err.hidden = false;
    }
    $("#login-user").focus();
  }

  async function showApp() {
    try {
      state = await loadData();
    } catch (e) {
      if (e.unauthorized) { showLogin(); return; }
      showLogin(t("loadError", { m: e.message }));
      return;
    }
    $("#loading-view").hidden = true;
    $("#login-view").hidden = true;
    $("#app-view").hidden = false;
    render();
  }

  function bindLogin() {
    $("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector("button[type=submit]");
      const u = $("#login-user").value.trim();
      const p = $("#login-pass").value;
      $("#login-error").hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = t("signingIn");
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: u, password: p }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          $("#login-error").textContent = res.status === 401 ? t("loginError") : (body.error || t("loginError"));
          $("#login-error").hidden = false;
          $("#login-pass").value = "";
          $("#login-pass").focus();
          return;
        }
        $("#login-form").reset();
        await showApp();
      } catch (err) {
        $("#login-error").textContent = t("networkError");
        $("#login-error").hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = t("signIn");
      }
    });

    $("#logout-btn").addEventListener("click", async () => {
      try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); }
      catch (e) { /* ignore, still show login locally */ }
      showLogin();
    });

    $$(".lang-btn").forEach((b) => b.addEventListener("click", () => {
      lang = lang === "en" ? "tl" : "en";
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
      applyStaticText();
      fillCategorySelects();
      if (!$("#app-view").hidden) render();
    }));
  }

  /* ---------- start ---------- */
  async function init() {
    fillCategorySelects();
    applyStaticText();
    bindLogin();
    bindForms();
    bindBackup();
    $("#checklist-dismiss").addEventListener("click", () => {
      try { localStorage.setItem(CHECKLIST_KEY, "1"); } catch (e) { /* ignore */ }
      $("#checklist").hidden = true;
    });
    $("#month-input").addEventListener("change", (e) => {
      if (!e.target.value) return;
      month = e.target.value;
      render();
    });
    // A valid session cookie from a previous visit lets us skip straight to the app.
    await showApp();
  }

  init();
})();
