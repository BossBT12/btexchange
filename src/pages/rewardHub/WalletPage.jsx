import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Divider,
  Menu,
  MenuItem,
  Skeleton,
} from "@mui/material";
import {
  VisibilityOutlined,
  VisibilityOffOutlined,
  KeyboardArrowDown,
  SwapHoriz,
  AccountBalanceWallet,
  Savings,
  NotificationsOutlined,
  Language,
  ChevronRight,
  Telegram,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { useNavigate } from "react-router-dom";
import { FONT_SIZE, SPACING } from "../../constant/lookUpConstant";
import walletService from "../../services/secondGameServices/walletService";
import { SUPPORTED_LANGUAGES, TRADE_NAMESPACE } from "../../i18n";
import { useTranslation } from "react-i18next";
import dashboardServices from "../../services/dashboardServices";
import userService from "../../services/secondGameServices/userService";
import DepositDestinationModal from "../../components/DepositDestinationModal";

const formatNumber = (value, maximumFractionDigits = 3) => {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(
    num,
  );
};

const AssetsPage = () => {
  const { t, i18n } = useTranslation(TRADE_NAMESPACE);
  const currentLngCode = i18n.language?.split("-")[0] || i18n.language;
  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLngCode)?.label ??
    t("assets.options.currentLanguage", "English");
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [walletStats, setWalletStats] = useState(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [telegramLink, setTelegramLink] = useState(null);
  const [statsSummary, setStatsSummary] = useState(null);
  const [depositChoiceOpen, setDepositChoiceOpen] = useState(false);
  const navigate = useNavigate();

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

  const fetchData = async () => {
    try {
      setIsLoadingWallet(true);
      const [res1, res2, res3] = await Promise.all([
        walletService.getWalletBalanceAndStats(),
        dashboardServices.getSocialMediaLinks(),
        userService.getStatsSummary(),
      ]);
      if (res1?.success) {
        setWalletStats(res1?.data ?? null);
        setTelegramLink(res2?.data?.telegramUrl ?? null);
        setStatsSummary(res3?.data ?? null);
      }
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const wallet = walletStats?.wallet ?? {};
  const totalAssets = Number(
    wallet?.WITHDRAWABLE_BALANCE + wallet?.CAPITAL_BALANCE || 0,
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: AppColors.TXT_MAIN,
        display: "flex",
        flexDirection: "column",
        px: 2,
        pt: 1.5,
        pb: 10,
        bgcolor: AppColors.BG_MAIN,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
            {t("assets.totalValue", "Total Value (est.)")}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setBalanceVisible((v) => !v)}
            aria-label={
              balanceVisible
                ? t("assets.hideBalanceAriaLabel", "Hide balance")
                : t("assets.showBalanceAriaLabel", "Show balance")
            }
            sx={{ color: AppColors.TXT_SUB, p: 0.25 }}
          >
            {balanceVisible ? (
              <VisibilityOutlined sx={{ fontSize: 18 }} />
            ) : (
              <VisibilityOffOutlined sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            gap: 0.5,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: AppColors.TXT_MAIN,
            }}
          >
            {balanceVisible
              ? isLoadingWallet
                ? t("assets.loading", "Loading...")
                : (totalAssets.toFixed(2) ?? "0.00")
              : "****"}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: AppColors.TXT_SUB,
            }}
          >
            <Typography variant="body2">
              {t("assets.currency", "USDT")}
            </Typography>
            <KeyboardArrowDown sx={{ fontSize: 18 }} />
          </Box>
        </Box>
        <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, mt: 0.25 }}>
          ≈ $
          {balanceVisible
            ? t("assets.approx", "{{value}}", {
                value: isLoadingWallet
                  ? t("assets.loading", "Loading...")
                  : (totalAssets.toFixed(2) ?? "0.00"),
              })
            : "****"}
        </Typography>
      </Box>

      {/* Deposit, Withdraw, Transfer */}
      <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
        <Button
          onClick={() => setDepositChoiceOpen(true)}
          fullWidth
          className="btn-primary"
          sx={{
            textTransform: "none",
            fontSize: FONT_SIZE.BODY,
            fontWeight: 600,
            color: "#000",
            borderRadius: 2,
            py: SPACING.SM,
          }}
        >
          {t("assets.deposit", "Deposit")}
        </Button>
        <Button
          onClick={() => navigate("/reward-hub/withdraw")}
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
            "&:hover": {
              borderColor: "rgba(255,255,255,0.4)",
              bgcolor: "rgba(255,255,255,0.06)",
            },
          }}
        >
          {t("assets.withdraw", "Withdraw")}
        </Button>
      </Box>

      {/* History & Transaction cards (2x2) */}
      <Grid container spacing={1} mb={2.5}>
        {[
          {
            titleKey: "assets.cards.transactionTitle",
            subtitleKey: "assets.cards.transactionSubtitle",
            icon: SwapHoriz,
            iconBg: "rgba(0, 188, 212, 0.2)",
            iconColor: "#00bcd4",
            path: "/reward-hub/transaction-history",
          },
          {
            titleKey: "assets.cards.depositTitle",
            subtitleKey: "assets.cards.depositSubtitle",
            icon: AccountBalanceWallet,
            iconBg: "rgba(244, 67, 54, 0.2)",
            iconColor: "#f44336",
            path: "/reward-hub/transaction-history",
            state: { type: "DEPOSIT" },
          },
          {
            titleKey: "assets.cards.withdrawTitle",
            subtitleKey: "assets.cards.withdrawSubtitle",
            icon: Savings,
            iconBg: "rgba(255, 152, 0, 0.2)",
            iconColor: "#ff9800",
            path: "/reward-hub/transaction-history",
            state: { type: "WITHDRAWAL" },
          },
        ].map((item, idx) => (
          <Grid
            size={{ xs: idx === 0 ? 12 : 6, md: 4 }}
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
              border: "none",
              cursor: "pointer",
              borderRadius: 2,
              bgcolor: AppColors.BG_SECONDARY,
              borderColor: "rgba(255,255,255,0.08)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
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
                {t(item.titleKey)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: AppColors.TXT_SUB, mt: 0.25 }}
              >
                {t(item.subtitleKey)}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* General options list */}
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: AppColors.BG_SECONDARY,
          border: "1px solid rgba(255,255,255,0.08)",
          mb: 2.5,
        }}
      >
        {[
          {
            labelKey: "assets.options.notification",
            icon: NotificationsOutlined,
            path: "/notifications",
          },
          {
            labelKey: "assets.options.telegramChannel",
            icon: Telegram,
            path: telegramLink ?? "https://t.me/btexchange0",
            external: true,
          },
          {
            labelKey: "assets.options.telegramGroup",
            icon: Telegram,
            path: telegramLink ?? "https://t.me/btexchange0",
            external: true,
          },
          {
            labelKey: "assets.options.language",
            icon: Language,
            right: currentLanguageLabel,
            path: "#",
            isLanguage: true,
          },
        ].map((item, idx) => (
          <Box
            key={item.labelKey}
            component="button"
            onClick={
              item?.isLanguage
                ? handleOpenLanguageMenu
                : () => {
                    if (!item.path) return;
                    if (item?.external)
                      window.open(item.path, "_blank", "noopener,noreferrer");
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
              borderBottom:
                idx < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
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
            <Typography
              variant="body1"
              sx={{
                flex: 1,
                fontWeight: 500,
                color: AppColors.TXT_MAIN,
                textAlign: "left",
              }}
            >
              {t(item.labelKey)}
            </Typography>
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
      {/* Referral & income summary */}
      <Box sx={{ mb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Sign up / participate stats */}
        <Box
          sx={{
            bgcolor: AppColors.BG_CARD,
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                textAlign: "center",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <Box
                sx={{
                  minHeight: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 0.25,
                }}
              >
                {isLoadingWallet ? (
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={28}
                    sx={{ borderRadius: 1 }}
                  />
                ) : (
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      color: AppColors.GOLD_PRIMARY,
                      textAlign: "center",
                    }}
                  >
                    {formatNumber(statsSummary?.totalTeamCount ?? 0, 0)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                {t("assets.stats.signUpQty")}
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box
              sx={{
                textAlign: "center",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <Box
                sx={{
                  minHeight: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 0.25,
                }}
              >
                {isLoadingWallet ? (
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={28}
                    sx={{ borderRadius: 1 }}
                  />
                ) : (
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      color: AppColors.GOLD_PRIMARY,
                      textAlign: "center",
                    }}
                  >
                    {formatNumber(statsSummary?.totalActiveTeamCount ?? 0, 0)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                {t("assets.stats.participateQty")}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ textAlign: "center", mt: 0.5 }}>
          <Typography
            variant="body1"
            sx={{
              color: AppColors.TXT_MAIN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 0.5,
            }}
          >
            <span>{t("assets.stats.circulation")}</span>
            <Box
              component="span"
              sx={{
                color: AppColors.GOLD_PRIMARY,
                fontWeight: 600,
                display: "inline-flex",
                justifyContent: "center",
              }}
            >
              {isLoadingWallet ? (
                <Skeleton
                  variant="rounded"
                  width={72}
                  height={22}
                  sx={{ borderRadius: 0.5 }}
                />
              ) : (
                formatNumber(statsSummary?.totalIncome ?? 0, 3)
              )}
            </Box>
            <span>{t("assets.currency")}</span>
          </Typography>
        </Box>

        {/* Personal vs team income */}
        <Box
          sx={{
            bgcolor: AppColors.BG_CARD,
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
            <Box
              className="bg-auShade"
              sx={{
                px: 3.75,
                py: 0.5,
                borderRadius: "0 0 12px 12px",
                color: AppColors.TXT_BLACK,
                fontWeight: 600,
                fontSize: FONT_SIZE.BODY2,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
              }}
            >
              {t("assets.stats.personal")}
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                textAlign: "center",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <Box
                sx={{
                  minHeight: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLoadingWallet ? (
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={28}
                    sx={{ borderRadius: 1 }}
                  />
                ) : (
                  <Typography
                    variant="h2"
                    sx={{ fontWeight: 700, color: AppColors.GOLD_PRIMARY }}
                  >
                    {formatNumber(statsSummary?.TotalROI ?? 0, 3)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                {t("assets.currency")}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: AppColors.TXT_SUB, mt: 0.5 }}
              >
                {t("assets.stats.personalIncome")}
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box
              sx={{
                textAlign: "center",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <Box
                sx={{
                  minHeight: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLoadingWallet ? (
                  <Skeleton
                    variant="rounded"
                    width={80}
                    height={28}
                    sx={{ borderRadius: 1 }}
                  />
                ) : (
                  <Typography
                    variant="h2"
                    sx={{ fontWeight: 700, color: AppColors.GOLD_PRIMARY }}
                  >
                    {formatNumber(statsSummary?.totalTeamIncome ?? 0, 3)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                {t("assets.currency")}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: AppColors.TXT_SUB, mt: 0.5 }}
              >
                {t("assets.stats.teamIncome")}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <DepositDestinationModal
        open={depositChoiceOpen}
        onClose={() => setDepositChoiceOpen(false)}
      />
    </Box>
  );
};

export default AssetsPage;
