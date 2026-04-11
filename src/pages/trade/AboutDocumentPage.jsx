import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import { ChevronLeft } from "@mui/icons-material";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE } from "../../constant/lookUpConstant";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../../i18n";

const PRIVACY_DOC_BASE = {
  sections: [
    {
      heading: "1. Our Commitment to Your Privacy",
      body: [
        "We are committed to protecting your privacy and ensuring transparency in how your data is handled.",
      ],
    },
    {
      heading: "2. Interpretation & Definitions",
      body: [
        "Words with capitalized initial letters have meanings defined under the following conditions. These definitions apply whether the terms appear in singular or plural form.",
      ],
      bullets: [
        "User / You – the individual accessing or using the Service.",
        "Company – BT Market.",
        "Account – the unique account created for you to access our Service.",
        "Website – the official BT Market platform.",
        "Service – trading, investment, and related services provided by BT Market.",
        "Country – the operational jurisdiction as per applicable laws.",
        "Service Provider – any third party or individual who processes data on behalf of the Company.",
        "Personal Data – any information that identifies or can be used to identify an individual.",
        "Usage Data – data collected automatically while using the Service.",
      ],
    },
    {
      heading: "3. Types of Data We Collect",
      subheading: "3.1 Personal Data",
      body: [
        "While using our Service, we may ask you to provide certain personal information, including but not limited to:",
      ],
      bullets: [
        "Email address",
        "Full name",
        "Phone number",
        "Country or city information",
        "Account login details",
      ],
    },
    {
      subheading: "3.2 Usage Data",
      body: [
        "Usage Data is collected automatically and may include:",
      ],
      bullets: [
        "IP address",
        "Device type and unique device ID",
        "Browser type and version",
        "Pages visited, time spent, and activity logs",
      ],
      extra: [
        "When accessing BT Market via mobile, additional device-related data may be collected for security and performance optimisation.",
      ],
    },
    {
      heading: "4. Cookies & Tracking Technologies",
      body: [
        "BT Market uses cookies and similar tracking technologies to improve user experience and analyse platform performance.",
      ],
      bullets: [
        "Essential Cookies (Session Cookies) – required for account login, security, and basic platform functionality.",
        "Acceptance Cookies (Persistent Cookies) – store your cookie consent preferences.",
        "Functionality Cookies (Persistent Cookies) – remember preferences such as language, login details, and settings.",
      ],
      extra: [
        "You can disable cookies in your browser settings, but some features may not function properly.",
      ],
    },
    {
      heading: "5. How We Use Your Personal Data",
      bullets: [
        "Provide and maintain our Service.",
        "Manage and verify user accounts.",
        "Improve security and prevent fraud or abuse.",
        "Communicate important updates, notifications, and service messages.",
        "Analyse usage trends to enhance platform performance and user experience.",
      ],
    },
    {
      heading: "6. Data Security & Confidentiality",
      body: [
        "We implement appropriate technical and organisational security measures to protect your data against unauthorised access, loss, or misuse.",
        "However, no system is 100% secure, and we cannot guarantee absolute security. You are encouraged to use strong passwords and enable all available security features.",
      ],
    },
    {
      heading: "7. Third‑Party Service Providers",
      body: [
        "We may share limited data with trusted third‑party service providers strictly for:",
      ],
      bullets: [
        "Service maintenance and platform operations.",
        "Analytics and performance monitoring.",
        "Security verification and risk control.",
      ],
      extra: [
        "We do not sell your personal data to third parties.",
      ],
    },
    {
      heading: "8. Your Privacy Rights",
      body: [
        "Depending on your jurisdiction, you may have the right to:",
      ],
      bullets: [
        "Access the personal data we hold about you.",
        "Request correction or deletion of your personal data.",
        "Object to or restrict certain types of processing.",
        "Withdraw consent at any time where processing is based on consent.",
      ],
      extra: [
        "Requests can be made through official BT Market support channels. We will respond within a reasonable timeframe, subject to legal and regulatory obligations.",
      ],
    },
    {
      heading: "9. Changes to This Privacy Policy",
      body: [
        "BT Market reserves the right to update this policy at any time to reflect changes in legal, regulatory, or operational requirements.",
        "Any changes will be posted on this page and become effective immediately upon publication.",
      ],
    },
    {
      heading: "10. Contact Us",
      body: [
        "If you have any questions regarding this Privacy Policy, confidentiality, or how your data is handled, please contact BT Market through official support channels.",
      ],
    },
  ],
};

const RISK_DOC_BASE = {
  sections: [
    {
      heading: "1. Acceptance of Agreement",
      bullets: [
        "By registering, logging in, or using BT Market, you confirm that you have read, understood, and agreed to this User Agreement and all applicable rules.",
        "Your continued use of the platform constitutes acceptance of any future updates to this agreement.",
      ],
    },
    {
      heading: "2. Account Security Responsibility",
      bullets: [
        "You are solely responsible for maintaining the confidentiality of your account credentials, including login ID and password.",
        "All activities performed using your account will be considered authorised by you.",
      ],
      extra: [
        "BT Market is not responsible for any loss resulting from unauthorised access, stolen credentials, or negligence in securing your account.",
        "Users are strongly advised to update passwords regularly and enable all available security features.",
      ],
    },
    {
      heading: "3. Modification of Terms",
      bullets: [
        "BT Market reserves the right to modify, update, or change this agreement, platform rules, or related policies at any time without prior notice.",
        "Revised terms become effective immediately upon publication on the platform.",
        "The Company reserves the final right to interpret and decide on all disputes.",
      ],
    },
    {
      heading: "4. Legal Age Requirement",
      bullets: [
        "Users must be of legal age under the laws of their country or region of residence to access or use BT Market services.",
        "Any transactions or actions that are incomplete or not successfully submitted will be considered invalid.",
      ],
    },
    {
      heading: "5. Technical & Network Risks",
      body: [
        "Digital platforms are subject to technical limitations and external factors. BT Market is not responsible for losses caused by:",
      ],
      bullets: [
        "Internet disruptions or connectivity issues.",
        "Device or hardware failure.",
        "Power outages or unstable power supply.",
        "System delays, interruptions, or other force majeure events.",
      ],
      extra: [
        "If a user is disconnected before a transaction is confirmed, it will not affect completed results already recorded by the system.",
      ],
    },
    {
      heading: "6. Trading & Financial Risk Disclosure",
      body: [
        "Trading and digital asset activities involve significant risk. Market prices may fluctuate due to economic, regulatory, and market‑driven factors, and users may experience partial or total loss of funds.",
        "Before trading, you should carefully assess your risk tolerance and financial situation.",
      ],
      bullets: [
        "Trade responsibly and avoid excessive leverage or speculation.",
        "Use only funds that you can afford to lose.",
        "Understand that past performance does not guarantee future results.",
      ],
      extra: [
        "BT Market does not guarantee profits, fixed returns, or the absence of losses.",
      ],
    },
    {
      heading: "7. User Responsibility",
      bullets: [
        "All trading decisions are made independently by users.",
        "You are solely responsible for any gains, losses, or legal consequences arising from your actions on the platform.",
        "BT Market shall not be liable for any direct or indirect losses arising from user actions, investment decisions, or misunderstanding of market conditions.",
      ],
    },
    {
      heading: "8. Final Decision Authority",
      bullets: [
        "In the event of disputes, system errors, abnormal activity, or suspected violations, BT Market’s decision shall be final and binding, to the fullest extent permitted by applicable law.",
      ],
    },
    {
      heading: "9. Disclaimer",
      body: [
        "BT Market is provided on an “as‑is” and “as‑available” basis. While we strive to maintain a secure and stable trading environment, we do not warrant that the platform will be uninterrupted, error‑free, or free of risks.",
        "By using BT Market, you acknowledge that digital asset trading carries inherent risks and agree to assume full responsibility for your participation.",
      ],
    },
  ],
};

const AboutDocumentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(TRADE_NAMESPACE);

  const isPrivacy = location.pathname.includes("privacy");

  const doc = useMemo(() => {
    if (isPrivacy) {
      return {
        title: t(
          "about.documents.privacy.title",
          "Privacy Policy & Confidentiality Agreement"
        ),
        intro: t(
          "about.documents.privacy.intro",
          "This Privacy Policy explains how BT Market (“we”, “us”, “our”) collects, uses, stores, and protects your information when you use our website, application, or services."
        ),
        sections: PRIVACY_DOC_BASE.sections.map((section, si) => ({
          ...section,
          heading: section.heading
            ? t(`about.documents.privacy.sections.${si}.heading`, section.heading)
            : undefined,
          subheading: section.subheading
            ? t(`about.documents.privacy.sections.${si}.subheading`, section.subheading)
            : undefined,
          body: section.body
            ? section.body.map((paragraph, bi) =>
                t(`about.documents.privacy.sections.${si}.body.${bi}`, paragraph)
              )
            : undefined,
          bullets: section.bullets
            ? section.bullets.map((item, bi) =>
                t(`about.documents.privacy.sections.${si}.bullets.${bi}`, item)
              )
            : undefined,
          extra: section.extra
            ? section.extra.map((paragraph, ei) =>
                t(`about.documents.privacy.sections.${si}.extra.${ei}`, paragraph)
              )
            : undefined,
        })),
      };
    }

    return {
      title: t(
        "about.documents.risk.title",
        "Risk Disclosure & User Agreement"
      ),
      intro: t(
        "about.documents.risk.intro",
        "Please read this Risk Disclosure & User Agreement carefully before using BT Market. By accessing or using our platform, you acknowledge that you understand and agree to the following terms and risks."
      ),
      sections: RISK_DOC_BASE.sections.map((section, si) => ({
        ...section,
        heading: section.heading
          ? t(`about.documents.risk.sections.${si}.heading`, section.heading)
          : undefined,
        subheading: section.subheading
          ? t(`about.documents.risk.sections.${si}.subheading`, section.subheading)
          : undefined,
        body: section.body
          ? section.body.map((paragraph, bi) =>
              t(`about.documents.risk.sections.${si}.body.${bi}`, paragraph)
            )
          : undefined,
        bullets: section.bullets
          ? section.bullets.map((item, bi) =>
              t(`about.documents.risk.sections.${si}.bullets.${bi}`, item)
            )
          : undefined,
        extra: section.extra
          ? section.extra.map((paragraph, ei) =>
              t(`about.documents.risk.sections.${si}.extra.${ei}`, paragraph)
            )
          : undefined,
      })),
    };
  }, [isPrivacy, t]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: AppColors.BG_MAIN,
        color: AppColors.TXT_MAIN,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          py: 0.75,
          px: 1,
          color: AppColors.TXT_MAIN,
          backgroundColor: AppColors.BG_MAIN,
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: AppColors.TXT_MAIN,
            p: 0.5,
            "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
          }}
        >
          <ChevronLeft sx={{ fontSize: 26 }} />
        </IconButton>

        <Typography
          sx={{
            fontSize: FONT_SIZE.TITLE,
            fontWeight: 700,
            color: AppColors.TXT_MAIN,
            textAlign: "center",
          }}
        >
          {doc.title}
        </Typography>

        {/* spacer */}
        <Box sx={{ width: 40 }} />
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          pb: 4,
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 55%)",
        }}
      >
        <Box
          sx={{
            borderRadius: 2,
            bgcolor: AppColors.BG_CARD,
            boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
            p: 2,
            maxWidth: 720,
            mx: "auto",
          }}
        >
          <Typography
            sx={{
              fontSize: FONT_SIZE.BODY,
              fontWeight: 500,
              color: AppColors.TXT_MAIN,
              mb: 1.5,
            }}
          >
            {doc.intro}
          </Typography>

          {doc.sections.map((section, index) => (
            <Box key={`${section.heading || section.subheading}-${index}`} sx={{ mb: 2.5 }}>
              {section.heading && (
                <Typography
                  sx={{
                    fontSize: FONT_SIZE.BODY,
                    fontWeight: 600,
                    color: AppColors.TXT_MAIN,
                    mb: 0.75,
                  }}
                >
                  {section.heading}
                </Typography>
              )}

              {section.subheading && (
                <Typography
                  sx={{
                    fontSize: FONT_SIZE.BODY,
                    fontWeight: 600,
                    color: AppColors.TXT_SUB,
                    mb: 0.75,
                  }}
                >
                  {section.subheading}
                </Typography>
              )}

              {section.body &&
                section.body.map((paragraph, i) => (
                  <Typography
                    key={i}
                    sx={{
                      fontSize: FONT_SIZE.BODY2,
                      color: AppColors.TXT_SUB,
                      lineHeight: 1.7,
                      mb: 0.75,
                    }}
                  >
                    {paragraph}
                  </Typography>
                ))}

              {section.bullets && (
                <Box component="ul" sx={{ pl: 2.5, m: 0, mt: 0.5 }}>
                  {section.bullets.map((item, i) => (
                    <Typography
                      key={i}
                      component="li"
                      sx={{
                        fontSize: FONT_SIZE.BODY2,
                        color: AppColors.TXT_SUB,
                        lineHeight: 1.7,
                        mb: 0.5,
                      }}
                    >
                      {item}
                    </Typography>
                  ))}
                </Box>
              )}

              {section.extra &&
                section.extra.map((paragraph, i) => (
                  <Typography
                    key={i}
                    sx={{
                      fontSize: FONT_SIZE.BODY2,
                      color: AppColors.TXT_SUB,
                      lineHeight: 1.7,
                      mt: 0.75,
                    }}
                  >
                    {paragraph}
                  </Typography>
                ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AboutDocumentPage;

