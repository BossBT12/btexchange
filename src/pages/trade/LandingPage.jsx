import { useState, useMemo, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  CardGiftcardOutlined,
  ContentCopyOutlined,
  KeyboardArrowUpOutlined,
  Handshake,
  KeyboardArrowRight,
  GpsFixedOutlined,
  AppsOutlined,
  People,
  GroupAddOutlined,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import HeroBetbit from "../../components/heroBetBit";
import Bitcoin from "../../assets/images/transport.png";
import GiftIcon from "../../assets/images/gift.png";
import MysteryBoxIcon from "../../assets/images/mystery.png";
import FuturesIcon from "../../assets/images/futures.png";
import GlobeIcon from "../../assets/images/globe.png";
import SecurityIcon from "../../assets/images/security.png";
import TransportIcon from "../../assets/images/transport.png";
import ServiceIcon from "../../assets/images/service.webp";
import CtradeIcon from "../../assets/images/ctrade.png";
import useAuth from "../../hooks/useAuth";
import LandingPageList from "../../components/trading/LandingPageList";
import { StackCardCarousel, FeatureCardsCarousel } from "../../components/StackSlider";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "../../constant/lookUpConstant";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
// import dashboardServices from "../../services/dashboardServices";
// import BTLoader from "../../components/Loader";
// import { IoIosPeople } from "react-icons/io";

const TraderChart = memo(({ tradeValue, idx }) => {
  const chartData = useMemo(() => {
    const maxValue = Math.max(...tradeValue);
    const minValue = Math.min(...tradeValue);
    const range = maxValue - minValue || 1;
    const padding = 1;
    const chartHeight = 28;

    const points = tradeValue.map((value, i) => {
      const x = tradeValue.length > 1
        ? (i / (tradeValue.length - 1)) * 100
        : 50;
      const normalizedValue = (value - minValue) / range;
      const y = padding + chartHeight - (normalizedValue * chartHeight);
      return { x, y, value };
    });

    const linePath = points.length > 0
      ? `M ${points[0].x},${points[0].y} ${points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}`
      : '';

    const areaPath = points.length > 0
      ? `M 0,32 L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L 100,32 Z`
      : '';

    return { linePath, areaPath };
  }, [tradeValue]);

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 32" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
      <defs>
        <linearGradient id={`gradient-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={AppColors.SUCCESS} stopOpacity="0.3" />
          <stop offset="100%" stopColor={AppColors.SUCCESS} stopOpacity="0.05" />
        </linearGradient>
        <filter id={`shadow-${idx}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.6" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`glow-${idx}`}>
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={chartData.areaPath}
        fill={`url(#gradient-${idx})`}
        opacity="0.2"
      />
      <path
        d={chartData.linePath}
        fill="none"
        stroke={AppColors.SUCCESS}
        strokeWidth="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

TraderChart.displayName = 'TraderChart';

const HERO_CARD = [
  {
    id: 1,
    title: "Global Referral Rewards Event",
    description: "Invite Friends & Get 10% Trading Bonus",
    image: Bitcoin,
  },
  {
    id: 2,
    title: "Mystery Rewards Box",
    description: "Trade Smart • Win Big — 1,000,000 USDT",
    image: MysteryBoxIcon,
  },
  {
    id: 3,
    title: "USDT Deposit Bonus Event",
    description: "🎁 Get 5% Deposit Bonus on your deposit",
    image: FuturesIcon,
  },
  {
    id: 4,
    title: "Earn Hub – 1–3% Daily Earnings",
    description: "Simple System + Bonus Rewards",
    image: GiftIcon,
  }
];

const features = [
  {
    id: 1,
    icon: SecurityIcon,
    title: "Safety First",
    description:
      "Secure registration with email and phone, using advanced verification and smart contracts.",
  },
  {
    id: 2,
    icon: GlobeIcon,
    title: "Global Access",
    description: "Borderless trading, accessible worldwide.",
  },
  {
    id: 3,
    icon: CtradeIcon,
    title: "Convenient Trading",
    description:
      "Simple, quick, and beginner-friendly trading experience.",
  },
  {
    id: 4,
    icon: TransportIcon,
    title: "Fair & Transparent",
    description: "Transparent, fair trading with no hidden fees.",
  },
  {
    id: 5,
    icon: ServiceIcon,
    title: "Humanized Service",
    description:
      "Personalized support for every transaction, always available.",
  },
];

const TABS = ["Favorites", "Coin", "Gainers", "Volume"];

const FEATURE_SHORTCUTS = [
  { id: "rewards", label: "Earn Hub", icon: CardGiftcardOutlined, path: "/reward-hub/home" },
  { id: "copy", label: "Copy", icon: ContentCopyOutlined, path: "/coming-soon" },
  { id: "referral", label: "Referral", icon: Handshake, path: "/promotion/partner-rewards" },
  { id: "2fa", label: "2FA", icon: GpsFixedOutlined, path: "/two-factor-authentication" },
  { id: "more", label: "More", icon: AppsOutlined, path: "/menu" },
];

const LandingPage = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const homePageSearchValue = useSelector((state) => state.comman.homePageSearchValue);
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [isCollapse, setIsCollapse] = useState(false);
  const [collapseTimerKey, setCollapseTimerKey] = useState(0);
  const [activeTab, setActiveTab] = useState("Coin");
  // const [userStats, setUserStats] = useState(null);
  // const [isLoadingUserStats, setIsLoadingUserStats] = useState(false);

  const heroCards = useMemo(
    () =>
      HERO_CARD.map((card) => ({
        ...card,
        title: t(`landing.hero.cards.${card.id}.title`, card.title),
        description: t(`landing.hero.cards.${card.id}.description`, card.description),
      })),
    [t]
  );

  const featureCards = useMemo(
    () =>
      features.map((item) => ({
        ...item,
        title: t(`landing.features.${item.id}.title`, item.title),
        description: t(`landing.features.${item.id}.description`, item.description),
      })),
    [t]
  );

  // useEffect(() => {
  //   const fetchUserStats = async () => {
  //     try {
  //       setIsLoadingUserStats(true);
  //       const response = await dashboardServices.getUserStats();
  //       if (response?.success) {
  //         setUserStats(response?.data ?? null);
  //       }
  //     } catch (error) {
  //       console.log('error: ', error);
  //     } finally {
  //       setIsLoadingUserStats(false);
  //     }
  //   };
  //   fetchUserStats();
  // }, []);

  // Toggle hero section every 5 seconds when user is logged in.
  useEffect(() => {
    if (!isLoggedIn) {
      setTimeout(() => {
        setIsCollapse(false);
      }, 0);
      return;
    }

    const toggleTimer = setInterval(() => {
      setIsCollapse((prev) => !prev);
    }, 5000);

    return () => {
      clearInterval(toggleTimer);
    };
  }, [isLoggedIn, collapseTimerKey]);

  return (
    <Box sx={{ pb: isLoggedIn ? 12 : 16, position: "relative", bgcolor: AppColors.BG_MAIN }}>
      {isLoggedIn && (
        <IconButton
          sx={{ position: "absolute", top: 10, right: 12 }}
          onClick={() => {
            setIsCollapse((prev) => !prev);
            setCollapseTimerKey((prev) => prev + 1);
          }}
        >
          <KeyboardArrowUpOutlined sx={{ fontSize: 20, transform: isCollapse && "rotate(180deg)" }} />
        </IconButton>
      )}
      <Collapse in={!isCollapse} mountOnEnter unmountOnExit>
        <HeroBetbit />
      </Collapse>

      <Collapse in={isCollapse} mountOnEnter unmountOnExit>
        <Box sx={{
          mx: SPACING.LG,
          my: SPACING.MD,
          borderRadius: BORDER_RADIUS.XS,
          border: `1px solid ${AppColors.BORDER_MAIN}`,
          bgcolor: AppColors.BG_MAIN,
          p: SPACING.MD,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: AppColors.TXT_MAIN,
                textAlign: "start",
              }}
            >
              {t("landing.depositBanner.title", "Deposit 100 USDT")}
            </Typography>
            <Typography
              sx={{
                color: AppColors.TXT_MAIN,
                textAlign: "start",
                mb: 0.5,
              }}
            >
              <span style={{ fontWeight: 400, fontSize: FONT_SIZE.BODY }}>
                {t("landing.depositBanner.subtitlePrefix", "Get up to ")}
              </span>
              <span style={{ fontWeight: 600, color: AppColors.GOLD_PRIMARY, fontSize: FONT_SIZE.TITLE }}>
                {t("landing.depositBanner.subtitleHighlight", "50 USDT Bonus")}
              </span>
            </Typography>
          </Box>
          <Button
            className="btn-primary"
            onClick={() => navigate("/deposit")}
            sx={{
              py: 0.75,
              px: SPACING.MD,
              borderRadius: 20,
              color: "#000",
              textTransform: "none",
            }}
          >
            {t("landing.depositBanner.cta", "Deposit Now")}
          </Button>
        </Box>
      </Collapse>

      {isLoggedIn && (
        <Collapse in={!isCollapse} mountOnEnter unmountOnExit>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 2, px: 2 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 600,
                color: AppColors.TXT_MAIN,
                textAlign: "center",
              }}
            >
              {t("landing.depositBanner.title", "Deposit 100 USDT")}
            </Typography>
            <Typography
              sx={{
                color: AppColors.TXT_MAIN,
                textAlign: "center",
                mb: 0.5,
              }}
            >
              <span style={{ fontWeight: 400, fontSize: "1rem" }}>
                {t("landing.depositBanner.subtitlePrefix", "Get up to ")}
              </span>
              <span style={{ fontWeight: 600, color: AppColors.GOLD_PRIMARY, fontSize: "1.5rem" }}>
                {t("landing.depositBanner.subtitleHighlight", "50 USDT Bonus")}
              </span>
            </Typography>
            <Button
              fullWidth
              className="btn-primary"
              onClick={() => navigate("/deposit")}
              startIcon={<img src={GiftIcon} alt="" style={{ width: 20, height: 20 }} />}
              sx={{
                py: 0.75,
                borderRadius: 20,
                color: "#000",
                textTransform: "none",
              }}
            >
              {t("landing.depositBanner.cta", "Deposit Now")}
            </Button>
          </Box>
        </Collapse>
      )}

      {!isLoggedIn && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, py: 2, px: 2 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 600,
              color: AppColors.TXT_MAIN,
            }}
          >
            {t("landing.registerTitle", "Register to Claim")}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 400,
              color: AppColors.TXT_MAIN,
            }}
          >
            {t("landing.registerSubtitle", "New User Rewards!")}
          </Typography>
        </Box>
      )}
      {/* Feature shortcuts - horizontal scroll (when logged in) */}
      {isLoggedIn && (
        <Box sx={{ px: 2, mb: 2, overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              overflowX: "auto",
              py: 1,
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {FEATURE_SHORTCUTS.map((item) => (
              <Box
                key={item.id}
                onClick={() => item.path && navigate(item.path)}
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.25,
                  cursor: "pointer",
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: AppColors.BG_SECONDARY,
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <item.icon sx={{ color: AppColors.TXT_MAIN, fontSize: 24 }} />
                </Box>
                <Typography
                  sx={{
                    color: AppColors.TXT_MAIN,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  {t(`landing.featureShortcuts.${item.id}`, item.label)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {!isLoggedIn && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            px: 2,
            py: 1,
            gap: 1.5,
            mb: 2,
          }}
        >
          <Button
            fullWidth
            onClick={() => navigate("/login")}
            sx={{
              py: 1,
              borderRadius: 20,
              backgroundColor: AppColors.BG_SECONDARY,
              color: AppColors.TXT_MAIN,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#2a2a2a" },
            }}
          >
            {t("landing.auth.login", "Log in")}
          </Button>
          <Button
            fullWidth
            className="btn-primary"
            onClick={() => navigate("/signup")}
            sx={{
              py: 1,
              borderRadius: 20,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {t("landing.auth.signUp", "Sign Up")}
          </Button>
        </Box>
      )}

      <StackCardCarousel cards={heroCards} />

      {/* Market tabs: Favorites / Hot / Gainers / Volume */}
      <Box sx={{ display: "flex", gap: 2, px: 2 }}>
        {TABS.map((tab) => (
          <Typography
            variant="body1"
            key={tab}
            onClick={() => setActiveTab(tab)}
            sx={{
              color: activeTab === tab ? AppColors.TXT_MAIN : AppColors.TXT_SUB,
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              pb: 0.5,
              borderBottom: activeTab === tab ? `2px solid ${AppColors.GOLD_PRIMARY}` : "2px solid transparent",
            }}
          >
            {t(`landing.tabs.${tab.toLowerCase()}`, tab)}
          </Typography>
        ))}
      </Box>
      {/* Trending / Hot list */}
      <LandingPageList limit={10} searchValue={homePageSearchValue} activeTab={activeTab} />

      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <Button
          onClick={() => navigate("/market/list")}
          endIcon={<KeyboardArrowRight sx={{ fontSize: 16 }} />}
          sx={{
            color: AppColors.TXT_MAIN,
            textTransform: "none",
            fontWeight: 600,
            fontSize: FONT_SIZE.BODY2,
            "&:hover": { bgcolor: "rgba(212, 168, 95, 0.08)" },
          }}
        >
          {t("landing.viewAll", "View All")}
        </Button>
      </Box>
      {/* Trusted Exchange Features carousel */}
      <FeatureCardsCarousel cards={featureCards} />

      {/* Super Snipe Card */}
      {/* <Box
        sx={{
          mx: SPACING.LG,
          mb: 4,
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${AppColors.GOLD_PRIMARY}`,
          bgcolor: "#000",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: AppColors.TXT_MAIN,
              }}
            >
              {t("landing.community.title", "Global User Community")}
            </Typography>
            <Typography variant="body2" sx={{ color: "#CCCCCC" }}>
              {t(
                "landing.community.desc1",
                "Join a growing global community of smart traders"
              )}
            </Typography>
            <Typography variant="body2" sx={{ color: "#CCCCCC" }}>
              {t("landing.community.desc2", "Experience powerful, modern trading")}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 100,
              height: 80,
              flexShrink: 0,
              position: "relative",
              top: -12,
              right: -8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={0} height={0} aria-hidden="true">
              <defs>
                <linearGradient id="landingIconGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="8%" stopColor="#5d4a1f" />
                  <stop offset="25%" stopColor="#5d4a1f" />
                  <stop offset="50%" stopColor="#FDB931" />
                  <stop offset="100%" stopColor="#5d4a1f" />
                </linearGradient>
              </defs>
            </svg>
            <IoIosPeople 
              style={{ fill: "url(#landingIconGoldGrad)", width: 75, height: 75 }}
              aria-hidden
            />
          </Box>
        </Box>
        {isLoadingUserStats ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <BTLoader />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
            }}
          >
            {[
              {
                labelKey: "landing.community.stats.totalUsers",
                defaultLabel: "Total Users",
                change: userStats?.totalUsers ?? "0",
                color: "linear-gradient(135deg, #6B4E71 0%, #4A3D4F 100%)",
                icon: <People sx={{ fontSize: 16 }} />,
              },
              {
                labelKey: "landing.community.stats.newUsers",
                defaultLabel: "New Users",
                change: userStats?.newUsers ?? "0",
                color: "linear-gradient(135deg, #00cd76 0%, #008f52 100%)",
                icon: <GroupAddOutlined sx={{ fontSize: 16 }} />,
              },
            ].map((token) => (
              <Box
                key={token.labelKey}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  py: 0.25,
                  px: 1,
                  borderRadius: 10,
                  border: `1px solid ${AppColors.BORDER_MAIN}`,
                }}
              >
                <Box
                  sx={{
                    borderRadius: "50%",
                    background: token.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 0.5,
                  }}
                >
                  {token.icon}
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: AppColors.TXT_MAIN,
                      fontWeight: 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t(token.labelKey, token.defaultLabel)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: AppColors.SUCCESS,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {token.change}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box> */}
    </Box>
  );
};

export default LandingPage;
