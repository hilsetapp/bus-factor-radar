**English** | [Русский](README.md)

# Bus Factor Radar

A local-first dependency analyzer for `package.json`, `go.mod`, and pip `requirements.txt`. It surfaces public signals about maintainer/author counts, repository activity, and release age. The manifest is parsed in the browser and is not uploaded to a server.

## Open the app

[Launch Bus Factor Radar in your browser](https://hilsetapp.github.io/bus-factor-radar/)

## Run locally

Open `index.html` in a browser, or start a simple local HTTP server:

```bash
python3 -m http.server 4175
```

Then open `http://localhost:4174`. No build dependencies are required.

## What it does

- Parses `package.json`, `go.mod`, and pip requirements locally.
- Only after you press Scan, sends package names to npm Registry, PyPI, or the Go module proxy for public metadata.
- If metadata contains a GitHub URL, it may query the public repository and up to the latest 100 commits from GitHub's API.
- Generates a local PNG summary card.

**The manifest, source code, tokens, and credentials are not uploaded.** Public APIs still receive ordinary requests from your browser and apply their own rate limits and policies. Do not scan if you do not want to contact those services.

## Limits

This is not a security audit, SBOM, or proof that a dependency is safe or abandoned. GitHub author data is limited to the latest 100 visible commits. npm and PyPI publisher/maintainer fields are incomplete and may be stale; a PyPI author/contact is not necessarily a maintainer. Go modules without a GitHub URL may have no maintainer source. “No data” means no data, not low risk.

For speed, the first 40 manifest entries are scanned. The aggregate score is a rough heuristic over available concentration/freshness signals, not a rigorously computed bus factor. It does not predict what would happen if a person left. Review the individual evidence and upstream project.

## Tests

```bash
npm test
```

Tests cover parsing and heuristics without network access.
