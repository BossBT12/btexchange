import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute2 = ({ children }) => {
  const location = useLocation();
  const { token2 } = useAuth();

  if (!token2) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute2;
