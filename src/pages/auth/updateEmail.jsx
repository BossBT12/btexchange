import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Container,
} from "@mui/material";
import { ChevronLeft, EmailOutlined } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import authService from "../../services/authService";
import useSnackbar from "../../hooks/useSnackbar";
import { FONT_SIZE } from "../../constant/lookUpConstant";
import OTPInput from "../../components/input/otpInput.jsx";
import userService from "../../services/secondGameServices/userService.js";

const OTP_LENGTH = 4;

function buildSchema(otpSent) {
  return Yup.object({
    newEmail: otpSent
      ? Yup.string()
          .required("Email is required")
          .email("Please enter a valid email address")
          .max(100, "Email must be less than 100 characters")
      : Yup.string(),
    otp: otpSent
      ? Yup.string()
          .required("Verification code is required")
          .length(
            OTP_LENGTH,
            `Enter the ${OTP_LENGTH}-digit code sent to your current email`,
          )
          .matches(/^\d+$/, "Code must contain only numbers")
      : Yup.string(),
  });
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: AppColors.BG_SECONDARY,
    color: AppColors.TXT_MAIN,
    borderRadius: 2,
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&.Mui-focused fieldset": {
      borderColor: AppColors.TXT_SUB,
      borderWidth: 1,
    },
    "&.Mui-error fieldset": { borderColor: AppColors.ERROR },
  },
  "& .MuiInputBase-input": { py: 1.5, fontSize: FONT_SIZE.BODY2 },
  "& .MuiInputBase-input::placeholder": {
    color: AppColors.TXT_SUB,
    opacity: 1,
  },
  "& .MuiFormHelperText-root": {
    color: AppColors.ERROR,
    fontSize: FONT_SIZE.CAPTION,
  },
};

export default function UpdateEmail() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [otpSent, setOtpSent] = useState(false);
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const validationSchema = useMemo(() => buildSchema(otpSent), [otpSent]);

  const formik = useFormik({
    initialValues: {
      newEmail: "",
      otp: "",
    },
    enableReinitialize: false,
    validationSchema,
    onSubmit: async (values) => {
      if (!otpSent) return;
      setConfirmLoading(true);
      try {
        const res = await authService.confirmChangeEmail({
          otp: values.otp.trim(),
          newEmail: values.newEmail.trim(),
        });
        if (res?.success !== false) {
          const res2 = await userService.updateEmail(values.newEmail.trim());
          const message =
            res?.message ||
            res2?.message ||
            "Your email has been updated successfully.";
          showSnackbar(message, "success");
          formik.resetForm();
          navigate("/user/profile");
        } else {
          showSnackbar(res?.message || "Could not update email. Check the code and try again.", "error");
        }
      } catch (err) {
        console.error("Confirm change email failed:", err); 
        showSnackbar(
          err.response?.data?.message ||
            err.message ||
            "Could not update email. Check the code and try again.",
          "error",
        );
      } finally {
        setConfirmLoading(false);
      }
    },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setInterval(
      () => setResendCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => window.clearInterval(t);
  }, [resendCooldown]);

  const handleRequestOtp = async () => {
    setSendOtpLoading(true);
    try {
      const res = await authService.requestOtpForChangeEmail();
      const message =
        res?.message ||
        "We sent a verification code to your registered email address.";
      showSnackbar(message, "success");
      setOtpSent(true);
      formik.setFieldValue("otp", "");
      setResendCooldown(60);
    } catch (err) {
      console.error("Request change-email OTP failed:", err);
      showSnackbar(
        err.response?.data?.message ||
          err.message ||
          "Could not send the code. Please try again.",
        "error",
      );
    } finally {
      setSendOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendOtpLoading) return;
    await handleRequestOtp();
  };

  return (
    <Box
      sx={{
        color: AppColors.TXT_MAIN,
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1,
          position: "sticky",
          top: 0,
          zIndex: 1000,
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
        <Typography
          sx={{
            fontSize: "1rem",
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
          }}
        >
          Update email
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          px: 2,
          pb: 3,
          flex: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <EmailOutlined
            sx={{
              color: AppColors.GOLD_PRIMARY,
              fontSize: 22,
              flexShrink: 0,
              mt: 0.25,
            }}
          />
          <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
            {otpSent
              ? "Enter the code from your current email, then your new address. We’ll verify both before updating your account."
              : "We’ll email a verification code to your current registered address. You’ll need that code to confirm your new email."}
          </Typography>
        </Box>

        {!otpSent ? (
          <Button
            type="button"
            fullWidth
            disabled={sendOtpLoading}
            onClick={handleRequestOtp}
            sx={{
              py: 1.25,
              textTransform: "none",
              borderRadius: 20,
              bgcolor: AppColors.BG_SECONDARY,
              color: AppColors.TXT_MAIN,
              fontWeight: 600,
              fontSize: FONT_SIZE.BODY2,
              "&:hover": { bgcolor: "#252525" },
              "&:disabled": { color: AppColors.TXT_SUB },
            }}
          >
            {sendOtpLoading ? "Sending code…" : "Send verification code"}
          </Button>
        ) : (
          <>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_MAIN,
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                New email address
              </Typography>
              <TextField
                fullWidth
                name="newEmail"
                placeholder="Enter new email address"
                value={formik.values.newEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.newEmail && Boolean(formik.errors.newEmail)
                }
                helperText={formik.touched.newEmail && formik.errors.newEmail}
                variant="outlined"
                autoComplete="email"
                sx={textFieldSx}
              />
            </Box>

            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: AppColors.TXT_MAIN,
                  mb: 1,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Verification code
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <OTPInput
                  name="otp"
                  length={OTP_LENGTH}
                  value={formik.values.otp}
                  onChange={formik.handleChange}
                />
                {formik.touched.otp && formik.errors.otp && (
                  <Typography
                    variant="caption"
                    sx={{ color: AppColors.ERROR, alignSelf: "center" }}
                  >
                    {formik.errors.otp}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button
                  type="button"
                  size="small"
                  onClick={handleResendOtp}
                  disabled={sendOtpLoading || resendCooldown > 0}
                  sx={{
                    color: AppColors.GOLD_PRIMARY,
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: "auto",
                    p: 0.5,
                    "&:hover": {
                      backgroundColor: "transparent",
                      textDecoration: "underline",
                    },
                    "&.Mui-disabled": { color: AppColors.TXT_SUB },
                  }}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : sendOtpLoading
                      ? "Sending…"
                      : "Resend code"}
                </Button>
              </Box>
            </Box>

            <Button
              type="button"
              fullWidth
              disabled={confirmLoading}
              onClick={() => {
                formik.setFieldTouched("newEmail", true);
                formik.setFieldTouched("otp", true);
                formik.handleSubmit();
              }}
              sx={{
                py: 1,
                textTransform: "none",
                borderRadius: 20,
                bgcolor: AppColors.BG_SECONDARY,
                color: AppColors.TXT_MAIN,
                fontWeight: 600,
                fontSize: FONT_SIZE.BODY2,
                "&:hover": { bgcolor: "#252525" },
                "&:disabled": { color: AppColors.TXT_SUB },
              }}
            >
              {confirmLoading ? "Updating…" : "Confirm new email"}
            </Button>
          </>
        )}
      </Container>
    </Box>
  );
}
