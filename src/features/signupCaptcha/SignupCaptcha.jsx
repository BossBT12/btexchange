import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Box, TextField, Typography } from "@mui/material";
import {
  loadCaptchaEnginge,
  LoadCanvasTemplateNoReload,
} from "react-simple-captcha";
import { TbReload } from "react-icons/tb";
import { AppColors } from "../../constant/appColors";
import { FONT_SIZE } from "../../constant/lookUpConstant";

const CAPTCHA_LENGTH = 6;
const CAPTCHA_BG = AppColors.BG_SECONDARY;
const CAPTCHA_FG = AppColors.TXT_MAIN;

/**
 * Extra lines, curves, dots, and grain on top of the library draw — obfuscation only;
 * the stored captcha string is unchanged.
 */
function applyCaptchaTexture(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.6 + Math.random() * 0.6})`;
    ctx.lineWidth = 0.4 + Math.random() * 1.1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(212,168,95,${0.3 + Math.random() * 0.1})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.quadraticCurveTo(
      Math.random() * w,
      Math.random() * h,
      Math.random() * w,
      Math.random() * h,
    );
    ctx.stroke();
  }

  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * w,
      Math.random() * h,
      0.4 + Math.random() * 1.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.2})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
}

function mountCaptchaEngine() {
  loadCaptchaEnginge(CAPTCHA_LENGTH, CAPTCHA_BG, CAPTCHA_FG);
  const canvas = document.getElementById("canv");
  if (canvas) applyCaptchaTexture(canvas);
}

const SignupCaptcha = forwardRef(function SignupCaptcha(
  { disabled = false },
  ref,
) {
  const [value, setValue] = useState("");
  const valueRef = useRef("");
  const mountedRef = useRef(false);

  const syncValue = useCallback((next) => {
    valueRef.current = next;
    setValue(next);
  }, []);

  const reload = useCallback(() => {
    mountCaptchaEngine();
    syncValue("");
  }, [syncValue]);

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => valueRef.current,
      reload,
    }),
    [reload],
  );

  useEffect(() => {
    mountedRef.current = true;
    const id = window.setTimeout(() => {
      if (!mountedRef.current) return;
      try {
        mountCaptchaEngine();
      } catch {
        window.setTimeout(() => {
          if (mountedRef.current) mountCaptchaEngine();
        }, 100);
      }
    }, 0);
    return () => {
      mountedRef.current = false;
      window.clearTimeout(id);
    };
  }, []);

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: AppColors.BG_SECONDARY,
      color: AppColors.TXT_MAIN,
      borderRadius: 2,
      "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
      "&.Mui-focused fieldset": {
        borderColor: AppColors.TXT_SUB,
        borderWidth: 1,
      },
      "&.Mui-error fieldset": { borderColor: AppColors.ERROR },
    },
    "& .MuiInputBase-input": { py: 1.5, fontSize: FONT_SIZE.BODY2 },
    "& .MuiInputBase-input::placeholder": {
      color: AppColors.TXT_SUB,
      opacity: 1,
    },
    "& .MuiFormHelperText-root": {
      color: AppColors.ERROR,
      fontSize: FONT_SIZE.CAPTION,
    },
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}
    >
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, color: AppColors.TXT_MAIN }}
      >
        Verification
      </Typography>
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          "& canvas": {
            display: "block",
            maxWidth: "100%",
            height: "auto",
            verticalAlign: "middle",
          },
          /* Library still injects an empty #reload_href; hide it — we use our own row */
          "& #reload_href": { display: "none" },
        }}
      >
        <LoadCanvasTemplateNoReload />
        <Box
          component="button"
          type="button"
          onClick={reload}
          disabled={disabled}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            py: 0,
            px: 1.5,
            border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            color: AppColors.GOLD_PRIMARY,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <TbReload size={16} aria-hidden />
        </Box>
      </Box>
      <TextField
        fullWidth
        name="signupCaptcha"
        placeholder="Enter the characters shown above"
        value={value}
        onChange={(e) => syncValue(e.target.value)}
        disabled={disabled}
        autoComplete="off"
        inputProps={{
          "aria-label": "Captcha verification input",
          maxLength: 32,
        }}
        variant="outlined"
        sx={textFieldSx}
      />
    </Box>
  );
});

SignupCaptcha.displayName = "SignupCaptcha";

export default SignupCaptcha;
