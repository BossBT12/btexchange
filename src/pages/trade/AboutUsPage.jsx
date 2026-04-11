import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import { DescriptionOutlined, GavelOutlined, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE } from "../../constant/lookUpConstant";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const OPTION_ITEMS = [
  {
    id: "privacy",
    icon: DescriptionOutlined,
    path: "/about/privacy-policy",
  },
  {
    id: "risk",
    icon: GavelOutlined,
    path: "/about/risk-disclosure",
  },
];

const AboutUsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          py: 0.75,
          px: 1,
          backgroundColor: AppColors.BG_MAIN,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
          }}
        >
          <ChevronLeft sx={{ fontSize: 26 }} />
        </IconButton>

        <Typography
          sx={{
            fontSize: FONT_SIZE.TITLE,
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("about.headerTitle", "About us")}
        </Typography>

        {/* spacer to balance back button */}
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Hero section */}
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
        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 360 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: AppColors.TXT_MAIN,
              mb: 0.5,
            }}
          >
            {t("about.hero.title", "BT Market Legal Center")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: AppColors.TXT_SUB,
              maxWidth: 320,
            }}
          >
            {t(
              "about.hero.description",
              "Review our privacy, confidentiality, and risk terms in one place. Stay informed and trade with confidence."
            )}
          </Typography>
        </Box>
      </Box>

      {/* Options list */}
      <Box
        sx={{
          flex: 1,
          px: 1,
          pt: 2,
          pb: 4,
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 55%)",
        }}
      >
        <Box
          sx={{
            borderRadius: 2,
            bgcolor: AppColors.BG_CARD,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          {OPTION_ITEMS.map((item, index) => (
            <Box
              key={item.id}
              component="button"
              onClick={() => navigate(item.path)}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                py: 1.5,
                cursor: "pointer",
                border: "none",
                backgroundColor: "transparent",
                borderTop:
                  index === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                "&:active": {
                  bgcolor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    bgcolor: AppColors.HLT_LIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: AppColors.GOLD_PRIMARY,
                    flexShrink: 0,
                  }}
                >
                  <item.icon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: AppColors.TXT_MAIN }}
                  >
                    {t(`about.options.${item.id}.title`, {
                      defaultValue:
                        item.id === "privacy"
                          ? "Privacy Policy & Confidentiality Agreement"
                          : "Risk Disclosure & User Agreement",
                    })}
                  </Typography>
                </Box>
              </Box>
              <ChevronRight sx={{ fontSize: 22, color: AppColors.TXT_SUB }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AboutUsPage;

