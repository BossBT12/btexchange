import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Container,
  Button,
  Collapse,
} from "@mui/material";
import {
  AttachMoneyOutlined,
  KeyboardArrowDownOutlined,
  FilterAlt,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE, BORDER_RADIUS, SPACING, ICON_SIZE } from "../../constant/lookUpConstant";
import { LuChartBar } from "react-icons/lu";
import walletService from "../../services/secondGameServices/walletService";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import DatePicker from "../../components/input/datePicker";

const REPORT_TYPES = [
  { value: "", labelKey: "all" },
  { value: "DAILY_ROI", labelKey: "DAILY_ROI" },
  { value: "LEVEL_INCOME", labelKey: "LEVEL_INCOME" },
  { value: "RANK_INCOME", labelKey: "RANK_INCOME" },
  { value: "SAME_RANK_INCOME", labelKey: "SAME_RANK_INCOME" },
];

// const toYYYYMMDD = (d) => {
//   const date = d instanceof Date ? d : new Date(d);
//   const y = date.getFullYear();
//   const m = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// };

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const ReportingPage = () => {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const { type } = useLocation().state ?? {};
  const [reportType, setReportType] = useState(type ?? "");

  const typeToLabel = (reportTypeValue) => {
    const found = REPORT_TYPES.find((r) => r.value === reportTypeValue);
    if (found) return t(`rewardHub.reporting.type.${found.labelKey}`);
    return t("rewardHub.reporting.type.other", "Income");
  };

  const PAGE_SIZE = 10;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapse, setIsCollapse] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  const hasActiveFilters = reportType !== "" || !!dateRange.startDate || !!dateRange.endDate;

  const fetchReports = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: PAGE_SIZE,
          ...(reportType ? { type: reportType } : {}),
        };
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        const res = await walletService.getIncomeHistory(params);
        const records = res?.data?.incomeRecords ?? [];
        const list = Array.isArray(records) ? records : [];
        const pag = res?.data?.pagination ?? { page, limit: PAGE_SIZE, total: list.length };
        setPagination(pag);
        setReports(list);
      } catch {
        setReports([]);
        setPagination({ page: 1, limit: PAGE_SIZE, total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [reportType, dateRange.startDate, dateRange.endDate]
  );

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit) || 1);
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    fetchReports(newPage);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
        pb: 14,
      }}
    >
      {/* Page Title */}
      <Container maxWidth={false} sx={{ p: SPACING.MD }}>
        {/* Header */}
        <Box sx={{ mb: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
              <Box sx={{ transform: "scaleY(-1) rotate(90deg)", display: "flex", alignItems: "center" }}>
                <LuChartBar size={ICON_SIZE.MD} color={AppColors.GOLD_PRIMARY} />
              </Box>
              <Typography variant="h3" sx={{ color: AppColors.GOLD_PRIMARY, fontWeight: 700 }}>
                {t("rewardHub.reporting.title", "Reporting")}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: AppColors.TXT_SUB, fontWeight: 400 }}>
              {t("rewardHub.reporting.subtitle", "View your income reports")}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setIsCollapse(!isCollapse)}
            sx={{
              position: "relative",
              color: AppColors.GOLD_PRIMARY,
              bgcolor: isCollapse ? `${AppColors.GOLD_PRIMARY}15` : "transparent",
              border: `1px solid ${AppColors.GOLD_PRIMARY}40`,
              "&:hover": { bgcolor: `${AppColors.GOLD_PRIMARY}20` },
            }}
          >
            <FilterAlt sx={{ fontSize: ICON_SIZE.MD }} />
            {hasActiveFilters && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: AppColors.SUCCESS,
                }}
              />
            )}
          </IconButton>
        </Box>

        {/* Filter Panel - Collapsible */}
        <Collapse in={!isCollapse}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
              mb: 2,
              p: SPACING.MD,
              borderRadius: BORDER_RADIUS.XS,
              bgcolor: AppColors.BG_CARD,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}>
                {t("rewardHub.reporting.reportTypeLabel", "Report Type")}
              </Typography>
              <FormControl
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: BORDER_RADIUS.XS,
                    bgcolor: AppColors.BG_SECONDARY,
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: FONT_SIZE.BODY,
                    color: AppColors.TXT_MAIN,
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": { borderColor: "rgba(212, 168, 95, 0.4)" },
                    "&.Mui-focused": { borderColor: AppColors.GOLD_PRIMARY, boxShadow: "0 0 0 2px rgba(212, 168, 95, 0.2)" },
                    "& fieldset": { border: "none" },
                  },
                  "& .MuiSelect-select": { py: 1.5, px: 2 },
                  "& .MuiSelect-icon": { color: AppColors.TXT_SUB },
                }}
              >
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  displayEmpty
                  IconComponent={KeyboardArrowDownOutlined}
                  renderValue={(value) => typeToLabel(value)}
                >
                  {REPORT_TYPES.map(({ value, labelKey }) => (
                    <MenuItem
                      key={value || "all"}
                      value={value}
                      sx={{
                        fontSize: FONT_SIZE.BODY,
                        color: AppColors.TXT_MAIN,
                        bgcolor: AppColors.BG_CARD,
                        "&:hover": { bgcolor: AppColors.HLT_LIGHT },
                        "&.Mui-selected": { bgcolor: AppColors.HLT_LIGHT, color: AppColors.GOLD_PRIMARY },
                      }}
                    >
                      {t(`rewardHub.reporting.type.${labelKey}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                minWidth: 0,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}>
                  {t("rewardHub.reporting.startDate", "Start Date")}
                </Typography>
                <DatePicker
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange((prev) => ({ ...prev, startDate: date ?? "" }))}
                  placeholder={t("rewardHub.reporting.startDatePlaceholder", "Select start date")}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}>
                  {t("rewardHub.reporting.endDate", "End Date")}
                </Typography>
                <DatePicker
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange((prev) => ({ ...prev, endDate: date ?? "" }))}
                  placeholder={t("rewardHub.reporting.endDatePlaceholder", "Select end date")}
                />
              </Box>
            </Box>
          </Box>
        </Collapse>

        {/* Income Report List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {loading ? (
            <Typography
              variant="body1"
              sx={{
                color: AppColors.TXT_SUB,
                fontWeight: 400,
                textAlign: "center",
                py: 4,
              }}
            >
              {t("rewardHub.reporting.loading", "Loading reports...")}
            </Typography>
          ) : reports.length === 0 ? (
            <Typography
              variant="body1"
              sx={{
                color: AppColors.TXT_SUB,
                fontWeight: 400,
                textAlign: "center",
                py: 4,
              }}
            >
              {t("rewardHub.reporting.noData", "No data")}
            </Typography>
          ) : (
            reports.map((report, index) => (
              <Box
                key={report.id ?? report._id ?? `${report.date}-${report.amount}-${index}`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 1.5,
                  p: SPACING.MD,
                  borderRadius: BORDER_RADIUS.XS,
                  bgcolor: AppColors.BG_CARD,
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 4px 20px rgba(212, 168, 95, 0.06)",
                    borderColor: "rgba(212, 168, 95, 0.12)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "space-between", width: "100%" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      minWidth: 44,
                      borderRadius: "50%",
                      bgcolor: AppColors.HLT_LIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AttachMoneyOutlined
                      sx={{ color: AppColors.GOLD_PRIMARY, fontSize: 22 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        color: AppColors.TXT_MAIN,
                        fontWeight: 700,
                        mb: 0.25,
                      }}
                    >
                      {typeToLabel(report.type)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: AppColors.TXT_SUB,
                        fontWeight: 400,
                        mb: 0.5,
                      }}
                    >
                      {report.date ? formatDate(report.date) : formatDate(new Date())}{" "}
                      {report.time ? `• ${report.time}` : ""}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      color: AppColors.GOLD_PRIMARY,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    + ${String(report.amount ?? report.amountUsd ?? 0).replace(/(\.\d*?)0+$/, "$1")}
                  </Typography>
                </Box>
                {/* {report.description && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: AppColors.TXT_SUB,
                      fontWeight: 400,
                      opacity: 0.9,
                    }}
                  >
                    {report.description}
                  </Typography>
                )} */}
              </Box>
            ))
          )}
          {!loading && reports.length > 0 && pagination.total > 0 && (
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
                  borderColor: AppColors.BORDER_MAIN ?? "rgba(255,255,255,0.12)",
                  "&:hover": {
                    borderColor: AppColors.GOLD_PRIMARY,
                    bgcolor: AppColors.HLT_LIGHT,
                  },
                  "&.Mui-disabled": { color: AppColors.TXT_SUB },
                }}
                variant="outlined"
                size="small"
              >
                {t("rewardHub.reporting.pagination.previous", "Previous")}
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
                {t("rewardHub.reporting.pagination.pageOf", "Page {{current}} of {{total}}", {
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
                  borderColor: AppColors.BORDER_MAIN ?? "rgba(255,255,255,0.12)",
                  "&:hover": {
                    borderColor: AppColors.GOLD_PRIMARY,
                    bgcolor: AppColors.HLT_LIGHT,
                  },
                  "&.Mui-disabled": { color: AppColors.TXT_SUB },
                }}
                variant="outlined"
                size="small"
              >
                {t("rewardHub.reporting.pagination.next", "Next")}
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ReportingPage;
