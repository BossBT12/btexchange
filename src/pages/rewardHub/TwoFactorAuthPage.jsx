import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import { ChevronLeft, ContentCopy, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BTLoader from "../../components/Loader";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE, SPACING, BORDER_RADIUS } from "../../constant/lookUpConstant";
import userService from "../../services/secondGameServices/userService";
import { copyToClipboard } from "../../utils/utils";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

export default function TwoFactorAuthPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState(null); // { secret, qrCodeUrl, manualEntryKey }
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const isTwoFactorEnabled = Boolean(profile?.user?.isTwoFactorEnabled);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getProfile();
      setProfile(response?.data ?? response);
    } catch (err) {
      setError(err?.message ?? t("twoFactor.errors.loadProfile", "Failed to load profile"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleStartSetup = async () => {
    try {
      setSetupLoading(true);
      setError(null);
      setSuccess(null);
      setSetupData(null);
      const response = await userService.setup2FA();
      if (response?.success && response?.data) {
        setSetupData(response.data);
      } else {
        setError(response?.message ?? t("twoFactor.errors.startSetupFailed", "Failed to start 2FA setup"));
      }
    } catch (err) {
      setError(err?.message ?? err?.data?.message ?? t("twoFactor.errors.startSetupFailed", "Failed to start 2FA setup"));
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e) => {
    e.preventDefault();
    const token = verifyToken.replace(/\D/g, "").slice(0, 6);
    if (!token || token.length !== 6) {
      setError(t("twoFactor.errors.invalidCodeShort", "Please enter the 6-digit code from your authenticator app."));
      return;
    }
    try {
      setVerifyLoading(true);
      setError(null);
      setSuccess(null);
      const response = await userService.verify2FA({ token });
      if (response?.success) {
        setSuccess(t("twoFactor.success.enabled", "Two-factor authentication enabled successfully."));
        setVerifyToken("");
        setSetupData(null);
        await fetchProfile();
      } else {
        setError(response?.message ?? t("twoFactor.errors.invalidCode", "Invalid code. Please try again."));
      }
    } catch (err) {
      setError(err?.message ?? err?.data?.message ?? t("twoFactor.errors.invalidCode", "Invalid code. Please try again."));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    const token = disableToken.replace(/\D/g, "").slice(0, 6);
    if (!token || token.length !== 6) {
      setError(t("twoFactor.errors.disableCodeRequired", "Please enter your current 6-digit 2FA code to disable."));
      return;
    }
    try {
      setDisableLoading(true);
      setError(null);
      setSuccess(null);
      const response = await userService.disable2FA({ token });
      if (response?.success) {
        setSuccess(t("twoFactor.success.disabled", "Two-factor authentication disabled."));
        setDisableToken("");
        await fetchProfile();
      } else {
        setError(response?.message ?? t("twoFactor.errors.invalidCode", "Invalid code. Please try again."));
      }
    } catch (err) {
      setError(err?.message ?? err?.data?.message ?? t("twoFactor.errors.disableFailed", "Failed to disable 2FA."));
    } finally {
      setDisableLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.manualEntryKey || setupData?.secret) {
      await copyToClipboard(setupData.manualEntryKey || setupData.secret, setCopied);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: AppColors.BG_MAIN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BTLoader />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
        pb: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
          py: SPACING.SM,
          px: 1,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          aria-label={t("tradeTop.backAriaLabel", "Back")}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: AppColors.HLT_LIGHT },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography
          variant="h4"
          sx={{
            flex: 1,
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("twoFactor.title", "Two-Factor Authentication")}
        </Typography>
      </Box>

      <Box sx={{ px: 2, pt: SPACING.MD }}>
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              mb: 2,
              bgcolor: AppColors.ERR_LIGHT,
              color: AppColors.ERROR,
              border: `1px solid ${AppColors.ERROR}40`,
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{
              mb: 2,
              bgcolor: `${AppColors.SUCCESS}15`,
              color: AppColors.SUCCESS,
              border: `1px solid ${AppColors.SUCCESS}40`,
            }}
          >
            {success}
          </Alert>
        )}

        <Typography
          variant="body2"
          sx={{
            color: AppColors.TXT_SUB,
            mb: 2,
          }}
        >
          {t("twoFactor.intro", "Add an extra layer of security to your account. When enabled, you will need your password and a code from an authenticator app to sign in or perform sensitive actions.")}
        </Typography>

        {!isTwoFactorEnabled ? (
          <Box>
            {!setupData ? (
              <Box
                sx={{
                  bgcolor: AppColors.BG_CARD,
                  borderRadius: BORDER_RADIUS.XS,
                  border: `1px solid ${AppColors.BORDER_MAIN}`,
                  p: 2,
                  mb: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: AppColors.TXT_MAIN,
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  {t("twoFactor.status.disabled", "Status: Disabled")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_SUB,
                    mb: 2,
                  }}
                >
                  {t("twoFactor.disabled.description", "Enable 2FA to protect your account.")}
                </Typography>
                <Button
                  onClick={handleStartSetup}
                  disabled={setupLoading}
                  fullWidth
                  sx={{
                    background: `linear-gradient(90deg, ${AppColors.GOLD_PRIMARY} 0%, ${AppColors.GOLD_DARK} 100%)`,
                    color: AppColors.TXT_BLACK,
                    py: 1.25,
                    borderRadius: BORDER_RADIUS.LG,
                    fontSize: FONT_SIZE.BODY,
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      background: `linear-gradient(90deg, ${AppColors.GOLD_LIGHT} 0%, ${AppColors.GOLD_PRIMARY} 100%)`,
                    },
                  }}
                >
                  {setupLoading ? t("twoFactor.actions.loading", "Loading...") : t("twoFactor.actions.enable", "Enable two-factor authentication")}
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  bgcolor: AppColors.BG_CARD,
                  borderRadius: BORDER_RADIUS.XS,
                  border: `1px solid ${AppColors.BORDER_MAIN}`,
                  p: 2,
                  mb: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: AppColors.TXT_MAIN,
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  {t("twoFactor.setup.scanTitle", "Scan QR code")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_SUB,
                    mb: 2,
                  }}
                >
                  {t("twoFactor.setup.scanDescription", "Use an authenticator app (Google Authenticator, Authy, etc.) to scan this QR code.")}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  {setupData.qrCodeUrl ? (
                    <Box
                      component="img"
                      src={setupData.qrCodeUrl}
                      alt={t("twoFactor.setup.qrCodeAlt", "2FA QR Code")}
                      sx={{
                        width: 200,
                        height: 200,
                        bgcolor: "#fff",
                        borderRadius: BORDER_RADIUS.XS,
                        p: 0.5,
                      }}
                    />
                  ) : null}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: AppColors.TXT_SUB,
                    mb: 0.5,
                  }}
                >
                  {t("twoFactor.setup.manualLabel", "Or enter this key manually:")}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: AppColors.TXT_MAIN,
                      wordBreak: "break-all",
                      flex: 1,
                    }}
                  >
                    {setupData.manualEntryKey || setupData.secret}
                  </Typography>
                  <IconButton
                    onClick={handleCopySecret}
                    size="small"
                    sx={{
                      color: AppColors.GOLD_PRIMARY,
                      "&:hover": { bgcolor: AppColors.HLT_LIGHT },
                    }}
                  >
                    {copied ? (
                      <CheckCircle sx={{ fontSize: 20, color: AppColors.SUCCESS }} />
                    ) : (
                      <ContentCopy sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </Box>
                <Box component="form" onSubmit={handleVerifyAndEnable}>
                  <TextField
                    label={t("twoFactor.setup.codeLabel", "Enter 6-digit code")}
                    value={verifyToken}
                    onChange={(e) =>
                      setVerifyToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder={t("twoFactor.setup.codePlaceholder", "000000")}
                    inputProps={{ maxLength: 6 }}
                    fullWidth
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        bgcolor: AppColors.BG_MAIN,
                        borderRadius: BORDER_RADIUS.XS,
                        "& fieldset": { borderColor: AppColors.BORDER_MAIN },
                        color: AppColors.TXT_MAIN,
                        fontSize: FONT_SIZE.BODY,
                      },
                      "& .MuiInputLabel-root": { color: AppColors.TXT_SUB },
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        setSetupData(null);
                        setVerifyToken("");
                      }}
                      sx={{
                        borderColor: AppColors.BORDER_MAIN,
                        color: AppColors.TXT_MAIN,
                        textTransform: "none",
                        borderRadius: BORDER_RADIUS.XS,
                      }}
                    >
                      {t("twoFactor.actions.cancel", "Cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={verifyLoading || verifyToken.length !== 6}
                      sx={{
                        flex: 1,
                        background: `linear-gradient(90deg, ${AppColors.GOLD_PRIMARY} 0%, ${AppColors.GOLD_DARK} 100%)`,
                        color: AppColors.TXT_BLACK,
                        py: 1.25,
                        borderRadius: BORDER_RADIUS.XS,
                        fontSize: FONT_SIZE.BODY,
                        fontWeight: 600,
                        textTransform: "none",
                        "&:hover": {
                          background: `linear-gradient(90deg, ${AppColors.GOLD_LIGHT} 0%, ${AppColors.GOLD_PRIMARY} 100%)`,
                        },
                      }}
                    >
                      {verifyLoading ? <BTLoader /> : t("twoFactor.actions.verifyEnable", "Verify and enable")}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: AppColors.BG_CARD,
              borderRadius: BORDER_RADIUS.XS,
              border: `1px solid ${AppColors.BORDER_MAIN}`,
              p: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: AppColors.TXT_MAIN,
                fontWeight: 500,
                mb: 1,
              }}
            >
              {t("twoFactor.status.enabled", "Status: Enabled")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: AppColors.TXT_SUB,
                mb: 2,
              }}
            >
              {t("twoFactor.enabled.description", "Two-factor authentication is protecting your account. To disable it, enter your current 2FA code below.")}
            </Typography>
            <Box component="form" onSubmit={handleDisable}>
              <TextField
                label={t("twoFactor.enabled.codeLabel", "Enter current 6-digit code")}
                value={disableToken}
                onChange={(e) =>
                  setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={t("twoFactor.enabled.codePlaceholder", "000000")}
                inputProps={{ maxLength: 6 }}
                fullWidth
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: AppColors.BG_MAIN,
                    borderRadius: BORDER_RADIUS.XS,
                    "& fieldset": { borderColor: AppColors.BORDER_MAIN },
                    color: AppColors.TXT_MAIN,
                    fontSize: FONT_SIZE.BODY,
                  },
                  "& .MuiInputLabel-root": { color: AppColors.TXT_SUB },
                }}
              />
              <Button
                type="submit"
                disabled={disableLoading || disableToken.length !== 6}
                fullWidth
                sx={{
                  borderColor: AppColors.ERROR,
                  color: AppColors.ERROR,
                  py: 1.25,
                  borderRadius: BORDER_RADIUS.XS,
                  fontSize: FONT_SIZE.BODY,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: AppColors.ERR_LIGHT,
                    borderColor: AppColors.ERROR,
                  },
                }}
                variant="outlined"
              >
                {disableLoading ? <BTLoader /> : t("twoFactor.actions.disable", "Disable two-factor authentication")}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
