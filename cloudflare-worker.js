const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-PMO-Key"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/data") {
      return json({ error: "Not found" }, 404);
    }

    if (request.method === "GET") {
      try {
        return await getData(env);
      } catch (error) {
        return json({ error: "GitHub read failed", details: error.message }, 500);
      }
    }

    if (request.method === "PUT") {
      const providedKey = request.headers.get("X-PMO-Key") || "";
      if (!env.PMO_EDIT_KEY || providedKey !== env.PMO_EDIT_KEY) {
        return json({ error: "Unauthorized" }, 401);
      }

      try {
        const body = await request.json();
        return await putData(env, body);
      } catch (error) {
        return json({ error: "GitHub write failed", details: error.message }, 500);
      }
    }

    return json({ error: "Method not allowed" }, 405);
  }
};

async function getData(env) {
  const current = await githubGet(env);
  return json(JSON.parse(decodeBase64(current.content)), 200);
}

async function putData(env, body) {
  const current = await githubGet(env);
  const content = encodeBase64(JSON.stringify(body, null, 2));
  const response = await fetch(githubUrl(env), {
    method: "PUT",
    headers: githubHeaders(env),
    body: JSON.stringify({
      message: `Update PMO documentation data - ${new Date().toISOString()}`,
      content,
      sha: current.sha,
      branch: env.GITHUB_BRANCH || "main"
    })
  });

  if (!response.ok) {
    return json({ error: "GitHub write failed", details: await response.text() }, 500);
  }

  return json({ ok: true }, 200);
}

async function githubGet(env) {
  const response = await fetch(githubUrl(env), { headers: githubHeaders(env) });
  if (!response.ok) {
    throw new Error(`GitHub read failed: ${response.status}`);
  }
  return response.json();
}

function githubUrl(env) {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const path = env.GITHUB_DATA_PATH || "data/documentation-data.json";
  const branch = env.GITHUB_BRANCH || "main";
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
}

function githubHeaders(env) {
  return {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "User-Agent": "bp-pmo-documentation-worker",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

function decodeBase64(value) {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
