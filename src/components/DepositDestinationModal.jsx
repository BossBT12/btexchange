import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@mui/material";
import { TRADE_NAMESPACE } from "../i18n";
import { AppColors } from "../constant/appColors";

const PATH_TRADE_DEPOSIT = "/deposit";
const PATH_REWARD_HUB_DEPOSIT = "/reward-hub/deposit";

export default function DepositDestinationModal({ open, onClose }) {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const navigate = useNavigate();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      scroll="paper"
      aria-labelledby="action-choice-modal-title"
      sx={{
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
      }}
    >
      <DialogContent className="deposit-modal" sx={{ p: 0 }}>
        <div className="wrap">
          <div className="modal">
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              aria-label={t("depositDestinationModal.closeAriaLabel", "Close")}
            >
              ✕
            </button>
            <h2 id="action-choice-modal-title">
              {t("depositDestinationModal.title", "Deposit Funds")}
            </h2>
            <p className="sub">
              {t(
                "depositDestinationModal.subtitle",
                "Choose your wallet to add funds",
              )}
            </p>

            <div
              className="card-t"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(PATH_TRADE_DEPOSIT);
                }
              }}
              aria-label={t(
                "depositDestinationModal.tradeAriaLabel",
                "Deposit to trading account",
              )}
              onClick={() => navigate(PATH_TRADE_DEPOSIT)}
            >
              <div className="card-body">
                <div className="card-row">
                  <div className="icon-box-gold">
                    <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
                      <polyline
                        points="1,21 10,10 16,15 29,2"
                        stroke="#F0B90B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="22,2 29,2 29,9"
                        stroke="#F0B90B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="card-info">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <span className="card-name">
                        {t("depositDestinationModal.tradeTitle", "Trading")}
                      </span>
                    </div>
                    <div className="card-desc">
                      {t(
                        "depositDestinationModal.tradeDescription",
                        "Add funds to your trading balance.",
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="divider"></div>
              <div className="card-foot">
                <span className="bal">
                  {t(
                    "depositDestinationModal.tradeFoot",
                    "Add funds to your trading wallet",
                  )}
                </span>
              </div>
              <div className="glow-t"></div>
              <div className="gloss-t"></div>
              <div className="glow-lb"></div>
              <div className="glow-rb"></div>
            </div>

            <div
              className="card-r"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(PATH_REWARD_HUB_DEPOSIT);
                }
              }}
              aria-label={t(
                "depositDestinationModal.rewardHubAriaLabel",
                "Deposit to Earn Hub",
              )}
              onClick={() => navigate(PATH_REWARD_HUB_DEPOSIT)}
            >
              <div className="card-body">
                <div className="card-row">
                  <div className="icon-box-purple">
                    <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
                      <defs>
                        <linearGradient
                          id="g2"
                          x1="0"
                          y1="0"
                          x2="32"
                          y2="28"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop offset="0%" stopColor="#f09898" />
                          <stop offset="100%" stopColor="#c03060" />
                        </linearGradient>
                      </defs>
                      <rect
                        x="2"
                        y="13"
                        width="28"
                        height="14"
                        rx="2.5"
                        stroke="url(#g2)"
                        strokeWidth="1.75"
                        fill="none"
                      />
                      <rect
                        x="0.5"
                        y="9"
                        width="31"
                        height="5"
                        rx="1.8"
                        stroke="url(#g2)"
                        strokeWidth="1.75"
                        fill="none"
                      />
                      <line
                        x1="16"
                        y1="9"
                        x2="16"
                        y2="27"
                        stroke="url(#g2)"
                        strokeWidth="1.75"
                      />
                      <line
                        x1="0.5"
                        y1="11.5"
                        x2="31.5"
                        y2="11.5"
                        stroke="url(#g2)"
                        strokeWidth="1.75"
                      />
                      <path
                        d="M16 9 C13.5 6.5 9.5 1.5 12 0C14.5 -1.2 16 4 16 9"
                        stroke="url(#g2)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M16 9 C18.5 6.5 22.5 1.5 20 0C17.5 -1.2 16 4 16 9"
                        stroke="url(#g2)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <div className="card-info">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <span className="card-name">
                        {t(
                          "depositDestinationModal.rewardHubTitle",
                          "Earn Hub",
                        )}
                      </span>
                    </div>
                    <div className="card-desc">
                      {t(
                        "depositDestinationModal.rewardHubDescription",
                        "Add funds to your Earn Hub wallet.",
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="divider"></div>
              <div className="card-foot">
                <span className="bal">
                  {t(
                    "depositDestinationModal.rewardHubFoot",
                    "Earn Hub | 1%–3% Daily Returns | Start Small, Scale Fast",
                  )}
                </span>
              </div>
              <div className="glow-t"></div>
              <div className="gloss-t"></div>
              <div className="glow-lb"></div>
              <div className="glow-rb"></div>
            </div>
            <div className="close-btn-container">
              <button type="button" className="cont" onClick={onClose}>
                {t("depositDestinationModal.closeButton", "Close")}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
