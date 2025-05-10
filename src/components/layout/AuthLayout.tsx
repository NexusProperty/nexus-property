
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Header } from "@/components/navigation/Header";

// Mock auth state for now
const mockUser = {
  name: "Guest User",
  email: "guest@example.com",
  role: "guest" as const,
};

export const AuthLayout: React.FC = () => {
  // This would be replaced with actual authentication check
  const isAuthenticated = false;
  
  // In a real implementation, redirect unauthenticated users
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    console.log("Logging out");
    // In a real implementation, this would handle the logout process
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={mockUser} onLogout={handleLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
