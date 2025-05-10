
import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/navigation/Header";

export const RootLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header showLogo={true} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
