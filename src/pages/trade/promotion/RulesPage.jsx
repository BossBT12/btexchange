import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import { ChevronLeft } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AppColors } from "../../../constant/appColors";
import { FONT_SIZE } from "../../../constant/lookUpConstant";
import { TRADE_NAMESPACE } from "../../../i18n";

const POINT_KEYS = ["point1", "point2", "point3", "point4", "point5", "point6"];
const DEFAULT_POINTS = [
  "Share your invitation code or referral link with friends and family.",
  "When they register using your code, they become your direct subordinate.",
  "Earn referral bonus when your direct subordinates make deposits.",
  "Earn level income when your team (up to 6 levels) places trades.",
  "Upgrade your level to increase commission income.",
  "Invitation code can be copied from the Promotion page."
];

const RulesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);

  return (
    <Box sx={{ position: "relative", pb: 4, bgcolor: AppColors.BG_MAIN, height: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          py: 0.75,
          backgroundColor: AppColors.BG_MAIN,
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: AppColors.TXT_MAIN }}>
          {t("promotion.rulesPage.title", "Invitation rules")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      <Box sx={{ textAlign: "center", mt: 3, mb: 2, px: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: AppColors.GOLD_PRIMARY, mb: 0.5 }}>
          {t("promotion.rulesPage.sectionTitle", "Invitation Rules")}
        </Typography>
      </Box>

      <Box sx={{ px: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {POINT_KEYS.map((key, idx) => (
          <Box
            key={key}
            sx={{
              borderRadius: 2,
              bgcolor: AppColors.BG_CARD,
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <Box
              className="bg-auShade"
              sx={{
                width: "65%",
                mx: "auto",
                py: 0.52,
                textAlign: "center",
                borderRadius: "0 0 20px 20px",
              }}
            >
              <Typography sx={{ fontSize: FONT_SIZE.BODY, fontWeight: 700, color: AppColors.TXT_BLACK }}>
                {String(idx + 1).padStart(2, "0")}
              </Typography>
            </Box>
            <Box sx={{ p: 2, pt: 1.5 }}>
              <Typography
                sx={{
                  fontSize: FONT_SIZE.BODY,
                  color: AppColors.TXT_MAIN,
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                }}
              >
                {t(`promotion.rulesPage.${key}`, DEFAULT_POINTS[idx])}
              </Typography>
            </Box>
          </Box>
        ))}
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            bgcolor: AppColors.BG_SECONDARY,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Typography sx={{ fontSize: FONT_SIZE.CAPTION, color: AppColors.TXT_SUB, fontStyle: "italic" }}>
            {t("promotion.rulesPage.note", "Contact support for detailed terms and conditions.")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RulesPage;
