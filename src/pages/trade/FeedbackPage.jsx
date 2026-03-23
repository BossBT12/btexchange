import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import { ChevronLeft } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE, SPACING } from "../../constant/lookUpConstant";
import { addFeedback } from "../../store/slices/feedbackSlice";
import feedbackIllustration from "../../assets/images/feedback.png";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const FeedbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation(TRADE_NAMESPACE);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError(
        t(
          "feedback.errors.empty",
          "Please describe your issue or suggestion before submitting."
        )
      );
      return;
    }
    // Save feedback only in app store (Redux)
    dispatch(addFeedback(trimmed));
    setMessage("");
    setError("");
    navigate(-1);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
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
          {t("feedback.title", "Feedback")}
        </Typography>

        {/* spacer */}
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          px: 1,
          pt: 2.5,
          pb: 3,
        }}
      >
        {/* Feedback text card */}
        <Box
          sx={{
            borderRadius: 2,
            mb: 3,
            boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
          }}
        >
          <TextField
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError("");
            }}
            placeholder={t(
              "feedback.form.placeholder",
              "Welcome to feedback, please describe the problem in detail.\nIf possible, include a screenshot so we can process your feedback quickly."
            )}
            multiline
            minRows={6}
            maxRows={10}
            fullWidth
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(0,0,0,0.55)",
                borderRadius: 2,
                alignItems: "flex-start",
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.14)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.28)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: AppColors.GOLD_PRIMARY,
                },
              },
              "& .MuiInputBase-input": {
                fontSize: FONT_SIZE.BODY2,
                color: AppColors.TXT_MAIN,
                "::placeholder": {
                  color: "rgba(255,255,255,0.5)",
                  opacity: 1,
                },
              },
            }}
          />
          {error && (
            <Typography
              sx={{
                mt: 1,
                fontSize: FONT_SIZE.BODY2,
                color: AppColors.ERROR,
              }}
            >
              {error}
            </Typography>
          )}
        </Box>

        {/* Helper text + illustration */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            mb: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: FONT_SIZE.BODY,
              fontWeight: 500,
              color: AppColors.TXT_MAIN,
            }}
          >
          {t("feedback.helper.title", "Send helpful feedback")}
          </Typography>
          <Typography
            sx={{
              mt: 0.25,
              fontSize: FONT_SIZE.BODY2,
              color: AppColors.TXT_SUB,
            }}
          >
          {t(
            "feedback.helper.subtitle",
            "Chance to win Mystery Rewards"
          )}
          </Typography>

          <Box
            component="img"
            src={feedbackIllustration}
            alt={t("feedback.imageAlt", "Feedback illustration")}
            sx={{
              mt: 2,
              width: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.8))",
            }}
          />
        </Box>

        {/* Submit button */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            left: 0,
            pt: 1,
            pb: 1,
            mx: 1,
            bgcolor: AppColors.BG_MAIN,
          }}
        >
          <Button
            fullWidth
            className="btn-primary"
            onClick={handleSubmit}
            sx={{
              mt: 1,
              textTransform: "none",
              fontSize: FONT_SIZE.BODY,
              fontWeight: 600,
              borderRadius: 999,
              py: SPACING.SM,
              boxShadow: "0 10px 26px rgba(0,0,0,0.8)",
            }}
          >
            {t("feedback.actions.submit", "Submit")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FeedbackPage;

