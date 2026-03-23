import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../i18n";
import { AppColors } from "../constant/appColors";
import { BORDER_RADIUS, FONT_SIZE } from "../constant/lookUpConstant";

const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  duration: Math.random() * 8 + 4,
  delay: Math.random() * 6,
  opacity: Math.random() * 0.5 + 0.2,
}));

export default function ComingSoon() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const { t } = useTranslation(TRADE_NAMESPACE);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      for (let i = -canvas.height; i < canvas.width + canvas.height; i += 60) {
        const alpha = 0.015 + 0.01 * Math.sin(t * 0.01 + i * 0.02);
        ctx.strokeStyle = `rgba(212,175,55,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + canvas.height, canvas.height);
        ctx.stroke();
      }
      ctx.restore();
      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: "#050501", fontFamily: "'Cormorant Garamond', serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:wght@300;400;500;600&display=swap');

        @keyframes float-up {
          0% { transform: translateY(0px) scale(1); opacity: var(--op); }
          50% { opacity: calc(var(--op) * 1.5); }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.9s ease forwards; }
        .text-shimmer {
          background: linear-gradient(90deg, #8B6914, #f5d980, #D4AF37, #f5d980, #8B6914);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .ornament { color: #D4AF37; opacity: 0.6; }
      `}</style>

      {/* Shimmer canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, #050501 100%)" }}
      />

      {/* Golden ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "600px", height: "300px",
          top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size + "px",
            height: p.size + "px",
            left: p.x + "%",
            top: "100%",
            background: "#D4AF37",
            "--op": p.opacity,
            animation: `float-up ${p.duration}s ${p.delay}s linear infinite`,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl w-full">

        {/* Coming Soon heading */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <h1
            className="text-shimmer text-6xl md:text-8xl font-black mb-2 leading-none tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("comingSoonPage.title", "Coming Soon")}
          </h1>
          <p
            className="text-lg md:text-xl font-light mt-4 mb-4"
            style={{ color: "rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}
          >
            {t(
              "comingSoonPage.subtitle",
              "We're crafting something worth the wait."
            )}
          </p>
          <Button
            onClick={() => navigate("/")}
            className="btn-primary mt-4 transform-none"
          >
            {t("comingSoonPage.backToHome", "Back to Home")}
          </Button>
        </div>

        {/* Divider */}
        <div className="animate-fade-in-up w-32 mt-8" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "#8B6914" }} />
            <span className="ornament text-sm">◆</span>
            <div className="h-px flex-1" style={{ background: "#8B6914" }} />
          </div>
        </div>

      </div>
    </div>
  );
}