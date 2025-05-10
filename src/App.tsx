
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import { RootLayout } from "./components/layout/RootLayout";
import { AgentLayout } from "./components/layout/AgentLayout";
import { CustomerLayout } from "./components/layout/CustomerLayout";
import { AdminLayout } from "./components/layout/AdminLayout";

// Pages
import Landing from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

// Agent pages
import AgentDashboard from "./pages/auth/agent/Dashboard";

// Customer pages
import CustomerDashboard from "./pages/auth/customer/Dashboard";
import CustomerAppraisals from "./pages/auth/customer/Appraisals";

// Admin pages
import AdminDashboard from "./pages/auth/admin/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          </Route>
          
          {/* Agent routes */}
          <Route path="/agent" element={<AgentLayout />}>
            <Route index element={<AgentDashboard />} />
            <Route path="appraisals" element={<div>Appraisals</div>} />
            <Route path="appraisal-feed" element={<div>Appraisal Feed</div>} />
            <Route path="team" element={<div>Team Management</div>} />
            <Route path="integrations" element={<div>Integration Hub</div>} />
            <Route path="settings" element={<div>Account Settings</div>} />
          </Route>
          
          {/* Customer routes */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<CustomerDashboard />} />
            <Route path="appraisals" element={<CustomerAppraisals />} />
            <Route path="settings" element={<div>Account Settings</div>} />
          </Route>
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<div>User Management</div>} />
            <Route path="monitoring" element={<div>System Monitoring</div>} />
            <Route path="data" element={<div>Data Management</div>} />
            <Route path="subscription" element={<div>Subscription Management</div>} />
            <Route path="content" element={<div>Content Management</div>} />
            <Route path="analytics" element={<div>Analytics</div>} />
            <Route path="settings" element={<div>System Settings</div>} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
