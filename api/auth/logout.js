import { clearSession } from '../../lib/session.js';
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  clearSession(res);
  res.status(200).json({ ok: true });
}
