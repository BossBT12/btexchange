import {
  Box,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListSubheader,
  Stack,
  styled,
} from "@mui/material";
import {
  KeyboardArrowDown,
  StarOutlined,
  StarBorderOutlined,
  MoreHoriz,
} from "@mui/icons-material";
import { AppColors } from "../constant/appColors";
import { formatPairForDisplay } from "../utils/utils";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { FONT_SIZE } from "../constant/lookUpConstant";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { TRADE_NAMESPACE } from "../i18n";

const StyledListHeader = styled(ListSubheader)({
  backgroundImage: "var(--Paper-overlay)",
});

export default function TradePageTopView({
  api,
  selectedPair,
  pairsData = [],
  onSelectPair,
  pairMenuAnchor,
  pairMenuOpen,
  onPairMenuOpen,
  onPairMenuClose,
  betProfitPercent,
}) {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const navigate = useNavigate();
  const { favoritePairs, addFavoritePair, removeFavoritePair } = useAuth();
  const displayPair = formatPairForDisplay(selectedPair || "")

  const handleFavoriteClick = async (pair) => {
    try {
      if (favoritePairs.includes(pair)) {
        await removeFavoritePair(pair);
      } else {
        await addFavoritePair(pair);
      }
    } catch (error) {
      console.error(error);
      toast?.error?.(t("tradeTop.favoriteError", "Failed to add favorite pair"));
    }
  };

  return (
    <Box
      sx={{
        color: AppColors.TXT_MAIN,
        borderBottom: `1px solid ${AppColors.HLT_NONE}30`,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: AppColors.BG_MAIN,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Button
            variant="text"
            onClick={(e) => onPairMenuOpen?.(e)}
            sx={{
              color: AppColors.TXT_MAIN,
              textTransform: "none",
              fontSize: FONT_SIZE.BODY,
              fontWeight: 600,
              minWidth: 0,
              px: 0.5,
            }}
            endIcon={
              <KeyboardArrowDown
                sx={{
                  fontSize: "1.25rem",
                  transition: "transform 0.2s ease-in-out",
                  transform: pairMenuOpen ? "rotate(180deg)" : "",
                }}
              />
            }
          >
            {displayPair}
          </Button>
          <IconButton size="small" sx={{ color: AppColors.TXT_MAIN }} aria-label={t("tradeTop.favoriteAriaLabel", "Favorite")} onClick={() => handleFavoriteClick(selectedPair)}>
            {favoritePairs.includes(selectedPair) ? <StarOutlined sx={{ fontSize: 22, color: "pink" }} /> : <StarBorderOutlined sx={{ fontSize: 22 }} />}
          </IconButton>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              <span >
                {t("tradeTop.upLabel", "Up")}:
              </span>{" "}
              <span style={{ color: AppColors.SUCCESS }}>
                {betProfitPercent || 100}%
              </span>
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              <span>
                {t("tradeTop.downLabel", "Down")}:
              </span>{" "}
              <span style={{ color: AppColors.SUCCESS }}>
                {betProfitPercent || 100}%
              </span>
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => navigate("/trade/guide")}
            sx={{ color: AppColors.TXT_SUB, p: 0.25 }}
            aria-label={t("tradeTop.guideAriaLabel", "Trade guide")}
          >
            <MoreHoriz sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Stack>
      <Menu
        id="pair-menu-top"
        anchorEl={pairMenuAnchor}
        open={pairMenuOpen}
        onClose={onPairMenuClose}
        slotProps={{
          list: {
            "aria-labelledby": "pair-button-top",
            sx: { py: 0 },
          },
          paper: {
            sx: {
              "& .MuiMenuItem-root": {
                minHeight: "auto",
                py: 1,
                fontSize: "0.75rem",
                borderBottom: `1px solid ${AppColors.HLT_NONE}30`,
              },
            },
          }
        }}
      >
        <StyledListHeader
          sx={{
            fontSize: FONT_SIZE.BODY,
            borderBottom: `1px solid ${AppColors.HLT_NONE}30`,
            bgcolor: AppColors.BG_MAIN,
            px: 1,
            lineHeight: 2.5,
          }}
        >
          {t("tradeTop.pairMenu.title", "Pairs")}
        </StyledListHeader>
        {pairsData?.map((pair) => (
          <MenuItem
            key={pair?.pair}
            onClick={() => {
              api.leavePair(selectedPair);
              onSelectPair?.(pair?.pair);
              onPairMenuClose?.();
            }}
          >
            <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN }}>
              {formatPairForDisplay(pair?.pair)} {pair?.price ? `- ${pair?.price?.toFixed(2)}` : ""}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
