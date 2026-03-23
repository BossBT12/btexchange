import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import { ChevronLeft, ContentCopy } from "@mui/icons-material";
import QRCode from "qrcode";
import { AppColors } from "../constant/appColors";
import { FONT_SIZE, BORDER_RADIUS, SPACING } from "../constant/lookUpConstant";
import useAuth from "../hooks/useAuth";
import useSnackbar from "../hooks/useSnackbar";
import { encryptData } from "../utils/encryption";
import { copyToClipboard } from "../utils/utils";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../i18n";

const InvitePosterModal = ({
  open,
  onClose,
  inviteIncomeText = "10 billion",
}) => {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const { userData } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [referralLink, setReferralLink] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const posterRef = useRef(null);

  useEffect(() => {
    if (!open || !userData?.UID) return;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${baseUrl}/signup?ref=${encodeURIComponent(encryptData(userData.UID))}`;
    let cancelled = false;
    QRCode.toDataURL(link, { width: 280, margin: 1 })
      .then((url) => {
        if (!cancelled) {
          setReferralLink(link);
          setQrDataUrl(url);
        }
      })
      .catch((err) => console.error("QR generation failed:", err));
    return () => {
      cancelled = true;
    };
  }, [ open, userData?.UID ]);

  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(referralLink, setCopied);
    if (ok)
      showSnackbar(
        t(
          "rewardHub.invitePoster.snackbar.linkCopied",
          "Invitation link copied",
        ),
        "success",
      );
    else
      showSnackbar(
        t(
          "rewardHub.invitePoster.snackbar.copyFailed",
          "Could not copy; link shown in alert",
        ),
        "info",
      );
  }, [referralLink, showSnackbar, t]);

  const handleDownloadPoster = async () => {
    const canvas = await html2canvas(posterRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });

    const image = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = t("rewardHub.invitePoster.downloadFilename", "invite-poster.png");
    link.click();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: AppColors.BG_MAIN,
          color: AppColors.TXT_MAIN,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 0.75,
          borderBottom: `1px solid ${AppColors.HLT_NONE}40`,
          bgcolor: AppColors.BG_SECONDARY,
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label={t("rewardHub.invitePoster.backAriaLabel", "Back")}
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
            fontSize: FONT_SIZE.TITLE,
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("rewardHub.invitePoster.title", "Invite")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: SPACING.LG,
          pt: 2,
          pb: 3,
          px: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: AppColors.TXT_SUB,
            textAlign: "center",
            fontSize: FONT_SIZE.CAPTION,
          }}
        >
          {t(
            "rewardHub.invitePoster.swipeHint",
            "Please swipe left - right to choose your favorite poster",
          )}
        </Typography>

        <div
          ref={posterRef}
          style={{
            width: "278px",
            height: "398px",
            background: "linear-gradient(160deg, #040404, #0a0a0a 40%, #000)",
            position: "relative",
            overflow: "hidden",
            color: "white",
            boxShadow: "0 25px 50px rgba(0,0,0,0.7)",
          }}
        >
          {/* glossy overlay */}
          <div
            style={{
              position: "absolute",
              top: "-60%",
              left: "-20%",
              width: "140%",
              height: "120%",
              background:
                "linear-gradient(120deg, transparent, rgba(255,255,255,0.08), transparent)",
              transform: "rotate(15deg)",
            }}
          />

          {/* dotted texture */}
          <div
            style={{
              position: "absolute",
              right: "-40px",
              top: "70px",
              width: "200px",
              height: "200px",
              background:
                "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "10px 10px",
              opacity: 0.35,
              transform: "rotate(25deg)",
            }}
          />

          {/* GOLD LINES */}
          <svg
            viewBox="0 0 278 398"
            style={{ position: "absolute", width: "100%", height: "100%" }}
          >
            <defs>
              <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3a2208" />
                <stop offset="40%" stopColor="#f7c66b" />
                <stop offset="50%" stopColor="#fff3c0" />
                <stop offset="60%" stopColor="#f7c66b" />
                <stop offset="100%" stopColor="#6b420e" />
              </linearGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M-20 200 C80 50,180 50,320 150"
              stroke="url(#gold)"
              strokeWidth="4"
              fill="none"
              filter="url(#glow)"
            />

            <path
              d="M-20 230 C80 80,180 80,320 180"
              stroke="url(#gold)"
              strokeWidth="2"
              fill="none"
            />

            <path
              d="M-20 260 C80 110,180 110,320 210"
              stroke="url(#gold)"
              strokeWidth="1.5"
              fill="none"
            />

            <path
              d="M-40 60 C100 -40,200 10,330 120"
              stroke="url(#gold)"
              strokeWidth="3"
              fill="none"
              filter="url(#glow)"
            />

            <path
              d="M-40 90 C100 -10,200 40,330 150"
              stroke="url(#gold)"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>

          {/* GOLD LIGHT SPARKS */}
          <div
            style={{
              position: "absolute",
              top: "120px",
              left: "60px",
              width: "10px",
              height: "10px",
              background: "radial-gradient(circle, #fff, #ffd27f, transparent)",
              borderRadius: "50%",
              boxShadow: "0 0 12px #ffc76a",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "210px",
              left: "15px",
              width: "10px",
              height: "10px",
              background: "radial-gradient(circle, #fff, #ffd27f, transparent)",
              borderRadius: "50%",
              boxShadow: "0 0 12px #ffc76a",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "260px",
              right: "15px",
              width: "8px",
              height: "8px",
              background: "radial-gradient(circle, #fff, #ffd27f, transparent)",
              borderRadius: "50%",
              boxShadow: "0 0 10px #ffc76a",
            }}
          />

          {/* DATE */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "30px",
                fontWeight: 600,
                letterSpacing: "2px",
              }}
            >
              BT
            </div>
            <div style={{ fontSize: "8px" }}>{t("rewardHub.invitePoster.posterBrandExchange", "Exchange")}</div>
          </div>

          {/* PRESENT */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              width: "100%",
              textAlign: "center",
              fontSize: "12px",
              letterSpacing: "1.5px",
              color: "#fff",
              fontFamily: "Open Sans, sans-serif",
            }}
          >
            {t("rewardHub.invitePoster.posterReferral", "Referral")}
          </div>

          {/* TITLE */}
          <div
            style={{
              position: "absolute",
              top: "130px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "2px",
                color: "#fff",
                marginBottom: "10px",
                fontFamily: "Open Sans, sans-serif",
              }}
            >
              {t("rewardHub.invitePoster.scanToRegister", "Scan to register")}
            </div>

            <div
              style={{
                display: "inline-block",
                border: "1px solid #eee",
                padding: "5px 10px",
                boxShadow: "0 0 10px rgba(255,255,255,0.1) inset",
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={t("rewardHub.invitePoster.qrAlt", "Referral QR")}
                  style={{
                    width: "160px",
                    height: "160px",
                    display: "block",
                    background: "#fff",
                    borderRadius: 4,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100px",
                    height: "100px",
                    bgcolor: "rgba(255,255,255,0.2)",
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div
            style={{
              position: "absolute",
              bottom: "15px",
              padding: "0 20px",
              textAlign: "center",
              fontSize: "9px",
              color: "#d0d0d0",
              textWrap: "wrap",
              wordBreak: "break-word",
              maxWidth: "100%",
            }}
          >
            {referralLink || t("rewardHub.invitePoster.loadingLink", "Loading...")}
          </div>
        </div>

        <Typography
          variant="body2"
          sx={{
            color: AppColors.TXT_MAIN,
            textAlign: "center",
            fontSize: FONT_SIZE.BODY2,
          }}
        >
          {t(
            "rewardHub.invitePoster.inviteIncomeLineBefore",
            "Invite friends Income ",
          )}
          <Box
            component="span"
            sx={{ color: AppColors.ERROR, fontWeight: 700 }}
          >
            {inviteIncomeText}
          </Box>
          {t("rewardHub.invitePoster.inviteIncomeLineAfter", " Commission")}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <Button
            fullWidth
            className="btn-primary"
            disabled={!qrDataUrl}
            onClick={handleDownloadPoster}
            sx={{
              textTransform: "uppercase",
              fontSize: FONT_SIZE.BODY,
              fontWeight: 600,
              bgcolor: AppColors.GOLD_PRIMARY,
              color: AppColors.TXT_BLACK,
              borderRadius: BORDER_RADIUS.XL,
              py: 1.25,
              "&:hover": { bgcolor: AppColors.GOLD_PRIMARY, opacity: 0.9 },
            }}
          >
            {t("rewardHub.invitePoster.downloadPoster", "Download QR Code")}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ContentCopy sx={{ fontSize: 18 }} />}
            onClick={handleCopyLink}
            sx={{
              textTransform: "uppercase",
              fontSize: FONT_SIZE.BODY2,
              fontWeight: 600,
              color: AppColors.GOLD_PRIMARY,
              borderColor: AppColors.GOLD_PRIMARY,
              borderRadius: BORDER_RADIUS.XL,
              py: 1.25,
              bgcolor: "rgba(212, 168, 95, 0.12)",
              "&:hover": {
                borderColor: AppColors.GOLD_PRIMARY,
                bgcolor: "rgba(212, 168, 95, 0.2)",
              },
            }}
          >
            {copied
              ? t("rewardHub.invitePoster.copied", "Copied!")
              : t("rewardHub.invitePoster.copyLink", "Copy invitation link")}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InvitePosterModal;
