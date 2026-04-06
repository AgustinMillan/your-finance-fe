import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // Si no hay usuario en sesión, redirige al login
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario autenticado, renderiza las vistas secundarias correspondientes
  return <Outlet />;
};

export default ProtectedRoute;
