import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import {
  WorkspacePremiumOutlined,
  ContentCopy,
  DescriptionOutlined,
  AssessmentOutlined,
  AttachMoneyOutlined,
  MenuBookOutlined,
  HeadsetOutlined,
  AccountBalanceWalletOutlined,
  KeyboardArrowRight,
  QrCode2Outlined,
  StackedBarChartOutlined,
  CheckCircleOutlined,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import useSnackbar from "../../hooks/useSnackbar";
import { FONT_SIZE, ICON_SIZE } from "../../constant/lookUpConstant";
import promotionService from "../../services/promotionService";
import { copyToClipboard } from "../../utils/utils";
import promotionBg from "../../assets/images/bldto.webp";
import InvitePosterModal from "../../components/InvitePosterModal";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import dashboardServices from "../../services/dashboardServices";

const SUBORDINATE_TABS = [
  { key: "direct", label: "Direct subordinates" },
  { key: "team", label: "Team subordinates" },
];

const STAT_ROWS = [
  { key: "registerCount", label: "number of register", colorKey: "success" },
  { key: "depositCount", label: "Deposit number", colorKey: "success" },
  { key: "depositAmount", label: "Deposit amount", colorKey: "gold", isAmount: true },
  { key: "firstDepositCount", label: "Number of people making first deposit", colorKey: "gold" },
];

const MENU_ITEMS = [
  { label: "Partner rewards", icon: WorkspacePremiumOutlined, path: "/promotion/partner-rewards" },
  { label: "Copy invitation code", icon: DescriptionOutlined, copy: true },
  { label: "Subordinate data", icon: AssessmentOutlined, path: "/promotion/subordinate-data" },
  { label: "Commission detail", icon: AttachMoneyOutlined, path: "/promotion/commission-detail" },
  { label: "Invitation rules", icon: MenuBookOutlined, path: "/promotion/rules" },
  { label: "Agent line customer service", icon: HeadsetOutlined, path: "/promotion/agent-service" },
  { label: "Rebate ratio", icon: AccountBalanceWalletOutlined, path: "/promotion/rebate-ratio" },
];

const StatValue = ({ value, label, colorKey }) => (
  <Box sx={{ mb: 1.5, textAlign: "center" }}>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: colorKey === "success" ? AppColors.SUCCESS : AppColors.GOLD_PRIMARY,
      }}
    >
      {value ?? "0"}
    </Typography>
    <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
      {label}
    </Typography>
  </Box>
);

const formatNumber = (n) => {
  if (n == null || n === "") return "0";
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : "0";
};

const PromotionPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posterModalOpen, setPosterModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardData, summaryData] = await Promise.all([
        promotionService.getDashboard(),
        promotionService.getSummary()
      ]);

      setSummary(summaryData);
      setDashboard(dashboardData);
    } catch (err) {
      const message = err?.message || t("promotion.errors.loadFailed", "Failed to load promotion data");
      showSnackbar(message, "error");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const invitationCode = dashboard?.invitationCode ?? "";
  const directStats = dashboard?.directSubordinates ?? {};
  const teamStats = dashboard?.teamSubordinates ?? {};

  const referralRewardState = {
    invitationCount: summary?.registerCount ?? 0,
    effectiveIntCount: summary?.activeRegisterdCount ?? 0,
    intTotalBonus: summary?.totalReferralIncome ?? 0,
  }

  const handleCopyCode = async () => {
    if (!invitationCode) return;
    copyToClipboard(invitationCode, setCopied);
  }

  const handleDownloadQr = useCallback(() => {
    setPosterModalOpen(true);
  }, []);

  const handleNavigate = (path) => {
    if (path === "/promotion/partner-rewards") {
      if (loading) return;
      navigate(path, { state: { referralRewardState } });
    } else {
      navigate(path);
    }
  }

  const handleDisable = (path) => {
    if (path === "/promotion/partner-rewards") {
      return loading;
    }
    return false;
  }

  return (
    <Box
      sx={{
        position: "relative",
        color: AppColors.TXT_MAIN,
        pb: 10,
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
          backgroundColor: AppColors.BG_MAIN,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Box sx={{ width: 40 }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
            textAlign: "center",
          }}
        >
          {t("promotion.header.title", "Promotion")}
        </Typography>
        <IconButton
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <WorkspacePremiumOutlined sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

      {/* Commission summary – golden gradient */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          mb: 2,
          height: "40vh",
          overflow: "hidden",
          // background: `radial-gradient(ellipse farthest-corner at right bottom, #FEDB37 0%, #FDB931 8%, #9f7928 30%, #8A6E2F 40%, transparent 80%),
          // radial-gradient(ellipse farthest-corner at left top, #FFFFFF 0%, #FFFFAC 8%, #D1B464 25%, #5d4a1f 62.5%, #5d4a1f 100%)`,
          background: `url(${promotionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundBlendMode: "overlay",
          opacity: 0.6,
          zIndex: -1,
        }}
      />

      <Box sx={{ mx: 2, mt: 0 }}>
        <Box sx={{ textAlign: "center", px: 2, pt: 2.5, pb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: AppColors.TXT_WHITE,
              textAlign: "center",
            }}
          >
            {loading ? t("promotion.loading", "Loading...") : `$${formatNumber(dashboard?.totalCommission)}`}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255,255,255,0.9)",
              textAlign: "center",
              mt: 0.5,
            }}
          >
            {t("promotion.totalCommission", "Total Commission")}
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mt: 1.5,
              px: 2,
              py: 0.5,
              borderRadius: 20,
              bgcolor: "rgba(255,255,255,0.2)",
            }}
          >
            <Typography variant="body2" sx={{ color: AppColors.TXT_WHITE }}>
              {t("promotion.yesterdayCommissionLabel", "Yesterday's total commission")}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: AppColors.TXT_WHITE,
                ml: 1,
              }}
            >
              ${formatNumber(dashboard?.yesterdayCommission)}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              mt: 1.5,
            }}
          >
            {t("promotion.upgradeHint", "Upgrade the level to increase commission income")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", overflow: "hidden", borderBottom: "none" }}>
          {SUBORDINATE_TABS.map(({ key, label }) => (
            <Box
              key={key}
              sx={{
                flex: 1,
                py: 1.25,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: AppColors.HLT_MAIN,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: AppColors.TXT_WHITE,
                }}
              >
                {t(`promotion.subordinateTabs.${key}`, label)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Subordinate stats */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: AppColors.BG_SECONDARY,
            border: "1px solid rgba(255,255,255,0.06)",
            borderTop: "none",
          }}
        >
          <Box sx={{ display: "flex", gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              {STAT_ROWS.map((row) => (
                <StatValue
                  key={row.key}
                  value={row.isAmount ? `$${formatNumber(directStats[row.key])}` : formatNumber(directStats[row.key])}
                  label={t(`promotion.subordinateStats.${row.key}`, row.label)}
                  colorKey={row.colorKey}
                />
              ))}
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              {STAT_ROWS.map((row) => (
                <StatValue
                  key={row.key}
                  value={row.isAmount ? `$${formatNumber(teamStats[row.key])}` : formatNumber(teamStats[row.key])}
                  label={t(`promotion.subordinateStats.${row.key}`, row.label)}
                  colorKey={row.colorKey}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Download QR Code */}
      <Box sx={{ px: 2, mt: 2, textAlign: "center" }}>
        <Button
          className="btn-primary"
          fullWidth
          disabled={loading}
          startIcon={<QrCode2Outlined />}
          onClick={handleDownloadQr}
          sx={{
            textTransform: "uppercase",
            fontSize: FONT_SIZE.BODY,
            bgcolor: AppColors.GOLD_PRIMARY,
            color: AppColors.TXT_BLACK,
            borderRadius: 20,
            py: 1,
            "&:hover": { bgcolor: AppColors.GOLD_PRIMARY },
          }}
        >
          {loading
            ? t("promotion.loading", "Loading...")
            : t("promotion.downloadQrCta", "Download QR Code")}
        </Button>
      </Box>

      {/* Menu list cards */}
      <Box sx={{ px: 2, mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {MENU_ITEMS.map((item) => (
          <Box
            key={item.label}
            onClick={() => !item.copy && item.path && handleNavigate(item.path)}
            disabled={handleDisable(item.path)}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1.5,
              py: 1.25,
              borderRadius: 2,
              bgcolor: AppColors.BG_CARD,
              border: "1px solid " + AppColors.BORDER_MAIN,
              opacity: handleDisable(item.path) ? 0.5 : 1,
            }}
          >
            <Box
              sx={{
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                mr: 1.5,
              }}
            >
              <item.icon sx={{ fontSize: ICON_SIZE.SM, color: AppColors.GOLD_PRIMARY }} />
            </Box>
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                fontWeight: 500,
                color: AppColors.TXT_MAIN,
              }}
            >
              {t(`promotion.menu.${item.label}`, item.label)}
            </Typography>
            {item.copy && (
              <>
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_SUB,
                    mr: 0.5,
                  }}
                >
                  {invitationCode || "—"}
                </Typography>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode();
                  }}
                  sx={{
                    color: AppColors.TXT_SUB,
                    p: 0.5,
                    "&:hover": { color: AppColors.GOLD_PRIMARY },
                  }}
                >
                  {copied ? <CheckCircleOutlined sx={{ fontSize: FONT_SIZE.TITLE, color: AppColors.SUCCESS }} /> : <ContentCopy sx={{ fontSize: FONT_SIZE.TITLE }} />}
                </IconButton>
              </>
            )}
            {!item.copy && item.path && (
              <KeyboardArrowRight sx={{ color: AppColors.TXT_SUB, fontSize: 22 }} />
            )}
          </Box>
        ))}
      </Box>

      {/* Promotion data card */}
      <Box
        sx={{
          mx: 2,
          mt: 2,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: AppColors.BG_CARD,
          border: "1px solid " + AppColors.BORDER_MAIN,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
          <StackedBarChartOutlined sx={{ fontSize: 20, color: AppColors.GOLD_PRIMARY }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: AppColors.TXT_MAIN }}>
            {t("promotion.data.title", "Promotion data")}
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          {[
            {
              value: `$${formatNumber(dashboard?.thisWeekCommission)}`,
              label: t("promotion.data.thisWeek", "This Week"),
            },
            {
              value: `$${formatNumber(dashboard?.totalCommission)}`,
              label: t("promotion.data.total", "Total commission"),
            },
            {
              value: formatNumber(summary?.totalDirectSubordinate),
              label: t("promotion.data.directSubordinate", "direct subordinate"),
            },
            {
              value: formatNumber(summary?.totalTeamSubordinate),
              label: t(
                "promotion.data.totalTeamSubordinates",
                "Total number of subordinates in the team"
              ),
            },
          ].map(({ value, label }, index) => (
            <Box key={label} sx={{
              textAlign: "center", borderRight: index === 0 || index === 2
                ? `1px solid ${AppColors.BORDER_MAIN}`
                : "none"
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: AppColors.TXT_MAIN }}>
                {value}
              </Typography>
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <InvitePosterModal
        open={posterModalOpen}
        onClose={() => setPosterModalOpen(false)}
        inviteIncomeText={formatNumber(dashboard?.inviteIncome) || "10 billion"}
      />
    </Box >
  );
};

export default PromotionPage;
