import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    Typography,
    IconButton,
    Button,
    Avatar,
} from "@mui/material";
import { ChevronLeft, InfoOutlined, TrendingDown, TrendingUp } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { formatPairForDisplay } from "../../utils/utils";
import { FONT_SIZE, BORDER_RADIUS, SPACING } from "../../constant/lookUpConstant";
import tradingService from "../../services/tradingService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const TAB_IDS = [
    { id: "performance", key: "market.copyTrading.detail.tabs.performance" },
    { id: "openPosition", key: "market.copyTrading.detail.tabs.openPosition" },
    { id: "positionHistory", key: "market.copyTrading.detail.tabs.positionHistory" },
    { id: "copiers", key: "market.copyTrading.detail.tabs.copiers" },
];

const formatNumber = (val) => {
    const n = typeof val === "number" ? val : Number(val ?? 0);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—";
};

const formatDateTime = (str, locale = "en") => {
    if (!str) return "—";
    const d = new Date(str);
    return d.toLocaleString(locale || "en", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
};

const Row = ({ label, value, valueColor, isAmount }) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 0.5,
        }}
    >
        <Typography
            variant="caption"
            sx={{
                color: AppColors.TXT_SUB,
            }}
        >
            {label}
        </Typography>
        <Typography
            variant="caption"
            sx={{
                color: valueColor || AppColors.TXT_MAIN,
                fontWeight: 500,
            }}
        >
            {isAmount ? `$${value}` : value}
        </Typography>
    </Box>
);

const CopeirPage = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation(TRADE_NAMESPACE);
    const locale = i18n.language?.split("-")[0] || "en";
    const [activeTab, setActiveTab] = useState("positionHistory");
    const [tradeData, setTradeData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTradeData = async () => {
            setLoading(true);
            try {
                const res = await tradingService.getTradeData();
                const list = res?.data ?? [];
                setTradeData(Array.isArray(list) ? list : []);
            } catch {
                setTradeData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTradeData();
    }, []);

    const handleCopy = () => {
        navigate("/copy-trading/setting");
    };

    return (
        <Box
            sx={{
                position: "relative",
                color: AppColors.TXT_MAIN,
                minHeight: "100vh",
                bgcolor: AppColors.BG_MAIN,
                display: "flex",
                flexDirection: "column",
                pb: 10,
            }}
        >
            {/* Header: back + title + info */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "sticky",
                    top: 0,
                    zIndex: 1000,
                    py: 0.75,
                    px: 0.5,
                    backgroundColor: AppColors.BG_MAIN,
                }}
            >
                <IconButton
                    onClick={() => navigate(-1)}
                    aria-label={t("tradeTop.backAriaLabel", "Back")}
                    sx={{
                        color: AppColors.TXT_MAIN,
                        p: 0.5,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                    }}
                >
                    <ChevronLeft sx={{ fontSize: 28 }} />
                </IconButton>
                <Typography
                    variant="h5"
                    sx={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: 700,
                        color: AppColors.TXT_MAIN,
                    }}
                >
                    Copy Trade
                </Typography>
                <IconButton
                    aria-label={t("market.copyTrading.detail.infoAriaLabel", "More information")}
                    sx={{
                        color: AppColors.TXT_MAIN,
                        p: 0.5,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                    }}
                >
                    <InfoOutlined sx={{ fontSize: 22 }} />
                </IconButton>
            </Box>
            {/* Trader Profile */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "start",
                    gap: 1.5,
                    px: 2,
                    pt: 1,
                    pb: 2,
                }}
            >
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: AppColors.HLT_LIGHT,
                        color: AppColors.GOLD_PRIMARY,
                    }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 600,
                            color: AppColors.TXT_MAIN,
                        }}
                    >
                        {t("market.copyTrading.detail.profileName", "Madam Niu's Golden Years")}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 400,
                            color: AppColors.TXT_MAIN,
                            mb: 1,
                        }}
                    >
                        {t("market.copyTrading.detail.followIntro", "Follow my orders, please note the following points:")}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 400,
                            color: AppColors.TXT_SUB,
                            whiteSpace: "pre-line",
                            lineHeight: 1.6,
                        }}
                    >
                        {t("market.copyTrading.detail.point1", "1. Only trade Ethereum and Bitcoin.")}
                        {"\n"}
                        {t("market.copyTrading.detail.point2", "2. I use position control for liquidation rather than fixed stop loss, with both long and short positions open. If there are trapped orders I will handle them; it does not affect opening new positions.")}
                        {"\n"}
                        {t("market.copyTrading.detail.point3", "3. You can also take profit manually when satisfied with copy-trade profits, as I sometimes hold positions through volatility or hold longer for trend swings.")}
                        {"\n"}
                        {t("market.copyTrading.detail.point4", "4. I generally open very few orders on weekends.")}
                    </Typography>
                </Box>
            </Box>

            {/* Tabs */}
            {/* <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            px: 2,
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            overflowX: "auto",
                            "&::-webkit-scrollbar": { display: "none" },
                            scrollbarWidth: "none",
                        }}
                    >
                        {TAB_IDS.map((tab) => (
                            <Typography
                                key={tab.id}
                                variant="body1"
                                onClick={() => setActiveTab(tab.id)}
                                sx={{
                                    color: activeTab === tab.id ? AppColors.TXT_MAIN : AppColors.TXT_SUB,
                                    fontWeight: activeTab === tab.id ? 600 : 400,
                                    cursor: "pointer",
                                    py: 0.5,
                                    borderBottom:
                                        activeTab === tab.id
                                            ? `2px solid ${AppColors.TXT_MAIN}`
                                            : "2px solid transparent",
                                    flexShrink: 0,
                                }}
                            >
                                {t(tab.key, tab.id)}
                            </Typography>
                        ))}
                    </Box> */}

            {/* Position History Cards */}
            <Box sx={{ flex: 1, px: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                {loading ? (
                    <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, textAlign: "center", py: 4 }}>
                        {t("market.copyTrading.detail.loading", "Loading...")}
                    </Typography>
                ) : tradeData.length === 0 ? (
                    <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, textAlign: "center", py: 4 }}>
                        {t("market.copyTrading.detail.empty", "No trade data")}
                    </Typography>
                ) : (
                    tradeData.map((item) => {
                        const isWin = (item.status || "").toUpperCase() === "WIN";
                        const isUp = (item.direction || "").toUpperCase() === "UP";
                        const directionLabel = isUp
                            ? t("market.copyTrading.detail.direction.long", "Long")
                            : t("market.copyTrading.detail.direction.down", "Short");
                        const directionColor = isUp ? AppColors.SUCCESS : AppColors.ERROR;
                        return (
                            <Box
                                key={item._id || item.id || `${item.pair}-${item.startTime}-${Math.random()}`}
                                sx={{
                                    p: SPACING.MD,
                                    borderRadius: BORDER_RADIUS.XS,
                                    borderBottom: `2px solid ${AppColors.BORDER_MAIN}`,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                            bgcolor: directionColor,
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: AppColors.TXT_WHITE,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {directionLabel}{" "}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 600,
                                            color: AppColors.TXT_MAIN,
                                        }}
                                    >
                                        {item.pair ? formatPairForDisplay(item.pair) : "—"}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Row
                                        label={t("market.copyTrading.detail.fields.status", "Status")}
                                        value={item.status ?? "—"}
                                        valueColor={isWin ? AppColors.SUCCESS : AppColors.ERROR}
                                    />
                                    <Row
                                        label={t("market.copyTrading.detail.fields.grossAmount", "Gross Amount (USDT)")}
                                        value={formatNumber(item.grossAmount)}
                                        isAmount={true}
                                    />
                                    <Row
                                        label={t("market.copyTrading.detail.fields.feeAmount", "Fee Amount (USDT)")}
                                        value={formatNumber(item.feeAmount)}
                                        isAmount={true}
                                    />
                                    <Row
                                        label={t("market.copyTrading.detail.fields.netTradeAmount", "Net Trade Amount (USDT)")}
                                        value={formatNumber(item.netTradeAmount)}
                                        isAmount={true}
                                    />
                                    <Row
                                        label={t("market.copyTrading.detail.fields.entryPrice", "Entry Price (USDT)")}
                                        value={formatNumber(item.entryPrice)}
                                        isAmount={true}
                                    />
                                    <Row
                                        label={t("market.copyTrading.detail.fields.exitPrice", "Close Price (USDT)")}
                                        value={formatNumber(item.exitPrice)}
                                        isAmount={true}
                                    />
                                    <Row
                                        label={t("market.copyTrading.detail.fields.payout", "Payout (USDT)")}
                                        value={formatNumber(item.payout)}
                                        valueColor={isWin ? AppColors.SUCCESS : AppColors.ERROR}
                                        isAmount={true}
                                    />
                                    <Row
                                        label={t("market.copyTrading.detail.fields.startTime", "Open Time")}
                                        value={formatDateTime(item.startTime, locale)}
                                    />
                                    <Row
                                        label={t("market.copyTrading.detail.fields.expiryTime", "Close Time")}
                                        value={formatDateTime(item.expiryTime, locale)}
                                    />
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>

            {/* Bottom Copy Button */}

            <Box
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    backgroundColor: AppColors.BG_MAIN,
                    textAlign: "center"
                }}
            >
                <Button
                    fullWidth
                    className="btn-primary"
                    onClick={handleCopy}
                    sx={{
                        py: 1.5,
                        borderRadius: BORDER_RADIUS.MD,
                        color: "#000",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: FONT_SIZE.BODY,
                    }}
                >
                    {t("market.copyTrading.copyButton", "Copy")}
                </Button>
            </Box>
        </Box >
    );
};

export default CopeirPage;
