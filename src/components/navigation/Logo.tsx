
import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  variant = "full" 
}) => {
  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        {variant === "full" && (
          <span className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            AppraisalHub
          </span>
        )}
      </div>
    </Link>
  );
};
