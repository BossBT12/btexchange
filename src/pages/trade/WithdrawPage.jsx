import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  ArrowBackIosNew,
  AssignmentOutlined,
  Security,
  Refresh,
  OpenInNew,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { BORDER_RADIUS, FONT_SIZE } from "../../constant/lookUpConstant";
import useAuth from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { FaDiamond } from "react-icons/fa6";
import { Menu } from "@mui/material";
import withdrawalService from "../../services/withdrawalService";
import BTLoader from "../../components/Loader";
import { SiTether } from "react-icons/si";

const RULE_KEYS = [
  { textKey: "withdraw.rules.instant" },
  {
    textKey: "withdraw.rules.amountRange",
    highlightKey: "withdraw.rules.amountRangeHighlight",
  },
  { textKey: "withdraw.rules.confirmBeneficiary" },
  { textKey: "withdraw.rules.contactService" },
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

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Splits rule text into segments for normal vs highlighted display. */
function getRuleSegments(text, highlight) {
  if (!highlight) return [{ text, highlighted: false }];
  const parts = text.split(highlight);
  const segments = [];
  parts.forEach((part, i) => {
    if (part) segments.push({ text: part, highlighted: false });
    if (i < parts.length - 1)
      segments.push({ text: highlight, highlighted: true });
  });
  return segments.length ? segments : [{ text, highlighted: false }];
}

const CHAINS = [
  { value: "BSC", label: "BSC (Binance Smart Chain)", disabled: false },
  // { value: "ETH", label: "ETH (Ethereum)", disabled: true },
  { value: "POLYGON", label: "POLYGON", disabled: false },
];

export default function WithdrawPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "";

  const { userData } = useAuth();
  const isTwoFactorEnabled = Boolean(userData?.isTwoFactorEnabled);
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [amount, setAmount] = useState("");
  const receivedAmount = amount ? parseFloat(amount) || 0 : 0;
  const canSubmit = Boolean(amount && parseFloat(amount) > 0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedChain, setSelectedChain] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [twoFATkn, setTwoFATkn] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [open2fa, setOpen2fa] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [withdrawalHistory, setWithdrawalHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const currentAvailable = dashboardData?.totalAvailableForWithdraw || 0;
  const totalNeedToTrade = dashboardData?.totalNeedToTrade || 0;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handle2tfaClose = () => {
    setOpen2fa(false);
    setTwoFATkn("");
  };

  const handleChainSelect = (v) => {
    setSelectedChain(v);
    setAnchorEl(null);
  };

  const handleMaxClick = () => {
    if (currentAvailable > 0) setAmount(String(currentAvailable));
  };

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const response = await withdrawalService.getWithdrawStatus();
      setDashboardData(response?.data || response);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setError(null);
      const response = await withdrawalService.getWithdrawalHistory();
      if (response?.success) {
        setWithdrawalHistory(response.data || []);
      } else {
        setError(
          response?.message ||
            t(
              "withdraw.fetchHistoryFailed",
              "Failed to fetch withdrawal history",
            ),
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          t(
            "withdraw.fetchHistoryFailed",
            "Failed to fetch withdrawal history",
          ),
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError(
        t(
          "withdraw.errors.invalidAmount",
          "Please enter a valid withdrawal amount.",
        ),
      );
      return;
    }

    if (numericAmount > currentAvailable) {
      setError(
        t(
          "withdraw.errors.amountTooHigh",
          "Amount cannot be more than your available balance.",
        ),
      );
      return;
    }

    if (!walletAddress || walletAddress.length < 20) {
      setError(
        t(
          "withdraw.errors.invalidAddress",
          "Please enter a valid wallet address.",
        ),
      );
      return;
    }

    if (!selectedChain) {
      setError(t("withdraw.errors.selectNetwork", "Please select a network."));
      return;
    }

    setOpen2fa(true);
  };

  const finalSubmit = async () => {
    setError(null);
    setSuccess(null);
    const numericAmount = Number(amount);

    const twoFATokenTrimmed = twoFATkn.replace(/\D/g, "").slice(0, 6);
    if (isTwoFactorEnabled) {
      if (!twoFATokenTrimmed || twoFATokenTrimmed.length !== 6) {
        setError(
          t(
            "withdraw.errors.invalid2fa",
            "Please enter the 6-digit code from your authenticator app.",
          ),
        );
        return;
      }
    }

    try {
      setSubmitLoading(true);
      const payload = {
        amount: numericAmount,
        receiverAddress: walletAddress,
        chain: selectedChain,
        twoFactorToken: twoFATokenTrimmed,
      };

      const response = await withdrawalService.withdrawWinnings(payload);

      if (response?.success) {
        setSuccess(
          response.message ||
            t(
              "withdraw.submitSuccess",
              "Withdrawal request submitted successfully.",
            ),
        );
        setAmount("");
        setWalletAddress("");
        setTwoFATkn("");
        await fetchDashboard();
        await fetchHistory();
      } else {
        setError(
          response?.message ||
            t(
              "withdraw.submitFailed",
              "Unable to submit withdrawal. Please check your details and try again.",
            ),
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          t(
            "withdraw.submitFailed",
            "Unable to submit withdrawal. Please check your details and try again.",
          ),
      );
    } finally {
      setSubmitLoading(false);
      handle2tfaClose();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: AppColors.TXT_MAIN,
        backgroundColor: AppColors.BG_MAIN,
        pb: 3,
      }}
    >
      {/* Header: logo left, account right */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
          px: 1.5,
          py: 1,
          backgroundColor: AppColors.BG_MAIN,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => navigate(-1)}
            sx={{ color: AppColors.TXT_MAIN, p: 0.5 }}
            aria-label={t("withdraw.backAriaLabel", "Back")}
          >
            <ArrowBackIosNew sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: AppColors.TXT_MAIN,
              fontSize: FONT_SIZE.TITLE,
            }}
          >
            {t("withdraw.headerTitle", "Withdraw")} {type}
          </Typography>
        </Box>
      </Box>
      {(error || success) && (
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{
                mb: success ? 1 : 0,
                bgcolor: AppColors.ERR_LIGHT,
                color: AppColors.ERROR,
                border: `1px solid ${AppColors.ERROR}40`,
                "& .MuiAlert-icon": {
                  color: AppColors.ERROR,
                },
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
                "& .MuiAlert-icon": {
                  color: AppColors.SUCCESS,
                },
              }}
            >
              {success}
            </Alert>
          )}
        </Box>
      )}
      <Box sx={{ px: 1, pt: !type && 2 }}>
        {/* Withdrawal amount card */}
        {!type && (
          <>
            <Box
              sx={{
                backgroundColor: AppColors.BG_CARD,
                borderRadius: `${BORDER_RADIUS.LG}px`,
                border: `1px solid ${AppColors.BORDER_MAIN}`,
                mb: 2,
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                minHeight: 56,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                gap: 0,
                mx: "auto",
              }}
            >
              {/* Left: chain selector (icon + label) */}
              <Button
                onClick={handleClick}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                  gap: { xs: 0.5, sm: 1 },
                  p: 0,
                  pr: { xs: 1.5, sm: 1 },
                  minHeight: 44,
                  minWidth: 0,
                  flexShrink: 0,
                  borderRight: `1px solid ${AppColors.BORDER_MAIN}`,
                }}
              >
                {!selectedChain ? (
                  <Typography
                    variant="body2"
                    sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}
                  >
                    Select Network
                  </Typography>
                ) : (
                  <>
                    <Box sx={{ flexShrink: 0 }}>
                      <SiTether size={18} color={AppColors.GOLD_PRIMARY} />
                    </Box>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        color: AppColors.TXT_MAIN,
                        fontWeight: 600,
                        maxWidth: { xs: "10ch", sm: "12ch" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t(
                        `withdraw.chains.${selectedChain}`,
                        CHAINS?.find((i) => i.value === selectedChain)?.label ??
                          selectedChain,
                      )}
                    </Typography>
                  </>
                )}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                MenuListProps={{
                  sx: { maxHeight: "70vh", minWidth: 200 },
                }}
              >
                {CHAINS.map((chain, index) => (
                  <MenuItem
                    key={chain.value || index}
                    value={chain.value}
                    disabled={chain.disabled}
                    onClick={() => handleChainSelect(chain.value)}
                    selected={selectedChain === chain.value}
                    sx={{
                      backgroundColor:
                        selectedChain === chain.value
                          ? AppColors.BG_SECONDARY
                          : undefined,
                    }}
                  >
                    {t(`withdraw.chains.${chain.value}`, chain.label)}
                    {chain.disabled &&
                      t("withdraw.form.comingSoon", " (Coming soon)")}
                  </MenuItem>
                ))}
              </Menu>
              {/* Right: wallet address input */}
              <TextField
                fullWidth
                multiline
                value={walletAddress}
                placeholder={t(
                  "withdraw.form.enterAddress",
                  "Enter your address",
                )}
                onChange={(e) => setWalletAddress(e.target.value)}
                sx={{
                  pl: 1,
                  "& .MuiInputBase-root": {
                    p: 0,
                    border: "none",
                    background: "none",
                    color: AppColors.TXT_MAIN,
                  },
                  "& input": {
                    border: "none",
                    outline: "none",
                    py: 0,
                    px: 0,
                    fontSize: FONT_SIZE.BODY,
                  },
                  "& fieldset": {
                    border: "none",
                    outline: "none",
                  },
                }}
              />
            </Box>
            <Box
              sx={{
                backgroundColor: AppColors.BG_CARD,
                borderRadius: `${BORDER_RADIUS.LG}px`,
                border: `1px solid ${AppColors.BORDER_MAIN}`,
                p: 2,
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                placeholder={t(
                  "withdraw.placeholder",
                  "Please enter the amount",
                )}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        sx={{
                          color: AppColors.GOLD_PRIMARY,
                          fontWeight: 600,
                          fontSize: 20,
                        }}
                      >
                        $
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mx: "auto",
                  "& .MuiInputBase-root": {
                    borderRadius: 20,
                    px: 2.75,
                    backgroundColor: AppColors.BG_SECONDARY,
                    fontSize: FONT_SIZE.BODY,
                    "& fieldset": {
                      borderColor: AppColors.BORDER_MAIN,
                      borderRadius: 20,
                    },
                    "&:hover fieldset": {
                      borderColor: AppColors.BORDER_MAIN,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: AppColors.GOLD_PRIMARY,
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: AppColors.GOLD_PRIMARY,
                      opacity: 0.9,
                    },
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 3.25,
                  flexWrap: "wrap",
                  gap: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                    {t("withdraw.currentAvailable", "Withdrawable balance")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: AppColors.GOLD_PRIMARY,
                    }}
                  >
                    ${currentAvailable.toFixed(2)}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleMaxClick}
                  sx={{
                    textTransform: "none",
                    color: AppColors.GOLD_PRIMARY,
                    minWidth: 40,
                    px: 3.25,
                    py: 0,
                    fontSize: FONT_SIZE.BODY2,
                    "&:hover": {
                      backgroundColor: AppColors.BG_SECONDARY,
                    },
                  }}
                >
                  {t("withdraw.all", "All")}
                </Button>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 1,
                }}
              >
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                  {t("withdraw.amountReceived", "Withdrawal amount received")}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: AppColors.GOLD_PRIMARY,
                  }}
                >
                  ${receivedAmount.toFixed(2)}
                </Typography>
              </Box>
              <Button
                fullWidth
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="btn-primary"
                sx={{
                  mt: 3.25,
                  py: 1.5,
                  borderRadius: 8,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {t("withdraw.actions.withdraw", "Withdraw")}
              </Button>

              {/* Withdrawal rules card */}
              <Box
                component="section"
                aria-label={t("withdraw.rules.ariaLabel", "Withdrawal rules")}
                sx={{
                  backgroundColor: AppColors.BG_CARD,
                  borderRadius: `${BORDER_RADIUS.LG}px`,
                  border: `1px solid ${AppColors.BORDER_MAIN}`,
                  px: 2,
                  py: 3.25,
                  mt: 3.25,
                }}
              >
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
                  <Box
                    component="li"
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      mb: 1.25,
                    }}
                  >
                    <Box
                      component="span"
                      aria-hidden
                      sx={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        height: "1.5em",
                        lineHeight: 1.5,
                      }}
                    >
                      <FaDiamond color={AppColors.GOLD_PRIMARY} size={8} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: AppColors.TXT_SUB,
                        lineHeight: 1.5,
                      }}
                    >
                      {t("withdraw.needToTradeBefore", "Need to trade ")}
                      <Box
                        component="span"
                        sx={{
                          color: AppColors.GOLD_PRIMARY,
                          fontWeight: 600,
                        }}
                      >
                        ${totalNeedToTrade}
                      </Box>
                      {t(
                        "withdraw.needToTradeAfter",
                        " to be able to withdraw",
                      )}
                    </Typography>
                  </Box>
                  {RULE_KEYS.map((item, index) => {
                    const text = t(item.textKey);
                    const highlight = item.highlightKey
                      ? t(item.highlightKey)
                      : undefined;
                    const segments = getRuleSegments(text, highlight);
                    const isLast = index === RULE_KEYS.length - 1;
                    return (
                      <Box
                        component="li"
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                          mb: isLast ? 0 : 1.25,
                        }}
                      >
                        <Box
                          component="span"
                          aria-hidden
                          sx={{
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            height: "1.5em",
                            lineHeight: 1.5,
                          }}
                        >
                          <FaDiamond color={AppColors.GOLD_PRIMARY} size={8} />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: AppColors.TXT_SUB,
                            lineHeight: 1.5,
                          }}
                        >
                          {segments.map((seg, i) =>
                            seg.highlighted ? (
                              <Box
                                component="span"
                                key={i}
                                sx={{
                                  color: AppColors.GOLD_PRIMARY,
                                  fontWeight: 600,
                                }}
                              >
                                {seg.text}
                              </Box>
                            ) : (
                              <span key={i}>{seg.text}</span>
                            ),
                          )}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </>
        )}
        {/* Withdrawal history link */}
        <Box>
          {!type && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
                border: "none",
                background: "none",
                cursor: "pointer",
                color: AppColors.TXT_MAIN,
                fontFamily: "inherit",
                py: 1.25,
                borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
                justifyContent: "flex-start",
              }}
            >
              <AssignmentOutlined
                sx={{ fontSize: 22, color: AppColors.GOLD_PRIMARY }}
              />
              <Typography
                variant="h5"
                sx={{
                  color: AppColors.TXT_MAIN,
                  fontWeight: 500,
                }}
              >
                {t("withdraw.historyLink", "Withdrawal history")}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              mt: 1,
              overflow: "hidden",
            }}
          >
            {historyLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 6,
                }}
              >
                <BTLoader />
              </Box>
            ) : withdrawalHistory?.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  color: AppColors.TXT_SUB,
                }}
              >
                <IconButton
                  onClick={fetchHistory}
                  disabled={dashboardLoading}
                  sx={{
                    color: AppColors.GOLD_PRIMARY,
                    "&:hover": {
                      bgcolor: `${AppColors.GOLD_PRIMARY}15`,
                    },
                  }}
                >
                  <Refresh />
                </IconButton>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {t(
                    "withdraw.history.emptyTitle",
                    "No withdrawal history found",
                  )}
                </Typography>
                <Typography variant="body2">
                  {t(
                    "withdraw.history.emptyDescription",
                    "Your withdrawal requests will appear here after you submit them.",
                  )}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  pb: 3,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {withdrawalHistory.map((withdrawal, index) => {
                  const status = withdrawal.status || "REQUESTED";
                  const statusKeyMap = {
                    REQUESTED: "statusRequested",
                    CONFIRMED: "statusConfirmed",
                    SENT: "statusSent",
                    FAILED: "statusFailed",
                  };
                  const statusLabel = t(
                    `withdraw.history.${statusKeyMap[status] || status}`,
                    status,
                  );
                  const type =
                    withdrawal.type === "WITHDRAW_WORKING"
                      ? t("withdraw.history.typeWorking", "Working Income")
                      : t("withdraw.history.typeWinnings", "Winnings");
                  const statusColor =
                    status === "CONFIRMED"
                      ? AppColors.SUCCESS
                      : status === "SENT"
                        ? AppColors.GOLD_PRIMARY
                        : status === "FAILED"
                          ? AppColors.ERROR
                          : AppColors.TXT_SUB;

                  return (
                    <Box
                      key={withdrawal._id || index}
                      sx={{
                        p: { xs: 2, md: 3 },
                        bgcolor: AppColors.BG_SECONDARY,
                        borderRadius: 2,
                        border: `1px solid ${AppColors.GOLD_PRIMARY}10`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: AppColors.TXT_SUB,
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            {t("withdraw.history.amount", "Amount")}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              color: AppColors.GOLD_PRIMARY,
                              fontWeight: 600,
                            }}
                          >
                            {withdrawal.amount} USDT
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: AppColors.TXT_SUB,
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            {t("withdraw.history.type", "Type")}
                          </Typography>
                          <Chip
                            label={type}
                            size="small"
                            sx={{
                              bgcolor: `${AppColors.GOLD_PRIMARY}15`,
                              color: AppColors.GOLD_PRIMARY,
                              fontWeight: 500,
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: AppColors.TXT_SUB,
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            {t("withdraw.history.status", "Status")}
                          </Typography>
                          <Chip
                            label={statusLabel}
                            size="small"
                            sx={{
                              bgcolor: `${statusColor}15`,
                              color: statusColor,
                              fontWeight: 500,
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: AppColors.TXT_SUB,
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            {t("withdraw.history.date", "Date")}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: AppColors.TXT_MAIN,
                            }}
                          >
                            {formatDate(withdrawal.createdAt)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 1 }}>
                          {withdrawal.txHash && (
                            <Tooltip
                              title={t(
                                "withdraw.history.viewOnExplorer",
                                "View on blockchain explorer",
                              )}
                            >
                              <IconButton
                                component="a"
                                href={getExplorerUrl(
                                  withdrawal.chain,
                                  withdrawal.txHash,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                sx={{
                                  color: AppColors.GOLD_PRIMARY,
                                  "&:hover": {
                                    bgcolor: `${AppColors.GOLD_PRIMARY}15`,
                                  },
                                }}
                              >
                                <OpenInNew fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Grid>
                      </Grid>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: AppColors.TXT_SUB,
                            wordBreak: "break-all",
                            flex: 1,
                          }}
                        >
                          {t("withdraw.history.walletLabel", "Wallet:")}{" "}
                          {withdrawal.walletAddress}
                        </Typography>
                        {withdrawal.chain && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: AppColors.TXT_SUB,
                            }}
                          >
                            {t("withdraw.history.networkLabel", "Network:")}{" "}
                            {withdrawal.chain}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <Dialog
        open={open2fa}
        onClose={handle2tfaClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, padding: 1 },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Security color="primary" />
          {t("withdraw.twofaDialog.title", "Two-Factor Authentication")}
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t(
              "withdraw.twofaDialog.description",
              "Please enter the 6-digit verification code from your authenticator app.",
            )}
          </Typography>

          <Box mt={1}>
            <TextField
              autoFocus
              fullWidth
              label={t("withdraw.twofaDialog.label", "Authentication Code")}
              variant="outlined"
              value={twoFATkn}
              onChange={(e) => setTwoFATkn(e.target.value)}
              inputProps={{
                maxLength: 6,
                inputMode: "numeric",
                pattern: "[0-9]*",
                style: {
                  textAlign: "center",
                  fontSize: "1.2rem",
                  letterSpacing: "8px",
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: "16px 24px" }}>
          <Button onClick={handle2tfaClose} color="inherit">
            {t("withdraw.twofaDialog.cancel", "Cancel")}
          </Button>

          <Button
            className="btn-primary"
            onClick={finalSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              t("withdraw.twofaDialog.verify", "Verify")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// import { useEffect, useMemo, useState } from "react";
// import {
//   Alert,
//   Box,
//   Button,
//   Card,
//   CardContent,
//   Chip,
//   Container,
//   Grid,
//   IconButton,
//   MenuItem,
//   Select,
//   Tab,
//   Tabs,
//   TextField,
//   Tooltip,
//   Typography,
// } from "@mui/material";
// import BTLoader from "../../components/Loader";
// import {
//   AttachMoney,
//   CheckCircle,
//   ChevronLeft,
//   InfoOutlined,
//   Lock,
//   OpenInNew,
//   Refresh,
//   TrendingUp,
// } from "@mui/icons-material";
// import { AppColors } from "../../constant/appColors";
// import dashboardServices from "../../services/dashboardServices";
// import withdrawalService from "../../services/withdrawalService";
// import { useLocation, useNavigate } from "react-router-dom";
// import { FONT_SIZE, SPACING } from "../../constant/lookUpConstant";
// import useAuth from "../../hooks/useAuth";
// import { useTranslation } from "react-i18next";
// import { TRADE_NAMESPACE } from "../../i18n";

// const CHAINS = [
//   { value: "BSC", label: "BSC (Binance Smart Chain)", disabled: false },
//   { value: "ETH", label: "ETH (Ethereum)", disabled: true },
//   { value: "POLYGON", label: "POLYGON", disabled: true },
// ];

// const getExplorerUrl = (chain, txHash) => {
//   const explorers = {
//     BSC: `https://bscscan.com/tx/${txHash}`,
//     ETH: `https://etherscan.io/tx/${txHash}`,
//     POLYGON: `https://polygonscan.com/tx/${txHash}`,
//   };
//   return explorers[chain] || "#";
// };

// const formatDate = (dateString) => {
//   const date = new Date(dateString);
//   return date.toLocaleString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const typeMeta = {
//   WINNINGS: {
//     key: "withdrawableWinnings",
//     title: "Withdraw Winnings",
//     description: "Profits from trading that are unlocked for withdrawal.",
//     color: AppColors.SUCCESS,
//     icon: TrendingUp,
//   },
//   WORKING: {
//     key: "totalWorkingIncome",
//     title: "Withdraw Working Income",
//     description: "Referral, level and salary income available to withdraw.",
//     color: AppColors.GOLD_PRIMARY,
//     icon: AttachMoney,
//   },
// };

// export default function WithdrawPage() {
//   const navigate = useNavigate();
//   const { userData } = useAuth();
//   const { t } = useTranslation(TRADE_NAMESPACE);
//   const isTwoFactorEnabled = Boolean(userData?.isTwoFactorEnabled);
//   const { type: initialType } = useLocation().state ?? {};
//   const [activeTab, setActiveTab] = useState(initialType === "history" ? 1 : 0);
//   const [dashboardData, setDashboardData] = useState(null);
//   const [dashboardLoading, setDashboardLoading] = useState(true);

//   const [selectedType, setSelectedType] = useState("WINNINGS");
//   const [selectedChain, setSelectedChain] = useState("BSC");
//   const [amount, setAmount] = useState("");
//   const [walletAddress, setWalletAddress] = useState("");
//   const [twoFATkn, setTwoFATkn] = useState("");

//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [historyLoading, setHistoryLoading] = useState(false);
//   const [withdrawalHistory, setWithdrawalHistory] = useState([]);

//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);

//   const balances = dashboardData?.balances || {};
//   const incomes = dashboardData?.incomes || {};
//   const stats = dashboardData?.stats || {};

//   const canWithdrawWinnings = stats?.withdrawableWinningsUnlocked ?? stats?.withdrawUnlocked;
//   const canWithdrawWorking = stats?.canWithdrawWorkingIncome ?? false;

//   const availableAmounts = useMemo(
//     () => ({
//       WINNINGS: Number(balances?.withdrawableWinnings || 0),
//       WORKING: Number(balances?.totalWorkingIncome || 0),
//     }),
//     [balances]
//   );

//   const currentAvailable = availableAmounts[selectedType] || 0;
//   const isEligible =
//     selectedType === "WINNINGS" ? canWithdrawWinnings : canWithdrawWorking;

//   const SelectedIcon = typeMeta[selectedType].icon;

//   const fetchDashboard = async () => {
//     try {
//       setDashboardLoading(true);
//       const response = await dashboardServices.getDashboardData();
//       setDashboardData(response?.data || response);
//     } catch (err) {
//       console.error("Error fetching dashboard data:", err);
//     } finally {
//       setDashboardLoading(false);
//     }
//   };

//   const fetchHistory = async () => {
//     try {
//       setHistoryLoading(true);
//       setError(null);
//       const response = await withdrawalService.getWithdrawalHistory();
//       if (response?.success) {
//         setWithdrawalHistory(response.data || []);
//       } else {
//         setError(response?.message || t("withdraw.fetchHistoryFailed", "Failed to fetch withdrawal history"));
//       }
//     } catch (err) {
//       setError(err?.message || t("withdraw.fetchHistoryFailed", "Failed to fetch withdrawal history"));
//     } finally {
//       setHistoryLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboard();
//     fetchHistory();
//   }, []);

//   const handleTabChange = (_event, value) => {
//     setActiveTab(value);
//     setError(null);
//     setSuccess(null);
//   };

//   const handleMaxClick = () => {
//     if (!currentAvailable) return;
//     setAmount(String(currentAvailable));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);

//     const numericAmount = Number(amount);

//     if (!isEligible) {
//       setError(
//         selectedType === "WINNINGS"
//           ? t(
//             "withdraw.errors.winningsLocked",
//             "Your winnings are not unlocked yet. Please increase your traded volume."
//           )
//           : t(
//             "withdraw.errors.workingLocked",
//             "You are not eligible to withdraw working income. Trade at least $2 to unlock."
//           )
//       );
//       return;
//     }

//     if (!numericAmount || numericAmount <= 0) {
//       setError(
//         t("withdraw.errors.invalidAmount", "Please enter a valid withdrawal amount.")
//       );
//       return;
//     }

//     if (numericAmount > currentAvailable) {
//       setError(
//         t(
//           "withdraw.errors.amountTooHigh",
//           "Amount cannot be more than your available balance."
//         )
//       );
//       return;
//     }

//     if (!walletAddress || walletAddress.length < 20) {
//       setError(
//         t("withdraw.errors.invalidAddress", "Please enter a valid wallet address.")
//       );
//       return;
//     }

//     if (!selectedChain) {
//       setError(t("withdraw.errors.selectNetwork", "Please select a network."));
//       return;
//     }

//     const twoFATokenTrimmed = twoFATkn.replace(/\D/g, "").slice(0, 6);
//     if (isTwoFactorEnabled) {
//       if (!twoFATokenTrimmed || twoFATokenTrimmed.length !== 6) {
//         setError(
//           t(
//             "withdraw.errors.invalid2fa",
//             "Please enter the 6-digit code from your authenticator app."
//           )
//         );
//         return;
//       }
//     }

//     try {
//       setSubmitLoading(true);
//       const payload = {
//         amount: numericAmount,
//         walletAddress,
//         chain: selectedChain,
//         ...(isTwoFactorEnabled && twoFATokenTrimmed
//           ? { twoFactorToken: twoFATokenTrimmed }
//           : {}),
//       };

//       const response =
//         selectedType === "WINNINGS"
//           ? await withdrawalService.withdrawWinnings(payload)
//           : await withdrawalService.withdrawWorkingIncome(payload);

//       if (response?.success) {
//         setSuccess(response.message || t("withdraw.submitSuccess", "Withdrawal request submitted successfully."));
//         setAmount("");
//         setWalletAddress("");
//         setTwoFATkn("");
//         await fetchDashboard();
//         await fetchHistory();
//       } else {
//         setError(
//           response?.message ||
//           t("withdraw.submitFailed", "Unable to submit withdrawal. Please check your details and try again.")
//         );
//       }
//     } catch (err) {
//       setError(
//         err?.message ||
//         t("withdraw.submitFailed", "Unable to submit withdrawal. Please check your details and try again.")
//       );
//     } finally {
//       setSubmitLoading(false);
//     }
//   };

//   return (
//     <Box
//       sx={{
//         color: AppColors.TXT_MAIN,
//       }}
//     >
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           position: "sticky",
//           top: 0,
//           zIndex: 1000,
//         }}
//       >
//         <IconButton size="small" onClick={() => navigate(-1)} aria-label={t("tradeTop.backAriaLabel", "Back")}>
//           <ChevronLeft />
//         </IconButton>
//         <Tabs
//           value={activeTab}
//           onChange={handleTabChange}
//           sx={{
//             minHeight: "auto",
//             "& .MuiTab-root": {
//               minHeight: 32,
//               padding: `${SPACING.SM} ${SPACING.XS}`,
//               color: AppColors.TXT_SUB,
//               textTransform: "none",
//               fontWeight: 400,
//               fontSize: FONT_SIZE.BODY,
//               "&.Mui-selected": {
//                 color: AppColors.GOLD_PRIMARY,
//               },
//             },
//             "& .MuiTabs-indicator": {
//               bgcolor: AppColors.GOLD_PRIMARY,
//             },
//           }}
//         >
//           <Tab
//             iconPosition="start"
//             label={t("withdraw.tabs.withdraw", "Withdraw")}
//           />
//           <Tab
//             iconPosition="start"
//             label={t("withdraw.tabs.history", "History")}
//           />
//         </Tabs>
//       </Box>

//       {(error || success) && (
//         <Box sx={{ mb: 2 }}>
//           {error && (
//             <Alert
//               severity="error"
//               onClose={() => setError(null)}
//               sx={{
//                 mb: success ? 1 : 0,
//                 bgcolor: AppColors.ERR_LIGHT,
//                 color: AppColors.ERROR,
//                 border: `1px solid ${AppColors.ERROR}40`,
//                 "& .MuiAlert-icon": {
//                   color: AppColors.ERROR,
//                 },
//               }}
//             >
//               {error}
//             </Alert>
//           )}
//           {success && (
//             <Alert
//               severity="success"
//               onClose={() => setSuccess(null)}
//               sx={{
//                 bgcolor: `${AppColors.SUCCESS}15`,
//                 color: AppColors.SUCCESS,
//                 border: `1px solid ${AppColors.SUCCESS}40`,
//                 "& .MuiAlert-icon": {
//                   color: AppColors.SUCCESS,
//                 },
//               }}
//             >
//               {success}
//             </Alert>
//           )}
//         </Box>
//       )}
//       {activeTab === 0 && (
//         <Box>
//           <Card
//             sx={{
//               bgcolor: AppColors.BG_CARD,
//               overflow: "hidden",
//               height: "100%",
//               borderTop: `1px solid ${AppColors.BG_SECONDARY}`,
//               borderBottom: `1px solid ${AppColors.BG_SECONDARY}`,
//             }}
//           >
//             <CardContent sx={{ p: 1 }}>
//               <Box
//                 sx={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   mb: 1,
//                   gap: 0,
//                 }}
//               >
//                 <Typography
//                   variant="body1"
//                   sx={{
//                     fontWeight: 600,
//                     color: AppColors.TXT_MAIN,
//                   }}
//                 >
//                   {selectedType === "WINNINGS"
//                     ? t(
//                       "withdraw.types.winnings.title",
//                       typeMeta.WINNINGS.title
//                     )
//                     : t(
//                       "withdraw.types.working.title",
//                       typeMeta.WORKING.title
//                     )}
//                 </Typography>
//                 <Select
//                   size="small"
//                   value={selectedType}
//                   onChange={(e) => setSelectedType(e.target.value)}
//                   sx={{
//                     bgcolor: AppColors.BG_MAIN,
//                     color: AppColors.TXT_MAIN,
//                     fontSize: FONT_SIZE.BODY2,
//                     "& .MuiOutlinedInput-notchedOutline": {
//                       borderColor: `${AppColors.BORDER_MAIN}`,
//                     },
//                     "&:hover .MuiOutlinedInput-notchedOutline": {
//                       borderColor: `${AppColors.BORDER_MAIN}`,
//                     },
//                   }}
//                 >
//                   <MenuItem value="WINNINGS">
//                     {t(
//                       "withdraw.types.winnings.menuLabel",
//                       "Withdraw Winnings"
//                     )}
//                   </MenuItem>
//                   <MenuItem value="WORKING">
//                     {t(
//                       "withdraw.types.working.menuLabel",
//                       "Withdraw Working Income"
//                     )}
//                   </MenuItem>
//                 </Select>
//               </Box>

//               <Typography
//                 variant="body2"
//                 sx={{
//                   color: AppColors.TXT_SUB,
//                   mb: 2,
//                 }}
//               >
//                 {selectedType === "WINNINGS"
//                   ? t(
//                     "withdraw.types.winnings.description",
//                     typeMeta.WINNINGS.description
//                   )
//                   : t(
//                     "withdraw.types.working.description",
//                     typeMeta.WORKING.description
//                   )}
//               </Typography>

//               <Box
//                 sx={{
//                   display: "flex",
//                   flexWrap: "wrap",
//                   gap: 1.5,
//                   mb: 2,
//                 }}
//               >
//                 <Chip
//                   icon={<CheckCircle sx={{ fontSize: 16 }} />}
//                   label={
//                     selectedType === "WINNINGS"
//                       ? canWithdrawWinnings
//                         ? t(
//                           "withdraw.status.winningsUnlocked",
//                           "Winnings Unlocked"
//                         )
//                         : t(
//                           "withdraw.status.winningsLocked",
//                           "Winnings Locked"
//                         )
//                       : canWithdrawWorking
//                         ? t(
//                           "withdraw.status.workingUnlocked",
//                           "Working Income Unlocked"
//                         )
//                         : t(
//                           "withdraw.status.workingLocked",
//                           "Working Income Locked"
//                         )
//                   }
//                   sx={{
//                     fontSize: FONT_SIZE.CAPTION,
//                     bgcolor: isEligible
//                       ? `${AppColors.SUCCESS}20`
//                       : `${AppColors.ERROR}20`,
//                     color: isEligible ? AppColors.SUCCESS : AppColors.ERROR,
//                     border: `1px solid ${isEligible ? AppColors.SUCCESS : AppColors.ERROR
//                       }40`,
//                     "& .MuiChip-icon": {
//                       color: isEligible
//                         ? AppColors.SUCCESS
//                         : AppColors.ERROR,
//                     },
//                   }}
//                 />
//                 <Chip
//                   label={t(
//                     "withdraw.available",
//                     "Available: {{amount}} USDT",
//                     { amount: currentAvailable.toFixed(2) }
//                   )}
//                   sx={{
//                     bgcolor: `${AppColors.GOLD_PRIMARY}15`,
//                     color: AppColors.GOLD_PRIMARY,
//                     border: `1px solid ${AppColors.GOLD_PRIMARY}40`,
//                     fontSize: FONT_SIZE.CAPTION,
//                   }}
//                 />
//               </Box>

//               <Box
//                 component="form"
//                 onSubmit={handleSubmit}
//                 sx={{
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: 1.5,
//                 }}
//               >
//                 <TextField
//                   label={t("withdraw.form.amountLabel", "Amount (USDT)")}
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                   type="number"
//                   fullWidth
//                   InputProps={{
//                     endAdornment: (
//                       <Button
//                         size="small"
//                         onClick={handleMaxClick}
//                         sx={{
//                           textTransform: "none",
//                           color: AppColors.GOLD_PRIMARY,
//                           minWidth: 0,
//                         }}
//                       >
//                         {t("withdraw.form.max", "Max")}
//                       </Button>
//                     ),
//                   }}
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       fontSize: FONT_SIZE.BODY2,
//                       bgcolor: AppColors.BG_MAIN,
//                       "& fieldset": {
//                         borderColor: `${AppColors.BORDER_MAIN}`,
//                       },
//                       "& .MuiInputLabel-root": {
//                         color: AppColors.TXT_SUB,
//                       },
//                     },
//                     "& .MuiInputLabel-root": {
//                       color: AppColors.TXT_SUB,
//                     },
//                   }}
//                 />

//                 <TextField
//                   label={t(
//                     "withdraw.form.walletLabel",
//                     "USDT Wallet Address"
//                   )}
//                   value={walletAddress}
//                   onChange={(e) => setWalletAddress(e.target.value)}
//                   fullWidth
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       fontSize: FONT_SIZE.BODY2,
//                       bgcolor: AppColors.BG_MAIN,
//                       "& fieldset": {
//                         borderColor: `${AppColors.BORDER_MAIN}`,
//                       },
//                       "&:hover fieldset": {
//                         borderColor: `${AppColors.BORDER_MAIN}`,
//                       },
//                     },
//                     "& .MuiInputLabel-root": {
//                       color: AppColors.TXT_SUB,
//                     },
//                   }}
//                 />

//                 <Select
//                   value={selectedChain}
//                   onChange={(e) => setSelectedChain(e.target.value)}
//                   fullWidth
//                   sx={{
//                     bgcolor: AppColors.BG_MAIN,
//                     color: AppColors.TXT_MAIN,
//                     fontSize: FONT_SIZE.BODY2,
//                     "& .MuiOutlinedInput-notchedOutline": {
//                       borderColor: `${AppColors.BORDER_MAIN}`,
//                     },
//                     "&:hover .MuiOutlinedInput-notchedOutline": {
//                       borderColor: `${AppColors.BORDER_MAIN}`,
//                     },
//                   }}
//                 >
//                   {CHAINS.map((chain, index) => (
//                     <MenuItem
//                       key={chain.value || index}
//                       value={chain.value}
//                       disabled={chain.disabled}
//                     >
//                       {chain.label}
//                       {chain.disabled &&
//                         t(
//                           "withdraw.form.comingSoon",
//                           " (Coming soon)"
//                         )}
//                     </MenuItem>
//                   ))}
//                 </Select>

//                 {isTwoFactorEnabled && (
//                   <TextField
//                     label={t("withdraw.form.twofaLabel", "2FA code")}
//                     placeholder={t(
//                       "withdraw.form.twofaPlaceholder",
//                       "000000"
//                     )}
//                     value={twoFATkn}
//                     onChange={(e) =>
//                       setTwoFATkn(e.target.value.replace(/\D/g, "").slice(0, 6))
//                     }
//                     inputProps={{ maxLength: 6, inputMode: "numeric" }}
//                     fullWidth
//                     helperText={t(
//                       "withdraw.form.twofaHelp",
//                       "Enter the 6-digit code from your authenticator app."
//                     )}
//                     sx={{
//                       "& .MuiOutlinedInput-root": {
//                         fontSize: FONT_SIZE.BODY2,
//                         bgcolor: AppColors.BG_MAIN,
//                         "& fieldset": {
//                           borderColor: `${AppColors.BORDER_MAIN}`,
//                         },
//                         "&:hover fieldset": {
//                           borderColor: `${AppColors.BORDER_MAIN}`,
//                         },
//                       },
//                       "&:hover fieldset": {
//                         borderColor: `${AppColors.BORDER_MAIN}`,
//                       },
//                       "& .MuiFormHelperText-root": {
//                         color: AppColors.TXT_SUB,
//                       },
//                     }}
//                   />
//                 )}

//                 <Box
//                   sx={{
//                     display: "flex",
//                     alignItems: "flex-start",
//                     gap: 1,
//                   }}
//                 >
//                   <InfoOutlined
//                     sx={{
//                       fontSize: 18,
//                       mt: 0.4,
//                       color: AppColors.TXT_SUB,
//                     }}
//                   />
//                   <Typography
//                     variant="caption"
//                     sx={{
//                       color: AppColors.TXT_SUB,
//                     }}
//                   >
//                     {t(
//                       "withdraw.notice.processing",
//                       "Withdrawals are processed manually by admin. Your balance will be deducted immediately and the status will update as the transaction is processed."
//                     )}
//                   </Typography>
//                 </Box>

//                 <Button
//                   type="submit"
//                   disabled={
//                     submitLoading ||
//                     !isEligible ||
//                     (isTwoFactorEnabled && twoFATkn.replace(/\D/g, "").length !== 6)
//                   }
//                   className="btn-primary"
//                   sx={{
//                     borderRadius: 20,
//                     textTransform: "none",
//                     width: { xs: "100%", md: "25rem" },
//                     alignSelf: "center",
//                   }}
//                 >
//                   {submitLoading ? (
//                     <Box sx={{ display: "flex", alignItems: "center" }}>
//                       <BTLoader />
//                     </Box>
//                   ) : (
//                     t(
//                       "withdraw.actions.submit",
//                       "Submit Withdrawal"
//                     )
//                   )}
//                 </Button>
//               </Box>
//             </CardContent>
//           </Card>
//           <Card
//             sx={{
//               bgcolor: AppColors.BG_CARD,
//               overflow: "hidden",
//             }}
//           >
//             <CardContent sx={{ p: 1 }}>
//               <Box
//                 sx={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                 }}
//               >
//                 <Typography
//                   variant="body1"
//                   sx={{
//                     fontWeight: 600,
//                     color: AppColors.TXT_MAIN,
//                   }}
//                 >
//                   {t(
//                     "withdraw.overview.title",
//                     "Withdrawal Overview"
//                   )}
//                 </Typography>
//                 <IconButton
//                   onClick={fetchDashboard}
//                   disabled={dashboardLoading}
//                   sx={{
//                     color: AppColors.GOLD_PRIMARY,
//                     "&:hover": {
//                       bgcolor: `${AppColors.GOLD_PRIMARY}15`,
//                     },
//                   }}
//                 >
//                   <Refresh />
//                 </IconButton>
//               </Box>

//               {dashboardLoading ? (
//                 <Box
//                   sx={{
//                     display: "flex",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     minHeight: 160,
//                   }}
//                 >
//                   <BTLoader />
//                 </Box>
//               ) : (
//                 <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
//                   <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
//                     <Box
//                       sx={{
//                         flex: 1,
//                         p: 1,
//                         bgcolor: AppColors.BG_MAIN,
//                         borderRadius: 2,
//                         border: `1px solid ${AppColors.BORDER_MAIN}`,
//                       }}
//                     >
//                       <Box
//                         sx={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: 1,
//                           mb: 1,
//                         }}
//                       >
//                         <TrendingUp
//                           sx={{
//                             fontSize: 20,
//                             color: AppColors.SUCCESS,
//                           }}
//                         />
//                         <Typography
//                           variant="caption"
//                           sx={{
//                             color: AppColors.TXT_SUB,
//                           }}
//                         >
//                           {t(
//                             "withdraw.overview.withdrawableWinnings",
//                             "Withdrawable Winnings"
//                           )}
//                         </Typography>
//                       </Box>
//                       <Typography
//                         variant="body1"
//                         sx={{
//                           color: AppColors.TXT_MAIN,
//                           fontWeight: 600,
//                         }}
//                       >
//                         {(balances?.withdrawableWinnings || 0).toFixed(2)} USDT
//                       </Typography>
//                       <Chip
//                         label={
//                           canWithdrawWinnings
//                             ? t(
//                               "withdraw.overview.winningsStatusUnlocked",
//                               "Unlocked"
//                             )
//                             : t(
//                               "withdraw.overview.winningsStatusLocked",
//                               "Locked until volume ≥ deposits"
//                             )
//                         }
//                         size="small"
//                         sx={{
//                           mt: 1,
//                           bgcolor: canWithdrawWinnings
//                             ? `${AppColors.SUCCESS}20`
//                             : `${AppColors.ERROR}20`,
//                           color: canWithdrawWinnings
//                             ? AppColors.SUCCESS
//                             : AppColors.ERROR,
//                         }}
//                       />
//                     </Box>
//                     <Box
//                       sx={{
//                         flex: 1,
//                         p: 1,
//                         bgcolor: AppColors.BG_MAIN,
//                         borderRadius: 2,
//                         border: `1px solid ${AppColors.BORDER_MAIN}`,
//                       }}
//                     >
//                       <Box
//                         sx={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: 1,
//                         }}
//                       >
//                         <AttachMoney
//                           sx={{
//                             fontSize: 20,
//                             color: AppColors.GOLD_PRIMARY,
//                           }}
//                         />
//                         <Typography
//                           variant="caption"
//                           sx={{
//                             color: AppColors.TXT_SUB,
//                           }}
//                         >
//                           {t(
//                             "withdraw.overview.workingIncome",
//                             "Working Income"
//                           )}
//                         </Typography>
//                       </Box>
//                       <Typography
//                         variant="body1"
//                         sx={{
//                           color: AppColors.TXT_MAIN,
//                           fontWeight: 600,
//                         }}
//                       >
//                         {(incomes?.totalWorkingIncome || 0).toFixed(2)} USDT
//                       </Typography>
//                       <Chip
//                         label={
//                           canWithdrawWorking
//                             ? t(
//                               "withdraw.overview.workingStatusEligible",
//                               "Eligible"
//                             )
//                             : t(
//                               "withdraw.overview.workingStatusLocked",
//                               "Trade at least $2 to unlock"
//                             )
//                         }
//                         size="small"
//                         sx={{
//                           fontSize: "0.625rem",
//                           mt: 1,
//                           bgcolor: canWithdrawWorking
//                             ? `${AppColors.SUCCESS}20`
//                             : `${AppColors.ERROR}20`,
//                           color: canWithdrawWorking
//                             ? AppColors.SUCCESS
//                             : AppColors.ERROR,
//                         }}
//                       />
//                     </Box>
//                   </Box>
//                   <Box
//                     sx={{
//                       p: 1,
//                       bgcolor: AppColors.BG_MAIN,
//                       borderRadius: 2,
//                       border: `1px dashed ${AppColors.BORDER_MAIN}`,
//                       display: "flex",
//                       gap: 1,
//                     }}
//                   >
//                     <Lock
//                       sx={{
//                         fontSize: 18,
//                         mt: 0.4,
//                         color: AppColors.GOLD_PRIMARY,
//                       }}
//                     />
//                     <Typography
//                       variant="body2"
//                       sx={{
//                         color: AppColors.TXT_SUB,
//                       }}
//                     >
//                       {t(
//                         "withdraw.overview.hint",
//                         "Winnings unlock automatically when your total traded volume is greater than or equal to your total deposits. Working income becomes eligible once you have traded at least $2."
//                       )}
//                     </Typography>
//                   </Box>
//                 </Box>
//               )}
//             </CardContent>
//           </Card>
//         </Box>
//       )}

// {activeTab === 1 && (
//   <Box
//     sx={{
//       mt: 1,
//       bgcolor: AppColors.BG_CARD,
//       overflow: "hidden",
//     }}
//   >
//     <Box
//       sx={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         pb: 1,
//         px: 1,
//       }}
//     >
//       <Typography
//         variant="h6"
//         sx={{
//           fontWeight: 600,
//           color: AppColors.TXT_MAIN,
//         }}
//       >
//         {t(
//           "withdraw.history.title",
//           "Withdrawal History"
//         )}
//       </Typography>
//       <IconButton
//         onClick={fetchHistory}
//         disabled={historyLoading}
//         sx={{
//           color: AppColors.GOLD_PRIMARY,
//           "&:hover": {
//             bgcolor: `${AppColors.GOLD_PRIMARY}15`,
//           },
//         }}
//       >
//         <Refresh />
//       </IconButton>
//     </Box>

//     {historyLoading ? (
//       <Box
//         sx={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           py: 6,
//         }}
//       >
//         <BTLoader />
//       </Box>
//     ) : withdrawalHistory.length === 0 ? (
//       <Box
//         sx={{
//           textAlign: "center",
//           py: 6,
//           color: AppColors.TXT_SUB,
//         }}
//       >
//         <Typography variant="body1" sx={{ mb: 1 }}>
//           {t(
//             "withdraw.history.emptyTitle",
//             "No withdrawal history found"
//           )}
//         </Typography>
//         <Typography variant="body2">
//           {t(
//             "withdraw.history.emptyDescription",
//             "Your withdrawal requests will appear here after you submit them."
//           )}
//         </Typography>
//       </Box>
//     ) : (
//       <Box
//         sx={{
//           px: { xs: 2, md: 3 },
//           pb: 3,
//           display: "flex",
//           flexDirection: "column",
//           gap: 2,
//         }}
//       >
//         {withdrawalHistory.map((withdrawal, index) => {
//           const status = withdrawal.status || "REQUESTED";
//           const type =
//             withdrawal.type === "WITHDRAW_WORKING"
//               ? t("withdraw.history.typeWorking", "Working Income")
//               : t("withdraw.history.typeWinnings", "Winnings");
//           const statusColor =
//             status === "CONFIRMED"
//               ? AppColors.SUCCESS
//               : status === "SENT"
//                 ? AppColors.GOLD_PRIMARY
//                 : status === "FAILED"
//                   ? AppColors.ERROR
//                   : AppColors.TXT_SUB;

//           return (
//             <Box
//               key={withdrawal._id || index}
//               sx={{
//                 p: { xs: 2, md: 3 },
//                 bgcolor: AppColors.BG_SECONDARY,
//                 borderRadius: 2,
//                 border: `1px solid ${AppColors.GOLD_PRIMARY}10`,
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: 1.5,
//               }}
//             >
//               <Grid container spacing={2} alignItems="center">
//                 <Grid size={{ xs: 12, sm: 6, md: 3 }}>
//                   <Typography
//                     variant="caption"
//                     sx={{
//                       color: AppColors.TXT_SUB,
//                       display: "block",
//                       mb: 0.5,
//                     }}
//                   >
//                     {t("withdraw.history.amount", "Amount")}
//                   </Typography>
//                   <Typography
//                     variant="h6"
//                     sx={{
//                       color: AppColors.GOLD_PRIMARY,
//                       fontWeight: 600,
//                     }}
//                   >
//                     {withdrawal.amount} USDT
//                   </Typography>
//                 </Grid>
//                 <Grid size={{ xs: 12, sm: 6, md: 3 }}>
//                   <Typography
//                     variant="caption"
//                     sx={{
//                       color: AppColors.TXT_SUB,
//                       display: "block",
//                       mb: 0.5,
//                     }}
//                   >
//                     {t("withdraw.history.type", "Type")}
//                   </Typography>
//                   <Chip
//                     label={type}
//                     size="small"
//                     sx={{
//                       bgcolor: `${AppColors.GOLD_PRIMARY}15`,
//                       color: AppColors.GOLD_PRIMARY,
//                       fontWeight: 500,
//                     }}
//                   />
//                 </Grid>
//                 <Grid size={{ xs: 12, sm: 6, md: 2 }}>
//                   <Typography
//                     variant="caption"
//                     sx={{
//                       color: AppColors.TXT_SUB,
//                       display: "block",
//                       mb: 0.5,
//                     }}
//                   >
//                     {t("withdraw.history.status", "Status")}
//                   </Typography>
//                   <Chip
//                     label={status}
//                     size="small"
//                     sx={{
//                       bgcolor: `${statusColor}15`,
//                       color: statusColor,
//                       fontWeight: 500,
//                     }}
//                   />
//                 </Grid>
//                 <Grid size={{ xs: 12, sm: 6, md: 3 }}>
//                   <Typography
//                     variant="caption"
//                     sx={{
//                       color: AppColors.TXT_SUB,
//                       display: "block",
//                       mb: 0.5,
//                     }}
//                   >
//                     {t("withdraw.history.date", "Date")}
//                   </Typography>
//                   <Typography
//                     variant="body2"
//                     sx={{
//                       color: AppColors.TXT_MAIN,
//                     }}
//                   >
//                     {formatDate(withdrawal.createdAt)}
//                   </Typography>
//                 </Grid>
//                 <Grid size={{ xs: 12, md: 1 }}>
//                   {withdrawal.txHash && (
//                     <Tooltip
//                       title={t(
//                         "withdraw.history.viewOnExplorer",
//                         "View on blockchain explorer"
//                       )}
//                     >
//                       <IconButton
//                         href={getExplorerUrl(
//                           withdrawal.chain,
//                           withdrawal.txHash
//                         )}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         size="small"
//                         sx={{
//                           color: AppColors.GOLD_PRIMARY,
//                           "&:hover": {
//                             bgcolor: `${AppColors.GOLD_PRIMARY}15`,
//                           },
//                         }}
//                       >
//                         <OpenInNew fontSize="small" />
//                       </IconButton>
//                     </Tooltip>
//                   )}
//                 </Grid>
//               </Grid>

//               <Box
//                 sx={{
//                   display: "flex",
//                   flexDirection: { xs: "column", sm: "row" },
//                   gap: 1,
//                   mt: 1,
//                 }}
//               >
//                 <Typography
//                   variant="caption"
//                   sx={{
//                     color: AppColors.TXT_SUB,
//                     wordBreak: "break-all",
//                     flex: 1,
//                   }}
//                 >
//                   {t("withdraw.history.walletLabel", "Wallet:")}{" "}
//                   {withdrawal.walletAddress}
//                 </Typography>
//                 {withdrawal.chain && (
//                   <Typography
//                     variant="caption"
//                     sx={{
//                       color: AppColors.TXT_SUB,
//                     }}
//                   >
//                     {t("withdraw.history.networkLabel", "Network:")}{" "}
//                     {withdrawal.chain}
//                   </Typography>
//                 )}
//               </Box>
//             </Box>
//           );
//         })}
//       </Box>
//      )}
//    </Box>
//           )}
//     </Box>
//   );
// }
