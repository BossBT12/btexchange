import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box
} from "@mui/material";
import {
  AccountBalanceWalletOutlined,
  DashboardOutlined,
  PersonOutlined,
  TrendingUpOutlined,
  Dashboard,
  AccountBalanceWallet,
  TrendingUp,
  Person,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const NAV_ITEMS = [
  { key: "home", path: "/reward-hub/home", icon: DashboardOutlined, activeIcon: Dashboard },
  { key: "team", path: "/reward-hub/team", icon: PersonOutlined, activeIcon: Person },
  { key: "reporting", path: "/reward-hub/reporting", icon: TrendingUpOutlined, activeIcon: TrendingUp },
  { key: "wallet", path: "/reward-hub/wallet", icon: AccountBalanceWalletOutlined, activeIcon: AccountBalanceWallet },
];

const DEFAULT_LABELS = { home: "Home", team: "Team", reporting: "Reporting", wallet: "Wallet" };

const BottomNavigateMlm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { t } = useTranslation(TRADE_NAMESPACE);

  const getValue = () => {
    const exactIndex = NAV_ITEMS.findIndex((item) => item.path === pathname);
    if (exactIndex >= 0) return exactIndex;
    return 0;
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 1000,
        bgcolor: AppColors.BG_MAIN,
      }}
    >
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
            fontSize: "0.6875rem",
            color: AppColors.GOLD_PRIMARY,
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.6875rem",
          },
          "& .MuiBottomNavigationAction-icon": {
            overflow: "visible",
          },
        }}
      >
        {NAV_ITEMS.map((item, idx) => {
          const isSelected = getValue() === idx;
          return (
            <BottomNavigationAction
              key={item.key}
              label={t(`bottomNavMlm.${item.key}`, DEFAULT_LABELS[item.key])}
              icon={
                isSelected ? (
                  <item.activeIcon
                    sx={{
                      fontSize: 24,
                    }}
                  />
                ) : (
                  <item.icon
                    sx={{
                      fontSize: 24,
                    }}
                  />
                )
              }
            />
          )
        })}
      </BottomNavigation>
    </Box>
  );
};

export default BottomNavigateMlm;
