import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Button,
} from "@mui/material";
import { ChevronLeft, KeyboardArrowDown, InboxOutlined, ChevronRight } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AppColors } from "../../../constant/appColors";
import useSnackbar from "../../../hooks/useSnackbar";
import { FONT_SIZE } from "../../../constant/lookUpConstant";
import promotionService from "../../../services/promotionService";
import BTLoader from "../../../components/Loader";
import DatePicker from "../../../components/input/datePicker";
import { TRADE_NAMESPACE } from "../../../i18n";

const TYPE_OPTIONS = [
  { value: "all", labelKey: "all" },
  { value: "referral", labelKey: "referral" },
  { value: "level", labelKey: "level" },
  { value: "salary", labelKey: "salary" },
];

const TYPE_LABEL_KEYS = {
  REFERRAL_BONUS: "referral",
  LEVEL_INCOME: "level",
  SALARY_INCOME: "salary",
};

const formatNumber = (n) => {
  if (n == null || n === "") return "0";
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : "0";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
  } catch {
    return dateStr;
  }
};

const DetailRow = ({ label, value, valueColor, isAmount }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      py: 1,
      "&:not(:last-of-type)": { borderBottom: "1px solid " + AppColors.BORDER_MAIN },
    }}
  >
    <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: valueColor ?? AppColors.TXT_MAIN }}>
      {value}
    </Typography>
  </Box>
);

const CommissionDetailPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const { showSnackbar } = useSnackbar();
  const [type, setType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const PAGE_SIZE = 10;
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCommission = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = { page, limit: PAGE_SIZE };
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        if (type !== "all") params.type = type;
        const data = await promotionService.getCommissionDetail(params);
        const list = data?.transactions ?? [];
        const pag = data?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0 };
        if (data?.summary && typeof data.summary === "object") {
          setSummary(data.summary);
        }
        setPagination(pag);
        setTransactions(list);
      } catch (err) {
        const message = err?.message || t("promotion.commissionDetail.loadFailed", "Failed to load commission detail");
        showSnackbar(message, "error");
        setTransactions([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    },
    [type, fromDate, toDate, showSnackbar, t]
  );

  useEffect(() => {
    fetchCommission(1);
  }, [fetchCommission]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    fetchCommission(newPage);
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit) || 1);
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <Box sx={{ position: "relative", bgcolor: AppColors.BG_MAIN, pb: 4, minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          py: 0.75,
          backgroundColor: AppColors.BG_MAIN,
          borderBottom: "1px solid " + AppColors.BORDER_MAIN,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: AppColors.BG_SECONDARY },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: AppColors.TXT_MAIN }}>
          {t("promotion.commissionDetail.title", "Commission detail")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      <Box sx={{ mx: 2, display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
        <FormControl
          fullWidth
          sx={{
            flex: 1,
            maxWidth: "unset !important",
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
            sx={{
              color: AppColors.TXT_MAIN,
              fontSize: FONT_SIZE.BODY,
              "& .MuiSelect-select": { py: 1.2 },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: AppColors.BG_MAIN,
                  "& .MuiMenuItem-root": { color: AppColors.TXT_MAIN },
                },
              },
            }}
          >
            {TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {t(`promotion.commissionDetail.types.${opt.labelKey}`, opt.value)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", gap: 1 }}>
          <DatePicker
            label={t("promotion.commissionDetail.dateFrom", "From")}
            id="fromDate"
            size="small"
            value={fromDate}
            onChange={(v) => setFromDate(v)}
          />
          <DatePicker
            label={t("promotion.commissionDetail.dateTo", "To")}
            id="toDate"
            size="small"
            value={toDate}
            onChange={(v) => setToDate(v)}
          />
        </Box>
      </Box>

      {/* Summary block – after filter, before transactions */}
      {summary && !loading && (
        <Box sx={{ mx: 2, mt: 2, mb: 1, }}>
          <Box
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid " + AppColors.BORDER_MAIN,
              px: 1.5,
              py: 1.5,
            }}
          >
            {/* Settlement header – before data rows */}
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: AppColors.TXT_MAIN }}>
                {t("promotion.commissionDetail.settlementTitle", "Settlement successful")}
              </Typography>
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, mt: 0.5 }}>
                {t("promotion.commissionDetail.settlementSubtitle", "The commission has been automatically credited to your balance")}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { key: "totalReferralIncome", labelKey: "referralIncome" },
                { key: "totalLevelIncome", labelKey: "levelIncome" },
                { key: "totalSalaryIncome", labelKey: "salaryIncome" },
              ].map(({ key, labelKey }) => {
                const label = t(`promotion.commissionDetail.${labelKey}`, labelKey);
                const value = summary[key];
                const num = Number(value);
                const display = Number.isFinite(num) ? formatNumber(value) : "0";
                return (
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      px: 1.5,
                      py: 1.25,
                      bgcolor: AppColors.BG_SECONDARY,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: AppColors.TXT_MAIN }}>
                      ${display}
                    </Typography>
                  </Box>
                );
              })}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 1.5,
                  py: 1.25,
                  bgcolor: AppColors.BG_SECONDARY,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: AppColors.TXT_MAIN }}>
                  {t("promotion.commissionDetail.commissionPayout", "Commission payout")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: AppColors.GOLD_PRIMARY }}>
                  ${formatNumber(
                    (Number(summary.totalReferralIncome) || 0) +
                    (Number(summary.totalLevelIncome) || 0) +
                    (Number(summary.totalSalaryIncome) || 0)
                  )}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <BTLoader />
        </Box>
      ) : transactions.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            mt: 2,
            px: 4,
            py: 4,
          }}
        >
          <InboxOutlined sx={{ fontSize: 40, color: AppColors.TXT_SUB }} />
          <Typography sx={{ fontSize: FONT_SIZE.BODY, color: AppColors.TXT_SUB, textAlign: "center", mt: 1 }}>
            {t("promotion.commissionDetail.empty", "No commission records")}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mx: 2, mt: 2 }}>
          {transactions.map((tx, idx) => {
            const typeKey = TYPE_LABEL_KEYS[tx.type];
            const typeLabel = typeKey ? t(`promotion.commissionDetail.types.${typeKey}`, typeKey) : (tx.type ?? "—");
            const detailValue =
              tx?.level != null ? t("promotion.commissionDetail.levelLabel", { level: tx.level }) : typeLabel;
            const amount = Number(tx.amount);
            const isNegative = Number.isFinite(amount) && amount < 0;
            const balanceColor = isNegative ? AppColors.ERROR : AppColors.SUCCESS;
            const balanceDisplay = Number.isFinite(amount)
              ? (amount >= 0 ? "+" : "") + `$${formatNumber(tx.amount)}`
              : "$0";
            return (
              <Box
                key={tx.id || idx}
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid " + AppColors.BORDER_MAIN,
                  bgcolor: AppColors.BG_SECONDARY,
                }}
              >
                {/* <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    bgcolor: AppColors.GOLD_PRIMARY,
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: FONT_SIZE.BODY,
                      fontWeight: 700,
                      color: AppColors.TXT_BLACK,
                    }}
                  >
                    {typeLabel}
                  </Typography>
                </Box> */}
                <Box sx={{ px: 1.5 }}>
                  <DetailRow label={t("promotion.commissionDetail.rowType", "Type")} value={detailValue} />
                  <DetailRow label={t("promotion.commissionDetail.rowTime", "Time")} value={formatDate(tx.createdAt)} />
                  <DetailRow
                    label={t("promotion.commissionDetail.rowBalance", "Balance")}
                    value={balanceDisplay}
                    valueColor={balanceColor}
                  />
                </Box>
              </Box>
            );
          })}
          {pagination.total > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                py: 2,
                mt: 2,
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
                {t("promotion.commissionDetail.pagination.previous", "Previous")}
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
                {t("promotion.commissionDetail.pagination.pageOf", "Page {{current}} of {{total}}", {
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
                {t("promotion.commissionDetail.pagination.next", "Next")}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CommissionDetailPage;
