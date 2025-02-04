import { X, Phone, FileSearch, Calculator } from "lucide-react";
import React, { useState } from "react";
import { useParams } from "next/navigation";

function AccountInfo({ isOpen, onClose, config, user, userIsAdmin }) {

    const params = useParams();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-3 sm:p-6 w-[90%] max-w-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 sm:mb-6 relative">
                    <div className="border-b w-full pb-1 sm:pb-2">
                        <h2 className="text-lg sm:text-2xl text-gray-800 font-bold">Account Info</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors absolute top-0 right-0"
                    >
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* User Details Section */}
                <div className="space-y-4 sm:space-y-6">
                    {/* User Info Card */}
                    <div className="border p-3 sm:p-4">
                        <p className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">User Details</p>
                        <div className="w-full flex flex-wrap items-center gap-3 sm:gap-4">
                            {/* User Image */}
                            <div className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] flex-shrink-0 flex items-center justify-center">
                                <div
                                    className={`size-8 size-20 rounded-full w-[70px] h-[70px] text-[25px] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                                        }`}
                                >
                                    {user?.name?.charAt(0) || "U"}
                                </div>
                            </div>

                            {/* User Details */}
                            <div className="flex-1 space-y-2">
                                {/* Name */}
                                <div className="flex items-center">
                                    <p className="text-sm text-gray-500 w-20">Name:</p>
                                    <h2 className="text-md sm:text-lg font-semibold text-gray-700">{user?.name}</h2>
                                </div>

                                {/* Email */}
                                <div className="flex items-center">
                                    <p className="text-sm text-gray-500 w-20">Email:</p>
                                    <p className="text-xs sm:text-sm text-gray-700">{user?.email}</p>
                                </div>

                                {/* Role */}
                                <div className="flex items-center">
                                    <p className="text-sm text-gray-500 w-20">Role:</p>
                                    <p className="text-xs sm:text-sm text-gray-700">{user?.role}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="border p-3 sm:p-4">
                        <p className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Company Details</p>
                        <div className="w-full flex flex-wrap items-center gap-3 sm:gap-4">
                            {/* User Image */}
                            <div className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] border flex-shrink-0 bg-gray-200">
                                {user?.company?.logo || config?.logo ? (
                                    <img
                                        src={
                                            user?.company?.logo
                                                ? user.company.logo.replace("/api/upload", "/uploads")
                                                : config?.logo
                                        }
                                        alt={params.portalid}
                                        className="h-full mr-2"
                                    />
                                ) : (
                                    // Skeleton for logo
                                    <div className="h-full w-full mr-2 bg-gray-300 animate-pulse rounded" />
                                )}
                            </div>

                            {/* User Details */}
                            <div className="flex-1">
                                <p className="text-sm sm:text-md text-gray-500">Company Name:</p>
                                <h2 className="text-md sm:text-lg font-semibold text-gray-700">{user?.company?.name}</h2>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row justify-start space-y-2 sm:space-y-0 sm:space-x-4">
                        <button
                            type="button"
                            className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Change Password
                        </button>
                        <button
                            type="button"
                            className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Forget Password
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}

export default AccountInfo;