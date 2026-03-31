import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import {
  ChevronLeft,
  ContentCopy,
  EmojiEvents,
  MenuBookOutlined,
  KeyboardArrowRight,
  DiamondOutlined,
  CheckCircle,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AppColors } from "../../../constant/appColors";
import useSnackbar from "../../../hooks/useSnackbar";
import { copyToClipboard } from "../../../utils/utils";
import { FONT_SIZE } from "../../../constant/lookUpConstant";
import useAuth from "../../../hooks/useAuth";
import { TRADE_NAMESPACE } from "../../../i18n";

// Invitation rules are now a simple 10% USDT bonus model,
// so we no longer need rupee-based slabs here.

const PartnerRewardsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const { showSnackbar } = useSnackbar();
  const { userData } = useAuth();
  const { referralRewardState } = useLocation().state ?? {};
  const [referralLink, setReferralLink] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!referralLink) return;
    await copyToClipboard(referralLink, setCopied);
    showSnackbar(t("promotion.partnerRewards.copySuccess", "Invitation link copied"), "success");
  };

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      // const result = await promotionService.getPartnerRewards();
      // console.log('result: ', result);
      // setData(result);
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/signup?ref=${userData?.UID}`);
    } catch (err) {
      const message = err?.message || t("promotion.partnerRewards.loadFailed", "Failed to load partner rewards");
      showSnackbar(message, "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, t]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  return (
    <Box
      sx={{
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          py: 0.75,
          backgroundColor: AppColors.BG_MAIN,
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
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
          {t("promotion.partnerRewards.title", "Partner rewards")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Promotional Banner */}
      <Box
        sx={{
          background: `linear-gradient(145deg, ${AppColors.GOLD_DARK} 0%, ${AppColors.BG_MAIN} 45%)`,
          px: 1,
          pt: 4,
          pb: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle at 70% 30%, ${AppColors.HLT_LIGHT}, transparent 70%)`,
            top: -60,
            right: -40,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: "rgba(212, 168, 95, 0.06)",
            bottom: -30,
            left: -20,
          }}
        />
        {/* Decorative circles */}
        <Box
          sx={{
            position: "absolute",
            right: -20,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.2,
          }}
        >
          <EmojiEvents sx={{ fontSize: 120, color: AppColors.GOLD_PRIMARY }} />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: FONT_SIZE.BODY,
                fontWeight: 600,
                color: AppColors.TXT_MAIN,
                mb: 0.5,
              }}
            >
              {t("promotion.partnerRewards.inviteFriends", "Invite friends to get max rewards")}
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 3,
                py: 0.5,
                borderRadius: 20,
                bgcolor: "rgba(212, 168, 95, 0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: FONT_SIZE.BODY,
                  fontWeight: 700,
                  color: AppColors.TXT_MAIN,
                }}
              >
                $1000
              </Typography>
            </Box>
          </Box>
          <EmojiEvents
            sx={{
              fontSize: 48,
              color: "rgba(0,0,0,0.4)",
              ml: 1,
            }}
          />
        </Box>
      </Box>

      {/* Stats Section */}
      <Box
        sx={{
          mx: 1,
          mt: 2,
        }}
      >
        <StatRow label={t("promotion.partnerRewards.invitationCount", "Invitation count")} value={referralRewardState?.invitationCount || 0} />
        <StatRow label={t("promotion.partnerRewards.effectiveInvitationCount", "Effective Invitation count")} value={referralRewardState?.effectiveIntCount || 0} />
        <StatRow
          label={t("promotion.partnerRewards.invitationTotalBonus", "Invitation total bonus")}
          value={`$${referralRewardState?.intTotalBonus || 0.00}`}
          valueColor={referralRewardState?.intTotalBonus > 0 ? AppColors.SUCCESS : AppColors.ERROR}
        />
      </Box>

      {/* Invitation Record Link */}
      <Box
        onClick={() => { }}
        sx={{
          mx: 1,
          mt: 1.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          "&:hover": { opacity: 0.9 },
        }}
      >
        <Typography
          sx={{
            fontSize: FONT_SIZE.BODY,
            fontWeight: 500,
            color: AppColors.TXT_MAIN,
          }}
        >
          {t("promotion.partnerRewards.invitationRecord", "Invitation record")}
        </Typography>
        <IconButton onClick={() => navigate("/transaction-history", { state: { type: "REFERRAL_BONUS" } })}>
          <KeyboardArrowRight sx={{ color: AppColors.TXT_SUB, fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Invitation Link Section */}
      <Box sx={{ mx: 1, mt: 1 }}>
        <SectionTitle
          label={t("promotion.partnerRewards.invitationLink", "Invitation link")}
          icon={
            <Box
              sx={{
                width: 4,
                height: 18,
                borderRadius: 1,
                bgcolor: AppColors.GOLD_PRIMARY,
                mr: 1,
              }}
            />
          }
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 1,
            px: 1.52,
            py: 1,
            borderRadius: 20,
            bgcolor: AppColors.BG_SECONDARY,
            border: "1px solid " + AppColors.BORDER_MAIN,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              flex: 1,
              color: AppColors.TXT_SUB,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? t("promotion.loading", "Loading...") : referralLink ?? t("promotion.loading", "Loading...")}
          </Typography>
          <IconButton
            onClick={handleCopyLink}
            sx={{
              color: AppColors.TXT_MAIN,
              p: 0.5,
              borderRadius: 1.5,
              "&:hover": { bgcolor: "#c49a55" },
            }}
          >
            {copied ? <CheckCircle sx={{ fontSize: 20, color: AppColors.SUCCESS }} /> : <ContentCopy sx={{ fontSize: 20, color: AppColors.GOLD_PRIMARY }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Invitation Rules Section */}
      <Box
        sx={{
          mx: 1,
          mt: 2,
          bgcolor: AppColors.BG_SECONDARY,
          p: 1.5,
          borderRadius: 2,
          mb: 1,
        }}
      >
        <SectionTitle
          label={t("promotion.partnerRewards.invitationRules", "Invitation rules")}
          icon={
            <MenuBookOutlined
              sx={{ fontSize: 20, color: AppColors.GOLD_PRIMARY, mr: 1 }}
            />
          }
        />

        {/* High-level rules */}
        <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: AppColors.TXT_MAIN,
              fontWeight: 600,
            }}
          >
            {t("promotion.partnerRewards.ruleTitle", "🎉 Get 10% Referral Bonus on Deposit")}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: AppColors.TXT_SUB }}>
            {t("promotion.partnerRewards.ruleInvite", "🔗 Invite your friends to BT EXCHANGE")}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: AppColors.TXT_SUB }}>
            {t("promotion.partnerRewards.ruleMinDeposit", "💵 Bonus starts from minimum 10 USDT deposit")}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: AppColors.TXT_SUB }}>
            {t("promotion.partnerRewards.ruleNoTurnover", "🎁 No turnover condition")}
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: AppColors.TXT_SUB }}>
            {t("promotion.partnerRewards.ruleAutoCredit", "⚡ Bonus credited automatically")}
          </Typography>
        </Box>

        {/* Bonus examples */}
        <Box sx={{ mt: 2 }}>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: AppColors.TXT_MAIN,
              fontWeight: 600,
              mb: 1,
            }}
          >
            {t("promotion.partnerRewards.bonusExample", "Bonus Example:")}
          </Typography>

          {[
            { deposit: 10, bonus: 1 },
            { deposit: 100, bonus: 10 },
            { deposit: 200, bonus: 20 },
            { deposit: 300, bonus: 30 },
            { deposit: 500, bonus: 50 },
          ].map((item, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 0.75,
                px: 1,
                borderRadius: 1.5,
                bgcolor: idx % 2 === 0 ? AppColors.BG_CARD : "transparent",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8125rem",
                  color: AppColors.TXT_SUB,
                }}
              >
                {t("promotion.partnerRewards.friendDeposits", "Friend deposits {{amount}} USDT", { amount: item.deposit })}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: AppColors.GOLD_PRIMARY,
                  textAlign: "right",
                }}
              >
                {t("promotion.partnerRewards.youGetBonus", "You get {{bonus}} USDT bonus (10%)", { bonus: item.bonus })}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Extra notes */}
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography sx={{ fontSize: "0.8125rem", color: AppColors.TXT_SUB }}>
            {t("promotion.partnerRewards.oneDepositOneBonus", "✅ One deposit = one bonus")}
          </Typography>
          <Typography sx={{ fontSize: "0.8125rem", color: AppColors.TXT_SUB }}>
            {t("promotion.partnerRewards.unlimitedReferrals", "♾ Unlimited referrals — invite more, earn more")}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.8125rem",
              color: AppColors.GOLD_PRIMARY,
              fontWeight: 600,
              mt: 0.5,
            }}
          >
            {t("promotion.partnerRewards.cta", "BT EXCHANGE — Deposit 10 USDT & Earn 10% Referral Bonus.")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const StatRow = ({ label, value, valueColor }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      py: 1.25,
      p: 1.5,
      mb: 1,
      borderRadius: 2,
      bgcolor: AppColors.BG_SECONDARY,
      border: "1px solid rgba(255,255,255,0.06)",
    }}
  >
    <Typography
      sx={{
        fontSize: FONT_SIZE.BODY,
        color: AppColors.TXT_MAIN,
        fontWeight: 500,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: FONT_SIZE.BODY,
        fontWeight: 600,
        color: valueColor || AppColors.TXT_MAIN,
      }}
    >
      {value}
    </Typography>
  </Box>
);

const SectionTitle = ({ label, icon }) => (
  <Box sx={{ display: "flex", alignItems: "center" }}>
    {icon}
    <Typography
      variant="h5"
      sx={{
        fontSize: "0.9375rem",
        fontWeight: 600,
        color: AppColors.TXT_MAIN,
      }}
    >
      {label}
    </Typography>
  </Box>
);

const BulletPoint = ({ text }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
    <DiamondOutlined
      sx={{
        fontSize: 14,
        color: AppColors.GOLD_PRIMARY,
        mt: 0.25,
        flexShrink: 0,
      }}
    />
    <Typography
      variant="body1"
      sx={{
        color: AppColors.TXT_SUB,
        lineHeight: 1.5,
      }}
    >
      {text}
    </Typography>
  </Box>
);

export default PartnerRewardsPage;

// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
// import { ChevronLeft, EmojiEvents } from "@mui/icons-material";
// import { AppColors } from "../../../../constant/appColors";
// import useSnackbar from "../../../../hooks/useSnackbar";
// import { FONT_SIZE } from "../../../../constant/lookUpConstant";
// import promotionService from "../../../../services/promotionService";

// const formatNumber = (n) => {
//   if (n == null || n === "") return "0";
//   const num = Number(n);
//   return Number.isFinite(num) ? num.toLocaleString() : "0";
// };

// const PartnerRewardsPage = () => {
//   const navigate = useNavigate();
//   const { showSnackbar } = useSnackbar();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchRewards = useCallback(async () => {
//     try {
//       setLoading(true);
//       const result = await promotionService.getPartnerRewards();
//       setData(result);
//     } catch (err) {
//       const message = err?.message || "Failed to load partner rewards";
//       showSnackbar(message, "error");
//       setData(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [showSnackbar]);

//   useEffect(() => {
//     fetchRewards();
//   }, [fetchRewards]);

//   const slabs = data?.slabs ?? [];
//   const description = data?.description ?? "";

//   return (
//     <Box sx={{ position: "relative", color: AppColors.TXT_MAIN, pb: 4 }}>
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           position: "sticky",
//           top: 0,
//           zIndex: 1000,
//           py: 0.75,
//           backgroundColor: AppColors.BG_SECONDARY,
//         }}
//       >
//         <IconButton
//           onClick={() => navigate(-1)}
//           sx={{
//             color: AppColors.TXT_MAIN,
//             p: 0.5,
//             "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
//           }}
//         >
//           <ChevronLeft sx={{ fontSize: 28 }} />
//         </IconButton>
//         <Typography sx={{ fontSize: FONT_SIZE.TITLE, fontWeight: 700, color: AppColors.TXT_MAIN }}>
//           Partner rewards
//         </Typography>
//         <Box sx={{ width: 40 }} />
//       </Box>

//       <Box
//         sx={{
//           position: "relative",
//           overflow: "hidden",
//           background: `linear-gradient(135deg, ${AppColors.GOLD_PRIMARY} 0%, #b8924a 50%, #9a7b3a 100%)`,
//           boxShadow: `0 4px 20px ${AppColors.GOLD_PRIMARY}40`,
//           px: 2,
//           py: 2,
//           minHeight: 100,
//         }}
//       >
//         <Box sx={{ position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)", opacity: 0.2 }}>
//           <EmojiEvents sx={{ fontSize: 120, color: "#000" }} />
//         </Box>
//         <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
//           <Box>
//             <Typography sx={{ fontSize: FONT_SIZE.BODY, fontWeight: 600, color: "#000", mb: 0.5 }}>
//               Salary slabs based on team performance
//             </Typography>
//             {description ? (
//               <Typography sx={{ fontSize: FONT_SIZE.CAPTION, color: "rgba(0,0,0,0.8)" }}>
//                 {description}
//               </Typography>
//             ) : null}
//           </Box>
//           <EmojiEvents sx={{ fontSize: 48, color: "rgba(0,0,0,0.4)", ml: 1 }} />
//         </Box>
//       </Box>

//       <Box sx={{ mx: 2, mt: 2 }}>
//         {loading ? (
//           <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
//             <CircularProgress sx={{ color: AppColors.GOLD_PRIMARY }} />
//           </Box>
//         ) : slabs.length === 0 ? (
//           <Box
//             sx={{
//               py: 4,
//               textAlign: "center",
//               borderRadius: 2,
//               bgcolor: AppColors.BG_SECONDARY,
//               border: "1px solid rgba(255,255,255,0.06)",
//             }}
//           >
//             <Typography sx={{ fontSize: FONT_SIZE.BODY, color: AppColors.TXT_SUB }}>
//               No partner reward slabs available
//             </Typography>
//           </Box>
//         ) : (
//           <Box
//             sx={{
//               borderRadius: 2,
//               overflow: "hidden",
//               border: "1px solid rgba(255,255,255,0.06)",
//             }}
//           >
//             <Box
//               sx={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr 1fr 1fr",
//                 gap: 0.5,
//                 bgcolor: AppColors.GOLD_PRIMARY,
//                 color: "#000",
//                 py: 1.25,
//                 px: 1,
//               }}
//             >
//               <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>
//                 Directs
//               </Typography>
//               <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>
//                 Active
//               </Typography>
//               <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>
//                 Deposit
//               </Typography>
//               <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>
//                 Salary
//               </Typography>
//             </Box>
//             <Box sx={{ bgcolor: AppColors.BG_SECONDARY }}>
//               {slabs.map((row, idx) => (
//                 <Box
//                   key={idx}
//                   sx={{
//                     display: "grid",
//                     gridTemplateColumns: "1fr 1fr 1fr 1fr",
//                     gap: 0.5,
//                     py: 1.25,
//                     px: 1,
//                     borderBottom:
//                       idx < slabs.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
//                     alignItems: "center",
//                   }}
//                 >
//                   <Typography sx={{ fontSize: FONT_SIZE.BODY, color: AppColors.TXT_MAIN, textAlign: "center" }}>
//                     {formatNumber(row.directs)}
//                   </Typography>
//                   <Typography sx={{ fontSize: FONT_SIZE.BODY, color: AppColors.TXT_MAIN, textAlign: "center" }}>
//                     {formatNumber(row.active)}
//                   </Typography>
//                   <Typography sx={{ fontSize: FONT_SIZE.BODY, color: AppColors.TXT_MAIN, textAlign: "center" }}>
//                     {formatNumber(row.deposit)}
//                   </Typography>
//                   <Typography sx={{ fontSize: FONT_SIZE.BODY, fontWeight: 600, color: AppColors.GOLD_PRIMARY, textAlign: "center" }}>
//                     {formatNumber(row.salary)}
//                   </Typography>
//                 </Box>
//               ))}
//             </Box>
//           </Box>
//         )}
//       </Box>
//     </Box>
//   );
// };

// export default PartnerRewardsPage;
