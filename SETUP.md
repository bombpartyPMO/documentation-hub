# PMO Documentation Hub Setup

This hub uses the same pattern as the Governance and Controls / Compliance apps:

- GitHub Pages hosts `index.html`
- Cloudflare Worker reads and writes the JSON data
- GitHub stores `data/documentation-data.json`
- `GITHUB_TOKEN` and `PMO_EDIT_KEY` live only in Cloudflare secrets

## GitHub Files

Upload these files to your new GitHub repo:

- `index.html`
- `cloudflare-worker.js`
- `wrangler.toml.example`
- `SETUP.md`
- `data/documentation-data.json`

Suggested repo name:

```text
bp-pmo-documentation-hub
```

## Cloudflare Variables

Use these regular text variables:

| Type | Variable name | Value |
|---|---|---|
| Text | `GITHUB_OWNER` | `bombpartyPMO` |
| Text | `GITHUB_REPO` | `bp-pmo-documentation-hub` |
| Text | `GITHUB_BRANCH` | `main` |
| Text | `GITHUB_DATA_PATH` | `data/documentation-data.json` |

Use these secrets:

| Type | Variable name | Value |
|---|---|---|
| Secret | `GITHUB_TOKEN` | your GitHub token |
| Secret | `PMO_EDIT_KEY` | your PMO edit password |

## Connect the HTML Page

After you create the Cloudflare Worker, update this line in `index.html`:

```js
const API_BASE=window.PMO_DOCS_API||'https://YOUR-DOCUMENTATION-WORKER.YOUR-SUBDOMAIN.workers.dev';
```

Replace the placeholder URL with your real Worker URL.

Then test:

```text
https://your-worker-url/data
```

It should return the JSON from `data/documentation-data.json`.
