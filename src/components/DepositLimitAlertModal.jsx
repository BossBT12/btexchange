import React, { memo, useCallback, useId } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@mui/material";
import { TRADE_NAMESPACE } from "../i18n";
import { AppColors } from "../constant/appColors";

const DIALOG_PAPER_SX = {
  "& .MuiDialog-paper": {
    background:
      "radial-gradient(ellipse at 50% 0%, #252525 0%, #0a0a0a 55%, #050505 100%)",
    border: `1px solid ${AppColors.BORDER_MAIN}`,
    boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
    overflow: "hidden",
    m: 0,
  },
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(4px)",
  },
};

/** Gold coin-stack + cap bar — matches deposit destination “premium” icon style */
function DepositLimitGraphic() {
  const gradId = `dlg-${useId().replace(/:/g, "")}`;
  return (
    <svg width="30" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFEBB0" />
          <stop offset="0.45" stopColor="#F0B90B" />
          <stop offset="1" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <ellipse
        cx="16"
        cy="23"
        rx="10"
        ry="3.8"
        stroke={`url(#${gradId})`}
        strokeWidth="1.6"
        fill="rgba(240, 185, 11, 0.12)"
      />
      <ellipse
        cx="16"
        cy="17"
        rx="10"
        ry="3.8"
        stroke={`url(#${gradId})`}
        strokeWidth="1.6"
        fill="rgba(240, 185, 11, 0.1)"
      />
      <ellipse
        cx="16"
        cy="11"
        rx="10"
        ry="3.8"
        stroke={`url(#${gradId})`}
        strokeWidth="1.6"
        fill="rgba(240, 185, 11, 0.16)"
      />
      <line
        x1="5"
        y1="7.5"
        x2="27"
        y2="7.5"
        stroke={`url(#${gradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M16 4.5v3"
        stroke={`url(#${gradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DepositLimitAlertModal({ open, onClose }) {
  const { t } = useTranslation(TRADE_NAMESPACE);

  const handleDialogClose = useCallback(
    (_event, reason) => {
      if (reason === "backdropClick" || reason === "escapeKeyDown") return;
      onClose?.();
    },
    [onClose],
  );

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      disableEscapeKeyDown
      scroll="paper"
      aria-labelledby="deposit-limit-alert-title"
      aria-describedby="deposit-limit-alert-desc"
      sx={DIALOG_PAPER_SX}
    >
      <DialogContent className="deposit-modal" sx={{ p: 0 }}>
        <div className="wrap">
          <div className="modal">
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              aria-label={t("depositLimitAlert.closeAriaLabel", "Close")}
            >
              ✕
            </button>
            <h2 id="deposit-limit-alert-title">
              {t("depositLimitAlert.title", "Before you deposit")}
            </h2>
            <p id="deposit-limit-alert-desc" className="sub">
              {t(
                "depositLimitAlert.subtitle",
                "Keep this limit in mind so your funds are credited without delays.",
              )}
            </p>

            <div
              className="card-t deposit-limit-alert__card"
              role="region"
              aria-labelledby="deposit-limit-card-heading"
            >
              <div className="card-body">
                <div className="card-row">
                  <div className="icon-box-gold">
                    <DepositLimitGraphic />
                  </div>
                  <div className="card-info">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="card-name" id="deposit-limit-card-heading">
                        {t(
                          "depositLimitAlert.cardTitle",
                          "Maximum per deposit",
                        )}
                      </span>
                      <span className="badge-gold">
                        {t("depositLimitAlert.badge", "$1,000 max")}
                      </span>
                    </div>
                    <div className="card-desc">
                      {t(
                        "depositLimitAlert.message",
                        "Do not send more than $1,000 in a single deposit.",
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="glow-t" aria-hidden />
              <div className="gloss-t" aria-hidden />
              <div className="glow-lb" aria-hidden />
              <div className="glow-rb" aria-hidden />
            </div>

            <div className="close-btn-container">
              <button type="button" className="cont" onClick={onClose}>
                {t("depositLimitAlert.closeButton", "Got it")}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(DepositLimitAlertModal);
