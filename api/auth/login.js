import { safeEqual, setSession } from '../../lib/session.js';
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username = '', password = '' } = req.body || {};
  const ok = safeEqual(username, process.env.APP_USERNAME) & safeEqual(password, process.env.APP_PASSWORD);
  if (!ok) return res.status(401).json({ error: 'Wrong username or password.' });
  setSession(res, username);
  res.status(200).json({ ok: true });
}
