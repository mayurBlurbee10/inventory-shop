"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { Dialog, DialogBackdrop } from "@headlessui/react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function ViewProfileModal({
  isOpen,
  handleClose,
  user,
  setUser,
  setOnDeleteUser,
}) {
  const router = useRouter();
  const [enteredEmail, setEnteredEmail] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (enteredEmail !== user?.email) {
      setError("Email address doesn't match");
      return;
    }

    try {
      setIsLoading(true);

      const deleteUserAccont = async () => {
        const response = await fetchWrapper(
          "/api/users",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: user?.id }),
          },
          "delete-user"
        );

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to delete user account");
        }
      };

      await deleteUserAccont();

      setOnDeleteUser(true);
      setUser(null);
      setEnteredEmail("");
      setError("");

      setTimeout(() => {
        handleClose();
      }, 2000);
      toast.success("User account deleted successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting user account:", error);
      setError("Failed to delete user account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }

    setLoggedInUser(userData);
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        setEnteredEmail("");
        setError("");
        handleClose();
        setUser(null);
      }}
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white py-4 shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b px-8 py-2">
            <Dialog.Title className="text-xl text-gray-600 font-medium">
              Profile
            </Dialog.Title>
            <button
              onClick={() => {
                setEnteredEmail("");
                setError("");
                handleClose();
                setUser(null);
              }}
              className="text-gray-900 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-gray-700 space-y-2 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center p-5 w-full">
              <p className="font-bold">{user?.name}</p>
              <p className="">{user?.email}</p>
            </div>
            {loggedInUser?.role === "admin" && (
              <>
                <div className="text-gray-700 p-5 space-y-2 border-t ">
                  <p className="text-sm">
                    This action CANNOT be undone. This will delete the account
                    permanently
                  </p>
                  <p className="text-sm font-semibold tracking-tight">
                    Please type in the email of the user account to confirm
                  </p>
                  <input
                    type="text"
                    id="email"
                    value={enteredEmail}
                    onChange={(e) => setEnteredEmail(e.target.value)}
                    placeholder="Enter Email Address"
                    className="w-full px-3 py-2 text-gray-700 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                </div>

                <button
                  type="button"
                  className="px-6 py-2.5 text-sm font-medium text-white disabled:bg-red-400 bg-red-500 border border-gray-300 rounded-lg hover:bg-red-400 transition-colors"
                  onClick={handleDeleteAccount}
                  disabled={loggedInUser?.id === user?.id}
                >
                  {isLoading ? "Deleting This Account" : "Delete This Account"}
                </button>
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default ViewProfileModal;
