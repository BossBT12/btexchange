import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";
import { Modal, Box, Typography } from "@mui/material";
import CircularProgress, {
    circularProgressClasses,
  } from '@mui/material/CircularProgress';
import { AppColors } from "../constant/appColors";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../i18n";

const LoaderMessageModal = ({ loading, status }) => {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Open modal when loading starts or status is available
    if (loading || status !== null) {
      setOpen(true);
    }

    // Close modal after showing status
    if (!loading && status !== null) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [loading, status]);

  return (
    <Modal
      open={open}
      hideBackdrop
      disableAutoFocus
      disableEnforceFocus
    >
      <Box
        sx={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          bgcolor: "background.paper",
          borderRadius: 2,
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          boxShadow: 3,
        }}
      >
        {/* LOADING */}
        {loading && (
          <>
            <CircularProgress
              size={26}
              thickness={4}
              sx={{
                color: "#D4AF37",
                [`& .${circularProgressClasses.circle}`]: {
                  strokeLinecap: "round",
                },
              }}
            />
            <Typography variant="body2" sx={{ color: AppColors.GOLD_PRIMARY }}>
              {t("loaderMessageModal.processing", "Processing...")}
            </Typography>
          </>
        )}

        {/* SUCCESS */}
        {!loading && status === true && (
          <>
            <CheckCircle color="success" />
            <Typography variant="body2" sx={{ color: AppColors.SUCCESS }}>
              {t("loaderMessageModal.success", "Success")}
            </Typography>
          </>
        )}

        {/* ERROR */}
        {!loading && status === false && (
          <>
            <ErrorOutline color="error" />
            <Typography variant="body2" sx={{ color: AppColors.ERROR }}>
              {t("loaderMessageModal.somethingWentWrong", "Something went wrong")}
            </Typography>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default LoaderMessageModal;
