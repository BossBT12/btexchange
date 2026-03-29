import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Container,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import authService from "../../services/authService";
import useSnackbar from "../../hooks/useSnackbar";
import { decryptData } from "../../utils/encryption";
import { FONT_SIZE } from "../../constant/lookUpConstant";
import CountryCodePicker from "../../components/CountryCodePicker";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import userService from "../../services/secondGameServices/userService";

function countryFromDialCode(dialCode) {
  if (!dialCode) return null;
  const raw = String(dialCode).trim().replace(/\s/g, "");
  const withPlus = raw.startsWith("+") ? raw : `+${raw}`;
  let displayNames;
  try {
    displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    displayNames = null;
  }
  for (const iso2 of getCountries()) {
    try {
      const dc = `+${getCountryCallingCode(iso2)}`;
      if (dc === withPlus) {
        return {
          iso2,
          dialCode: dc,
          name: displayNames?.of(iso2) || iso2,
          flag: "",
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

const validationSchema = Yup.object({
  fullName: Yup.string()
    .required("Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be less than 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: Yup.string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),
  mobile: Yup.string()
    .required("Mobile number is required")
    .matches(/^\d{6,14}$/, "Please enter a valid mobile number"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(30, "Password must be at most 30 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number"),
  referrerId: Yup.string()
    .required("Referral code is required")
    .max(50, "Referral code must be less than 50 characters"),
});

function PasswordRequirement({ met, label }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        color: AppColors.TXT_SUB,
        fontSize: FONT_SIZE.CAPTION,
      }}
    >
      <CheckCircleIcon
        sx={{
          fontSize: 18,
          color: met ? AppColors.SUCCESS : AppColors.TXT_SUB,
        }}
      />
      <Typography
        component="span"
        sx={{ fontSize: FONT_SIZE.CAPTION, color: AppColors.TXT_SUB }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.inputValue || "";
  const verifyEmailResume = location.state?.verifyEmailResume;
  const isLockedProfile = Boolean(verifyEmailResume?.email);

  const [searchParams] = useSearchParams();
  const referralId = searchParams.get("ref") || "";
  const decryptedReferralId = decryptData(referralId) ?? referralId;

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    iso2: "IN",
    dialCode: "+91",
    name: "India",
    flag: "🇮🇳",
  });
  const [signupMethod, setSignupMethod] = useState("email"); // "email" | "mobile"
  const { showSnackbar } = useSnackbar();

  const initialFormValues = useMemo(
    () => ({
      fullName: verifyEmailResume?.fullName ?? "",
      email: verifyEmailResume?.email ?? initialEmail,
      mobile: verifyEmailResume?.mobile
        ? String(verifyEmailResume.mobile).replace(/\D/g, "").slice(0, 14)
        : "",
      password: "",
      referrerId: verifyEmailResume?.referrerId ?? decryptedReferralId,
    }),
    [verifyEmailResume, initialEmail, decryptedReferralId],
  );

  useEffect(() => {
    if (!verifyEmailResume?.countryCode) return;
    const resolved = countryFromDialCode(verifyEmailResume.countryCode);
    if (resolved) setSelectedCountry(resolved);
  }, [verifyEmailResume?.countryCode]);

  const formik = useFormik({
    initialValues: initialFormValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const nationalNumber = String(values.mobile || "")
        .replace(/\D/g, "")
        .slice(0, 14);
      const body = {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        countryCode: selectedCountry?.dialCode || "+91",
        mobile: nationalNumber,
        password: values.password,
        referrerId: values.referrerId.trim(),
      };
      try {
        const [signup1Res, signup2Res] = await Promise.all([
          authService.register(body),
          userService.register(body),
        ]);
        if (signup1Res?.success || signup2Res?.success) {
          handleVerificationSuccess();
          showSnackbar(
            signup1Res?.message ||
              "Registration successful. Please check your email for verification.",
            "success",
          );
          return;
        }
      } catch (err) {
        console.error("Registration error:", err);
        const api = err?.response?.data ?? err;
        const msg = api?.message || err?.message || "";
        showSnackbar(msg || "Registration failed. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    },
  });

  const pw = formik.values.password;
  const requirements = {
    length: pw.length >= 8 && pw.length <= 30,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  };

  const handleVerificationSuccess = () => {
    navigate("/login", { state: { email: formik.values.email } });
  };

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
          to="/login"
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
          Log In
        </Link>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          pb: 1,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: AppColors.TXT_MAIN,
              mb: 2,
            }}
          >
            Sign Up
          </Typography>

          {isLockedProfile ? (
            <Typography
              variant="body2"
              sx={{
                color: AppColors.TXT_SUB,
                mb: 2,
                lineHeight: 1.5,
                maxWidth: "28rem",
                mx: "auto",
              }}
            >
              Your account is not verified yet. Your details are shown below —
              enter the same password you use to log in, then continue to verify
              your email with the code we send you.
            </Typography>
          ) : null}

          {/* Email / Mobile tabs */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Typography
              variant="body1"
              onClick={() => {
                if (!isLockedProfile) setSignupMethod("email");
              }}
              sx={{
                color:
                  signupMethod === "email"
                    ? AppColors.TXT_MAIN
                    : AppColors.TXT_SUB,
                fontWeight: signupMethod === "email" ? 600 : 400,
                cursor: isLockedProfile ? "default" : "pointer",
                pb: 0.5,
                borderBottom:
                  signupMethod === "email"
                    ? `2px solid ${AppColors.TXT_MAIN}`
                    : "2px solid transparent",
              }}
            >
              Email
            </Typography>
          </Box>

          {/* Form */}
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: "28rem",
              mx: "auto",
            }}
          >
            <TextField
              fullWidth
              name="fullName"
              placeholder="Enter full name"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fullName && Boolean(formik.errors.fullName)}
              helperText={formik.touched.fullName && formik.errors.fullName}
              variant="outlined"
              autoComplete="name"
              disabled={isLockedProfile}
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

            <TextField
              fullWidth
              name="email"
              placeholder="Enter email address"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              variant="outlined"
              autoComplete="email"
              disabled={isLockedProfile}
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
            {/* Mobile number */}
            <TextField
              fullWidth
              name="mobile"
              placeholder="Enter mobile number"
              value={formik.values.mobile}
              onChange={(e) => {
                const digitsOnly = String(e.target.value || "")
                  .replace(/\D/g, "")
                  .slice(0, 14);
                formik.setFieldValue("mobile", digitsOnly, true);
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.mobile && Boolean(formik.errors.mobile)}
              helperText={formik.touched.mobile && formik.errors.mobile}
              variant="outlined"
              autoComplete="mobile"
              inputMode="numeric"
              disabled={isLockedProfile}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0.5 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", mr: 0.5 }}
                    >
                      <CountryCodePicker
                        valueIso2={selectedCountry?.iso2}
                        onChange={(c) => setSelectedCountry(c)}
                        disabled={isLockedProfile}
                      />
                    </Box>
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
                "& .MuiInputBase-input": {
                  py: 1.5,
                  fontSize: FONT_SIZE.BODY2,
                  pl: 1,
                  ml: 1,
                  borderLeft: "1px solid rgba(255,255,255,0.12)",
                },
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
            <TextField
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              variant="outlined"
              autoComplete="new-password"
              InputProps={{
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

            {/* Password requirements */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                mb: 0.5,
                alignItems: "flex-start",
              }}
            >
              <PasswordRequirement
                met={requirements.length}
                label="8-30 Characters"
              />
              <PasswordRequirement
                met={requirements.upper}
                label="At least one uppercase letter"
              />
              <PasswordRequirement
                met={requirements.lower}
                label="At least one lowercase letter"
              />
              <PasswordRequirement
                met={requirements.number}
                label="At least one number"
              />
            </Box>

            {/* Referral Code */}
            <Typography
              variant="body1"
              sx={{ fontWeight: 500, color: AppColors.TXT_MAIN }}
            >
              Referral Code
            </Typography>
            <TextField
              fullWidth
              name="referrerId"
              placeholder="Fill in the referral code"
              value={formik.values.referrerId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.referrerId && Boolean(formik.errors.referrerId)
              }
              helperText={formik.touched.referrerId && formik.errors.referrerId}
              variant="outlined"
              disabled={isLockedProfile}
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

            {/* Confirm button */}
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
              {loading ? "Creating Account..." : "Confirm"}
            </Button>
          </Box>
        </Container>
      </Box>

      <Box>
        {/* Divider with "or" */}
        {/* <Divider sx={{ my: 2 }}>
          <Typography component="span" sx={{ color: AppColors.TXT_SUB, fontSize: FONT_SIZE.BODY }}>
            or
          </Typography>
        </Divider> */}

        {/* Google sign-up */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* <IconButton
            onClick={() => showSnackbar("Google sign-up coming soon", "info")}
            sx={{
              bgcolor: AppColors.BG_SECONDARY,
              color: AppColors.TXT_MAIN,
              p: 0.75,
              border: "1px solid rgba(255,255,255,0.12)",
              "&:hover": { bgcolor: "#252525" },
            }}
          >
            <Google sx={{ color: AppColors.TXT_SUB, fontSize: 26 }} />
          </IconButton> */}
          {/* Footer legal text */}
          <Typography
            variant="caption"
            sx={{
              mt: 4,
              px: 1,
              color: AppColors.TXT_SUB,
              textAlign: "center",
            }}
          >
            By signing up/logging in, you agree to our{" "}
            <Link
              to="/terms"
              style={{
                color: AppColors.GOLD_PRIMARY,
                textDecoration: "underline",
              }}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              style={{
                color: AppColors.GOLD_PRIMARY,
                textDecoration: "underline",
              }}
            >
              Privacy Policy
            </Link>
            .
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
