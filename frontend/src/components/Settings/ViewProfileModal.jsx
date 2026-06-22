"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { UserRole } from "@/config/constants";
import { Dialog, DialogBackdrop } from "@headlessui/react";
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Image,
  Building,
  UserPlus,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../Common/Elements/Button";
import Select from "react-select";

const customStyles = {
    menu: (provided) => ({
      ...provided,
      zIndex: 1000,
    }),
    menuList: (provided) => ({
      ...provided,
      zIndex: 1000,
      maxHeight: "150px",
      overflowY: "auto",
    }),
  };

const filterRole = (user, portalId) => {
  const permission = user?.permissions?.find(
    (item) => item.portalId === portalId,
  );
  if (!permission) {
    const superadminpermission = user?.permissions?.find(
      (item) => item.role === UserRole?.SUPER_ADMIN,
    );
    if (superadminpermission) {
      return superadminpermission?.role;
    }
  }
  return permission?.role;
};

function ViewProfileModal({
  isOpen,
  handleClose,
  user,
  setUser,
  setOnDeleteUser,
  onSumbit,
}) {
  const router = useRouter();
  const params = useParams();
  const [enteredEmail, setEnteredEmail] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isLoadingRoleChange, setIsLoadingRoleChange] = useState(false);
  const [ndaPages, setNdaPages] = useState(null);
  const [isNdaPagesLoading, setIsNdaPagesLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [role, setRole] = useState(filterRole(user, params?.portalid));
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
    title: "",
    companyName: "",
    role: UserRole.USER,
    logo: null,
    ndaPages: null,
  });
  const [initialFormData, setInitialFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
    title: "",
    companyName: "",
    role: UserRole.USER,
    logo: null,
    ndaPages: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const handleModelClose = () => {
    handleClose();
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      companyName: "",
      role: UserRole.USER,
      logo: null,
      ndaPages: null,
    });
    setInitialFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      companyName: "",
      role: UserRole.USER,
      logo: null,
      ndaPages: null,
    });
    setPreviewUrl(null);
    setError("");
    setPhoneError("");
  };
  const isFormChanged = () => {
    const keys = Object.keys(formData);
    return keys.some((key) => {
      if (formData[key] instanceof File) return true; // logo changed
      return formData[key] !== initialFormData[key];
    });
  };

  const isFormValid = () => {
    // Check all required fields are filled
    return (
      formData.firstName &&
      formData.firstName.trim() !== "" &&
      formData.lastName &&
      formData.lastName.trim() !== "" &&
      formData.email &&
      formData.email.trim() !== "" &&
      formData.title &&
      formData.title.trim() !== "" &&
      formData.companyName &&
      formData.companyName.trim() !== "" &&
      formData.role
    );
  };

  useEffect(() => {
    setFormData({
      id: user?.id || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNo: user?.phoneNo || "",
      title: user?.title || "",
      companyName: user?.company?.name || "",
      role: user?.role || UserRole.USER,
      logo: user?.company?.logo || null,
      ndaPages: user?.ndaPages || null,
    });
    setInitialFormData({
      id: user?.id || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNo: user?.phoneNo || "",
      title: user?.title || "",
      companyName: user?.company?.name || "",
      role: user?.role || UserRole.USER,
      logo: user?.company?.logo || null,
      ndaPages: user?.ndaPages || null,
    });
    setPreviewUrl(user?.company?.logo || "");
  }, [isOpen, user]);

  const handleFormChange = (key, val) => {
    if (!key) return;

    setFormData({
      ...formData,
      [key]: val,
    });
  };

  const handelUpdateProfile = async () => {
    try {
      setIsLoading(true);
      let logoUrl = user.company?.logo || "";
      if (formData.logo instanceof File) {
        const uploadData = new FormData();
        uploadData.append("file", formData.logo);

        const uploadResponse = await fetchWrapper(
          "/api/upload",
          {
            method: "POST",
            body: uploadData,
          },
          "user-logo",
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url;
      }

      const requestData = {
        ...formData,
        company: {
          name: formData.companyName,
          logo: logoUrl,
        },
        ndaPages: formData.ndaPages,
      };
      delete requestData.companyName;
      delete requestData.logo;

      const requestOptions = {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      };
      const response = await fetchWrapper(
        "/api/users",
        requestOptions,
        "update-user",
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Something went wrong");
      }
      const updatedUserData = {
        ...user,
        ...formData,
        company: {
          ...user.company,
          name: formData.companyName,
          logo: logoUrl,
          ndaPages: formData.ndaPages,
        },
      };

      delete updatedUserData.companyName;
      delete updatedUserData.logo;

      toast.success("Profile updated successfully");
      if (typeof onSumbit === "function") {
        await Promise.resolve(onSumbit());
      }
      handleModelClose();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update profile: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNdaPages = async () => {
    try {
      setIsNdaPagesLoading(true);
      const url = `/api/nda-agreements?portalId=${params.portalid || "root"}`;
      const response = await fetchWrapper(url, {}, "fetch-nda-pages");
      if (!response.ok) {
        throw new Error("Failed to fetch NDA pages");
      }
      const data = await response.json();
      const transformedPages = (data?.data || []).map((page) => ({
        value: page.id,
        label: page.title,
      }));

      setNdaPages(transformedPages);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsNdaPagesLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (enteredEmail !== isDeleteModalOpen?.email) {
      setError("Email address doesn't match");
      return;
    }

    try {
      setIsDeleteLoading(true);

      const deleteUserAccount = async () => {
        const response = await fetchWrapper(
          "/api/users",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: isDeleteModalOpen?.id,
              portalId: params?.portalid,
            }),
          },
          "delete-user",
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
        handleModelClose();
      }, 2000);
      toast.success("User account deleted successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting user account:", error);
      setError("Failed to delete user account. Please try again.");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  console.log(role);

  useEffect(() => {
    if (user) {
      setRole(filterRole(user, params?.portalid));
    }
    fetchNdaPages();
  }, [user]);

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }
    setLoggedInUser(userData);
    if (user) {
      setRole(filterRole(user, params?.portalid));
    }
  }, []);

  if (!user || !user.role) return;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFormChange("logo", file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validateOnlyDigits = (value) => {
    return /^\d*$/.test(value); // Allows only digits and empty string
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;

    if (validateOnlyDigits(phone)) {
      handleFormChange("phoneNo", phone);
      setPhoneError(phone.length > 0 ? "" : null); // Clear error if valid or empty
    } else {
      setPhoneError("Only digits are allowed");
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={() => {
          setEnteredEmail("");
          setError("");
          handleModelClose();
        }}
        className="relative z-50 "
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30 overflow-y-hidden" />
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="mx-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto hidden-scrollbar rounded-xl bg-white shadow-xl">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
              <Dialog.Title className="text-xl text-gray-600 font-medium">
                Profile
              </Dialog.Title>
              <button
                onClick={() => {
                  setEnteredEmail("");
                  setError("");
                  handleModelClose();
                }}
                className="text-gray-900 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-4 p-4 lg:p-6`}>
              <div className="flex gap-4 w-full">
                <div className="w-1/2">
                  <label className="flex items-center gap-2 block text-sm font-medium text-gray-700">
                    <User className="h-4 w-4" />
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange("firstName", e.target.value)}
                  />
                </div>
                <div className="w-1/2">
                  <label className="flex items-center gap-2 block text-sm font-medium text-gray-700">
                    <User className="h-4 w-4" />
                    Last Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange("lastName", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 block text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4" />
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={true}
                  className={`mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed`}
                  value={user?.email}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 block text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4" />
                  Phone No
                </label>
                <input
                  type="text"
                  // maxLength={16}
                  className={`mt-1 pl-2 block w-full text-gray-500 rounded-md border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500 border-gray-30`}
                  value={formData.phoneNo ?? ""}
                  onChange={handlePhoneChange}
                />
              </div>
              {phoneError && (
                <p className="text-red-500 text-sm mt-1">{phoneError}</p>
              )}
              <div>
                <label className="flex items-center gap-2 block text-sm font-medium text-gray-700">
                  <Briefcase className="h-4 w-4" />
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 block text-sm font-medium text-gray-700">
                  <Building className="h-4 w-4" />
                  Company Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
                  value={formData.companyName}
                  onChange={(e) =>
                    handleFormChange("companyName", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="flex items-center gap-2 block text-sm font-medium text-gray-700">
                  <UserPlus className="h-4 w-4" />
                  Role <span className="text-red-600">*</span>
                </label>
                <select
                  className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                  value={formData.role}
                  onChange={(e) => handleFormChange("role", e.target.value)}
                  style={{ height: "2.5rem" }}
                  disabled={loggedInUser?.id === user?.id}
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.MODERATOR}>Moderator</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Briefcase className="h-4 w-4" />
                  NDA Pages
                </label>
                <Select
                  className="flex-1 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  classNamePrefix="Choose NDA pages"
                  isClearable={true}
                  isSearchable={true}
                  value={
                    formData.ndaPages
                      ? ndaPages?.find(
                          (page) => page.value === formData.ndaPages,
                        )
                      : null
                  }
                  onChange={(e) => {
                    handleFormChange("ndaPages", e ? e.value : null);
                  }}
                  options={ndaPages || []}
                  isLoading={isNdaPagesLoading}
                  loadingMessage={() => "Fetching NDA pages..."}
                  placeholder="Select NDA pages..."
                  isDisabled={loggedInUser?.id === user?.id}
                  styles={customStyles}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 block text-sm font-medium text-gray-700">
                  <Image className="h-4 w-4" />
                  Company Logo
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {previewUrl && (
                  <div className="mt-2">
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="h-20 w-20 object-contain rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
              <div className="flex flex-wrap justify-end gap-2 sticky bottom-0 bg-white border-t p-4">
                  <Button
                    onClick={() => {
                      setIsDeleteModalOpen(user);
                      setEnteredEmail("");
                      setError("");
                    }}
                    disabled={loggedInUser?.id === user?.id || isLoading}
                    isLoading={isDeleteLoading}
                    label="Delete Account"
                    type="Delete"
                  />
                  <Button
                    onClick={handelUpdateProfile}
                    disabled={isLoading || !isFormChanged() || !isFormValid() || isDeleteLoading}
                    isLoading={isLoading}
                    type="Primary"
                    label="Update"
                  />
               
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
                <p className="font-bold">{`${isDeleteModalOpen?.firstName || ""} ${isDeleteModalOpen?.lastName || ""}`.trim()}</p>
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
                  <Button
                    onClick={() => setIsDeleteModalOpen(null)}
                    disabled={isLoading}
                    type="Secondary"
                    label="Close"
                  />

                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    isLoading={isDeleteLoading}
                    type="Delete"
                    label="Delete This Account"
                  />
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
