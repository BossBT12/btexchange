import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Container,
} from "@mui/material";
import {
  ChevronRight,
  PersonOutlined,
  GroupOutlined,
  ContentCopy,
  CheckCircle,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE, BORDER_RADIUS, SPACING, ICON_SIZE } from "../../constant/lookUpConstant";
import { copyToClipboard } from "../../utils/utils";
import useAuth from "../../hooks/useAuth";
import BtLogo from "../../assets/images/btLogo.webp";
import { FaCrown } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";
import BTLoader from "../../components/Loader";
import userService from "../../services/secondGameServices/userService";

const CARD_BORDER = "1px solid " + AppColors.BG_CARD_HOVER;
const ROW_SX = { display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: CARD_BORDER };

const SalesCard = ({ icon: Icon, value, label }) => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 0.75,
      p: 2,
      borderRadius: BORDER_RADIUS.XS,
      bgcolor: AppColors.BG_CARD,
      border: CARD_BORDER,
      minWidth: 0,
    }}
  >
    <Icon sx={{ color: AppColors.GOLD_PRIMARY, fontSize: 28 }} />
    <Box sx={{ textAlign: "right" }}>
      <Typography variant="h4" sx={{ color: AppColors.TXT_MAIN, fontWeight: 700 }}>
        {value ?? "0"}
      </Typography>
      <Typography variant="body2" sx={{ color: AppColors.TXT_MAIN, fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

const DownlineRow = ({ label, value, valueColor, last }) => (
  <Box sx={{ ...ROW_SX, ...(last ? { borderBottom: "none" } : {}) }}>
    <Typography variant="body1" sx={{ color: AppColors.TXT_MAIN }}>{label}</Typography>
    <Typography variant="body1" sx={{ color: valueColor ?? AppColors.TXT_MAIN, fontWeight: valueColor ? 500 : 400 }} noWrap>{value}</Typography>
  </Box>
);

const DownlineUserCard = ({ level, user, t }) => (
  <Box sx={{ borderRadius: BORDER_RADIUS.XS, bgcolor: AppColors.BG_CARD, border: CARD_BORDER, p: SPACING.MD }}>
    <DownlineRow label={t("rewardHub.team.name", "Name:")} value={user.fullName ?? "—"} last={false} />
    <DownlineRow label={t("rewardHub.team.email", "Email")} value={user.email ?? "—"} last={false} />
    <DownlineRow label={t("rewardHub.team.level", "Level:")} value={String(level)} last={false} />
    <DownlineRow label={t("rewardHub.team.uidShort", "UID")} value={user.UID ?? "—"} valueColor={AppColors.GOLD_PRIMARY} last={false} />
    <DownlineRow
      label={t("rewardHub.team.status", "Status")}
      value={user.isActive ? t("rewardHub.team.statusActive", "Active") : t("rewardHub.team.statusInactive", "Inactive")}
      valueColor={user.isActive ? AppColors.SUCCESS : AppColors.TXT_SUB}
      last={false}
    />
    <DownlineRow label={t("rewardHub.team.rankLabel", "Rank")} value={user.rank === "NONE" ? "V0" : (user.rank ?? "—")} last={false} />
    <DownlineRow label={t("rewardHub.team.depositAmount", "Deposit amount:")} value={`$${String(user.investment)}`} valueColor={AppColors.GOLD_PRIMARY} last={false} />
    <DownlineRow label={t("rewardHub.team.teamBusiness", "Team Business:")} value={`$${String(user.teamBusiness)}`} valueColor={AppColors.GOLD_PRIMARY} last={false} />
    <DownlineRow label={t("rewardHub.team.time", "Joined:")} value={user.joinedAtFormatted} last />
  </Box>
);

const TeamPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [teamStats, setTeamStats] = useState(null);
  const [downlineStructure, setDownlineStructure] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [response, res2] = await Promise.all([userService.downlineStats(), userService.downlineStructure()]);
        setTeamStats(response?.data ?? response ?? null);
        setDownlineStructure(res2?.data ?? null);
      } catch (error) {
        console.error("Team stats error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const downlineCards = React.useMemo(() => {
    if (!downlineStructure || typeof downlineStructure !== "object") return [];
    const cards = [];
    Object.entries(downlineStructure).forEach(([key, levelData]) => {
      const level = parseInt(key.replace(/\D/g, ""), 10) || 1;
      const users = levelData?.users ?? [];
      users.forEach((user) => {
        const joinedAt = user?.joinedAt;
        cards.push({
          id: user?._id ?? `${level}-${user?.UID}-${joinedAt ?? ""}`,
          level,
          user: {
            fullName: user?.fullName,
            UID: user?.UID,
            email: user?.email,
            isActive: Boolean(user?.isActive),
            rank: user?.rank,
            investment: Number(user?.investment) || 0,
            joinedAtFormatted: joinedAt ? new Date(joinedAt).toLocaleDateString() : "—",
            teamBusiness: Number(user?.teamBusiness) || 0,
          },
        });
      });
    });
    return cards;
  }, [downlineStructure]);

  const downlineTotals = React.useMemo(() => {
    if (!downlineStructure || typeof downlineStructure !== "object") return { userCount: 0, totalBusiness: 0 };
    return Object.values(downlineStructure).reduce(
      (acc, levelData) => ({
        userCount: acc.userCount + (levelData?.userCount ?? 0),
        totalBusiness: acc.totalBusiness + (levelData?.totalBusiness ?? 0),
      }),
      { userCount: 0, totalBusiness: 0 }
    );
  }, [downlineStructure]);

  const handleCopyUid = async () => {
    const uid = String(userData?.UID ?? "");
    await copyToClipboard(uid, setCopied);
  };

  const username = userData?.UID ?? "—";
  const email = userData?.email ?? "—";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
        pt: 2,
        pb: 14,
      }}
    >
      <Container maxWidth={false} sx={{ px: SPACING.MD }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: SPACING.MD,
            mb: SPACING.LG,
            borderRadius: BORDER_RADIUS.XS,
            bgcolor: AppColors.BG_CARD,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
            }}
          >
            <img src={BtLogo} alt={t("rewardHub.team.avatarAlt", "Avatar")} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                color: AppColors.TXT_MAIN,
                fontWeight: 600,
              }}
            >
              {username}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: AppColors.TXT_SUB,
                fontWeight: 400,
              }}
            >
              {email}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleCopyUid}
            sx={{
              color: AppColors.TXT_SUB,
              "&:hover": { color: AppColors.GOLD_PRIMARY },
            }}
          >
            {copied ? <CheckCircle sx={{ color: AppColors.SUCCESS, fontSize: ICON_SIZE.MD }} /> : <ContentCopy sx={{ color: AppColors.TXT_SUB, fontSize: ICON_SIZE.MD }} />}
          </IconButton>
        </Box>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <BTLoader />
          </Box>
        ) : (
          <>
            {/* Team Stats Section */}
            <Typography
              variant="h6"
              sx={{
                color: AppColors.TXT_MAIN,
                fontWeight: 600,
                mb: SPACING.SM,
              }}
            >
              {t("rewardHub.team.teamStatsTitle", "Team Stats")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: SPACING.SM,
                mb: SPACING.LG,
              }}
            >
              <SalesCard
                icon={PersonOutlined}
                value={teamStats?.totalDirectUser ?? 0}
                label={t("rewardHub.team.directUsers", "Direct")}
              />
              <SalesCard
                icon={GroupOutlined}
                value={`$${teamStats?.totalDirectBusiness.toFixed(2) ?? 0}`}
                label={t("rewardHub.team.directBusiness", "Direct Business")}
              />
            </Box>

            {/* Rank Status Card - Gold prominent card */}
            <Box
              className="bg-auShade"
              component="button"
              onClick={() => navigate("/reward-hub/reporting", { state: { type: "RANK" } })}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: SPACING.MD,
                mb: SPACING.LG,
                borderRadius: BORDER_RADIUS.XS,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "opacity 0.2s ease, transform 0.2s ease",
                "&:hover": {
                  opacity: 0.95,
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: BORDER_RADIUS.XS,
                  background: AppColors.GOLD_PRIMARY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaCrown size={24} color={AppColors.TXT_BLACK} />
              </Box>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                <Box >
                  <Typography
                    variant="h6"
                    sx={{
                      color: AppColors.TXT_BLACK,
                      fontWeight: 600,
                    }}
                  >
                    {t("rewardHub.team.rankStatus", "Rank Status")}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: AppColors.TXT_BLACK,
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    {teamStats?.currentUserRank === "NONE" ? "V0" : teamStats?.currentUserRank}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: AppColors.TXT_BLACK,
                      fontWeight: 600,
                    }}
                  >
                    {t("rewardHub.team.rankIncome", "Rank Income")}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: AppColors.TXT_BLACK,
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    ${teamStats?.totalRankIncome}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: SPACING.SM,
                mb: SPACING.LG,
              }}
            >
              <SalesCard
                icon={PersonOutlined}
                value={teamStats?.totalTeamCount ?? 0}
                label={t("rewardHub.team.teamCount", "Team")}
              />
              <SalesCard
                icon={GroupOutlined}
                value={`$${teamStats?.totalTeamBusiness.toFixed(2) ?? 0}`}
                label={t("rewardHub.team.teamBusiness", "Team Business")}
              />
            </Box>
            {/* Downline Structure Section */}
            <Box sx={{ display: "flex", justifyContent: "space-between", flexDirection: "column", mb: SPACING.SM }}>
              <Typography sx={{ color: AppColors.TXT_MAIN, fontWeight: 600, fontSize: FONT_SIZE.BODY }}>
                {t("rewardHub.team.directReferrals", "Downline Structure")}
              </Typography>
              {/* <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                  {t("rewardHub.team.userCount", "Total Users")}: <Typography component="span" sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}>{downlineTotals.userCount}</Typography>
                </Typography>
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
                  {t("rewardHub.team.totalBusiness", "Total Business")}: <Typography component="span" sx={{ color: AppColors.GOLD_PRIMARY, fontWeight: 600 }}>${downlineTotals.totalBusiness}</Typography>
                </Typography>
              </Box> */}
            </Box>
            {downlineCards.length === 0 ? (
              <Box sx={{ borderRadius: BORDER_RADIUS.XS, bgcolor: AppColors.BG_CARD, border: CARD_BORDER, p: SPACING.MD, mb: SPACING.LG }}>
                <Typography sx={{ color: AppColors.TXT_SUB, fontSize: FONT_SIZE.BODY }}>
                  {t("rewardHub.team.noDirectReferralsYet", "No direct referrals yet")}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: SPACING.SM, mb: SPACING.LG }}>
                {downlineCards.map((card) => (
                  <DownlineUserCard key={card.id} level={card.level} user={card.user} t={t} />
                ))}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default TeamPage;
