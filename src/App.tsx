
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";

// Layouts
import { PublicLayout } from "@/layouts/PublicLayout";
import { AgentLayout } from "@/layouts/AgentLayout";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { AdminLayout } from "@/layouts/AdminLayout";

// Public Pages
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import PropertyDataDemoPage from "@/pages/demo/PropertyDataDemo";

// Agent Pages
import { DashboardPage } from "@/pages/auth/agent/DashboardPage";
import { TeamListPage } from "@/pages/auth/agent/TeamListPage";
import { TeamDetailPage } from "@/pages/auth/agent/TeamDetailPage";
import { CreateTeamPage } from "@/pages/auth/agent/CreateTeamPage";
import { ProfilePage } from "@/pages/auth/ProfilePage";
import AppraisalFeedPage from "@/pages/auth/agent/AppraisalFeed";
import { AppraisalDetailPage } from "@/pages/auth/agent/AppraisalDetailPage";

// Customer Pages
import { CustomerDashboardPage } from "@/pages/auth/customer/DashboardPage";
import { CustomerAppraisalsPage } from "@/pages/auth/customer/AppraisalsPage";
import RequestAppraisalPage from "@/pages/auth/customer/RequestAppraisalPage";

// Admin Pages
import { AdminDashboardPage } from "@/pages/auth/admin/DashboardPage";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HelmetProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/demo/property-data" element={<PropertyDataDemoPage />} />
              </Route>

              {/* Agent Routes */}
              <Route path="/agent" element={<AgentLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="teams" element={<TeamListPage />} />
                <Route path="teams/:teamId" element={<TeamDetailPage />} />
                <Route path="teams/create" element={<CreateTeamPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="appraisals" element={<AppraisalFeedPage />} />
                <Route path="appraisals/:id" element={<AppraisalDetailPage />} />
              </Route>

              {/* Customer Routes */}
              <Route path="/customer" element={<CustomerLayout />}>
                <Route index element={<CustomerDashboardPage />} />
                <Route path="appraisals" element={<CustomerAppraisalsPage />} />
                <Route path="appraisals/request" element={<RequestAppraisalPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Routes>
            <Toaster />
          </Router>
        </HelmetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
