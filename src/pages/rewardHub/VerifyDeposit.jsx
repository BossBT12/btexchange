import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
import { ArrowBack, OpenInNew } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { AppColors } from "../../constant/appColors";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "../../constant/lookUpConstant";
import walletService from "../../services/secondGameServices/walletService";
import BTLoader from "../../components/Loader";
import useSnackbar from "../../hooks/useSnackbar";

const CHAINS = [
  { value: "BSC", labelKey: "networkBsc" },
  { value: "POLYGON", labelKey: "networkPolygon" },
];

const getExplorerUrl = (chain, txHash) => {
  if (!txHash) return null;
  const explorers = {
    BSC: `https://bscscan.com/tx/${txHash}`,
    POLYGON: `https://polygonscan.com/tx/${txHash}`,
  };
  return explorers[chain] || null;
};

export default function VerifyDeposit() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const { showSnackbar } = useSnackbar();

  const initialChainRaw = (location.state?.chain || searchParams.get("chain") || "BSC").toString();
  const initialTxHashRaw = (location.state?.txHash || searchParams.get("txHash") || "").toString();
  const allowedChains = useMemo(() => new Set(CHAINS.map((c) => c.value)), []);
  const initialChain = allowedChains.has(initialChainRaw.toUpperCase())
    ? initialChainRaw.toUpperCase()
    : "BSC";
  const initialTxHash = initialTxHashRaw.trim();

  const [chain, setChain] = useState(initialChain);
  const [txHash, setTxHash] = useState(initialTxHash);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const explorerUrl = useMemo(
    () => getExplorerUrl(chain, successData?.txHash || txHash, successData?.message),
    [chain, successData?.txHash, txHash, successData?.message],
  );

  const canSubmit = useMemo(() => {
    const h = txHash.trim();
    if (!h) return false;
    if (!chain) return false;
    // basic tx hash validation for EVM chains
    return /^0x[a-fA-F0-9]{64}$/.test(h);
  }, [txHash, chain]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    if (!canSubmit) {
      setError(
        t(
          "rewardHub.verifyDeposit.errors.invalidInput",
          "Please enter a valid transaction hash and select network.",
        ),
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = { txHash: txHash.trim(), chain: String(chain).toUpperCase() };
      const res = await walletService.verifyDeposit(payload);
      if (res?.success) {
        setSuccessData(res?.data ?? { txHash: txHash.trim(), chain, message: res?.message });
        showSnackbar(
          res?.message ||
            t(
              "rewardHub.verifyDeposit.success",
              "Transaction submitted for verification.",
            ),
          "success",
        );
      } else {
        const msg =
          res?.message ||
          t(
            "rewardHub.verifyDeposit.errors.failed",
            "Verification failed. Please check the transaction hash and try again.",
          );
        setError(msg);
        showSnackbar(msg, "error");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t(
          "rewardHub.verifyDeposit.errors.failed",
          "Verification failed. Please check the transaction hash and try again.",
        );
      setError(msg);
      showSnackbar(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", color: AppColors.TXT_MAIN, bgcolor: AppColors.BG_MAIN, pb: 4 }}>
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
          aria-label={t("rewardHub.verifyDeposit.backAriaLabel", "Back")}
          sx={{ color: AppColors.TXT_MAIN, p: 1, "&:hover": { bgcolor: AppColors.HLT_LIGHT } }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}>
          {t("rewardHub.verifyDeposit.title", "Verify deposit")}
        </Typography>
        <Box sx={{ width: 44 }} />
      </Box>

      <Box sx={{ px: 2, pt: SPACING.MD, display: "flex", flexDirection: "column", gap: 2 }}>
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              bgcolor: AppColors.ERR_LIGHT,
              color: AppColors.ERROR,
              border: `1px solid ${AppColors.ERROR}40`,
              "& .MuiAlert-icon": { color: AppColors.ERROR },
            }}
          >
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleVerify}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, mb: 0.5 }}>
              {t("rewardHub.verifyDeposit.networkLabel", "Network")}
            </Typography>
            <Select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              fullWidth
              sx={{
                bgcolor: AppColors.BG_CARD,
                color: AppColors.TXT_MAIN,
                borderRadius: BORDER_RADIUS.XS,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: AppColors.BORDER_MAIN },
                "& .MuiSelect-select": { fontSize: FONT_SIZE.BODY },
              }}
            >
              {CHAINS.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {t(`rewardHubDeposit.${c.labelKey}`, c.value)}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <TextField
            label={t("rewardHub.verifyDeposit.txHashLabel", "Transaction hash")}
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder={t("rewardHub.verifyDeposit.txHashPlaceholder", "0x...")}
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

          <Typography variant="caption" sx={{ color: AppColors.TXT_SUB }}>
            {t(
              "rewardHub.verifyDeposit.help",
              "Paste your deposit transaction hash to verify your deposit.",
            )}
          </Typography>

          <Button
            type="submit"
            className="btn-primary"
            disabled={submitting || !canSubmit}
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
            {submitting ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BTLoader />
              </Box>
            ) : (
              t("rewardHub.verifyDeposit.verifyButton", "Verify transaction")
            )}
          </Button>
        </Box>

        {successData && (
          <Box
            sx={{
              bgcolor: AppColors.BG_CARD,
              borderRadius: BORDER_RADIUS.XS,
              border: `1px solid ${AppColors.BORDER_MAIN}`,
              p: 2,
            }}
          >
            <Typography sx={{ fontSize: FONT_SIZE.BODY2, color: AppColors.TXT_MAIN, fontWeight: 600 }}>
              {successData.message || t("rewardHub.verifyDeposit.verifiedTitle", "Verification requested")}
            </Typography>
            <Typography sx={{ fontSize: FONT_SIZE.CAPTION, color: AppColors.TXT_SUB, mt: 0.5, wordBreak: "break-all", fontFamily: "monospace" }}>
              {successData?.txHash || txHash}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              {explorerUrl && (
                <Button
                  size="small"
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: "none", color: AppColors.GOLD_PRIMARY }}
                >
                  {t("rewardHub.verifyDeposit.viewExplorer", "View on Explorer")}
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  navigate("/reward-hub/transaction-history", { state: { type: "DEPOSIT" } })
                }
                sx={{
                  textTransform: "none",
                  color: AppColors.TXT_MAIN,
                  borderColor: AppColors.BORDER_MAIN,
                  "&:hover": { borderColor: AppColors.GOLD_PRIMARY, bgcolor: AppColors.HLT_LIGHT },
                }}
              >
                {t("rewardHub.verifyDeposit.goToHistory", "Deposit history")}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}