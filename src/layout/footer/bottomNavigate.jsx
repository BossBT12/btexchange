import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Typography,
  Button,
  Container,
} from "@mui/material";
import {
  HomeOutlined,
  CandlestickChartOutlined,
  MonetizationOnOutlined,
  AccountBalanceWalletOutlined,
  CandlestickChart,
  Home,
  MonetizationOn,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import useAuth from "../../hooks/useAuth";
import GiftIcon from "../../assets/images/gift.png";
import btLogo from "../../assets/images/btLogo.webp";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

// import btLogo from "../../assets/svg/Bebit.svg";

const FuturesIcon = ({ active }) => (
  <Box
    sx={{
      width: 48,
      height: 24,
      position: "relative",
      overflow: "visible",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    }}
  >
    <Box
      sx={{
        borderRadius: "50%",
        position: "absolute",
        top: -38,
        left: "50%",
        transform: "translateX(-50%)",
        width: 52,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <img src={btLogo} alt="Trade" style={{ width: 56, height: 56, objectFit: "contain" }} />
    </Box>
  </Box>
);

const NAV_ITEMS = [
  { key: "home", defaultLabel: "Home", path: "/", icon: HomeOutlined, activeIcon: Home },
  { key: "market", defaultLabel: "Market", path: "/market", icon: CandlestickChartOutlined, activeIcon: CandlestickChart },
  { key: "trade", defaultLabel: "Trade", path: "/trade", icon: "futures" },
  { key: "promotion", defaultLabel: "Promotion", path: "/promotion", icon: MonetizationOnOutlined, activeIcon: MonetizationOn },
  { key: "asset", defaultLabel: "Asset", path: "/trade/asset", icon: AccountBalanceWalletOutlined, activeIcon: AccountBalanceWallet },
];

const BottomNavigate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation(TRADE_NAMESPACE);

  const getValue = () => {
    const exactIndex = NAV_ITEMS.findIndex((item) => item.path === pathname);
    if (exactIndex >= 0) return exactIndex;
    if (pathname.startsWith("/trade")) return 2;
    return 0;
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: AppColors.BG_MAIN,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 1000,
      }}
    >
      {!isLoggedIn && (
        <Box
          sx={{
            position: "fixed",
            bottom: 56,
            left: 0,
            right: 0,
            zIndex: 999,
          }}
        >
          <Box
            sx={{
              py: 1.25,
              borderRadius: "15px 15px 0 0",
              backgroundColor: AppColors.BG_SECONDARY,
              borderTop: `1px solid ${AppColors.TXT_SUB}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <Container maxWidth="md" sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img src={GiftIcon} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </Box>
              <Typography
                sx={{
                  flex: 1,
                  color: AppColors.TXT_MAIN,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}
              >
                {t(
                  "bottomNav.signupBannerText",
                  "Sign Up to claim your new user rewards now!"
                )}
              </Typography>
              <Button
                className="btn-primary"
                onClick={() => navigate("/signup")}
                sx={{
                  flexShrink: 0,
                  px: 2,
                  py: 0.75,
                  fontSize: "0.8125rem",
                  textTransform: "none",
                  borderRadius: 10,
                }}
              >
                {t("bottomNav.signupCta", "Sign Up")}
              </Button>
            </Container>
          </Box>
        </Box>
      )}
      <BottomNavigation
        className="relative"
        value={getValue()}
        onChange={(_, newValue) => {
          const item = NAV_ITEMS[newValue];
          if (item?.path) navigate(item.path);
        }}
        showLabels
        sx={{
          transform: "none",
          backgroundColor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            color: AppColors.TXT_SUB,
            minWidth: 56,
            paddingTop: 0.5,
          },
          "& .MuiBottomNavigationAction-root.Mui-selected": {
            color: AppColors.GOLD_PRIMARY,
          },
          "& .MuiBottomNavigationAction-root.Mui-selected .MuiBottomNavigationAction-icon": {
            transform: "none",
          },
          "& .MuiBottomNavigationAction-root.Mui-selected .MuiBottomNavigationAction-label": {
            fontSize: "0.6875rem",
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.6875rem",
          },
          "& .MuiBottomNavigationAction-icon": {
            overflow: "visible",
            transform: "none",
          },
        }}
      >
        {NAV_ITEMS.map((item, idx) => {
          const isSelected = getValue() === idx;
          return (
            <BottomNavigationAction
              key={item.key}
              label={t(`bottomNav.${item.key}`, item.defaultLabel)}
              icon={
                item.icon === "futures" ? (
                  <FuturesIcon active={pathname === item.path || pathname.startsWith("/trade")} />
                ) : (
                  isSelected ? (
                    <item.activeIcon sx={{ fontSize: 24 }} />
                  ) : (
                    <item.icon
                      sx={{
                        fontSize: 24,
                      }}
                    />
                  )
                )
              }
            />
          );
        })}
      </BottomNavigation>
    </Box>
  );
};

export default BottomNavigate;
