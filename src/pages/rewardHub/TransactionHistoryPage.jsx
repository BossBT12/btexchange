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
} from "@mui/material";
import { ChevronLeft, Refresh } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import BTLoader from "../../components/Loader";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE, SPACING, BORDER_RADIUS } from "../../constant/lookUpConstant";
import walletService from "../../services/secondGameServices/walletService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

// Only support DEPOSIT/WITHDRAWAL types for /wallet/transactions
const TYPE_OPTIONS = [
  { value: "all", labelKey: "transactionHistory.filters.typeOption.all" },
  { value: "DEPOSIT", labelKey: "transactionHistory.filters.typeOption.DEPOSIT" },
  { value: "WITHDRAWAL", labelKey: "transactionHistory.filters.typeOption.WITHDRAWAL" },
];

const PAGE_SIZE = 20;

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (value) => {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const selectSx = {
  color: AppColors.TXT_MAIN,
  fontSize: FONT_SIZE.BODY2,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: AppColors.HLT_NONE },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: AppColors.GOLD_PRIMARY },
  borderRadius: BORDER_RADIUS.XS,
};

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const { type: initialType } = useLocation().state ?? {};
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [typeFilter, setTypeFilter] = useState(initialType || "all");

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        // API: GET /wallet/transactions?type=&page=&limit=
        ...(typeFilter !== "all" && { type: typeFilter }),
        page,
        limit: PAGE_SIZE,
      };
      const response = await walletService.getTransactions(params);
      if (response?.success) {
        const transactions = Array.isArray(response?.data?.transactions)
          ? response.data.transactions
          : [];
        const pag = response?.data?.pagination ?? {};
        setList(transactions);
        setTotal(pag.total ?? transactions.length);
        setTotalPages(pag.pages ?? pag.totalPages ?? 1);
      } else {
        setList([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err) {
      setError(err?.message ?? t("transactionHistory.errors.fetchFailed", "Failed to load transaction history"));
      setList([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const rowSx = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    py: 1.25,
    px: 0,
    "&:not(:last-of-type)": { borderBottom: `1px solid ${AppColors.BORDER_MAIN}` },
  };
  const labelSx = {
    color: AppColors.TXT_MAIN,
    fontSize: FONT_SIZE.BODY,
    fontWeight: 400,
  };
  const valueSx = {
    color: AppColors.TXT_MAIN,
    fontSize: FONT_SIZE.BODY,
    fontWeight: 400,
  };

  const renderTransactionCard = (item) => {
    const status = item.status || "PENDING";
    const isCredit = item.type === "DEPOSIT";
    const detailValue = [item.type, item.chain, status].filter(Boolean).join(" · ");

    return (
      <Box
        key={item._id || `${item.createdAt}-${item.amount}`}
        sx={{
          p: 2,
          bgcolor: AppColors.BG_CARD,
          borderRadius: BORDER_RADIUS.XS,
          border: `1px solid ${AppColors.BORDER_MAIN}`,
        }}
      >
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t("transactionHistory.card.detail", "Detail")}</Typography>
          <Typography sx={valueSx}>{detailValue}</Typography>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t("transactionHistory.card.time", "Time")}</Typography>
          <Typography sx={valueSx}>{formatDate(item.createdAt)}</Typography>
        </Box>
        <Box sx={rowSx}>
          <Typography sx={labelSx}>{t("transactionHistory.card.balance", "Balance")}</Typography>
          <Typography sx={{ ...valueSx, color: isCredit ? AppColors.GOLD_PRIMARY : AppColors.TXT_MAIN }}>
            {isCredit ? "+" : "-"}
            {formatAmount(item.amount)} {item.currency || "USDT"}
          </Typography>
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
          aria-label={t("tradeTop.backAriaLabel", "Back")}
          sx={{ color: AppColors.TXT_MAIN, p: 0.5, "&:hover": { bgcolor: AppColors.HLT_LIGHT } }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography variant="h6" sx={{ flex: 1, fontWeight: 600, color: AppColors.TXT_MAIN }}>
          {t("transactionHistory.title", "Transaction history")}
        </Typography>
        <IconButton
          onClick={() => fetchHistory()}
          disabled={loading}
          aria-label={t("transactionHistory.refreshAriaLabel", "Refresh")}
          sx={{ color: AppColors.GOLD_PRIMARY, "&:hover": { bgcolor: AppColors.HLT_LIGHT } }}
        >
          <Refresh />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pt: SPACING.MD }}>
        {error && (
          <Typography sx={{ fontSize: FONT_SIZE.BODY2, color: AppColors.ERROR, mb: 2 }}>{error}</Typography>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
          <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
            {t("transactionHistory.filters.type", "Type")}
          </Typography>
          <FormControl fullWidth>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              sx={selectSx}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>{t("transactionHistory.filters.selectType", "Select type")}</Typography>;
                }
                const opt = TYPE_OPTIONS.find((o) => o.value === selected);
                return opt ? t(opt.labelKey) : selected;
              }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <BTLoader />
          </Box>
        ) : list.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: AppColors.TXT_SUB }}>
            <Typography sx={{ fontSize: FONT_SIZE.BODY }}>{t("transactionHistory.empty.title", "No transactions yet")}</Typography>
            <Typography sx={{ fontSize: FONT_SIZE.CAPTION, mt: 0.5 }}>
              {t("transactionHistory.empty.subtitle", "Your unified transaction history will appear here.")}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {list.map((item) => renderTransactionCard(item))}
          </Box>
        )}

        {(hasPrev || hasNext) && !loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mt: 2 }}>
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
            <Typography sx={{ fontSize: FONT_SIZE.BODY2, color: AppColors.TXT_SUB }}>
              {t("transactionHistory.pagination.summary", "Page {{page}} of {{totalPages}} ({{total}} total)", { page, totalPages, total })}
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
