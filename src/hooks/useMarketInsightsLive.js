import { useEffect, useRef, useState, useCallback } from "react";
import cryptoMarketService from "../services/cryptoMarketService";
import { createMarketInsightsSocket } from "../services/cryptoMarketWebSocket";

const POLL_MARKET_CAP_MS = 2 * 60 * 1000; // 2 min - CoinGecko caches 10 min
const POLL_FEAR_GREED_MS = 60 * 60 * 1000; // 1 hour - updates daily

/**
 * Hook for live market insights data.
 * Binance WebSocket streams live volume + performance whenever `streamLive` is true.
 * CoinGecko REST (market cap, Fear & Greed) runs only when `loadRestInsights` is true.
 * @param {{ streamLive?: boolean, loadRestInsights?: boolean }} options
 */
export function useMarketInsightsLive(options = {}) {
  const streamLive = options.streamLive !== false;
  const loadRestInsights = options.loadRestInsights === true;

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
  const wsGenerationRef = useRef(0);
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
      setOverview((prev) => ({
        fearGreed: { value: fearGreed.value, label: fearGreed.label },
        marketCap: globalData.marketCap,
        volume24h: prev.volume24h ?? globalData.volume24h,
      }));
    } catch (err) {
      setError(err?.message || "Failed to load market data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Binance WebSocket: live 24h volume + performance distribution (always while Market page is open)
  useEffect(() => {
    if (!streamLive) return;

    const gen = ++wsGenerationRef.current;
    let cancelled = false;

    wsRef.current = createMarketInsightsSocket((data) => {
      if (cancelled || gen !== wsGenerationRef.current) return;
      setOverview((prev) => ({
        ...prev,
        volume24h: {
          ...data.volume24h,
          change: prev.volume24h?.change ?? data.volume24h.change,
        },
      }));
      setPerformance({
        values: data.performance.values,
        labels: data.performance.labels,
        riseCount: data.performance.riseCount,
        fallCount: data.performance.fallCount,
      });
    });

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [streamLive]);

  // CoinGecko + polling: only when Insights tab is visible (rate limits)
  useEffect(() => {
    if (!loadRestInsights) return;

    let cancelled = false;

    initialFetch();
    // Do not call fetchMarketCap / fetchFearGreed here — initialFetch already loads both.
    // Immediate extra polls were doubling CoinGecko traffic and triggering 429 on refresh.

    const pollMarketCap = () => {
      if (!cancelled) fetchMarketCap();
    };
    pollMarketCapRef.current = setInterval(pollMarketCap, POLL_MARKET_CAP_MS);

    const pollFearGreed = () => {
      if (!cancelled) fetchFearGreed();
    };
    pollFearGreedRef.current = setInterval(pollFearGreed, POLL_FEAR_GREED_MS);

    return () => {
      cancelled = true;
      if (pollMarketCapRef.current) {
        clearInterval(pollMarketCapRef.current);
        pollMarketCapRef.current = null;
      }
      if (pollFearGreedRef.current) {
        clearInterval(pollFearGreedRef.current);
        pollFearGreedRef.current = null;
      }
    };
  }, [loadRestInsights, initialFetch, fetchMarketCap, fetchFearGreed]);

  return { overview, performance, loading, error };
}

export default useMarketInsightsLive;
