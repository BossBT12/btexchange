import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    IconButton,
    Pagination,
    CircularProgress,
} from "@mui/material";
import { ChevronLeft, InfoOutlined, TrendingDown, TrendingUp } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { formatPairForDisplay } from "../../utils/utils";
import { FONT_SIZE, BORDER_RADIUS, SPACING } from "../../constant/lookUpConstant";
import userService from "../../services/secondGameServices/userService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const MAX_LIMIT = 100;

const formatNumber = (val, decimals = 4) => {
    const n = typeof val === "number" ? val : Number(val ?? 0);
    return Number.isFinite(n)
        ? n.toLocaleString(undefined, { maximumFractionDigits: decimals })
        : "—";
};

/** Compact: MM-DD HH:mm:ss */
const formatSettlementTime = (str) => {
    if (!str) return "—";
    const d = new Date(str);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${mm}-${dd} ${hh}:${min}:${ss}`;
};

/** Period in seconds from openTime to settlementTime */
const getPeriodSeconds = (openTime, settlementTime) => {
    if (!openTime || !settlementTime) return null;
    const open = new Date(openTime).getTime();
    const settle = new Date(settlementTime).getTime();
    const sec = Math.round((settle - open) / 1000);
    return Number.isFinite(sec) && sec >= 0 ? sec : null;
};

const getPaginationFromResponse = (data) => ({
    page: Number(data?.pagination?.page) || DEFAULT_PAGE,
    limit: Number(data?.pagination?.limit) || DEFAULT_LIMIT,
    total: Number(data?.pagination?.total) ?? 0,
    pages: Number(data?.pagination?.pages) ?? 0,
});

const DetailRow = ({ label, value, valueColor }) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 0.525,
        }}
    >
        <Typography variant="body1" sx={{ color: AppColors.TXT_SUB }}>
            {label}
        </Typography>
        <Typography
            variant="body1"
            sx={{
                color: valueColor ?? AppColors.TXT_MAIN,
                fontWeight: 500,
            }}
        >
            {value}
        </Typography>
    </Box>
);

const TradeCard = React.memo(function TradeCard({ item, locale, t }) {
    const isWin = (item.status || "").toUpperCase() === "WIN";
    const isUp = (item.direction || "").toUpperCase() === "UP";
    const directionLabel = isUp
        ? t("market.copyTrading.detail.direction.buy", "Buy")
        : t("market.copyTrading.detail.direction.sell", "Put");
    const directionColor = isUp ? AppColors.SUCCESS : AppColors.ERROR;

    const periodSec = useMemo(
        () => getPeriodSeconds(item.openTime, item.settlementTime),
        [item.openTime, item.settlementTime]
    );
    const periodStr = periodSec != null ? `${periodSec} s` : "—";

    const amountNum = Number(item.amount) || 0;
    const rewardRateNum = Number(item.rewardRate) || 0;
    const rewardUsdt = amountNum * (rewardRateNum / 100);
    const rewardRateStr = isWin
        ? `+${formatNumber(rewardRateNum, 2)}% +${formatNumber(rewardUsdt, 4)} USDT`
        : `-${formatNumber(rewardRateNum, 2)}% -${formatNumber(rewardUsdt, 4)} USDT`;

    return (
        <Box
            sx={{
                p: 1,
                borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
            }}
        >
            {/* Header: direction pill + pair */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.25,
                        px: 0.725,
                        py: 0.2,
                        borderRadius: 1,
                        bgcolor: directionColor,
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 600,
                            color: AppColors.TXT_WHITE,
                        }}
                    >
                        {directionLabel}
                    </Typography>
                    {isUp ? (
                        <TrendingUp sx={{ fontSize: 18, color: AppColors.TXT_WHITE }} />
                    ) : (
                        <TrendingDown sx={{ fontSize: 18, color: AppColors.TXT_WHITE }} />
                    )}
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

            {/* Details: key-value rows */}
            <Box sx={{ pt: 0.5 }}>
                <DetailRow
                    label={t("market.copyTrading.detail.fields.settlementTime", "Settlement Time")}
                    value={formatSettlementTime(item.settlementTime)}
                />
                <DetailRow
                    label={t("market.copyTrading.detail.fields.openingPrice", "Opening Price")}
                    value={item.entryPrice != null ? `${formatNumber(item.entryPrice, 2)} USDT` : "—"}
                />
                <DetailRow
                    label={t("market.copyTrading.detail.fields.buyAmount", "Buy amount")}
                    value={item.amount != null ? `${formatNumber(item.amount, 0)} USDT` : "—"}
                />
                <DetailRow
                    label={t("market.copyTrading.detail.fields.period", "Period")}
                    value={periodStr}
                />
                <DetailRow
                    label={t("market.copyTrading.detail.fields.closingPrice", "Closing Price")}
                    value={item.exitPrice != null ? `${formatNumber(item.exitPrice, 2)} USDT` : "—"}
                />
                <DetailRow
                    label={t("market.copyTrading.detail.fields.transactionFee", "Transaction Fee (1%)")}
                    value={item.feeAmount != null ? `${formatNumber(item.feeAmount, 2)} USDT` : "—"}
                />
                <DetailRow
                    label={t("market.copyTrading.detail.fields.rewardRate", "Reward Rate")}
                    value={rewardRateStr}
                    valueColor={isWin ? AppColors.SUCCESS : AppColors.ERROR}
                />
            </Box>
        </Box>
    );
});

const CopeirPage = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation(TRADE_NAMESPACE);
    const locale = i18n.language?.split("-")[0] || "en";

    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        total: 0,
        pages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTradeData = useCallback(async (page, limit) => {
        setLoading(true);
        setError(null);
        try {
            const res = await userService.getUserTradeData({
                page: Math.max(1, Number(page) || DEFAULT_PAGE),
                limit: Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT)),
            });
            if (!res?.success || !res?.data) {
                setList([]);
                setPagination((prev) => ({ ...prev, total: 0, pages: 0 }));
                return;
            }
            const rawList = res.data.list;
            setList(Array.isArray(rawList) ? rawList : []);
            setPagination((prev) => ({
                ...prev,
                ...getPaginationFromResponse(res.data),
            }));
        } catch (err) {
            setList([]);
            setError(err?.message ?? "Failed to load trade data");
        } finally {
            setLoading(false);
        }
    }, []);

    const pageForApi = pagination.page;
    const limitForApi = pagination.limit;

    useEffect(() => {
        fetchTradeData(pageForApi, limitForApi);
    }, [fetchTradeData, pageForApi, limitForApi]);

    const handlePageChange = useCallback((_event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    }, []);

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
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "fixed",
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
                        "&:hover": { bgcolor: AppColors.BG_CARD_HOVER },
                    }}
                >
                    <ChevronLeft sx={{ fontSize: 28 }} />
                </IconButton>
                <Typography
                    variant="h6"
                    sx={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: FONT_SIZE.TITLE,
                        color: AppColors.TXT_MAIN,
                    }}
                >
                    {t("market.copyTrading.detail.title", "Trade History")}
                </Typography>
                <IconButton
                    aria-label={t("market.copyTrading.detail.infoAriaLabel", "More information")}
                    sx={{
                        color: AppColors.TXT_MAIN,
                        p: 0.5,
                        "&:hover": { bgcolor: AppColors.BG_CARD_HOVER },
                    }}
                >
                    <InfoOutlined sx={{ fontSize: 22 }} />
                </IconButton>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    px: { xs: 1.5, sm: 2 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {loading && list.length === 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
                        <CircularProgress size={32} sx={{ color: AppColors.TXT_SUB }} />
                        <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, ml: 1.5 }}>
                            {t("market.copyTrading.detail.loading", "Loading...")}
                        </Typography>
                    </Box>
                ) : error ? (
                    <Typography variant="body2" sx={{ color: AppColors.ERROR, textAlign: "center", py: 4 }}>
                        {error}
                    </Typography>
                ) : list.length === 0 ? (
                    <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, textAlign: "center", py: 4 }}>
                        {t("market.copyTrading.detail.empty", "No trade data")}
                    </Typography>
                ) : (
                    <>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {list.map((item) => (
                                <TradeCard
                                    key={item._id || item.id || `${item.pair}-${item.openTime}-${item.createdAt}`}
                                    item={item}
                                    locale={locale}
                                    t={t}
                                />
                            ))}
                        </Box>

                        {pagination.pages > 1 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    pt: 2,
                                    pb: 1,
                                }}
                            >
                                <Pagination
                                    count={pagination.pages}
                                    page={pagination.page}
                                    onChange={handlePageChange}
                                    color="primary"
                                    size="medium"
                                    showFirstButton
                                    showLastButton
                                    sx={{
                                        "& .MuiPaginationItem-root": {
                                            color: AppColors.TXT_MAIN,
                                            borderColor: AppColors.BORDER_MAIN,
                                        },
                                        "& .MuiPaginationItem-root.Mui-selected": {
                                            bgcolor: AppColors.HLT_MAIN,
                                            color: AppColors.TXT_BLACK,
                                        },
                                        "& .MuiPaginationItem-root:hover": {
                                            bgcolor: AppColors.BG_CARD_HOVER,
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};

export default CopeirPage;
