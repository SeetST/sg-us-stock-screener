// Seed universe for the MVP (Phase 4 plan: "SGX Top 100 + S&P 500").
// SG side now covers the full Straits Times Index (30 components). The US
// side remains a representative S&P 500 sample. Expand further (or load
// from a CSV) to reach the full SGX Top 100 + S&P 500 universe.
//
// `exchange` here is only a fallback for company creation — ingest.ts
// derives the real NYSE/NASDAQ/AMEX/SGX value from Yahoo's exchangeName.

export type SeedTicker = {
  ticker: string; // Yahoo Finance symbol, e.g. "D05.SI" or "AAPL"
  exchange: "SGX" | "NYSE" | "NASDAQ" | "AMEX";
  country: "SG" | "US";
};

export const SEED_TICKERS: SeedTicker[] = [
  // SGX (Singapore) — Straits Times Index (30 components), Yahoo ".SI" suffix
  { ticker: "A17U.SI", exchange: "SGX", country: "SG" }, // CapitaLand Ascendas REIT
  { ticker: "C38U.SI", exchange: "SGX", country: "SG" }, // CapitaLand Integrated Commercial Trust
  { ticker: "9CI.SI", exchange: "SGX", country: "SG" }, // CapitaLand Investment
  { ticker: "C09.SI", exchange: "SGX", country: "SG" }, // City Developments
  { ticker: "D05.SI", exchange: "SGX", country: "SG" }, // DBS Group
  { ticker: "D01.SI", exchange: "SGX", country: "SG" }, // DFI Retail Group
  { ticker: "J69U.SI", exchange: "SGX", country: "SG" }, // Frasers Centrepoint Trust
  { ticker: "BUOU.SI", exchange: "SGX", country: "SG" }, // Frasers Logistics & Commercial Trust
  { ticker: "G13.SI", exchange: "SGX", country: "SG" }, // Genting Singapore
  { ticker: "H78.SI", exchange: "SGX", country: "SG" }, // Hongkong Land Holdings
  { ticker: "J36.SI", exchange: "SGX", country: "SG" }, // Jardine Matheson Holdings
  { ticker: "BN4.SI", exchange: "SGX", country: "SG" }, // Keppel Corporation
  { ticker: "AJBU.SI", exchange: "SGX", country: "SG" }, // Keppel DC REIT
  { ticker: "ME8U.SI", exchange: "SGX", country: "SG" }, // Mapletree Industrial Trust
  { ticker: "M44U.SI", exchange: "SGX", country: "SG" }, // Mapletree Logistics Trust
  { ticker: "N2IU.SI", exchange: "SGX", country: "SG" }, // Mapletree Pan Asia Commercial Trust
  { ticker: "O39.SI", exchange: "SGX", country: "SG" }, // OCBC Bank
  { ticker: "S58.SI", exchange: "SGX", country: "SG" }, // SATS
  { ticker: "5E2.SI", exchange: "SGX", country: "SG" }, // Seatrium
  { ticker: "U96.SI", exchange: "SGX", country: "SG" }, // Sembcorp Industries
  { ticker: "C6L.SI", exchange: "SGX", country: "SG" }, // Singapore Airlines
  { ticker: "S68.SI", exchange: "SGX", country: "SG" }, // Singapore Exchange
  { ticker: "Z74.SI", exchange: "SGX", country: "SG" }, // Singtel
  { ticker: "S63.SI", exchange: "SGX", country: "SG" }, // Singapore Technologies Engineering
  { ticker: "Y92.SI", exchange: "SGX", country: "SG" }, // Thai Beverages
  { ticker: "U11.SI", exchange: "SGX", country: "SG" }, // United Overseas Bank
  { ticker: "U14.SI", exchange: "SGX", country: "SG" }, // UOL Group
  { ticker: "V03.SI", exchange: "SGX", country: "SG" }, // Venture Corporation
  { ticker: "F34.SI", exchange: "SGX", country: "SG" }, // Wilmar International
  { ticker: "BS6.SI", exchange: "SGX", country: "SG" }, // Yangzijiang Shipbuilding

  // US — S&P 500 sample
  { ticker: "AAPL", exchange: "NASDAQ", country: "US" },
  { ticker: "MSFT", exchange: "NASDAQ", country: "US" },
  { ticker: "SPGI", exchange: "NYSE", country: "US" }, // S&P Global (case study)
  { ticker: "JNJ", exchange: "NYSE", country: "US" },
  { ticker: "PG", exchange: "NYSE", country: "US" },
  { ticker: "KO", exchange: "NYSE", country: "US" },
  { ticker: "JPM", exchange: "NYSE", country: "US" },
  { ticker: "XOM", exchange: "NYSE", country: "US" },
];
