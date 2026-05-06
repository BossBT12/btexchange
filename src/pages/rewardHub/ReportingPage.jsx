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
import {
  FONT_SIZE,
  BORDER_RADIUS,
  SPACING,
  ICON_SIZE,
} from "../../constant/lookUpConstant";
import { LuChartBar } from "react-icons/lu";
import walletService from "../../services/secondGameServices/walletService";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import DatePicker from "../../components/input/datePicker";
import { formatDateInt } from "../../utils/utils";
import { MdCalendarToday } from "react-icons/md";

/** Row icon accents (rotating). Gold is reserved for “today” only. */
const DAILY_INCOME_ROW_ACCENTS = [
  "#25D07A",
  "#22D3EE",
  "#A78BFA",
  "#F472B6",
  "#38BDF8",
  "#EAB308",
];

function parseReportDate(raw) {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function isCalendarToday(date) {
  const n = new Date();
  return (
    date.getFullYear() === n.getFullYear() &&
    date.getMonth() === n.getMonth() &&
    date.getDate() === n.getDate()
  );
}

function formatDailyIncomeAmount(report) {
  const n = Number(
    report.amount ?? report.amountUsd ?? report.totalIncome ?? 0,
  );
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function DailyIncomeCalendarIcon({ dayOfMonth, accent }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width: 52,
        height: 52,
        minWidth: 52,
        padding: 0.425,
        background: `${accent}2b`,
        border: `1px solid ${accent}40`,
        borderRadius: BORDER_RADIUS.XS,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MdCalendarToday
        size={"100%"}
        color={accent}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
      <Typography
        sx={{
          position: "absolute",
          bottom: -5,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent,
          fontWeight: 800,
        }}
      >
        {dayOfMonth}
      </Typography>
    </Box>
  );
}

const REPORT_TYPES = [
  { value: "", labelKey: "all" },
  { value: "DAILY_INCOME", labelKey: "DAILY_INCOME" },
  { value: "DAILY_ROI", labelKey: "DAILY_ROI" },
  { value: "LEVEL_INCOME", labelKey: "LEVEL_INCOME" },
  { value: "RANK_INCOME", labelKey: "RANK_INCOME" },
  { value: "SAME_RANK_INCOME", labelKey: "SAME_RANK_INCOME" },
];

const ReportingPage = () => {
  const { t, i18n } = useTranslation(TRADE_NAMESPACE);
  const { type } = useLocation().state ?? {};
  const [reportType, setReportType] = useState(type ?? "");

  const typeToLabel = useCallback(
    (reportTypeValue) => {
      const found = REPORT_TYPES.find((r) => r.value === reportTypeValue);
      if (found) return t(`rewardHub.reporting.type.${found.labelKey}`);
      return t("rewardHub.reporting.type.other", "Income");
    },
    [t],
  );

  const formatDailyIncomeHeadingDate = useCallback(
    (date) => {
      if (!date) return "—";
      const lang = i18n.language || "en";
      const locale = lang.startsWith("zh")
        ? "zh-CN"
        : lang.startsWith("hi")
          ? "hi-IN"
          : lang.startsWith("es")
            ? "es"
            : lang.startsWith("fr")
              ? "fr"
              : "en-GB";
      return date.toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
    [i18n.language],
  );

  const PAGE_SIZE = 10;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapse, setIsCollapse] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
  });

  const hasActiveFilters =
    reportType !== "" || !!dateRange.startDate || !!dateRange.endDate;

  const fetchReports = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: PAGE_SIZE,
        };
        if (reportType === "DAILY_INCOME") {
          const rest = await walletService.getAllDailyIncome(params);
          const records = rest?.data ?? [];
          if (rest?.success) {
            setReports(records.rows);
            setPagination({
              page,
              limit: PAGE_SIZE,
              total: records.pagination.totalDays,
            });
          }
        } else {
          if (reportType) params.type = reportType;
          if (dateRange.startDate) params.startDate = dateRange.startDate;
          if (dateRange.endDate) params.endDate = dateRange.endDate;

          const res = await walletService.getIncomeHistory(params);
          const records = res?.data?.incomeRecords ?? [];
          const list = Array.isArray(records) ? records : [];
          const pag = res?.data?.pagination ?? {
            page,
            limit: PAGE_SIZE,
            total: list.length,
          };
          setPagination(pag);
          setReports(list);
        }
      } catch {
        setReports([]);
        setPagination({ page: 1, limit: PAGE_SIZE, total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [reportType, dateRange.startDate, dateRange.endDate],
  );

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / pagination.limit) || 1,
  );
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
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}
            >
              <Box
                sx={{
                  transform: "scaleY(-1) rotate(90deg)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LuChartBar
                  size={ICON_SIZE.MD}
                  color={AppColors.GOLD_PRIMARY}
                />
              </Box>
              <Typography
                variant="h3"
                sx={{ color: AppColors.GOLD_PRIMARY, fontWeight: 700 }}
              >
                {t("rewardHub.reporting.title", "Reporting")}
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{ color: AppColors.TXT_SUB, fontWeight: 400 }}
            >
              {t("rewardHub.reporting.subtitle", "View your income reports")}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setIsCollapse(!isCollapse)}
            sx={{
              position: "relative",
              color: AppColors.GOLD_PRIMARY,
              bgcolor: isCollapse
                ? `${AppColors.GOLD_PRIMARY}15`
                : "transparent",
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
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                flex: 1,
                minWidth: 0,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}
              >
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
                    "&.Mui-focused": {
                      borderColor: AppColors.GOLD_PRIMARY,
                      boxShadow: "0 0 0 2px rgba(212, 168, 95, 0.2)",
                    },
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
                        "&.Mui-selected": {
                          bgcolor: AppColors.HLT_LIGHT,
                          color: AppColors.GOLD_PRIMARY,
                        },
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
                display: reportType === "DAILY_INCOME" ? "none" : "flex",
                gap: 1.5,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}
                >
                  {t("rewardHub.reporting.startDate", "Start Date")}
                </Typography>
                <DatePicker
                  value={dateRange.startDate}
                  onChange={(date) =>
                    setDateRange((prev) => ({ ...prev, startDate: date ?? "" }))
                  }
                  placeholder={t(
                    "rewardHub.reporting.startDatePlaceholder",
                    "Select start date",
                  )}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}
                >
                  {t("rewardHub.reporting.endDate", "End Date")}
                </Typography>
                <DatePicker
                  value={dateRange.endDate}
                  onChange={(date) =>
                    setDateRange((prev) => ({ ...prev, endDate: date ?? "" }))
                  }
                  placeholder={t(
                    "rewardHub.reporting.endDatePlaceholder",
                    "Select end date",
                  )}
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
          ) : reportType === "DAILY_INCOME" ? (
            reports.map((report, index) => {
              const rowDate = parseReportDate(report.date);
              const isToday = rowDate != null && isCalendarToday(rowDate);
              const accent = isToday
                ? AppColors.GOLD_PRIMARY
                : DAILY_INCOME_ROW_ACCENTS[
                    index % DAILY_INCOME_ROW_ACCENTS.length
                  ];
              const dayNum = rowDate ? rowDate.getDate() : "—";
              const headingDate = formatDailyIncomeHeadingDate(rowDate);
              const reportTypeLabel = typeToLabel("DAILY_INCOME");
              const amountStr = formatDailyIncomeAmount(report);
              const amountColor = isToday
                ? AppColors.GOLD_PRIMARY
                : AppColors.TXT_MAIN;

              return (
                <Box
                  key={
                    report.id ??
                    report._id ??
                    `${report.date}-${report.amount}-${index}`
                  }
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1.75,
                    px: 1.75,
                    borderRadius: BORDER_RADIUS.XS,
                    bgcolor: "#090d16",
                    border: isToday
                      ? `1px solid ${AppColors.GOLD_PRIMARY}`
                      : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: isToday
                      ? "0 0 22px rgba(240, 185, 11, 0.22), inset 0 1px 0 rgba(255,255,255,0.05)"
                      : undefined,
                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                    ...(!isToday && {
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.1)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                      },
                    }),
                  }}
                >
                  {isToday && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 12,
                        px: 1.1,
                        py: 0.35,
                        borderRadius: BORDER_RADIUS.XS,
                        border: `1px solid ${AppColors.GOLD_PRIMARY}aa`,
                        bgcolor: "rgba(240, 185, 11, 0.14)",
                        color: AppColors.GOLD_PRIMARY,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.35,
                        lineHeight: 1.25,
                        zIndex: 1,
                      }}
                    >
                      {t("rewardHub.reporting.today", "Today")}
                    </Box>
                  )}
                  <DailyIncomeCalendarIcon
                    dayOfMonth={dayNum}
                    accent={accent}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      pr: isToday ? 6.5 : 0,
                    }}
                  >
                    <Typography
                      sx={{
                        color: AppColors.TXT_MAIN,
                        fontWeight: 700,
                        fontSize: FONT_SIZE.TITLE,
                        lineHeight: 1.25,
                        mb: 0.35,
                      }}
                    >
                      {headingDate}
                    </Typography>
                    <Typography
                      sx={{
                        color: AppColors.TXT_SUB,
                        fontWeight: 400,
                        fontSize: FONT_SIZE.BODY2,
                        lineHeight: 1.35,
                      }}
                    >
                      {reportTypeLabel}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: amountColor,
                      fontWeight: 700,
                      fontSize: FONT_SIZE.TITLE,
                      whiteSpace: "nowrap",
                      alignSelf: "center",
                    }}
                  >
                    {`+$${amountStr}`}
                  </Typography>
                </Box>
              );
            })
          ) : (
            reports.map((report, index) => (
              <Box
                key={
                  report.id ??
                  report._id ??
                  `${report.date}-${report.amount}-${index}`
                }
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
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
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
                      {report.date
                        ? formatDateInt(report.date)
                        : formatDateInt(new Date())}{" "}
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
                    + $
                    {String(
                      report.amount ??
                        report.amountUsd ??
                        report.totalIncome ??
                        0,
                    ).replace(/(\.\d*?)0+$/, "$1")}
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
                  borderColor:
                    AppColors.BORDER_MAIN ?? "rgba(255,255,255,0.12)",
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
                {t(
                  "rewardHub.reporting.pagination.pageOf",
                  "Page {{current}} of {{total}}",
                  {
                    current: currentPage,
                    total: totalPages,
                  },
                )}
              </Typography>
              <Button
                endIcon={<ChevronRight />}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNext || loading}
                sx={{
                  textTransform: "none",
                  color: AppColors.TXT_MAIN,
                  borderColor:
                    AppColors.BORDER_MAIN ?? "rgba(255,255,255,0.12)",
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
