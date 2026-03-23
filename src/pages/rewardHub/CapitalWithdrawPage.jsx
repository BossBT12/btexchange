import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControl,
} from "@mui/material";
import {
  ArrowBack,
  History,
  Security as SecurityIcon,
  OpenInNew,
  Savings,
} from "@mui/icons-material";
import BTLoader from "../../components/Loader";
import { AppColors } from "../../constant/appColors";
import {
  FONT_SIZE,
  SPACING,
  BORDER_RADIUS,
} from "../../constant/lookUpConstant";
import walletService from "../../services/secondGameServices/walletService";
import userService from "../../services/secondGameServices/userService";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import useSnackbar from "../../hooks/useSnackbar";

const CHAINS = [
  { value: "BSC", labelKey: "BSC" },
  // { value: "ETH", labelKey: "ETH" },
  { value: "POLYGON", labelKey: "POLYGON" },
];

const getExplorerUrl = (chain, txHash) => {
  if (!txHash) return null;
  const explorers = {
    BSC: `https://bscscan.com/tx/${txHash}`,
    // ETH: `https://etherscan.io/tx/${txHash}`,
    POLYGON: `https://polygonscan.com/tx/${txHash}`,
  };
  return explorers[chain] || null;
};

// (intentionally no date formatting needed on this page)

export default function CapitalWithdrawPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const { showSnackbar } = useSnackbar();

  const [investmentsData, setInvestmentsData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [investmentsLoading, setInvestmentsLoading] = useState(true);

  const [toAddress, setToAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const totalCapitalBalance = Number(investmentsData?.capitalBalance ?? 0);
  const maxWithdrawable = Number(investmentsData?.maxWithdrawable ?? 0);
  const penalty = investmentsData?.penalty ?? null;
  const penaltyPercentage = Number(penalty?.percentage ?? 0);
  const qualifiesForNoPenalty = Boolean(penalty?.qualifiesForNoPenalty);
  const isTwoFactorEnabled = Boolean(profile?.user?.isTwoFactorEnabled);

  const parsedWithdrawAmount = useMemo(() => {
    const n = Number(withdrawAmount);
    return Number.isFinite(n) ? n : NaN;
  }, [withdrawAmount]);

  const amountValidation = useMemo(() => {
    if (withdrawAmount === "") return { isValid: false, helperText: "" };
    if (!Number.isFinite(parsedWithdrawAmount) || parsedWithdrawAmount <= 0) {
      return {
        isValid: false,
        helperText: t(
          "rewardHub.capitalWithdraw.errors.invalidAmount",
          "Enter a valid amount.",
        ),
      };
    }
    if (parsedWithdrawAmount > maxWithdrawable) {
      return {
        isValid: false,
        helperText: t(
          "rewardHub.capitalWithdraw.errors.amountExceedsMax",
          "Amount cannot exceed max withdrawable.",
        ),
      };
    }
    return { isValid: true, helperText: "" };
  }, [withdrawAmount, parsedWithdrawAmount, maxWithdrawable, t]);

  const penaltyChargeEstimate = useMemo(() => {
    if (!amountValidation.isValid) return 0;
    if (qualifiesForNoPenalty) return 0;
    const pct = Math.max(0, penaltyPercentage);
    return (parsedWithdrawAmount * pct) / 100;
  }, [
    amountValidation.isValid,
    qualifiesForNoPenalty,
    penaltyPercentage,
    parsedWithdrawAmount,
  ]);

  const netReceiveEstimate = useMemo(() => {
    if (!amountValidation.isValid) return 0;
    return Math.max(0, parsedWithdrawAmount - penaltyChargeEstimate);
  }, [amountValidation.isValid, parsedWithdrawAmount, penaltyChargeEstimate]);

  const fetchInvestments = useCallback(async () => {
    try {
      setInvestmentsLoading(true);
      setError(null);
      const response = await walletService.getActiveInvestments();
      if (response?.success && response?.data) {
        const data = response.data;
        setInvestmentsData(data);
      } else {
        setError(
          response?.message ??
            t(
              "rewardHub.capitalWithdraw.errors.loadFailed",
              "Failed to load active investments",
            ),
        );
      }
    } catch (err) {
      const msg =
        err?.message ??
        err?.data?.message ??
        t(
          "rewardHub.capitalWithdraw.errors.loadFailed",
          "Failed to load active investments",
        );
      setError(msg);
    } finally {
      setInvestmentsLoading(false);
    }
  }, [t]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await userService.getProfile();
      setProfile(response?.data ?? response);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchInvestments();
    fetchProfile();
  }, [fetchInvestments, fetchProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSuccessData(null);

    if (maxWithdrawable <= 0) {
      showSnackbar(
        t(
          "rewardHub.capitalWithdraw.errors.nothingToWithdraw",
          "No withdrawable amount available right now.",
        ),
        "info",
      );
      return;
    }
    if (!toAddress?.trim() || toAddress.length < 20) {
      setError(
        t(
          "rewardHub.capitalWithdraw.errors.invalidAddress",
          "Please enter a valid wallet address.",
        ),
      );
      return;
    }
    if (!selectedChain?.trim()) {
      setError(
        t(
          "rewardHub.capitalWithdraw.errors.selectNetwork",
          "Please select a network.",
        ),
      );
      return;
    }
    if (!amountValidation.isValid) {
      setError(
        amountValidation.helperText ||
          t(
            "rewardHub.capitalWithdraw.errors.invalidAmount",
            "Enter a valid amount.",
          ),
      );
      return;
    }
    if (isTwoFactorEnabled && !twoFactorToken?.trim()) {
      setError(
        t(
          "rewardHub.capitalWithdraw.errors.twoFactorRequired",
          "Please enter your 2FA code.",
        ),
      );
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        toAddress: toAddress.trim(),
        chain: selectedChain,
        amount: parsedWithdrawAmount,
      };
      if (isTwoFactorEnabled) payload.twoFactorToken = twoFactorToken.trim();

      const response = await walletService.withdrawCapital(payload);

      if (response?.success) {
        setSuccess(
          response?.message ??
            t(
              "rewardHub.capitalWithdraw.success.default",
              "Capital withdrawal successful.",
            ),
        );
        setSuccessData(response?.data ?? null);
        setToAddress("");
        setTwoFactorToken("");
        setWithdrawAmount("");
        await fetchInvestments();
      } else {
        setError(
          response?.message ??
            t(
              "rewardHub.capitalWithdraw.errors.failed",
              "Capital withdrawal failed. Please try again.",
            ),
        );
      }
    } catch (err) {
      const msg =
        err?.message ??
        err?.data?.message ??
        t(
          "rewardHub.capitalWithdraw.errors.failed",
          "Capital withdrawal failed. Please try again.",
        );
      setError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const explorerUrl = successData?.txHash
    ? getExplorerUrl(successData.chain, successData.txHash)
    : null;

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
          aria-label={t("rewardHub.capitalWithdraw.backAriaLabel", "Back")}
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
          {t("rewardHub.capitalWithdraw.title", "Capital Withdrawal")}
        </Typography>
        <Box>
          <Button
            onClick={() => navigate("/reward-hub/withdraw")}
            aria-label={t(
              "rewardHub.capitalWithdraw.regularWithdrawAriaLabel",
              "Regular withdrawal",
            )}
            sx={{
              textTransform: "none",
              fontSize: FONT_SIZE.BODY2,
              color: AppColors.TXT_MAIN,
            }}
          >
            {t(
              "rewardHub.capitalWithdraw.regularWithdrawButton",
              "Regular Withdrawal",
            )}
          </Button>
          <IconButton
            onClick={() =>
              navigate("/reward-hub/transaction-history", {
                state: { type: "WITHDRAWAL" },
              })
            }
            aria-label={t(
              "rewardHub.capitalWithdraw.historyAriaLabel",
              "Withdrawal history",
            )}
            sx={{
              color: AppColors.TXT_MAIN,
              p: 1,
              "&:hover": { bgcolor: AppColors.HLT_LIGHT },
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
                onClose={() => {
                  setSuccess(null);
                  setSuccessData(null);
                }}
                sx={{
                  bgcolor: `${AppColors.SUCCESS}15`,
                  color: AppColors.SUCCESS,
                  border: `1px solid ${AppColors.SUCCESS}40`,
                  "& .MuiAlert-icon": { color: AppColors.SUCCESS },
                }}
              >
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  <Typography variant="body2">{success}</Typography>
                  {successData && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: AppColors.TXT_SUB }}
                      >
                        {t(
                          "rewardHub.capitalWithdraw.success.netAmount",
                          "Net amount",
                        )}
                        : {successData.netAmount} USDT
                      </Typography>
                      {explorerUrl && (
                        <Button
                          size="small"
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                          sx={{
                            textTransform: "none",
                            color: AppColors.GOLD_PRIMARY,
                            fontSize: FONT_SIZE.CAPTION,
                            mt: 0.5,
                            display: "block",
                          }}
                        >
                          {t(
                            "rewardHub.capitalWithdraw.success.viewExplorer",
                            "View on Explorer",
                          )}
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Alert>
            )}
          </Box>
        )}

        {/* Summary card */}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Savings sx={{ color: AppColors.GOLD_PRIMARY, fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t(
                "rewardHub.capitalWithdraw.totalCapitalBalance",
                "Total Capital Balance",
              )}
            </Typography>
          </Box>
          {investmentsLoading ? (
            <Box sx={{ py: 1 }}>
              <BTLoader />
            </Box>
          ) : (
            <Typography
              variant="h5"
              sx={{ color: AppColors.GOLD_PRIMARY, fontWeight: 600 }}
            >
              {totalCapitalBalance.toFixed(2)} USDT
            </Typography>
          )}
          {!investmentsLoading && (
            <Typography
              variant="caption"
              sx={{ color: AppColors.TXT_SUB, display: "block", mt: 0.5 }}
            >
              {t(
                "rewardHub.capitalWithdraw.maxWithdrawable",
                "Max withdrawable",
              )}
              : {maxWithdrawable.toFixed(2)} USDT
            </Typography>
          )}
        </Box>

        {/* Loading state - investments list */}
        {investmentsLoading && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <BTLoader />
            <Typography sx={{ mt: 2, color: AppColors.TXT_SUB }}>
              {t("rewardHub.capitalWithdraw.loading", "Loading investments...")}
            </Typography>
          </Box>
        )}

        {/* Form */}
        {!investmentsLoading > 0 && (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label={t(
                "rewardHub.capitalWithdraw.amountLabel",
                "Withdraw amount (USDT)",
              )}
              value={withdrawAmount}
              onChange={(e) => {
                setWithdrawAmount(e.target.value);
              }}
              placeholder={t(
                "rewardHub.capitalWithdraw.amountPlaceholder",
                "Enter amount",
              )}
              fullWidth
              inputProps={{ inputMode: "decimal" }}
              error={withdrawAmount !== "" && !amountValidation.isValid}
              helperText={amountValidation.helperText}
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
                "& .MuiFormHelperText-root": { color: AppColors.ERROR },
              }}
            />
            <Button
              type="button"
              variant="outlined"
              onClick={() => setWithdrawAmount(maxWithdrawable.toFixed(2))}
              disabled={submitLoading || maxWithdrawable <= 0}
              sx={{
                textTransform: "none",
                alignSelf: "flex-start",
                borderColor: AppColors.BORDER_MAIN,
                color: AppColors.TXT_MAIN,
                "&:hover": {
                  borderColor: AppColors.GOLD_PRIMARY,
                  bgcolor: AppColors.HLT_LIGHT,
                },
              }}
              size="small"
            >
              {t("rewardHub.capitalWithdraw.maxButton", "Use max")}
            </Button>

            <TextField
              label={t(
                "rewardHub.capitalWithdraw.addressLabel",
                "Withdrawal address (USDT wallet)",
              )}
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder={t(
                "rewardHub.capitalWithdraw.addressPlaceholder",
                "0x...",
              )}
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
                {t("rewardHub.capitalWithdraw.networkLabel", "Network")}
              </Typography>
              <Select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                displayEmpty
                renderValue={(v) => {
                  if (!v)
                    return t(
                      "rewardHub.capitalWithdraw.selectNetworkPlaceholder",
                      "Select network",
                    );
                  const c = CHAINS.find((x) => x.value === v);
                  return c
                    ? t(`rewardHub.capitalWithdraw.chains.${c.labelKey}`, c.labelKey)
                    : v;
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
                  {t(
                    "rewardHub.capitalWithdraw.selectNetworkPlaceholder",
                    "Select network",
                  )}
                </MenuItem>
                {CHAINS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {t(`rewardHub.capitalWithdraw.chains.${c.labelKey}`, c.labelKey)}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {isTwoFactorEnabled && (
              <TextField
                label={t("rewardHub.capitalWithdraw.twoFactorLabel", "2FA code")}
                value={twoFactorToken}
                onChange={(e) =>
                  setTwoFactorToken(e.target.value.replace(/\\D/g, "").slice(0, 6))
                }
                placeholder={t(
                  "rewardHub.capitalWithdraw.twoFactorPlaceholder",
                  "000000",
                )}
                inputProps={{ maxLength: 6 }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ mr: 1, display: "flex" }}>
                      <SecurityIcon
                        sx={{ color: AppColors.GOLD_PRIMARY, fontSize: 20 }}
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

            {withdrawAmount !== "" && (
              <Box
                sx={{
                  bgcolor: AppColors.BG_CARD,
                  borderRadius: BORDER_RADIUS.XS,
                  border: `1px solid ${AppColors.BORDER_MAIN}`,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
                  {t("rewardHub.capitalWithdraw.receiveLabel", "You will receive")}:
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: AppColors.GOLD_PRIMARY, fontWeight: 600 }}
                >
                  {amountValidation.isValid
                    ? `${netReceiveEstimate.toFixed(2)} USDT`
                    : "—"}
                </Typography>
                {!qualifiesForNoPenalty &&
                  penaltyPercentage > 0 &&
                  amountValidation.isValid && (
                    <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
                      {t(
                        "rewardHub.capitalWithdraw.penaltyDeducted",
                        "Estimated penalty",
                      )}
                      : {penaltyChargeEstimate.toFixed(2)} USDT ({penaltyPercentage}%)
                    </Typography>
                  )}
              </Box>
            )}

            {!investmentsLoading && penalty && !qualifiesForNoPenalty && (
              <Box
                sx={{
                  bgcolor: `${AppColors.ERROR}0D`,
                  borderRadius: BORDER_RADIUS.XS,
                  border: `1px solid ${AppColors.ERROR}30`,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: AppColors.TXT_MAIN, fontWeight: 600, mb: 0.5 }}
                >
                  {t(
                    "rewardHub.capitalWithdraw.penaltyDetailsTitle",
                    "Penalty details",
                  )}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: AppColors.TXT_SUB, display: "block" }}
                >
                  {t(
                    "rewardHub.capitalWithdraw.penaltyPercentageLabel",
                    "Penalty percentage",
                  )}
                  : {penaltyPercentage}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: AppColors.TXT_SUB, display: "block" }}
                >
                  {t(
                    "rewardHub.capitalWithdraw.totalInvestmentLabel",
                    "Total investment",
                  )}
                  : {Number(penalty.totalInvestment ?? 0).toFixed(2)} USDT
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: AppColors.TXT_SUB, display: "block" }}
                >
                  {t("rewardHub.capitalWithdraw.totalRoiLabel", "Total ROI")}:{" "}
                  {Number(penalty.totalROI ?? 0).toFixed(2)} USDT
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: AppColors.TXT_SUB, display: "block", mt: 0.5 }}
                >
                  {t(
                    "rewardHub.capitalWithdraw.penaltyExplain",
                    "A penalty applies because your ROI does not qualify for a penalty-free withdrawal yet.",
                  )}
                </Typography>
              </Box>
            )}

            <Typography
              variant="caption"
              sx={{
                color: AppColors.TXT_SUB,
                display: "block",
              }}
            >
              {t(
                "rewardHub.capitalWithdraw.notice",
                "Enter an amount up to your max withdrawable. Ensure the address and network match your USDT wallet.",
              )}
            </Typography>

            <Button
              type="submit"
              className="btn-primary"
              disabled={
                submitLoading ||
                investmentsLoading ||
                !amountValidation.isValid ||
                !toAddress?.trim() ||
                toAddress.length < 20 ||
                !selectedChain?.trim() ||
                (isTwoFactorEnabled && !twoFactorToken?.trim())
              }
              fullWidth
              sx={{
                py: 1.5,
                alignSelf: "center",
                fontSize: FONT_SIZE.BODY,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 10,
              }}
            >
              {submitLoading ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <BTLoader />
                </Box>
              ) : (
                t("rewardHub.capitalWithdraw.submitButton", "Withdraw capital")
              )}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
