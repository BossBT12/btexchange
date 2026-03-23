import { useEffect, useRef, useState, useCallback } from "react";
import cryptoMarketService from "../services/cryptoMarketService";
import { createMarketInsightsSocket } from "../services/cryptoMarketWebSocket";

const POLL_MARKET_CAP_MS = 2 * 60 * 1000;  // 2 min - CoinGecko caches 10 min
const POLL_FEAR_GREED_MS = 60 * 60 * 1000; // 1 hour - updates daily

/**
 * Hook for live market insights data.
 * Uses Binance WebSocket for real-time volume + performance,
 * and REST polling for market cap + Fear & Greed (no WS available).
 * @param {boolean} active - Only connect when true (e.g. Insights tab visible)
 */
export function useMarketInsightsLive(active) {
  const [overview, setOverview] = useState({
    fearGreed: null,
    marketCap: null,
    volume24h: null,
  });
  const [performance, setPerformance] = useState({
    values: [],
    labels: [],
    riseCount: 0,
    fallCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const pollMarketCapRef = useRef(null);
  const pollFearGreedRef = useRef(null);

  const fetchMarketCap = useCallback(async () => {
    try {
      const data = await cryptoMarketService.getGlobalMarketData();
      setOverview((prev) => ({
        ...prev,
        marketCap: data.marketCap,
        volume24h: prev.volume24h ?? data.volume24h,
      }));
    } catch (err) {
      setError(err?.message || "Failed to load market cap");
    }
  }, []);

  const fetchFearGreed = useCallback(async () => {
    try {
      const data = await cryptoMarketService.getFearGreedIndex();
      setOverview((prev) => ({
        ...prev,
        fearGreed: { value: data.value, label: data.label },
      }));
    } catch (err) {
      setError(err?.message || "Failed to load Fear & Greed");
    }
  }, []);

  const initialFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [globalData, fearGreed] = await Promise.all([
        cryptoMarketService.getGlobalMarketData(),
        cryptoMarketService.getFearGreedIndex(),
      ]);
      setOverview({
        fearGreed: { value: fearGreed.value, label: fearGreed.label },
        marketCap: globalData.marketCap,
        volume24h: globalData.volume24h,
      });
    } catch (err) {
      setError(err?.message || "Failed to load market data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    // Initial REST fetch for market cap + fear & greed
    initialFetch();

    // WebSocket for live volume + performance
    wsRef.current = createMarketInsightsSocket((data) => {
      if (cancelled) return;
      setOverview((prev) => ({
        ...prev,
        volume24h: { ...data.volume24h, change: prev.volume24h?.change ?? data.volume24h.change },
      }));
      setPerformance({
        values: data.performance.values,
        labels: data.performance.labels,
        riseCount: data.performance.riseCount,
        fallCount: data.performance.fallCount,
      });
    });

    // Poll market cap periodically (CoinGecko has no WebSocket)
    const pollMarketCap = () => {
      if (!cancelled) fetchMarketCap();
    };
    pollMarketCap(); // Immediate fetch
    pollMarketCapRef.current = setInterval(pollMarketCap, POLL_MARKET_CAP_MS);

    // Poll Fear & Greed (updates ~daily)
    const pollFearGreed = () => {
      if (!cancelled) fetchFearGreed();
    };
    pollFearGreed(); // Immediate fetch
    pollFearGreedRef.current = setInterval(pollFearGreed, POLL_FEAR_GREED_MS);

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
      if (pollMarketCapRef.current) {
        clearInterval(pollMarketCapRef.current);
        pollMarketCapRef.current = null;
      }
      if (pollFearGreedRef.current) {
        clearInterval(pollFearGreedRef.current);
        pollFearGreedRef.current = null;
      }
    };
  }, [active, initialFetch, fetchMarketCap, fetchFearGreed]);

  return { overview, performance, loading, error };
}

export default useMarketInsightsLive;
