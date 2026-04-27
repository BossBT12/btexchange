import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Button,
} from "@mui/material";
import {
  ArrowBack,
  Refresh,
  CheckCircle,
  AccessTime,
  OpenInNew,
  ErrorOutline,
} from "@mui/icons-material";
import BTLoader from "../../components/Loader";
import depositService from "../../services/depositService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { formatDateInt } from "../../utils/utils";

const getExplorerUrl = (chain, txHash) => {
  const explorers = {
    BSC: `https://bscscan.com/tx/${txHash}`,
    // ETH: `https://etherscan.io/tx/${txHash}`,
    POLYGON: `https://polygonscan.com/tx/${txHash}`,
  };
  return explorers[chain] || "#";
};

const getStatusColor = (status) => {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "#4CAF50";
    case "PENDING":
      return "#FFA726";
    case "FAILED":
    case "REJECTED":
      return "#EF5350";
    default:
      return "#999999";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return <CheckCircle sx={{ fontSize: 16 }} />;
    case "PENDING":
      return <AccessTime sx={{ fontSize: 16 }} />;
    case "FAILED":
    case "REJECTED":
      return <ErrorOutline sx={{ fontSize: 16 }} />;
    default:
      return null;
  }
};

export default function DepositHistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [depositHistory, setDepositHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch deposit history
  const fetchDepositHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await depositService.getDepositHistory();
      if (response.success) {
        setDepositHistory(response?.data || []);
      } else {
        setError(
          response.message ||
            t(
              "depositHistory.errors.fetchFailed",
              "Failed to fetch deposit history"
            )
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        t(
          "depositHistory.errors.fetchFailed",
          "Failed to fetch deposit history"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositHistory();
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: "#FFFFFF",
        pb: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: "#FFFFFF",
            p: 1,
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          {t("depositHistory.title", "Deposit History")}
        </Typography>
        <IconButton
          onClick={fetchDepositHistory}
          disabled={loading}
          sx={{
            color: "#FFFFFF",
            p: 1,
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ px: 2, pt: 2 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <BTLoader />
          </Box>
        ) : error ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "#EF5350",
            }}
          >
            <ErrorOutline sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Button
              onClick={fetchDepositHistory}
              sx={{
                mt: 2,
                color: "#D4AF37",
                textTransform: "none",
              }}
            >
              {t("depositHistory.actions.retry", "Try Again")}
            </Button>
          </Box>
        ) : depositHistory.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              color: "#999999",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                mb: 3,
              }}
            >
              <AccessTime sx={{ fontSize: 40, opacity: 0.5 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{ mb: 1, color: "#FFFFFF", fontWeight: 500 }}
            >
              {t("depositHistory.empty.title", "No Deposit History")}
            </Typography>
            <Typography variant="body2" sx={{ color: "#999999" }}>
              {t(
                "depositHistory.empty.description",
                "Your deposits will appear here once confirmed"
              )}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {depositHistory.map((deposit) => (
              <Box
                key={deposit._id}
                sx={{
                  bgcolor: "#1A1A1A",
                  borderRadius: "12px",
                  p: 1.5,
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                {/* Top Row - Amount and Status */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 0.75,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999999",
                        mb: 0.5,
                      }}
                    >
                      {t("depositHistory.card.amount", "Amount")}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: "#D4AF37",
                      }}
                    >
                      {deposit.amount} USDT
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(deposit.status)}
                    label={deposit.status}
                    size="small"
                    sx={{
                      bgcolor: `${getStatusColor(deposit.status)}20`,
                      color: getStatusColor(deposit.status),
                      fontWeight: 600,
                      fontSize: "11px",
                      height: "24px",
                      "& .MuiChip-icon": {
                        color: getStatusColor(deposit.status),
                      },
                    }}
                  />
                </Box>

                {/* Details Grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1.5,
                    mb: 0.75,
                  }}
                >
                  {/* Network */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999999",
                        mb: 0.5,
                      }}
                    >
                      {t("depositHistory.card.network", "Network")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#D4AF37",
                      }}
                    >
                      {deposit.chain}
                    </Typography>
                  </Box>

                  {/* Date */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999999",
                        mb: 0.5,
                      }}
                    >
                      {t("depositHistory.card.date", "Date")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 500,
                      }}
                    >
                      {formatDateInt(deposit.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                {/* Transaction Hash */}
                {deposit.txHash && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#999999",
                        mb: 0.5,
                      }}
                    >
                      {t(
                        "depositHistory.card.txHash",
                        "Transaction Hash"
                      )}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 0.75,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#CCCCCC",
                          fontFamily: "monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {deposit.txHash}
                      </Typography>
                      {["BSC", "POLYGON", "ETH"].includes(deposit.chain) && (
                      <IconButton
                        size="small"
                        href={getExplorerUrl(deposit.chain, deposit.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: "#D4AF37",
                          p: 0.5,
                        }}
                      >
                        <OpenInNew sx={{ fontSize: 16 }} />
                      </IconButton>
                      )}
                    </Box>
                  </Box>
                )}

                {/* View on Explorer Button */}
                {deposit.txHash && ["BSC", "POLYGON", "ETH"].includes(deposit.chain) && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                    href={getExplorerUrl(deposit.chain, deposit.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      mt: 0.75,
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "#D4AF37",
                      textTransform: "none",
                      fontSize: "13px",
                      fontWeight: 500,
                      py: 1,
                      borderRadius: "8px",
                      "&:hover": {
                        borderColor: "#D4AF37",
                        bgcolor: "rgba(212, 175, 55, 0.1)",
                      },
                    }}
                  >
                    {t(
                      "depositHistory.card.viewOnExplorer",
                      "View on Explorer"
                    )}
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
