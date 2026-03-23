import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Button } from "@mui/material";
import {
  Schedule,
  AccountBalanceWalletOutlined,
  TrendingUp,
  VisibilityOutlined,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AppColors } from "../../constant/appColors";
import { TRADE_NAMESPACE } from "../../i18n";

const GUIDE_ITEM_KEYS = ["expiry", "investment", "direction", "positions"];
const GUIDE_ICONS = {
  expiry: Schedule,
  investment: AccountBalanceWalletOutlined,
  direction: TrendingUp,
  positions: VisibilityOutlined,
};

export default function TradeGuidePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          py: 1,
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
          px: 0.5,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: AppColors.BG_MAIN,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
            flex: 1,
            textAlign: "center",
          }}
        >
          {t("tradeGuide.title", "Trade Zone Guide")}
        </Typography>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          background: `linear-gradient(145deg, ${AppColors.GOLD_DARK} 0%, ${AppColors.BG_MAIN} 45%)`,
          px: 2,
          pt: 3,
          pb: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle at 70% 30%, ${AppColors.HLT_LIGHT}, transparent 70%)`,
            top: -60,
            right: -40,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: "rgba(212, 168, 95, 0.06)",
            bottom: -30,
            left: -20,
          }}
        />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: AppColors.TXT_MAIN,
              mb: 0.5,
            }}
          >
            {t("tradeGuide.heroTitle", "How to trade")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: AppColors.TXT_SUB,
              maxWidth: 320,
            }}
          >
            {t("tradeGuide.heroSubtitle", "Follow these steps to place a prediction trade and manage your positions.")}
          </Typography>
        </Box>
      </Box>

      {/* Steps */}
      <Box sx={{ px: 2, py: 2, pb: 3 }}>
        <Stack spacing={2}>
          {GUIDE_ITEM_KEYS.map((itemKey, index) => {
            const Icon = GUIDE_ICONS[itemKey];
            const label = t(`tradeGuide.items.${itemKey}.label`, itemKey);
            const description = t(`tradeGuide.items.${itemKey}.description`, "");
            return (
              <Box
                key={itemKey}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                  p: 1,
                  borderRadius: 2,
                  border: `1px solid ${AppColors.BORDER_MAIN}`,
                  backgroundColor: AppColors.BG_SECONDARY,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    borderColor: "rgba(212, 168, 95, 0.35)",
                    boxShadow: `0 4px 20px rgba(0,0,0,0.25)`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${AppColors.GOLD_PRIMARY}22, ${AppColors.HLT_LIGHT})`,
                    border: `1px solid ${AppColors.GOLD_PRIMARY}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon sx={{ fontSize: 22, color: AppColors.GOLD_PRIMARY }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: AppColors.TXT_MAIN,
                      }}
                    >
                      {label}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: AppColors.TXT_SUB,
                    }}
                  >
                    {description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
      <Box sx={{ px: 1 }}>
        <Button onClick={() => navigate(-1)} className="btn-primary" sx={{ width: "100%", borderRadius: 10, py: 1.5 }}>
          {t("tradeGuide.tradeNow", "Trade Now")}
        </Button>
      </Box>
    </Box>
  );
}
