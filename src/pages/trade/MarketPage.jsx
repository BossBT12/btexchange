import { useState, useMemo, memo, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  LocalFireDepartment as FlameIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import LandingPageList from "../../components/trading/LandingPageList";
import BTLoader from "../../components/Loader";
import { useMarketInsightsLive } from "../../hooks/useMarketInsightsLive";
import { useLocation } from "react-router-dom";

const TABS = ["Favorites", "Market", "Insights"];
const RANKING_TABS = ["Gainers", "Losers", "Volume"];
const MARKET_SUB_TABS = ["Trading pair list"];
const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "top", label: "Top Coins", icon: FlameIcon },
  { id: "tradable coin", label: "Tradable Coins", icon: TrendingUpIcon },
];

const FearGreedMeter = memo(({ value = 38, label = "Neutral" }) => {
  const cx = 60;
  const cy = 60; // center slightly lower for proper semicircle
  const radius = 45;
  const stroke = 8;
  const gradientId = "fear-greed-arc-gradient";

  const safeValue = Math.min(100, Math.max(0, value));

  const arcPath = useMemo(() => {
    const startX = cx - radius;
    const endX = cx + radius;
    return `M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${cy}`;
  }, []);

  const angleRad = useMemo(() => {
    const angleDeg = 180 - (safeValue / 100) * 180;
    return (angleDeg * Math.PI) / 180;
  }, [safeValue]);

  const dot = useMemo(() => {
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy - radius * Math.sin(angleRad),
    };
  }, [angleRad]);

  return (
    <Box sx={{ position: "relative", width: "100%", height: 80}}>

      <svg viewBox="0 0 120 80" width="100%" height="100%">

        <defs>
          <linearGradient id={gradientId}>
            <stop offset="0%" stopColor="#f44336" />
            <stop offset="50%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#4caf50" />
          </linearGradient>
        </defs>

        {/* Background */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Gradient arc */}
        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Indicator dot */}
        <circle
          cx={dot.x}
          cy={dot.y}
          r={6}
          fill="#fff"
          style={{
            transition: "cx 0.4s ease, cy 0.4s ease",
          }}
        />

      </svg>

      {/* Text */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <Typography variant="body1" fontWeight={700} sx={{ color: AppColors.TXT_MAIN }}>
          {safeValue}
        </Typography>

        <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
          {label}
        </Typography>

      </Box>

    </Box>
  );
});

FearGreedMeter.displayName = "FearGreedMeter";

// Mini line chart for copy trading card
const MiniChart = memo(({ data = [0, 20, 40, 30, 60, 80], positive = true }) => {
  const path = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 80;
    const h = 28;
    const points = data.map((v, i) => {
      const x = (i / (data?.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  }, [data]);
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 28" preserveAspectRatio="none">
      <path
        d={path}
        fill="none"
        stroke={positive ? AppColors.SUCCESS : AppColors.ERROR}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

MiniChart.displayName = "MiniChart";

export default function MarketPage() {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const debounceRef = useRef(null);
  const { state } = useLocation();
  const [activeTab, setActiveTab] = useState(state?.tab || "Market");
  const [rankingTab, setRankingTab] = useState("Gainers");
  const [marketSubTab, setMarketSubTab] = useState("Trading pair list");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showSearch, setShowSearch] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { overview, performance, loading: insightsLoading, error: insightsError } = useMarketInsightsLive(activeTab === "Insights");

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (event) => {
      const value = event.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setInputValue(value);
        debounceRef.current = null;
      }, 500);
    },
    []
  );

  const maxBarValue = performance?.values?.length
    ? Math.max(...performance?.values, 1)
    : 1;
  const percent =
    performance?.riseCount + performance?.fallCount > 0
      ? (performance.riseCount /
        (performance.riseCount + performance.fallCount)) *
      100
      : 50;

  const tilt = 8;

  return (
    <Box sx={{ bgcolor: AppColors.BG_MAIN, minHeight: "100vh", pb: 10 }}>
      {/* Top tabs: Favourites, Market, Insights + Search */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 0.75,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >

        {showSearch ? (
          <TextField
            variant="outlined"
            placeholder={t("market.search", "Search")}
            onChange={handleSearchChange}
            disabled={!showSearch}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: AppColors.TXT_SUB, fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: 1,
              mx: 0.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: 20,
                px: 1.25,
                py: 0,
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                "& .MuiInputBase-input": {
                  py: 0.75,
                },
                "& fieldset": {
                  border: "none",
                },
              },
            }}
          />
        ) : <Box sx={{ display: "flex", gap: 0.5 }}>
          {TABS.map((tab) => (
            <Typography
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant="body1"
              sx={{
                color: activeTab === tab ? AppColors.GOLD_PRIMARY : AppColors.TXT_SUB,
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer",
                px: 1.5,
                py: 0.75,
              }}
            >
              {t(`market.topTabs.${tab.toLowerCase()}`, tab)}
            </Typography>
          ))}
        </Box>}
        <IconButton size="small" sx={{ color: AppColors.TXT_MAIN }} onClick={() => {
          if (activeTab === "Insights") setActiveTab("Market");
          setShowSearch(!showSearch);
          setInputValue("");
        }}>
          {showSearch ? <CloseIcon sx={{ fontSize: 22 }} /> : <SearchIcon sx={{ fontSize: 22 }} />}
        </IconButton>
      </Box>

      {activeTab === "Market" || activeTab === "Favorites" ? (
        <>
          {/* Market sub-tabs: Futures, Spot, TradFi */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              px: 2,
              py: 1,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {MARKET_SUB_TABS.map((tab) => (
              <Typography
                key={tab}
                onClick={() => setMarketSubTab(tab)}
                sx={{
                  color: marketSubTab === tab ? AppColors.TXT_MAIN : AppColors.TXT_SUB,
                  fontWeight: marketSubTab === tab ? 600 : 400,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  pb: 0.5,
                  borderBottom: marketSubTab === tab ? `2px solid ${AppColors.GOLD_PRIMARY}` : "2px solid transparent",
                }}
              >
                {t(`market.subTabs.${tab.toLowerCase()}`, tab)}
              </Typography>
            ))}
          </Box>

          {/* Category filters */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              px: 2,
              py: 1.5,
              overflowX: "auto",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {CATEGORY_FILTERS.map((cat) => (
              <Box
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 10,
                  bgcolor: categoryFilter === cat.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                  color: categoryFilter === cat.id ? AppColors.TXT_MAIN : AppColors.TXT_SUB,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {cat.icon && <cat.icon sx={{ fontSize: 16 }} />}
                {t(`market.categories.${cat.id}`, cat.label)}
              </Box>
            ))}
          </Box>

          {/* Trading pair list */}
          <Box sx={{ px: 0, pb: 2 }}>
            <LandingPageList showAll activeTab={activeTab} searchValue={inputValue} />
          </Box>
        </>
      ) : (
        <Box sx={{ px: 1, py: 1 }}>
          {insightsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <BTLoader />
            </Box>
          ) : insightsError ? (
            <Typography sx={{ color: AppColors.ERROR, textAlign: "center", py: 2 }}>
              {insightsError}
            </Typography>
          ) : (
            <>
              {/* Market Overview */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: AppColors.TXT_MAIN,
                  mb: 1.5,
                }}
              >
                {t("market.overview.title", "Market Overview")}
              </Typography>
              <Grid
                container
                spacing={1}
              >
                <Grid size={4}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      bgcolor: AppColors.BG_MAIN,
                      border: "1px solid rgba(255,255,255,0.08)",
                      p: 1,
                      textAlign: "center",
                      height: "100%",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
                      {t("market.overview.fearGreed", "Fear & Greed Index")}
                    </Typography>
                    <FearGreedMeter
                      value={overview?.fearGreed?.value ?? 90}
                      label={overview?.fearGreed?.label ?? t("market.overview.fearGreedLabel", "Neutral")}
                    />

                  </Box>
                </Grid>
                <Grid size={4}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      bgcolor: AppColors.BG_MAIN,
                      border: "1px solid rgba(255,255,255,0.08)",
                      p: 1,
                      textAlign: "center",
                      height: "100%",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
                      {t("market.overview.marketCap", "Market Cap")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: AppColors.TXT_MAIN }}>
                      {overview.marketCap?.value != null ? `$${overview.marketCap.value}` : "—"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: (overview.marketCap?.change ?? 0) >= 0 ? AppColors.SUCCESS : AppColors.ERROR }}>
                      {(overview.marketCap?.change ?? 0) >= 0 ? "+" : ""}{(overview.marketCap?.change ?? 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={4}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      bgcolor: AppColors.BG_MAIN,
                      border: "1px solid rgba(255,255,255,0.08)",
                      p: 1,
                      textAlign: "center",
                      height: "100%",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
                      {t("market.overview.volume24h", "24h Volume")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: AppColors.TXT_MAIN }}>
                      {overview.volume24h?.value != null ? `$${overview.volume24h.value}` : "—"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: (overview.volume24h?.change ?? 0) >= 0 ? AppColors.SUCCESS : AppColors.ERROR }}>
                      {(overview.volume24h?.change ?? 0) >= 0 ? "+" : ""}{(overview.volume24h?.change ?? 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Market Performance */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: AppColors.TXT_MAIN,
                  mt: 2.5,
                  mb: 1.5,
                }}
              >
                {t("market.performance.title", "Market Performance")}
              </Typography>
              <Box>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, mb: 0.5 }}>
                  {(performance?.values?.length ? performance?.values : [0]).map((val, i) => (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: AppColors.TXT_MAIN,
                          mb: 0.25,
                        }}
                      >
                        {val}
                      </Typography>
                      <Box
                        sx={{
                          width: { xs: 8, md: 12 },
                          height: Math.max(8, (val / maxBarValue) * 48),
                          borderRadius: 1,
                          bgcolor: i < 5 ? AppColors.SUCCESS : AppColors.ERROR,
                          opacity: i < 5 ? 0.9 : 0.9,
                        }}
                      />
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", px: 0.25 }}>
                  {(performance?.labels?.length ? performance?.labels : [">8%", "6-8%", "4-6%", "2-4%", "0-2%", "0-2%", "2-4%", "4-6%", "6-8%", ">8%"]).map((label, i) => (
                    <Typography
                      key={i}
                      variant="body2"
                      sx={{
                        flex: 1,
                        color: AppColors.TXT_SUB,
                        textAlign: "center",
                      }}
                    >
                      {label}
                    </Typography>
                  ))}
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body1" sx={{ color: AppColors.TXT_MAIN }}>
                      {t("market.performance.rise", "Rise {{count}}", { count: performance?.riseCount })}
                    </Typography>
                    <Typography variant="body1" sx={{ color: AppColors.ERROR }}>
                      {t("market.performance.fall", "Fall {{count}}", { count: performance?.fallCount })}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      width: "100%",
                      height: { xs: 6, md: 8 },
                      borderRadius: "100px",
                      overflow: "hidden",
                    }}
                  >
                    {/* GREEN */}
                    <Box
                      sx={{
                        width: `${performance?.riseCount + performance?.fallCount > 0
                          ? (performance?.riseCount /
                            (performance?.riseCount + performance?.fallCount)) *
                          100
                          : 50
                          }%`,
                        bgcolor: AppColors.SUCCESS,

                        clipPath: "polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
                      }}
                    />

                    {/* RED */}
                    <Box
                      sx={{
                        flex: 1,
                        bgcolor: AppColors.ERROR,
                        clipPath: `polygon(8px 0, 100% 0, 100% 100%, 0 100%)`,
                      }}
                    />
                  </Box>


                </Box>
              </Box>
              {/* Market Rankings */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2.5, mb: 0.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: AppColors.TXT_MAIN,
                  }}
                >
                  {t("market.rankings.title", "Market Rankings")}
                </Typography>
                <IconButton size="small" sx={{ color: AppColors.TXT_SUB }}>
                  <ArrowForwardIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", gap: 2, px: 1 }}>
                {RANKING_TABS.map((tab) => (
                  <Typography
                    variant="body2"
                    key={tab}
                    onClick={() => setRankingTab(tab)}
                    sx={{
                      color: rankingTab === tab ? AppColors.TXT_MAIN : AppColors.TXT_SUB,
                      fontWeight: rankingTab === tab ? 600 : 400,
                      cursor: "pointer",
                      pb: 0.5,
                      borderBottom: rankingTab === tab ? `2px solid ${AppColors.GOLD_PRIMARY}` : "2px solid transparent",
                    }}
                  >
                    {t(`landing.tabs.${tab.toLowerCase()}`, tab)}
                  </Typography>
                ))}
              </Box>
              <LandingPageList limit={5} showAll={false} activeTab={rankingTab} />
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
