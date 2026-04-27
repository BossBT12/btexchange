import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Telegram,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AppColors } from "../../../constant/appColors";
import agentLineCustomerService from "../../../assets/images/ccw.webp";
import dashboardServices from "../../../services/dashboardServices";
import { TRADE_NAMESPACE } from "../../../i18n";
import useSnackbar from "../../../hooks/useSnackbar";

/**
 * Agent line customer service – static/placeholder page.
 * No API in promotion docs; can be wired to support link or contact config later.
 */
const TELEGRAM_ACCOUNTS = [
  { id: "agent", labelKey: "accounts.agent", type: "channel", url: "https://t.me/IN999Agent" },
  { id: "agency", labelKey: "accounts.agency", type: "channel2", url: "https://t.me/IN999Agency" },
];

const AgentServicePage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [showTelegramAccounts, setShowTelegramAccounts] = useState(false);
  const [telegramAccounts, setTelegramAccounts] = useState({
    channel: "",
    channel2: "",
  });

  useEffect(() => {
    const fetchTelegramAccounts = async () => {
      try {
        const response = await dashboardServices.getSocialMediaLinks();
        console.log('response: ', response);
        setTelegramAccounts({
          channel: response?.data?.facebookUrl ?? "",
          channel2: response?.data?.instagramUrl ?? "",
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchTelegramAccounts();
  }, []);

  const handleOpenAccount = (type, url) => {
    if (!url) return showSnackbar(t("promotion.agentService.noUrl", "No URL found"), "error");
    if (type === "channel" || type === "channel2") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        pb: 4,
      }}
    >
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
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <IconButton
          onClick={() => { if (showTelegramAccounts) setShowTelegramAccounts(false); else navigate(-1) }}
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
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("promotion.agentService.title", "Agent line customer service")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Golden banner header / hero */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${AppColors.GOLD_PRIMARY}, ${AppColors.GOLD_LIGHT})`,
          px: 1,
          pt: 2.5,
          pb: 3,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.32), rgba(255,255,255,0))",
            top: -50,
            right: -40,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.16)",
            bottom: -40,
            left: -10,
          }}
        />
        <Box
          sx={{
            zIndex: 1,
            maxWidth: "60%",
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          <Typography
            variant="h5"
            color={AppColors.TXT_WHITE}
          >
            {t("promotion.agentService.title", "Agent line customer service")}
          </Typography>
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.9)"
          >
            {t("promotion.agentService.subtitle", "Contact our official Telegram accounts for 1:1 support.")}
          </Typography>
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.85)"
          >
            {t("promotion.agentService.description", "Available to help with onboarding, promotions, and account questions.")}
          </Typography>
        </Box>
        <Box
          component="img"
          src={agentLineCustomerService}
          alt={t("promotion.agentService.imageAlt", "Agent line customer service")}
          sx={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: "10rem",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            filter: "drop-shadow(0 18px 38px rgba(0,0,0,0.55))",
          }}
        />
      </Box>
      <Box
        sx={{
          position: "relative",
          px: 1,
          pt: 2,
        }}
      >
        {/* Telegram social list */}
        <Box
          sx={{
            mt: 2,
            borderRadius: 2,
            bgcolor: AppColors.BG_CARD,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          {!showTelegramAccounts && (
            <Box
              onClick={() => setShowTelegramAccounts(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                py: 1.75,
                cursor: "pointer",
                "&:active": {
                  bgcolor: AppColors.HLT_SUB,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "#229ED9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Telegram sx={{ fontSize: 20, color: "#FFFFFF" }} />
                </Box>
                <Typography
                  variant="body1"
                  color={AppColors.TXT_MAIN}
                >
                  {t("promotion.agentService.telegram", "Telegram")}
                </Typography>
              </Box>

              <ChevronRight sx={{ fontSize: 22, color: AppColors.TXT_MAIN }} />
            </Box>
          )}

          {showTelegramAccounts &&
            TELEGRAM_ACCOUNTS?.filter(item => Boolean(telegramAccounts?.[item?.type])).map((item, index) => (
              <Box
                key={item.id || index}
                onClick={() => handleOpenAccount(item.type, telegramAccounts[item.type])}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1,
                  py: 1.75,
                  cursor: "pointer",
                  borderTop:
                    index === 0
                      ? "none"
                      : "1px solid rgba(255,255,255,0.08)",
                  "&:active": {
                    bgcolor: AppColors.HLT_SUB,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#229ED9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Telegram sx={{ fontSize: 20, color: "#FFFFFF" }} />
                  </Box>
                  <Typography
                    variant="body1"
                    color={AppColors.TXT_MAIN}
                  >
                    {t(`promotion.agentService.${item.labelKey}`, item.id === "agent" ? "BT Global Customer Support" : "BT GLOBAL AGENCY")}
                  </Typography>
                </Box>

                <ChevronRight sx={{ fontSize: 22, color: AppColors.TXT_MAIN }} />
              </Box>
            ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AgentServicePage;
