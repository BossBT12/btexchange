import { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Input,
  Container,
} from "@mui/material";
import { ChevronLeft, InfoOutlined } from "@mui/icons-material";
import { AppColors } from "../constant/appColors";
import authService from "../services/authService";
import useSnackbar from "../hooks/useSnackbar";
import { FONT_SIZE } from "../constant/lookUpConstant";
import userService from "../services/secondGameServices/userService";

const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SEC = 60;

function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 3) return `${local}***@${domain}`;
  return `${local.slice(0, 3)}***@${domain}`;
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const OtpVerification = ({ otpFormData, onVerificationSuccess, onBack }) => {
  const otpLength = OTP_LENGTH;
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SEC);
  const [resendLoading, setResendLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef([]);

  const validationSchema = Yup.object({
    otp: Yup.string()
      .required("OTP is required")
      .matches(`^\\d{${otpLength}}$`, `OTP must be exactly ${otpLength} digits`)
      .length(otpLength, `OTP must be ${otpLength} digits`),
  });

  const formik = useFormik({
    initialValues: {
      otp: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await authService.verifyOtp({
          email: otpFormData?.userData?.email || "",
          otp: values.otp,
        });

        if (!response?.success) {
          showSnackbar(response?.message || "OTP verification failed", "error");
          return;
        }
        await userService.register(otpFormData?.userData || {});
        onVerificationSuccess();
        showSnackbar("OTP verification successful", "success");
        setSuccess(true);
      } catch (err) {
        console.error("❌ OTP verification failed:", err);
        showSnackbar(
          err.response?.data?.message ||
          err.message ||
          "Invalid OTP. Please try again.",
          "error"
        );
        formik.setFieldValue("otp", "");
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const response = await authService.resendOtp({ email: otpFormData?.userData?.email || "" });
      if (!response?.success) {
        showSnackbar(
          response?.message || "Failed to resend OTP. Please try again.",
          "error"
        );
        return;
      }
      showSnackbar(response?.message || "OTP sent successfully.", "success");
      setResendTimer(RESEND_COOLDOWN_SEC);
    } catch (err) {
      showSnackbar(
        err.response?.data?.message ||
        err.message ||
        "Failed to resend OTP. Please try again.",
        "error"
      );
    } finally {
      setResendLoading(false);
    }
  };

  const value = formik.values.otp;
  const handleOtpChange = (index, digit) => {
    const arr = value.split("");
    while (arr.length < otpLength) arr.push("");
    arr[index] = digit;
    const next = arr.join("");
    formik.setFieldValue("otp", next);
    formik.setFieldTouched("otp", true);
    if (next.length === otpLength) {
      setTimeout(() => formik.handleSubmit(), 100);
    } else if (digit && index < otpLength - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const arr = value.split("");
      arr.pop();
      formik.setFieldValue("otp", arr.join(""));
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData?.getData("text/plain") || "").replace(/\D/g, "").slice(0, otpLength);
    if (!text) return;
    formik.setFieldValue("otp", text);
    formik.setFieldTouched("otp", true);
    const nextIndex = Math.min(text.length, otpLength - 1);
    inputRefs.current[nextIndex]?.focus();
    if (text.length === otpLength) setTimeout(() => formik.handleSubmit(), 100);
  };

  return (
    <Box
      sx={{
        color: AppColors.TXT_MAIN,
        display: "flex",
        flexDirection: "column",
        pb: 4,
      }}
    >
      {/* Nav: back + title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 48,
          mb: 3,
        }}
      >
        <IconButton
          onClick={onBack}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
            textAlign: "start",
          }}
        >
          Verify your email
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Instruction: single line + masked email (light gray) */}
      <Container maxWidth="md">
        <Box sx={{ maxWidth: "28rem", mx: "auto" }}>
          <Typography
            variant="body1"
            sx={{
              color: AppColors.TXT_SUB,
              mb: 3,
              lineHeight: 1.4,
              textAlign: "start",
            }}
          >
            A verification code will send to {maskEmail(otpFormData?.userData?.email || "") || "your email"}
          </Typography>

          {/* 6 OTP boxes: square, gap, no separator, gold focus */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "flex-start",
              mb: 3,
            }}
          >
            {Array.from({ length: otpLength }).map((_, i) => (
              <Input
                key={i}
                inputRef={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value[i] || ""}
                onFocus={() => setFocusedIndex(i)}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(-1);
                  handleOtpChange(i, v);
                }}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={handleOtpPaste}
                disableUnderline
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "6px",
                  bgcolor: AppColors.BG_SECONDARY,
                  border: "1px solid",
                  borderColor:
                    focusedIndex === i ? AppColors.GOLD_PRIMARY : AppColors.HLT_NONE,
                  color: AppColors.TXT_MAIN,
                  fontSize: FONT_SIZE.BODY2,
                  fontWeight: 600,
                  textAlign: "center",
                  "&:focus": {
                    borderColor: AppColors.GOLD_PRIMARY,
                    outline: "none",
                  },
                  "& .MuiInput-input": {
                    textAlign: "center",
                  },
                }}
              />
            ))}
          </Box>

          {/* Resend row: "No code received" + icon left, timer + Resend right */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography
                variant="body1"
                sx={{
                  color: AppColors.TXT_SUB,
                }}
              >
                No code received
              </Typography>
              <InfoOutlined
                sx={{
                  fontSize: 18,
                  color: AppColors.TXT_MAIN,
                  opacity: 0.8,
                }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              {resendTimer > 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_MAIN,
                  }}
                >
                  {formatTimer(resendTimer)}
                </Typography>
              )}
              <Button
                variant="text"
                disabled={resendTimer > 0 || resendLoading}
                onClick={handleResend}
                sx={{
                  color: AppColors.TXT_MAIN,
                  textTransform: "none",
                  fontSize: FONT_SIZE.CAPTION,
                  fontWeight: 500,
                  p: 0,
                  minWidth: "auto",
                  "&:hover": {
                    textDecoration: "underline",
                    bgcolor: "transparent",
                  },
                }}
              >
                {resendLoading ? "Sending..." : "Resend"}
              </Button>
            </Box>
          </Box>

          {/* Confirm button: gradient gold, pill, white text */}
          <Button
            type="button"
            fullWidth
            disabled={loading || success || value.length !== otpLength}
            onClick={() => formik.handleSubmit()}
            sx={{
              mt: 1,
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
            {loading ? "Verifying..." : "Confirm"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default OtpVerification;
