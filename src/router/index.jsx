import React, { memo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes";
import ProtectedRoute2 from "./ProtectedRoutes2";
import AppLayout from "../layout";
import { authRouters, publicRouters, protectedRouters, protectedRouters2 } from "./router.config";

const AppRouter = () => {

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
