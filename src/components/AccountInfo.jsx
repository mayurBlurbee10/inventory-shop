import { X, Phone, FileSearch, Calculator, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { signOut } from "next-auth/react";
import { clearUserData } from "@/app/lib/auth";
import Button from "./Common/Elements/Button";
import AddUserModal from "./Settings/AddUserModal";

function AccountInfo({ isOpen, onClose, config, user, userIsAdmin }) {
  const params = useParams();
  const router = useRouter();
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [editProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    clearUserData();
    await signOut();
    // router.push("login");
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    } else if (!password) {
      setError("Please enter the password");
      return;
    }

    try {
      setLoading(true);
      const response = await fetchWrapper(
        "/api/users/updatePassword",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portalid: params.portalid || "root",
            email: user?.email,
            newPassword: password,
            oldPassword: oldPassword,
          }),
        },
        "update-password"
      );

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push(`/${params.portalid}/login`), 2000);
      } else {
        setError(data.error || "Failed to set password.");
        throw new Error(data.error || "Failed to set password.");
      }
      toast.success("Password set successfully");
    } catch (err) {
      toast.error(err.message);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-[90%] max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 relative border-b">
          <div className="w-full">
            <h2 className="text-lg sm:text-2xl text-gray-800 font-bold">
              Account Info
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:bg-gray-100 transition-colors p-1 rounded-full"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* User Details Section */}
        <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-h-[80vh] overflow-auto" >
          {/* User Info Card */}
          <div className="border p-3 sm:p-4">
            <p className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              User Details
            </p>
            <div className="w-full flex flex-wrap items-center gap-3 sm:gap-4">
              {/* User Image */}
              <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] flex-shrink-0 flex items-center justify-center">
                <div
                  className={`size-20 rounded-full w-[70px] h-[70px] text-[25px] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 
                    }`}
                  style={{ backgroundColor: config.secondaryColor, color: config.primaryColor }}
                >
                  {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>
              {/* User Details */}
              <div className="flex-1 space-y-2">
                {/* First Name */}
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 w-20">First Name:</p>
                  <h2 className="text-md sm:text-lg font-semibold text-gray-700">
                    {user?.firstName}
                  </h2>
                </div>
                {/* Last Name */}
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 w-20">Last Name:</p>
                  <h2 className="text-md sm:text-lg font-semibold text-gray-700">
                    {user?.lastName}
                  </h2>
                </div>
                {/* Email */}
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 w-20">Email:</p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    {user?.email}
                  </p>
                </div>
                {/* Role */}
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 w-20">Role:</p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    {user?.role}
                  </p>
                </div>
                {/* PhoneNo */}
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 w-20">Phone No:</p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    {user?.phoneNo}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="border p-3 sm:p-4">
            <p className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Company Details
            </p>
            <div className="w-full flex flex-wrap items-center gap-3 sm:gap-4">
              {/* User Image */}
              <div className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] border flex-shrink-0">
                {user?.company?.logo || config?.logo ? (
                  <img
                    src={
                      typeof user?.logo === "string" && user.logo
                        ? user.logo
                        : typeof user?.company?.logo === "string" && user.company.logo
                          ? user.company.logo.replace("/api/upload", "/uploads")
                          : config?.logo
                    }

                    alt={params.portalid}
                    className="h-full object-contain"
                  />
                ) : (
                  // Skeleton for logo
                  <div className="h-full w-full mr-2 bg-gray-300 animate-pulse rounded" />
                )}
              </div>
              {/* User Details */}
              <div className="flex-1">
                <p className="text-sm sm:text-md text-gray-500">
                  Company Name:
                </p>
                <h2 className="text-md sm:text-lg font-semibold text-gray-700">
                  {user?.company?.name}
                </h2>
              </div>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-start space-y-2 sm:space-y-0 sm:space-x-4">
            {/* <button
              type="button"
              onClick={() => setIsChangePassModalOpen((prev) => !prev)}
              className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Change Password
            </button> */}
            <Button
              onClick={() => setIsChangePassModalOpen((prev) => !prev)}
              type="Secondary"
              label="Change Password"
            />
            <Button
              onClick={() => setIsEditProfileModalOpen((prev) => !prev)}
              type="Secondary"
              label="Edit Profile"
            />
            {/* <button
                            type="button"
                            className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Forget Password
                        </button> */}
          </div>
        </div>
      </div>
      {isChangePassModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg  w-[350px] max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b text-gray-900">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <button
                onClick={() => setIsChangePassModalOpen(false)}
                className="text-gray-600 hover:bg-gray-100 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="text-gray-700 p-3 sm:p-6" onSubmit={handleSetPassword}>
              {success ? (
                <p className="text-green-500 text-center mb-4">
                  Password set successfully! Redirecting to login...
                </p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="Enter password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute top-[58%] right-4 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Eye /> : <EyeOff />}
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-700"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-center text-sm">{error}</p>
                  )}

                  <div className="w-full flex justify-center mt-2">
                    {/* <button
                    type="submit"
                    className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400"
                    disabled={loading}
                  >
                    {loading ? "Setting..." : "Set Password"}
                  </button> */}
                    <Button
                      buttonType="submit"
                      disabled={loading}
                      isLoading={loading}
                      type="Primary"
                      label="Set Password"
                    />
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      {
        editProfileModalOpen && (
          <AddUserModal
            user={user}
            isOpen={editProfileModalOpen}
            onClose={() => setIsEditProfileModalOpen(false)}
            from='editProfile'
          />
        )
      }
    </div>
  );
}

export default AccountInfo;
