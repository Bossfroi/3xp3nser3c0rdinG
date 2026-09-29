import crypto from 'node:crypto';
const NAME = 'ledger_session', TTL = 60 * 60 * 12;
const sign = (v) => crypto.createHmac('sha256', process.env.SESSION_SECRET).update(v).digest('base64url');
export const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};
export function setSession(res, username) {
  const p = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + TTL * 1000 })).toString('base64url');
  res.setHeader('Set-Cookie', `${NAME}=${p}.${sign(p)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TTL}`);
}
export function clearSession(res) {
  res.setHeader('Set-Cookie', `${NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}
export function requireAuth(req, res) {
  const m = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(NAME + '='));
  const [p, s] = m ? m.slice(NAME.length + 1).split('.') : [];
  try {
    if (p && s && safeEqual(s, sign(p)) && JSON.parse(Buffer.from(p, 'base64url')).exp > Date.now()) return true;
  } catch {}
  res.status(401).json({ error: 'Not signed in or session expired.' });
  return false;
}
