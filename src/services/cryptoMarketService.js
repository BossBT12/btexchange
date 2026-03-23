/**
 * Live crypto market data via CoinGecko public API (free, no API key).
 * @see https://www.coingecko.com/en/api/documentation
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const STABLECOIN_IDS = new Set(["tether", "usd-coin", "dai", "binance-usd", "first-digital-usd"]);

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
async function getGlobalMarketData() {
  const url = `${COINGECKO_BASE}/global`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Global market data failed: ${res.status}`);
  const json = await res.json();
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
