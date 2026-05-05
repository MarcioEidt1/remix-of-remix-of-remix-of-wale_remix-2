import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminForgotPassword from "./pages/AdminForgotPassword.tsx";
import AdminResetPassword from "./pages/AdminResetPassword.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import AdminVehicles from "./pages/admin/AdminVehicles.tsx";
import AdminBanners from "./pages/admin/AdminBanners.tsx";
import AdminContacts from "./pages/admin/AdminContacts.tsx";
import AdminMovements from "./pages/admin/AdminMovements.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminDocuments from "./pages/admin/AdminDocuments.tsx";

import AdminGoogleIntegrations from "./pages/admin/AdminGoogleIntegrations.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AdminAppearance from "./pages/admin/AdminAppearance.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminTestimonials from "./pages/admin/AdminTestimonials.tsx";
import AdminImport from "./pages/admin/AdminImport.tsx";
import AdminBackup from "./pages/admin/AdminBackup.tsx";
import AdminFeeds from "./pages/admin/AdminFeeds.tsx";
import AdminDataExport from "./pages/admin/AdminDataExport.tsx";
import GoogleScripts from "./components/GoogleScripts.tsx";
import FaviconManager from "./components/FaviconManager.tsx";
import VehicleDetails from "./pages/VehicleDetails.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import LgpdBanner from "./components/LgpdBanner.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GoogleScripts />
        <FaviconManager />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/veiculo/:id" element={<VehicleDetails />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/vehicles" element={<AdminVehicles />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/contacts" element={<AdminContacts />} />
            <Route path="/admin/movements" element={<AdminMovements />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/appearance" element={<AdminAppearance />} />
            <Route path="/admin/google" element={<AdminGoogleIntegrations />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/testimonials" element={<AdminTestimonials />} />
            <Route path="/admin/import" element={<AdminImport />} />
            <Route path="/admin/feeds" element={<AdminFeeds />} />
            <Route path="/admin/backup" element={<AdminBackup />} />
            <Route path="/admin/data-export" element={<AdminDataExport />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <LgpdBanner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
