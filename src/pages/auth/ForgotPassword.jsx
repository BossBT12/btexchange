import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Container,
} from "@mui/material";
import {
  ChevronLeft,
  Lock,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { WarningAmberRounded } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import authService from "../../services/authService";
import useSnackbar from "../../hooks/useSnackbar";
import { FONT_SIZE } from "../../constant/lookUpConstant";
import userService from "../../services/secondGameServices/userService";

const steps = {
  request: "request",
  verify: "verify",
  reset: "reset",
};

const TAB_EMAIL = "email";
const TAB_MOBILE = "mobile";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || "";
  const [step, setStep] = useState(steps.request);
  const [email, setEmail] = useState(initialEmail);
  const [tab, setTab] = useState(TAB_EMAIL);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { showSnackbar } = useSnackbar();

  const isEmail = tab === TAB_EMAIL;

  const validationSchema = Yup.object({
    email: Yup.string()
      .required(isEmail ? "Email is required" : "Mobile number is required")
      .when([], {
        is: () => isEmail,
        then: (schema) =>
          schema
            .email("Please enter a valid email")
            .max(100, "Email must be less than 100 characters"),
        otherwise: (schema) =>
          schema.matches(
            /^[0-9+\-\s()]{10,20}$/,
            "Please enter a valid mobile number",
          ),
      }),
    verificationCode: Yup.string()
      .required("Verification code is required")
      .min(4, "Code must be at least 4 characters"),
    newPassword:
      step === steps.reset
        ? Yup.string()
            .required("New password is required")
            .min(6, "Password must be at least 6 characters")
        : Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      email: initialEmail,
      verificationCode: "",
      newPassword: "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        if (step === steps.request || step === steps.verify) {
          await authService.verifyForgotPasswordOtp({
            email: values.email.trim(),
            otp: values.verificationCode,
          });
          setEmail(values.email.trim());
          setStep(steps.reset);
          showSnackbar("OTP verified. Please set a new password.", "success");
        } else if (step === steps.reset) {
          await Promise.all([
            authService.resetPassword({
              email,
              newPassword: values.newPassword,
            }),
            userService.resetPassword({
              email,
              newPassword: values.newPassword,
            }),
          ]);
          showSnackbar(
            "Password reset successfully. Please log in.",
            "success",
          );
          navigate("/login", { state: { email } });
        }
      } catch (err) {
        console.error("Forgot password flow failed:", err);
        showSnackbar(
          err.response?.data?.message ||
            err.message ||
            "Something went wrong. Please try again.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const handleSendCode = async () => {
    // Don't show verification code validation when user only requested to send the code
    formik.setFieldTouched("verificationCode", false);
    const emailVal = formik.values.email?.trim();
    if (!emailVal) {
      formik.setFieldTouched("email", true);
      return;
    }
    if (formik.errors.email) return;
    setSendCodeLoading(true);
    try {
      await authService.forgotPassword({ email: emailVal });
      setEmail(emailVal);
      setResendCooldown(60);
      showSnackbar("Verification code sent.", "success");
    } catch (err) {
      showSnackbar(
        err.response?.data?.message ||
          err.message ||
          "Failed to send code. Please try again.",
        "error",
      );
    } finally {
      setSendCodeLoading(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  const showNewPasswordStep = step === steps.reset;

  return (
    <Box
      sx={{
        backgroundColor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header: back + title */}
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
          onClick={() =>
            showNewPasswordStep ? setStep(steps.verify) : navigate(-1)
          }
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
          Reset Password
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Warning banner */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          p: 1.5,
          mb: 1,
          mx: 2,
          borderRadius: 1,
          backgroundColor: "rgba(180, 120, 60, 0.25)",
          border: "1px solid rgba(212, 168, 95, 0.35)",
        }}
      >
        <WarningAmberRounded
          sx={{
            color: AppColors.GOLD_PRIMARY,
            fontSize: 22,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.9)",
          }}
        >
          You won&apos;t be able to withdraw assets within 24 hours after reset
          password
        </Typography>
      </Box>
      <Container
        maxWidth="md"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!showNewPasswordStep && (
          <>
            <Box sx={{ display: "flex", gap: 2, mb: 2, width: "100%" }}>
              <Typography
                variant="body1"
                onClick={() => setTab(TAB_EMAIL)}
                sx={{
                  color:
                    tab === TAB_EMAIL ? AppColors.TXT_MAIN : AppColors.TXT_SUB,
                  fontWeight: tab === TAB_EMAIL ? 600 : 400,
                  cursor: "pointer",
                  pb: 0.5,
                  borderBottom:
                    tab === TAB_EMAIL
                      ? `2px solid ${AppColors.TXT_MAIN}`
                      : "2px solid transparent",
                }}
              >
                Email
              </Typography>
            </Box>

            {/* Email / Mobile input */}
            <TextField
              name="email"
              fullWidth
              placeholder={
                isEmail ? "Enter email address" : "Enter mobile number"
              }
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              variant="outlined"
              sx={{
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
              }}
            />
            <Typography
              variant="body1"
              sx={{
                color: AppColors.TXT_MAIN,
                mb: 1,
                width: "100%",
                textAlign: "start",
              }}
            >
              E-mail verification
            </Typography>
            <TextField
              name="verificationCode"
              fullWidth
              placeholder="Verification code"
              value={formik.values.verificationCode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.verificationCode &&
                Boolean(formik.errors.verificationCode)
              }
              helperText={
                formik.touched.verificationCode &&
                formik.errors.verificationCode
              }
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendCodeLoading || resendCooldown > 0}
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
                        ? `${resendCooldown}s`
                        : sendCodeLoading
                          ? "Sending..."
                          : "Send code"}
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{
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
              }}
            />
          </>
        )}

        {showNewPasswordStep && (
          <>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: AppColors.TXT_MAIN,
                mb: 1,
              }}
            >
              New password
            </Typography>
            <TextField
              name="newPassword"
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.newPassword && Boolean(formik.errors.newPassword)
              }
              helperText={
                formik.touched.newPassword && formik.errors.newPassword
              }
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: AppColors.TXT_SUB, p: 0.5 }}
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
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
              }}
            />
          </>
        )}

        {/* Confirm button: dark grey, rounded, white text */}
        <Button
          type="button"
          fullWidth
          disabled={loading}
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
          {loading ? "Please wait..." : "Confirm"}
        </Button>
      </Container>
    </Box>
  );
}
