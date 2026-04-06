import { Outlet } from "react-router-dom";
import BottomNavigation from "../components/BottomNavigation";
import { useAuth } from "../context/AuthContext";
import "./MainLayout.css";

const MainLayout = () => {
  const { logout, user } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Finance House</h1>
        <div className="header-actions">
          <span className="user-badge">{user?.username}</span>
          <button className="logout-btn" onClick={logout} title="Cerrar sesión">
            Salir
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <Outlet />
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default MainLayout;
