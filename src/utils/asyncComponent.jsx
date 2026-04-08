import React, { lazy, Suspense, Component } from "react";
import { Box, Typography, Button } from "@mui/material";
import BTLoader from "../components/Loader";
import { AppColors } from "../constant/appColors";

const RELOAD_KEY = "asyncComponent.lastReload";

const componentCache = new WeakMap();

const defaultFallback = (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      height: "100vh",
    }}
  >
    <BTLoader />
  </Box>
);

function isChunkError(error) {
  if (error?.name === "ChunkLoadError") return true;
  const msg = String(error?.message || "");
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("Importing a module script failed")
  );
}

function retryImport(importFunc, retryCount = 3) {
  return async () => {
    let lastError;
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        return await importFunc();
      } catch (error) {
        lastError = error;
        console.warn(
          `[AsyncComponent] Load failed (attempt ${attempt}/${retryCount}):`,
          error?.message || error,
        );
        if (attempt < retryCount) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
        }
      }
    }

    // All retries exhausted — if it looks like a stale deployment (chunk 404),
    // do a one-time full reload to pick up the new index.html + chunk manifest.
    if (isChunkError(lastError)) {
      const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      if (Date.now() - lastReload > 30_000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
        // Return a placeholder while the browser reloads
        return { default: () => null };
      }
    }

    throw lastError;
  };
}

class ChunkErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[AsyncComponent] Render error:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            height: "100vh",
            px: 3,
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: AppColors.TXT_SUB, fontSize: "0.9rem" }}>
            Something went wrong loading this page.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={this.handleRetry}
              sx={{ color: AppColors.GOLD_PRIMARY, borderColor: AppColors.GOLD_PRIMARY }}
            >
              Retry
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={this.handleReload}
              sx={{ bgcolor: AppColors.GOLD_PRIMARY, color: "#000" }}
            >
              Reload Page
            </Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

function asyncComponent(
  importFunc,
  {
    fallback = defaultFallback,
    displayName = "AsyncComponent",
    retryCount = 3,
  } = {}
) {
  if (componentCache.has(importFunc)) {
    return componentCache.get(importFunc);
  }

  const LazyComponent = lazy(retryImport(importFunc, retryCount));

  const WrappedComponent = (props) => (
    <ChunkErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ChunkErrorBoundary>
  );

  WrappedComponent.displayName = `Async(${displayName})`;

  WrappedComponent.preload = () => importFunc().catch(() => {});
  WrappedComponent.isLoaded = () => componentCache.has(importFunc);

  componentCache.set(importFunc, WrappedComponent);
  return WrappedComponent;
}

asyncComponent.createFactory =
  (defaultOptions = {}) =>
    (importFunc, options = {}) =>
      asyncComponent(importFunc, { ...defaultOptions, ...options });

asyncComponent.preloadAll = (components) =>
  Promise.allSettled(
    components.map((c) =>
      typeof c.preload === "function" ? c.preload() : Promise.resolve()
    )
  );

export default asyncComponent;
