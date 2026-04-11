import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import {
  ChevronLeft,
  Campaign,
  BoltOutlined,
  AccountBalanceWalletOutlined,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE, SPACING } from "../../constant/lookUpConstant";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const ANNOUNCEMENTS = [
  {
    id: "welcome",
    icon: "📢",
    title: "Welcome to BT Market",
    subtitle: "A smart and secure trading platform.",
    points: [
      "Enjoy smooth trading with a transparent and efficient system.",
      "Experience a clean, user-friendly interface across all devices.",
      "Stay tuned for the latest updates and new features.",
      "Thank you for choosing BT Market.",
    ],
  },
  {
    id: "deposit",
    icon: "💳",
    title: "Deposit Announcement",
    subtitle: "Fast, secure deposits 24/7.",
    highlightIcon: AccountBalanceWalletOutlined,
    points: [
      "Deposits on BT Market are processed quickly and securely.",
      "Always double-check your network and address before depositing.",
      "If your deposit is delayed, contact support with full transaction details.",
      "Your funds are protected by our security and risk-control systems.",
    ],
  },
  {
    id: "withdrawal",
    icon: "⚡",
    title: "Instant Withdrawal Announcement",
    subtitle: "Fast withdrawals once approved.",
    highlightIcon: BoltOutlined,
    points: [
      "Withdrawals are processed instantly after approval.",
      "Please ensure all withdrawal details are correct to avoid issues.",
      "Network congestion or third‑party delays may affect arrival time.",
      "Enjoy fast and reliable withdrawals with BT Market.",
    ],
  },
];

const AnnouncementPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sticky header */}
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
          backgroundColor: AppColors.BG_CARD,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
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
          <ChevronLeft sx={{ fontSize: 24 }} />
        </IconButton>

        <Typography
          sx={{
            fontSize: FONT_SIZE.TITLE,
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("announcement.title", "Announcement")}
        </Typography>

        <Box sx={{ width: 40 }} />
      </Box>

      {/* Hero / header banner */}
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
        <Box sx={{ maxWidth: "70%", zIndex: 1, position: "relative" }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: AppColors.TXT_MAIN,
              mb: 0.5,
            }}
          >
            {t("announcement.hero.title", "BT Market Center")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: AppColors.TXT_SUB,
              maxWidth: 320,
            }}
          >
            {t(
              "announcement.hero.subtitle",
              "Stay up to date with the latest platform announcements, deposit tips, and withdrawal notifications."
            )}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: -20,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.2,
          }}
        >
          <Campaign sx={{ fontSize: 120, color: AppColors.GOLD_PRIMARY }} />
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          px: 1,
          pt: 2,
          pb: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {ANNOUNCEMENTS.map(
          ({ id, icon, title, subtitle, points, highlightIcon: HighlightIcon }) => (
            <Box
              key={id}
              sx={{
                borderRadius: 2,
                bgcolor: AppColors.BG_CARD,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 12px 24px rgba(0,0,0,0.45)",
                p: 1.75,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: AppColors.HLT_LIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    {icon}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: FONT_SIZE.SUBTITLE,
                      fontWeight: 600,
                      color: AppColors.TXT_MAIN,
                    }}
                  >
                    {t(
                      `announcement.items.${id}.title`,
                      title
                    )}
                  </Typography>
                </Box>

                {HighlightIcon && (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "rgba(212,168,95,0.16)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HighlightIcon
                      sx={{ fontSize: 18, color: AppColors.GOLD_PRIMARY }}
                    />
                  </Box>
                )}
              </Box>

              {subtitle && (
                <Typography
                  sx={{
                    fontSize: FONT_SIZE.BODY,
                    color: AppColors.TXT_SUB,
                    mb: 1.25,
                  }}
                >
                  {t(
                    `announcement.items.${id}.subtitle`,
                    subtitle
                  )}
                </Typography>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.75,
                }}
              >
                {points.map((text, idx) => (
                  <Box
                    key={`${id}-${idx}`}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.75,
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        mt: 0.7,
                        borderRadius: "50%",
                        bgcolor: AppColors.GOLD_PRIMARY,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: FONT_SIZE.BODY,
                        color: AppColors.TXT_MAIN,
                        lineHeight: 1.5,
                      }}
                    >
                      {t(
                        `announcement.items.${id}.points.${idx}`,
                        text
                      )}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )
        )}

        <Typography
          sx={{
            mt: 1,
            fontSize: "0.75rem",
            color: AppColors.TXT_SUB,
            textAlign: "center",
          }}
        >
          {t(
            "announcement.footer",
            "The above announcements are for reference only. Please refer to the latest information on BT Market for final details."
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default AnnouncementPage;

