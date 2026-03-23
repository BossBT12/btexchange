import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Container,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  SwapHoriz as SwapHorizIcon,
  Google,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import { AppColors } from "../../constant/appColors";
import authService from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import useSnackbar from "../../hooks/useSnackbar";
import OtpVerification from "../../components/otpVerification";
import { createTradeSocket } from "../../services/tradingSocketService";
import userService from "../../services/secondGameServices/userService";
import { FONT_SIZE } from "../../constant/lookUpConstant";

const tradeSocket = createTradeSocket();

export default function Login() {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || "";
  const [loginMethod, setLoginMethod] = useState("email"); // "email" | "mobile"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const { setUser } = useAuth();
  const { showSnackbar } = useSnackbar();

  const emailValidationSchema = Yup.object({
    email: Yup.string()
      .required(t("auth.validation.emailRequired"))
      .email(t("auth.validation.emailInvalid"))
      .max(100, t("auth.validation.emailMaxLength")),
    password: Yup.string()
      .required(t("auth.validation.passwordRequired"))
      .min(6, t("auth.validation.passwordMinLength")),
  });

  const mobileValidationSchema = Yup.object({
    email: Yup.string()
      .required(t("auth.validation.mobileRequired"))
      .matches(/^[0-9+\-\s()]{10,20}$/, t("auth.validation.mobileInvalid")),
    password: Yup.string()
      .required(t("auth.validation.passwordRequired"))
      .min(6, t("auth.validation.passwordMinLength")),
  });

  const formik = useFormik({
    initialValues: {
      email: initialEmail,
      password: "",
    },
    validationSchema:
      loginMethod === "email" ? emailValidationSchema : mobileValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const [tradeUser, networkUser] = await Promise.all([authService.login({
          email: values.email.trim(),
          password: values.password,
          deviceType: "web",
          deviceToken: "",
        }),
        userService.login({
          email: values.email.trim(),
          password: values.password,
        }),
        ]);

        const { data: loginData, message } = tradeUser || {};
        const { data: networkLoginData } = networkUser || {};

        if (loginData?.isEmailVerified === false || networkLoginData?.isEmailVerified === false) {
          setPendingEmail(values.email.trim());
          showSnackbar(t("auth.login.verifyEmailInfo"), "info");
          return;
        }

        if (loginData?.token && networkUser?.token) {
          const userData = {
            tradeData: {
              user: loginData,
              token: loginData.token,
              refreshToken: loginData.refreshToken,
            },
            networkData: {
              user: networkLoginData,
              token: networkUser.token,
              refreshToken: networkUser.refreshToken,
            }
          }
          setUser(userData);
          showSnackbar(message || t("auth.login.success"), "success");
          tradeSocket.joinUser(values.email.trim());
          navigate("/");
        }
      } catch (err) {
        console.error("❌ Login failed:", err);
        showSnackbar(
          err.response?.data?.message ||
          err.message ||
          t("auth.login.failed"),
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const handleOtpSuccess = () => {
    if (pendingEmail) {
      formik.setFieldValue("email", pendingEmail);
    }
    setPendingEmail(null);
    showSnackbar(t("auth.login.emailVerifiedSuccess"), "success");
  };

  if (pendingEmail) {
    return (
      <OtpVerification
        email={pendingEmail}
        onVerificationSuccess={handleOtpSuccess}
        onBack={() => setPendingEmail(null)}
      />
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        pb: 2,
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
          onClick={() => navigate("/")}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
        <Link
          to="/signup"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: AppColors.TXT_MAIN,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: "0.9375rem",
          }}
        >
          <SwapHorizIcon sx={{ fontSize: 20 }} />
          Sign Up
        </Link>
      </Box>

      <Box sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        pb: 1,
      }}>
        <Container maxWidth="md">
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: AppColors.TXT_MAIN,
              mb: 2,
            }}
          >
            {t("auth.login.title")}
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Typography
              variant="body1"
              onClick={() => setLoginMethod("email")}
              sx={{
                color:
                  loginMethod === "email" ? AppColors.TXT_MAIN : AppColors.TXT_SUB,
                fontWeight: loginMethod === "email" ? 600 : 400,
                cursor: "pointer",
                pb: 0.5,
                borderBottom:
                  loginMethod === "email"
                    ? `2px solid ${AppColors.TXT_MAIN}`
                    : "2px solid transparent",
              }}
            >
              {t("auth.login.emailTab")}
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", alignItems: "center" }}
          >
            <TextField
              fullWidth
              name="email"
              placeholder={
                loginMethod === "email"
                  ? t("auth.login.emailPlaceholder")
                  : t("auth.login.mobilePlaceholder")
              }
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              variant="outlined"
              autoComplete="email"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: AppColors.BG_SECONDARY,
                  color: AppColors.TXT_MAIN,
                  borderRadius: 2,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: AppColors.TXT_SUB, borderWidth: 1 },
                  "&.Mui-error fieldset": { borderColor: AppColors.ERROR },
                },
                "& .MuiInputBase-input": { py: 1.5, fontSize: FONT_SIZE.BODY2 },
                "& .MuiInputBase-input::placeholder": { color: AppColors.TXT_SUB, opacity: 1 },
                "& .MuiFormHelperText-root": { color: AppColors.ERROR, fontSize: FONT_SIZE.CAPTION },
              }}
            />

            <TextField
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.login.passwordPlaceholder")}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              variant="outlined"
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{
                          color: AppColors.TXT_SUB,
                          "&:hover": { color: AppColors.TXT_MAIN },
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 20 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: AppColors.BG_SECONDARY,
                  color: AppColors.TXT_MAIN,
                  borderRadius: 2,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: AppColors.TXT_SUB, borderWidth: 1 },
                  "&.Mui-error fieldset": { borderColor: AppColors.ERROR },
                },
                "& .MuiInputBase-input": { py: 1.5, fontSize: FONT_SIZE.BODY2 },
                "& .MuiInputBase-input::placeholder": { color: AppColors.TXT_SUB, opacity: 1 },
                "& .MuiFormHelperText-root": { color: AppColors.ERROR, fontSize: FONT_SIZE.CAPTION },
              }}
            />

            {/* Confirm button - dark gray, white text */}
            <Button
              type="submit"
              fullWidth
              disabled={loading}
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
              {loading ? t("auth.login.signingIn") : t("auth.login.confirm")}
            </Button>

            {/* Login without password (left) | Forgot password? (right) */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                width: "100%",
                gap: 1,
                mt: 1,
              }}
            >
              <Typography
                component="button"
                type="button"
                onClick={() => {
                  // Passwordless / OTP login - adjust route if you have one
                  navigate("/agent-service");
                }}
                sx={{
                  color: AppColors.TXT_MAIN,
                  fontSize: FONT_SIZE.CAPTION,
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  p: 0,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {t("auth.login.support")}
              </Typography>
              <Button
                variant="text"
                onClick={() =>
                  navigate("/forgot-password", { state: { email: formik.values.email } })
                }
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
                {t("auth.login.forgotPassword")}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
      <Box>
        {/* Divider with "or" */}
        {/* <Divider sx={{ my: 2 }}>or</Divider> */}

        {/* Google login */}
        <Box sx={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
          {/* <IconButton
            onClick={() => showSnackbar(t("auth.login.googleLoginComingSoon"), "info")}
            sx={{
              bgcolor: AppColors.BG_SECONDARY,
              color: AppColors.TXT_MAIN,
              p: 0.75,
              border: "1px solid rgba(255,255,255,0.12)",
              "&:hover": {
                bgcolor: "#252525",
              },
            }}
          >
            <Google sx={{ color: AppColors.TXT_SUB, fontSize: 26 }} />
          </IconButton> */}
          {/* Legal text at bottom */}
          <Typography
            variant="caption"
            sx={{
              mt: 2,
              px: 1,
              color: AppColors.TXT_SUB,
              textAlign: "center",
            }}
          >
            {t("auth.login.termsPrefix")}{" "}
            <Link
              to="/terms"
              style={{
                color: AppColors.GOLD_PRIMARY,
                textDecoration: "underline",
              }}
            >
              {t("auth.login.termsOfService")}
            </Link>{" "}
            {t("auth.login.and")}{" "}
            <Link
              to="/privacy"
              style={{
                color: AppColors.GOLD_PRIMARY,
                textDecoration: "underline",
              }}
            >
              {t("auth.login.privacyPolicy")}
            </Link>
            {t("auth.login.termsSuffix")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
