import { useSyncExternalStore } from "react";

let lastMs = Date.now();
const listeners = new Set();
let intervalId = null;

function tick() {
  lastMs = Date.now();
  listeners.forEach((cb) => cb());
}

function ensureInterval() {
  if (intervalId != null) return;
  intervalId = setInterval(tick, 1000);
}

function subscribeLiveClock(onStoreChange) {
  lastMs = Date.now();
  listeners.add(onStoreChange);
  ensureInterval();
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getLiveClockSnapshot() {
  return lastMs;
}

/** Monotonic ms clock shared across subscribers; updates once per second. */
export function useLiveClockMs() {
  return useSyncExternalStore(
    subscribeLiveClock,
    getLiveClockSnapshot,
    () => 0,
  );
}
