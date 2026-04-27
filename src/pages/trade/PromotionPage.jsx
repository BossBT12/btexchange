import React, {
  useState,
  useEffect,
  useCallback,
  useId,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  WorkspacePremiumOutlined,
  ContentCopy,
  DescriptionOutlined,
  AssessmentOutlined,
  AttachMoneyOutlined,
  MenuBookOutlined,
  HeadsetOutlined,
  AccountBalanceWalletOutlined,
  QrCode2Outlined,
  StackedBarChartOutlined,
  CheckCircleOutlined,
  MoreVert,
  AccountBalanceWallet,
  WbSunnyOutlined,
  PersonAddAltOutlined,
  PaymentsOutlined,
  StarBorderOutlined,
  GroupOutlined,
  PeopleOutline,
} from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import useSnackbar from "../../hooks/useSnackbar";
import { FONT_SIZE, ICON_SIZE } from "../../constant/lookUpConstant";
import promotionService from "../../services/promotionService";
import { copyToClipboard } from "../../utils/utils";
const InvitePosterModal = React.lazy(
  () => import("../../components/InvitePosterModal"),
);
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const tabular = { fontVariantNumeric: "tabular-nums" };

/**
 * Refined glass: one frosted layer + light top sheen. Avoids heavy “metal” diagonals.
 * Sits on `pageBodySx` so `backdrop-filter` has depth to sample.
 */
const gold = AppColors.GOLD_PRIMARY;
/** Border-only: shine on top-left, deeper gold shade opposite — does not change inner glass */
const goldBorderFrameGradient = [
  "linear-gradient(128deg,",
  "rgba(255, 236, 210, 0.95) 0%,",
  `${gold} 14%,`,
  "rgba(95, 72, 40, 0.55) 38%,",
  "rgba(160, 125, 68, 0.65) 58%,",
  `${gold} 78%,`,
  "rgba(255, 224, 185, 0.5) 100%)",
].join(" ");

const glassPanelSx = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 3,
  backgroundColor: "rgba(20, 20, 24, 0.42)",
  backgroundImage:
    "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 18%, rgba(0,0,0,0.12) 100%)",
  backdropFilter: "blur(22px) saturate(1.2)",
  WebkitBackdropFilter: "blur(22px) saturate(1.2)",
  // Hairline so layout is unchanged; visible gold is the ::after ring only
  border: "1px solid rgba(255, 255, 255, 0.04)",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.09)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    // Soft top highlight only (gloss, not a second opaque skin)
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.11) 0%, transparent 42%)",
  },
  // Gold gradient frame + gloss only in the 1px ring (mask, not a second fill)
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    padding: "1px",
    pointerEvents: "none",
    zIndex: 0,
    background: goldBorderFrameGradient,
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    WebkitMaskRepeat: "no-repeat",
    mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    maskComposite: "exclude",
    maskRepeat: "no-repeat",
  },
};

const pageBodySx = {
  minHeight: "100%",
  position: "relative",
  // Subtle warmth behind glass so blur reads as “glass” instead of a flat grey slab
  background: [
    `radial-gradient(90% 55% at 50% -5%, ${AppColors.HLT_LIGHT} 0%, transparent 55%)`,
    "radial-gradient(65% 40% at 100% 30%, rgba(212, 168, 95, 0.06) 0%, transparent 100%)",
    `linear-gradient(180deg, #0a0a0c 0%, ${AppColors.BG_MAIN} 28%, ${AppColors.BG_MAIN} 100%)`,
  ].join(", "),
};

const glassHeaderSx = {
  backgroundColor: "rgba(0, 0, 0, 0.52)",
  backdropFilter: "blur(14px) saturate(1.1)",
  WebkitBackdropFilter: "blur(14px) saturate(1.1)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
};

const glassDividerSx = {
  borderColor: "rgba(255, 255, 255, 0.08)",
  opacity: 0.9,
};

const kRowSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.5,
  py: 0.5,
  minHeight: 40,
};

const kLabelSx = {
  color: "rgba(255, 255, 255, 0.7)",
  fontSize: 13,
  lineHeight: 1.35,
  fontWeight: 500,
  pr: 1,
  flex: 1,
  minWidth: 0,
};

const kValueBaseSx = {
  ...tabular,
  fontSize: 14,
  lineHeight: 1.2,
  fontWeight: 700,
  flexShrink: 0,
  textAlign: "right",
  letterSpacing: 0.15,
};

/** Gold only for money rows; other metrics stay neutral. */
const valueColorForRow = (row) =>
  row?.isAmount ? AppColors.GOLD_PRIMARY : "rgba(255, 255, 255, 0.9)";

const labelIconProps = {
  sx: { fontSize: 18, color: "rgba(255, 255, 255, 0.45)", flexShrink: 0 },
};

const cardTitleRowSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.5,
  mb: 1.25,
  pb: 1,
  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
};

const goldGrad = (dir = 180) =>
  `linear-gradient(${dir}deg, ${AppColors.GOLD_PRIMARY} 0%, rgba(212, 168, 95, 0.22) 100%)`;
const g = AppColors.GOLD_PRIMARY;
const gSoft = "rgba(212, 168, 95, 0.35)";

/**
 * One distinct mini graphic per card kind (direct = bars, team = node graph, data = sparkline).
 */
const CardTitleRightGraphic = ({ variant = "direct" }) => {
  const sparkFillId = useId();

  if (variant === "team") {
    return (
      <Box
        component="span"
        aria-hidden
        sx={{ display: "inline-flex", alignItems: "center", opacity: 0.95 }}
      >
        <svg
          width={30}
          height={20}
          viewBox="0 0 30 20"
          style={{ display: "block" }}
        >
          <line x1="15" y1="5" x2="6" y2="14" stroke={gSoft} strokeWidth={1.25} />
          <line x1="15" y1="5" x2="24" y2="14" stroke={gSoft} strokeWidth={1.25} />
          <line x1="6" y1="14" x2="24" y2="14" stroke={gSoft} strokeWidth={1.25} />
          <circle cx="15" cy="5" r="3" fill="none" stroke={g} strokeWidth={1.1} />
          <circle cx="6" cy="14" r="2.5" fill={g} fillOpacity={0.95} />
          <circle cx="15" cy="5" r="1.2" fill={g} fillOpacity={0.35} />
          <circle cx="24" cy="14" r="2.5" fill={g} fillOpacity={0.85} />
        </svg>
      </Box>
    );
  }

  if (variant === "promotionData") {
    return (
      <Box
        component="span"
        aria-hidden
        sx={{ display: "inline-flex", alignItems: "center", opacity: 0.95 }}
      >
        <svg
          width={32}
          height={20}
          viewBox="0 0 32 20"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient
              id={sparkFillId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={g} stopOpacity="0.35" />
              <stop offset="100%" stopColor={g} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 2 15 L 9 10 L 16 12 L 23 6.5 L 30 3.5 L 30 20 L 2 20 Z"
            fill={`url(#${sparkFillId})`}
          />
          <path
            d="M 2 15 L 9 10 L 16 12 L 23 6.5 L 30 3.5"
            fill="none"
            stroke={g}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        </svg>
      </Box>
    );
  }

  // direct — column bars (upward / individual metrics)
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: 0.45,
        height: 20,
        opacity: 0.92,
      }}
    >
      {[
        { w: 3.5, h: 7 },
        { w: 3.5, h: 16 },
        { w: 3.5, h: 10 },
      ].map((d, i) => (
        <Box
          key={i}
          sx={{
            width: d.w,
            height: d.h,
            borderRadius: 0.5,
            background: goldGrad(180),
            boxShadow: "0 0 6px rgba(212, 168, 95, 0.18)",
          }}
        />
      ))}
    </Box>
  );
};

const CardSectionTitle = ({
  titleIcon: TitleIcon,
  children,
  titleGraphicVariant = "direct",
}) => (
  <Box sx={cardTitleRowSx}>
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}
    >
      {TitleIcon && (
        <TitleIcon
          sx={{
            fontSize: 20,
            color: AppColors.GOLD_PRIMARY,
            opacity: 0.9,
            flexShrink: 0,
          }}
        />
      )}
      <Typography
        component="div"
        sx={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        {children}
      </Typography>
    </Box>
    <CardTitleRightGraphic variant={titleGraphicVariant} />
  </Box>
);

const LabelWithIcon = ({ icon: Icon, children, labelSx = {} }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      minWidth: 0,
      flex: 1,
    }}
  >
    {Icon && <Icon {...labelIconProps} />}
    <Typography component="div" sx={{ ...kLabelSx, ...labelSx }}>
      {children}
    </Typography>
  </Box>
);

const STAT_ROWS = [
  {
    key: "registerCount",
    label: "number of register",
    colorKey: "success",
    icon: PersonAddAltOutlined,
  },
  {
    key: "depositCount",
    label: "Deposit number",
    colorKey: "success",
    icon: PaymentsOutlined,
  },
  {
    key: "depositAmount",
    label: "Deposit amount",
    colorKey: "gold",
    isAmount: true,
    icon: AccountBalanceWallet,
  },
  {
    key: "firstDepositCount",
    label: "Number of people making first deposit",
    colorKey: "gold",
    icon: StarBorderOutlined,
  },
];

const MENU_ITEMS = [
  {
    label: "Partner rewards",
    icon: WorkspacePremiumOutlined,
    path: "/promotion/partner-rewards",
  },
  { label: "Copy invitation code", icon: DescriptionOutlined, copy: true },
  {
    label: "Subordinate data",
    icon: AssessmentOutlined,
    path: "/promotion/subordinate-data",
  },
  {
    label: "Commission detail",
    icon: AttachMoneyOutlined,
    path: "/promotion/commission-detail",
  },
  {
    label: "Invitation rules",
    icon: MenuBookOutlined,
    path: "/promotion/rules",
  },
  {
    label: "Agent line customer service",
    icon: HeadsetOutlined,
    path: "/promotion/agent-service",
  },
  {
    label: "Rebate ratio",
    icon: AccountBalanceWalletOutlined,
    path: "/promotion/rebate-ratio",
  },
];

const formatNumber = (n) => {
  if (n == null || n === "") return "0";
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : "0";
};

const PromotionPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posterModalOpen, setPosterModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardData, summaryData] = await Promise.all([
        promotionService.getDashboard(),
        promotionService.getSummary(),
      ]);

      setSummary(summaryData);
      setDashboard(dashboardData);
    } catch (err) {
      const message =
        err?.message ||
        t("promotion.errors.loadFailed", "Failed to load promotion data");
      showSnackbar(message, "error");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const invitationCode = dashboard?.invitationCode ?? "";
  const directStats = dashboard?.directSubordinates ?? {};
  const teamStats = dashboard?.teamSubordinates ?? {};

  const referralRewardState = {
    invitationCount: summary?.registerCount ?? 0,
    effectiveIntCount: summary?.activeRegisterdCount ?? 0,
    intTotalBonus: summary?.totalReferralIncome ?? 0,
  };

  const handleCopyCode = async () => {
    if (!invitationCode) return;
    copyToClipboard(invitationCode, setCopied);
  };

  const handleDownloadQr = useCallback(() => {
    setPosterModalOpen(true);
  }, []);

  const handleNavigate = (path) => {
    if (path === "/promotion/partner-rewards") {
      if (loading) return;
      navigate(path, { state: { referralRewardState } });
    } else {
      navigate(path);
    }
  };

  const handleOpenMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleMenuItemClick = (item) => {
    if (item.copy) {
      handleCopyCode();
      return;
    }

    if (item.path && !handleDisable(item.path)) {
      handleNavigate(item.path);
    }
    handleCloseMenu();
  };

  const handleDisable = (path) => {
    if (path === "/promotion/partner-rewards") {
      return loading;
    }
    return false;
  };

  return (
    <Box
      sx={{
        position: "relative",
        color: AppColors.TXT_MAIN,
        pb: 10,
        ...pageBodySx,
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
          ...glassHeaderSx,
        }}
      >
        <Box sx={{ width: 40 }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: AppColors.TXT_MAIN,
            textAlign: "center",
          }}
        >
          {t("promotion.header.title", "Promotion")}
        </Typography>
        <IconButton
          onClick={handleOpenMenu}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <MoreVert sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            minWidth: 260,
            color: AppColors.TXT_MAIN,
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "rgba(12, 12, 14, 0.82)",
            backdropFilter: "blur(18px) saturate(1.15)",
            WebkitBackdropFilter: "blur(18px) saturate(1.15)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.45)",
          },
        }}
      >
        {MENU_ITEMS.map((item) => (
          <MenuItem
            key={item.label}
            disabled={item.path ? handleDisable(item.path) : false}
            onClick={() => handleMenuItemClick(item)}
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 34 }}>
              <item.icon
                sx={{ fontSize: ICON_SIZE.SM, color: AppColors.GOLD_PRIMARY }}
              />
            </ListItemIcon>
            <ListItemText
              primary={t(`promotion.menu.${item.label}`, item.label)}
              primaryTypographyProps={{
                variant: "body2",
                sx: { color: AppColors.TXT_MAIN, fontWeight: 500 },
              }}
              secondary={item.copy ? invitationCode || "—" : undefined}
              secondaryTypographyProps={{
                variant: "caption",
                sx: { color: AppColors.TXT_SUB },
              }}
            />
            {item.copy && (
              <Box
                sx={{
                  color: copied ? AppColors.SUCCESS : AppColors.TXT_SUB,
                  display: "flex",
                }}
              >
                {copied ? (
                  <CheckCircleOutlined sx={{ fontSize: FONT_SIZE.TITLE }} />
                ) : (
                  <ContentCopy sx={{ fontSize: FONT_SIZE.TITLE }} />
                )}
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>

      <Box sx={{ mx: 2, mt: 0 }}>
        <Box sx={{ my: 2, p: 0, ...glassPanelSx, isolation: "isolate" }}>
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              p: 2,
            }}
          >
            <Box sx={kRowSx}>
              <LabelWithIcon
                icon={AttachMoneyOutlined}
                labelSx={{ color: "rgba(255,255,255,0.82)" }}
              >
                {t("promotion.totalCommission", "Total Commission")}
              </LabelWithIcon>
              <Typography
                component="div"
                sx={{
                  ...kValueBaseSx,
                  fontSize: 22,
                  color: AppColors.GOLD_PRIMARY,
                }}
              >
                {loading
                  ? t("promotion.loading", "Loading…")
                  : `$${formatNumber(dashboard?.totalCommission)}`}
              </Typography>
            </Box>
            <Divider sx={{ ...glassDividerSx, my: 0.5 }} />
            <Box sx={kRowSx}>
              <LabelWithIcon icon={WbSunnyOutlined}>
                {t(
                  "promotion.yesterdayCommissionLabel",
                  "Yesterday's total commission",
                )}
              </LabelWithIcon>
              <Typography
                component="div"
                sx={{ ...kValueBaseSx, fontWeight: 600, color: "rgba(255,255,255,0.92)" }}
              >
                ${formatNumber(dashboard?.yesterdayCommission)}
              </Typography>
            </Box>
            <Typography
              component="p"
              sx={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 12,
                lineHeight: 1.45,
                mt: 1.25,
                m: 0,
              }}
            >
              {t(
                "promotion.upgradeHint",
                "Upgrade the level to increase commission income",
              )}
            </Typography>
          </Box>
        </Box>

        {/* Subordinate stats */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 2,
            mt: 0.5,
          }}
        >
          {[
            {
              key: "direct",
              stats: directStats,
              label: "Direct subordinates",
              titleIcon: PeopleOutline,
              titleGraphicVariant: "direct",
            },
            {
              key: "team",
              stats: teamStats,
              label: "Team subordinates",
              titleIcon: GroupOutlined,
              titleGraphicVariant: "team",
            },
          ].map((group) => (
            <Box
              key={group.key}
              sx={{ p: 0, ...glassPanelSx, isolation: "isolate" }}
            >
              <Box sx={{ position: "relative", zIndex: 1, p: 2, pt: 1.75 }}>
                <CardSectionTitle
                  titleIcon={group.titleIcon}
                  titleGraphicVariant={group.titleGraphicVariant}
                >
                  {t(`promotion.subordinateTabs.${group.key}`, group.label)}
                </CardSectionTitle>
                {STAT_ROWS.map((row, index) => (
                  <React.Fragment key={row.key}>
                    <Box sx={kRowSx}>
                      <LabelWithIcon icon={row.icon}>
                        {t(
                          `promotion.subordinateStats.${row.key}`,
                          row.label,
                        )}
                      </LabelWithIcon>
                      <Typography
                        component="div"
                        sx={{
                          ...kValueBaseSx,
                          color: valueColorForRow(row),
                        }}
                      >
                        {row.isAmount
                          ? `$${formatNumber(group.stats[row.key])}`
                          : formatNumber(group.stats[row.key])}
                      </Typography>
                    </Box>
                    {index < STAT_ROWS.length - 1 && (
                      <Divider sx={glassDividerSx} />
                    )}
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Download QR Code */}
      <Box sx={{ px: 2, mt: 2, textAlign: "center" }}>
        <Button
          className="btn-primary"
          fullWidth
          disabled={loading}
          startIcon={<QrCode2Outlined />}
          onClick={handleDownloadQr}
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.55,
            borderRadius: 24,
          }}
        >
          {loading
            ? t("promotion.loading", "Loading...")
            : t("promotion.downloadQrCta", "Download QR Code")}
        </Button>
      </Box>

      {/* Promotion data card */}
      <Box sx={{ mx: 2, mt: 2, mb: 2, p: 0, ...glassPanelSx, isolation: "isolate" }}>
        <Box sx={{ position: "relative", zIndex: 1, p: 2, pt: 1.75 }}>
          <CardSectionTitle
            titleIcon={StackedBarChartOutlined}
            titleGraphicVariant="promotionData"
          >
            {t("promotion.data.title", "Promotion data")}
          </CardSectionTitle>
          {[
            {
              value: formatNumber(summary?.totalDirectSubordinate),
              label: t(
                "promotion.data.directSubordinate",
                "direct subordinate",
              ),
              rowIcon: PeopleOutline,
            },
            {
              value: formatNumber(summary?.totalTeamSubordinate),
              label: t(
                "promotion.data.totalTeamSubordinates",
                "Total number of subordinates in the team",
              ),
              rowIcon: GroupOutlined,
            },
          ].map(({ value, label, rowIcon }, index) => (
            <React.Fragment key={label}>
              <Box sx={kRowSx}>
                <LabelWithIcon icon={rowIcon}>
                  {label}
                </LabelWithIcon>
                <Typography
                  component="div"
                  sx={{ ...kValueBaseSx, color: "rgba(255, 255, 255, 0.92)" }}
                >
                  {value}
                </Typography>
              </Box>
              {index < 1 && <Divider sx={glassDividerSx} />}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      {posterModalOpen && (
        <Suspense fallback={null}>
          <InvitePosterModal
            open={posterModalOpen}
            onClose={() => setPosterModalOpen(false)}
            inviteIncomeText={
              formatNumber(dashboard?.inviteIncome) || "10 billion"
            }
          />
        </Suspense>
      )}
    </Box>
  );
};

export default PromotionPage;
