(() => {
  "use strict";

  // NOTE: this login runs in the browser only. It keeps casual visitors out,
  // but it is NOT real security (anyone can read this file).
  const CREDENTIALS = { username: "@dmin", password: "P@ssw0rd" };
  const STORE_KEY = "budgetbook.data.v1";
  const SESSION_KEY = "budgetbook.session";

  const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const $ = (sel) => document.querySelector(sel);
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const sum = (arr, key = "amount") => arr.reduce((a, x) => a + x[key], 0);

  let state = { income: [], expenses: [], liabilities: [], payments: [] };
  let month = todayStr().slice(0, 7);

  /* ---------- data (data.json = starting data, localStorage = working copy) ---------- */
  function normalize(d) {
    d = d || {};
    return {
      income: Array.isArray(d.income) ? d.income : [],
      expenses: Array.isArray(d.expenses) ? d.expenses : [],
      liabilities: Array.isArray(d.liabilities) ? d.liabilities : [],
      payments: Array.isArray(d.payments) ? d.payments : [],
    };
  }

  async function loadData() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) return normalize(JSON.parse(saved));
    } catch (e) { /* ignore */ }
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      if (res.ok) return normalize(await res.json());
    } catch (e) { /* ignore (e.g. opened as a local file) */ }
    return normalize({});
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
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
    return new Date(y, mo - 1, 1).toLocaleDateString("en-PH",
      style === "long" ? { month: "long", year: "numeric" } : { month: "short" });
  }

  function shiftMonth(m, delta) {
    const [y, mo] = m.split("-").map(Number);
    const d = new Date(y, mo - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }

  function fmtDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  }

  function totals(m) {
    const income = sum(state.income.filter((i) => i.date.startsWith(m)));
    const expenses = sum(state.expenses.filter((e) => e.date.startsWith(m)));
    const debt = sum(state.payments.filter((p) => p.month === m));
    return { income, expenses, debt, net: income - expenses - debt };
  }

  function defaultDate() {
    return todayStr().startsWith(month) ? todayStr() : `${month}-01`;
  }

  /* ---------- render ---------- */
  function renderSummary() {
    const t = totals(month);
    $("#hero-month").textContent = monthLabel(month);
    const net = $("#hero-net");
    net.textContent = peso.format(t.net);
    net.className = "hero-net " + (t.net < 0 ? "neg" : "pos");

    $("#fig-income").textContent = peso.format(t.income);
    $("#fig-expenses").textContent = peso.format(t.expenses);
    $("#fig-debt").textContent = peso.format(t.debt);
    $("#fig-owed").textContent = peso.format(sum(state.liabilities, "balance"));

    const dueCount = state.liabilities.filter(
      (l) => l.monthly > 0 && l.balance > 0 && !state.payments.some((p) => p.liabilityId === l.id && p.month === month)
    ).length;
    let note;
    if (t.income === 0 && t.expenses === 0 && t.debt === 0) note = "Nothing recorded for this month yet.";
    else if (t.net < 0) note = "You spent more than you earned this month.";
    else note = "Money in minus expenses and liability payments.";
    if (dueCount) note += ` ${dueCount} liabilit${dueCount > 1 ? "ies have" : "y has"} no payment yet this month.`;
    $("#hero-note").textContent = note;

    const bar = $("#split-bar");
    bar.replaceChildren();
    const out = t.expenses + t.debt;
    const total = Math.max(t.income, out);
    if (total > 0) {
      const seg = (cls, val) => val > 0 && bar.append(el("span", { class: cls, style: `width:${(val / total) * 100}%` }));
      seg("expense", t.expenses);
      seg("debt", t.debt);
      seg("left", Math.max(t.net, 0));
    }
    bar.setAttribute("aria-label",
      `Of ${peso.format(t.income)} income: ${peso.format(t.expenses)} expenses, ${peso.format(t.debt)} liability payments`);
  }

  function renderTrend() {
    const chart = $("#trend-chart");
    chart.replaceChildren();
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
    const data = months.map((m) => { const t = totals(m); return { m, inc: t.income, out: t.expenses + t.debt }; });
    const max = Math.max(1, ...data.flatMap((d) => [d.inc, d.out]));
    for (const d of data) {
      chart.append(el("div", { class: "trend-col" + (d.m === month ? " current" : ""), title: `${monthLabel(d.m)}: in ${peso.format(d.inc)}, out ${peso.format(d.out)}` },
        el("div", { class: "trend-bars" },
          el("i", { class: "in", style: `height:${(d.inc / max) * 100}%` }),
          el("i", { class: "outb", style: `height:${(d.out / max) * 100}%` })),
        el("span", { class: "trend-label" }, monthLabel(d.m, "short"))));
    }
  }

  function fillList(ul, items, build, emptyText) {
    ul.replaceChildren();
    if (!items.length) { ul.append(el("li", { class: "empty" }, emptyText)); return; }
    items.forEach((it) => ul.append(build(it)));
  }

  function renderIncome() {
    const items = state.income.filter((i) => i.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
    fillList($("#income-list"), items, (i) => el("li", {},
      el("span", { class: "title" }, i.description),
      el("span", { class: "amount income" }, peso.format(i.amount)),
      el("span", {}),
      el("span", { class: "meta" }, fmtDate(i.date)),
      el("span", { class: "actions" },
        el("button", { class: "btn small ghost", type: "button", "aria-label": `Delete ${i.description}`,
          onclick: () => { state.income = state.income.filter((x) => x.id !== i.id); commit(); } }, "Delete"))
    ), "No income this month. Add your first one above.");
  }

  function renderExpenses() {
    const items = state.expenses.filter((e) => e.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
    fillList($("#expense-list"), items, (e) => el("li", {},
      el("span", { class: "title" }, e.description),
      el("span", { class: "amount expense" }, peso.format(e.amount)),
      el("span", {}),
      el("span", { class: "meta" }, `${e.category} · ${fmtDate(e.date)}`),
      el("span", { class: "actions" },
        el("button", { class: "btn small ghost", type: "button", "aria-label": `Delete ${e.description}`,
          onclick: () => { state.expenses = state.expenses.filter((x) => x.id !== e.id); commit(); } }, "Delete"))
    ), "No expenses this month. Add one above.");
  }

  function paymentsOf(l) { return state.payments.filter((p) => p.liabilityId === l.id); }

  // older saved data may not have "original"; work it out from balance + payments
  function ensureOriginal(l) {
    if (!l.original) l.original = +(l.balance + sum(paymentsOf(l))).toFixed(2);
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

  function renderLiabilities() {
    fillList($("#liab-list"), state.liabilities, (l) => {
      const original = ensureOriginal(l);
      const paidTotal = Math.max(0, original - l.balance);
      const pct = original > 0 ? Math.min(100, (paidTotal / original) * 100) : 0;
      const thisMonth = paymentsOf(l).filter((p) => p.month === month)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const paidThisMonth = sum(thisMonth);

      const parts = [
        el("div", { class: "liab-head" },
          el("span", { class: "title" }, l.name),
          el("span", { class: "amount" }, peso.format(l.balance))),
        el("div", { class: "meta" }, `Remaining. Paid ${peso.format(paidTotal)} of ${peso.format(original)}`),
        el("div", { class: "progress", role: "img", "aria-label": `${Math.round(pct)}% paid` },
          el("span", { style: `width:${pct}%` })),
      ];

      if (l.balance > 0) {
        const input = el("input", {
          type: "number", name: "amount", min: "0.01", max: String(l.balance), step: "0.01", required: "",
          placeholder: "Payment amount", "aria-label": `Payment amount for ${l.name}`,
          value: l.monthly > 0 ? String(Math.min(l.monthly, l.balance)) : "",
        });
        parts.push(el("form", {
          class: "pay-form",
          onsubmit: (e) => { e.preventDefault(); addPayment(l, readAmount(input.value)); },
        }, input, el("button", { class: "btn small primary", type: "submit" }, "Add payment")));
      } else {
        parts.push(el("p", { class: "paid" }, "Fully paid. No balance left."));
      }

      if (thisMonth.length) {
        parts.push(el("div", { class: "meta" }, `Payments in ${monthLabel(month)}: ${peso.format(paidThisMonth)}`));
        parts.push(el("ul", { class: "pay-history" }, thisMonth.map((p) => el("li", {},
          el("span", {}, `${p.date ? fmtDate(p.date) : monthLabel(month, "short")}: ${peso.format(p.amount)}`),
          el("button", { class: "btn small ghost", type: "button",
            "aria-label": `Remove payment of ${peso.format(p.amount)}`,
            onclick: () => removePayment(l, p) }, "Remove")))));
      }

      parts.push(el("div", { class: "actions" },
        el("button", { class: "btn small ghost", type: "button", "aria-label": `Delete ${l.name}`,
          onclick: () => {
            if (!confirm(`Delete "${l.name}" and its payment history?`)) return;
            state.liabilities = state.liabilities.filter((x) => x.id !== l.id);
            state.payments = state.payments.filter((p) => p.liabilityId !== l.id);
            commit();
          } }, "Delete liability")));

      return el("li", { class: "liab" }, ...parts);
    }, "No liabilities. Add a loan or debt above.");
  }

  function render() {
    $("#month-input").value = month;
    for (const f of ["#income-form", "#expense-form"]) $(f).elements.date.value = defaultDate();
    renderSummary();
    renderTrend();
    renderIncome();
    renderExpenses();
    renderLiabilities();
  }

  // re-render without resetting what the person is typing in forms
  function commit() {
    save();
    renderSummary();
    renderTrend();
    renderIncome();
    renderExpenses();
    renderLiabilities();
  }

  /* ---------- forms ---------- */
  function readAmount(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }

  function bindForms() {
    $("#income-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const amount = readAmount(f.amount.value);
      if (!amount || !f.description.value.trim()) return;
      state.income.push({ id: uid(), description: f.description.value.trim(), amount, date: f.date.value });
      f.description.value = ""; f.amount.value = "";
      showMonthOf(f.date.value);
      commit();
    });

    $("#expense-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const amount = readAmount(f.amount.value);
      if (!amount || !f.description.value.trim()) return;
      state.expenses.push({ id: uid(), description: f.description.value.trim(), category: f.category.value, amount, date: f.date.value });
      f.description.value = ""; f.amount.value = "";
      showMonthOf(f.date.value);
      commit();
    });

    $("#liab-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const balance = readAmount(f.balance.value);
      const monthly = readAmount(f.monthly.value) || 0;
      if (!balance || !f.name.value.trim()) return;
      state.liabilities.push({ id: uid(), name: f.name.value.trim(), original: balance, balance, monthly });
      e.target.reset();
      commit();
    });
  }

  // if a date from another month was added, jump to that month so it is visible
  function showMonthOf(dateStr) {
    if (dateStr && !dateStr.startsWith(month)) {
      month = dateStr.slice(0, 7);
      $("#month-input").value = month;
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
        if (!confirm("Replace all current data with this file?")) return;
        state = parsed;
        save();
        render();
      } catch (err) {
        alert("That file is not valid JSON. Pick the data.json you exported.");
      }
    });
  }

  /* ---------- login ---------- */
  function showApp() {
    $("#login-view").hidden = true;
    $("#app-view").hidden = false;
    render();
  }

  function bindLogin() {
    $("#login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const u = $("#login-user").value.trim();
      const p = $("#login-pass").value;
      if (u === CREDENTIALS.username && p === CREDENTIALS.password) {
        sessionStorage.setItem(SESSION_KEY, "1");
        $("#login-error").hidden = true;
        $("#login-form").reset();
        showApp();
      } else {
        $("#login-error").hidden = false;
        $("#login-pass").value = "";
        $("#login-pass").focus();
      }
    });

    $("#logout-btn").addEventListener("click", () => {
      sessionStorage.removeItem(SESSION_KEY);
      $("#app-view").hidden = true;
      $("#login-view").hidden = false;
      $("#login-user").focus();
    });
  }

  /* ---------- start ---------- */
  async function init() {
    state = await loadData();
    bindLogin();
    bindForms();
    bindBackup();
    $("#month-input").addEventListener("change", (e) => {
      if (!e.target.value) return;
      month = e.target.value;
      render();
    });
    if (sessionStorage.getItem(SESSION_KEY) === "1") showApp();
  }

  init();
})();
