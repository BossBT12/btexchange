import { memo, useEffect, useState } from "react";
import { Box, Typography, Tabs, Tab, CircularProgress, IconButton } from "@mui/material";
import { AppColors } from "../../constant/appColors";
import useAuth from "../../hooks/useAuth";
import { createTradeSocket } from "../../services/tradingSocketService";
import tradingService from "../../services/tradingService";
import useTradeSocket from "../../hooks/useTradeSocket";
import { ArrowOutward } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { formatPairForDisplay } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useLiveClockMs } from "../../hooks/useLiveClockMs";

const api = createTradeSocket();

const formatTimestamp = (value) => {
  if (!value) return "-";
  try {
    const date =
      typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : value;
    if (Number.isNaN(date.getTime())) return "-";

    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    // Format: "DD. MM hh:mm:ss", 24-hour time
    return `${day}. ${month} ${hours}:${minutes}:${seconds}`;
  } catch {
    return "-";
  }
};

const formatPrice = (value) => {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/** Live countdown from now until expiryTime; updates every second */
const RemainingTimeRing = ({ startTime, expiryTime }) => {
  const nowMs = useLiveClockMs();

  if (!expiryTime) return "0s";
  const expiry = expiryTime instanceof Date ? expiryTime : new Date(expiryTime);
  const expiryMs = expiry.getTime();
  if (Number.isNaN(expiryMs)) return "0s";

  const start =
    startTime instanceof Date
      ? startTime
      : startTime
        ? new Date(startTime)
        : null;
  const startMs = start && !Number.isNaN(start.getTime()) ? start.getTime() : null;
  const totalMs = startMs ? expiryMs - startMs : null;
  const remainingMs = Math.max(0, expiryMs - nowMs);

  let progress = 0;
  if (totalMs && totalMs > 0) {
    progress = (remainingMs / totalMs) * 100;
  }

  const formatRemainingTime = (expiryVal, currentMs) => {
    const exp = expiryVal instanceof Date ? expiryVal : new Date(expiryVal);
    const expMs = exp.getTime();
    if (Number.isNaN(expMs)) return "0s";
    const rem = expMs - currentMs;
    if (rem <= 0) return "0s";
    const hours = Math.floor((rem % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((rem % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((rem % (1000 * 60)) / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={12}
        thickness={2}
        sx={{ color: `${AppColors.HLT_NONE}40` }}
      />
      <CircularProgress
        variant="determinate"
        value={progress}
        size={12}
        thickness={6}
        sx={{
          color: AppColors.TXT_MAIN,
          position: "absolute",
          left: 0,
          "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
        }}
      />
      <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, ml: 0.5 }}>
        {formatRemainingTime(expiry, nowMs)}
      </Typography>
    </Box>
  );
};

function TradingTabs({ onBetStarted, betProfitPercent }) {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [liveTrades, setLiveTrades] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { isLoggedIn, userData } = useAuth();
  const { joinUser } = useTradeSocket({ autoJoinPublic: false });
  const navigate = useNavigate();
  const fetchLiveTrades = async () => {
    if (!isLoggedIn) {
      setLiveTrades([]);
      return;
    }
    try {
      setLiveLoading(true);
      const response = await tradingService.getLiveTrades();
      if (response?.success) {
        setLiveTrades(response.data || []);
      } else {
        setLiveTrades([]);
      }
    } catch {
      setLiveTrades([]);
    } finally {
      setLiveLoading(false);
    }
  };

  const fetchTradeHistory = async () => {
    if (!isLoggedIn) {
      setTradeHistory([]);
      return;
    }
    try {
      setHistoryLoading(true);
      const params = {
        page: 1,
        limit: 10,
      };
      const response = await tradingService.getTradeHistory(params);
      if (response?.success) {
        setTradeHistory(response?.data?.closedPositions || []);
      } else {
        setTradeHistory([]);
      }
    } catch {
      setTradeHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !userData?.email) {
      setLiveTrades([]);
      setTradeHistory([]);
      return;
    }

    joinUser(userData.email);

    let didUnmount = false;

    const unsubscribeBetStarted = api.betStarted((data) => {
      if (!data || didUnmount) return;

      setLiveTrades((prev) => {
        if (data?.betId && prev.some((t) => t.betId === data.betId)) return prev;
        onBetStarted?.(data);
        return [data, ...prev];
      });
    });

    const unsubscribeBetResult = api.betResult((data) => {
      if (!data || didUnmount) return;

      setTradeHistory((prev) => {
        if (data?.betId && prev.some((t) => t.betId === data.betId)) return prev;
        return [data, ...prev];
      });

      setLiveTrades((prev) =>
        data?.betId ? prev.filter((t) => t.betId !== data.betId) : prev
      );

      // Keep live trades in sync with server after a result
      fetchLiveTrades();
    });

    // Fetch current state when user/session changes to ensure initial data
    fetchLiveTrades();
    fetchTradeHistory();

    return () => {
      didUnmount = true;
      if (typeof unsubscribeBetStarted === "function") {
        unsubscribeBetStarted();
      }
      if (typeof unsubscribeBetResult === "function") {
        unsubscribeBetResult();
      }
    };
  }, [isLoggedIn, userData?.email, joinUser, onBetStarted]);

  const tabs = [
    {
      key: "liveTrades",
      translationKey: "tradeTabs.tabs.liveTrades",
      defaultLabel: "Open Positions ({{count}})",
      getCount: () => liveTrades?.length || 0,
    },
    {
      key: "tradeHistory",
      translationKey: "tradeTabs.tabs.tradeHistory",
      defaultLabel: "Closed Positions ({{count}})",
      getCount: () => tradeHistory?.length || 0,
    },
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderLiveTradeCard = (trade, index) => {
    const directionColor =
      trade.direction === "UP" ? AppColors.SUCCESS : AppColors.ERROR;

    const fields = [
      {
        id: "amount",
        label: t("gameHistory.table.Amount", "Amount (USDT)"),
        value: formatPrice(trade.grossAmount),
      },
      {
        id: "pnlRate",
        label: t("gameHistory.table.PnlRate", "Pnl Rate"),
        value: <span style={{ color: AppColors.SUCCESS }}>{betProfitPercent || 100}%</span>,
      },
      {
        id: "entryPrice",
        label: t("gameHistory.table.EntryPrice", "Entry Price"),
        value: formatPrice(trade.entryPrice),
      },
      {
        id: "openTime",
        label: t("gameHistory.table.OpenTime", "Open Time"),
        value: formatTimestamp(trade.startTime),
      },
      {
        id: "remainingTime",
        label: t("gameHistory.table.RemainingTime", "Remaining Time"),
        value: (
          <RemainingTimeRing
            startTime={trade.startTime}
            expiryTime={trade.expiryTime}
          />
        ),
      },
    ];

    return (
      <Box
        key={trade.betId || `${trade.pair}-${trade.entryPrice}-${trade.startTime}`}
        sx={{
          py: 1,
          borderBottom: index === 0 ? 'none' : `1px solid ${AppColors.HLT_NONE}30`,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {/* Header - pair & direction icon */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: directionColor,
              }}
            >
              {trade.direction === "UP" ? <ArrowOutward sx={{ fontSize: "14px" }} /> : <ArrowOutward sx={{ fontSize: "14px", transform: "rotate(90deg)" }} />}
            </Box>
            <Typography
              sx={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: AppColors.TXT_MAIN,
              }}
            >
              {formatPairForDisplay(trade.pair)}
            </Typography>
          </Box>
        </Box>

        {/* Body - labels and values in a grid like a card table */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, minmax(0, 1fr))",
              sm: "repeat(5, minmax(0, 1fr))",
            },
            columnGap: 1,
            rowGap: 1,
          }}
        >
          {fields.map((field, index) => (
            <Box key={field.id} sx={{ textAlign: index % 3 === 2 ? 'right' : 'left' }}>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_SUB,
                }}
              >
                {field.label}
              </Typography>
              <Typography
                component="div"
                variant="body1"
                sx={{
                  fontWeight: field.id === "direction" ? 600 : 500,
                  color: field.color || AppColors.TXT_MAIN,
                }}
              >
                {field.value ?? "-"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderHistoryTradeCard = (trade, index) => {
    const directionColor =
      trade.direction === "UP" ? AppColors.SUCCESS : AppColors.ERROR;
    const statusColor =
      trade.status === "WIN" ? AppColors.SUCCESS : AppColors.ERROR;

    const fields = [
      {
        id: "amount",
        label: t("gameHistory.table.Amount", "Amount (USDT)"),
        value: formatPrice(trade?.amount),
      },
      {
        id: "pnlRate",
        label: t("gameHistory.table.PnlRate", "Pnl Rate"),
        value: <span style={{ color: trade?.pnlRate >= 0 ? AppColors.SUCCESS : AppColors.ERROR }}>{Math.abs(trade?.pnlRate) || 0}%</span>,
      },
      {
        id: "status",
        label: t("gameHistory.table.StatusLabel", "Status"),
        value: trade.status === "OPEN" ? t("gameHistory.table.StatusOpen", "Open") : trade.status === "WIN" ? t("gameHistory.table.StatusWin", "Win") : t("gameHistory.table.StatusLose", "Lose"),
        color: statusColor,
      },
      {
        id: "entry",
        label: t("gameHistory.table.Entry", "Entry Price"),
        value: formatPrice(trade?.entryPrice),
      },
      {
        id: "exit",
        label: t("gameHistory.table.Exit", "Close Price"),
        value: formatPrice(trade?.closePrice),
      },
      {
        id: "openTime",
        label: t("gameHistory.table.OpenTime", "Open Time"),
        value: formatTimestamp(trade?.openTime || trade.startTime || trade.createdAt),
      },
      {
        id: "closeTime",
        label: t("gameHistory.table.CloseTime", "Close Time"),
        value: formatTimestamp(trade?.closeTime || trade.expiryTime),
      },
    ];

    return (
      <Box
        key={trade.betId || `${trade.pair}-${trade.entryPrice}-${trade.startTime}`}
        sx={{
          py: 1,
          borderTop: index === 0 ? 'none' : `1px solid ${AppColors.HLT_NONE}30`,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {/* Header - pair & direction icon */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: directionColor,
              }}
            >
              {trade.direction === "UP" ? <ArrowOutward sx={{ fontSize: "14px" }} /> : <ArrowOutward sx={{ fontSize: "14px", transform: "rotate(90deg)" }} />}
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: AppColors.TXT_MAIN,
              }}
            >
              {formatPairForDisplay(trade.pair)}
            </Typography>
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: AppColors.SUCCESS,
            }}
          >
            {trade.status !== "OPEN" && (trade?.settlementAmount < 0 ? '-' : '+') + formatPrice(trade?.settlementAmount) + ' USDT'}
          </Typography>
        </Box>

        {/* Body - labels and values in a grid like a card table */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, minmax(0, 1fr))",
              sm: "repeat(7, minmax(0, 1fr))",
            },
            columnGap: 1,
            rowGap: 1,
          }}
        >
          {fields.map((field, index) => (
            <Box key={field.id} sx={{ textAlign: index % 3 === 2 ? 'right' : 'left' }}>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_SUB,
                }}
              >
                {field.label}
              </Typography>
              <Typography
                component="div"
                variant="body1"
                sx={{
                  fontWeight:
                    field.id === "direction" || field.id === "status"
                      ? 600
                      : 500,
                  color: field.color || AppColors.TXT_MAIN,
                }}
              >
                {field.value ?? "-"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <Box
        sx={{
          borderBottom: `1px solid ${AppColors.HLT_NONE}30`,
          bgcolor: AppColors.BG_CARD,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
          pl: 0,
          pt: 1,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            pb: 0,
            minHeight: "auto",
            "& .MuiTabs-indicator": {
              height: 2,
              background: `linear-gradient(90deg, ${AppColors.GOLD_PRIMARY}, ${AppColors.GOLD_LIGHT})`,
            },
            "& .MuiTab-root": {
              minHeight: 32,
              margin: "0px 10px",
              p: 0,
              pt: "2px",
              pb: "4px",
              fontSize: "0.713rem",
              color: AppColors.TXT_SUB,
              textTransform: "none",
              "&.Mui-selected": {
                fontSize: "0.775rem",
                color: AppColors.GOLD_PRIMARY,
                fontWeight: 800,
              },
            },
            "& .MuiTabs-scrollButtons": {
              color: AppColors.TXT_SUB,
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              label={t(tab.translationKey, {
                defaultValue: tab.defaultLabel,
                count: tab.getCount(),
              })}
            />
          ))}
        </Tabs>
        <IconButton onClick={() => navigate("/trade-history")}>
          <IoDocumentTextOutline style={{ fontSize: "16px" }} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ minHeight: 200 }}>
        {activeTab === 0 && (
          <Box>
            {!isLoggedIn ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: AppColors.TXT_SUB,
                }}
              >
                <Typography variant="body1">
                  {t(
                    "tradeTabs.states.liveNotLoggedIn.title",
                    "Connect to see your live trades"
                  )}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
                >
                  {t(
                    "tradeTabs.states.liveNotLoggedIn.subtitle",
                    "Log in and place trades to see them update in real time."
                  )}
                </Typography>
              </Box>
            ) : liveLoading ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: AppColors.TXT_SUB,
                }}
              >
                <Typography variant="body1">
                  {t(
                    "tradeTabs.states.liveLoading",
                    "Loading live trades..."
                  )}
                </Typography>
              </Box>
            ) : !liveTrades || liveTrades.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: AppColors.TXT_SUB,
                }}
              >
                <Typography variant="body1">
                  {t(
                    "tradeTabs.states.liveEmpty.title",
                    "No live trades"
                  )}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
                >
                  {t(
                    "tradeTabs.states.liveEmpty.subtitle",
                    "Start a new trade to see it here while it is open."
                  )}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  px: 1,
                }}
              >
                {liveTrades.map((trade, index) => renderLiveTradeCard(trade, index))}
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {!isLoggedIn ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: AppColors.TXT_SUB,
                }}
              >
                <Typography variant="body1">
                  {t(
                    "tradeTabs.states.historyNotLoggedIn.title",
                    "Connect to see your trade history"
                  )}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
                >
                  {t(
                    "tradeTabs.states.historyNotLoggedIn.subtitle",
                    "Log in to view a list of your completed trades."
                  )}
                </Typography>
              </Box>
            ) : historyLoading ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: AppColors.TXT_SUB,
                }}
              >
                <Typography variant="body1">
                  {t(
                    "tradeTabs.states.historyLoading",
                    "Loading trade history..."
                  )}
                </Typography>
              </Box>
            ) : !tradeHistory || tradeHistory.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  color: AppColors.TXT_SUB,
                }}
              >
                <Typography variant="body1">
                  {t(
                    "tradeTabs.states.historyEmpty.title",
                    "No trade history yet"
                  )}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
                >
                  {t(
                    "tradeTabs.states.historyEmpty.subtitle",
                    "After you complete trades, they will appear here."
                  )}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  px: 1,
                }}
              >
                {tradeHistory.map((trade, index) => renderHistoryTradeCard(trade, index))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default memo(TradingTabs);