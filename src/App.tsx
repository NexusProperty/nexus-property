import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Layouts
import { RootLayout } from "./components/layout/RootLayout";
import DashboardLayout from "./components/layout/DashboardLayout";

// Auth components
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Public pages
import Landing from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";

// Property pages
import PropertiesIndexPage from "./pages/dashboard/properties";
import NewPropertyPage from "./pages/dashboard/properties/new";
import PropertyDetailPage from "./pages/dashboard/properties/[id]/index";
import EditPropertyPage from "./pages/dashboard/properties/edit/[id]";

// UI Components
import UIComponentsPage from "./pages/dashboard/ui-components";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<RootLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Property routes */}
                <Route path="/dashboard/properties" element={<PropertiesIndexPage />} />
                <Route path="/dashboard/properties/new" element={<NewPropertyPage />} />
                <Route path="/dashboard/properties/:id" element={<PropertyDetailPage />} />
                <Route path="/dashboard/properties/edit/:id" element={<EditPropertyPage />} />
                
                {/* Agent-specific routes */}
                <Route path="/dashboard/appraisals" element={<div>Appraisals</div>} />
                <Route path="/dashboard/clients" element={<div>Clients</div>} />
                <Route path="/dashboard/reports" element={<div>Reports</div>} />
                
                {/* Admin-specific routes */}
                <Route path="/dashboard/users" element={<div>User Management</div>} />
                
                {/* Common routes */}
                <Route path="/dashboard/settings" element={<div>Settings</div>} />
                
                {/* UI Components Demo */}
                <Route path="/dashboard/ui-components" element={<UIComponentsPage />} />
              </Route>
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
