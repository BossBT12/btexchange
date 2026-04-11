import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  CheckCircle,
  ChevronLeft,
  ContentCopy,
  KeyboardArrowRight,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import useAuth from "../../hooks/useAuth";
import useSnackbar from "../../hooks/useSnackbar";
import { copyToClipboard } from "../../utils/utils";
import { ICON_SIZE } from "../../constant/lookUpConstant";
import userService from "../../services/secondGameServices/userService";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";

const Row = ({ label, value, onCopy, onClick, labelColor, valueColor, rightIcon = "arrow", copied }) => (
  <Box
    onClick={onClick}
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      py: 1.5,
      borderBottom: "1px solid",
      borderColor: "rgba(255,255,255,0.08)",
      cursor: onClick ? "pointer" : "default",
    }}
  >
    <Typography
      variant="body1"
      sx={{
        color: labelColor || AppColors.TXT_MAIN,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {value != null && value !== "" && (
        <Typography
          variant="body1"
          sx={{
            color: valueColor || AppColors.TXT_MAIN,
          }}
        >
          {value}
        </Typography>
      )}
      {onCopy && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.25,
            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
          }}
        >
          {copied ? <CheckCircle sx={{ fontSize: ICON_SIZE.SM, color: "#4CAF50" }} /> : <ContentCopy sx={{ fontSize: ICON_SIZE.SM }} />}
        </IconButton>
      )}
      {rightIcon === "arrow" && (onClick || !onCopy) && (
        <KeyboardArrowRight sx={{ color: AppColors.TXT_MAIN, fontSize: ICON_SIZE.SM }} />
      )}
    </Box>
  </Box>
);

const Profile = () => {
  const navigate = useNavigate();
  const { userData, clear } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [copied, setCopied] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [rewardHubProfile, setRewardHubProfile] = useState(null);
  const user = userData;

  useEffect(() => {
    const fetchRewardHubProfile = async () => {
      try {
        const response = await userService.getProfile();
        setRewardHubProfile(response?.data ?? response);
      } catch {
        // Non-blocking; 2FA row falls back to userData
      }
    };
    fetchRewardHubProfile();
  }, []);

  const handleCopyUid = async () => {
    const uid = String(user?.UID ?? "");
    await copyToClipboard(uid, setCopied);
  };

  const handleLogout = () => {
    clear();
    // showSnackbar(t("rewardHub.profile.loggedOut", "Logged out"), "success");
    navigate("/login");
  };

  const displayName = user?.fullName || user?.username || "—";
  const email = user?.email || "—";
  const nickname = user?.nickname ?? displayName;
  const uid = user?.UID != null ? String(user.UID) : "—";
  const isVerified = user?.isVerified ?? user?.isEmailVerified ?? false;

  return (
    <Box
      sx={{
        color: AppColors.TXT_MAIN,
        display: "flex",
        flexDirection: "column",
        px: 2,
        py: 1,
        pb: 1,
      }}
    >
      {/* Header: back + title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          aria-label={t("tradeTop.backAriaLabel", "Back")}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("rewardHub.profile.title", "User Center")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Avatar + edit */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
        <Box sx={{ position: "relative" }}>
          <Avatar
            sx={{
              bgcolor: AppColors.HLT_LIGHT,
              color: AppColors.GOLD_PRIMARY,
              width: 64,
              height: 64,
            }}
          >

          </Avatar>
        </Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
            mt: 1.5,
          }}
        >
          {displayName}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: AppColors.TXT_SUB,
          }}
        >
          {email}
        </Typography>
      </Box>

      {/* Divider */}
      <Box
        sx={{
          height: 1,
          backgroundColor: "rgba(255,255,255,0.08)",
          mb: 0,
        }}
      />

      {/* List */}
      <Box sx={{ mt: 0 }}>
        <Row
          label={t("rewardHub.profile.rows.uid", "UID")}
          value={uid}
          onCopy={uid !== "—" ? handleCopyUid : undefined}
          copied={copied}
        />
        <Row
          label={t("rewardHub.profile.rows.fullName", "Full Name")}
          value={nickname}
          onClick={() => { }}
        />
        <Row
          label={t("rewardHub.profile.rows.identityVerification", "Identity Verification")}
          value={
            isVerified
              ? t("rewardHub.profile.rows.identityVerified", "Verified")
              : t("rewardHub.profile.rows.identityUnverified", "Unverified")
          }
          valueColor={isVerified ? AppColors.TXT_MAIN : AppColors.GOLD_PRIMARY}
          onClick={() => { }}
        />
        <Row
          label={t("rewardHub.profile.rows.twoFactor", "Two-Factor Authentication")}
          value={
            rewardHubProfile?.user?.isTwoFactorEnabled ?? user?.twoFactorAuth
              ? t("rewardHub.profile.rows.twoFactorEnabled", "Enabled")
              : t("rewardHub.profile.rows.twoFactorDisabled", "Disabled")
          }
          valueColor={
            rewardHubProfile?.user?.isTwoFactorEnabled ?? user?.twoFactorAuth
              ? AppColors.TXT_MAIN
              : AppColors.GOLD_PRIMARY
          }
          onClick={() => navigate("/reward-hub/two-factor-authentication")}
        />
        <Row
          label={t("rewardHub.profile.rows.updateEmail", "Update Email")}
          onClick={() => { navigate("/update-email") }}
        />
        <Row
          label={t("rewardHub.profile.rows.changePassword", "Change Password")}
          onClick={() => { navigate("/change-password") }}
        />
        <Row
          label={t("rewardHub.profile.rows.switchAccount", "Switch account")}
          onClick={() => navigate("/login")}
        />
        <Row
          label={t("rewardHub.profile.rows.logout", "Log out current account")}
          labelColor={AppColors.ERROR}
          onClick={() => setLogoutConfirmOpen(true)}
          rightIcon="arrow"
        />
      </Box>

      <ConfirmationModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title={t("rewardHub.profile.logoutConfirmTitle", "Log out?")}
        description={t(
          "rewardHub.profile.logoutConfirmDescription",
          "You will be signed out of this account. You can sign in again anytime.",
        )}
        okText={t("rewardHub.profile.logoutConfirmOk", "Log out")}
      />
    </Box>
  );
};

export default Profile;
