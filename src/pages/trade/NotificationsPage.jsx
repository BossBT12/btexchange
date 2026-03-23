import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Skeleton,
} from "@mui/material";
import { ChevronLeft, NotificationsActiveOutlined, OpenInNew, CampaignOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { AppColors } from "../../constant/appColors";
import useSnackbar from "../../hooks/useSnackbar";
import dashboardServices from "../../services/dashboardServices";
import { FONT_SIZE, ICON_SIZE } from "../../constant/lookUpConstant";
import { TRADE_NAMESPACE } from "../../i18n";

const formatNotificationDate = (dateStr, { t, lng } = {}) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = new Date(now - 864e5).toDateString() === d.toDateString();
    const pad = (n) => String(n).padStart(2, "0");
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (isToday) return `${t ? t("notificationsPage.date.today", "Today") : "Today"}, ${time}`;
    if (isYesterday) return `${t ? t("notificationsPage.date.yesterday", "Yesterday") : "Yesterday"}, ${time}`;
    const options = { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined };
    const datePart = d.toLocaleDateString(lng || undefined, options);
    return `${datePart} · ${time}`;
  } catch {
    return "";
  }
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(TRADE_NAMESPACE);
  const { showSnackbar } = useSnackbar();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardServices.getNotifications();
      if (data.success) {
        setList(data.data);
      } else {
        setError(data.message);
        setList([]);
      }
    } catch (err) {
      const message = err?.message || t("notificationsPage.errors.loadFailed", "Failed to load notifications");
      showSnackbar(message, "error");
      setError(message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, t]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const activeList = list.filter((n) => n.isActive !== false);
  const inactiveList = list.filter((n) => n.isActive === false);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: AppColors.BG_MAIN, color: AppColors.TXT_MAIN, pb: 4 }}>
      {/* Sticky header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          py: 0.75,
          px: 0.5,
          borderBottom: `1px solid ${AppColors.BORDER_MAIN}`,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: AppColors.BG_CARD_HOVER },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: AppColors.TXT_MAIN }}>
          {t("notificationsPage.title", "Notifications")}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      <Box
        sx={{
          background: `linear-gradient(145deg, ${AppColors.GOLD_DARK} 0%, ${AppColors.BG_MAIN} 45%)`,
          px: 2,
          pt: 3,
          pb: 4,
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
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.35)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12)",
              color: AppColors.GOLD_PRIMARY,
              flexShrink: 0,
            }}
          >
            <NotificationsActiveOutlined sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: AppColors.TXT_MAIN,
                mb: 0.25,
              }}
            >
              {t("notificationsPage.hero.title", "Updates & announcements")}
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, fontSize: "0.813rem" }}>
              {t("notificationsPage.hero.subtitle", "Important platform news, maintenance windows, and service messages.")}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: 1, pt: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={100}
                sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }}
              />
            ))}
          </Box>
        ) : error ? (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              px: 1,
              borderRadius: 2,
              bgcolor: AppColors.BG_CARD,
              border: `1px solid ${AppColors.BORDER_MAIN}`,
            }}
          >
            <CampaignOutlined sx={{ fontSize: 48, color: AppColors.TXT_SUB, mb: 1 }} />
            <Typography variant="body1" sx={{ color: AppColors.TXT_SUB, mb: 1.5 }}>
              {error}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchNotifications}
              sx={{
                color: AppColors.GOLD_PRIMARY,
                borderColor: AppColors.GOLD_PRIMARY,
                "&:hover": { borderColor: AppColors.GOLD_LIGHT, bgcolor: AppColors.HLT_LIGHT },
              }}
            >
              {t("notificationsPage.actions.retry", "Retry")}
            </Button>
          </Box>
        ) : list.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              px: 2,
              borderRadius: 2,
              bgcolor: AppColors.BG_CARD,
              border: `1px solid ${AppColors.BORDER_MAIN}`,
            }}
          >
            <NotificationsActiveOutlined sx={{ fontSize: 48, color: AppColors.TXT_SUB, mb: 1 }} />
            <Typography variant="body1" sx={{ color: AppColors.TXT_MAIN, fontWeight: 500, mb: 0.5 }}>
              {t("notificationsPage.empty.title", "No notifications yet")}
            </Typography>
            <Typography variant="body2" sx={{ color: AppColors.TXT_SUB }}>
              {t("notificationsPage.empty.subtitle", "We’ll show important updates and announcements here.")}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {activeList.map((item) => (
              <Box
                key={item._id}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: AppColors.BG_CARD,
                  border: `1px solid ${AppColors.BORDER_MAIN}`,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    borderColor: `${AppColors.GOLD_PRIMARY}40`,
                    boxShadow: `0 0 0 1px ${AppColors.GOLD_PRIMARY}20`,
                  },
                }}
              >
                <Box sx={{ p: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: AppColors.TXT_MAIN,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {item.title ?? t("notificationsPage.fallbackTitle", "Notification")}
                    </Typography>
                    {item.link && (
                      <IconButton
                        component="a"
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{
                          color: AppColors.GOLD_PRIMARY,
                          flexShrink: 0,
                          "&:hover": { bgcolor: AppColors.HLT_LIGHT },
                        }}
                        aria-label={t("notificationsPage.actions.openLinkAria", "Open link")}
                      >
                        <OpenInNew sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: AppColors.TXT_SUB,
                      lineHeight: 1.5,
                      mb: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {item.message ?? ""}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: AppColors.HLT_NONE,
                    }}
                  >
                    {formatNotificationDate(item.createdAt, { t, lng: i18n.language })}
                  </Typography>
                  {item.link && (
                    <Button
                      component="a"
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      endIcon={<OpenInNew sx={{ fontSize: 10 }} />}
                      sx={{
                        ml: 1,
                        color: AppColors.GOLD_PRIMARY,
                        fontWeight: 600,
                        fontSize: FONT_SIZE.CAPTION,
                        textTransform: "none",
                        "&:hover": { bgcolor: AppColors.HLT_LIGHT },
                      }}
                    >
                      {t("notificationsPage.actions.viewDetails", "View details")}
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
            {inactiveList.length > 0 && (
              <>
                <Typography
                  variant="caption"
                  sx={{
                    color: AppColors.TXT_SUB,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    mt: 2,
                    mb: 0.5,
                  }}
                >
                  {t("notificationsPage.pastTitle", "Past notifications")}
                </Typography>
                {inactiveList.map((item) => (
                  <Box
                    key={item._id}
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: AppColors.BG_CARD,
                      border: `1px solid ${AppColors.BORDER_MAIN}`,
                      opacity: 0.85,
                    }}
                  >
                    <Box sx={{ p: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: AppColors.TXT_SUB,
                          mb: 0.75,
                        }}
                      >
                        {item.title ?? t("notificationsPage.fallbackTitle", "Notification")}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: AppColors.TXT_SUB,
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.message ?? ""}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: AppColors.HLT_NONE, display: "block", mt: 1 }}
                      >
                        {formatNotificationDate(item.createdAt, { t, lng: i18n.language })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NotificationsPage;
