"use client";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { setUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { setCurrentUser } from "@/store/services/userService";
import { useDispatch } from "react-redux";
import { UserRole } from "@/config/constants";

function TNCModal({ onClose, user, email, password, page }) {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const dispatch = useDispatch()

  const handleClose = async () => {
    try {
      setIsLoading(true);
      if (!user || !user?.id) {
        return;
      }
      const response = await fetchWrapper(
        `/api/users/tncAccept`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user?.id,
          }),
        },
        "update-user"
      );
      if (!response.ok) {
        throw new Error("Failed to update user");
      }
      const updatedData = await response.json();
      console.log("Update updatedData", updatedData);
      // const loginResponse = await fetchWrapper(
      //   "/api/auth/login",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       email,
      //       password,
      //       portalid: params.portalid,
      //     }),
      //   },
      //   "default-login"
      // );

      // if (!loginResponse.ok) {
      //   const data = await loginResponse.json();
      //   throw new Error(data.error || "Login failed");
      // }

      // const data = await loginResponse.json();
      // // Store user data using auth utility
      // const userData = data.user;
      // // setUserData(userData);
      // dispatch(setCurrentUser(userData))
      // // localStorage.setItem("portal", params.portalid);
      // localStorage.setItem("accessToken", data.accessToken);

      // console.log("Redirecting to home");

      if (user.isOnboardingRequired) {
        router.push(`onboarding`);
      } else {
        const targetRoute =
          user?.role === UserRole.MODERATOR
            ? "advisor/dashboard"
            : "dashboard";
        router.push(targetRoute);
        toast.success("Redirecting to dashboard");
      }
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  if (!user || !page || user?.isTNCAccepted) {
    return;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-50 text-gray-800 w-full max-w-7xl py-5 flex relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="w-full h-full flex flex-col p-4">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold px-5 mb-5">
              Terms and Conditions
            </h2>
            {!user && !user?.id && !page && !page?.description && (
              <div className="flex justify-center py-8 h-full w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {user && user?.id && page && page?.description && (
              <div className="px-5">
                <div
                  className="w-full h-full px-5 pt-5 editor overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html: page.description,
                  }}
                  suppressHydrationWarning={true}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm px-6 mb-3 mt-2">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer"
              checked={isAccepted}
              onChange={(e) => setIsAccepted(e.target.checked)}
            />
            <p>
              By ticking, you are confirming that you have read, understood and
              agree to terms and conditions.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 px-5">
            <button
              type="button"
              className="inline-flex items-center px-10 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 border border-gray-400 bg-gray-100 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Exit
            </button>
            <button
              type="button"
              disabled={!isAccepted || isLoading}
              className="inline-flex items-center px-10 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
            >
              {isLoading ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="spinner"></div>
                    Agree
                  </div>
                </>
              ) : (
                "Agree"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TNCModal;
