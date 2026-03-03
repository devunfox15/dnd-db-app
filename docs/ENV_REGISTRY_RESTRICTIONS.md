# Environment Registry Restrictions Setup (npm)

Use this guide when your environment blocks direct access to `registry.npmjs.org` (for example with HTTP 403/407 errors).

## 1) Choose an allowed registry endpoint

Common options:
- Company Artifactory/Nexus/Verdaccio npm proxy
- GitHub Packages npm registry
- Azure Artifacts npm feed

Set these environment variables in your shell/CI:

```bash
export NPM_REGISTRY_URL="https://your-registry.example.com/npm/"
export NPM_REGISTRY_HOST="your-registry.example.com/npm"
export NPM_TOKEN="<token from your registry>"
```

## 2) Configure npm for this repo

Copy `.npmrc.example` to `.npmrc` and keep credentials in env vars:

```bash
cp .npmrc.example .npmrc
```

> Do not commit `.npmrc` if it contains org-specific hostnames/tokens.

## 3) Verify registry access

Run:

```bash
npm run doctor:registry
```

If it fails:
- verify token scope/read permissions
- verify proxy/firewall allow-list
- verify `NPM_REGISTRY_URL` and `NPM_REGISTRY_HOST` exactly match your registry endpoint

## 4) Install and run

```bash
npm install
npm run dev
```

## CI example (GitHub Actions)

```yaml
env:
  NPM_REGISTRY_URL: https://your-registry.example.com/npm/
  NPM_REGISTRY_HOST: your-registry.example.com/npm
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 20
  - run: cp .npmrc.example .npmrc
  - run: npm run doctor:registry
  - run: npm ci
  - run: npm run build
```
