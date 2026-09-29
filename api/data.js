import { requireAuth } from '../lib/session.js';
import { validate } from '../lib/validate.js';
import { getFile, saveFile } from '../lib/github.js';
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === 'GET') return res.status(200).json((await getFile()).data);
    if (req.method === 'PUT') {
      const b = req.body;
      if (!b || !Array.isArray(b.accounts) || !Array.isArray(b.transactions)) return res.status(400).json({ error: 'Invalid data.' });
      const bad = validate(b); if (bad) return res.status(400).json({ error: bad });
      await saveFile({ accounts: b.accounts, transactions: b.transactions });
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { res.status(e.status === 409 ? 409 : 502).json({ error: e.message }); }
}
