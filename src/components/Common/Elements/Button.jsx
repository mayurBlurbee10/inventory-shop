import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";

const Button = ({
    label,
    type,
    onClick,
    isLoading,
    disabled,
    icon: Icon,
    buttonType = "button",
    className="",
    iconClassName=""
}) => {
    const pathname = usePathname();
    const isAdminPanel = pathname.includes("admin");
    const { data: config } = useSelector((state) => state.portal);

    const getButtonStyle = (type) => {
        if ((type === "Primary" || (type === "Login" && !isAdminPanel)) && config?.secondaryColor) {
          return { backgroundColor: config.secondaryColor };
        }
        return {}; 
      };

    const baseStyles = `flex items-center justify-center gap-2 font-lato ${type==="Login" ? "" : "border border-gray px-4 py-2 rounded-lg"}`;
    const typeOfButton = {
        Primary: `text-white ${isAdminPanel? " bg-[#0061D5]" : " bg-[#0061D5]"} ${disabled ? "" : `${isAdminPanel ? "hover:bg-blue-500" : "hover:bg-blue-500"}`}`,
        Secondary: `text-gray-500  ${disabled ? "" : "hover:bg-gray-100 "}`,
        Delete: `text-white bg-[#e63434e8] border-0 ${disabled ? "" : "hover:bg-[#bd2626] "}`,
        Login: isAdminPanel 
        ? "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0061D5] hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
        : `w-full text-white py-3 border-[#808080] bg-[#0061D5] p-3.5 h-16 overflow-hidden rounded-b-md border uppercase text-sm group mt-1`
    };

    return (
        <button
            type={buttonType}
            className={`${className} ${baseStyles} ${typeOfButton[type]} ${isLoading ? "cursor-not-allowed" : ""} ${disabled || isLoading ? "cursor-not-allowed opacity-50" : ""}`}
            onClick={onClick}
            style={getButtonStyle(type)}
            disabled={disabled || isLoading}
        >
            {Icon && <Icon className={`w-4 h-4 ${iconClassName}`} />}
            {label}
            {isLoading && <div className="spinner"></div>}
        </button>
    );
};

export default Button;
