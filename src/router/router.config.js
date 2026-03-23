import asyncComponent from "../utils/asyncComponent.jsx";

export const publicRouters = [
  {
    path: "/",
    component: asyncComponent(() => import("../pages/trade/LandingPage.jsx")),
    isHeader: true,
    isBottomNav: true,
  },
  {
    path: "/trade",
    component: asyncComponent(() => import("../pages/trade/TradePage.jsx")),
  },
  {
    path: "/trade/guide",
    component: asyncComponent(() => import("../pages/trade/TradeGuidePage.jsx")),
  },
  {
    path: "/market",
    component: asyncComponent(() => import("../pages/trade/MarketPage.jsx")),
    isBottomNav: true,
  },
  {
    path: "/market/list",
    component: asyncComponent(() => import("../pages/trade/MarketListPage.jsx")),
  },
  {
    path: "/agent-service",
    component: asyncComponent(() => import("../pages/trade/promotion/AgentServicePage.jsx")),
  },
  {
    path: "/coming-soon",
    component: asyncComponent(() => import("../pages/ComingSoon.jsx")),
  },
];

export const authRouters = [
  {
    path: "/login",
    component: asyncComponent(() => import("../pages/auth/Login.jsx")),
  },
  {
    path: "/signup",
    component: asyncComponent(() => import("../pages/auth/Signup.jsx")),
  },
  {
    path: "/forgot-password",
    component: asyncComponent(() => import("../pages/auth/ForgotPassword.jsx")),
  },
];

export const protectedRouters = [
  {
    path: "/deposit",
    component: asyncComponent(() => import("../pages/trade/DepositPage.jsx")),
  },
  {
    path: "/verify-deposit",
    component: asyncComponent(() => import("../pages/trade/VerifyDeposit.jsx")),
  },
  {
    path: "/deposit-history",
    component: asyncComponent(() => import("../pages/trade/DepositHistoryPage.jsx")),
  },
  {
    path: "/withdraw",
    component: asyncComponent(() => import("../pages/trade/WithdrawPage.jsx")),
  },
  {
    path: "/history/totalDeposit",
    component: asyncComponent(() => import("../pages/trade/DepositHistoryPage.jsx")),
  },
  {
    path: "/menu",
    component: asyncComponent(() => import("../pages/trade/MenuPage.jsx")),
  },
  {
    path: "/user/profile",
    component: asyncComponent(() => import("../pages/trade/Profile.jsx")),
  },
  {
    path: "/change-password",
    component: asyncComponent(() => import("../pages/auth/ChangePassword.jsx")),
  },
  {
    path: "/trade/asset",
    component: asyncComponent(() => import("../pages/trade/AssetsPage.jsx")),
    isBottomNav: true,
  },
  {
    path: "/trade-history",
    component: asyncComponent(() => import("../pages/trade/GameHistoryPage.jsx")),
  },
  {
    path: "/promotion",
    component: asyncComponent(() => import("../pages/trade/PromotionPage.jsx")),
    isBottomNav: true,
  },
  {
    path: "/promotion/partner-rewards",
    component: asyncComponent(() => import("../pages/trade/promotion/PartnerRewardsPage.jsx")),
  },
  {
    path: "/promotion/subordinate-data",
    component: asyncComponent(() => import("../pages/trade/promotion/SubordinateData.jsx")),
  },
  {
    path: "/promotion/rules",
    component: asyncComponent(() => import("../pages/trade/promotion/RulesPage.jsx")),
  },
  {
    path: "/promotion/commission-detail",
    component: asyncComponent(() => import("../pages/trade/promotion/CommissionDetailPage.jsx")),
  },
  {
    path: "/promotion/rebate-ratio",
    component: asyncComponent(() => import("../pages/trade/promotion/RebateRatioPage.jsx")),
  },
  {
    path: "/promotion/agent-service",
    component: asyncComponent(() => import("../pages/trade/promotion/AgentServicePage.jsx")),
  },
  {
    path: "/feedback",
    component: asyncComponent(() => import("../pages/trade/FeedbackPage.jsx")),
  },
  {
    path: "/transaction-history",
    component: asyncComponent(() => import("../pages/trade/TransactionHistoryPage.jsx")),
  },
  {
    path: "/two-factor-authentication",
    component: asyncComponent(() => import("../pages/trade/TwoFactorAuthPage.jsx")),
  },
  {
    path: "/about",
    component: asyncComponent(() => import("../pages/trade/AboutUsPage.jsx")),
  },
  {
    path: "/about/privacy-policy",
    component: asyncComponent(() => import("../pages/trade/AboutDocumentPage.jsx")),
  },
  {
    path: "/about/risk-disclosure",
    component: asyncComponent(() => import("../pages/trade/AboutDocumentPage.jsx")),
  },
  {
    path: "/announcement",
    component: asyncComponent(() => import("../pages/trade/AnnouncementPage.jsx")),
  },
  {
    path: "/notifications",
    component: asyncComponent(() => import("../pages/trade/NotificationsPage.jsx")),
  },
  {
    path: "/copy-trading",
    component: asyncComponent(() => import("../pages/trade/CopeirPage.jsx")),
  },
  {
    path: "/copy-trading/setting",
    component: asyncComponent(() => import("../pages/trade/CopyTradeSetting.jsx")),
  },
];

export const protectedRouters2 = [
  {
    path: "/reward-hub/home",
    component: asyncComponent(() => import("../pages/rewardHub/HomePage.jsx")),
    isBottomNav: true,
  },
  {
    path: "/reward-hub/team",
    component: asyncComponent(() => import("../pages/rewardHub/TeamPage.jsx")),
    isBottomNav: true,
  },
  {
    path: "/reward-hub/reporting",
    component: asyncComponent(() => import("../pages/rewardHub/ReportingPage.jsx")),
    isBottomNav: true,
  },
  {
    path: "/reward-hub/profile",
    component: asyncComponent(() => import("../pages/rewardHub/Profile.jsx")),
    isBottomNav: true,
  },
  {
    path: "/reward-hub/deposit",
    component: asyncComponent(() => import("../pages/rewardHub/DepositPage.jsx")),
  },
  {
    path: "/reward-hub/verify-deposit",
    component: asyncComponent(() => import("../pages/rewardHub/VerifyDeposit.jsx")),
  },
  {
    path: "/reward-hub/withdraw",
    component: asyncComponent(() => import("../pages/rewardHub/WithdrawPage.jsx")),
  },
  {
    path: "/reward-hub/transaction-history",
    component: asyncComponent(() => import("../pages/rewardHub/TransactionHistoryPage.jsx")),
  },
  {
    path: "/reward-hub/two-factor-authentication",
    component: asyncComponent(() => import("../pages/rewardHub/TwoFactorAuthPage.jsx")),
  },
  {
    path: "/reward-hub/wallet",
    component: asyncComponent(() => import("../pages/rewardHub/WalletPage.jsx")),
    isBottomNav: true,
  },
  {
    path: "/reward-hub/future-copy",
    component: asyncComponent(() => import("../pages/rewardHub/CopeirPage.jsx")),
  },
  {
    path: "/reward-hub/copy-trading-setting",
    component: asyncComponent(() => import("../pages/rewardHub/CopyTradingSettingPage.jsx")),
  },
  {
    path: "/reward-hub/capital-withdraw",
    component: asyncComponent(() => import("../pages/rewardHub/CapitalWithdrawPage.jsx")),
  },
];

export const routers = [...publicRouters, ...authRouters, ...protectedRouters, ...protectedRouters2];
