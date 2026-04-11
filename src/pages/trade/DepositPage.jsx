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
  KeyboardArrowDown,
  History,
  Share,
  CheckCircle,
  ArrowBackIosNew,
} from "@mui/icons-material";
import BTLoader from "../../components/Loader";
import { AppColors } from "../../constant/appColors";
import binDep from "../../assets/images/binDep.png";
import polDep from "../../assets/images/polDep.png";
import depositService from "../../services/depositService";
import { copyToClipboard } from "../../utils/utils";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { FONT_SIZE } from "../../constant/lookUpConstant";

const CHAIN_KEYS = ["BSC", "POLYGON"];
const CHAIN_ICONS = {
  BSC: binDep,
  POLYGON: polDep,
};

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
      const response = await depositService.getDepositAddress(chain);
      if (response.success) {
        setSelectedChainData(response?.data);
      } else {
        setError(
          response.message ||
            t("deposit.errors.fetchFailed", "Failed to fetch deposit address"),
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          t("deposit.errors.fetchFailed", "Failed to fetch deposit address"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositAddress(selectedChain);
  }, []);

  // Copy address to clipboard with fallback for mobile browsers
  const handleCopyAddress = async () => {
    await copyToClipboard(selectedChainData?.address, setCopied);
  };

  // Share address
  const handleShareAddress = async () => {
    if (navigator.share && selectedChainData?.address) {
      try {
        await navigator.share({
          title: t("deposit.share.title", "{{chain}} Deposit Address", {
            chain: selectedChain,
          }),
          text: t(
            "deposit.share.text",
            "Deposit {{chain}} to this address:\n{{address}}",
            {
              chain: selectedChain,
              address: selectedChainData?.address,
            },
          ),
        });
      } catch (err) {
        console.error("Failed to share:", err);
      }
    } else {
      handleCopyAddress();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: "#FFFFFF",
        pb: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ` + AppColors.BORDER_MAIN,
          px: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{ color: AppColors.TXT_MAIN, px: 0.75 }}
          aria-label={t("deposit.backAriaLabel", "Back")}
        >
          <ArrowBackIosNew sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("deposit.header.title", "Trade Deposit")}
        </Typography>
        <IconButton
          onClick={() => navigate("/deposit-history")}
          sx={{
            color: "#FFFFFF",
            p: 1,
          }}
        >
          <History />
        </IconButton>
      </Box>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ color: AppColors.ERROR, mb: 1 }}>
            {error}
          </Typography>
        </Box>
      )}
      <Box sx={{ px: 2, pt: 1 }}>
        {/* Select Coin */}
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="body1"
            sx={{
              color: AppColors.TXT_MAIN,
              mb: 1,
            }}
          >
            {t("deposit.selectCoinLabel", "Select Chain")}
          </Typography>
          <FormControl fullWidth>
            <Select
              value={selectedChain}
              onChange={(e) => {
                setSelectedChain(e.target.value);
                fetchDepositAddress(e.target.value);
              }}
              sx={{
                bgcolor: "#1A1A1A",
                color: "#FFFFFF",
                borderRadius: "12px",
                border: "none",
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                "& .MuiSelect-icon": {
                  color: "#FFFFFF",
                },
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  py: 1,
                },
              }}
              IconComponent={KeyboardArrowDown}
            >
              {CHAIN_KEYS.map((chainValue) => (
                <MenuItem key={chainValue} value={chainValue}>
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
                        src={CHAIN_ICONS[chainValue]}
                        alt={t(
                          `deposit.chains.${chainValue}.label`,
                          chainValue === "BSC" ? "BEP20 (Binance Smart Chain)" : "POLYGON",
                        )}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: AppColors.TXT_MAIN,
                        }}
                      >
                        {t(
                          `deposit.chains.${chainValue}.label`,
                          chainValue === "BSC" ? "BEP20 (Binance Smart Chain)" : "POLYGON",
                        )}
                      </Typography>
                      {/* <Typography
                        variant="body2"
                        sx={{
                          color: "#999999",
                        }}
                      >
                        {chainValue === "BSC" ? "Bep20" : "POLYGON"}
                      </Typography> */}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {/* Deposit Address Section */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body1"
            sx={{
              color: AppColors.TXT_MAIN,
              mb: 1,
            }}
          >
            {t("deposit.addressLabel", "Deposit Address")}
          </Typography>
          <Box
            sx={{
              bgcolor: "#1A1A1A",
              borderRadius: "12px",
              p: 2,
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
                  alt={t("deposit.qrCodeAlt", "QR Code")}
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
                    bgcolor: "#FFFFFF",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BTLoader />
                </Box>
              )}
            </Box>

            {/* Support Text */}
            <Typography
              variant="body2"
              sx={{
                color: AppColors.TXT_SUB,
                mb: 2,
                textAlign: "center",
              }}
            >
              {t("deposit.onlySupport", "Only support {{chain}}", {
                chain: selectedChain === "BSC" ? "BEP20" : "POLYGON",
              })}
            </Typography>

            {/* Deposit Address */}
            <Box sx={{ width: "100%" }}>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_SUB,
                  mb: 0.5,
                }}
              >
                {t("deposit.addressLabel", "Deposit Address")}
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
                  variant="body1"
                  sx={{
                    color: AppColors.TXT_MAIN,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    flex: 1,
                  }}
                >
                  {loading
                    ? t("deposit.loading", "Loading...")
                    : selectedChainData?.address}
                </Typography>
                <IconButton
                  onClick={handleCopyAddress}
                  sx={{
                    p: 0.5,
                    minWidth: "auto",
                  }}
                >
                  {copied ? (
                    <CheckCircle sx={{ fontSize: 18, color: "#4CAF50" }} />
                  ) : (
                    <ContentCopy sx={{ fontSize: 18, color: "#FFFFFF" }} />
                  )}
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tips Section */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body1"
            sx={{
              color: AppColors.TXT_MAIN,
              mb: 1.5,
              fontWeight: 600,
            }}
          >
            {t("deposit.tipsTitle", "Tips")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {[
              t("deposit.tips.minimum", "Minimum Deposit: 1 USDT", {
                chain: selectedChain,
              }),
              t(
                "deposit.tips.confirmations",
                "Deposit confirmation: 2 network confirmations",
              ),
              t(
                "deposit.tips.onlyThisAsset",
                "Please do not deposit assets other than {{chain}} to the above address, otherwise it may result in asset loss.",
                { chain: selectedChain === "BSC" ? "BEP20" : "POLYGON" },
              ),
              t(
                "deposit.tips.security",
                "Please ensure the security of your mobile devices to prevent information from being tampered with or leaked",
              ),
            ].map((tip, index) => (
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
                    bgcolor: "#FFFFFF",
                    mt: 1,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_SUB,
                  }}
                >
                  {tip}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Button
            className="btn-primary"
            fullWidth
            onClick={handleShareAddress}
            startIcon={<Share />}
          >
            {t("deposit.shareCta", "Share Address")}
          </Button>
          <Typography
            variant="caption"
            sx={{ color: AppColors.TXT_SUB, textAlign: { xs: "center", md: "left" } }}
          >
            {t(
              "deposit.verifyHelperHint",
              "Only use verification if your deposit has not been credited after network confirmation.",
            )}
            <Button
              variant="text"
              size="small"
              onClick={() =>
                navigate("/verify-deposit", { state: { chain: selectedChain } })
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
    </Box>
  );
}
