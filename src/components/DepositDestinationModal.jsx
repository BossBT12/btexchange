import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import { Close, ChevronRight, ShowChart, CardGiftcard } from "@mui/icons-material";
import { TRADE_NAMESPACE } from "../i18n";
import { AppColors } from "../constant/appColors";

/**
 * Reusable modal: title, optional description, and tappable choices.
 * Use for "pick a destination" flows (deposit, withdraw, etc.).
 */
export function ActionChoiceModal({
  open,
  onClose,
  title,
  description,
  choices = [],
  closeAriaLabel,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      scroll="paper"
      aria-labelledby="action-choice-modal-title"
      aria-describedby={description ? "action-choice-modal-desc" : undefined}
      sx={{
        "& .MuiDialog-paper": {
          background: "radial-gradient(ellipse at 50% 0%, #252525 0%, #0a0a0a 55%, #050505 100%)",
          borderRadius: { xs: 2, sm: 2.5 },
          border: `1px solid ${AppColors.BORDER_MAIN}`,
          boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
          overflow: "hidden",
          m: 1,
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <DialogTitle
        id="action-choice-modal-title"
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          pt: 2.5,
          pb: description ? 0.5 : 1.5,
          px: 1,
        }}
      >
        <Typography
          component="span"
          variant="h6"
          sx={{
            color: AppColors.TXT_MAIN,
            fontWeight: 600,
            fontSize: { xs: "1.05rem", sm: "1.15rem" },
            lineHeight: 1.35,
            pr: 1,
          }}
        >
          {title}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label={closeAriaLabel}
          sx={{
            color: AppColors.TXT_SUB,
            mt: -0.5,
            "&:hover": { color: AppColors.TXT_MAIN, bgcolor: AppColors.BG_CARD_HOVER },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      {description ? (
        <Box sx={{ px: 1, pb: 1.5, pt: 0 }}>
          <Typography
            id="action-choice-modal-desc"
            variant="body2"
            sx={{ color: AppColors.TXT_SUB, lineHeight: 1.55 }}
          >
            {description}
          </Typography>
        </Box>
      ) : null}

       <DialogContent sx={{ pt: description ? 0.5 : 0, pb: 2.5, px: 1 }}>
        <Stack spacing={1.25} role="list">
          {choices.map((choice) => {
            const { id, ...row } = choice;
            return (
              <Box key={id} role="listitem">
                <ChoiceRow {...row} onClose={onClose} />
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceRow({ icon, title: rowTitle, description: rowDesc, onClick, onClose, ariaLabel }) {
  const handleClick = () => {
    onClick?.();
    onClose?.();
  };

  return (
    <Box
      component="button"
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1,
        m: 0,
        textAlign: "left",
        cursor: "pointer",
        borderRadius: 2,
        border: `1px solid ${AppColors.BORDER_MAIN}`,
        bgcolor: AppColors.BG_CARD,
        color: "inherit",
        font: "inherit",
        transition: "border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: `${AppColors.GOLD_PRIMARY}55`,
          bgcolor: AppColors.HLT_LIGHT,
          boxShadow: `0 0 0 1px ${AppColors.GOLD_PRIMARY}22 inset`,
        },
        "&:focus-visible": {
          outline: `2px solid ${AppColors.GOLD_PRIMARY}`,
          outlineOffset: 2,
        },
      }}
    >
      {icon ? (
        <Box
          sx={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${AppColors.GOLD_PRIMARY}18`,
            color: AppColors.GOLD_PRIMARY,
          }}
          aria-hidden
        >
          {icon}
        </Box>
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: AppColors.TXT_MAIN,
            fontWeight: 600,
            fontSize: "0.95rem",
            lineHeight: 1.35,
          }}
        >
          {rowTitle}
        </Typography>
        {rowDesc ? (
          <Typography
            variant="body2"
            sx={{
              color: AppColors.TXT_SUB,
              mt: 0.35,
              lineHeight: 1.45,
              fontSize: "0.8rem",
            }}
          >
            {rowDesc}
          </Typography>
        ) : null}
      </Box>
      <ChevronRight
        sx={{
          flexShrink: 0,
          color: AppColors.TXT_SUB,
          fontSize: 22,
          opacity: 0.85,
        }}
        aria-hidden
      />
    </Box>
  );
}

const PATH_TRADE_DEPOSIT = "/deposit";
const PATH_REWARD_HUB_DEPOSIT = "/reward-hub/deposit";

/**
 * Deposit entry modal: Trading deposit vs Reward Hub deposit.
 */
export default function DepositDestinationModal({ open, onClose }) {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const navigate = useNavigate();

  const choices = [
    {
      id: "trade",
      title: t("depositDestinationModal.tradeTitle", "Trading"),
      description: t(
        "depositDestinationModal.tradeDescription",
        "Add funds to your trading balance for spot and futures."
      ),
      icon: <ShowChart sx={{ fontSize: 26 }} />,
      ariaLabel: t("depositDestinationModal.tradeAriaLabel", "Deposit to trading account"),
      onClick: () => navigate(PATH_TRADE_DEPOSIT),
    },
    {
      id: "rewardHub",
      title: t("depositDestinationModal.rewardHubTitle", "Reward Hub"),
      description: t(
        "depositDestinationModal.rewardHubDescription",
        "Add funds to your Reward Hub wallet for team rewards and programs."
      ),
      icon: <CardGiftcard sx={{ fontSize: 26 }} />,
      ariaLabel: t("depositDestinationModal.rewardHubAriaLabel", "Deposit to Reward Hub"),
      onClick: () => navigate(PATH_REWARD_HUB_DEPOSIT),
    },
  ];

  return (
    <ActionChoiceModal
      open={open}
      onClose={onClose}
      title={t("depositDestinationModal.title", "Choose where to deposit")}
      description={t(
        "depositDestinationModal.subtitle",
        "Pick the wallet you want to fund. You can open either page again anytime."
      )}
      closeAriaLabel={t("depositDestinationModal.closeAriaLabel", "Close")}
      choices={choices}
    />
  );
}

export { PATH_TRADE_DEPOSIT, PATH_REWARD_HUB_DEPOSIT };
