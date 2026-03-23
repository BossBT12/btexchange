import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  OutlinedInput,
  Button,
  Collapse,
} from "@mui/material";
import { ArrowBackIosNew, ArrowOutward, FilterAlt, Refresh, Search } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import useAuth from "../../hooks/useAuth";
import tradingService from "../../services/tradingService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { formatPairForDisplay } from "../../utils/utils";

const PAGE_SIZE = 10;

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

const emptyStateSx = {
  textAlign: "center",
  py: 8,
  color: AppColors.TXT_SUB,
};

function GameHistoryPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const debounceRef = useRef(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pairInput, setPairInput] = useState("");
  const [pnlDateRange, setPnlDateRange] = useState("today"); // "today" | "yesterday" | "monthly" | "all"
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!isLoggedIn) {
      setTradeHistory([]);
      setTotal(null);
      return;
    }
    try {
      setLoading(true);
      let params = {
        page,
        limit: PAGE_SIZE,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(pairInput?.trim() && { pair: pairInput.trim() }),
        ...(pnlDateRange && { period: pnlDateRange })
      };
      const response = await tradingService.getTradeHistory(params);
      if (response?.success) {
        const data = response.data;
        const list = Array.isArray(data?.closedPositions) ? data?.closedPositions : []
        setTradeHistory(list);
        setSummaryData(data?.summary);
        setTotal(data?.total ?? (list.length < PAGE_SIZE ? list.length : null));
      } else {
        setTradeHistory([]);
        setTotal(null);
      }
    } catch {
      setTradeHistory([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, page, statusFilter, pairInput, pnlDateRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const hasNext = total === null ? tradeHistory.length >= PAGE_SIZE : page * PAGE_SIZE < total;
  const hasPrev = page > 1;

  const renderHistoryTradeCard = (trade, index) => {
    const directionColor =
      trade.direction === "UP" ? AppColors.SUCCESS : AppColors.ERROR;
    const statusColor =
      trade.status === "WIN" ? AppColors.SUCCESS : AppColors.ERROR;

    const fields = [
      {
        id: "amount",
        label: t("gameHistory.table.Amount", "Amount (USDT)"),
        value: formatPrice(trade.grossAmount || trade.amount),
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
        value: formatPrice(trade.entryPrice),
      },
      {
        id: "exit",
        label: t("gameHistory.table.Exit", "Close Price"),
        value: formatPrice(trade.exitPrice || trade.closePrice),
      },
      {
        id: "openTime",
        label: t("gameHistory.table.OpenTime", "Open Time"),
        value: formatTimestamp(trade.startTime || trade.createdAt || trade.openTime),
      },
      {
        id: "closeTime",
        label: t("gameHistory.table.CloseTime", "Close Time"),
        value: formatTimestamp(trade.expiryTime || trade.closeTime),
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
            {trade.status !== "OPEN" && (trade.settlementAmount < 0 ? "-" : "+") + formatPrice(trade.settlementAmount) + " " + t("gameHistory.currencyUsdt", "USDT")}
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
        setPairInput(value);
        setPage(1);
        debounceRef.current = null;
      }, 500);
    },
    []
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: AppColors.TXT_MAIN,
        bgcolor: AppColors.BG_MAIN,
        pb: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
          px: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{ color: AppColors.TXT_MAIN, px: 0.75 }}
          aria-label={t("gameHistory.back", "Back")}
        >
          <ArrowBackIosNew sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("gameHistory.title", "Trade History")}
        </Typography>
        <IconButton
          onClick={fetchHistory}
          disabled={loading}
          aria-label={t("gameHistory.refresh", "Refresh")}
          sx={{ color: AppColors.TXT_MAIN, p: 1 }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ px: 1.5 }}>
        {!isLoggedIn ? (
          <Box sx={emptyStateSx}>
            <Typography variant="body1">
              {t(
                "gameHistory.notLoggedIn.title",
                "Connect to see your trade history"
              )}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontSize: "0.75rem", mt: 1, display: "block" }}
            >
              {t(
                "gameHistory.notLoggedIn.subtitle",
                "Log in to view a list of your completed trades."
              )}
            </Typography>
          </Box>
        ) : (
          <>
            {/* PNL Summary & Stats */}
            <Box sx={{ mb: 2, mt: 1 }}>
              <Typography variant="caption" sx={{ color: AppColors.TXT_SUB, display: "block", mb: 0.5 }}>
                {t("gameHistory.summary.totalPnl", "Total PNL")}
              </Typography>
              {loading ?
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 400,
                    color: AppColors.TXT_WHITE
                  }}
                >
                  {t("gameHistory.loadingShort", "Loading...")}
                </Typography> :
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 400,
                    color: (summaryData?.totalPnl >= 0 ? AppColors.SUCCESS : AppColors.ERROR),
                  }}
                >
                  {((summaryData?.totalPnl >= 0 ? "+" : "") + formatPrice(summaryData?.totalPnl))} <Typography variant="body2" sx={{ display: "inline" }}>{t("gameHistory.currencyUsdt", "USDT")}</Typography>
                </Typography>
              }


              <Box sx={{ display: "flex", gap: 0.25, mt: 1.5, flexWrap: "wrap" }}>
                {(["today", "yesterday", "monthly", "all"]).map((range) => (
                  <Button
                    key={range}
                    size="small"
                    onClick={() => setPnlDateRange(range)}
                    className={`${pnlDateRange === range && "bg-auShade"}`}
                    sx={{
                      borderRadius: 5,
                      textTransform: "capitalize",
                      color: pnlDateRange === range ? AppColors.TXT_BLACK : AppColors.TXT_SUB,
                      minWidth: 0,
                      px: 1.25,
                      py: 0.25,
                      fontSize: "0.725rem",
                    }}
                  >
                    {range === "today"
                      ? t("gameHistory.summary.today", "Today")
                      : range === "yesterday"
                        ? t("gameHistory.summary.yesterday", "Yesterday")
                        : range === "monthly"
                          ? t("gameHistory.summary.monthly", "Monthly")
                          : t("gameHistory.summary.all", "All")}
                  </Button>
                ))}
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box
                  sx={{
                    display: "flex",
                    py: 0.5,
                    border: "none",
                    "& .MuiTypography-root": { border: "none", textDecoration: "none" },
                  }}
                >
                  <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, border: "none", textDecoration: "none" }}>
                    {t("gameHistory.summary.totalProfit", "Total Profit")}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 8,
                      alignSelf: "center",
                      height: 0,
                      margin: "0 8px",
                      borderBottom: "1px dashed",
                      borderColor: AppColors.BORDER_MAIN,
                    }}
                  />
                  {loading
                    ?
                    <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                      {t("gameHistory.loadingShort", "Loading...")}
                    </Typography>
                    :
                    <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                      {formatPrice(summaryData?.totalProfit)} {t("gameHistory.currencyUsdt", "USDT")}
                    </Typography>
                  }
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 0.5,
                    border: "none",
                    "& .MuiTypography-root": { border: "none", textDecoration: "none" },
                  }}
                >
                  <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, border: "none", textDecoration: "none" }}>
                    {t("gameHistory.summary.totalLoss", "Total Loss")}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 8,
                      alignSelf: "center",
                      height: 0,
                      margin: "0 8px",
                      borderBottom: "1px dashed",
                      borderColor: AppColors.BORDER_MAIN,
                    }}
                  />
                  {loading
                    ?
                    <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                      {t("gameHistory.loadingShort", "Loading...")}
                    </Typography>
                    :
                    <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                      {formatPrice(summaryData?.totalLoss)} {t("gameHistory.currencyUsdt", "USDT")}
                    </Typography>
                  }
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 0.5,
                  border: "none",
                  "& .MuiTypography-root": { border: "none", textDecoration: "none" },
                }}
              >
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, border: "none", textDecoration: "none" }}>
                  {t("gameHistory.summary.contracts", "Contracts")}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 8,
                    alignSelf: "center",
                    height: 0,
                    margin: "0 8px",
                    borderBottom: "1px dashed",
                    borderColor: AppColors.BORDER_MAIN,
                  }}
                />
                {loading
                  ?
                  <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                    {t("gameHistory.loadingShort", "Loading...")}
                  </Typography>
                  :
                  <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                    {summaryData?.contracts}
                  </Typography>
                }
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 0.5,
                  border: "none",
                  "& .MuiTypography-root": { border: "none", textDecoration: "none" },
                }}
              >
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, border: "none", textDecoration: "none" }}>
                  {t("gameHistory.summary.profitableContracts", "Profitable Contracts")}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 8,
                    alignSelf: "center",
                    height: 0,
                    margin: "0 8px",
                    borderBottom: "1px dashed",
                    borderColor: AppColors.BORDER_MAIN,
                  }}
                />
                {loading
                  ?
                  <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                    {t("gameHistory.loadingShort", "Loading...")}
                  </Typography>
                  :
                  <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                    {summaryData?.profitableContracts}%
                  </Typography>
                }
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 0.5,
                  border: "none",
                  "& .MuiTypography-root": { border: "none", textDecoration: "none" },
                }}
              >
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, border: "none", textDecoration: "none" }}>
                  {t("gameHistory.summary.contractAmount", "Contract Amount")}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 8,
                    alignSelf: "center",
                    height: 0,
                    margin: "0 8px",
                    borderBottom: "1px dashed",
                    borderColor: AppColors.BORDER_MAIN,
                  }}
                />
                {
                  loading
                    ?
                    <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                      {t("gameHistory.loadingShort", "Loading...")}
                    </Typography>
                    :
                    <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, border: "none", textDecoration: "none" }}>
                      {formatPrice(summaryData?.contractAmount)} {t("gameHistory.currencyUsdt", "USDT")}
                    </Typography>
                }
              </Box>
            </Box>

            <Box sx={{ borderBottom: `1px solid ${AppColors.BORDER_MAIN}`, display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, mb: 1 }}>
              <Typography variant="body1" sx={{ display: "inline-block", fontWeight: 400, color: AppColors.TXT_MAIN, borderBottom: `2px solid ${AppColors.GOLD_PRIMARY}` }}>
                {t("gameHistory.summary.closedPositions", "Closed Positions")}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setFilterOpen(!filterOpen)}
                sx={{ color: AppColors.TXT_MAIN, p: 0 }}
              >
                <FilterAlt sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            {/* Filters */}
            <Collapse in={filterOpen} unmountOnExit>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, justifyContent: "flex-end", mt: 1 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="status-label" sx={{ color: AppColors.TXT_SUB }}>
                    {t("gameHistory.filters.status", "Status")}
                  </InputLabel>
                  <Select
                    labelId="status-label"
                    value={statusFilter}
                    label={t("gameHistory.filters.status", "Status")}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    sx={{
                      color: AppColors.TXT_MAIN,
                      fontSize: "0.875rem",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: AppColors.HLT_NONE,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: AppColors.GOLD_PRIMARY,
                      },
                    }}
                  >
                    <MenuItem value="all">
                      {t("gameHistory.filters.statusAll", "All")}
                    </MenuItem>
                    <MenuItem value="WIN">{t("gameHistory.filters.statusWin", "Win")}</MenuItem>
                    <MenuItem value="LOSS">{t("gameHistory.filters.statusLose", "Lose")}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                  <OutlinedInput
                    placeholder={t(
                      "gameHistory.filters.pairPlaceholder",
                      "Pair (e.g. BTC-USD)"
                    )}
                    onChange={handleSearchChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <Search
                          sx={{ color: AppColors.TXT_SUB, fontSize: 20 }}
                        />
                      </InputAdornment>
                    }
                    sx={{
                      color: AppColors.TXT_MAIN,
                      fontSize: "0.875rem",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: AppColors.HLT_NONE,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: AppColors.GOLD_PRIMARY,
                      },
                    }}
                  />
                </FormControl>
              </Box>
            </Collapse>

            {
              loading ? (
                <Box sx={emptyStateSx}>
                  <Typography variant="body1">
                    {t(
                      "gameHistory.loading",
                      "Loading trade history..."
                    )}
                  </Typography>
                </Box>
              ) : !tradeHistory?.length ? (
                <Box sx={emptyStateSx}>
                  <Typography variant="body1">
                    {t("gameHistory.empty.title", "No trade history yet")}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      mt: 1,
                      display: "block",
                    }}
                  >
                    {t(
                      "gameHistory.empty.subtitle",
                      "After you complete trades, they will appear here."
                    )}
                  </Typography>
                </Box>
              ) : (
                <>
                  {tradeHistory.map((trade, index) => renderHistoryTradeCard(trade, index))}

                  {/* Pagination */}
                  {(hasPrev || hasNext) && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      <Button
                        size="small"
                        disabled={!hasPrev || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        sx={{
                          color: AppColors.GOLD_PRIMARY,
                          textTransform: "none",
                          "&:disabled": { color: AppColors.TXT_SUB },
                        }}
                      >
                        {t("gameHistory.pagination.previous", "Previous")}
                      </Button>
                      <Typography
                        sx={{
                          alignSelf: "center",
                          fontSize: "0.875rem",
                          color: AppColors.TXT_SUB,
                        }}
                      >
                        {t(
                          "gameHistory.pagination.page",
                          "Page {{page}}",
                          { page }
                        )}
                      </Typography>
                      <Button
                        size="small"
                        disabled={!hasNext || loading}
                        onClick={() => setPage((p) => p + 1)}
                        sx={{
                          color: AppColors.GOLD_PRIMARY,
                          textTransform: "none",
                          "&:disabled": { color: AppColors.TXT_SUB },
                        }}
                      >
                        {t("gameHistory.pagination.next", "Next")}
                      </Button>
                    </Box>
                  )}
                </>
              )
            }
          </>
        )
        }
      </Box >
    </Box >
  );
}

export default memo(GameHistoryPage);
