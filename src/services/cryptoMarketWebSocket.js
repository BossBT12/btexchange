/**
 * Live crypto market data via Binance WebSocket (free, no API key).
 * Streams 24h ticker for all symbols - used for real-time volume & performance distribution.
 * @see https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
 */

const BINANCE_WS_URL = "wss://stream.binance.com:9443/stream?streams=!ticker@arr";
const BINANCE_REST_TICKER = "https://api.binance.com/api/v3/ticker/24hr";

// Same buckets as cryptoMarketService
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

function formatCompact(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return String(value);
}

function computeFromTickerMap(tickerMap) {
  const buckets = PERF_BUCKETS.map(() => 0);
  let totalVolumeUsd = 0;
  let riseCount = 0;
  let fallCount = 0;

  for (const { pct, quoteVolume } of tickerMap.values()) {
    if (Number.isFinite(quoteVolume)) totalVolumeUsd += quoteVolume;
    if (pct == null || !Number.isFinite(pct)) continue;
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
    volume24h: { value: formatCompact(totalVolumeUsd), change: null },
    performance: {
      values: buckets,
      labels: PERF_BUCKETS.map((b) => b.label),
      riseCount,
      fallCount,
    },
  };
}

/**
 * Creates a WebSocket connection to Binance all-market ticker stream.
 * Fetches initial snapshot via REST, then merges live WS updates.
 * @param {function} onData - Callback({ volume24h, performance }) on each update
 * @returns {{ close: function }} - Call close() to disconnect
 */
export function createMarketInsightsSocket(onData) {
  const tickerMap = new Map(); // symbol -> { pct, quoteVolume }
  let ws = null;
  let reconnectTimer = null;

  function emit() {
    if (typeof onData === "function") {
      const result = computeFromTickerMap(tickerMap);
      onData(result);
    }
  }

  function mergeTickers(arr) {
    if (!Array.isArray(arr)) return;
    for (const t of arr) {
      const symbol = t.s;
      if (!symbol || !symbol.endsWith("USDT")) continue;
      const pct = t.P != null ? parseFloat(t.P) : null;
      const quoteVol = t.q != null ? parseFloat(t.q) : 0;
      tickerMap.set(symbol, { pct, quoteVolume: quoteVol });
    }
    emit();
  }

  async function fetchInitialSnapshot() {
    try {
      const res = await fetch(BINANCE_REST_TICKER, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Snapshot failed: ${res.status}`);
      const data = await res.json();
      mergeTickers(data);
    } catch (err) {
      console.warn("[MarketWS] Initial snapshot failed:", err?.message);
      emit();
    }
  }

  function connect() {
    ws = new WebSocket(BINANCE_WS_URL);

    ws.onopen = () => {
      fetchInitialSnapshot();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.data) mergeTickers(msg.data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = (e) => {
      console.warn("[MarketWS] Error:", e);
    };

    ws.onclose = () => {
      ws = null;
      reconnectTimer = setTimeout(connect, 2000);
    };
  }

  connect();

  return {
    close() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
    },
  };
}

export default { createMarketInsightsSocket };
