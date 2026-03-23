import { createTheme } from "@mui/material/styles";

// Responsive breakpoints
// xs: 0px (mobile)
// sm: 600px (large mobile/small tablet)
// md: 900px (tablet)
// lg: 1200px (laptop)
// xl: 1536px (desktop)

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: "#D4AF37", // Gold primary from AppColors
      light: "#D4AF37", // Gold light
      dark: "#D4AF37", // Gold dark
      contrastText: "#000",
    },
    secondary: {
      main: "#000", // Black
      light: "#1a1a1a", // BG_SECONDARY
      dark: "#0a0a0a", // BG_CARD
    },
    background: {
      default: "#000", // BG_MAIN
      paper: "#0a0a0a", // BG_CARD
    },
    text: {
      primary: "#ffffff", // TXT_MAIN
      secondary: "#b0b0b0", // TXT_SUB
      disabled: "#666666", // HLT_NONE
    },
    success: {
      main: "#00ff88", // SUCCESS
    },
    error: {
      main: "#ff4444", // ERROR
    },
    mode: "dark",
  },
  typography: {
    fontFamily: `Inter,Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,sans-serif !important`,
    h1: {
      fontWeight: 700,
      fontSize: "clamp(1.75rem, 4vw, 4rem)",
      lineHeight: 1.15,
    },

    h2: {
      fontWeight: 700,
      fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
      lineHeight: 1.2,
    },

    h3: {
      fontWeight: 600,
      fontSize: "clamp(1.25rem, 2.2vw, 2rem)",
      lineHeight: 1.3,
    },

    h4: {
      fontWeight: 600,
      fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)",
      lineHeight: 1.35,
    },

    h5: {
      fontWeight: 600,
      fontSize: "clamp(0.95rem, 1.4vw, 1.25rem)",
      lineHeight: 1.45,
    },

    h6: {
      fontWeight: 600,
      fontSize: "clamp(0.875rem, 1.2vw, 1.1rem)",
      lineHeight: 1.5,
    },

    body1: {
      fontSize: "clamp(0.85rem, 1.1vw, 1rem)",
      lineHeight: 1.7,
    },

    body2: {
      fontSize: "clamp(0.75rem, 1vw, 0.95rem)",
      lineHeight: 1.6,
    },

    caption: {
      fontSize: "clamp(0.65rem, 0.9vw, 0.85rem)",
      lineHeight: 1.4,
    },
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#0a0a0a", // BG_CARD
          backgroundImage: "none",
          '--Paper-overlay': "#0a0a0a !important",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          maxWidth: "28rem",
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          maxWidth: "28rem",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#0a0a0a", // BG_CARD
          backgroundImage: "none",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "#0a0a0a", // BG_CARD
        },
      },
    }
  },
});

export default theme;
