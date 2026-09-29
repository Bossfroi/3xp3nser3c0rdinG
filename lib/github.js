const { GITHUB_TOKEN: T, GITHUB_OWNER: O, GITHUB_REPO: R, GITHUB_BRANCH: B, GITHUB_FILE_PATH: P } = process.env;
const url = () => `https://api.github.com/repos/${O}/${R}/contents/${P}`;
const hdr = () => ({ Authorization: `Bearer ${T}`, Accept: 'application/vnd.github+json', 'User-Agent': 'ledger-app', 'Content-Type': 'application/json' });
export async function getFile() {
  const r = await fetch(`${url()}?ref=${B}`, { headers: hdr() });
  if (!r.ok) throw Object.assign(new Error(`GitHub read failed (${r.status})`), { status: r.status });
  const j = await r.json();
  return { sha: j.sha, data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf8')) };
}
async function put(data, sha) {
  return fetch(url(), { method: 'PUT', headers: hdr(), body: JSON.stringify({
    message: `Ledger update ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'), sha, branch: B }) });
}
export async function saveFile(data) {
  for (let i = 0; i < 2; i++) {
    const { sha } = await getFile(); // fresh sha right before writing
    const r = await put(data, sha);
    if (r.ok) return;
    if (r.status !== 409 || i === 1) throw Object.assign(new Error(r.status === 409 ? 'Conflict: reload the page and try again.' : `GitHub write failed (${r.status})`), { status: r.status });
  }
}
