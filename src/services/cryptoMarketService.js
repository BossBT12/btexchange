/**
 * Live crypto market data via CoinGecko public API (free, no API key).
 * @see https://www.coingecko.com/en/api/documentation
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const STABLECOIN_IDS = new Set(["tether", "usd-coin", "dai", "binance-usd", "first-digital-usd"]);

/** CoinGecko free tier is strict; cache + dedupe avoid 429/CORS noise on refresh. */
const GLOBAL_CACHE_TTL_MS = 3 * 60 * 1000; // 3 min — global stats change slowly
const GLOBAL_STALE_MAX_MS = 24 * 60 * 60 * 1000; // use stale on 429 if under 24h old
const SS_KEY_GLOBAL = "btexchange_cg_global_v1";

let globalFetchInFlight = null;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseGlobalJson(json) {
  const data = json.data ?? json;
  const marketCapUsd = data.total_market_cap?.usd ?? data.total_market_cap;
  const volumeUsd = data.total_volume?.usd ?? data.total_volume;
  const capChange = data.market_cap_change_percentage_24h_usd ?? 0;
  const volChange = data.volume_change_percentage_24h_usd ?? 0;
  return {
    marketCap: {
      value: formatCompact(Number(marketCapUsd)),
      change: Number(capChange) || 0,
    },
    volume24h: {
      value: formatCompact(Number(volumeUsd)),
      change: Number(volChange) || 0,
    },
  };
}

function readGlobalSessionCache() {
  try {
    const raw = sessionStorage.getItem(SS_KEY_GLOBAL);
    if (!raw) return null;
    const { at, payload } = JSON.parse(raw);
    if (!at || !payload) return null;
    return { at, payload };
  } catch {
    return null;
  }
}

function writeGlobalSessionCache(payload) {
  try {
    sessionStorage.setItem(
      SS_KEY_GLOBAL,
      JSON.stringify({ at: Date.now(), payload })
    );
  } catch {
    /* quota / private mode */
  }
}

let memoryGlobalCache = { payload: null, expires: 0, at: 0 };

function getFreshGlobalCache() {
  const now = Date.now();
  if (memoryGlobalCache.payload && now < memoryGlobalCache.expires) {
    return memoryGlobalCache.payload;
  }
  const ss = readGlobalSessionCache();
  if (ss && now - ss.at < GLOBAL_CACHE_TTL_MS) {
    memoryGlobalCache = {
      payload: ss.payload,
      expires: ss.at + GLOBAL_CACHE_TTL_MS,
      at: ss.at,
    };
    return ss.payload;
  }
  return null;
}

function getStaleGlobalFallback() {
  const now = Date.now();
  if (
    memoryGlobalCache.payload &&
    memoryGlobalCache.at &&
    now - memoryGlobalCache.at < GLOBAL_STALE_MAX_MS
  ) {
    return memoryGlobalCache.payload;
  }
  const ss = readGlobalSessionCache();
  if (ss && now - ss.at < GLOBAL_STALE_MAX_MS) return ss.payload;
  return null;
}

/**
 * Format large numbers for display (e.g. 1.28T, 28.5B).
 * @param {number} value
 * @returns {string}
 */
function formatCompact(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return String(value);
}

/**
 * Fetch top coins by market cap (excludes stablecoins so we get 5 volatile assets).
 * @param {number} count - Number of coins to return (default 5)
 * @returns {Promise<Array>} Array of coin objects shaped for UI cards
 */
async function getTopCoins(count = 5) {
  const perPage = Math.max(count + 5, 15);
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Market data failed: ${res.status}`);
  }
  const data = await res.json();
  const filtered = data.filter((coin) => !STABLECOIN_IDS.has(coin.id));
  const top = filtered.slice(0, count);

  return top.map((coin) => ({
    id: coin.id,
    symbol: (coin.symbol || "").toUpperCase(),
    name: coin.name || coin.symbol || "—",
    icon: coin.image, // URL from API; UI can use local assets for BTC/ETH/BNB if desired
    price: coin.current_price != null ? String(coin.current_price) : "—",
    change: coin.price_change_percentage_24h != null ? Number(coin.price_change_percentage_24h) : 0,
    type: "Crypto",
    volume24h: formatCompact(coin.total_volume),
    marketCap: formatCompact(coin.market_cap),
    high24h: coin.high_24h != null ? String(coin.high_24h) : "—",
    low24h: coin.low_24h != null ? String(coin.low_24h) : "—",
    lastUpdated: coin.last_updated,
  }));
}

/**
 * Fetch global market data (total market cap, 24h volume, and their 24h changes).
 * Uses CoinGecko /global endpoint.
 * @returns {Promise<{ marketCap: { value: string, change: number }, volume24h: { value: string, change: number } }>}
 */
async function fetchGlobalFromNetwork() {
  const url = `${COINGECKO_BASE}/global`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (res.status === 429) {
    const err = new Error("Global market data rate limited (429)");
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`Global market data failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return parseGlobalJson(json);
}

/**
 * Global market cap / volume from CoinGecko. Uses TTL cache, sessionStorage, in-flight dedupe,
 * stale fallback on 429, and one retry after backoff to reduce refresh storms.
 */
async function getGlobalMarketData() {
  const fresh = getFreshGlobalCache();
  if (fresh) return fresh;

  if (globalFetchInFlight) return globalFetchInFlight;

  globalFetchInFlight = (async () => {
    try {
      const data = await fetchGlobalFromNetwork();
      const now = Date.now();
      memoryGlobalCache = {
        payload: data,
        expires: now + GLOBAL_CACHE_TTL_MS,
        at: now,
      };
      writeGlobalSessionCache(data);
      return data;
    } catch (e) {
      if (e?.status === 429 || e?.message?.includes("429")) {
        const stale = getStaleGlobalFallback();
        if (stale) return stale;
        await sleep(2500);
        try {
          const data = await fetchGlobalFromNetwork();
          const now = Date.now();
          memoryGlobalCache = {
            payload: data,
            expires: now + GLOBAL_CACHE_TTL_MS,
            at: now,
          };
          writeGlobalSessionCache(data);
          return data;
        } catch {
          throw new Error(
            "Global market data temporarily unavailable. Please wait a minute and try again."
          );
        }
      }
      throw e;
    } finally {
      globalFetchInFlight = null;
    }
  })();

  return globalFetchInFlight;
}

/**
 * Fetch Fear & Greed Index from Alternative.me.
 * @returns {Promise<{ value: number, label: string }>}
 */
async function getFearGreedIndex() {
  const url = "https://api.alternative.me/fng/?limit=1";
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Fear & Greed Index failed: ${res.status}`);
  const json = await res.json();
  const data = json.data?.[0];
  if (!data) throw new Error("No Fear & Greed data");
  return {
    value: parseInt(data.value, 10) || 50,
    label: data.value_classification || "Neutral",
  };
}

// Buckets for market performance: [>8%, 6-8%, 4-6%, 2-4%, 0-2%, 0 to -2%, -2 to -4%, -4 to -6%, -6 to -8%, <-8%]
const PERF_BUCKETS = [
  { min: 8, max: Infinity, label: ">8%" },
  { min: 6, max: 8, label: "6-8%" },
  { min: 4, max: 6, label: "4-6%" },
  { min: 2, max: 4, label: "2-4%" },
  { min: 0, max: 2, label: "0-2%" },
  { min: -2, max: 0, label: "0-2%" },
  { min: -4, max: -2, label: "2-4%" },
  { min: -6, max: -4, label: "4-6%" },
  { min: -8, max: -6, label: "6-8%" },
  { min: -Infinity, max: -8, label: ">8%" },
];

/**
 * Fetch top coins and compute market performance distribution (rise/fall buckets).
 * @returns {Promise<{ values: number[], labels: string[], riseCount: number, fallCount: number }>}
 */
async function getMarketPerformance() {
  const perPage = 100;
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Market performance failed: ${res.status}`);
  const data = await res.json();
  const buckets = PERF_BUCKETS.map(() => 0);
  let riseCount = 0;
  let fallCount = 0;
  for (const coin of data) {
    const pct = coin.price_change_percentage_24h;
    if (pct == null) continue;
    const val = Number(pct);
    for (let i = 0; i < PERF_BUCKETS.length; i++) {
      const b = PERF_BUCKETS[i];
      if (val > b.min && val <= b.max) {
        buckets[i]++;
        if (i < 5) riseCount++;
        else fallCount++;
        break;
      }
    }
  }
  return {
    values: buckets,
    labels: PERF_BUCKETS.map((b) => b.label),
    riseCount,
    fallCount,
  };
}

const cryptoMarketService = {
  getTopCoins,
  getGlobalMarketData,
  getFearGreedIndex,
  getMarketPerformance,
  formatCompact,
};

export default cryptoMarketService;
