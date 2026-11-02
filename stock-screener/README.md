# SG & US Stock Screener (MVP)

A fundamentals-driven stock screener covering SGX, NYSE, NASDAQ and AMEX, scored on the
15 case-study indicators (Revenue, Margins, Operating Income, Interest Expense, Net Income,
EPS, Debt Repayment Ratio, Dividends, Payout Ratio, Free Cash Flow, ROE).

See `/Users/seetseahteai/.claude/plans/polished-percolating-pearl.md` for the full
architecture and methodology plan.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start a local Postgres database (requires Docker):

   ```bash
   docker compose up -d
   ```

   Or point `DATABASE_URL` in `.env` at any Postgres instance.

3. Push the schema:

   ```bash
   npm run db:push
   ```

4. Ingest the seed ticker universe (`scripts/tickers.ts`) from Yahoo Finance:

   ```bash
   npm run ingest
   ```

5. Compute scores:

   ```bash
   npm run score
   ```

6. Compute Quality Compounder Scores:

   ```bash
   npm run score:quality
   ```

7. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the screener table, and click
   any company for its factsheet (financials trend table + Revenue/EPS chart). Visit
   [http://localhost:3000/compounders](http://localhost:3000/compounders) for the Quality
   Compounder ranking.

## Notes

- **Data source**: Yahoo Finance (free tier, via `yahoo-finance2`), per the plan's
  "free-tier first" decision.
- **Universe**: `scripts/tickers.ts` ships a small starter sample (5 SGX + 8 US tickers).
  Expand it toward the full SGX Top 100 + S&P 500 target.
- **Scoring**: MVP weights are Profitability 35% / Growth 25% / Financial Health 20% /
  Dividend 20%, computed via sector-relative percentile ranks (`src/lib/scoring.ts`).
  Valuation and Momentum categories are deferred until those indicators are added.
- **Price / Fair Value / Upside %** columns on the screener are placeholders — they
  require the deferred valuation/momentum indicator set.
- **Quality Compounder Score** (`/compounders`): ranks companies on 9 equal-weighted
  (~11.1% each), sector-relative factors — ROE, ROIC, Gross Margin stability, FCF Margin,
  Revenue CAGR (5Y), EPS CAGR (5Y), Debt-to-Equity, Interest Coverage, and Share Dilution
  trend (`src/lib/quality-score.ts`). Insider ownership was dropped — no free-tier data
  source covers it for SGX or US. ROE > 15% / ROIC > 12% are shown as informational badges,
  not hard filters. Computed by `npm run score:quality`.
