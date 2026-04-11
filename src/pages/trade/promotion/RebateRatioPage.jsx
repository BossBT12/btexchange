import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import { ChevronLeft } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AppColors } from "../../../constant/appColors";
import useSnackbar from "../../../hooks/useSnackbar";
import promotionService from "../../../services/promotionService";
import BTLoader from "../../../components/Loader";
import { FaHandPointRight } from "react-icons/fa";
import { FaSackDollar } from "react-icons/fa6";
import { BsFillPinAngleFill } from "react-icons/bs";
import { BsRocketTakeoffFill } from "react-icons/bs";
import { TRADE_NAMESPACE } from "../../../i18n";

const LEVELS = [1, 0.5, 0.25, 0.25, 0.25, 0.25];

const BULLET_KEYS = ["bullet1", "bullet2", "bullet3", "bullet4"];
const BULLET_DEFAULTS = {
  bullet1: "No extra investment required",
  bullet2: "Commission credited automatically",
  bullet3: "Fully transparent system",
  bullet4: "Real-time earnings tracking",
};

const RebateRatioPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);



  return (
    <Box sx={{ position: "relative", color: AppColors.TXT_MAIN, pb: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          py: 0.75,
          backgroundColor: AppColors.BG_SECONDARY,
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
        <Typography variant="h6" sx={{ fontWeight: 700, color: AppColors.TXT_MAIN }}>
          {t("promotion.rebateRatio.title", "Rebate ratio")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>
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
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "nowrap",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.4)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
                  color: AppColors.GOLD_PRIMARY,
                  flexShrink: 0,
                }}
              >
                <FaSackDollar size={18} />
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: AppColors.TXT_MAIN,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {t("promotion.rebateRatio.bannerTitle", "BT Market – Commission & Rebate System")}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: AppColors.TXT_SUB,
              }}
            >
              {t("promotion.rebateRatio.bannerIntro", "At BT Exchange, you don't just trade — you also earn commission from your network's trading activity.")}
            </Typography>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                mt: 1,
              }}
            >
              <Box
                sx={{
                  mt: "2px",
                  color: AppColors.GOLD_PRIMARY,
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaHandPointRight size={18} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_SUB,
                }}
              >
                {t("promotion.rebateRatio.bannerRefer", "When you refer users to BT Exchange and they place trades, you receive a percentage of their trading fees as commission.")}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Typography
        variant="body1"
        sx={{
          px: 2,
          mt: 1,
          fontWeight: 600,
          color: AppColors.TXT_MAIN,
          textAlign: "center",
        }}
      >
        {t("promotion.rebateRatio.structureTitle", "Multi-Level Commission Structure:")}
      </Typography>
      <Box sx={{ mx: 2, mt: 1 }}>
        <Box
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0.5,
              bgcolor: AppColors.GOLD_PRIMARY,
              color: "#000",
              py: 1.25,
              px: 1.5,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {t("promotion.rebateRatio.tableLevel", "Level")}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, textAlign: "right" }}>
              {t("promotion.rebateRatio.tableCommission", "Commission %")}
            </Typography>
          </Box>
          <Box sx={{ bgcolor: AppColors.BG_SECONDARY }}>
            {LEVELS.map((row, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  py: 1.25,
                  px: 1.5,
                  borderBottom:
                    idx < LEVELS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  alignItems: "center",
                }}
              >
                <Typography variant="body1" sx={{ color: AppColors.TXT_MAIN }}>
                  {t("promotion.rebateRatio.levelRow", { defaultValue: "Level {{level}}", level: idx + 1 })}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: AppColors.GOLD_PRIMARY, textAlign: "right" }}>
                  {row}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Bottom CTA section */}
      <Box sx={{ px: 2, py: 3 }}>
        <Typography
          variant="body1"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
            mb: 1.5,
          }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "start",
              justifyContent: "center",
              color: AppColors.GOLD_PRIMARY,
            }}
          >
            <BsFillPinAngleFill size={18} />
          </Box>
          {t("promotion.rebateRatio.ctaTitle", "The bigger your team, the higher your passive income potential.")}
        </Typography>
        <Stack spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
          {BULLET_KEYS.map((key) => (
            <Stack key={key} direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: `radial-gradient(circle at 30% 30%, ${AppColors.GOLD_LIGHT}, ${AppColors.GOLD_PRIMARY})`,
                  boxShadow: `0 0 8px ${AppColors.GOLD_PRIMARY}60`,
                }}
              />
              <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                {t(`promotion.rebateRatio.${key}`, { defaultValue: BULLET_DEFAULTS[key] })}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Typography
          variant="body1"
          sx={{
            display: "flex",
            alignItems: "start",
            justifyContent: "start",
            gap: 0.75,
            mt: 2,
            fontWeight: 600,
            color: AppColors.GOLD_PRIMARY,
          }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "start",
              justifyContent: "center",
            }}
          >
            <BsRocketTakeoffFill size={18} />
          </Box>
          {t("promotion.rebateRatio.ctaTagline", "Trade smart. Build your network. Earn more — with BT Market.")}
        </Typography>
      </Box>
    </Box>
  );
};

export default RebateRatioPage;
