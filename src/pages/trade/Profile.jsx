import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Check,
  CheckCircle,
  ChevronLeft,
  Close,
  ContentCopy,
  Edit,
  KeyboardArrowRight,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { AppColors } from "../../constant/appColors";
import useAuth from "../../hooks/useAuth";
import { copyToClipboard } from "../../utils/utils";
import { ICON_SIZE } from "../../constant/lookUpConstant";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import useSnackbar from "../../hooks/useSnackbar";
import authService from "../../services/authService";
import userService from "../../services/secondGameServices/userService";
import { mergeAuthState } from "../../store/slices/userAuthSlice";

const Row = ({
  label,
  value,
  onCopy,
  onClick,
  labelColor,
  valueColor,
  rightIcon = "arrow",
  copied,
}) => (
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
        fontWeight: 500,
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
          {copied ? (
            <CheckCircle sx={{ fontSize: ICON_SIZE.XS, color: "#4CAF50" }} />
          ) : (
            <ContentCopy sx={{ fontSize: ICON_SIZE.XS }} />
          )}
        </IconButton>
      )}
      {rightIcon === "arrow" && (onClick || !onCopy) && (
        <KeyboardArrowRight
          sx={{ color: AppColors.TXT_MAIN, fontSize: ICON_SIZE.SM }}
        />
      )}
    </Box>
  </Box>
);

const RowName = ({
  label,
  value,
  labelColor,
  valueColor,
  isEditing,
  editValue,
  onStartEdit,
  onEditChange,
  onCancelEdit,
  onSaveEdit,
  isSaving,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      py: 1.5,
      borderBottom: "1px solid",
      borderColor: "rgba(255,255,255,0.08)",
    }}
  >
    <Typography
      variant="body1"
      sx={{
        color: labelColor || AppColors.TXT_MAIN,
        fontWeight: 500,
      }}
    >
      {label}
    </Typography>
    {isEditing ? (
      <TextField
        variant="standard"
        value={editValue}
        onChange={(e) => onEditChange(e.target.value)}
        disabled={isSaving}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onSaveEdit();
          if (e.key === "Escape") onCancelEdit();
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end" sx={{ gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={onCancelEdit}
                disabled={isSaving}
                sx={{
                  color: AppColors.TXT_SUB,
                  "&:hover": {
                    backgroundColor: `${AppColors.ERROR}20`,
                    color: AppColors.ERROR,
                  },
                }}
              >
                <Close fontSize="small" sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={onSaveEdit}
                disabled={isSaving}
                sx={{
                  color: AppColors.SUCCESS,
                  "&:hover": { backgroundColor: `${AppColors.SUCCESS}20` },
                }}
              >
                {isSaving ? (
                  <CircularProgress size={16} sx={{ color: "inherit" }} />
                ) : (
                  <Check fontSize="small" sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            bgcolor: "transparent",
            borderRadius: 0,
            "& fieldset": { borderColor: "none" },
            "&:hover fieldset": { borderColor: "none" },
            "&.Mui-focused fieldset": { borderColor: "none" },
            "& input": { color: AppColors.TXT_MAIN, p: 0, fontSize: 12 },
          },
        }}
      />
    ) : (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          cursor: "pointer",
        }}
        onClick={onStartEdit}
      >
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
        <Edit sx={{ color: AppColors.TXT_MAIN, fontSize: 16 }} />
      </Box>
    )}
  </Box>
);

const Profile = () => {
  const navigate = useNavigate();
  const { userData, clear } = useAuth();
  const dispatch = useDispatch();
  const { showSnackbar } = useSnackbar();
  const [copied, setCopied] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const user = userData;
  const { t } = useTranslation(TRADE_NAMESPACE);

  const handleCopyUid = async () => {
    const uid = String(user?.UID ?? "");
    await copyToClipboard(uid, setCopied);
  };

  const handleLogout = () => {
    clear();
    // showSnackbar(t("profile.loggedOut", "Logged out"), "success");
    navigate("/login");
  };

  const handleStartEditName = () => {
    setFullNameInput(user?.fullName || user?.username || "");
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setFullNameInput("");
  };

  const handleSaveEditName = async () => {
    const trimmedName = fullNameInput.trim();
    if (!trimmedName) {
      showSnackbar(
        t("profile.fullNameRequired", "Please enter full name"),
        "error",
      );
      return;
    }

    if (trimmedName === (user?.fullName || "").trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsSavingName(true);
      await Promise.all([authService.updateName(trimmedName), userService.updateName(trimmedName)]);
      dispatch(
        mergeAuthState({
          userData: {
            ...user,
            fullName: trimmedName,
          },
        }),
      );
      setIsEditingName(false);
      showSnackbar(
        t("profile.fullNameUpdated", "Name updated successfully"),
        "success",
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        t("profile.fullNameUpdateFailed", "Failed to update name");
      showSnackbar(message, "error");
    } finally {
      setIsSavingName(false);
    }
  };

  const displayName = user?.fullName || user?.username || "—";
  const email = user?.email || "—";
  const nickname = user?.nickname ?? displayName;
  const uid = user?.UID != null ? String(user.UID) : "—";
  const isVerified = user?.isVerified ?? user?.isEmailVerified ?? false;
  const isTwoFactorEnabled =
    user?.isTwoFactorEnabled ??
    user?.twoFactorEnabled ??
    user?.twoFactorAuth ??
    false;

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
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("profile.title", "User Center")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Avatar + edit */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Avatar
            sx={{
              bgcolor: AppColors.HLT_LIGHT,
              color: AppColors.GOLD_PRIMARY,
              width: 64,
              height: 64,
            }}
          ></Avatar>
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
          label={t("profile.uid", "UID")}
          value={uid}
          onCopy={uid !== "—" ? handleCopyUid : undefined}
          copied={copied}
        />
        <RowName
          label={t("profile.fullName", "Full Name")}
          value={nickname}
          isEditing={isEditingName}
          editValue={fullNameInput}
          onStartEdit={handleStartEditName}
          onEditChange={setFullNameInput}
          onCancelEdit={handleCancelEditName}
          onSaveEdit={handleSaveEditName}
          isSaving={isSavingName}
        />
        <Row
          label={t("profile.identityVerification", "Identity Verification")}
          value={
            isVerified
              ? t("profile.verified", "Verified")
              : t("profile.unverified", "Unverified")
          }
          valueColor={isVerified ? AppColors.TXT_MAIN : AppColors.GOLD_PRIMARY}
          onClick={() => {}}
        />
        <Row
          label={t("profile.twoFactorAuth", "Two-Factor Authentication")}
          value={
            isTwoFactorEnabled
              ? t("profile.twoFactor.enabled", "Enabled")
              : t("profile.twoFactor.disabled", "Disabled")
          }
          valueColor={
            isTwoFactorEnabled ? AppColors.TXT_MAIN : AppColors.GOLD_PRIMARY
          }
          onClick={() => navigate("/two-factor-authentication")}
        />
        <Row
          label={t("profile.updateEmail", "Update Email")}
          onClick={() => {
            navigate("/update-email");
          }}
        />
        <Row
          label={t("profile.changePassword", "Change Password")}
          onClick={() => {
            navigate("/change-password");
          }}
        />
        <Row
          label={t("profile.switchAccount", "Switch account")}
          onClick={() => navigate("/login")}
        />
        <Row
          label={t("profile.logoutCurrent", "Log out current account")}
          labelColor={AppColors.ERROR}
          onClick={() => setLogoutConfirmOpen(true)}
          rightIcon="arrow"
        />
      </Box>

      <ConfirmationModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title={t("profile.logoutConfirmTitle", "Log out?")}
        description={t(
          "profile.logoutConfirmDescription",
          "You will be signed out of this account. You can sign in again anytime.",
        )}
        okText={t("profile.logoutConfirmOk", "Log out")}
      />
    </Box>
  );
};

export default Profile;
