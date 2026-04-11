import React, { useEffect, useState, Suspense } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  VisibilityOutlined,
  VisibilityOffOutlined,
  KeyboardArrowDown,
  History as HistoryIcon,
  SwapHoriz,
  AccountBalanceWallet,
  Savings,
  NotificationsOutlined,
  Language,
  FeedbackOutlined,
  Campaign,
  ContactSupport,
  MenuBook,
  Info,
  ChevronRight,
  Telegram,
  Person,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { useNavigate } from "react-router-dom";
import { FONT_SIZE, SPACING } from "../../constant/lookUpConstant";
import dashboardServices from "../../services/dashboardServices";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, TRADE_NAMESPACE } from "../../i18n";
import DepositDestinationModal from "../../components/DepositDestinationModal";
const PdfViewerModal = React.lazy(() => import("../../components/PdfViewerModal"));

const AssetsPage = () => {
  const { t, i18n } = useTranslation(TRADE_NAMESPACE);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const currentLngCode = i18n.language?.split("-")[0] || i18n.language;
  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLngCode)?.label ??
    t("assets.options.currentLanguage", "English");
  const [dashboardData, setDashboardData] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [telegramLink, setTelegramLink] = useState({
    channel: null,
    group: null,
  });
  const [loading, setLoading] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [depositChoiceOpen, setDepositChoiceOpen] = useState(false);

  const handleOpenLanguageMenu = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleCloseLanguageMenu = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    handleCloseLanguageMenu();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          dashboardServices.getDashboardData(),
          dashboardServices.getSocialMediaLinks(),
        ]);
        if (res1?.success && res2?.success) {
          setDashboardData(res1.data);
          setTelegramLink({
            channel: res2?.data?.telegramUrl ?? null,
            group: res2?.data?.groupTelegramUrl ?? null,
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const navigate = useNavigate();

  return (
    <Box
      sx={{
        color: AppColors.TXT_MAIN,
        display: "flex",
        flexDirection: "column",
        px: 1,
        pt: 1,
        pb: 10,
      }}
    >
      {/* Total Value (est.) */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
            {t("assets.totalValue", "Total Value (est.)")}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setBalanceVisible((v) => !v)}
            sx={{ color: AppColors.TXT_SUB, p: 0.25 }}
          >
            {balanceVisible && !loading ? (
              <VisibilityOutlined sx={{ fontSize: 18 }} />
            ) : (
              <VisibilityOffOutlined sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, flexWrap: "wrap" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: AppColors.TXT_MAIN,
            }}
          >
            {loading ? "Loading..." : balanceVisible ? dashboardData ? dashboardData?.balances?.totalAvailableForTrading.toFixed(2) : "0.00" : "****"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", color: AppColors.TXT_SUB }}>
            <Typography variant="body2">{t("assets.currency", "USDT")}</Typography>
            <KeyboardArrowDown sx={{ fontSize: 18 }} />
          </Box>
        </Box>
        <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, mt: 0.25 }}>
          {loading ? "Loading..." : balanceVisible
            ? t("assets.approx", {
              value: dashboardData
                ? dashboardData?.balances?.totalAvailableForTrading.toFixed(2)
                : "0.00",
              defaultValue: " ${{value}}",
            })
            : "****"}
        </Typography>
      </Box>

      {/* Deposit, Withdraw, Transfer */}
      <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
        <Button
          className="btn-primary"
          onClick={() => setDepositChoiceOpen(true)}
          fullWidth
          sx={{
            textTransform: "none",
            fontSize: FONT_SIZE.BODY,
            fontWeight: 500,
            color: AppColors.TXT_MAIN,
            borderRadius: 2,
            py: SPACING.SM,
          }}
        >
          {t("assets.deposit", "Deposit")}
        </Button>
        <Button
          onClick={() => navigate("/withdraw")}
          fullWidth
          variant="outlined"
          sx={{
            textTransform: "none",
            fontSize: FONT_SIZE.BODY,
            fontWeight: 500,
            color: AppColors.TXT_MAIN,
            borderColor: "rgba(255,255,255,0.25)",
            borderRadius: 2,
            py: SPACING.SM,
            "&:hover": { borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          {t("assets.withdraw", "Withdraw")}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => navigate("/coming-soon")}
          sx={{
            textTransform: "none",
            fontSize: FONT_SIZE.BODY,
            fontWeight: 500,
            color: AppColors.TXT_MAIN,
            borderColor: "rgba(255,255,255,0.25)",
            borderRadius: 2,
            py: SPACING.XS,
            "&:hover": { borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          {t("assets.transfer", "Transfer")}
        </Button>
      </Box>

      {/* History & Transaction cards (2x2) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        {[
          {
            titleKey: "assets.cards.gameHistoryTitle",
            subtitleKey: "assets.cards.gameHistorySubtitle",
            defaultTitle: "Trade History",
            defaultSubtitle: "My Trade history",
            icon: HistoryIcon,
            iconBg: "rgba(33, 150, 243, 0.2)",
            iconColor: "#2196f3",
            path: "/trade-history",
          },
          {
            titleKey: "assets.cards.transactionTitle",
            subtitleKey: "assets.cards.transactionSubtitle",
            defaultTitle: "Transaction",
            defaultSubtitle: "My transaction history",
            icon: SwapHoriz,
            iconBg: "rgba(0, 188, 212, 0.2)",
            iconColor: "#00bcd4",
            path: "/transaction-history",
          },
          {
            titleKey: "assets.cards.depositTitle",
            subtitleKey: "assets.cards.depositSubtitle",
            defaultTitle: "Deposit",
            defaultSubtitle: "My deposit history",
            icon: AccountBalanceWallet,
            iconBg: "rgba(244, 67, 54, 0.2)",
            iconColor: "#f44336",
            path: "/deposit-history",
          },
          {
            titleKey: "assets.cards.withdrawTitle",
            subtitleKey: "assets.cards.withdrawSubtitle",
            defaultTitle: "Withdraw",
            defaultSubtitle: "My withdraw history",
            icon: Savings,
            iconBg: "rgba(255, 152, 0, 0.2)",
            iconColor: "#ff9800",
            path: "/withdraw?type=history",
          },
        ].map((item) => (
          <Box
            key={item.titleKey}
            component="button"
            onClick={() => navigate(item.path, { state: item?.state ?? null })}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1,
              textAlign: "left",
              justifyContent: "flex-start",
              cursor: "pointer",
              borderRadius: 2,
              bgcolor: AppColors.BG_CARD,
              border: "1px solid rgba(255,255,255,0.08)",
              "&:hover": { bgcolor: AppColors.BG_CARD_HOVER },
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                bgcolor: item.iconBg,
                color: item.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <item.icon sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, color: AppColors.TXT_MAIN }}
              >
                {t(item.titleKey, item.defaultTitle)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: AppColors.TXT_SUB, mt: 0.25 }}
              >
                {t(item.subtitleKey, item.defaultSubtitle)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* General options list */}
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: AppColors.BG_CARD,
          border: "1px solid rgba(255,255,255,0.08)",
          mb: 2.5,
        }}
      >
        {[
          {
            label: t("assets.options.notification", "Notification"),
            icon: NotificationsOutlined,
            badge: 1,
            path: "/notifications",
          },
          {
            label: t("assets.options.telegramChannel", "Telegram Channel"),
            icon: Telegram,
            path: telegramLink?.channel ?? "https://t.me/btexchange0",
            external: true,
          },
          {
            label: t("assets.options.telegramGroup", "Telegram Group"),
            icon: Telegram,
            path: telegramLink?.group ?? "https://t.me/btexchange0",
            external: true,
          },
          {
            label: t("assets.options.language", "Language"),
            icon: Language,
            right: currentLanguageLabel,
            path: null,
            isLanguage: true,
          },
        ].map((item, idx) => (
          <Box
            key={item.label}
            component="button"
            onClick={
              item?.isLanguage
                ? handleOpenLanguageMenu
                : () => {
                  if (!item.path) return;
                  if (item.external) window.open(item.path, "_blank", "noopener,noreferrer");
                  else navigate(item.path);
                }
            }
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              p: 1.5,
              gap: 1.25,
              border: "none",
              cursor: "pointer",
              bgcolor: "transparent",
              borderBottom: idx < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
              "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                bgcolor: AppColors.HLT_LIGHT,
                color: AppColors.GOLD_PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <item.icon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="body1" sx={{ flex: 1, fontWeight: 500, color: AppColors.TXT_MAIN, textAlign: "left" }}>
              {item.label}
            </Typography>
            {/* {item.badge != null && (
              <Box
                sx={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: AppColors.ERROR,
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.badge}
              </Box>
            )} */}
            {item.right && (
              <Typography variant="body1" sx={{ color: AppColors.TXT_SUB }}>
                {item.right}
              </Typography>
            )}
            <ChevronRight sx={{ color: AppColors.TXT_SUB, fontSize: 22 }} />
          </Box>
        ))}
      </Box>

      {/* Language selection menu */}
      <Menu
        anchorEl={languageAnchorEl}
        open={Boolean(languageAnchorEl)}
        onClose={handleCloseLanguageMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <MenuItem
            key={lng.code}
            selected={i18n.language === lng.code}
            onClick={() => handleLanguageChange(lng.code)}
          >
            {lng.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Service center */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: AppColors.TXT_MAIN,
          mb: 1.25,
        }}
      >
        {t("assets.serviceCenterTitle", "Service center")}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0.5,
          borderRadius: 2,
          p: 1,
          bgcolor: AppColors.BG_CARD,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {[
          { label: t("assets.serviceCenter.profile", "Profile"), icon: Person, path: "/user/profile" },
          { label: t("assets.serviceCenter.feedback", "Feedback"), icon: FeedbackOutlined, path: "/feedback" },
          { label: t("assets.serviceCenter.announcement", "Announcement"), icon: Campaign, path: "/announcement" },
          { label: t("assets.serviceCenter.customerService", "Customer Service"), icon: ContactSupport, path: "/agent-service" },
          { label: t("assets.serviceCenter.beginnerGuide", "Beginner's Guide"), icon: MenuBook, openGuidePdf: true },
          { label: t("assets.serviceCenter.aboutUs", "About us"), icon: Info, path: "/about" },
        ].map((item) => (
          <Box
            key={item.label}
            component="button"
            onClick={() => {
              if (item.openGuidePdf) setGuideModalOpen(true);
              else if (item.path) navigate(item.path);
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.75,
              p: 0.5,
              border: "none",
              cursor: "pointer",
              borderRadius: 1.5,
              bgcolor: "transparent",
              color: AppColors.TXT_MAIN,
              "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: AppColors.HLT_LIGHT,
                color: AppColors.GOLD_PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <item.icon sx={{ fontSize: 22 }} />
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: AppColors.TXT_MAIN,
                textAlign: "center",
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {guideModalOpen && (
        <Suspense fallback={null}>
          <PdfViewerModal
            open={guideModalOpen}
            onClose={() => setGuideModalOpen(false)}
            title={t("assets.serviceCenter.beginnerGuide", "Beginner's Guide")}
          />
        </Suspense>
      )}

      <DepositDestinationModal
        open={depositChoiceOpen}
        onClose={() => setDepositChoiceOpen(false)}
      />
    </Box>
  );
};

export default AssetsPage;
