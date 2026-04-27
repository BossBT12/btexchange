import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { ChevronLeft, Refresh } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import BTLoader from "../../components/Loader";
import { AppColors } from "../../constant/appColors";
import {
  FONT_SIZE,
  SPACING,
  BORDER_RADIUS,
} from "../../constant/lookUpConstant";
import withdrawalService from "../../services/withdrawalService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { formatDateInt, formatPairForDisplay } from "../../utils/utils";
import DatePicker from "../../components/input/datePicker";

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAW_WINNINGS", label: "Withdraw Winnings" },
  { value: "WITHDRAW_WORKING", label: "Withdraw Working" },
  // { value: "TRADE", label: "Trade" },
  { value: "REFERRAL_BONUS", label: "Referral Bonus" },
  { value: "LEVEL_INCOME", label: "Level Income" },
  { value: "SALARY_INCOME", label: "Salary Income" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "REQUESTED", label: "Requested" },
  { value: "SENT", label: "Sent" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "FAILED", label: "Failed" },
  { value: "OPEN", label: "Open" },
  { value: "WIN", label: "Win" },
  { value: "LOSS", label: "Loss" },
];

const CHAIN_OPTIONS = [
  { value: "", label: "All chains" },
  { value: "BSC", label: "BSC" },
  { value: "ETH", label: "ETH" },
  { value: "POLYGON", label: "POLYGON" },
];

const PAGE_SIZE = 10;

const formatAmount = (value, locale = "en-US") => {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  const resolvedLocale = locale || "en-US";
  return num.toLocaleString(resolvedLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Exact match for DatePicker textField: BG_SECONDARY, BORDER_MAIN, borderRadius 2, CAPTION, icon 16
const datePickerLikeSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: AppColors.BG_SECONDARY,
    color: AppColors.TXT_MAIN,
    borderRadius: 1,
    "& .MuiSelect-select": { textAlign: "start" },
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&.Mui-focused fieldset": {
      borderColor: AppColors.TXT_SUB,
      borderWidth: 1,
    },
    "&.Mui-error fieldset": { borderColor: AppColors.ERROR },
  },
  "& .MuiFormLabel-root": { fontSize: FONT_SIZE.BODY2 },
  "& .MuiInputBase-input": { py: 1, fontSize: FONT_SIZE.BODY2 },
  "& .MuiInputBase-input::placeholder": {
    color: AppColors.TXT_SUB,
    opacity: 1,
  },
  "& .MuiFormHelperText-root": {
    color: AppColors.ERROR,
    fontSize: FONT_SIZE.CAPTION,
  },
};

const filterLabelSx = {
  fontSize: FONT_SIZE.CAPTION,
  color: AppColors.TXT_SUB,
};

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const { type: initialType } = useLocation().state ?? {};
  const { t, i18n } = useTranslation(TRADE_NAMESPACE);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [typeFilter, setTypeFilter] = useState(
    initialType ? [initialType].join(",") : "",
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [chainFilter, setChainFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
        ...(statusFilter && { status: statusFilter }),
        ...(chainFilter && { chain: chainFilter }),
        ...(startDate && { startDate: new Date(startDate).toISOString() }),
        ...(endDate && { endDate: new Date(endDate).toISOString() }),
      };
      if (typeFilter) {
        params.type = typeFilter;
      }
      const response = await withdrawalService.getTransactionHistory(params);
      if (response?.success) {
        setList(Array.isArray(response?.data) ? response.data : []);
        const pag = response?.pagination ?? {};
        setTotal(pag.total ?? 0);
        setTotalPages(pag.totalPages ?? 1);
      } else {
        setList([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err) {
      setError(
        err?.message ??
          t(
            "transactionHistory.errors.fetchFailed",
            "Failed to load transaction history",
          ),
      );
      setList([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [
    typeFilter,
    statusFilter,
    chainFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    page,
    t,
  ]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const getTypeLabel = (type) =>
    type
      ? t(`transactionHistory.filters.typeOption.${type}`, type)
      : t(
          "transactionHistory.filters.typeOption.DEPOSIT,WITHDRAW_WINNINGS,WITHDRAW_WORKING,TRADE",
          "All",
        );

  const getChainLabel = (chain) =>
    chain
      ? t(`transactionHistory.filters.chainOption.${chain}`, chain)
      : t("transactionHistory.filters.chainOption.all", "All chains");

  const getDirectionLabel = (direction) =>
    direction
      ? t(`transactionHistory.card.direction.${direction}`, direction)
      : direction;

  const cardRowSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    px: 2,
    py: 1.25,
    bgcolor: AppColors.BG_SECONDARY,
  };

  const renderTransactionCard = (item) => {
    const locale = i18n?.language || "en-US";
    const isCredit =
      item.type === "DEPOSIT" ||
      item.type === "REFERRAL_BONUS" ||
      item.type === "LEVEL_INCOME" ||
      item.type === "SALARY_INCOME" ||
      (item.type === "TRADE" && item.status === "WIN");
    const balanceColor = isCredit ? AppColors.SUCCESS : AppColors.ERROR;
    const headerTitle = getTypeLabel(item.type);

    return (
      <Box
        key={item._id || `${item.createdAt}-${item.amount}`}
        sx={{
          overflow: "hidden",
          bgcolor: AppColors.BG_CARD,
          borderRadius: BORDER_RADIUS.XS,
          border: `1px solid ${AppColors.BORDER_MAIN}`,
        }}
      >
        <Box
          className="bg-auShade"
          sx={{
            px: 2,
            py: 1.5,
            color: AppColors.TXT_BLACK,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE.BODY }}>
            {headerTitle}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            mx: 1,
            py: 1.25,
          }}
        >
          <Box sx={cardRowSx}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("transactionHistory.card.detail", "Detail")}
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN }}>
              {getTypeLabel(item.type)}
              {["DEPOSIT", "WITHDRAW_WINNINGS", "WITHDRAW_WORKING"].includes(
                item.type,
              ) && item.chain
                ? ` · ${getChainLabel(item.chain)}`
                : ""}
            </Typography>
          </Box>
          <Box sx={cardRowSx}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("transactionHistory.card.time", "Time")}
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN }}>
              {formatDateInt(item.createdAt, locale)}
            </Typography>
          </Box>
          <Box sx={cardRowSx}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("transactionHistory.card.balance", "Balance")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: balanceColor, fontWeight: 600 }}
            >
              {isCredit ? "+" : "-"}
              {formatAmount(item.amount, locale)} {item.currency || "USDT"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 1,
            mx: 1,
            mb: 1,
            border: `1px solid ${AppColors.BORDER_MAIN}`,
            borderRadius: 2,
            minHeight: 60,
          }}
        >
          <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
            {item?.note.replace("ADMIN: ", "") ||
              t("transactionHistory.card.noRemark", "No remark")}
          </Typography>
          {/* <Box sx={{ minHeight: 40 }}>
            {item.txHash ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: FONT_SIZE.CAPTION, color: AppColors.TXT_SUB, wordBreak: "break-all" }}>
                  {t("transactionHistory.card.txPrefix", "Tx:")} {item.txHash}
                </Typography>
                {explorerUrl && (
                  <IconButton
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ color: AppColors.GOLD_PRIMARY, p: 0.25, "&:hover": { bgcolor: AppColors.HLT_LIGHT } }}
                  >
                    <OpenInNew sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
            ) : (
              <Typography sx={{ fontSize: FONT_SIZE.CAPTION, color: AppColors.TXT_SUB }}>—</Typography>
            )}
          </Box> */}
        </Box>
      </Box>
    );
  };

  const renderTradeCard = (item) => {
    const locale = i18n?.language || "en-US";
    const isWin = item.status === "WIN";
    const balanceColor = isWin ? AppColors.SUCCESS : AppColors.ERROR;
    const detailText = `${formatPairForDisplay(item.pair)} · ${getDirectionLabel(item.direction)}`;

    return (
      <Box
        key={item._id || `${item.createdAt}-${item.pair}`}
        sx={{
          overflow: "hidden",
          bgcolor: AppColors.BG_CARD,
          borderRadius: BORDER_RADIUS.XS,
          border: `1px solid ${AppColors.BORDER_MAIN}`,
        }}
      >
        <Box
          className="bg-auShade"
          sx={{
            px: 2,
            py: 1.5,
            color: AppColors.TXT_BLACK,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: FONT_SIZE.BODY }}>
            {t("transactionHistory.filters.typeOption.TRADE", "Trade")}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            mx: 1,
            py: 1.25,
          }}
        >
          <Box sx={cardRowSx}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("transactionHistory.card.detail", "Detail")}
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN }}>
              {detailText}
            </Typography>
          </Box>
          <Box sx={cardRowSx}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("transactionHistory.card.time", "Time")}
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN }}>
              {formatDateInt(item.createdAt, locale)}
            </Typography>
          </Box>
          <Box sx={cardRowSx}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("transactionHistory.card.balance", "Balance")}
            </Typography>
            <Typography variant="body1" sx={{ color: balanceColor }}>
              {isWin ? "+" : "-"}
              {formatAmount(item.payout, locale)}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            p: 1,
            mx: 1,
            mb: 1,
            border: `1px solid ${AppColors.BORDER_MAIN}`,
            borderRadius: 2,
            minHeight: 60,
          }}
        >
          <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
            {t("transactionHistory.card.noRemark", "No remark")}
          </Typography>
          {/* <Box sx={{ minHeight: 40 }}>
            <Typography sx={{ fontSize: FONT_SIZE.CAPTION, color: AppColors.TXT_SUB }}>
              {t("transactionHistory.card.entryExit", "Entry {{entry}} → Exit {{exit}}", {
                entry: formatAmount(item.entryPrice, locale),
                exit: formatAmount(item.exitPrice, locale),
              })}
              {item.grossAmount != null && ` · ${t("transactionHistory.card.gross", "Gross")}: ${formatAmount(item.grossAmount, locale)}`}
              {item.feeAmount != null && item.feeAmount !== 0 && ` · ${t("transactionHistory.card.fee", "Fee")}: ${formatAmount(item.feeAmount, locale)}`}
            </Typography>
          </Box> */}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
        pb: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
          py: SPACING.SM,
          px: 1,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: AppColors.HLT_LIGHT },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ flex: 1, fontWeight: 600, color: AppColors.TXT_MAIN }}
        >
          {t("transactionHistory.title", "Transaction history")}
        </Typography>
        <IconButton
          onClick={() => fetchHistory()}
          disabled={loading}
          aria-label={t("transactionHistory.refreshAriaLabel", "Refresh")}
          sx={{
            color: AppColors.GOLD_PRIMARY,
            "&:hover": { bgcolor: AppColors.HLT_LIGHT },
          }}
        >
          <Refresh />
        </IconButton>
      </Box>
      {error && (
        <Box sx={{ px: 1, pb: SPACING.MD }}>
          <Typography variant="body2" sx={{ color: AppColors.ERROR }}>
            {error}
          </Typography>
        </Box>
      )}
      <Box sx={{ px: 1, pt: SPACING.MD, textAlign: "end" }}>
        <Grid container spacing={1.5} mb={2}>
          {/* <Grid size={12}>
            <OutlinedInput
              fullWidth
              placeholder={t(
                "transactionHistory.filters.pairPlaceholder",
                "Pair (e.g. BTC-USD)"
              )}
              value={pairInput}
              onChange={(e) => setPairInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPairFilter(pairInput), setPage(1))}
              startAdornment={
                <InputAdornment position="start">
                  <Search sx={{ color: AppColors.TXT_SUB, fontSize: 16 }} />
                </InputAdornment>
              }
              size="small"
              sx={{
                bgcolor: AppColors.BG_SECONDARY,
                color: AppColors.TXT_MAIN,
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: AppColors.TXT_SUB, borderWidth: 1 },
                  "&.Mui-error fieldset": { borderColor: AppColors.ERROR },
                },
                "& .MuiInputBase-input": { py: 1.5, fontSize: FONT_SIZE.BODY2 },
                "& .MuiInputBase-input::placeholder": { color: AppColors.TXT_SUB, opacity: 1 },
                "& .MuiFormHelperText-root": { color: AppColors.ERROR, fontSize: FONT_SIZE.CAPTION },
              }}
            />
          </Grid> */}
          <Grid size={4}>
            <FormControl size="small" fullWidth sx={datePickerLikeSx}>
              <InputLabel id="type-label" sx={filterLabelSx}>
                {t("transactionHistory.filters.type", "Type")}
              </InputLabel>
              <Select
                labelId="type-label"
                value={typeFilter}
                label={t("transactionHistory.filters.type", "Type")}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ color: AppColors.TXT_MAIN }}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {t(
                      `transactionHistory.filters.typeOption.${opt.value || "all"}`,
                      opt.label,
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={4}>
            <FormControl size="small" fullWidth sx={datePickerLikeSx}>
              <InputLabel id="status-label" sx={filterLabelSx}>
                {t("transactionHistory.filters.status", "Status")}
              </InputLabel>
              <Select
                labelId="status-label"
                value={statusFilter}
                label={t("transactionHistory.filters.status", "Status")}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ color: AppColors.TXT_MAIN }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || "all"} value={opt.value}>
                    {t(
                      `transactionHistory.filters.statusOption.${opt.value || "all"}`,
                      opt.label,
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={4}>
            <FormControl size="small" fullWidth sx={datePickerLikeSx}>
              <InputLabel id="chain-label" sx={filterLabelSx}>
                {t("transactionHistory.filters.chain", "Chain")}
              </InputLabel>
              <Select
                labelId="chain-label"
                value={chainFilter}
                label={t("transactionHistory.filters.chain", "Chain")}
                onChange={(e) => {
                  setChainFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ color: AppColors.TXT_MAIN }}
              >
                {CHAIN_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || "all"} value={opt.value}>
                    {t(
                      `transactionHistory.filters.chainOption.${opt.value || "all"}`,
                      opt.label,
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setPairFilter(pairInput);
            setPage(1);
          }}
          sx={{
            mb: 2,
            color: AppColors.GOLD_PRIMARY,
            borderColor: "rgba(255,255,255,0.12)",
            borderRadius: 1,
            textTransform: "none",
            "&:hover": { borderColor: AppColors.GOLD_PRIMARY },
          }}
        >
          {t("transactionHistory.filters.apply", "Apply")}
        </Button> */}

        <Grid container spacing={1} mb={2}>
          <Grid size={4}>
            <DatePicker
              label={t("transactionHistory.filters.startDate", "Start Date")}
              value={startDate}
              onChange={(e) => setStartDate(e)}
              placeholder={t(
                "transactionHistory.filters.startDate",
                "Start Date",
              )}
            />
          </Grid>
          <Grid size={4}>
            <DatePicker
              label={t("transactionHistory.filters.endDate", "End Date")}
              value={endDate}
              onChange={(e) => setEndDate(e)}
              placeholder={t("transactionHistory.filters.endDate", "End Date")}
            />
          </Grid>
          <Grid size={4}>
            <FormControl size="small" fullWidth sx={datePickerLikeSx}>
              <InputLabel id="sort-label" sx={filterLabelSx}>
                {t("transactionHistory.filters.sort", "Sort")}
              </InputLabel>
              <Select
                labelId="sort-label"
                value={`${sortBy}-${sortOrder}`}
                label={t("transactionHistory.filters.sort", "Sort")}
                onChange={(e) => {
                  const v = e.target.value;
                  const [by, order] = v.split("-");
                  setSortBy(by);
                  setSortOrder(order);
                  setPage(1);
                }}
                sx={{ color: AppColors.TXT_MAIN }}
              >
                <MenuItem value="createdAt-desc">
                  {t("transactionHistory.filters.sortNewest", "Newest")}
                </MenuItem>
                <MenuItem value="createdAt-asc">
                  {t("transactionHistory.filters.sortOldest", "Oldest")}
                </MenuItem>
                <MenuItem value="amount-desc">
                  {t(
                    "transactionHistory.filters.sortAmountHigh",
                    "Amount high",
                  )}
                </MenuItem>
                <MenuItem value="amount-asc">
                  {t("transactionHistory.filters.sortAmountLow", "Amount low")}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ px: 2, pt: SPACING.MD }}>
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <BTLoader />
          </Box>
        ) : list.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: AppColors.TXT_SUB }}>
            <Typography variant="body2">
              {t("transactionHistory.empty.title", "No transactions yet")}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {t(
                "transactionHistory.empty.subtitle",
                "Your unified transaction history will appear here.",
              )}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {list.map((item) =>
              item.source === "trade" || item.type === "TRADE"
                ? renderTradeCard(item)
                : renderTransactionCard(item),
            )}
          </Box>
        )}

        {(hasPrev || hasNext) && !loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              mt: 2,
            }}
          >
            <Button
              size="small"
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{
                color: AppColors.GOLD_PRIMARY,
                borderRadius: BORDER_RADIUS.XS,
                textTransform: "none",
                "&:disabled": { color: AppColors.TXT_SUB },
              }}
            >
              {t("transactionHistory.pagination.previous", "Previous")}
            </Button>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t(
                "transactionHistory.pagination.summary",
                "Page {{page}} of {{totalPages}} ({{total}} total)",
                { page, totalPages, total },
              )}
            </Typography>
            <Button
              size="small"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              sx={{
                color: AppColors.GOLD_PRIMARY,
                borderRadius: BORDER_RADIUS.XS,
                textTransform: "none",
                "&:disabled": { color: AppColors.TXT_SUB },
              }}
            >
              {t("transactionHistory.pagination.next", "Next")}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
