import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Grid, IconButton, Typography } from "@mui/material";
import { AppColors } from "../../constant/appColors";
import TradingChart from "../../components/trading/TradingChart";
import BottomTradingPane from "../../components/BottomTradingPane";
import TradePageTopView from "../../components/TradePageTopView";
// import TradingTabs from "../../components/trading/TradingTabs";
import { createTradeSocket } from "../../services/tradingSocketService";
import useTradeSocket from "../../hooks/useTradeSocket";
import { ArrowBackIosNew as ArrowBackIcon } from "@mui/icons-material";
import tradingService from "../../services/tradingService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const api = createTradeSocket();

const DEFAULT_PAIRS = [
  { pair: "BTC-USD" },
  { pair: "ETH-USD" },
  { pair: "SOL-USD" },
];

export default function TradePage() {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const location = useLocation();
  const navigate = useNavigate();
  const pairFromState = location.state?.selectedPair;
  const [currency, setCurrency] = useState("USDT");
  const { isConnected, joinPublic } = useTradeSocket();
  const [tradeEntryMarkers, setTradeEntryMarkers] = useState([]);
  const [pairsData, setPairsData] = useState(DEFAULT_PAIRS);
  const [selectedPair, setSelectedPair] = useState(
    pairFromState || pairsData[0]?.pair,
  );
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [betProfitPercent, setBetProfitPercent] = useState(100);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSelectPair = (pair) => {
    setSelectedPair(pair.toUpperCase());
    setAnchorEl(null);
  };

  const handleBetStarted = useCallback((data) => {
    if (data?.pair == null) return;
    setTradeEntryMarkers((prev) => {
      if (data?.betId && prev.some((m) => m.betId === data.betId)) return prev;
      return [...prev, data];
    });
  }, []);

  useEffect(() => {
    const getBetConfig = async () => {
      const response = await tradingService.getBetConfig();
      setBetProfitPercent(response?.data?.betProfitPercent || 100);
    };
    getBetConfig();
  }, []);

  useEffect(() => {
    const tradeChagne = async () => {
      joinPublic();
      await api.pairPrices((prices) => {
        setPairsData(prices);
      });
    };
    if (isConnected) {
      tradeChagne();
    }
  }, [isConnected]);

  return (
    <div className="relative">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          py: 1,
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
          px: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{ color: AppColors.TXT_MAIN, px: 0.75 }}
          aria-label={t("tradeTop.backAriaLabel", "Back")}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("tradeTop.pageTitle", "Trade Zone")}
        </Typography>
      </Box>
      <TradePageTopView
        api={api}
        selectedPair={selectedPair}
        pairsData={pairsData}
        onSelectPair={handleSelectPair}
        pairMenuAnchor={anchorEl}
        pairMenuOpen={open}
        onPairMenuOpen={handleClick}
        onPairMenuClose={() => setAnchorEl(null)}
        betProfitPercent={betProfitPercent}
      />
      <Box
        sx={{
          pb: "max(36px, calc(240px + env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <Grid container sx={{ height: "100%" }}>
          <Grid size={12}>
            <TradingChart
              selectedPair={selectedPair}
              tradeEntryMarkers={tradeEntryMarkers}
            />
          </Grid>
        </Grid>
        <BottomTradingPane
          selectedPair={selectedPair}
          currency={currency}
          setCurrency={setCurrency}
          betProfitPercent={betProfitPercent}
          onBetStarted={handleBetStarted}
        />
        {/* <TradingTabs
          onBetStarted={handleBetStarted}
          betProfitPercent={betProfitPercent}
        /> */}
      </Box>
    </div>
  );
}
