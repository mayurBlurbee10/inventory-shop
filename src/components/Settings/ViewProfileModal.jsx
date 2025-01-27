"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { UserRole } from "@/config/constants";
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
  const [isLoadingRoleChange, setIsLoadingRoleChange] = useState(false);
  const [role, setRole] = useState(
    user?.role === "user" ? UserRole.USER : UserRole.ADMIN
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(null);

  const handleChangeRole = async () => {
    try {
      setIsLoadingRoleChange(true);
      const response = await fetchWrapper(
        "/api/users/role",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: user.id, role: role }),
        },
        "update-user"
      );

      if (!response.ok) {
        console.log("first");
        throw new Error("Failed to change user role");
      }
      toast.success("Role Updated Successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoadingRoleChange(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (enteredEmail !== isDeleteModalOpen?.email) {
      setError("Email address doesn't match");
      return;
    }

    try {
      setIsLoading(true);

      const deleteUserAccount = async () => {
        const response = await fetchWrapper(
          "/api/users",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: isDeleteModalOpen?.id }),
          },
          "delete-user"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to delete user account");
        }
      };

      await deleteUserAccount();

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

  console.log(role);

  useEffect(() => {
    if (user) {
      setRole(user?.role === "user" ? UserRole.USER : UserRole.ADMIN);
    }
  }, [user]);

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }
    setLoggedInUser(userData);
    if (user) {
      setRole(user?.role === "user" ? UserRole.USER : UserRole.ADMIN);
    }
  }, []);

  if (!user || !user.role) return;

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={() => {
          setEnteredEmail("");
          setError("");
          handleClose();
        }}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30 " />
        <div className="fixed inset-0 flex items-center justify-center p-4 ">
          <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white py-4 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b px-8 py-2 min-w-[400px]">
              <Dialog.Title className="text-xl text-gray-600 font-medium">
                Profile
              </Dialog.Title>
              <button
                onClick={() => {
                  setEnteredEmail("");
                  setError("");
                  handleClose();
                }}
                className="text-gray-900 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-gray-700 space-y-2 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center p-5 w-full gap-3">
                <p className="font-bold">{user?.name}</p>
                <p className="">{user?.email}</p>

                <select
                  className="mt-1 block px-2 w-2/3 rounded-md text-gray-700 border-gray-300 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ height: "2.5rem" }}
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    onClick={() => setRole(user?.role)}
                    disabled={loggedInUser?.id === user?.id}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleChangeRole}
                    disabled={loggedInUser?.id === user?.id}
                  >
                    {isLoadingRoleChange ? "Saving" : "Save"}
                  </button>
                </div>
              </div>
              {loggedInUser?.role !== "user" && (
                <>
                  {/* <div className="text-gray-700 p-5 space-y-2 border-t ">
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
                </div> */}

                  <button
                    type="button"
                    className="px-6 py-2.5 text-sm font-medium text-white disabled:bg-red-400 bg-red-500 border border-gray-300 rounded-lg hover:bg-red-400 transition-colors disabled:cursor-not-allowed"
                    onClick={() => {
                      setIsDeleteModalOpen(user);
                      setEnteredEmail("");
                      setError("");
                      handleClose();
                    }}
                    disabled={loggedInUser?.id === user?.id}
                  >
                    {isLoading
                      ? "Deleting This Account"
                      : "Delete This Account"}
                  </button>
                </>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      {user && isDeleteModalOpen?.id === user?.id && (
        <Dialog
          open={isDeleteModalOpen?.id === user?.id}
          onClose={() => {
            setIsDeleteModalOpen(null);
          }}
          className="relative z-50"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/50 " />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-xl text-gray-600 font-medium">
                  Delete User Account
                </Dialog.Title>
                <button
                  onClick={() => setIsDeleteModalOpen(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center text-gray-700 py-4">
                <p className="font-bold">{isDeleteModalOpen?.name}</p>
                <p className="">{isDeleteModalOpen?.email}</p>
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

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2.5 text-sm font-medium text-white disabled:bg-red-400 bg-red-500 border border-gray-300 rounded-lg hover:bg-red-400 transition-colors"
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="spinner"></div> Deleting This Account
                      </div>
                    ) : (
                      "Delete This Account"
                    )}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </>
  );
}

export default ViewProfileModal;
