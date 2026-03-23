import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Data attribute used to find the main app scroll container in the layout */
export const SCROLL_CONTAINER_SELECTOR = "[data-app-scroll-container]";

/**
 * Resets scroll position when the route changes so that returning to a screen
 * always shows the top instead of the previous scroll position.
 * Handles both window scroll and the layout's scroll container (e.g. MUI Container).
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Reset window/document scroll (covers body scroll)
    window.scrollTo(0, 0);

    // Reset the main layout scroll container used by AppLayout
    const container = document.querySelector(SCROLL_CONTAINER_SELECTOR);
    if (container) {
      container.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

export default ScrollToTop;
