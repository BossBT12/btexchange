import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    Collapse,
} from "@mui/material";
import {
    ChevronLeft,
    ChevronRight,
    InfoOutlined,
    ExpandMore,
    ExpandLess,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE, BORDER_RADIUS, SPACING } from "../../constant/lookUpConstant";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const SettingRow = ({ label, value, showArrow = true, onInfo, onClick }) => (
    <Box
        onClick={onClick}
        sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.25,
            px: 0,
            cursor: onClick ? "pointer" : "default",
        }}
    >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
                variant="body2"
                sx={{
                    color: AppColors.TXT_MAIN,
                    fontWeight: 500,
                }}
            >
                {label}
            </Typography>
            {onInfo && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onInfo();
                    }}
                    sx={{ color: AppColors.TXT_SUB, p: 0.25 }}
                >
                    <InfoOutlined sx={{ fontSize: 16 }} />
                </IconButton>
            )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
                variant="body2"
                sx={{
                    color: AppColors.TXT_SUB,
                }}
            >
                {value}
            </Typography>
            {showArrow && <ChevronRight sx={{ color: AppColors.TXT_SUB, fontSize: 20 }} />}
        </Box>
    </Box>
);

const CopyTradingSettingPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(TRADE_NAMESPACE);
    const [copyType, setCopyType] = useState("custom"); // "smart" | "custom"
    const [amountPerTrade, setAmountPerTrade] = useState("");
    const [riskControlExpanded, setRiskControlExpanded] = useState(false);

    const handleCopyNow = () => {
        // Placeholder: submit copy trading settings
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
                pb: 12,
            }}
        >
            {/* Header */}
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
                    aria-label={t("market.copyTrading.setting.backAria", "Back")}
                    sx={{
                        color: AppColors.TXT_MAIN,
                        p: 0.5,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
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
                        color: AppColors.TXT_MAIN,
                    }}
                >
                    {t("market.copyTrading.setting.title", "Copy Trading Setting")}
                </Typography>
                <Box sx={{ width: 40 }} />
            </Box>

            <Box sx={{ px: 2, py: 2 }}>
                {/* Copy Type: Smart Copy | Custom Copy */}
                <Box
                    sx={{
                        display: "flex",
                        borderRadius: BORDER_RADIUS.XS,
                        overflow: "hidden",
                        bgcolor: AppColors.BG_SECONDARY,
                        border: `1px solid ${AppColors.BORDER_MAIN}`,
                        p: 0.5,
                        mb: 2,
                    }}
                >
                    <Box
                        onClick={() => setCopyType("smart")}
                        sx={{
                            flex: 1,
                            py: 1,
                            textAlign: "center",
                            bgcolor: copyType === "smart" ? AppColors.BG_MAIN : "transparent",
                            borderRadius: BORDER_RADIUS.XS,
                            cursor: "pointer",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 500,
                                color: AppColors.TXT_MAIN,
                            }}
                        >
                            {t("market.copyTrading.setting.smartCopy", "Smart Copy")}
                        </Typography>
                    </Box>
                    <Box
                        onClick={() => setCopyType("custom")}
                        sx={{
                            flex: 1,
                            py: 1,
                            textAlign: "center",
                            bgcolor: copyType === "custom" ? AppColors.BG_MAIN : "transparent",
                            borderRadius: BORDER_RADIUS.XS,
                            cursor: "pointer",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 500,
                                color: AppColors.TXT_MAIN,
                            }}
                        >
                            {t("market.copyTrading.setting.customCopy", "Custom Copy")}
                        </Typography>
                    </Box>
                </Box>

                {/* Settings list */}
                <Box sx={{ mb: 2 }}>
                    <SettingRow
                        label={t("market.copyTrading.setting.marginMode", "Margin Mode")}
                        value="Cross"
                        onInfo={() => { }}
                        onClick={() => { }}
                    />
                    <SettingRow
                        label={t("market.copyTrading.setting.positionMode", "Position Mode")}
                        value="Split"
                        showArrow={false}
                        onClick={() => { }}
                    />
                    <SettingRow
                        label={t("market.copyTrading.setting.copyLeverage", "Copy Leverage")}
                        value="Follow Trader"
                        onInfo={() => { }}
                        onClick={() => { }}
                    />
                    <SettingRow
                        label={t("market.copyTrading.setting.amountPerTrade", "Amount Per Trade")}
                        value="Fixed Amount"
                        onClick={() => { }}
                    />
                    <Box sx={{ pl: 0, pr: 0, pb: 1 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 1,
                            }}
                        >
                            <TextField
                                placeholder="≥10"
                                value={amountPerTrade}
                                onChange={(e) => setAmountPerTrade(e.target.value)}
                                variant="outlined"
                                size="small"
                                type="number"
                                inputProps={{ min: 10 }}
                                sx={{
                                    flex: 1,
                                    "& .MuiOutlinedInput-root": {
                                        py: 0.75,
                                        bgcolor: AppColors.BG_SECONDARY,
                                        color: AppColors.TXT_MAIN,
                                        borderRadius: BORDER_RADIUS.XS,
                                        "& fieldset": {
                                            border: 'none'
                                        },
                                        "&:hover fieldset": { border: 'none' },
                                    },
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                                            USDT
                                        </Typography>
                                    ),
                                }}
                            />
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                color: AppColors.TXT_SUB,
                                mt: 0.5,
                            }}
                        >
                            {t("market.copyTrading.setting.amountHint", "The margin amount for each copy trading is fixed at 0 USDT")}
                        </Typography>
                    </Box>
                </Box>

                {/* Followed Order Risk Control (expandable) */}
                <Box
                    sx={{
                        borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
                        borderTop: `1px solid ${AppColors.BORDER_MAIN}`,
                    }}
                >
                    <Box
                        onClick={() => setRiskControlExpanded(!riskControlExpanded)}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 1.25,
                            cursor: "pointer",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: AppColors.TXT_MAIN,
                                fontWeight: 500,
                            }}
                        >
                            {t("market.copyTrading.setting.riskControl", "Followed Order Risk Control")}
                        </Typography>
                        {riskControlExpanded ? (
                            <ExpandLess sx={{ color: AppColors.TXT_SUB }} />
                        ) : (
                            <ExpandMore sx={{ color: AppColors.TXT_SUB }} />
                        )}
                    </Box>
                    <Collapse in={riskControlExpanded}>
                        <Box sx={{ py: 1, color: AppColors.TXT_SUB, fontSize: FONT_SIZE.CAPTION }}>
                            {t("market.copyTrading.setting.riskControlContent", "Risk control options will appear here.")}
                        </Box>
                    </Collapse>
                </Box>

                {/* Copy Token */}
                <Box
                    onClick={() => { }}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1.25,
                        borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
                        cursor: "pointer",
                        mb: 2,
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: AppColors.TXT_MAIN,
                            fontWeight: 500,
                        }}
                    >
                        {t("market.copyTrading.setting.copyToken", "Copy Token")}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: AppColors.BG_SECONDARY }} />
                        <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: AppColors.BG_SECONDARY }} />
                        <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: AppColors.BG_SECONDARY }} />
                        <Box
                            sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                bgcolor: AppColors.BG_SECONDARY,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Typography sx={{ fontSize: 10, color: AppColors.TXT_SUB }}>6</Typography>
                        </Box>
                        <ChevronRight sx={{ color: AppColors.TXT_SUB, fontSize: 20 }} />
                    </Box>
                </Box>

                {/* Available Margin */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1.25,
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: AppColors.TXT_MAIN,
                            fontWeight: 500,
                        }}
                    >
                        {t("market.copyTrading.setting.availableMargin", "Available Margin")}
                    </Typography>
                    <Typography variant="body2" sx={{
                        color: AppColors.TXT_MAIN,
                        fontWeight: 500,
                    }}>
                        Available 0.38 USDT
                    </Typography>
                </Box>

                {/* Account Transfer */}
                <Typography
                    variant="body2"
                    sx={{
                        color: AppColors.TXT_MAIN,
                        fontWeight: 600,
                        mt: 2,
                        mb: 1,
                    }}
                >
                    {t("market.copyTrading.setting.accountTransfer", "Account Transfer")}
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, mb: 2, textAlign: "center" }}>
                    <Box
                        sx={{
                            flex: 1,
                            p: 1.5,
                            borderRadius: BORDER_RADIUS.XS,
                            border: `1px solid ${AppColors.BORDER_MAIN}`,
                        }}
                    >
                        <Typography variant="caption" sx={{ color: AppColors.TXT_SUB, mb: 0.5 }}>
                            {t("market.copyTrading.setting.fundingAccount", "Funding Account")}
                        </Typography>
                        <Typography variant="body1" sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}>
                            0.00 USDT
                        </Typography>
                        <Button
                            fullWidth
                            size="small"
                            sx={{
                                mt: 1,
                                py: 0.75,
                                borderRadius: BORDER_RADIUS.XS,
                                bgcolor: AppColors.TXT_SUB,
                                color: AppColors.TXT_BLACK,
                                textTransform: "none",
                                fontSize: FONT_SIZE.CAPTION,
                                "&:hover": { bgcolor: AppColors.BORDER_MAIN },
                            }}
                        >
                            {t("market.copyTrading.setting.transferToFutures", "Transfer to Futures Account")}
                        </Button>
                    </Box>
                    <Box
                        sx={{
                            flex: 1,
                            p: 1.5,
                            borderRadius: BORDER_RADIUS.XS,
                            border: `1px solid ${AppColors.BORDER_MAIN}`,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="caption" sx={{ color: AppColors.TXT_SUB, mb: 0.5 }}>
                            {t("market.copyTrading.setting.spotAccount", "Spot Account")}
                        </Typography>
                        <Typography variant="body1" sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}>
                            0.00 USDT
                        </Typography>
                        <Button
                            fullWidth
                            size="small"
                            sx={{
                                mt: 1,
                                py: 0.75,
                                borderRadius: BORDER_RADIUS.XS,
                                bgcolor: AppColors.TXT_SUB,
                                color: AppColors.TXT_BLACK,
                                textTransform: "none",
                                fontSize: FONT_SIZE.CAPTION,
                                "&:hover": { bgcolor: AppColors.BORDER_MAIN },
                            }}
                        >
                            {t("market.copyTrading.setting.transferToFutures", "Transfer to Futures Account")}
                        </Button>
                    </Box>
                </Box>

                {/* Footnote */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 2 }}>
                    <InfoOutlined sx={{ color: AppColors.TXT_SUB, fontSize: 16, mt: 0.25 }} />
                    <Typography variant="caption" sx={{ color: AppColors.TXT_SUB, flex: 1 }}>
                        {t("market.copyTrading.setting.isolatedMarginNote", "Currently, copy trading only supports Isolated margin mode.")}
                    </Typography>
                </Box>
            </Box>

            {/* Bottom: Copy Now */}
            <Box
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    backgroundColor: AppColors.BG_MAIN,
                }}
            >
                <Button
                    fullWidth
                    onClick={handleCopyNow}
                    disabled
                    sx={{
                        py: 1.5,
                        borderRadius: BORDER_RADIUS.MD,
                        bgcolor: AppColors.HLT_SUB,
                        color: AppColors.TXT_MAIN,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: FONT_SIZE.BODY,
                        "&.Mui-disabled": {
                            color: AppColors.TXT_SUB,
                            bgcolor: AppColors.HLT_SUB,
                        },
                    }}
                >
                    {t("market.copyTrading.setting.copyNow", "Copy Now")}
                </Button>
            </Box>
        </Box>
    );
};

export default CopyTradingSettingPage;
