import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
} from "@mui/material";
import { createChart, ColorType, CandlestickSeries, createSeriesMarkers } from "lightweight-charts";
import { AppColors } from "../../constant/appColors";
import BTLoader from "../Loader";


const TIMEFRAMES = [
  // Coinbase has no 30s candles; fetch 1m and split each bar into two 30s candles (linear O→C path)
  { label: "30s", type: "split", subdivisions: 2, reference: "1m" },
  { label: "1m", apiGranularity: 60, type: "direct" },
  { label: "3m", apiGranularity: 60, type: "merge", factor: 3, reference: "1m" },
  { label: "5m", apiGranularity: 300, type: "direct" },
  { label: "10m", apiGranularity: 300, type: "merge", factor: 2, reference: "5m" },
  { label: "30m", apiGranularity: 300, type: "merge", factor: 6, reference: "5m" },
  { label: "1h", apiGranularity: 3600, type: "direct" },
  { label: "1D", apiGranularity: 86400, type: "direct" },
];
const TIMEFRAME_STORAGE_KEY = "tradingChart.selectedTimeframe";

/**
 * Coinbase REST + WS use `baseGranularity` (direct API values only).
 * Chart candles use `displayGranularity` (merge: base * factor; split: base / subdivisions).
 */
function resolveTimeframe(tf) {
  if (tf.type === "direct") {
    return {
      baseGranularity: tf.apiGranularity,
      displayGranularity: tf.apiGranularity,
      mergeFactor: 1,
      splitFromBase: false,
    };
  }
  if (tf.type === "split") {
    const ref = TIMEFRAMES.find((t) => t.label === tf.reference);
    if (!ref || ref.type !== "direct") {
      console.error("[TradingChart] Invalid split reference for", tf.label);
      return {
        baseGranularity: 60,
        displayGranularity: 60,
        mergeFactor: 1,
        splitFromBase: false,
      };
    }
    const base = ref.apiGranularity;
    const subs = tf.subdivisions;
    if (!subs || subs < 2 || base % subs !== 0) {
      console.error("[TradingChart] Invalid subdivisions for", tf.label);
      return {
        baseGranularity: base,
        displayGranularity: base,
        mergeFactor: 1,
        splitFromBase: false,
      };
    }
    return {
      baseGranularity: base,
      displayGranularity: base / subs,
      mergeFactor: 1,
      splitFromBase: true,
    };
  }
  const ref = TIMEFRAMES.find((t) => t.label === tf.reference);
  if (!ref || ref.type !== "direct") {
    console.error("[TradingChart] Invalid merge reference for", tf.label);
    return {
      baseGranularity: 60,
      displayGranularity: 60,
      mergeFactor: 1,
      splitFromBase: false,
    };
  }
  return {
    baseGranularity: ref.apiGranularity,
    displayGranularity: ref.apiGranularity * tf.factor,
    mergeFactor: tf.factor,
    splitFromBase: false,
  };
}

/**
 * Combine consecutive base-period OHLC candles into longer periods (oldest first).
 * Open = first candle in bucket; close = last; high/low = max/min.
 */
function aggregateCandles(baseCandles, baseGranularity, mergeFactor) {
  if (!Array.isArray(baseCandles) || baseCandles.length === 0) return [];
  if (mergeFactor <= 1) return baseCandles;

  const period = baseGranularity * mergeFactor;
  const sorted = [...baseCandles].sort((a, b) => a.time - b.time);
  const buckets = new Map();

  for (const c of sorted) {
    const bucketStart = Math.floor(c.time / period) * period;
    const agg = buckets.get(bucketStart);
    if (!agg) {
      buckets.set(bucketStart, {
        time: bucketStart,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });
    } else {
      agg.high = Math.max(agg.high, c.high);
      agg.low = Math.min(agg.low, c.low);
      agg.close = c.close;
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
}

/**
 * Split each base-period candle into shorter sub-intervals (e.g. 1m → 2×30s).
 * Linear interpolation open→close per sub-step. High/low must extend to the parent
 * bar's H/L on the right sub-bars or wicks disappear (high === max(open,close)).
 * (Coinbase has no true 30s OHLC — this is a calculated approximation.)
 */
function splitCandlesFromBase(baseCandles, baseGranularity, displayGranularity) {
  if (!Array.isArray(baseCandles) || baseCandles.length === 0) return [];
  const n = baseGranularity / displayGranularity;
  if (!Number.isInteger(n) || n < 2) return baseCandles;

  const sorted = [...baseCandles].sort((a, b) => a.time - b.time);
  const out = [];

  for (const c of sorted) {
    const t = c.time;
    const O = c.open;
    const C = c.close;
    const H = c.high;
    const L = c.low;

    if (O === C) {
      // Doji: put lower wick on the first sub-bar, upper wick on the last (continuous wick path).
      for (let i = 0; i < n; i++) {
        const tStart = t + i * displayGranularity;
        let high_i = O;
        let low_i = O;
        if (i === 0) {
          low_i = Math.min(L, O);
          high_i = O;
        } else if (i === n - 1) {
          low_i = O;
          high_i = Math.max(H, O);
        }
        out.push({
          time: tStart,
          open: O,
          high: high_i,
          low: low_i,
          close: O,
        });
      }
      continue;
    }

    const bodyTop = Math.max(O, C);
    const bodyBot = Math.min(O, C);
    // Along a monotonic O→C path, the body extreme for upper/lower wicks lands on a known segment.
    const upperSeg = C >= O ? n - 1 : 0;
    const lowerSeg = C >= O ? 0 : n - 1;

    for (let i = 0; i < n; i++) {
      const tStart = t + i * displayGranularity;
      const o_i = O + ((C - O) * i) / n;
      const c_i = O + ((C - O) * (i + 1)) / n;
      let high_i = Math.max(o_i, c_i);
      let low_i = Math.min(o_i, c_i);

      if (H > bodyTop && i === upperSeg) {
        high_i = Math.max(high_i, H);
      }
      if (L < bodyBot && i === lowerSeg) {
        low_i = Math.min(low_i, L);
      }

      out.push({
        time: tStart,
        open: o_i,
        high: high_i,
        low: low_i,
        close: c_i,
      });
    }
  }

  return out;
}

/** Map Coinbase candle rows (newest first) to display candles for the resolved timeframe. */
function mapCoinbaseRowsToDisplayCandles(rawRows, resolved) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];
  const mapped = [...rawRows].reverse().map((c) => ({
    time: c[0],
    open: parseFloat(c[3]),
    high: parseFloat(c[2]),
    low: parseFloat(c[1]),
    close: parseFloat(c[4]),
  }));
  if (resolved.splitFromBase) {
    return splitCandlesFromBase(
      mapped,
      resolved.baseGranularity,
      resolved.displayGranularity,
    );
  }
  return aggregateCandles(
    mapped,
    resolved.baseGranularity,
    resolved.mergeFactor,
  );
}

/** Merge prepended + existing OHLC by `time` (later series wins on duplicate). */
function mergeCandlesDedupeByTime(prepended, existing) {
  const byTime = new Map();
  for (const c of prepended) byTime.set(c.time, c);
  for (const c of existing) byTime.set(c.time, c);
  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

const LOGICAL_RANGE_LOAD_MORE_BARS = 24;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return String(price);
  const abs = Math.abs(n);

  let decimals;
  if (abs >= 1) decimals = 2;
  else if (abs >= 0.01) decimals = 4;
  else if (abs >= 0.0001) decimals = 6;
  else decimals = 8;

  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function TradingChart({ selectedPair = "BTCUSDT", tradeEntryMarkers = [] }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const seriesMarkersRef = useRef(null);
  const wsRef = useRef(null);
  const currentCandleRef = useRef(null);
  const currentPairRef = useRef(null); // Track currently subscribed pair
  const onPriceUpdateRef = useRef(); // Store callback in ref to avoid stale closures
  const previousClosePriceRef = useRef(null); // Track previous candle's close price for direction
  const seriesDataRef = useRef([]); // Mirrors series data for oldest time + prepend merges
  const isLoadingOlderRef = useRef(false);
  const hasMoreHistoryRef = useRef(true);
  const resyncRef = useRef(null);
  const isSyncingRef = useRef(false);
  const renderRafRef = useRef(0); // rAF id for throttled chart rendering
  /** Default 1m (index 1) so behavior matches pre–30s default */
  const [selectedTimeframe, setSelectedTimeframe] = useState(() => {
    const defaultIndex = 1;
    if (typeof window === "undefined") return defaultIndex;
    try {
      const stored = window.localStorage.getItem(TIMEFRAME_STORAGE_KEY);
      if (stored == null) return defaultIndex;
      const parsed = Number(stored);
      if (
        Number.isInteger(parsed) &&
        parsed >= 0 &&
        parsed < TIMEFRAMES.length
      ) {
        return parsed;
      }
    } catch (err) {
      console.warn("Failed to read saved timeframe:", err);
    }
    return defaultIndex;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const productId = selectedPair;

  const loadHistory = useCallback(async (pair, timeframeIndex) => {
    const tf = TIMEFRAMES[timeframeIndex];
    const resolved = resolveTimeframe(tf);

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(
        `https://api.exchange.coinbase.com/products/${pair}/candles?granularity=${resolved.baseGranularity}`,
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch data: ${res.statusText} (${res.status})`,
        );
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from API");
      }

      if (data.length === 0) {
        throw new Error("No historical data available for this timeframe");
      }

      return mapCoinbaseRowsToDisplayCandles(data, resolved);
    } catch (err) {
      console.error("Error loading history:", err);
      setError(err.message || "Failed to load chart data");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOlderHistory = useCallback(async (pair, timeframeIndex, oldestTimeExclusive) => {
    const tf = TIMEFRAMES[timeframeIndex];
    const resolved = resolveTimeframe(tf);
    const spanSeconds = 300 * resolved.baseGranularity;
    const endSec = oldestTimeExclusive;
    const startSec = endSec - spanSeconds;
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec) || startSec >= endSec) {
      return [];
    }

    try {
      const startIso = new Date(startSec * 1000).toISOString();
      const endIso = new Date(endSec * 1000).toISOString();
      const url =
        `https://api.exchange.coinbase.com/products/${encodeURIComponent(pair)}/candles` +
        `?granularity=${resolved.baseGranularity}` +
        `&start=${encodeURIComponent(startIso)}` +
        `&end=${encodeURIComponent(endIso)}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch older candles: ${res.statusText} (${res.status})`,
        );
      }

      const raw = await res.json();
      if (!Array.isArray(raw) || raw.length === 0) return [];

      return mapCoinbaseRowsToDisplayCandles(raw, resolved);
    } catch (err) {
      console.error("Error loading older history:", err);
      return [];
    }
  }, []);

  /** `candlePeriodSeconds` = bar width on chart (display period). Matches for direct; merged for merge TFs. */
  const connectWebSocket = useCallback((pair, candlePeriodSeconds) => {
    // Clean up existing WebSocket connection
    if (wsRef.current) {
      try {
        // Unsubscribe from previous pair before closing
        if (currentPairRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({
              type: "unsubscribe",
              product_ids: [currentPairRef.current],
              channels: ["matches"]
            }));
          } catch (e) {
            console.warn("Error unsubscribing from previous pair:", e);
          }
        }

        // Mark as intentionally closed before closing
        if (wsRef.current._cleanup) {
          wsRef.current._cleanup();
        }

        wsRef.current.close();
      } catch (e) {
        console.warn("Error closing WebSocket:", e);
      }
    }

    // Reset current candle when switching pairs
    currentCandleRef.current = null;
    previousClosePriceRef.current = null;

    // Update current pair reference
    currentPairRef.current = pair;

    const ws = new WebSocket("wss://ws-feed.exchange.coinbase.com");
    wsRef.current = ws;
    let reconnectTimeout = null;
    let isIntentionallyClosed = false;

    ws.onopen = () => {
      isIntentionallyClosed = false;

      try {
        // Subscribe to the new pair
        ws.send(JSON.stringify({
          type: "subscribe",
          product_ids: [pair],
          channels: ["matches"]
        }));
        console.log(`WebSocket subscribed to pair: ${pair}`);
      } catch (err) {
        console.error("Error subscribing to WebSocket:", err);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "subscriptions") {
          return;
        }

        if (msg.type === "error") {
          console.error("WebSocket error:", msg.message);
          return;
        }

        // Only process match messages for the current pair
        // Check if the message is for the currently subscribed pair
        if (
          msg.type === "match" &&
          seriesRef.current &&
          msg.price &&
          msg.size &&
          (msg.product_id === pair || msg.product_id === currentPairRef.current) // Verify message is for current pair
        ) {
          const price = parseFloat(msg.price);
          const time = new Date(msg.time).getTime() / 1000;

          const candleTime =
            Math.floor(time / candlePeriodSeconds) * candlePeriodSeconds;

          if (price > 0) {
            let priceDirection = null;

            if (!currentCandleRef.current || currentCandleRef.current.time !== candleTime) {
              const previousClose = currentCandleRef.current?.close || previousClosePriceRef.current || price;

              if (previousClose > 0 && price !== previousClose) {
                priceDirection = price > previousClose ? 'up' : 'down';
              }

              if (currentCandleRef.current?.close) {
                previousClosePriceRef.current = currentCandleRef.current.close;
              }

              currentCandleRef.current = {
                time: candleTime,
                open: previousClose,
                high: price,
                low: price,
                close: price,
              };
            } else {
              const candleOpen = currentCandleRef.current.open;
              if (candleOpen > 0 && price !== candleOpen) {
                priceDirection = price > candleOpen ? 'up' : 'down';
              }

              currentCandleRef.current.high = Math.max(currentCandleRef.current.high, price);
              currentCandleRef.current.low = Math.min(currentCandleRef.current.low, price);
              currentCandleRef.current.close = price;
            }

            if (onPriceUpdateRef.current) {
              onPriceUpdateRef.current(price, priceDirection);
            }

            // Throttle chart repaints to once per animation frame.
            // The ref update above is instant; the expensive series.update()
            // is batched so mobile browsers don't fall behind.
            if (!renderRafRef.current) {
              renderRafRef.current = requestAnimationFrame(() => {
                renderRafRef.current = 0;
                try {
                  if (seriesRef.current && currentCandleRef.current) {
                    seriesRef.current.update(currentCandleRef.current);
                  }
                } catch (err) {
                  console.error("Error updating chart:", err);
                }
              });
            }
          }
        } else if (
          msg.type === "match" &&
          msg.product_id &&
          msg.product_id !== pair &&
          msg.product_id !== currentPairRef.current
        ) {
          // Ignore messages from other pairs (might be delayed messages from previous subscription)
          // Only log in development to avoid console spam
          if (import.meta.env.DEV) {
            console.warn(`Ignoring message from wrong pair: ${msg.product_id} (current: ${currentPairRef.current || pair})`);
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error event:", error);
    };

    ws.onclose = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      // Only reconnect if it wasn't intentionally closed and we're still on the same pair
      if (!isIntentionallyClosed && chartRef.current && seriesRef.current && currentPairRef.current === pair) {
        reconnectTimeout = setTimeout(() => {
          connectWebSocket(pair, candlePeriodSeconds);
          // Fill candle gaps accumulated while the socket was down
          if (resyncRef.current) resyncRef.current();
        }, 3000);
      }
    };

    ws._cleanup = () => {
      isIntentionallyClosed = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const applyInitialView = useCallback((data) => {
    if (!chartRef.current || !Array.isArray(data) || data.length === 0) return;

    const timeScale = chartRef.current.timeScale();

    timeScale.applyOptions({
      rightOffset: 8,
      barSpacing: 8,
      minBarSpacing: 6,
    });

    const visibleBarsTarget = 80;
    const totalBars = data.length;
    const rightGap = 8;

    const from = totalBars <= visibleBarsTarget
      ? 0
      : totalBars - visibleBarsTarget;
    const to = totalBars - 1 + rightGap;

    timeScale.setVisibleLogicalRange({ from, to });
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    chartRef.current = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: AppColors.BG_CARD },
        textColor: AppColors.TXT_MAIN,
        fontSize: 8,
      },
      grid: {
        vertLines: { color: `${AppColors.HLT_NONE}20` },
        horzLines: { color: `${AppColors.HLT_NONE}20` },
      },
      rightPriceScale: {
        borderColor: `${AppColors.HLT_NONE}40`,
        minimumWidth: 70,
      },
      timeScale: {
        borderColor: `${AppColors.HLT_NONE}40`,
        rightOffset: 8,
        barSpacing: 8,
        minBarSpacing: 6,
      },
      width: container.clientWidth,
      height: container.clientHeight,
      autoSize: true,
    });

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: AppColors.SUCCESS,
      downColor: AppColors.ERROR,
      borderVisible: false,
      wickUpColor: AppColors.SUCCESS,
      wickDownColor: AppColors.ERROR,
      priceFormat: {
        type: "custom",
        formatter: formatPrice,
        minMove: 0.01,
      },
    });

    seriesMarkersRef.current = createSeriesMarkers(seriesRef.current, []);

    let isCancelled = false;
    const cancelSwitchRef = { current: false };
    let scrollSubscriptionActive = true;
    let lastVisibleLogicalFrom = null;

    const onVisibleLogicalRangeChange = (logicalRange) => {
      if (!scrollSubscriptionActive || logicalRange === null) return;
      if (!chartRef.current || !seriesRef.current) return;
      if (isLoadingOlderRef.current || !hasMoreHistoryRef.current) return;

      const from = logicalRange.from;
      const prevFrom = lastVisibleLogicalFrom;
      lastVisibleLogicalFrom = from;

      if (from > LOGICAL_RANGE_LOAD_MORE_BARS) return;
      if (prevFrom === null) return;
      if (from >= prevFrom) return;

      if (!seriesDataRef.current || seriesDataRef.current.length === 0) return;

      const run = async () => {
        if (isLoadingOlderRef.current || !scrollSubscriptionActive) return;
        isLoadingOlderRef.current = true;
        const timeScale = chartRef.current.timeScale();
        const visibleBefore = timeScale.getVisibleRange();

        let baseForMerge = seriesDataRef.current;
        if (!baseForMerge || baseForMerge.length === 0) {
          isLoadingOlderRef.current = false;
          return;
        }
        const oldestTime = baseForMerge[0].time;
        const tfResolved = resolveTimeframe(TIMEFRAMES[selectedTimeframe]);
        const currentBucketStart =
          Math.floor(Date.now() / 1000 / tfResolved.displayGranularity) *
          tfResolved.displayGranularity;

        const older = await loadOlderHistory(productId, selectedTimeframe, oldestTime);
        if (!scrollSubscriptionActive || isCancelled) {
          isLoadingOlderRef.current = false;
          return;
        }

        if (!older || older.length === 0) {
          hasMoreHistoryRef.current = false;
          isLoadingOlderRef.current = false;
          return;
        }

        const olderClosed = older.filter((c) => c.time < currentBucketStart);
        const olderUse = olderClosed.length > 0 ? olderClosed : older;
        baseForMerge = seriesDataRef.current;
        if (currentCandleRef.current && baseForMerge.length > 0) {
          const lastIdx = baseForMerge.length - 1;
          if (currentCandleRef.current.time === baseForMerge[lastIdx].time) {
            baseForMerge = [...baseForMerge];
            baseForMerge[lastIdx] = { ...currentCandleRef.current };
          }
        }
        const merged = mergeCandlesDedupeByTime(olderUse, baseForMerge);
        if (merged.length === baseForMerge.length) {
          hasMoreHistoryRef.current = false;
          isLoadingOlderRef.current = false;
          return;
        }

        seriesRef.current.setData(merged);
        seriesDataRef.current = merged;

        if (visibleBefore) {
          timeScale.setVisibleRange(visibleBefore);
        }

        isLoadingOlderRef.current = false;
      };

      void run();
    };

    (async () => {
      setIsLoading(true);

      // Clear existing data when timeframe changes
      if (seriesRef.current) {
        seriesRef.current.setData([]);
        currentCandleRef.current = null;
        previousClosePriceRef.current = null;
      }
      seriesDataRef.current = [];
      hasMoreHistoryRef.current = true;
      isLoadingOlderRef.current = false;

      // Give UI/socket a short pause before loading the next timeframe to avoid candle glitches
      await sleep(1000);
      if (isCancelled || cancelSwitchRef.current) return;

      const data = await loadHistory(productId, selectedTimeframe);
      if (isCancelled || cancelSwitchRef.current) return;

      const { displayGranularity } = resolveTimeframe(TIMEFRAMES[selectedTimeframe]);
      const currentBucketStart =
        Math.floor(Date.now() / 1000 / displayGranularity) * displayGranularity;

      // Separate closed candles from the currently forming (in-progress) candle.
      const closedCandles = data.filter((c) => c.time < currentBucketStart);
      const formingCandle = data.find((c) => c.time >= currentBucketStart);
      const candlesToRender =
        closedCandles.length > 0 ? closedCandles : data;

      if (candlesToRender.length > 0 && seriesRef.current) {
        seriesRef.current.setData(candlesToRender);
        seriesDataRef.current = candlesToRender;
        applyInitialView(candlesToRender);

        chartRef.current
          .timeScale()
          .subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);

        // Connect WS first — it resets currentCandleRef/previousClosePriceRef
        // as part of its cleanup. We seed refs AFTER so the reset doesn't
        // wipe the forming candle (this was the mobile bug).
        connectWebSocket(productId, displayGranularity);

        if (formingCandle) {
          currentCandleRef.current = { ...formingCandle };
          previousClosePriceRef.current = closedCandles.length > 0
            ? closedCandles[closedCandles.length - 1].close
            : formingCandle.open;
          seriesRef.current.update(currentCandleRef.current);
        } else {
          const lastCandle = candlesToRender[candlesToRender.length - 1];
          currentCandleRef.current = null;
          previousClosePriceRef.current = lastCandle ? lastCandle.close : null;
        }

        const displayCandle = formingCandle || candlesToRender[candlesToRender.length - 1];
        if (displayCandle && onPriceUpdateRef.current && displayCandle.close > 0) {
          let initialDirection = null;
          if (displayCandle.open > 0 && displayCandle.close > 0 && displayCandle.close !== displayCandle.open) {
            initialDirection = displayCandle.close > displayCandle.open ? 'up' : 'down';
          }
          onPriceUpdateRef.current(displayCandle.close, initialDirection);
        }
      } else {
        connectWebSocket(productId, displayGranularity);
      }
    })();

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const container = chartContainerRef.current;
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isCancelled = true;
      cancelSwitchRef.current = true;
      scrollSubscriptionActive = false;
      if (chartRef.current) {
        try {
          chartRef.current
            .timeScale()
            .unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);
        } catch {
          /* ignore */
        }
      }
      window.removeEventListener("resize", handleResize);
      if (renderRafRef.current) {
        cancelAnimationFrame(renderRafRef.current);
        renderRafRef.current = 0;
      }
      if (wsRef.current) {
        if (wsRef.current._cleanup) {
          wsRef.current._cleanup();
        }
        try {
          wsRef.current.close();
        } catch {
          /* ignore */
        }
        wsRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
      seriesMarkersRef.current = null;
      currentCandleRef.current = null;
      previousClosePriceRef.current = null;
      seriesDataRef.current = [];
    };
  }, [productId, selectedTimeframe, applyInitialView, loadHistory, loadOlderHistory, connectWebSocket]);

  // Keep resyncRef up to date so the visibility handler always uses current state.
  useEffect(() => {
    resyncRef.current = async () => {
      if (isSyncingRef.current || !seriesRef.current || !chartRef.current) return;
      isSyncingRef.current = true;

      try {
        const tf = TIMEFRAMES[selectedTimeframe];
        const resolved = resolveTimeframe(tf);

        const res = await fetch(
          `https://api.exchange.coinbase.com/products/${encodeURIComponent(productId)}/candles?granularity=${resolved.baseGranularity}`,
        );
        if (!res.ok) return;
        const raw = await res.json();
        if (!Array.isArray(raw) || raw.length === 0) return;

        const freshCandles = mapCoinbaseRowsToDisplayCandles(raw, resolved);
        const currentBucketStart =
          Math.floor(Date.now() / 1000 / resolved.displayGranularity) *
          resolved.displayGranularity;

        const freshClosed = freshCandles.filter((c) => c.time < currentBucketStart);
        const freshForming = freshCandles.find((c) => c.time >= currentBucketStart);

        const existing = seriesDataRef.current || [];
        const merged = mergeCandlesDedupeByTime(existing, freshClosed);

        if (!seriesRef.current) return;
        seriesRef.current.setData(merged);
        seriesDataRef.current = merged;

        if (freshForming) {
          if (currentCandleRef.current && currentCandleRef.current.time === freshForming.time) {
            currentCandleRef.current.high = Math.max(currentCandleRef.current.high, freshForming.high);
            currentCandleRef.current.low = Math.min(currentCandleRef.current.low, freshForming.low);
            currentCandleRef.current.close = freshForming.close;
          } else {
            currentCandleRef.current = { ...freshForming };
            previousClosePriceRef.current = freshClosed.length > 0
              ? freshClosed[freshClosed.length - 1].close
              : freshForming.open;
          }
          seriesRef.current.update(currentCandleRef.current);
        }

        // Ensure WebSocket is alive; reconnect if dead
        const ws = wsRef.current;
        if (!ws || (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING)) {
          connectWebSocket(productId, resolved.displayGranularity);
          // Re-seed refs after connectWebSocket resets them
          if (freshForming) {
            currentCandleRef.current = { ...freshForming };
            previousClosePriceRef.current = freshClosed.length > 0
              ? freshClosed[freshClosed.length - 1].close
              : freshForming.open;
          } else {
            const last = merged[merged.length - 1];
            previousClosePriceRef.current = last ? last.close : null;
          }
        }
      } catch (err) {
        console.error("[TradingChart] resync error:", err);
      } finally {
        isSyncingRef.current = false;
      }
    };
  }, [productId, selectedTimeframe, connectWebSocket]);

  // Resync chart data when the page becomes visible again (mobile tab switch,
  // screen lock, app switch). Fills candle gaps the WebSocket missed.
  useEffect(() => {
    let hiddenAt = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else {
        const hiddenMs = hiddenAt ? Date.now() - hiddenAt : 0;
        hiddenAt = null;
        if (hiddenMs > 3000 && resyncRef.current) {
          resyncRef.current();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Apply trade entry markers when bets start (from betStarted socket)
  useEffect(() => {
    const api = seriesMarkersRef.current;
    if (!api) return;

    const filtered = tradeEntryMarkers.filter((m) => m.pair === selectedPair);
    const markers = filtered.map((m) => {
      const t = m.startTime ? Math.floor(new Date(m.startTime).getTime() / 1000) : null;
      if (t == null) return null;
      const isUp = m.direction === "UP";
      return {
        time: t,
        position: isUp ? "aboveBar" : "belowBar",
        color: isUp ? AppColors.SUCCESS : AppColors.ERROR,
        shape: isUp ? "arrowUp" : "arrowDown",
        text: "Entry",
        ...(m.betId && { id: m.betId }),
      };
    }).filter(Boolean);

    api.setMarkers(markers);
  }, [tradeEntryMarkers, selectedPair, isLoading]);

  const handleTimeframeChange = (index) => {
    setSelectedTimeframe(index);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        TIMEFRAME_STORAGE_KEY,
        String(selectedTimeframe),
      );
    } catch (err) {
      console.warn("Failed to save selected timeframe:", err);
    }
  }, [selectedTimeframe]);

  // Screenshot functionality (wired when toolbar is enabled)
  const _handleScreenshot = useCallback(async () => {
    if (!chartRef.current || !chartContainerRef.current) return;

    try {
      // Try to use lightweight-charts built-in screenshot
      let canvas;
      try {
        canvas = chartRef.current.takeScreenshot();
      } catch {
        // Fallback: use html2canvas or create canvas from container
        console.warn("Chart takeScreenshot not available, using fallback");
        canvas = null;
      }

      if (!canvas) {
        // Fallback: capture the container using html2canvas
        // For now, we'll use a simple canvas approach
        const container = chartContainerRef.current.parentElement;
        if (!container) return;

        // Create a canvas from the chart's internal canvas
        const chartCanvas = container.querySelector("canvas");
        if (chartCanvas) {
          canvas = document.createElement("canvas");
          canvas.width = chartCanvas.width;
          canvas.height = chartCanvas.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(chartCanvas, 0, 0);
        }
      }

      if (!canvas) {
        throw new Error("Failed to capture chart");
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chart-${selectedPair}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }, "image/png");
    } catch (err) {
      console.error("Error taking screenshot:", err);
      alert("Failed to take screenshot. Please try again.");
    }
  }, [selectedPair]);

  // Fullscreen functionality (wired when toolbar is enabled)
  const _handleFullscreen = useCallback(() => {
    const container = chartContainerRef.current?.parentElement?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <Box
      sx={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 0.5,
          borderBottom: `1px solid ${AppColors.HLT_NONE}30`,
          bgcolor: AppColors.BG_MAIN,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {/* <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Indicators">
            <IconButton size="small" sx={{ color: AppColors.TXT_SUB }}>
              <Settings sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Screenshot">
            <IconButton size="small" sx={{ color: AppColors.TXT_SUB }} onClick={handleScreenshot}>
              <CameraAlt sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton size="small" sx={{ color: AppColors.TXT_SUB }} onClick={handleFullscreen}>
              {isFullscreen ? <FullscreenExit sx={{ fontSize: 16 }} /> : <Fullscreen sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box> */}
        <Box
          sx={{
            px: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {TIMEFRAMES.map((tf, index) => {
            const isActive = selectedTimeframe === index;
            return (
              <Typography
                key={tf.label}
                variant="body2"
                onClick={() => handleTimeframeChange(index)}
                sx={{
                  position: "relative",
                  cursor: "pointer",
                  color: isActive ? AppColors.TXT_MAIN : AppColors.TXT_SUB,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.813rem",
                  pb: 0.5,
                  "&::after": isActive
                    ? {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 2,
                      borderRadius: 999,
                      bgcolor: AppColors.GOLD_PRIMARY,
                    }
                    : {},
                }}
              >
                {tf.label}
              </Typography>
            );
          })}
        </Box>
        <Typography
          variant="body2"
          sx={{
            ml: "auto",
            color: AppColors.TXT_SUB,
            fontSize: "0.75rem",
            whiteSpace: "nowrap",
          }}
        >
          Index Price
        </Typography>
      </Box>
      <Box
        sx={{
          position: "relative",
          flex: 1,
          bgcolor: AppColors.BG_MAIN,
          minHeight: { xs: 300, sm: 400, md: 500, lg: 600 },
          width: "100%",
        }}
      >
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <BTLoader size={40} sx={{ color: AppColors.GOLD_PRIMARY }} />
          </Box>
        )}
        {error && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: AppColors.ERROR, mb: 1 }}>
              {error}
            </Typography>
            <Button
              size="small"
              onClick={() => {
                loadHistory(productId, selectedTimeframe).then((d) => {
                  if (d.length > 0 && seriesRef.current) {
                    const { displayGranularity: dg } = resolveTimeframe(TIMEFRAMES[selectedTimeframe]);
                    const bucketStart = Math.floor(Date.now() / 1000 / dg) * dg;
                    const closed = d.filter((c) => c.time < bucketStart);
                    const forming = d.find((c) => c.time >= bucketStart);
                    const toRender = closed.length > 0 ? closed : d;

                    seriesRef.current.setData(toRender);
                    seriesDataRef.current = toRender;
                    hasMoreHistoryRef.current = true;
                    applyInitialView(toRender);

                    connectWebSocket(productId, dg);

                    if (forming) {
                      currentCandleRef.current = { ...forming };
                      previousClosePriceRef.current = closed.length > 0
                        ? closed[closed.length - 1].close
                        : forming.open;
                      seriesRef.current.update(currentCandleRef.current);
                    } else {
                      const last = toRender[toRender.length - 1];
                      currentCandleRef.current = null;
                      previousClosePriceRef.current = last ? last.close : null;
                    }
                  }
                });
              }}
              sx={{ color: AppColors.GOLD_PRIMARY }}
            >
              Retry
            </Button>
          </Box>
        )}
        <Box
          ref={chartContainerRef}
          sx={{
            width: "100%",
            height: "100%",
            flex: 1,
          }}
        />
      </Box>
    </Box>
  );
}
