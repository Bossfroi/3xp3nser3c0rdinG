const { requireAuth } = require("../lib/session");
const { getFile, updateFile } = require("../lib/github");

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

module.exports = async function handler(req, res) {
  const session = requireAuth(req, res);
  if (!session) return; // requireAuth already sent 401

  if (req.method === "GET") {
    try {
      const { data } = await getFile();
      return res.status(200).json(normalize(data));
    } catch (e) {
      console.error("GET /api/data failed:", e);
      return res.status(e.status === 404 ? 404 : 502).json({ error: e.message });
    }
  }

  if (req.method === "PUT") {
    const newData = req.body;
    if (!newData || typeof newData !== "object" || Array.isArray(newData)) {
      return res.status(400).json({ error: "Request body must be a JSON object" });
    }
    const clean = normalize(newData);
    const message = `Update db.json via Budget Book (${new Date().toISOString()})`;

    // Read-modify-write: fetch the current sha right before writing so we
    // are working off the latest commit, then retry once if GitHub reports
    // a conflict (someone/something else committed in between).
    const MAX_ATTEMPTS = 2;
    let lastErr;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { sha } = await getFile();
        await updateFile(clean, sha, message);
        return res.status(200).json({ ok: true });
      } catch (e) {
        lastErr = e;
        if (e.status === 409 && attempt < MAX_ATTEMPTS) {
          continue; // someone else committed between our GET and PUT — retry
        }
        break;
      }
    }
    console.error("PUT /api/data failed:", lastErr);
    if (lastErr && lastErr.status === 409) {
      return res.status(409).json({ error: "Save conflict: db.json changed elsewhere. Please reload and try again." });
    }
    return res.status(502).json({ error: lastErr ? lastErr.message : "Unknown error saving to GitHub" });
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({ error: "Method not allowed" });
};
