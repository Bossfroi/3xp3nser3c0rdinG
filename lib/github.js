// Talks to the GitHub REST API (Contents endpoint) to read and write db.json.
// This file only ever runs on the server (inside /api functions). The token
// is read from an environment variable and is never sent to the browser.

const GITHUB_API = "https://api.github.com";

function env(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function config() {
  return {
    token: env("GITHUB_TOKEN"),
    owner: env("GITHUB_OWNER"),
    repo: env("GITHUB_REPO"),
    branch: env("GITHUB_BRANCH", "main"),
    path: env("GITHUB_FILE_PATH", "db.json"),
  };
}

async function githubFetch(path, options = {}) {
  const { token } = config();
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  return res;
}

/**
 * Step 1 + 2 of the flow: GET the current file, decode its base64 content,
 * and return both the parsed JSON and the file's current `sha` (GitHub needs
 * the sha of the version you are replacing, so it can detect conflicts).
 */
async function getFile() {
  const { owner, repo, branch, path } = config();
  const res = await githubFetch(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`
  );

  if (res.status === 404) {
    const err = new Error(`${path} not found on branch ${branch} of ${owner}/${repo}`);
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`GitHub GET failed (${res.status}): ${body}`);
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  const content = Buffer.from(json.content, "base64").toString("utf-8");
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`${path} does not contain valid JSON: ${e.message}`);
  }
  return { data, sha: json.sha };
}

/**
 * Step 3 + 4: base64-encode the new content and PUT it back with the sha we
 * just read. GitHub compares that sha to the file's current sha server-side;
 * if someone else committed in between, it rejects with 409 (conflict).
 * Every successful PUT is a new commit, so Git history is preserved for free.
 */
async function updateFile(newData, sha, message) {
  const { owner, repo, branch, path } = config();
  const content = Buffer.from(JSON.stringify(newData, null, 2) + "\n", "utf-8").toString("base64");

  const res = await githubFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content,
      sha,
      branch,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`GitHub PUT failed (${res.status}): ${body}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

module.exports = { getFile, updateFile };
