import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import AuthCallback from "./components/AuthCallback";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import HomePage from "./pages/HomePage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import CalculatorPage from "./pages/CalculatorPage";
import ContactPage from "./pages/ContactPage";
import AgentsPage from "./pages/AgentsPage";
import AreasPage from "./pages/AreasPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";

// Router wrapper to handle auth callback
const AppRouter = () => {
  const location = useLocation();

  // Check URL fragment for session_id (OAuth callback)
  // This must be checked synchronously during render to prevent race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  // Check if current route is admin (redirect or login/dashboard)
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/areas" element={<AreasPage />} />
      </Routes>
      <Footer />
      <WhatsAppButton />
    </>
  );
};

function App() {
  return (
    <div className="App min-h-screen bg-[#FAFAF9]">
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <FavoritesProvider>
              <ScrollToTop />
              <AppRouter />
              <Toaster position="top-right" richColors />
            </FavoritesProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
