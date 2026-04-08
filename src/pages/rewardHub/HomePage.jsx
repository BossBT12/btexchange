import React, { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Skeleton,
  Avatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  NotificationsOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  Add as AddIcon,
  Remove as RemoveIcon,
  BoltOutlined,
  GroupOutlined,
  ChevronRight,
  HomeOutlined,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { BORDER_RADIUS, SPACING } from "../../constant/lookUpConstant";
import walletService from "../../services/secondGameServices/walletService";
import cryptoMarketService from "../../services/cryptoMarketService";
import BitcoinImg from "../../assets/images/bitcoin.png";
import EthImg from "../../assets/images/ethDep.png";
import BinImg from "../../assets/images/binDep.png";
import ReferralImg from "../../assets/images/service.webp";
import useAuth from "../../hooks/useAuth";
const InvitePosterModal = React.lazy(() => import("../../components/InvitePosterModal"));
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const LOCAL_ICONS = { BTC: BitcoinImg, ETH: EthImg, BNB: BinImg };

const formatNumber = (value) => {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
};

const QUICK_ACTIONS = [
  { id: "main", label: "Main", icon: HomeOutlined, path: "/" },
  { id: "deposit", label: "Deposit", icon: AddIcon, path: "/reward-hub/deposit" },
  { id: "withdraw", label: "Withdraw", icon: RemoveIcon, path: "/reward-hub/withdraw" },
  { id: "trade", label: "Capt WD", icon: BoltOutlined, path: "/reward-hub/capital-withdraw" },
  { id: "referral", label: "Referral", icon: GroupOutlined },
];

// Sharp trading-style sparkline paths (rising) – different zigzag per card
const SPARKLINE_RISING = [
  "M0,11 L5,9 L10,12 L15,7 L20,8 L25,5 L30,4 L35,3 L40,2",
  "M0,12 L8,10 L12,11 L18,8 L24,6 L28,12 L34,4 L40,2",
  "M0,10 L6,12 L12,1 L18,9 L24,5 L30,6 L36,3 L40,2",
  "M0,4 L10,10 L16,11 L22,7 L28,12 L34,5 L40,1",
  "M0,12 L4,10 L8,11 L14,7 L20,6 L26,5 L32,6 L38,1 L40,2",
];

// Sharp trading-style sparkline paths (falling) – different zigzag per card
const SPARKLINE_FALLING = [
  "M0,1 L5,10 L10,5 L15,6 L20,2 L25,2 L30,8 L35,10 L40,14",
  "M0,2 L8,4 L12,3 L18,8 L24,2 L28,7 L34,10 L40,14",
  "M0,3 L6,1 L12,6 L18,2 L24,8 L30,6 L36,8 L40,14",
  "M0,1 L10,0 L16,5 L22,4 L28,10 L34,6 L40,14",
  "M0,3 L4,5 L8,4 L14,7 L20,1 L26,5 L32,3 L38,11 L40,14",
];

const HomePage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [walletStats, setWalletStats] = useState(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [cryptoCards, setCryptoCards] = useState([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);
  const [cryptoError, setCryptoError] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [posterModalOpen, setPosterModalOpen] = useState(false);
  const [todayIncome, setTodayIncome] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoadingWallet(true);
      const [response1, response2] = await Promise.all([
        walletService.getWalletBalanceAndStats(),
        walletService.getTodayIncome(),
      ]);
      setWalletStats(response1?.data ?? null);
      setTodayIncome(response2?.data ?? null);
    } catch (error) {
      console.log('error: ', error);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const fetchCryptoMarkets = async () => {
    try {
      setCryptoLoading(true);
      setCryptoError("");
      const coins = await cryptoMarketService.getTopCoins(5);
      setCryptoCards(coins);
      setSelectedCrypto((prev) => {
        if (!prev && coins.length) return coins[0];
        const updated = coins.find((c) => c.symbol === prev?.symbol);
        return updated ?? (coins.length ? coins[0] : null);
      });
    } catch (err) {
      setCryptoError(err?.message || "LOAD_FAILED");
      setCryptoCards([]);
    } finally {
      setCryptoLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchCryptoMarkets();
    const interval = setInterval(fetchCryptoMarkets, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const wallet = walletStats?.wallet ?? {};
  const user = walletStats?.user ?? {};
  const totalAssets = Number((wallet?.WITHDRAWABLE_BALANCE + wallet?.CAPITAL_BALANCE) || 0);
  const walletAddress = userData?.UID.substring(0, 6) + "..." + userData?.UID.substring(userData?.UID.length - 4);

  return (
    <Box
      sx={{
        color: AppColors.TXT_MAIN,
        pb: 14,
      }}
    >
      {/* Top Nav Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: SPACING.MD,
          gap: 0.5,
          position: "sticky",
          top: 0,
          zIndex: 1000,
          bgcolor: AppColors.BG_MAIN,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <IconButton
          onClick={() => navigate("/reward-hub/profile")}
          sx={{
            p: 0,
            m: 0,
          }}
        >
          <Avatar
            sx={{
              bgcolor: AppColors.HLT_LIGHT,
              color: AppColors.GOLD_PRIMARY,
              width: 38,
              height: 38,
            }}
          >

          </Avatar>
        </IconButton>

        <TextField
          variant="outlined"
          placeholder={t("rewardHub.home.searchPlaceholder", "Search")}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: AppColors.TXT_SUB, fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 20,
              bgcolor: AppColors.BG_SECONDARY,
              border: "1px solid rgba(255,255,255,0.08)",
              "& fieldset": { border: "none" },
              "& input": { py: 1, color: AppColors.TXT_MAIN },
            },
          }}
        />
        <IconButton sx={{ color: AppColors.TXT_SUB }} onClick={() => navigate("/notifications")}>
          <NotificationsOutlined sx={{ fontSize: 22 }} />
        </IconButton>
        <Chip
          label={walletAddress}
          size="small"
          sx={{
            bgcolor: `${AppColors.GOLD_PRIMARY}25`,
            color: AppColors.GOLD_PRIMARY,
            fontWeight: 600,
            fontSize: "0.7rem",
            border: `1px solid ${AppColors.GOLD_PRIMARY}50`,
          }}
        />
      </Box>
      {/* Total Assets Section */}
      <Box sx={{ px: SPACING.MD, pt: SPACING.SM }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ color: AppColors.TXT_SUB, fontSize: "0.875rem" }}>
              {t("rewardHub.home.totalAssetsLabel", "Total Assets(USDT)")}
            </Typography>
            <IconButton
              size="small"
              sx={{ color: AppColors.TXT_SUB, p: 0.25 }}
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? (
                <VisibilityOutlined sx={{ fontSize: 18 }} />
              ) : (
                <VisibilityOffOutlined sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Box>
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
            mb: 1,
          }}
        >
          {balanceVisible
            ? (isLoadingWallet
              ? t("rewardHub.home.loading", "Loading...")
              : formatNumber(totalAssets))
            : "****"}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Typography sx={{ color: AppColors.GOLD_PRIMARY, fontWeight: 600, fontSize: "0.9rem" }}>
            {t(
              "rewardHub.home.totalIncomeLabel",
              "Today Income: ${{value}}",
              { value: formatNumber(todayIncome?.totalTodayIncome ?? 0) }
            )}
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate("/reward-hub/deposit")}
            sx={{
              bgcolor: AppColors.TXT_MAIN,
              color: AppColors.BG_MAIN,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: BORDER_RADIUS.LG,
              px: 2,
              py: 0.75,
              "&:hover": { bgcolor: AppColors.TXT_SUB },
            }}
          >
            {t("rewardHub.home.depositCta", "Deposit")}
          </Button>
        </Box>
      </Box>

      {/* Quick Action Buttons */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          px: SPACING.MD,
          py: SPACING.LG,
          overflowX: "auto",
        }}
      >
        {QUICK_ACTIONS.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              cursor: "pointer",
              flexShrink: 0,
              position: "relative",
            }}
            onClick={() => item.id === "referral" ? setPosterModalOpen(true) : item.path && navigate(item.path)}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: BORDER_RADIUS.XS,
                bgcolor: item.id === "vault" ? `${AppColors.GOLD_PRIMARY}30` : AppColors.BG_SECONDARY,
                border: item.id === "vault" ? `2px solid ${AppColors.GOLD_PRIMARY}` : "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.id === "vault" ? AppColors.GOLD_PRIMARY : AppColors.TXT_MAIN,
              }}
            >
              <item.icon sx={{ fontSize: 24 }} />
            </Box>
            {item.hot && (
              <Box
                sx={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  bgcolor: AppColors.ERROR,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                }}
              >
                {t("rewardHub.home.quickActions.hot", "HOT")}
              </Box>
            )}
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}>
              {t(`rewardHub.home.quickActions.${item.id}`, item.label)}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: SPACING.SM, minWidth: 0, px: SPACING.MD, mb: SPACING.LG }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            bgcolor: AppColors.BG_CARD,
            borderRadius: BORDER_RADIUS.XS,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
            cursor: "pointer",
            transition: "all 0.25s ease",
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            "&:hover": {
              borderColor: `${AppColors.GOLD_PRIMARY}40`,
              bgcolor: AppColors.BG_SECONDARY,
              boxShadow: `0 8px 24px rgba(212, 168, 95, 0.12)`,
              transform: "translateY(-2px)",
              "& > :last-of-type": { color: AppColors.GOLD_PRIMARY },
            },
          }}
          onClick={() => setPosterModalOpen(true)}
        >
          <Box
            sx={{
              width: 100,
              minWidth: 100,
              bgcolor: `${AppColors.GOLD_PRIMARY}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1.5,
              borderRight: `1px solid rgba(255,255,255,0.06)`,
            }}
          >
            <Box
              component="img"
              src={ReferralImg}
              alt={t("rewardHub.home.referralCard.alt", "Referral")}
              sx={{ width: "100%", height: "auto", maxHeight: 64, objectFit: "contain" }}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: SPACING.MD,
              py: SPACING.SM,
              minWidth: 0,
            }}
          >
            <Typography sx={{ color: AppColors.TXT_MAIN, fontWeight: 600, fontSize: "0.95rem", mb: 0.25 }}>
              {t("rewardHub.home.referralCard.title", "Referral Program")}
            </Typography>
            <Typography sx={{ color: AppColors.GOLD_PRIMARY, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.03em" }}>
              {t("rewardHub.home.referralCard.subtitle", "Earn FUNN")}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1,
              color: AppColors.TXT_SUB,
            }}
          >
            <ChevronRight sx={{ fontSize: 24 }} />
          </Box>
        </Box>
      </Box>

      {/* Crypto Price Cards - live data from CoinGecko */}
      <Box sx={{ px: SPACING.MD, mb: SPACING.LG }}>
        <Typography variant="h6" sx={{ color: AppColors.TXT_MAIN, fontWeight: 600, mb: SPACING.SM }}>
          {t("rewardHub.home.marketsTitle", "Markets")}
        </Typography>
        {cryptoError && (
          <Typography sx={{ color: AppColors.ERROR, fontSize: "0.875rem", mb: 1 }}>
            {cryptoError === "LOAD_FAILED"
              ? t("rewardHub.home.marketError", "Failed to load market data")
              : cryptoError}
          </Typography>
        )}
        <Box
          sx={{
            display: "flex",
            gap: SPACING.SM,
            overflowX: "auto",
            scrollbarWidth: "none",
            pb: 0.5,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {cryptoLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                width={140}
                height={120}
                sx={{ flexShrink: 0, bgcolor: "rgba(255,255,255,0.1)", borderRadius: BORDER_RADIUS.XS }}
              />
            ))
          ) : (
            cryptoCards.map((crypto, cardIndex) => {
              const iconSrc = LOCAL_ICONS[crypto.symbol] ?? crypto.icon;
              const isUp = (crypto.change ?? 0) >= 0;
              const pathSet = isUp ? SPARKLINE_RISING : SPARKLINE_FALLING;
              const sparklineD = pathSet[cardIndex % pathSet.length];
              return (
                <Box
                  key={crypto.symbol}
                  sx={{
                    minWidth: 140,
                    bgcolor: AppColors.BG_CARD,
                    borderRadius: BORDER_RADIUS.XS,
                    border: selectedCrypto?.symbol === crypto.symbol ? `1px solid ${AppColors.GOLD_PRIMARY}` : "1px solid rgba(255,255,255,0.08)",
                    p: SPACING.MD,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { borderColor: `${AppColors.GOLD_PRIMARY}40` },
                  }}
                  onClick={() => setSelectedCrypto(selectedCrypto?.symbol === crypto.symbol ? null : crypto)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                    <Box
                      component="img"
                      src={iconSrc}
                      alt={crypto.symbol}
                      sx={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ color: AppColors.TXT_MAIN, fontWeight: 700 }}>
                        {crypto.symbol}
                      </Typography>
                      <Typography variant="body1" sx={{ color: AppColors.TXT_SUB }}>
                        {crypto.type}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ color: AppColors.TXT_MAIN, fontWeight: 700 }}>
                    ${Number(crypto.price).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.4, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isUp ? AppColors.SUCCESS : AppColors.ERROR,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {isUp ? "▲" : "▼"} {crypto.change != null ? crypto.change.toFixed(2) : "0"}%
                    </Typography>
                    <Box
                      component="svg"
                      viewBox="0 0 40 16"
                      preserveAspectRatio="none"
                      height={16}
                      sx={{ flex: 1, minWidth: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id={`sparklineGrad-${crypto.symbol}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0" stopColor={isUp ? AppColors.SUCCESS : AppColors.ERROR} stopOpacity={0.35} />
                          <stop offset="1" stopColor={isUp ? AppColors.SUCCESS : AppColors.ERROR} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <path
                        d={`${sparklineD} L40,16 L0,16 Z`}
                        fill={`url(#sparklineGrad-${crypto.symbol})`}
                      />
                      <path
                        d={sparklineD}
                        fill="none"
                        stroke={isUp ? AppColors.SUCCESS : AppColors.ERROR}
                        strokeWidth="1.5"
                        strokeLinecap="butt"
                        strokeLinejoin="miter"
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* Selected Market Coin - Full Detail */}
        {selectedCrypto && (
          <Box
            sx={{
              mt: SPACING.LG,
              p: SPACING.MD,
              borderRadius: BORDER_RADIUS.XS,
              bgcolor: AppColors.BG_CARD,
              border: `1px solid ${AppColors.GOLD_PRIMARY}30`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  component="img"
                  src={LOCAL_ICONS[selectedCrypto.symbol] ?? selectedCrypto.icon}
                  alt={selectedCrypto.symbol}
                  sx={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                />
                <Box>
                  <Typography sx={{ color: AppColors.TXT_MAIN, fontWeight: 700, fontSize: "1.25rem" }}>
                    {selectedCrypto.name}
                  </Typography>
                  <Typography sx={{ color: AppColors.TXT_SUB, fontSize: "0.85rem" }}>
                    {selectedCrypto.symbol} • {selectedCrypto.type}
                  </Typography>
                </Box>
              </Box>
              <Typography
                sx={{
                  color: (selectedCrypto.change ?? 0) >= 0 ? AppColors.SUCCESS : AppColors.ERROR,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                {(selectedCrypto.change ?? 0) >= 0 ? "+" : ""}{(selectedCrypto.change ?? 0).toFixed(2)}%
              </Typography>
            </Box>

            <Typography sx={{ color: AppColors.TXT_MAIN, fontWeight: 700, fontSize: "1.75rem", mb: 2 }}>
              ${Number(selectedCrypto.price).toLocaleString(undefined, { maximumFractionDigits: 8 })}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: BORDER_RADIUS.XS,
                  bgcolor: AppColors.BG_SECONDARY,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography sx={{ color: AppColors.TXT_SUB, fontSize: "0.75rem", mb: 0.5 }}>
                  {t("rewardHub.home.volume24h", "24h Volume")}
                </Typography>
                <Typography sx={{ color: AppColors.TXT_MAIN, fontWeight: 600, fontSize: "0.9rem" }}>
                  ${selectedCrypto.volume24h ?? "—"}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: BORDER_RADIUS.XS,
                  bgcolor: AppColors.BG_SECONDARY,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography sx={{ color: AppColors.TXT_SUB, fontSize: "0.75rem", mb: 0.5 }}>
                  {t("rewardHub.home.marketCap", "Market Cap")}
                </Typography>
                <Typography sx={{ color: AppColors.TXT_MAIN, fontWeight: 600, fontSize: "0.9rem" }}>
                  ${selectedCrypto.marketCap ?? "—"}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: BORDER_RADIUS.XS,
                  bgcolor: AppColors.BG_SECONDARY,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography sx={{ color: AppColors.TXT_SUB, fontSize: "0.75rem", mb: 0.5 }}>
                  {t("rewardHub.home.high24h", "24h High")}
                </Typography>
                <Typography sx={{ color: AppColors.GOLD_PRIMARY, fontWeight: 600, fontSize: "0.9rem" }}>
                  ${Number(selectedCrypto.high24h).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: BORDER_RADIUS.XS,
                  bgcolor: AppColors.BG_SECONDARY,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography sx={{ color: AppColors.TXT_SUB, fontSize: "0.75rem", mb: 0.5 }}>
                  {t("rewardHub.home.low24h", "24h Low")}
                </Typography>
                <Typography sx={{ color: AppColors.ERROR, fontWeight: 600, fontSize: "0.9rem" }}>
                  ${Number(selectedCrypto.low24h).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
      {posterModalOpen && (
        <Suspense fallback={null}>
          <InvitePosterModal
            open={posterModalOpen}
            onClose={() => setPosterModalOpen(false)}
            inviteIncomeText={formatNumber(user?.inviteIncome) || "10 billion"}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default HomePage;
