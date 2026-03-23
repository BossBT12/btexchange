import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  History,
  Security as SecurityIcon,
} from "@mui/icons-material";
import BTLoader from "../../components/Loader";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE, SPACING, BORDER_RADIUS } from "../../constant/lookUpConstant";
import walletService from "../../services/secondGameServices/walletService";
import userService from "../../services/secondGameServices/userService";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const CHAINS = [
  { value: "BSC", labelKey: "BSC" },
  // { value: "ETH", labelKey: "ETH" },
  { value: "POLYGON", labelKey: "POLYGON" },
];

export default function WithdrawPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);

  const [balanceData, setBalanceData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedChain, setSelectedChain] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const wallet = balanceData?.wallet ?? {};
  const withdrawableBalance = Number(wallet?.WITHDRAWABLE_BALANCE ?? 0);
  const isTwoFactorEnabled = Boolean(profile?.user?.isTwoFactorEnabled);

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await walletService.getWalletBalanceAndStats();
      setBalanceData(response?.data ?? null);
    } catch (err) {
      setError(err?.message ?? t("rewardHub.withdraw.errors.loadFailed", "Failed to load balance"));
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await userService.getProfile();
      setProfile(response?.data ?? response);
    } catch (err) {
      console.log('error: ', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchProfile();
  }, []);

  const handleMaxClick = () => {
    if (withdrawableBalance > 0) setAmount(String(withdrawableBalance));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError(t("rewardHub.withdraw.errors.invalidAmount", "Please enter a valid amount."));
      return;
    }
    if (numericAmount > withdrawableBalance) {
      setError(t("rewardHub.withdraw.errors.amountExceeded", "Amount cannot exceed your withdrawable balance."));
      return;
    }
    if (!toAddress?.trim() || toAddress.length < 20) {
      setError(t("rewardHub.withdraw.errors.invalidAddress", "Please enter a valid wallet address."));
      return;
    }
    if (!selectedChain?.trim()) {
      setError(t("rewardHub.withdraw.errors.selectNetwork", "Please select a network."));
      return;
    }
    if (isTwoFactorEnabled && !twoFactorToken?.trim()) {
      setError(t("rewardHub.withdraw.errors.twoFactorRequired", "Please enter your 2FA code."));
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        toAddress: toAddress.trim(),
        amount: numericAmount,
        chain: selectedChain,
      };
      if (isTwoFactorEnabled) payload.twoFactorToken = twoFactorToken.trim();

      const response = await walletService.withdrawFunds(payload);

      if (response?.success) {
        setSuccess(response?.message ?? t("rewardHub.withdraw.success.default", "Withdrawal processed successfully."));
        setAmount("");
        setToAddress("");
        setTwoFactorToken("");
        await fetchBalance();
      } else {
        setError(response?.message ?? t("rewardHub.withdraw.errors.failed", "Withdrawal failed. Please try again."));
      }
    } catch (err) {
      setError(err?.message ?? err?.data?.message ?? t("rewardHub.withdraw.errors.failed", "Withdrawal failed. Please try again."));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Box
      sx={{
        color: AppColors.TXT_MAIN,
        bgcolor: AppColors.BG_MAIN,
        minHeight: "100vh",
        pb: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
          py: SPACING.XS,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          aria-label={t("rewardHub.withdraw.backAriaLabel", "Back")}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 1,
            "&:hover": { bgcolor: AppColors.HLT_LIGHT },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            color: AppColors.TXT_MAIN,
            fontWeight: 600,
          }}
        >
          {t("rewardHub.withdraw.title", "Withdraw")}
        </Typography>
        <Box>
          <Button
            onClick={() => navigate("/reward-hub/capital-withdraw")}
            aria-label={t("rewardHub.withdraw.capitalWithdrawAriaLabel", "Capital Withdraw")}
            sx={{
              textTransform: "none",
              fontSize: FONT_SIZE.BODY2,
              color: AppColors.TXT_MAIN,
            }}
          >
            {t("rewardHub.withdraw.capitalWithdrawButton", "Capital Withdrawal")}
          </Button>
          <IconButton
            onClick={() => navigate("/reward-hub/transaction-history", { state: { type: "WITHDRAWAL" } })}
            aria-label={t("rewardHub.withdraw.historyAriaLabel", "Withdrawal history")}
            sx={{
              color: AppColors.TXT_MAIN,
              p: 1,
              "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <History />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: SPACING.MD }}>
        {(error || success) && (
          <Box sx={{ mb: 2 }}>
            {error && (
              <Alert
                severity="error"
                onClose={() => setError(null)}
                sx={{
                  mb: success ? 1 : 0,
                  bgcolor: AppColors.ERR_LIGHT,
                  color: AppColors.ERROR,
                  border: `1px solid ${AppColors.ERROR}40`,
                  "& .MuiAlert-icon": { color: AppColors.ERROR },
                }}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                onClose={() => setSuccess(null)}
                sx={{
                  bgcolor: `${AppColors.SUCCESS}15`,
                  color: AppColors.SUCCESS,
                  border: `1px solid ${AppColors.SUCCESS}40`,
                  "& .MuiAlert-icon": { color: AppColors.SUCCESS },
                }}
              >
                {success}
              </Alert>
            )}
          </Box>
        )}
        <Box>
          {/* Balance card */}
          <Typography
            variant="body2"
            sx={{
              color: AppColors.TXT_MAIN,
              mb: 0.5,
            }}
          >
            {t("rewardHub.withdraw.withdrawableBalance", "Withdrawable balance")}
          </Typography>
          <Box
            sx={{
              bgcolor: AppColors.BG_CARD,
              borderRadius: BORDER_RADIUS.XS,
              border: `1px solid ${AppColors.BORDER_MAIN}`,
              px: 2,
              py: 1.5,
              mb: 2,
            }}
          >
            {balanceLoading ? (
              <Box sx={{ py: 1 }}>
                <BTLoader />
              </Box>
            ) : (
              <Typography
                variant="h4"
                sx={{
                  color: AppColors.GOLD_PRIMARY,
                }}
              >
                {withdrawableBalance.toFixed(2)} USDT
              </Typography>
            )}
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label={t("rewardHub.withdraw.amountLabel", "Amount (USDT)")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
              InputProps={{
                endAdornment: (
                  <Button
                    size="small"
                    onClick={handleMaxClick}
                    sx={{
                      textTransform: "none",
                      color: AppColors.GOLD_PRIMARY,
                      minWidth: 0,
                    }}
                  >
                    {t("rewardHub.withdraw.max", "Max")}
                  </Button>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: AppColors.BG_CARD,
                  borderRadius: BORDER_RADIUS.XS,
                  "& fieldset": { borderColor: AppColors.BORDER_MAIN },
                  "&:hover fieldset": { borderColor: AppColors.BORDER_MAIN },
                  color: AppColors.TXT_MAIN,
                  fontSize: FONT_SIZE.BODY,
                },
                "& .MuiInputLabel-root": { color: AppColors.TXT_SUB },
              }}
            />

            <TextField
              label={t("rewardHub.withdraw.addressLabel", "Withdrawal address (USDT wallet)")}
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder={t("rewardHub.withdraw.addressPlaceholder", "0x...")}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: AppColors.BG_CARD,
                  borderRadius: BORDER_RADIUS.XS,
                  "& fieldset": { borderColor: AppColors.BORDER_MAIN },
                  "&:hover fieldset": { borderColor: AppColors.BORDER_MAIN },
                  color: AppColors.TXT_MAIN,
                  fontSize: FONT_SIZE.BODY2,
                },
                "& .MuiInputLabel-root": { color: AppColors.TXT_SUB },
              }}
            />

            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_SUB,
                  mb: 0.5,
                }}
              >
                {t("rewardHub.withdraw.networkLabel", "Network")}
              </Typography>
              <Select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                displayEmpty
                renderValue={(v) => {
                  if (!v) return t("rewardHub.withdraw.selectNetworkPlaceholder", "Select network");
                  const c = CHAINS.find((x) => x.value === v);
                  return c ? t(`rewardHub.withdraw.chains.${c.labelKey}`, c.labelKey) : v;
                }}
                fullWidth
                sx={{
                  bgcolor: AppColors.BG_CARD,
                  color: AppColors.TXT_MAIN,
                  borderRadius: BORDER_RADIUS.XS,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: AppColors.BORDER_MAIN,
                  },
                  "& .MuiSelect-select": { fontSize: FONT_SIZE.BODY },
                }}
              >
                <MenuItem value="" disabled>
                  {t("rewardHub.withdraw.selectNetworkPlaceholder", "Select network")}
                </MenuItem>
                {CHAINS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {t(`rewardHub.withdraw.chains.${c.labelKey}`, c.labelKey)}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {isTwoFactorEnabled && (
              <TextField
                label={t("rewardHub.withdraw.twoFactorLabel", "2FA code")}
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t("rewardHub.withdraw.twoFactorPlaceholder", "000000")}
                inputProps={{ maxLength: 6 }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ mr: 1, display: "flex" }}>
                      <SecurityIcon
                        sx={{
                          color: AppColors.GOLD_PRIMARY,
                          fontSize: 20,
                        }}
                      />
                    </Box>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: AppColors.BG_CARD,
                    borderRadius: BORDER_RADIUS.LG,
                    "& fieldset": { borderColor: AppColors.BORDER_MAIN },
                    color: AppColors.TXT_MAIN,
                    fontSize: FONT_SIZE.BODY,
                  },
                  "& .MuiInputLabel-root": { color: AppColors.TXT_SUB },
                }}
              />
            )}

            <Typography
              variant="caption"
              sx={{
                color: AppColors.TXT_SUB,
                display: "block",
              }}
            >
              {t("rewardHub.withdraw.notice", "Withdrawals are sent to the blockchain. Ensure the address and network match your USDT wallet. Double-check before submitting.")}
            </Typography>

            <Button
              type="submit"
              className="btn-primary"
              disabled={submitLoading || balanceLoading || withdrawableBalance <= 0 || !selectedChain?.trim()}
              fullWidth
              sx={{
                py: 1.5,
                alignSelf: "center",
                fontSize: FONT_SIZE.BODY,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 10
              }}
            >
              {submitLoading ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <BTLoader />
                </Box>
              ) : (
                t("rewardHub.withdraw.submitButton", "Submit withdrawal")
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
