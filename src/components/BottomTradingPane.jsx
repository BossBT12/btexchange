import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  Stack,
  Divider,
  Container,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { AppColors } from "../constant/appColors";
import { LocalAtm, ArrowOutward } from "@mui/icons-material";
import tradingService from "../services/tradingService";
import useSnackbar from "../hooks/useSnackbar";
import useAuth from "../hooks/useAuth";
import NumberSpinner from "./input/numberSpinner";
import authService from "../services/authService";
import LoaderMessageModal from "./LoaderMessageModal";
import { FONT_SIZE } from "../constant/lookUpConstant";
import {
  formatCurrencyForApi,
  formatCurrencyForDisplay,
  formatPairForDisplay,
  getCurrencyDisplayRate,
  DISPLAY_CURRENCIES,
} from "../utils/utils";
import { AiOutlineSwap } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../i18n";
import { Tabs, Tab, CircularProgress, Pagination } from "@mui/material";
import { createTradeSocket } from "../services/tradingSocketService";
import useTradeSocket from "../hooks/useTradeSocket";
import { useNavigate } from "react-router-dom";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useLiveClockMs } from "../hooks/useLiveClockMs";
import { HiOutlineRefresh } from "react-icons/hi";

// Canonical amount in USDT (API); displayCache keeps exact display value per currency for round-trip.
const initialAmountState = { amountUsdt: null, displayCache: {} };

const HISTORY_PAGE_SIZE = 10;

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
  const startMs =
    start && !Number.isNaN(start.getTime()) ? start.getTime() : null;
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
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
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

export default function BottomTradingPane({
  selectedPair,
  currency,
  setCurrency,
  betProfitPercent,
  onBetStarted,
}) {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [amountState, setAmountState] = useState(initialAmountState);
  const [amountSpinnerResetSeq, setAmountSpinnerResetSeq] = useState(0);
  const { amountUsdt, displayCache } = amountState;
  const [duration, setDuration] = useState("30s");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDirection, setPendingDirection] = useState(null); // "UP" | "DOWN"
  const [draftAmount, setDraftAmount] = useState(null);
  const [agreedRules, setAgreedRules] = useState(false);
  const [placing, setPlacing] = useState({
    loading: false,
    status: null,
  });
  const [currencyMenuAnchor, setCurrencyMenuAnchor] = useState(null);
  const [userBalance, setUserBalance] = useState({
    value: 0.0,
    loading: false,
  });
  const [liveTrades, setLiveTrades] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: HISTORY_PAGE_SIZE,
    total: 0,
  });
  const historyPageRef = useRef(1);
  const [liveLoading, setLiveLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { isLoggedIn, userData } = useAuth();
  const { joinUser } = useTradeSocket({ autoJoinPublic: false });
  const navigate = useNavigate();

  const { showSnackbar } = useSnackbar();

  const formattedPairForApi = useMemo(() => {
    if (!selectedPair) return "BTC-USD";
    if (selectedPair.includes("-")) return selectedPair;
    if (selectedPair.endsWith("USDT")) {
      return `${selectedPair.replace("USDT", "")}-USD`;
    }
    return selectedPair;
  }, [selectedPair]);

  const amountDisplayValue = useMemo(() => {
    if (amountUsdt == null) return null;
    const cached = displayCache[currency];
    if (cached != null) return cached;
    const rate = getCurrencyDisplayRate(currency);
    return Number((amountUsdt * rate).toFixed(2));
  }, [amountUsdt, currency, displayCache]);

  const amountNumber =
    amountDisplayValue != null ? Number(amountDisplayValue) : 0;

  const handleAmountChange = useCallback(
    (displayValue) => {
      if (displayValue === "" || displayValue == null) {
        setAmountState(initialAmountState);
        return;
      }
      const num = Number(displayValue);
      if (Number.isNaN(num)) return;
      const rate = getCurrencyDisplayRate(currency);
      const usdt = num / rate;
      setAmountState((prev) => ({
        amountUsdt: usdt,
        displayCache: { ...prev.displayCache, [currency]: num },
      }));
    },
    [currency],
  );
  const draftAmountNumber = Number(draftAmount) || 0;
  const payoutPercent = Number(betProfitPercent) || 100;
  const settlementAmount = amountNumber + (amountNumber * payoutPercent) / 100;
  const settlementDisplay =
    amountNumber > 0 ? settlementAmount.toFixed(2) : "--";

  const durations = [
    { value: "30s", label: "30s" },
    { value: "1m", label: "1m" },
    { value: "3m", label: "3m" },
    { value: "5m", label: "5m" },
    { value: "10m", label: "10m" },
    { value: "30m", label: "30m" },
    { value: "1h", label: "1H" },
    { value: "24h", label: "1D" },
  ];

  const handleStartTrade = (direction) => {
    if (!isLoggedIn) {
      showSnackbar(
        t("tradingPane.pleaseLogin", "Please login to place a trade."),
        "warning",
      );
      return;
    }
    if (amountNumber <= 0) {
      showSnackbar(
        t(
          "tradingPane.enterAmountGreaterThanZero",
          "Enter an amount greater than zero.",
        ),
        "error",
      );
      return;
    }
    setDraftAmount(
      amountDisplayValue != null ? String(amountDisplayValue) : null,
    );
    setAgreedRules(false);
    setPendingDirection(direction);
    setConfirmOpen(true);
  };

  const handleConfirmTrade = async (overrideAmount) => {
    if (!pendingDirection) return;
    const amountToUse =
      typeof overrideAmount === "number" ? overrideAmount : amountNumber;
    if (amountToUse <= 0) {
      showSnackbar(
        t(
          "tradingPane.enterAmountGreaterThanZero",
          "Enter an amount greater than zero.",
        ),
        "error",
      );
      return;
    }
    let placedSuccessfully = false;
    setPlacing((prev) => ({ ...prev, loading: true }));
    try {
      const payload = {
        pair: formattedPairForApi,
        amount: formatCurrencyForApi(amountToUse, currency),
        direction: pendingDirection,
        duration,
      };
      const response = await tradingService.placeSelfTrade(payload);
      if (response?.success) {
        showSnackbar(
          response?.message || t("tradingPane.tradePlaced", "Trade placed"),
          "success",
        );
        setPlacing({ loading: false, status: true });
        placedSuccessfully = true;
        fetchUserBalance();
      } else {
        throw new Error(
          response?.message ||
            t("tradingPane.failedToPlaceTrade", "Failed to place trade"),
        );
      }
    } catch (error) {
      console.error("Place trade failed:", error);
      setPlacing({ loading: false, status: false });
      showSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          t("tradingPane.failedToPlaceTrade", "Failed to place trade"),
        "error",
      );
    } finally {
      setConfirmOpen(false);
      if (placedSuccessfully) {
        setAmountState(initialAmountState);
        setAmountSpinnerResetSeq((n) => n + 1);
      } else if (overrideAmount != null) {
        const usdt = Number(formatCurrencyForApi(overrideAmount, currency));
        setAmountState((prev) => ({
          amountUsdt: usdt,
          displayCache: {
            ...prev.displayCache,
            [currency]: Number(overrideAmount),
          },
        }));
      }
    }
  };

  const fetchUserBalance = async () => {
    try {
      setUserBalance((prev) => ({ ...prev, loading: true }));
      const response = await authService.getUser();
      if (response?.success) {
        setUserBalance((prev) => ({
          ...prev,
          value: response?.data?.balances?.totalAvailableForTrading,
          loading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch user balance:", error);
    } finally {
      setUserBalance((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchUserBalance();
  }, []);

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

  const fetchTradeHistory = useCallback(
    async (page) => {
      if (!isLoggedIn) {
        setTradeHistory([]);
        setHistoryPagination({
          page: 1,
          limit: HISTORY_PAGE_SIZE,
          total: 0,
        });
        return;
      }
      const pageNum = Math.max(1, page ?? 1);
      try {
        setHistoryLoading(true);
        const response = await tradingService.getTradeHistory({
          page: pageNum,
          limit: HISTORY_PAGE_SIZE,
        });
        if (response?.success) {
          const data = response.data;
          setTradeHistory(data?.closedPositions || []);
          const pag = data?.pagination;
          if (pag) {
            setHistoryPagination({
              page: pag.page ?? pageNum,
              limit: pag.limit ?? HISTORY_PAGE_SIZE,
              total: pag.total ?? 0,
            });
          } else {
            const rows = data?.closedPositions || [];
            setHistoryPagination({
              page: pageNum,
              limit: HISTORY_PAGE_SIZE,
              total: rows.length,
            });
          }
        } else {
          setTradeHistory([]);
          setHistoryPagination({
            page: 1,
            limit: HISTORY_PAGE_SIZE,
            total: 0,
          });
        }
      } catch {
        setTradeHistory([]);
        setHistoryPagination({
          page: 1,
          limit: HISTORY_PAGE_SIZE,
          total: 0,
        });
      } finally {
        setHistoryLoading(false);
      }
    },
    [isLoggedIn],
  );

  useEffect(() => {
    historyPageRef.current = historyPagination.page;
  }, [historyPagination.page]);

  useEffect(() => {
    if (!isLoggedIn || !userData?.email) {
      setLiveTrades([]);
      setTradeHistory([]);
      setHistoryPagination({
        page: 1,
        limit: HISTORY_PAGE_SIZE,
        total: 0,
      });
      return;
    }

    joinUser(userData.email);

    let didUnmount = false;

    const unsubscribeBetStarted = api.betStarted((data) => {
      if (!data || didUnmount) return;

      setLiveTrades((prev) => {
        if (data?.betId && prev.some((t) => t.betId === data.betId))
          return prev;
        onBetStarted?.(data);
        return [data, ...prev];
      });
    });

    const unsubscribeBetResult = api.betResult((data) => {
      if (!data || didUnmount) return;

      fetchTradeHistory(historyPageRef.current);

      setLiveTrades((prev) =>
        data?.betId ? prev.filter((t) => t.betId !== data.betId) : prev,
      );

      fetchLiveTrades();
      fetchUserBalance();
    });

    // Fetch current state when user/session changes to ensure initial data
    fetchLiveTrades();
    fetchTradeHistory(1);

    return () => {
      didUnmount = true;
      if (typeof unsubscribeBetStarted === "function") {
        unsubscribeBetStarted();
      }
      if (typeof unsubscribeBetResult === "function") {
        unsubscribeBetResult();
      }
    };
  }, [isLoggedIn, userData?.email, joinUser, onBetStarted, fetchTradeHistory]);

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
      getCount: () => historyPagination.total || 0,
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
        value: (
          <span style={{ color: AppColors.SUCCESS }}>
            {betProfitPercent || 100}%
          </span>
        ),
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
        key={
          trade.betId || `${trade.pair}-${trade.entryPrice}-${trade.startTime}`
        }
        sx={{
          py: 1,
          borderBottom:
            index === 0 ? "none" : `1px solid ${AppColors.HLT_NONE}30`,
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
              {trade.direction === "UP" ? (
                <ArrowOutward sx={{ fontSize: "14px" }} />
              ) : (
                <ArrowOutward
                  sx={{ fontSize: "14px", transform: "rotate(90deg)" }}
                />
              )}
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
            <Box
              key={field.id}
              sx={{ textAlign: index % 3 === 2 ? "right" : "left" }}
            >
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
        value: (
          <span
            style={{
              color: trade?.pnlRate >= 0 ? AppColors.SUCCESS : AppColors.ERROR,
            }}
          >
            {Math.abs(trade?.pnlRate) || 0}%
          </span>
        ),
      },
      {
        id: "status",
        label: t("gameHistory.table.StatusLabel", "Status"),
        value:
          trade.status === "OPEN"
            ? t("gameHistory.table.StatusOpen", "Open")
            : trade.status === "WIN"
              ? t("gameHistory.table.StatusWin", "Win")
              : t("gameHistory.table.StatusLose", "Lose"),
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
        value: formatTimestamp(
          trade?.openTime || trade.startTime || trade.createdAt,
        ),
      },
      {
        id: "closeTime",
        label: t("gameHistory.table.CloseTime", "Close Time"),
        value: formatTimestamp(trade?.closeTime || trade.expiryTime),
      },
    ];

    return (
      <Box
        key={
          trade.id ||
          trade.betId ||
          `${trade.pair}-${trade.entryPrice}-${trade.startTime}`
        }
        sx={{
          py: 1,
          borderTop: index === 0 ? "none" : `1px solid ${AppColors.HLT_NONE}30`,
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
              {trade.direction === "UP" ? (
                <ArrowOutward sx={{ fontSize: "14px" }} />
              ) : (
                <ArrowOutward
                  sx={{ fontSize: "14px", transform: "rotate(90deg)" }}
                />
              )}
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
            {trade.status !== "OPEN" &&
              (trade?.settlementAmount < 0 ? "-" : "+") +
                formatPrice(trade?.settlementAmount) +
                " USDT"}
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
            <Box
              key={field.id}
              sx={{ textAlign: index % 3 === 2 ? "right" : "left" }}
            >
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Container maxWidth="md" sx={{ px: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.75,
            pb: 1,
            mt: 1.75,
          }}
        >
          <FormControl
            size="small"
            sx={{ width: "100%", gap: 0.5, maxWidth: "100%" }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: AppColors.TXT_MAIN, fontWeight: 500 }}
              >
                {t("tradingPane.timeUnit", "Time Unit")}
              </Typography>
              <Button
                size="small"
                sx={{ py: 0, px: 0.5, borderRadius: 12, textTransform: "none", display: "flex", alignItems: "center", gap: 0.5 }}
                onClick={(e) => setCurrencyMenuAnchor(e.currentTarget)}
                aria-haspopup="true"
                aria-controls={currencyMenuAnchor ? "currency-menu" : undefined}
                endIcon={<AiOutlineSwap />}
              >
                <span style={{ color: AppColors.TXT_MAIN }}>Currency </span>{"   "}
                <span>{currency}</span>
              </Button>
            </Box>
            <Grid container spacing={1}>
              {durations.map((option) => {
                const isActive = duration === option.value;
                return (
                  <Grid size={3} key={option.value}>
                    <Button
                      className={isActive ? "btn-primary" : ""}
                      onClick={() => setDuration(option.value)}
                      sx={{
                        width: "100%",
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: FONT_SIZE.BODY2,
                        fontWeight: 500,
                        py: 0.25,
                        bgcolor: !isActive && "transparent",
                        color: !isActive && AppColors.TXT_SUB,
                        border: "1px solid",
                        borderColor: !isActive && AppColors.HLT_SUB,
                        "&:hover": {
                          bgcolor: !isActive && AppColors.BG_CARD,
                        },
                      }}
                    >
                      {option.label}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          </FormControl>
          <Stack direction="column" spacing={1}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_MAIN,
                }}
              >
                {t("tradingPane.amountTitle", "Amount")} ({currency})
              </Typography>
              <Typography
                component="div"
                variant="body2"
                sx={{
                  color: AppColors.TXT_SUB,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  sx={{ py: 0, px: 0.5 }}
                  onClick={fetchUserBalance}
                >
                  <HiOutlineRefresh
                    style={{ fontSize: "14px", color: AppColors.GOLD_PRIMARY }}
                  />
                </IconButton>
                {t("tradingPane.avail", "Avail.")}{" "}
                <span style={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}>
                  {userBalance?.loading
                    ? t("tradingPane.loading", "Loading...")
                    : formatCurrencyForDisplay(
                        userBalance?.value ?? 0,
                        currency,
                      ).displayValue}
                </span>
                <IconButton
                  size="small"
                  sx={{ py: 0, px: 0.5 }}
                  onClick={(e) => setCurrencyMenuAnchor(e.currentTarget)}
                  aria-haspopup="true"
                  aria-controls={
                    currencyMenuAnchor ? "currency-menu" : undefined
                  }
                >
                  <AiOutlineSwap
                    style={{ fontSize: "14px", color: AppColors.GOLD_PRIMARY }}
                  />
                </IconButton>
                <Menu
                  id="currency-menu"
                  anchorEl={currencyMenuAnchor}
                  open={Boolean(currencyMenuAnchor)}
                  onClose={() => setCurrencyMenuAnchor(null)}
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  transformOrigin={{ vertical: "bottom", horizontal: "right" }}
                  slotProps={{
                    paper: {
                      sx: {
                        minWidth: 320,
                        px: 1,
                        borderRadius: 4,
                        bgcolor: "rgba(26, 26, 26, 0.85)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                        border: `1px solid ${AppColors.BORDER_MAIN}`,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        py: 0,
                        "& .MuiList-root": {
                          py: 0,
                        },
                      },
                    },
                  }}
                >
                  {DISPLAY_CURRENCIES.map((c, index) => (
                    <MenuItem
                      key={c.code}
                      selected={currency === c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyMenuAnchor(null);
                      }}
                      sx={{
                        color: AppColors.TXT_MAIN,
                        display: "flex",
                        justifyContent: "space-between",
                        py: 0,
                        paddingTop: { xs: 0, md: 1.25 },
                        paddingBottom: { xs: 0, md: 1.25 },
                        px: 1,
                        minHeight: 40,
                        borderBottom:
                          index < DISPLAY_CURRENCIES.length - 1
                            ? `1px solid ${AppColors.BORDER_MAIN}`
                            : "none",
                        "&:hover": { bgcolor: AppColors.BG_CARD_HOVER },
                        "&.MuiMenuItem-root, &.MuiButtonBase-root, &.MuiListItemButton-root":
                          {
                            paddingTop: { xs: 0, md: 1.25 },
                            paddingBottom: { xs: 0, md: 1.25 },
                          },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: AppColors.TXT_SUB }}
                      >
                        {c.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: AppColors.TXT_MAIN }}
                      >
                        {c.code}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Typography>
            </Box>
            <NumberSpinner
              key={`amount-${currency}-${amountSpinnerResetSeq}`}
              label={t("tradingPane.amount", "Enter trade amount")}
              min={0}
              max={1000000}
              size="small"
              defaultValue={
                amountDisplayValue != null ? amountDisplayValue : undefined
              }
              onChange={handleAmountChange}
              disableOnChangeOnBlur
              error={amountNumber <= 0}
              success={amountNumber > 0}
            />
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              <span
                style={{
                  textDecorationLine: "underline",
                  textDecorationStyle: "dotted",
                }}
              >
                {t("tradingPane.upPayout", "Up payout")}
              </span>{" "}
              <span style={{ color: AppColors.SUCCESS }}>
                {betProfitPercent || 100}%
              </span>
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              <span
                style={{
                  textDecorationLine: "underline",
                  textDecorationStyle: "dotted",
                }}
              >
                {t("tradingPane.downPayout", "Down payout")}
              </span>{" "}
              <span style={{ color: AppColors.SUCCESS }}>
                {betProfitPercent || 100}%
              </span>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
              <span>
                {t("tradingPane.settlementAmount", "Settlement Amount:")}
              </span>{" "}
              <span style={{ color: AppColors.TXT_MAIN }}>
                {settlementDisplay} {currency}
              </span>
            </Typography>
            <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
              <span>
                {t("tradingPane.settlementAmount", "Settlement Amount:")}
              </span>{" "}
              <span style={{ color: AppColors.TXT_MAIN }}>
                {settlementDisplay} {currency}
              </span>
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 0.75,
              flexDirection: "row",
            }}
          >
            <Button
              fullWidth
              startIcon={
                <ArrowOutward sx={{ fontSize: "18px", color: "#fff" }} />
              }
              sx={{
                borderRadius: 12,
                bgcolor: AppColors.SUCCESS,
                color: "#fff",
                textTransform: "none",
                fontWeight: 700,
                py: 0.875,
                fontSize: FONT_SIZE.BODY,
                "&:hover": {
                  bgcolor: AppColors.SUCCESS,
                  opacity: 0.9,
                },
              }}
              disabled={placing?.loading}
              onClick={() => handleStartTrade("UP")}
            >
              {t("tradingPane.up", "Up")}
            </Button>
            <Button
              fullWidth
              startIcon={
                <ArrowOutward
                  sx={{ fontSize: "18px", transform: "rotate(90deg)" }}
                />
              }
              sx={{
                borderRadius: 12,
                bgcolor: AppColors.ERROR,
                color: "#fff",
                textTransform: "none",
                fontWeight: 700,
                fontSize: FONT_SIZE.BODY,
                py: 0.875,
                "&:hover": {
                  bgcolor: AppColors.ERROR,
                  opacity: 0.9,
                },
              }}
              disabled={placing?.loading}
              onClick={() => handleStartTrade("DOWN")}
            >
              {t("tradingPane.down", "Down")}
            </Button>
          </Box>
        </Box>
      </Container>
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
                      "Connect to see your live trades",
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
                  >
                    {t(
                      "tradeTabs.states.liveNotLoggedIn.subtitle",
                      "Log in and place trades to see them update in real time.",
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
                      "Loading live trades...",
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
                    {t("tradeTabs.states.liveEmpty.title", "No live trades")}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
                  >
                    {t(
                      "tradeTabs.states.liveEmpty.subtitle",
                      "Start a new trade to see it here while it is open.",
                    )}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    px: 1,
                  }}
                >
                  {liveTrades.map((trade, index) =>
                    renderLiveTradeCard(trade, index),
                  )}
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
                      "Connect to see your trade history",
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
                  >
                    {t(
                      "tradeTabs.states.historyNotLoggedIn.subtitle",
                      "Log in to view a list of your completed trades.",
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
                      "Loading trade history...",
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
                      "No trade history yet",
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
                  >
                    {t(
                      "tradeTabs.states.historyEmpty.subtitle",
                      "After you complete trades, they will appear here.",
                    )}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    px: 1,
                  }}
                >
                  {tradeHistory.map((trade, index) =>
                    renderHistoryTradeCard(trade, index),
                  )}
                  {historyPagination.total > historyPagination.limit && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 2,
                      }}
                    >
                      <Pagination
                        count={Math.ceil(
                          historyPagination.total / historyPagination.limit,
                        )}
                        page={historyPagination.page}
                        onChange={(_, value) => fetchTradeHistory(value)}
                        size="small"
                        sx={{
                          "& .MuiPaginationItem-root": {
                            color: AppColors.TXT_MAIN,
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
      {confirmOpen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              width: "100%",
              bgcolor: AppColors.BG_SECONDARY,
            }}
          >
            <Container maxWidth="md">
              {/* Content */}
              <Box sx={{ pt: 1 }}>
                {/* Balance */}
                <Typography
                  variant="body1"
                  sx={{
                    color: AppColors.GOLD_PRIMARY,
                    opacity: 0.95,
                    fontWeight: 500,
                    letterSpacing: 0.3,
                  }}
                >
                  {formatPairForDisplay(formattedPairForApi)} · {duration}-{" "}
                  {pendingDirection === "DOWN"
                    ? t("tradingPane.down", "Down")
                    : t("tradingPane.up", "Up")}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}
                  >
                    {t("tradingPane.balance", "Balance")}
                  </Typography>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <LocalAtm
                      sx={{ fontSize: 18, color: AppColors.GOLD_PRIMARY }}
                    />
                    <Typography
                      variant="body1"
                      sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}
                    >
                      {userBalance?.loading
                        ? t("tradingPane.loading", "Loading...")
                        : formatCurrencyForDisplay(
                            userBalance?.value ?? 0,
                            currency,
                          ).displayValue}
                    </Typography>
                  </Box>
                </Box>

                {/* Quantity */}
                <Box
                  sx={{
                    mb: 1.5,
                    display: "flex",
                    flexDirection: "row",
                    gap: 0.75,
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}
                  >
                    {t("tradingPane.quantity", "Quantity")}
                  </Typography>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <NumberSpinner
                      label=""
                      min={0}
                      max={1000000}
                      size="small"
                      defaultValue={draftAmount}
                      onChange={(value) => setDraftAmount(value)}
                      error={draftAmountNumber <= 0}
                      success={draftAmountNumber > 0}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,
                    mb: 1,
                  }}
                >
                  {[1, 5, 10].map((mult) => (
                    <Button
                      key={mult}
                      variant={mult === 1 ? "contained" : "outlined"}
                      size="small"
                      sx={{
                        flex: "1 1 15%",
                        minWidth: 0,
                        borderRadius: 999,
                        bgcolor:
                          mult === 1 ? AppColors.GOLD_PRIMARY : "transparent",
                        color:
                          mult === 1
                            ? AppColors.TXT_BLACK
                            : AppColors.GOLD_PRIMARY,
                        borderColor: AppColors.GOLD_PRIMARY,
                        fontSize: "0.75rem",
                        textTransform: "none",
                        "&:hover": {
                          bgcolor:
                            mult === 1
                              ? AppColors.GOLD_DARK
                              : AppColors.HLT_LIGHT,
                        },
                      }}
                      onClick={() =>
                        setDraftAmount(Math.max(0, (amountNumber || 0) * mult))
                      }
                    >
                      {t("tradingPane.multiplier", "X{{mult}}", { mult })}
                    </Button>
                  ))}
                </Box>

                {/* Rules */}
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={agreedRules}
                      onChange={(e) => setAgreedRules(e.target.checked)}
                      sx={{
                        color: AppColors.GOLD_PRIMARY,
                        "&.Mui-checked": { color: AppColors.GOLD_PRIMARY },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{ color: AppColors.TXT_SUB }}
                    >
                      {t("tradingPane.agreeRules", "I agree")}{" "}
                      <Box
                        component="span"
                        sx={{ color: AppColors.ERROR, fontWeight: 600 }}
                      >
                        {t("tradingPane.presaleRules", "《Pre-sale rules》")}
                      </Box>
                    </Typography>
                  }
                />
              </Box>

              <Divider sx={{ borderColor: AppColors.HLT_SUB }} />

              {/* Footer actions */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.25,
                  gap: 1.5,
                }}
              >
                <Button
                  variant="text"
                  onClick={() => !placing?.loading && setConfirmOpen(false)}
                  disabled={placing?.loading}
                  sx={{
                    color: AppColors.TXT_SUB,
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      bgcolor: AppColors.HLT_SUB,
                    },
                  }}
                >
                  {t("tradingPane.cancel", "Cancel")}
                </Button>
                <Button
                  className="btn-primary"
                  fullWidth
                  disabled={
                    placing?.loading || !agreedRules || draftAmountNumber <= 0
                  }
                  onClick={() => handleConfirmTrade(draftAmountNumber)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: AppColors.GOLD_PRIMARY,
                    color: AppColors.TXT_BLACK,
                    px: 2,
                    "&:hover": {
                      bgcolor: AppColors.GOLD_DARK,
                    },
                  }}
                >
                  {placing?.loading
                    ? t("tradingPane.placing", "Placing...")
                    : t(
                        "tradingPane.totalAmount",
                        "Total amount {{value}} {{currency}}",
                        {
                          value: Number(draftAmountNumber).toFixed(2),
                          currency,
                        },
                      )}
                </Button>
              </Box>
            </Container>
          </Box>
        </Box>
      )}
      <LoaderMessageModal loading={placing?.loading} status={placing?.status} />
    </Box>
  );
}
