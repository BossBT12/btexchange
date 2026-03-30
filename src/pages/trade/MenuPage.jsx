import React, { useState } from "react";
import {
  Avatar,
  Box,
  Grid,
  IconButton,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import CandlestickChartOutlinedIcon from "@mui/icons-material/CandlestickChartOutlined";
import GpsFixedOutlinedIcon from "@mui/icons-material/GpsFixedOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import { useNavigate } from "react-router-dom";
import { AppColors } from "../../constant/appColors";
import { ArrowForwardIos, CheckCircle, InsightsOutlined, Language, SupportAgent } from "@mui/icons-material";
import { copyToClipboard } from "../../utils/utils";
import useAuth from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, TRADE_NAMESPACE } from "../../i18n";

const recommendedFeatures = [
  {
    key: "deposit",
    labelKey: "menu.recommended.deposit",
    icon: <AccountBalanceWalletOutlinedIcon fontSize="medium" />,
    path: "/deposit",
  },
  {
    key: "trade",
    labelKey: "menu.recommended.trade",
    icon: <ShowChartOutlinedIcon fontSize="medium" />,
    path: "/trade",
  },
  {
    key: "language",
    labelKey: "menu.recommended.language",
    icon: <Language fontSize="medium" />,
  },
  {
    key: "copy",
    labelKey: "menu.recommended.copy",
    icon: <FileCopyOutlinedIcon fontSize="medium" />,
    path: "/coming-soon",
  },
  {
    key: "market",
    labelKey: "menu.recommended.market",
    icon: <CandlestickChartOutlinedIcon fontSize="medium" />,
    path: "/market",
  },
  {
    key: "2FA",
    labelKey: "menu.recommended.twoFA",
    icon: <GpsFixedOutlinedIcon fontSize="medium" />,
    path: "/two-factor-authentication",
  },
  {
    key: "couponCenter",
    labelKey: "menu.recommended.couponCenter",
    icon: <ConfirmationNumberOutlinedIcon fontSize="medium" />,
  },
  {
    key: "insights",
    labelKey: "menu.recommended.insights",
    icon: <InsightsOutlined fontSize="medium" />,
    path: "/market",
    state: {
      tab: "Insights",
    },
  },
];

const commonFunctions = [
  {
    key: "rewardsHub",
    labelKey: "menu.common.rewardsHub",
    icon: <CardGiftcardOutlinedIcon fontSize="medium" />,
    path: "/reward-hub/home"
  },
  {
    key: "accountSecurity",
    labelKey: "menu.common.accountSecurity",
    icon: <SecurityOutlinedIcon fontSize="medium" />,
    path: "/user/profile",
  },
  {
    key: "settings",
    labelKey: "menu.common.settings",
    icon: <SupportAgent fontSize="medium" />,
    path: "/agent-service",
  },
  {
    key: "network",
    labelKey: "menu.common.network",
    icon: <AccountTreeOutlinedIcon fontSize="medium" />,
    path: "/network/dashboard",
  },
];

const MenuTile = ({ label, icon, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
    }}
  >
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: AppColors.TXT_MAIN,
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="caption"
      sx={{
        color: AppColors.TXT_SUB,
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      {label}
    </Typography >
  </Box >
);

const MenuPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();

  const { t, i18n } = useTranslation(TRADE_NAMESPACE);

  const [copied, setCopied] = useState(false);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

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

  const handleTileClick = (path, state) => {
    if (state) {
      navigate(path, { state });
    }else{
      navigate(path);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: AppColors.TXT_MAIN,
        display: "flex",
        flexDirection: "column",
        px: 2,
        pt: 1,
        pb: 3,
      }}
    >
      {/* Profile header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <IconButton
            size="small"
            sx={{ color: AppColors.TXT_MAIN }}
            onClick={() => navigate(-1)}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography
            variant="body2"
            sx={{
              color: AppColors.TXT_SUB,
              ml: 1,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t("menu.switchAccount")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Avatar
              sx={{
                bgcolor: AppColors.HLT_LIGHT,
                color: AppColors.GOLD_PRIMARY,
                width: 44,
                height: 44,
              }}
            >

            </Avatar>
            <Box sx={{ ml: 1.5 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 0.3 }}
              >
                {userData?.fullName || "Bt-exchange"}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: AppColors.TXT_SUB }}
                >
                  UID: {userData?.UID || "1307316138"}
                </Typography>
                <IconButton
                  size="small"
                  sx={{ color: AppColors.TXT_SUB, p: 0.25 }}
                  onClick={() => copyToClipboard(userData?.UID || "1307316138", setCopied)}
                >
                  {copied ? <CheckCircle sx={{ fontSize: 14, color: "#4CAF50" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                </IconButton>
              </Box>
            </Box>
          </Box>
          <IconButton sx={{ color: AppColors.TXT_SUB }} onClick={() => navigate("/user/profile")}>
            <ArrowForwardIos sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Recommended features */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, mb: 2 }}
        >
          {t("menu.recommendedFeaturesTitle")}
        </Typography>
        <Grid container spacing={2}>
          {recommendedFeatures.map(({ key, labelKey, icon, path, state }) => (
            <Grid size={3} key={key}>
              <MenuTile
                label={t(labelKey)}
                icon={icon}
                onClick={
                  key === "language"
                    ? handleOpenLanguageMenu
                    : path
                      ? () => handleTileClick(path, state)
                      : undefined
                }
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Common functions */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, mb: 2 }}
        >
          {t("menu.commonFunctionsTitle")}
        </Typography>
        <Grid container spacing={2}>
          {commonFunctions.map(({ key, labelKey, icon, path }) => (
            <Grid size={3} key={key}>
              <MenuTile
                label={t(labelKey)}
                icon={icon}
                onClick={
                  path ? () => handleTileClick(path) : undefined
                }
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Language selection menu for MenuPage */}
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
    </Box >
  );
};

export default MenuPage;