import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import {
  ContentCopy,
  ArrowBack,
  KeyboardArrowDown,
  History,
  Share,
  CheckCircle,
} from "@mui/icons-material";
import BTLoader from "../../components/Loader";
import { AppColors } from "../../constant/appColors";
import {
  FONT_SIZE,
  SPACING,
  BORDER_RADIUS,
} from "../../constant/lookUpConstant";
import binDep from "../../assets/images/binDep.png";
import polDep from "../../assets/images/polDep.png";
import { copyToClipboard } from "../../utils/utils";
import walletService from "../../services/secondGameServices/walletService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const CHAINS = [
  { value: "BSC", labelKey: "networkBsc", icon: binDep, disabled: false },
  // { value: "ETH", labelKey: "networkEth", icon: ethDep, disabled: false },
  {
    value: "POLYGON",
    labelKey: "networkPolygon",
    icon: polDep,
    disabled: false,
  },
];

export default function DepositPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [selectedChain, setSelectedChain] = useState("BSC");
  const [selectedChainData, setSelectedChainData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchDepositAddress = async (chain) => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletService.getDepositAddress(chain);
      if (response.success) {
        setSelectedChainData(response?.data);
      } else {
        setError(
          response.message ||
            t(
              "rewardHub.deposit.errors.fetchFailed",
              "Failed to fetch deposit address",
            ),
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          t(
            "rewardHub.deposit.errors.fetchFailed",
            "Failed to fetch deposit address",
          ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositAddress(selectedChain);
  }, [selectedChain]);

  // Copy address to clipboard with fallback for mobile browsers
  const handleCopyAddress = async () => {
    await copyToClipboard(selectedChainData?.address, setCopied);
  };

  // Share address
  const handleShareAddress = async () => {
    if (navigator.share && selectedChainData?.address) {
      try {
        await navigator.share({
          title: t(
            "rewardHub.deposit.shareTitle",
            "{{chain}} Deposit Address",
            { chain: selectedChain },
          ),
          text: t(
            "rewardHub.deposit.shareText",
            "Deposit {{chain}} to this address:\n{{address}}",
            { chain: selectedChain, address: selectedChainData?.address },
          ),
        });
      } catch (err) {
        console.error("Failed to share:", err);
      }
    } else {
      handleCopyAddress();
    }
  };

  const currency = selectedChainData?.currency ?? "USDT";
  const minimumDeposit = selectedChainData?.minimumDeposit ?? 1;
  const tips = [
    t(
      "rewardHub.deposit.tips.min",
      "Minimum deposit: {{amount}} {{currency}}",
      {
        amount: minimumDeposit,
        currency,
      },
    ),
    t(
      "rewardHub.deposit.tips.confirmations",
      "Deposit confirmation: 2 network confirmations",
    ),
    t(
      "rewardHub.deposit.tips.assetWarning",
      "Do not send assets other than {{currency}} on {{chain}} to this address, or they may be lost.",
      { currency, chain: selectedChain },
    ),
    t(
      "rewardHub.deposit.tips.security",
      "Keep your device secure to prevent tampering or leaks.",
    ),
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: AppColors.TXT_MAIN,
        pb: 2,
        bgcolor: AppColors.BG_MAIN,
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
          aria-label={t("tradeTop.backAriaLabel", "Back")}
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
          {t("rewardHub.deposit.title", "Deposit")}
        </Typography>
        <IconButton
          onClick={() =>
            navigate("/reward-hub/transaction-history", {
              state: { type: "DEPOSIT" },
            })
          }
          sx={{
            color: AppColors.TXT_MAIN,
            p: 1,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <History />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pt: SPACING.MD }}>
        {error && (
          <Typography
            sx={{
              fontSize: FONT_SIZE.BODY2,
              color: AppColors.ERROR,
              mb: 1,
            }}
          >
            {error}
          </Typography>
        )}
        {/* Select network */}
        <Box sx={{ mb: SPACING.MD }}>
          <Typography
            sx={{
              fontSize: FONT_SIZE.BODY2,
              color: AppColors.TXT_SUB,
              mb: 1,
            }}
          >
            {t("rewardHub.deposit.selectNetwork", "Select network")}
          </Typography>
          <FormControl fullWidth>
            <Select
              value={selectedChain}
              onChange={(e) => {
                setSelectedChain(e.target.value);
                fetchDepositAddress(e.target.value);
              }}
              sx={{
                bgcolor: AppColors.BG_CARD,
                color: AppColors.TXT_MAIN,
                borderRadius: BORDER_RADIUS.XS,
                border: `1px solid ${AppColors.BORDER_MAIN}`,
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "& .MuiSelect-icon": { color: AppColors.TXT_MAIN },
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  py: 1,
                  fontSize: FONT_SIZE.BODY,
                },
              }}
              IconComponent={KeyboardArrowDown}
            >
              {CHAINS.map((chain) => (
                <MenuItem key={chain.value} value={chain.value}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      width: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                      }}
                    >
                      <img
                        src={chain.icon}
                        alt={t("rewardHubDeposit." + chain.labelKey)}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: FONT_SIZE.BODY,
                          fontWeight: 600,
                          color: AppColors.TXT_MAIN,
                        }}
                      >
                        {t("rewardHubDeposit." + chain.labelKey)}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: FONT_SIZE.CAPTION,
                          color: AppColors.TXT_SUB,
                        }}
                      >
                        {chain.value}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {/* Deposit Address Section */}
        <Box sx={{ mb: SPACING.LG }}>
          <Typography
            variant="body"
            sx={{
              color: AppColors.TXT_MAIN,
              mb: 1,
            }}
          >
            {t("rewardHub.deposit.depositAddressLabel", "Deposit address")}
          </Typography>
          <Box
            sx={{
              bgcolor: AppColors.BG_CARD,
              borderRadius: BORDER_RADIUS.XS,
              border: `1px solid ${AppColors.BORDER_MAIN}`,
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* QR Code */}
            <Box
              sx={{
                position: "relative",
                width: 200,
                height: 200,
                mb: 2,
              }}
            >
              {!loading ? (
                <Box
                  component="img"
                  src={selectedChainData?.qrCode}
                  alt={t("rewardHub.deposit.qrAlt", "Deposit address QR code")}
                  sx={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    bgcolor: AppColors.BG_CARD,
                    borderRadius: BORDER_RADIUS.XS,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BTLoader />
                </Box>
              )}
            </Box>

            {/* Network note */}
            <Typography
              sx={{
                fontSize: FONT_SIZE.CAPTION,
                color: AppColors.TXT_SUB,
                mb: 2,
                textAlign: "center",
              }}
            >
              {t(
                "rewardHub.deposit.networkNote",
                "Only {{chain}} network is supported for this address",
                { chain: selectedChain },
              )}
            </Typography>

            {/* Deposit Address */}
            <Box sx={{ width: "100%", mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_SUB,
                  mb: 0.5,
                }}
              >
                {t("rewardHub.deposit.depositAddressLabel", "Deposit address")}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_MAIN,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    flex: 1,
                  }}
                >
                  {loading
                    ? t("rewardHub.deposit.addressLoading", "Loading...")
                    : selectedChainData?.address}
                </Typography>
                <IconButton
                  onClick={handleCopyAddress}
                  sx={{
                    p: 0.5,
                    minWidth: "auto",
                    color: AppColors.TXT_MAIN,
                    "&:hover": { bgcolor: AppColors.HLT_LIGHT },
                  }}
                >
                  {copied ? (
                    <CheckCircle
                      sx={{ fontSize: 18, color: AppColors.SUCCESS }}
                    />
                  ) : (
                    <ContentCopy sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tips */}
        <Box sx={{ mb: SPACING.LG }}>
          <Typography
            variant="body2"
            sx={{
              color: AppColors.TXT_MAIN,
              mb: 1.5,
            }}
          >
            {t("rewardHub.deposit.tipsTitle", "Important")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {tips.map((tip, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: AppColors.GOLD_PRIMARY,
                    mt: 1,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_SUB,
                    lineHeight: 1.6,
                  }}
                >
                  {tip}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Button
          fullWidth
          onClick={handleShareAddress}
          startIcon={<Share />}
          className="btn-primary"
        >
          {t("rewardHub.deposit.shareButton", "Share address")}
        </Button>
        <Typography
          variant="caption"
          sx={{ color: AppColors.TXT_SUB, textAlign: "center" }}
        >
          {t(
            "rewardHub.deposit.verifyHelperHint",
            "Only use verification if your deposit has not been credited after network confirmation.",
          )}
          <Button
            variant="text"
            size="small"
            onClick={() =>
              navigate("/reward-hub/verify-deposit", {
                state: { chain: selectedChain },
              })
            }
            sx={{
              textTransform: "none",
              color: AppColors.GOLD_PRIMARY,
              fontSize: FONT_SIZE.CAPTION,
            }}
          >
            {t("rewardHub.deposit.verifyCta", "Verify transaction")}
          </Button>
        </Typography>
      </Box>
    </Box>
  );
}
