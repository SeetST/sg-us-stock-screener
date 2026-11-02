# Stock Screener — Session Log

Tracks build progress for the SG & US Stock Screener. Full architecture/methodology
plan: `/Users/seetseahteai/.claude/plans/polished-percolating-pearl.md`.

## Status: end-to-end verified against live Supabase Postgres ✅

## Done

### Phase 0 — Scaffold
- Next.js (App Router) + Tailwind + shadcn/ui set up
- Postgres schema via Prisma (`prisma/schema.prisma`): `Company`, `FinancialStatement`
  (15 case-study indicators), `DailyPrice`, `Score`
- Yahoo Finance ingestion script (`scripts/ingest.ts`), seed universe of 13 tickers
  (5 SGX + 8 US) in `scripts/tickers.ts`
- MVP scoring engine (`src/lib/scoring.ts`): Profitability 35% / Growth 25% /
  Financial Health 20% / Dividend 20%, sector-relative percentile ranks
- Screener table (`/`) and stock factsheet (`/stocks/[ticker]`) pages

### Addendum — Quality Compounder Score
- Schema: added 7 raw fields to `FinancialStatement` (`ebit`, `pretaxIncome`,
  `taxProvision`, `totalDebt`, `stockholdersEquity`, `sharesOutstanding`,
  `investedCapital`) + new `QualityCompounderScore` model
- Extracted shared `src/lib/percentile.ts` (percentile rank, sector peer groups, average)
- `src/lib/quality-score.ts`: 9-factor equal-weighted (~11.1% each) score — ROE, ROIC,
  Gross Margin stability, FCF Margin, Revenue CAGR (5Y), EPS CAGR (5Y), Debt-to-Equity,
  Interest Coverage, Share Dilution trend
  - **Insider ownership dropped** (10th factor in original request) — no free-tier
    data source for SGX or US
  - ROE > 15% / ROIC > 12% are informational badges, not hard filters
- `scripts/score-quality.ts` + `npm run score:quality`
- New `/compounders` ranking page, nav links added between `/` and `/compounders`
- README updated

### Build fix
- Added `export const dynamic = "force-dynamic"` to `/`, `/stocks/[ticker]`, and
  `/compounders` — these pages query Postgres live and shouldn't be statically
  prerendered at build time. Fixes `ECONNREFUSED` build error when no DB is reachable.
- Verified: `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass clean.

## Database — Supabase Postgres (Session pooler)

Set up a free Supabase project and used the **Session pooler** connection string
(port 5432) in `.env`'s `DATABASE_URL`. Two fixes were needed beyond just dropping
in the connection string:

1. **`.env`**: append `&uselibpqcompat=true` alongside `sslmode=require` — newer
   `pg` versions treat `sslmode=require` as strict cert verification, which fails
   against Supabase's pooler cert chain (`SELF_SIGNED_CERT_IN_CHAIN`).
   `uselibpqcompat=true` restores the old "encrypt without verifying CA" behavior.
2. **`src/lib/db.ts`**: added `import "dotenv/config"` (and `dotenv` to
   `package.json` dependencies) — the Prisma CLI auto-loads `.env`, but plain
   `tsx` scripts (`ingest`, `score`, `score-quality`) don't, so `DATABASE_URL` was
   `undefined` and connections silently fell back to `localhost` (`ECONNREFUSED`).

### Verified end-to-end (2026-06-10)
1. `npx prisma db push` — schema synced, incl. `QualityCompounderScore`
2. `npm run ingest` — all 13 seed tickers ingested (4-5 fiscal years each)
3. `npm run score` — 13 companies scored
4. `npm run score:quality` — 13 companies ranked
5. `npm run dev` — `/` and `/compounders` both render correctly with live data

**Quality Compounder top 3**: Johnson & Johnson (68), OCBC (63), DBS (57).

### Ticker universe expansion (2026-06-10)
- `scripts/tickers.ts`: expanded SGX side from 5 to the full **Straits Times
  Index (30 components)**; US side stays at the 8-ticker S&P 500 sample.
  Total universe: 38 tickers.
- `scripts/ingest.ts`: refactored to **derive `Company.exchange`** from
  Yahoo's `price.exchangeName` (NMS/NGM/NCM→NASDAQ, NYQ→NYSE, ASE/PCX→AMEX,
  SES→SGX), falling back to the seed value if unrecognized. Avoids hand-
  mapping NYSE/NASDAQ/AMEX for hundreds of future US tickers.
- Verified: `npx tsc --noEmit`, `npm run lint`, `npm run ingest` (all 38
  tickers ingested), `npm run score`, `npm run score:quality` all pass.
  Confirmed resolved `exchange` values are correct for all 38 companies.

## Open items / future work
- Further expand `scripts/tickers.ts` toward the full SGX Top 100 + S&P 500
  (~600) — current universe is STI 30 + S&P 500 sample (8) = 38. Adding the
  full S&P 500 (~503 tickers) would need batching/throttling in
  `scripts/ingest.ts` to avoid Yahoo Finance rate limits on a sequential
  ~1,500-call run.
- Valuation/momentum indicators deferred (P/E, P/B, EV/EBITDA, dividend yield, D/E,
  current ratio, beta) — see plan Phase 1C
- Revisit insider ownership for Quality Compounder Score if a paid data vendor
  (e.g., Finnhub paid tier) is added later
