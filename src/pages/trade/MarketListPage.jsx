import { Box, Container, IconButton, Typography } from "@mui/material";
import { AppColors } from "../../constant/appColors";
import LandingPageList from "../../components/trading/LandingPageList";
import { useNavigate } from "react-router-dom";
import { ArrowBackIosNewOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

export default function MarketListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  return (
    <Box className="pb-14">
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 1,
          backgroundColor: AppColors.BG_MAIN,
          borderBottom: `1px solid ${AppColors.BG_SECONDARY}`,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.75,
            "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
          }}
        >
          <ArrowBackIosNewOutlined sx={{ fontSize: 22 }} />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: AppColors.TXT_MAIN,
              lineHeight: 1.25,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            {t("marketList.headerLine1", "Real Time")}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: AppColors.TXT_MAIN,
              lineHeight: 1.25,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            {t("marketList.headerLine2", "Leaderboard")}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px: 2 }}>
        <LandingPageList showAll />
      </Box>
    </Box>
  );
}
