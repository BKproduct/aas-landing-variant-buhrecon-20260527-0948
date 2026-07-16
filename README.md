# AAS landing — preview variant (GTM redesign WIP)

**Preview (GitHub Pages):** https://bkproduct.github.io/aas-landing-variant-buhrecon-20260527-0948/

**Repo:** https://github.com/BKproduct/aas-landing-variant-buhrecon-20260527-0948

**Production:** https://ai-automation.studio — **Cloudflare Pages** project `ai-automation-studio` (not GitHub Pages).

## Deploy to production

```bash
# one-time: legacy extras (privacy, landing-brief, favicon)
git clone --depth 1 https://github.com/BKproduct/aas-landing-preview.git /tmp/aas-landing-preview

set -a && source ~/.env && set +a
./deploy-production.sh
```

Requires `CLOUDFLARE_API_TOKEN` in `~/.env`.

## What’s in this preview

- Swiss Pulse design (`index.html`)
- Accounting use-case on **Accounting Firms** card: 80,000+ bank reconciliation (bank entries, contracts, invoices)

## Pages setup

Source: branch `main`, folder `/` (root `index.html`).

## Partner links (booking)

| Use | URL |
|-----|-----|
| **Branded (share anywhere)** | https://cal.com/boris-korol-fpkpqk/discovery-call |
| **Short via this preview** | https://bkproduct.github.io/aas-landing-variant-buhrecon-20260527-0948/call/ |
