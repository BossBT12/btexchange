import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  Stack,
  FormLabel,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { AppColors } from "../../constant/appColors";
import { TrendingUp, TrendingDown, LocalAtm } from "@mui/icons-material";
import ConfirmationModal from "../ConfirmationModal";
import DepositDestinationModal from "../DepositDestinationModal";
import tradingService from "../../services/tradingService";
import useSnackbar from "../../hooks/useSnackbar";
import useAuth from "../../hooks/useAuth";
import NumberSpinner from "../input/numberSpinner";
import authService from "../../services/authService";
import LoaderMessageModal from "../LoaderMessageModal";

export default function TradingPanel({ selectedPair }) {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [amount, setAmount] = useState(10);
  const [duration, setDuration] = useState("1m");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [depositChoiceOpen, setDepositChoiceOpen] = useState(false);
  const [pendingDirection, setPendingDirection] = useState(null); // "UP" | "DOWN"
  const [placing, setPlacing] = useState({
    loading: false,
    status: null,
  });
  const [userBalance, setUserBalance] = useState({
    value: 0.0000,
    loading: false,
  });
  const { showSnackbar } = useSnackbar();
  const { isLoggedIn } = useAuth();
  const formattedPairForApi = useMemo(() => {
    if (!selectedPair) return "BTC-USD";
    if (selectedPair.includes("-")) return selectedPair;
    if (selectedPair.endsWith("USDT")) {
      return `${selectedPair.replace("USDT", "")}-USD`;
    }
    return selectedPair;
  }, [selectedPair]);

  const amountNumber = Number(amount) || 0;
  const durations = ["30s", "1m", "3m", "5m", "10m", "15m", "30m", "1h", "24h"];

  const handleStartTrade = (direction) => {
    if (!isLoggedIn) {
      showSnackbar("Please login to place a trade.", "warning");
      return;
    }
    if (amountNumber <= 0) {
      showSnackbar("Enter an amount greater than zero.", "error");
      return;
    }
    setPendingDirection(direction);
    setConfirmOpen(true);
  };

  const handleConfirmTrade = async () => {
    if (!pendingDirection) return;
    setPlacing(prev => ({ ...prev, loading: true }));
    try {
      const payload = {
        pair: formattedPairForApi,
        amount: amountNumber,
        direction: pendingDirection,
        duration,
      };
      const response = await tradingService.placeSelfTrade(payload);
      if (response?.success) {
        showSnackbar(response?.message || "Trade placed", "success");
        setPlacing({ loading: false, status: true });
        fetchUserBalance();
      } else {
        throw new Error(response?.message || "Failed to place trade");
      }
    } catch (error) {
      console.error("Place trade failed:", error);
      showSnackbar(
        error?.response?.data?.message || error?.message || "Failed to place trade",
        "error"
      );
      setPlacing({ loading: false, status: false });
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleDeposit = () => {
    setDepositChoiceOpen(true);
  };

  const fetchUserBalance = async () => {
    try {
      setUserBalance(prev => ({ ...prev, loading: true }));
      const response = await authService.getUser();
      if (response?.success) {
        setUserBalance(prev => ({ ...prev, value: response?.data?.balances?.totalAvailableForTrading, loading: false }));
      }
    } catch (error) {
      console.error("Failed to fetch user balance:", error);
    } finally {
      setUserBalance(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchUserBalance();
  }, []);

  return (
    <Box
      sx={{
        bgcolor: AppColors.BG_SECONDARY,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: { xs: "none", lg: `1px solid ${AppColors.HLT_NONE}30` },
        borderTop: { xs: `1px solid ${AppColors.HLT_NONE}30`, lg: "none" },
      }}
    >
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}>
        {/* Available Balance */}
        <Box
          sx={{
            bgcolor: AppColors.BG_CARD,
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Typography variant="caption" sx={{ color: AppColors.TXT_SUB, fontSize: "0.75rem" }}>
            Available
          </Typography>
          <Typography variant="body1" sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}>
            {userBalance?.loading ? t("trade.loading") : `${userBalance?.value} USDT`}
          </Typography>
        </Box>
        <Stack direction="column" spacing={1} sx={{ px: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <NumberSpinner
              label={t("trade.amountLabel")}
              min={0}
              max={1000000}
              size="small"
              defaultValue={amount}
              onChange={(value) => setAmount(value)}
              error={amountNumber <= 0}
              success={amountNumber > 0}
            />
            <FormControl size="small" fullWidth>
              <FormLabel
                htmlFor="duration-select"
                sx={{
                  display: 'inline-block',
                  fontSize: '0.875rem',
                  color: AppColors.TXT_MAIN,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                {t("trade.durationLabel")}
              </FormLabel>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                sx={{
                  bgcolor: AppColors.BG_CARD,
                  color: AppColors.TXT_MAIN,
                  "& .MuiSelect-icon": { color: AppColors.TXT_SUB },
                }}

              >
                {durations.map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {/* Action Buttons */}
          <Box sx={{
            display: "flex",
            gap: { xs: 0.75, sm: 1 },
            flexDirection: "row",
          }}>
            <Button
              fullWidth
              startIcon={<TrendingUp sx={{ fontSize: { xs: "18px", sm: "20px" } }} />}
              sx={{
                bgcolor: AppColors.SUCCESS,
                color: "#000",
                textTransform: "none",
                fontWeight: 700,
                py: { xs: 0.875, sm: 1 },
                "&:hover": {
                  bgcolor: AppColors.SUCCESS,
                  opacity: 0.9,
                },
              }}
              disabled={placing?.loading}
              onClick={() => handleStartTrade("UP")}
            >
              Up
            </Button>
            <Button
              fullWidth
              startIcon={<TrendingDown sx={{ fontSize: { xs: "18px", sm: "20px" } }} />}
              sx={{
                bgcolor: AppColors.ERROR,
                color: "#fff",
                textTransform: "none",
                fontWeight: 700,
                fontSize: { xs: "0.813rem", sm: "0.875rem", md: "0.938rem" },
                py: { xs: 0.875, sm: 1 },
                "&:hover": {
                  bgcolor: AppColors.ERROR,
                  opacity: 0.9,
                },
              }}
              disabled={placing?.loading}
              onClick={() => handleStartTrade("DOWN")}
            >
              Down
            </Button>
          </Box>

          {/* Get Started Button (when no balance) */}
          <Button
            fullWidth
            className="btn-primary"
            sx={{
              textTransform: "none",
              fontWeight: 700,
            }}
            startIcon={<LocalAtm />}
            onClick={() => handleDeposit()}
          >
            {t("assets.deposit", "Deposit")}
          </Button>
          <Divider />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="caption" sx={{ color: AppColors.TXT_SUB, fontSize: "0.75rem" }}>
              Trade statistics will be displayed here.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => !placing?.loading && setConfirmOpen(false)}
        onConfirm={handleConfirmTrade}
        loading={placing?.loading}
        title={t("trade.confirmTradeTitle")}
        description={t("trade.confirmTradeDescription", {
          direction: pendingDirection === "DOWN" ? t("trade.directionDown") : t("trade.directionUp"),
          pair: formattedPairForApi,
          amount: amountNumber.toFixed(2),
          duration,
        })}
        okText={placing?.loading ? t("trade.placing") : t("common.confirm")}
        cancelText={t("common.cancel")}
      />
      <LoaderMessageModal loading={placing?.loading} status={placing?.status} />
      <DepositDestinationModal
        open={depositChoiceOpen}
        onClose={() => setDepositChoiceOpen(false)}
      />
    </Box>
  );
}
