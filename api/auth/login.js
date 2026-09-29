const crypto = require("crypto");
const { createSessionCookie } = require("../../lib/session");

// Constant-time string compare so login can't be timed to guess characters.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // still run a comparison so failure timing doesn't depend on length
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const expectedUser = process.env.APP_USERNAME || "";
  const expectedPass = process.env.APP_PASSWORD || "";
  if (!expectedUser || !expectedPass) {
    return res.status(500).json({ error: "Server is missing APP_USERNAME / APP_PASSWORD" });
  }

  const ok = safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
  if (!ok) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  res.setHeader("Set-Cookie", createSessionCookie(username));
  return res.status(200).json({ ok: true });
};
