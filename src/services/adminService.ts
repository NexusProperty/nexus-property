import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Admin dashboard metrics type
export interface AdminDashboardMetrics {
  totalUsers: number;
  totalAgents: number;
  totalCustomers: number;
  monthlyAppraisals: number;
  systemHealth: {
    apiStatus: string;
    database: string;
    externalApis: string;
    scheduledTasks: string;
  };
  recentActivity: {
    type: string;
    message: string;
    timestamp: string;
  }[];
}

// Fetch dashboard metrics for the admin dashboard
export async function fetchAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  try {
    // Get the current user
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;
    if (!user) throw new Error("Not authenticated");

    // Verify user is an admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profileError || !profile || profile.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Fetch total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    
    if (usersError) throw usersError;

    // Fetch total agents count
    const { count: totalAgents, error: agentsError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "agent");
    
    if (agentsError) throw agentsError;

    // Fetch total customers count
    const { count: totalCustomers, error: customersError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer");
    
    if (customersError) throw customersError;

    // Fetch monthly appraisals count
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const { count: monthlyAppraisals, error: appraisalsError } = await supabase
      .from("appraisals")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth)
      .lte("created_at", lastDayOfMonth);
    
    if (appraisalsError) throw appraisalsError;

    // System health status (in a real app, this would check actual system status)
    const systemHealth = {
      apiStatus: "Operational",
      database: "Healthy",
      externalApis: "Connected",
      scheduledTasks: "Running"
    };

    // Recent activity (in a real app, this would come from a logs table)
    const recentActivity = [
      {
        type: "user",
        message: "New agent registered",
        timestamp: new Date().toISOString()
      },
      {
        type: "system",
        message: "System backup completed",
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        type: "warning",
        message: "API rate limit reached",
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];

    return {
      totalUsers: totalUsers || 0,
      totalAgents: totalAgents || 0,
      totalCustomers: totalCustomers || 0,
      monthlyAppraisals: monthlyAppraisals || 0,
      systemHealth,
      recentActivity
    };
  } catch (error) {
    console.error("Error fetching admin dashboard metrics:", error);
    toast({
      title: "Error fetching dashboard data",
      description: "An error occurred while fetching the admin dashboard metrics.",
      variant: "destructive"
    });
    throw error;
  }
} 