import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import BalanceView from "./views/BalanceView";
import CategoriesView from "./views/CategoriesView";
import ReportsView from "./views/ReportsView";
import Login from "./views/Login";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/balance" element={<BalanceView />} />
          <Route path="/categories" element={<CategoriesView />} />
          <Route path="/reports" element={<ReportsView />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/balance" replace />} />
    </Routes>
  );
}

export default App;
