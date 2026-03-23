import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  ChevronLeft,
  KeyboardArrowDown,
  ContentCopy,
  InboxOutlined,
  Search,
  ChevronRight,
  Refresh,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AppColors } from "../../../constant/appColors";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "../../../constant/lookUpConstant";
import useSnackbar from "../../../hooks/useSnackbar";
import promotionService from "../../../services/promotionService";
import { copyToClipboard } from "../../../utils/utils";
import BTLoader from "../../../components/Loader";
import { TRADE_NAMESPACE } from "../../../i18n";
import DatePicker from "../../../components/input/datePicker";

const TYPE_OPTIONS = [
  { value: "all", labelKey: "types.all" },
  { value: "direct", labelKey: "types.direct" },
  { value: "team", labelKey: "types.team" },
];

const formatNumber = (n) => {
  if (n == null || n === "") return "0";
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : "0";
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return Number.isFinite(date.getTime())
      ? date.toISOString().slice(0, 10)
      : String(d).slice(0, 10);
  } catch {
    return String(d).slice(0, 10);
  }
};

const KEY_ALIASES = {
  fullName: ["fullName"],
  level: ["level"],
  totalDeposited: ["totalDeposited"],
  hasDeposited: ["hasDeposited"],
};

function getSubordinateValue(sub, key) {
  const aliases = KEY_ALIASES[key];
  if (aliases) {
    for (const k of aliases) {
      const v = sub[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
  }
  return sub[key];
}

function formatSubordinateValue(key, value, t) {
  if (value === undefined || value === null || value === "") return "—";
  const keyLower = String(key).toLowerCase();
  if (typeof value === "boolean" || keyLower.includes("has") || keyLower.includes("status")) {
    const yesKey = "promotion.subordinateData.yes";
    const noKey = "promotion.subordinateData.no";
    return value ? (t ? t(yesKey, "Yes") : "Yes") : (t ? t(noKey, "No") : "No");
  }
  if (keyLower.includes("time") || keyLower.includes("date") || key === "createdAt") {
    return formatDate(value);
  }
  if (
    keyLower.includes("amount") ||
    keyLower.includes("Trade") ||
    keyLower.includes("commission") ||
    keyLower.includes("deposit")
  ) {
    return formatNumber(value);
  }
  return String(value);
}

const DEFAULT_SUMMARY_FIELDS = [
  { key: "depositNumber", label: "Deposit number" },
  { key: "depositAmount", label: "Deposit amount", isAmount: true },
  { key: "numberOfBettors", label: "Number of traders" },
  { key: "totalBet", label: "Total Trade Amount", isAmount: true },
  { key: "numberOfPeopleMakingFirstDeposit", label: "Number of people making first deposit" },
  { key: "firstDepositAmount", label: "First deposit amount", isAmount: true },
];

const DEFAULT_SUBORDINATE_FIELDS = [
  { key: "level", label: "Level", highlight: false },
  { key: "depositAmount", label: "Deposit amount", highlight: true, isAmount: true },
  { key: "betAmount", label: "Trade amount", highlight: true, isAmount: true },
  { key: "commission", label: "Commission", highlight: true, isAmount: true },
  { key: "time", label: "Time", highlight: false },
  // { key: "fullName", label: "Name", highlight: false },
  // { key: "hasDeposited", label: "Has deposited", highlight: false },
];

const SubordinateData = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const { showSnackbar } = useSnackbar();
  const PAGE_SIZE = 10;
  const [type, setType] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [subordinates, setSubordinates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(false);
  const [apiSummary, setApiSummary] = useState(null);
  const [apiSummaryFields, setApiSummaryFields] = useState(null);
  const [apiSubordinateFields, setApiSubordinateFields] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const fetchSubordinates = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = { page, limit: PAGE_SIZE };
        if (type !== "all") params.type = type;
        if (search) params.search = search;
        if (dateFilter) params.date = dateFilter;
        const data = await promotionService.getSubordinates(params);
        const list = data?.subordinates ?? [];
        const pag = data?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0 };
        setPagination(pag);
        setSubordinates(list);
        if (data?.summary && typeof data.summary === "object") setApiSummary(data.summary);
        if (Array.isArray(data?.summaryFields) && data.summaryFields.length > 0) {
          setApiSummaryFields(data.summaryFields);
        }
        if (Array.isArray(data?.subordinateFields) && data.subordinateFields.length > 0) {
          setApiSubordinateFields(data.subordinateFields);
        }
      } catch (err) {
        const message = err?.message || t("promotion.subordinateData.loadFailed", "Failed to load subordinates");
        showSnackbar(message, "error");
        setSubordinates([]);
      } finally {
        setLoading(false);
      }
    },
    [type, dateFilter, search, showSnackbar, t]
  );

  useEffect(() => {
    fetchSubordinates(1);
  }, [fetchSubordinates]);

  const handleRefresh = () => {
    setDateFilter("");
    setSearch("");
    setSearchInput("");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    fetchSubordinates(newPage);
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit) || 1);
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const computedSummary = React.useMemo(() => {
    const depositCount = subordinates.filter(
      (s) => (s.totalDeposited ?? s.depositAmount ?? 0) > 0
    ).length;
    const depositAmount = subordinates.reduce(
      (sum, s) => sum + Number(s.totalDeposited ?? s.depositAmount ?? 0),
      0
    );
    const betCount = subordinates.length;
    const totalBet = subordinates.reduce(
      (sum, s) => sum + Number(s.totalBet ?? s.betAmount ?? s.Trade ?? 0),
      0
    );
    const firstDepositCount = subordinates.filter(
      (s) => s.hasDeposited && (s.isFirstDeposit === true)
    ).length;
    const firstDepositAmount = subordinates
      .filter((s) => s.isFirstDeposit === true)
      .reduce((sum, s) => sum + Number(s.firstDepositAmount ?? s.totalDeposited ?? 0), 0);

    return {
      depositNumber: depositCount,
      depositAmount,
      numberOfBettors: betCount,
      totalBet,
      firstDepositCount,
      firstDepositAmount,
    };
  }, [subordinates]);

  const summaryFields = apiSummaryFields?.length ? apiSummaryFields : DEFAULT_SUMMARY_FIELDS;
  const summaryValues = apiSummary && typeof apiSummary === "object"
    ? { ...computedSummary, ...apiSummary }
    : computedSummary;

  const handleCopyUid = (uid) => {
    copyToClipboard(uid ?? "");
    showSnackbar(t("promotion.subordinateData.copyUidSuccess", "UID copied"), "success");
  };

  return (
    <Box
      sx={{
        position: "relative",
        pb: 4,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          py: 0.75,
          px: 0.5,
          backgroundColor: AppColors.BG_MAIN,
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography
          sx={{
            fontSize: FONT_SIZE.TITLE,
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("promotion.subordinateData.title", "Subordinate data")}
        </Typography>
        <IconButton
          onClick={handleRefresh}
          aria-label={t("promotion.subordinateData.refreshAriaLabel", "Refresh and reset filters")}
          sx={{
            color: AppColors.TXT_MAIN,
            "&:hover": { bgcolor: AppColors.HLT_LIGHT },
          }}
        >
          <Refresh sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 2 }}>
        {/* Search by subordinate UID */}
        <Box
          sx={{
            mb: 1.5,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            bgcolor: AppColors.BG_SECONDARY,
            border: "1px solid " + "rgba(255,255,255,0.12)",
          }}
        >
          <Box
            component="input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchInput.trim());
              }
            }}
            placeholder={t("promotion.subordinateData.searchPlaceholder", "Search subordinate UID")}
            sx={{
              flex: 1,
              border: "none",
              outline: "none",
              px: 1.5,
              py: 1,
              fontSize: FONT_SIZE.BODY,
              bgcolor: "transparent",
              color: "#fff",
              "&::placeholder": {
                color: "rgba(255,255,255,0.4)",
              },
            }}
          />
          <Box
            component="button"
            type="button"
            className="bg-auShade"
            onClick={() => setSearch(searchInput.trim())}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              outline: "none",
              cursor: "pointer",
              px: 2,
              py: 0.25,
              mr: 1,
              borderRadius: BORDER_RADIUS.SM,
              color: AppColors.TXT_MAIN,
            }}
          >
            <Search sx={{ fontSize: 20 }} />
          </Box>
        </Box>
        {/* Top filters */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
          }}
        >
          <FormControl
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                bgcolor: AppColors.BG_SECONDARY,
                color: AppColors.TXT_MAIN,
                borderRadius: 1,
                "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&.Mui-focused fieldset": { borderColor: AppColors.TXT_SUB, borderWidth: 1 },
                "&.Mui-error fieldset": { borderColor: AppColors.ERROR },
              },
              "& .MuiInputBase-input": { py: 1, fontSize: FONT_SIZE.BODY2 },
              "& .MuiInputBase-input::placeholder": { color: AppColors.TXT_SUB, opacity: 1 },
              "& .MuiFormHelperText-root": { color: AppColors.ERROR, fontSize: FONT_SIZE.CAPTION },
            }}
          >
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              IconComponent={KeyboardArrowDown}
              displayEmpty
              sx={{
                color: AppColors.TXT_MAIN,
                fontSize: FONT_SIZE.BODY,
                "& .MuiSelect-icon": { color: AppColors.TXT_MAIN },
                "& .MuiSelect-select": { py: 1.2, px: 1.5 },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: AppColors.BG_CARD,
                    border: "1px solid " + AppColors.BORDER_MAIN,
                    "& .MuiMenuItem-root": {
                      color: AppColors.TXT_MAIN,
                      fontSize: FONT_SIZE.BODY,
                    },
                  },
                },
              }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {t(`promotion.subordinateData.${opt.labelKey}`, opt.value === "all" ? "All" : opt.value === "direct" ? "Direct" : "Team")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box
            sx={{
              flex: 1,
              borderRadius: BORDER_RADIUS.XS,
              border: "1px solid " + AppColors.BORDER_MAIN,
              bgcolor: AppColors.BG_CARD,
              "&:hover": { borderColor: "rgba(255,255,255,0.35)" },
              "&:focus-within": { borderColor: AppColors.GOLD_PRIMARY },
            }}
          >
            <DatePicker
              value={dateFilter}
              onChange={(date) => setDateFilter(date ?? "")}
              placeholder={t("promotion.subordinateData.datePlaceholder", "Filter by date")}
            />
          </Box>
        </Box>
        {/* Summary statistics - yellow block */}
        <Box
          className="bg-auShade"
          sx={{
            borderRadius: BORDER_RADIUS.XS,
            color: AppColors.TXT_BLACK,
            p: SPACING.MD,
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            {summaryFields.map((field) => {
              const key = typeof field === "object" && field !== null ? field.key : field;
              const fallbackLabel = typeof field === "object" && field !== null ? (field.label ?? key) : key;
              const label = t(`promotion.subordinateData.summaryFields.${key}`, fallbackLabel);
              const value = summaryValues[key];
              return (
                <Box key={key} sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: AppColors.TXT_BLACK,
                      lineHeight: 1.2,
                    }}
                  >
                    {field.isAmount ? `$${formatNumber(value)}` : formatNumber(value)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(0,0,0,0.85)",
                      mt: 0.25,
                      lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Subordinate list */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <BTLoader />
          </Box>
        ) : subordinates.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
              px: 2,
            }}
          >
            <InboxOutlined
              sx={{ fontSize: 60, color: AppColors.TXT_SUB }}
            />
            <Typography
              variant="body2"
              sx={{
                color: AppColors.TXT_SUB,
                textAlign: "center",
              }}
            >
              {t("promotion.subordinateData.empty", "No subordinates found")}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {subordinates.map((sub) => (
              <Box
                key={sub.userId ?? sub.UID ?? sub.fullName ?? Math.random()}
                sx={{
                  borderRadius: BORDER_RADIUS.XS,
                  bgcolor: AppColors.BG_CARD,
                  border: "1px solid " + AppColors.BORDER_MAIN,
                  p: SPACING.MD,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1,
                    pb: 0.5,
                    borderBottom: "1px solid " + AppColors.BORDER_MAIN,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: AppColors.TXT_MAIN,
                    }}
                  >
                    {t("promotion.subordinateData.uidLabel", "UID")}:{sub.UID ?? sub.userId ?? "—"}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyUid(sub.UID ?? sub.userId)}
                    sx={{
                      color: AppColors.TXT_SUB,
                      p: 0.5,
                      "&:hover": { color: AppColors.GOLD_PRIMARY },
                    }}
                  >
                    <ContentCopy sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {(apiSubordinateFields?.length ? apiSubordinateFields : DEFAULT_SUBORDINATE_FIELDS).map(
                    (field) => {
                      const rawValue = getSubordinateValue(sub, field.key);
                      const displayValue = formatSubordinateValue(field.key, rawValue, t);
                      const fallbackLabel = field.label ?? field.key;
                      const translatedLabel = t(`promotion.subordinateData.subordinateFields.${field.key}`, fallbackLabel);
                      return (
                        <RowItem
                          key={field.key}
                          label={translatedLabel + (String(translatedLabel).endsWith(":") ? "" : ":")}
                          value={field.isAmount ? `$${displayValue}` : displayValue}
                          valueColor={field.highlight ? AppColors.GOLD_PRIMARY : AppColors.TXT_MAIN}
                        />
                      );
                    }
                  )}
                </Box>
              </Box>
            ))}
            {pagination.total > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  py: 2,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  startIcon={<ChevronLeft />}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrev || loading}
                  sx={{
                    textTransform: "none",
                    color: AppColors.TXT_MAIN,
                    borderColor: AppColors.BORDER_MAIN,
                    "&:hover": {
                      borderColor: AppColors.GOLD_PRIMARY,
                      bgcolor: AppColors.HLT_LIGHT,
                    },
                    "&.Mui-disabled": { color: AppColors.TXT_SUB },
                  }}
                  variant="outlined"
                  size="small"
                >
                  {t("promotion.subordinateData.pagination.previous", "Previous")}
                </Button>
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_SUB,
                    px: 1,
                    minWidth: 120,
                    textAlign: "center",
                  }}
                >
                  {t("promotion.subordinateData.pagination.pageOf", "Page {{current}} of {{total}}", {
                    current: currentPage,
                    total: totalPages,
                  })}
                </Typography>
                <Button
                  endIcon={<ChevronRight />}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext || loading}
                  sx={{
                    textTransform: "none",
                    color: AppColors.TXT_MAIN,
                    borderColor: AppColors.BORDER_MAIN,
                    "&:hover": {
                      borderColor: AppColors.GOLD_PRIMARY,
                      bgcolor: AppColors.HLT_LIGHT,
                    },
                    "&.Mui-disabled": { color: AppColors.TXT_SUB },
                  }}
                  variant="outlined"
                  size="small"
                >
                  {t("promotion.subordinateData.pagination.next", "Next")}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

function RowItem({ label, value, valueColor }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: AppColors.TXT_SUB,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          color: valueColor ?? AppColors.TXT_MAIN,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default SubordinateData;
