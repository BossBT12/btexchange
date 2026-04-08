import React, { memo, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes";
import ProtectedRoute2 from "./ProtectedRoutes2";
import AppLayout from "../layout";
import { authRouters, publicRouters, protectedRouters, protectedRouters2, routers } from "./router.config";

const PRELOAD_MAP = {
  "/": ["/trade", "/market", "/login"],
  "/login": ["/", "/signup"],
  "/trade": ["/market", "/trade/asset"],
  "/market": ["/trade", "/"],
};

const scheduleIdle = typeof requestIdleCallback === "function"
  ? requestIdleCallback
  : (cb) => setTimeout(cb, 2000);

const AppRouter = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const targets = PRELOAD_MAP[pathname];
    if (!targets || targets.length === 0) return;

    const id = scheduleIdle(() => {
      for (const path of targets) {
        const route = routers.find((r) => r.path === path);
        if (route?.component?.preload) {
          route.component.preload();
        }
      }
    });

    return () => {
      if (typeof cancelIdleCallback === "function") cancelIdleCallback(id);
    };
  }, [pathname]);

  return (
    <Routes>
      {authRouters.map(({ path, component }) => (
        <Route
          key={path}
          path={path}
          element={
            component ? React.createElement(component) : <Navigate to="/" replace />
          }
        />
      ))}

      {publicRouters.map(({ path, component, isHeader, isBottomNav }) => (
        <Route
          key={path}
          path={path}
          element={
            <AppLayout isHeader={isHeader} isBottomNav={isBottomNav}>
              {component ? React.createElement(component) : <Navigate to="/" replace />}
            </AppLayout>
          }
        />
      ))}

      {protectedRouters.map(({ path, component, isHeader, isBottomNav }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <AppLayout isHeader={isHeader} isBottomNav={isBottomNav}>
                {component ? React.createElement(component) : <Navigate to="/" replace />}
              </AppLayout>
            </ProtectedRoute>
          }
        />
      ))}

      {protectedRouters2.map(({ path, component, isHeader, isBottomNav }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute2>
              <AppLayout isHeader={isHeader} isBottomNav={isBottomNav} isMlm={true}>
                {component ? React.createElement(component) : <Navigate to="/" replace />}
              </AppLayout>
            </ProtectedRoute2>
          }
        />
      ))}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default memo(AppRouter);
