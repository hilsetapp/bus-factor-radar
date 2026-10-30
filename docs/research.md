# Bus Factor Radar: sources and method

Checked: 2026-10-30. The project is a browser-only maintainer/activity signal explorer, not a vulnerability scanner, SBOM, package trust score, or rigorous bus-factor calculator.

## Public metadata sources

- [npm Registry package metadata](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md) documents `GET https://registry.npmjs.org/:package`, including maintainers, repository metadata, and release information. The app requests the smaller `/:package/latest` document for publisher/repository fields; it does not currently score npm release date from the full packument.
- [PyPI JSON API](https://docs.pypi.org/api/json/) documents project metadata and per-release JSON routes. PyPI author and maintainer fields are free-form metadata submitted by projects, not proof of active maintainers. The app requests latest project JSON and the current-version JSON for upload time.
- [Go Modules Reference: module proxies](https://go.dev/ref/mod#module-proxy) describes proxy-based module version metadata. Go proxy timestamps indicate version publication, not repository commit activity or maintainer identity.
- [GitHub REST: list commits](https://docs.github.com/en/rest/commits/commits#list-commits) documents public commit access and page size up to 100. The app counts visible authors from at most the newest 100 commits, not the full contributor/maintainer set.
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) states public unauthenticated requests are limited to 60 per hour per originating IP. The app performs requests only after the user presses Scan, limits parallel work, and reports data gaps rather than claiming completeness.

## Data boundary

The parser runs locally. After explicit user action, the browser sends dependency names to the relevant registry/proxy and may request public GitHub repository commit metadata. It never sends the manifest file, code, token, or credentials to a project-owned server (there is no backend). Public service providers receive requests and apply their own retention, privacy, CORS, and rate-limit policies.

## Scoring caveats

- npm `maintainers` are registry-listed accounts; PyPI author/maintainer are unverified free-text fields. Their counts are not interchangeable.
- For GitHub activity, “visible author” means an account/name present in the latest page of up to 100 commits. It does not establish that person is a maintainer, nor does it capture inactive prior contributors.
- A stale release/repository is a review prompt, not a verdict that a project is abandoned. A newer available release or commit prevents a stale flag when both signals exist.
- Go modules without a recognizable GitHub repository can have version-age data but no contributor signal.
- At most the first 40 manifest entries are checked in the quick pass. Aggregate score is an explicitly heuristic combination of signals that were available; “unknown” is not mapped to low risk.
