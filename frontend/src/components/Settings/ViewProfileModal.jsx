"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { UserRole } from "@/config/constants";
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
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactSelect from "react-select";
import { getReactSelectStyles } from "../Common/reactSelectStyles";

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
  const [fieldErrors, setFieldErrors] = useState({});

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
  const logoInputRef = useRef(null);
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
    setFieldErrors({});
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

    if (fieldErrors[key]) {
      const isFilled =
        typeof val === "string" ? val.trim() !== "" : Boolean(val);
      if (isFilled) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }
  };

  const handleRequiredBlur = (fieldName, value) => {
    const empty =
      value == null || (typeof value === "string" && value.trim() === "");
    setFieldErrors((prev) => {
      if (empty) return { ...prev, [fieldName]: true };
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
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
      } else if (formData.logo === null && initialFormData.logo) {
        logoUrl = "";
      } else if (typeof formData.logo === "string") {
        logoUrl = formData.logo;
      }

      const requestData = {
        ...formData,
        portalId: params?.portalid,
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
      toast.error("Failed to update profile: " + error.message);
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

  const handleRemoveLogo = () => {
    handleFormChange("logo", null);
    setPreviewUrl(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
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

  const isRoleDisabled = loggedInUser?.id === user?.id;
  const isNdaDisabled = loggedInUser?.id === user?.id || isNdaPagesLoading;
  const enabledFieldClassName = "h-10 !bg-background text-foreground";
  const readOnlyFieldClassName =
    "h-10 cursor-not-allowed !bg-muted !text-muted-foreground border-border disabled:pointer-events-auto disabled:opacity-100";
  const roleOptions = [
    { value: UserRole.USER, label: "User" },
    { value: UserRole.ADMIN, label: "Admin" },
    { value: UserRole.MODERATOR, label: "Moderator" },
  ];
  const ndaOptions = [
    { value: "none", label: "No NDA" },
    ...(ndaPages || []),
  ];
  const selectedRole =
    roleOptions.find((option) => option.value === formData.role) || null;
  const selectedNda =
    ndaOptions.find(
      (option) => option.value === (formData.ndaPages ?? "none")
    ) || null;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEnteredEmail("");
            setError("");
            handleModelClose();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-popover p-4">
            <DialogTitle className="text-xl font-medium text-foreground">
              Profile
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEnteredEmail("");
                setError("");
                handleModelClose();
              }}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="hidden-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="space-y-4 p-4 lg:p-6">
              <div className="flex w-full gap-4">
                <div className="w-1/2 space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    className={cn(
                      enabledFieldClassName,
                      fieldErrors.firstName && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                    )}
                    value={formData.firstName}
                    onChange={(e) => handleFormChange("firstName", e.target.value)}
                    onBlur={(e) => handleRequiredBlur("firstName", e.target.value)}
                  />
                </div>
                <div className="w-1/2 space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    className={cn(
                      enabledFieldClassName,
                      fieldErrors.lastName && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                    )}
                    value={formData.lastName}
                    onChange={(e) => handleFormChange("lastName", e.target.value)}
                    onBlur={(e) => handleRequiredBlur("lastName", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground">
                  <Mail className="h-4 w-4" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  required
                  disabled
                  className={cn(readOnlyFieldClassName)}
                  value={user?.email}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone No
                </Label>
                <Input
                  type="text"
                  className={cn(enabledFieldClassName, phoneError && "border-destructive")}
                  value={formData.phoneNo ?? ""}
                  onChange={handlePhoneChange}
                />
              </div>
              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  className={cn(
                    enabledFieldClassName,
                    fieldErrors.title && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                  )}
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  onBlur={(e) => handleRequiredBlur("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  className={cn(
                    enabledFieldClassName,
                    fieldErrors.companyName && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                  )}
                  value={formData.companyName}
                  onChange={(e) => handleFormChange("companyName", e.target.value)}
                  onBlur={(e) => handleRequiredBlur("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground">
                  <UserPlus className="h-4 w-4" />
                  Role <span className="text-destructive">*</span>
                </Label>
                <div className={cn("w-full", isRoleDisabled && "cursor-not-allowed")}>
                  <ReactSelect
                    className="w-full"
                    classNamePrefix="user-role-select"
                    styles={getReactSelectStyles({
                      isInvalid: !!fieldErrors.role,
                      isDisabled: isRoleDisabled,
                    })}
                    isSearchable
                    isDisabled={isRoleDisabled}
                    value={selectedRole}
                    onChange={(option) => {
                      handleFormChange("role", option?.value || "");
                      if (option?.value) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.role;
                          return next;
                        });
                      }
                    }}
                    onBlur={() => {
                      if (!isRoleDisabled) {
                        handleRequiredBlur("role", formData.role);
                      }
                    }}
                    options={roleOptions}
                    placeholder="Select role..."
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground">
                  <Briefcase className="h-4 w-4" />
                  NDA Pages
                </Label>
                <div className={cn("w-full", isNdaDisabled && "cursor-not-allowed")}>
                  <ReactSelect
                    className="w-full"
                    classNamePrefix="user-nda-select"
                    styles={getReactSelectStyles({ isDisabled: isNdaDisabled })}
                    isSearchable
                    isClearable
                    isDisabled={isNdaDisabled}
                    isLoading={isNdaPagesLoading}
                    value={selectedNda}
                    onChange={(option) =>
                      handleFormChange(
                        "ndaPages",
                        !option || option.value === "none" ? null : option.value
                      )
                    }
                    options={ndaOptions}
                    placeholder={
                      isNdaPagesLoading
                        ? "Fetching NDA pages..."
                        : "Select NDA pages..."
                    }
                    loadingMessage={() => "Fetching NDA pages..."}
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Company Logo
                </Label>
                {previewUrl ? (
                  <div className="relative mt-2 w-fit overflow-hidden bg-muted/20">
                    <div className="flex h-32 items-center justify-center overflow-hidden p-2">
                      <img
                        src={previewUrl}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      title="Remove logo"
                      aria-label="Remove logo"
                      className="absolute right-1 top-1 z-10 flex size-7 items-center justify-center rounded-full border-2 border-background bg-card text-secondary-foreground shadow-md transition-colors hover:bg-secondary-foreground/90 hover:text-secondary"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center space-x-4">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground hover:file:bg-accent/70"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-popover p-4">
            <Button
              variant="destructive"
              className="px-3 py-3"
              onClick={() => {
                setIsDeleteModalOpen(user);
                setEnteredEmail("");
                setError("");
              }}
              disabled={loggedInUser?.id === user?.id || isLoading}
            >
              {isDeleteLoading && <LoaderSpinner size={16} className="text-current" />}
              Delete Account
            </Button>
            <Button
              className="px-3 py-3"
              onClick={handelUpdateProfile}
              disabled={isLoading || !isFormChanged() || !isFormValid() || isDeleteLoading}
            >
              {isLoading && <LoaderSpinner size={16} className="text-current" />}
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {user && isDeleteModalOpen?.id === user?.id && (
        <Dialog
          open={isDeleteModalOpen?.id === user?.id}
          onOpenChange={(open) => {
            if (!open) setIsDeleteModalOpen(null);
          }}
        >
          <DialogContent showCloseButton={false} className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] p-6 sm:w-full sm:max-w-sm">
            <div className="mb-4 flex items-center justify-between">
              <DialogTitle className="text-xl font-medium text-foreground">
                Delete User Account
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsDeleteModalOpen(null)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="py-4 text-center text-foreground">
              <p className="font-bold">{`${isDeleteModalOpen?.firstName || ""} ${isDeleteModalOpen?.lastName || ""}`.trim()}</p>
              <p className="text-muted-foreground">{isDeleteModalOpen?.email}</p>
              <div className="space-y-2 border-t border-border p-5 text-foreground">
                <p className="text-sm">
                  This action CANNOT be undone. This will delete the account
                  permanently
                </p>
                <p className="text-sm font-semibold tracking-tight">
                  Please type in the email of the user account to confirm
                </p>
                <Input
                  type="text"
                  id="email"
                  value={enteredEmail}
                  onChange={(e) => setEnteredEmail(e.target.value)}
                  placeholder="Enter Email Address"
                  className="h-10 border-destructive/40 !bg-background focus-visible:ring-destructive/30"
                />
                {error && (
                  <Alert variant="destructive" className="border-destructive/30 text-left">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  className="px-3 py-3"
                  onClick={() => setIsDeleteModalOpen(null)}
                  disabled={isLoading}
                >
                  Close
                </Button>

                <Button
                  variant="destructive"
                  className="px-3 py-3"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isDeleteLoading && <LoaderSpinner size={16} className="text-current" />}
                  Delete This Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default ViewProfileModal;
