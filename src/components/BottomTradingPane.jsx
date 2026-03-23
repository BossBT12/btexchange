import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  Stack,
  FormLabel,
  Divider,
  Container,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { AppColors } from "../constant/appColors";
import { LocalAtm, ArrowOutward, SwapHoriz as SwapHorizIcon, Check } from "@mui/icons-material";
import tradingService from "../services/tradingService";
import useSnackbar from "../hooks/useSnackbar";
import useAuth from "../hooks/useAuth";
import NumberSpinner from "./input/numberSpinner";
import authService from "../services/authService";
import LoaderMessageModal from "./LoaderMessageModal";
import { FONT_SIZE } from "../constant/lookUpConstant";
import {
  formatCurrencyForApi,
  formatCurrencyForDisplay,
  formatPairForDisplay,
  getCurrencyDisplayRate,
  DISPLAY_CURRENCIES,
} from "../utils/utils";
import { AiOutlineSwap } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../i18n";

// Canonical amount in USDT (API); displayCache keeps exact display value per currency for round-trip.
const initialAmountState = { amountUsdt: null, displayCache: {} };

export default function BottomTradingPane({ selectedPair, currency, setCurrency, betProfitPercent }) {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [amountState, setAmountState] = useState(initialAmountState);
  const { amountUsdt, displayCache } = amountState;
  const [duration, setDuration] = useState("30s");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDirection, setPendingDirection] = useState(null); // "UP" | "DOWN"
  const [draftAmount, setDraftAmount] = useState(null);
  const [agreedRules, setAgreedRules] = useState(false);
  const [placing, setPlacing] = useState({
    loading: false,
    status: null,
  });
  const [currencyMenuAnchor, setCurrencyMenuAnchor] = useState(null);
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

  const amountDisplayValue = useMemo(() => {
    if (amountUsdt == null) return null;
    const cached = displayCache[currency];
    if (cached != null) return cached;
    const rate = getCurrencyDisplayRate(currency);
    return Number((amountUsdt * rate).toFixed(2));
  }, [amountUsdt, currency, displayCache]);

  const amountNumber = amountDisplayValue != null ? Number(amountDisplayValue) : 0;

  const handleAmountChange = useCallback(
    (displayValue) => {
      if (displayValue === "" || displayValue == null) {
        setAmountState(initialAmountState);
        return;
      }
      const num = Number(displayValue);
      if (Number.isNaN(num)) return;
      const rate = getCurrencyDisplayRate(currency);
      const usdt = num / rate;
      setAmountState((prev) => ({
        amountUsdt: usdt,
        displayCache: { ...prev.displayCache, [currency]: num },
      }));
    },
    [currency]
  );
  const draftAmountNumber = Number(draftAmount) || 0;
  const payoutPercent = Number(betProfitPercent) || 100;
  const settlementAmount = amountNumber + (amountNumber * payoutPercent / 100);
  const settlementDisplay = amountNumber > 0 ? settlementAmount.toFixed(2) : "--";

  const durations = [
    { value: "30s", label: "30s" },
    { value: "1m", label: "1m" },
    { value: "3m", label: "3m" },
    { value: "5m", label: "5m" },
    { value: "10m", label: "10m" },
    { value: "30m", label: "30m" },
    { value: "1h", label: "1H" },
    { value: "24h", label: "1D" },
  ];

  const handleStartTrade = (direction) => {
    if (!isLoggedIn) {
      showSnackbar(t("tradingPane.pleaseLogin", "Please login to place a trade."), "warning");
      return;
    }
    if (amountNumber <= 0) {
      showSnackbar(t("tradingPane.enterAmountGreaterThanZero", "Enter an amount greater than zero."), "error");
      return;
    }
    setDraftAmount(amountDisplayValue != null ? String(amountDisplayValue) : null);
    setAgreedRules(false);
    setPendingDirection(direction);
    setConfirmOpen(true);
  };

  const handleConfirmTrade = async (overrideAmount) => {
    if (!pendingDirection) return;
    const amountToUse = typeof overrideAmount === "number" ? overrideAmount : amountNumber;
    if (amountToUse <= 0) {
      showSnackbar(t("tradingPane.enterAmountGreaterThanZero", "Enter an amount greater than zero."), "error");
      return;
    }
    setPlacing(prev => ({ ...prev, loading: true }));
    try {
      const payload = {
        pair: formattedPairForApi,
        amount: formatCurrencyForApi(amountToUse, currency),
        direction: pendingDirection,
        duration,
      };
      const response = await tradingService.placeSelfTrade(payload);
      if (response?.success) {
        showSnackbar(response?.message || t("tradingPane.tradePlaced", "Trade placed"), "success");
        setPlacing({ loading: false, status: true });
        fetchUserBalance();
      } else {
        throw new Error(response?.message || t("tradingPane.failedToPlaceTrade", "Failed to place trade"));
      }
    } catch (error) {
      console.error("Place trade failed:", error);
      setPlacing({ loading: false, status: false });
      showSnackbar(
        error?.response?.data?.message || error?.message || t("tradingPane.failedToPlaceTrade", "Failed to place trade"),
        "error"
      );
    } finally {
      setConfirmOpen(false);
      if (overrideAmount != null) {
        const usdt = Number(formatCurrencyForApi(overrideAmount, currency));
        setAmountState((prev) => ({
          amountUsdt: usdt,
          displayCache: { ...prev.displayCache, [currency]: Number(overrideAmount) },
        }));
      }
    }
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
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Container maxWidth="md" sx={{ px: 1 }}>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.75,
          pb: 1,
          mt: 1.75,
        }}>

          <FormControl size="small" sx={{ width: "100%", gap: 0.5, maxWidth: '100%' }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, fontWeight: 500 }}>{t("tradingPane.timeUnit", "Time Unit")}</Typography>
              <Button
                size="small"
                sx={{ py: 0, px: 0.5, borderRadius: 12 }}
                onClick={(e) => setCurrencyMenuAnchor(e.currentTarget)}
                aria-haspopup="true"
                aria-controls={currencyMenuAnchor ? "currency-menu" : undefined}
                endIcon={<AiOutlineSwap />}
              >
                {currency}
              </Button>
            </Box>
            <Grid container spacing={1}>
              {durations.map((option) => {
                const isActive = duration === option.value;
                return (
                  <Grid size={3} key={option.value}>
                    <Button
                      className={isActive ? "btn-primary" : ""}
                      onClick={() => setDuration(option.value)}
                      sx={{
                        width: "100%",
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: FONT_SIZE.BODY2,
                        fontWeight: 500,
                        py: 0.25,
                        bgcolor: !isActive && "transparent",
                        color: !isActive && AppColors.TXT_SUB,
                        border: "1px solid",
                        borderColor: !isActive && AppColors.HLT_SUB,
                        "&:hover": {
                          bgcolor: !isActive && AppColors.BG_CARD,
                        },
                      }}
                    >
                      {option.label}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          </FormControl>
          <Stack direction="column" spacing={1}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_MAIN,
                }}
              >
                {t("tradingPane.amount", "Amount")} ({currency})
              </Typography>
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                {t("tradingPane.avail", "Avail.")} {" "}
                <span style={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}>
                  {userBalance?.loading ? t("tradingPane.loading", "Loading...") :
                    formatCurrencyForDisplay(userBalance?.value ?? 0, currency).displayValue}
                </span>
                <IconButton
                  size="small"
                  sx={{ py: 0, px: 0.5 }}
                  onClick={(e) => setCurrencyMenuAnchor(e.currentTarget)}
                  aria-haspopup="true"
                  aria-controls={currencyMenuAnchor ? "currency-menu" : undefined}
                >
                  <AiOutlineSwap style={{ fontSize: "14px", color: AppColors.GOLD_PRIMARY }} />
                </IconButton>
                <Menu
                  id="currency-menu"
                  anchorEl={currencyMenuAnchor}
                  open={Boolean(currencyMenuAnchor)}
                  onClose={() => setCurrencyMenuAnchor(null)}
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  transformOrigin={{ vertical: "bottom", horizontal: "right" }}
                  slotProps={{
                    paper: {
                      sx: {
                        minWidth: 320,
                        px: 1,
                        borderRadius: 4,
                        bgcolor: "rgba(26, 26, 26, 0.85)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                        border: `1px solid ${AppColors.BORDER_MAIN}`,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        py: 0,
                        "& .MuiList-root": {
                          py: 0,
                        },
                      },
                    },
                  }}
                >
                  {DISPLAY_CURRENCIES.map((c, index) => (
                    <MenuItem
                      key={c.code}
                      selected={currency === c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyMenuAnchor(null);
                      }}
                      sx={{
                        color: AppColors.TXT_MAIN,
                        display: "flex",
                        justifyContent: "space-between",
                        py: 0,
                        paddingTop: { xs: 0, md: 1.25 },
                        paddingBottom: { xs: 0, md: 1.25 },
                        px: 1,
                        minHeight: 40,
                        borderBottom: index < DISPLAY_CURRENCIES.length - 1 ? `1px solid ${AppColors.BORDER_MAIN}` : "none",
                        "&:hover": { bgcolor: AppColors.BG_CARD_HOVER },
                        "&.MuiMenuItem-root, &.MuiButtonBase-root, &.MuiListItemButton-root": {
                          paddingTop: { xs: 0, md: 1.25 },
                          paddingBottom: { xs: 0, md: 1.25 },
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                        {c.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN }}>
                        {c.code}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Typography>
            </Box>
            <NumberSpinner
              key={`amount-${currency}`}
              label={t("tradingPane.amount", "Amount")}
              min={0}
              max={1000000}
              size="small"
              defaultValue={amountDisplayValue != null ? amountDisplayValue : undefined}
              onChange={handleAmountChange}
              disableOnChangeOnBlur
              error={amountNumber <= 0}
              success={amountNumber > 0}
            />
          </Stack>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              <span style={{
                textDecorationLine: "underline",
                textDecorationStyle: "dotted"
              }}>
                {t("tradingPane.upPayout", "Up payout")}
              </span>{" "}
              <span style={{ color: AppColors.SUCCESS }}>
                {betProfitPercent || 100}%
              </span>
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              <span style={{
                textDecorationLine: "underline",
                textDecorationStyle: "dotted"
              }}>
                {t("tradingPane.downPayout", "Down payout")}
              </span>{" "}
              <span style={{ color: AppColors.SUCCESS }}>
                {betProfitPercent || 100}%
              </span>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
              <span>
                {t("tradingPane.settlementAmount", "Settlement Amount:")}
              </span>{" "}
              <span style={{ color: AppColors.TXT_MAIN }}>
                {settlementDisplay} {currency}
              </span>
            </Typography>
            <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
              <span>
                {t("tradingPane.settlementAmount", "Settlement Amount:")}
              </span>{" "}
              <span style={{ color: AppColors.TXT_MAIN }}>
                {settlementDisplay} {currency}
              </span>
            </Typography>
          </Box>
          <Box sx={{
            display: "flex",
            gap: 0.75,
            flexDirection: "row",
          }}>
            <Button
              fullWidth
              startIcon={<ArrowOutward sx={{ fontSize: "18px", color: "#fff" }} />}
              sx={{
                borderRadius: 12,
                bgcolor: AppColors.SUCCESS,
                color: "#fff",
                textTransform: "none",
                fontWeight: 700,
                py: 0.875,
                fontSize: FONT_SIZE.BODY,
                "&:hover": {
                  bgcolor: AppColors.SUCCESS,
                  opacity: 0.9,
                },
              }}
              disabled={placing?.loading}
              onClick={() => handleStartTrade("UP")}
            >
              {t("tradingPane.up", "Up")}
            </Button>
            <Button
              fullWidth
              startIcon={<ArrowOutward sx={{ fontSize: "18px", transform: "rotate(90deg)" }} />}
              sx={{
                borderRadius: 12,
                bgcolor: AppColors.ERROR,
                color: "#fff",
                textTransform: "none",
                fontWeight: 700,
                fontSize: FONT_SIZE.BODY,
                py: 0.875,
                "&:hover": {
                  bgcolor: AppColors.ERROR,
                  opacity: 0.9,
                },
              }}
              disabled={placing?.loading}
              onClick={() => handleStartTrade("DOWN")}
            >
              {t("tradingPane.down", "Down")}
            </Button>
          </Box>
        </Box>
      </Container>
      {confirmOpen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              width: "100%",
              bgcolor: AppColors.BG_SECONDARY,
            }}
          >
            <Container maxWidth="md">
              {/* Content */}
              <Box sx={{ pt: 1 }}>
                {/* Balance */}
                <Typography
                  variant="body1"
                  sx={{
                    color: AppColors.GOLD_PRIMARY,
                    opacity: 0.95,
                    fontWeight: 500,
                    letterSpacing: 0.3,
                  }}
                >
                  {formatPairForDisplay(formattedPairForApi)} · {duration}- {pendingDirection === "DOWN" ? t("tradingPane.down", "Down") : t("tradingPane.up", "Up")}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}
                  >
                    {t("tradingPane.balance", "Balance")}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <LocalAtm
                      sx={{ fontSize: 18, color: AppColors.GOLD_PRIMARY }}
                    />
                    <Typography
                      variant="body1"
                      sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}
                    >
                      {userBalance?.loading
                        ? t("tradingPane.loading", "Loading...")
                        : formatCurrencyForDisplay(userBalance?.value ?? 0, currency).displayValue}
                    </Typography>
                  </Box>
                </Box>

                {/* Quantity */}
                <Box sx={{ mb: 1.5, display: "flex", flexDirection: "row", gap: 0.75, justifyContent: "space-between" }}>
                  <Typography variant="body1" sx={{ color: AppColors.TXT_SUB, fontWeight: 500 }}>{t("tradingPane.quantity", "Quantity")}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <NumberSpinner
                      label=""
                      min={0}
                      max={1000000}
                      size="small"
                      defaultValue={draftAmount}
                      onChange={(value) => setDraftAmount(value)}
                      error={draftAmountNumber <= 0}
                      success={draftAmountNumber > 0}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,
                    mb: 1,
                  }}
                >
                  {[1, 5, 10].map((mult) => (
                    <Button
                      key={mult}
                      variant={mult === 1 ? "contained" : "outlined"}
                      size="small"
                      sx={{
                        flex: "1 1 15%",
                        minWidth: 0,
                        borderRadius: 999,
                        bgcolor:
                          mult === 1 ? AppColors.GOLD_PRIMARY : "transparent",
                        color:
                          mult === 1
                            ? AppColors.TXT_BLACK
                            : AppColors.GOLD_PRIMARY,
                        borderColor: AppColors.GOLD_PRIMARY,
                        fontSize: "0.75rem",
                        textTransform: "none",
                        "&:hover": {
                          bgcolor:
                            mult === 1
                              ? AppColors.GOLD_DARK
                              : AppColors.HLT_LIGHT,
                        },
                      }}
                      onClick={() =>
                        setDraftAmount(
                          Math.max(0, (amountNumber || 0) * mult)
                        )
                      }
                    >
                      {t("tradingPane.multiplier", "X{{mult}}", { mult })}
                    </Button>
                  ))}
                </Box>

                {/* Rules */}
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={agreedRules}
                      onChange={(e) => setAgreedRules(e.target.checked)}
                      sx={{
                        color: AppColors.GOLD_PRIMARY,
                        "&.Mui-checked": { color: AppColors.GOLD_PRIMARY },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{ color: AppColors.TXT_SUB }}
                    >
                      {t("tradingPane.agreeRules", "I agree")}{" "}
                      <Box
                        component="span"
                        sx={{ color: AppColors.ERROR, fontWeight: 600 }}
                      >
                        {t("tradingPane.presaleRules", "《Pre-sale rules》")}
                      </Box>
                    </Typography>
                  }
                />
              </Box>

              <Divider sx={{ borderColor: AppColors.HLT_SUB }} />

              {/* Footer actions */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.25,
                  gap: 1.5,
                }}
              >
                <Button
                  variant="text"
                  onClick={() => !placing?.loading && setConfirmOpen(false)}
                  disabled={placing?.loading}
                  sx={{
                    color: AppColors.TXT_SUB,
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      bgcolor: AppColors.HLT_SUB,
                    },
                  }}
                >
                  {t("tradingPane.cancel", "Cancel")}
                </Button>
                <Button
                  className="btn-primary"
                  fullWidth
                  disabled={placing?.loading || !agreedRules || draftAmountNumber <= 0}
                  onClick={() => handleConfirmTrade(draftAmountNumber)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: AppColors.GOLD_PRIMARY,
                    color: AppColors.TXT_BLACK,
                    px: 2,
                    "&:hover": {
                      bgcolor: AppColors.GOLD_DARK,
                    },
                  }}
                >
                  {placing?.loading
                    ? t("tradingPane.placing", "Placing...")
                    : t("tradingPane.totalAmount", "Total amount {{value}} {{currency}}", { value: Number(draftAmountNumber).toFixed(2), currency })}
                </Button>
              </Box>
            </Container>
          </Box>
        </Box>
      )}
      <LoaderMessageModal loading={placing?.loading} status={placing?.status} />
    </Box>
  );
}
