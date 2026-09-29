// Minimal signed-cookie session, good enough for a single-user app.
// No database, no third-party auth library: just an HMAC-signed cookie.

const crypto = require("crypto");

const COOKIE_NAME = "budgetbook_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing required environment variable: SESSION_SECRET");
  return s;
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function createSessionCookie(username) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${username}.${expires}`;
  const sig = sign(payload);
  const value = encodeURIComponent(`${payload}.${sig}`);
  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax; Secure`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i === -1) return;
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}

// Returns { username } if the request has a valid, unexpired session cookie,
// otherwise null. Uses constant-time comparison so timing can't leak the sig.
function verifySession(req) {
  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;

  const value = decodeURIComponent(raw);
  const lastDot = value.lastIndexOf(".");
  const secondLastDot = value.lastIndexOf(".", lastDot - 1);
  if (lastDot === -1 || secondLastDot === -1) return null;

  const payload = value.slice(0, lastDot);
  const sig = value.slice(lastDot + 1);
  const username = value.slice(0, secondLastDot);
  const expires = Number(value.slice(secondLastDot + 1, lastDot));

  let expectedBuf, actualBuf;
  try {
    expectedBuf = Buffer.from(sign(payload), "hex");
    actualBuf = Buffer.from(sig, "hex");
  } catch (e) {
    return null;
  }
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }
  if (!expires || Date.now() > expires) return null;

  return { username };
}

// Call at the top of any protected API route. Sends 401 and returns null if
// there is no valid session; otherwise returns the session so you can continue.
function requireAuth(req, res) {
  const session = verifySession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return session;
}

module.exports = { createSessionCookie, clearSessionCookie, verifySession, requireAuth };
