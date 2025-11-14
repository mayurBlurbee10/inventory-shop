"use client";

import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Loader } from "lucide-react";

const Button = ({
  label,
  type,
  onClick,
  isLoading,
  disabled,
  icon: Icon,
  buttonType = "button",
  className = "",
}) => {
  const pathname = usePathname();
  const isAdminPanel = pathname.includes("/admin");
  const { data: config } = useSelector((state) => state.portal);

  const primaryColor = config?.primaryColor || "#1f2937"; // gray-800 fallback
  const secondaryColor = config?.secondaryColor || "#ffffff";
  const hoverColor = config?.accentColor || "#e5e7eb"; // gray-200 fallback

  const [hovered, setHovered] = useState(false);

  const getButtonStyle = () => {
    if (type === "Primary" && !isAdminPanel) {
      return {
        backgroundColor: hovered ? hoverColor : primaryColor,
        color: hovered ? primaryColor : secondaryColor,
        transition: "background-color 300ms ease, color 300ms ease",
      };
    }

    if (type === "Login" && !isAdminPanel) {
      return {
        backgroundColor: primaryColor,
        color: secondaryColor,
      };
    }

    if (type === "Connect") {
      return {
        color: "#1f2937",
        backgroundColor: "#ffffff",
      };
    }

    return {};
  };

  const baseStyles = `flex items-center justify-center gap-2 font-lato ${
    type === "Login" ? "" : "border border-gray px-4 py-2 rounded-lg"
  }`;

  const typeOfButton = {
    Primary: isAdminPanel ? "text-white bg-[#0061D5] hover:bg-blue-500" : "",
    Secondary: `text-gray-500 ${disabled ? "" : `hover:bg-gray-50`}`,
    Delete: `text-white bg-[#e63434e8] border-0 ${
      disabled ? "" : "hover:bg-[#bd2626]"
    }`,
    Connect:
      "bg-gradient-to-r border px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex-shrink-0",
    "Connect-Secondary": `text-gray-500 ${disabled ? "" : `hover:bg-gray-50`}`,

    Login: isAdminPanel
      ? "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0061D5] hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      : "w-full text-white py-3 border-[#808080] p-3.5 h-16 overflow-hidden rounded-b-md border uppercase text-sm group mt-1",
  };

  return (
    <button
      type={buttonType}
      className={`${className} ${baseStyles} ${typeOfButton[type]} ${
        isLoading ? "cursor-not-allowed" : ""
      } ${disabled || isLoading ? "cursor-not-allowed opacity-50" : ""}`}
      onClick={onClick}
      style={getButtonStyle()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader
          className="w-5 h-5 animate-spin"
          style={{ color: type === "Connect" ? "#1f2937" : secondaryColor }}
        />
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </>
      )}
    </button>
  );
};

export default Button;