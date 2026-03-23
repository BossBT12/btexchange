import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { AppColors } from "../constant/appColors";

const SWIPE_THRESHOLD_PERCENT = 0.15;
const ANIMATION_DURATION = 400;

export function StackCardCarousel({ cards: cardsProp = [] }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);

  const [cards, setCards] = useState(() => (cardsProp?.length ? cardsProp : []));
  const [dragOffset, setDragOffset] = useState(0);
  const [exitOffset, setExitOffset] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);

  const containerWidth = useMemo(
    () => containerRef.current?.offsetWidth ?? 300,
    [cards]
  );

  const rotateCards = useCallback(() => {
    setCards((prev) => {
      const next = [...prev];
      next.push(next.shift());
      return next;
    });
  }, []);

  const resetDragState = () => {
    setDragOffset(0);
    setExitOffset(null);
    dragOffsetRef.current = 0;
  };

  // Sync when card content actually changes (e.g. language), not on every parent re-render.
  const cardsPropRef = useRef(cardsProp);
  cardsPropRef.current = cardsProp;
  const cardsPropSignature = useMemo(
    () => (cardsProp?.length ? cardsProp.map((c) => c?.id ?? c?.title).join(",") : ""),
    [cardsProp]
  );

  useEffect(() => {
    const prop = cardsPropRef.current;
    if (!prop?.length) {
      setCards([]);
      resetDragState();
      return;
    }
    setCards(prop);
    resetDragState();
  }, [cardsPropSignature]);

  const commitSwipe = useCallback(
    (offsetX) => {
      const threshold = containerWidth * SWIPE_THRESHOLD_PERCENT;

      if (Math.abs(offsetX) < threshold) {
        resetDragState();
        return;
      }

      const direction = offsetX > 0 ? 1 : -1;
      setExitOffset(containerWidth * 1.5 * direction);

      setTimeout(() => {
        rotateCards();
        resetDragState();
      }, ANIMATION_DURATION);
    },
    [containerWidth, rotateCards]
  );

  // Auto-rotate top card every few seconds when not dragging.
  // `interactionCount` ensures the timer restarts after any manual swipe.
  useEffect(() => {
    if (!cards.length) return;

    const intervalId = setInterval(() => {
      if (isDraggingRef.current) return;
      commitSwipe(-containerWidth);
    }, 6000);

    return () => clearInterval(intervalId);
  }, [cards.length, commitSwipe, containerWidth, interactionCount]);

  /* ---------------- Pointer Events (Unified Mouse + Touch) ---------------- */

  const handlePointerDown = (e) => {
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    dragOffsetRef.current = delta;
    setDragOffset(delta);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setInteractionCount((prev) => prev + 1);
    commitSwipe(dragOffsetRef.current);
  };

  /* ---------------- Derived Values ---------------- */

  const topCardTranslateX =
    exitOffset !== null ? exitOffset : dragOffset;

  /* ---------------- Render ---------------- */

  if (!cards.length) return null;

  const topIndex = Math.max(0, cardsProp.findIndex((c) => c === cards[0]));

  return (
    <div className="relative overflow-hidden flex items-center justify-center px-4 mb-4">
      <div
        ref={containerRef}
        className="relative w-full min-h-[100px] select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {cards.map((card, index) => {
          const isTop = index === 0;

          const stackStyle = [
            "",
            "translate-x-2.5 scale-[0.96] z-30",
            "translate-x-5 scale-[0.92] z-20",
            "translate-x-7.5 scale-[0.88] z-10",
          ][index] ?? "translate-x-10 scale-[0.88] z-0";

          return (
            <Box
              key={card.id}
              component="div"
              onClick={() => isTop && card?.link && navigate(card.link)}
              className={`absolute inset-0 flex items-center shadow-2xl ${isTop ? "z-40 cursor-pointer" : stackStyle
                } ${isTop && !isDraggingRef.current
                  ? "transition-transform duration-300 ease-out"
                  : ""
                }`}
              sx={{
                border: "1px solid",
                borderColor: AppColors.GOLD_PRIMARY,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: AppColors.BG_SECONDARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                maxWidth: "36rem",
                margin: "0 auto",
                px: 2,
                py: 1.5,
                ...(isTop && {
                  transform: `translateX(${topCardTranslateX}px) scale(1)`,
                }),
              }}
            >
              <Box sx={{ flex: 1, pr: 0.5 }}>
                <Typography variant="h4" sx={{ color: AppColors.TXT_MAIN, fontWeight: 600 }}>
                  {card?.title}
                </Typography>
                <Typography variant="body2" sx={{ color: AppColors.TXT_SUB, mt: 0.25 }}>
                  {card?.description}
                </Typography>
              </Box>
              <Box
                component="figure"
                sx={{
                  width: 72,
                  height: 72,
                  margin: 0,
                  flexShrink: 0,
                }}
              >
                <img
                  src={card?.image}
                  alt="stack card image"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </Box>
            </Box>
          );
        })}

        {/* Desktop Controls */}
        {/* <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 w-full justify-between px-2">
          <button
            onClick={() => commitSwipe(-containerWidth)}
            className="bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full"
          >
            ⬅
          </button>
          <button
            onClick={() => commitSwipe(containerWidth)}
            className="bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full"
          >
            ➡
          </button>
        </div> */}

        {/* Indicators */}
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-40">
        {cardsProp.map((_, i) => (
          <span
            key={i}
            className={`h-0.5 transition-all duration-300 ${i === topIndex ? "w-1 scale-125" : "w-0.5"}`}
            style={{
              backgroundColor: i === topIndex ? AppColors.GOLD_PRIMARY : AppColors.TXT_SUB,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function FeatureCardsCarousel({ cards: cardsProp = [] }) {
  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);

  const [cards, setCards] = useState(() => (cardsProp?.length ? cardsProp : []));
  const [dragOffset, setDragOffset] = useState(0);
  const [exitOffset, setExitOffset] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);

  const containerWidth = useMemo(
    () => containerRef.current?.offsetWidth ?? 300,
    [cards]
  );

  const rotateCards = useCallback(() => {
    setCards((prev) => {
      const next = [...prev];
      next.push(next.shift());
      return next;
    });
  }, []);

  const resetDragState = () => {
    setDragOffset(0);
    setExitOffset(null);
    dragOffsetRef.current = 0;
  };

  // Sync when card content actually changes (e.g. language), not on every parent re-render.
  const cardsPropRef = useRef(cardsProp);
  cardsPropRef.current = cardsProp;
  const cardsPropSignature = useMemo(
    () => (cardsProp?.length ? cardsProp.map((c) => c?.id ?? c?.title).join(",") : ""),
    [cardsProp]
  );

  useEffect(() => {
    const prop = cardsPropRef.current;
    if (!prop?.length) {
      setCards([]);
      resetDragState();
      return;
    }
    setCards(prop);
    resetDragState();
  }, [cardsPropSignature]);

  const commitSwipe = useCallback(
    (offsetX) => {
      const threshold = containerWidth * SWIPE_THRESHOLD_PERCENT;

      if (Math.abs(offsetX) < threshold) {
        resetDragState();
        return;
      }

      const direction = offsetX > 0 ? 1 : -1;
      setExitOffset(containerWidth * 1.5 * direction);

      setTimeout(() => {
        rotateCards();
        resetDragState();
      }, ANIMATION_DURATION);
    },
    [containerWidth, rotateCards]
  );

  // Auto-rotate feature cards every few seconds when not dragging.
  // `interactionCount` ensures the timer restarts after any manual swipe.
  useEffect(() => {
    if (!cards.length) return;

    const intervalId = setInterval(() => {
      if (isDraggingRef.current) return;
      commitSwipe(-containerWidth);
    }, 6000);

    return () => clearInterval(intervalId);
  }, [cards.length, commitSwipe, containerWidth, interactionCount]);

  const handlePointerDown = (e) => {
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    dragOffsetRef.current = delta;
    setDragOffset(delta);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setInteractionCount((prev) => prev + 1);
    commitSwipe(dragOffsetRef.current);
  };

  const topCardTranslateX =
    exitOffset !== null ? exitOffset : dragOffset;

  if (!cards.length) return null;

  const topIndex = Math.max(0, cardsProp.findIndex((c) => c === cards[0]));

  return (
    <div className="relative overflow-hidden flex items-center justify-center px-4 mb-4">
      <div
        ref={containerRef}
        className="relative w-full min-h-[100px] select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {cards.map((card, index) => {
          const isTop = index === 0;

          const stackStyle = [
            "",
            "translate-x-2.5 scale-[0.96] z-30",
            "translate-x-5 scale-[0.92] z-20",
            "translate-x-7.5 scale-[0.88] z-10",
          ][index] ?? "translate-x-7.5 scale-[0.88] z-0";

          return (
            <Box
              key={card.id ?? index}
              component="div"
              className={`absolute inset-0 flex items-center shadow-2xl cursor-default ${isTop ? "z-40" : stackStyle
                } ${isTop && !isDraggingRef.current
                  ? "transition-transform duration-300 ease-out"
                  : ""
                }`}
              sx={{
                border: "1px solid",
                borderColor: AppColors.GOLD_PRIMARY,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: AppColors.BG_SECONDARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                maxWidth: "36rem",
                margin: "0 auto",
                ...(isTop && {
                  transform: `translateX(${topCardTranslateX}px) scale(1)`,
                }),
              }}
            >
              <Box sx={{ flex: 1, pr: 1 }}>
                <Typography variant="h4" sx={{ color: AppColors.TXT_MAIN, fontWeight: 600, lineHeight: 1.2 }}>
                  {card?.title}
                </Typography>
                <Typography variant="body1" sx={{ color: AppColors.TXT_SUB, lineHeight: 1.2, mt: 0.25 }}>
                  {card?.description}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {/* Desktop Controls */}
        {/* <Box sx={{
          display: { xs: "none", md: "flex" },
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          justifyContent: "space-between",
          px: 2,
        }}>
          <button
            onClick={() => commitSwipe(-containerWidth)}
            className="bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full"
          >
            ⬅
          </button>
          <button
            onClick={() => commitSwipe(containerWidth)}
            className="bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full"
          >
            ➡
          </button>
        </Box> */}

        {/* Indicators */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-40">
          {cardsProp.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 transition-all duration-300 ${i === topIndex ? "w-1 scale-125" : "w-0.5"}`}
              style={{
                backgroundColor: i === topIndex ? AppColors.GOLD_PRIMARY : AppColors.TXT_SUB,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
