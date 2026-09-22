"use client"
import React, { useEffect, useRef, useState } from "react";
import { Box, Check, ChevronRight, X, User, Mail, Phone, Briefcase, Image, UserPlus, Building } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { UserRole } from "@/config/constants";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser } from "@/store/services/userService";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactSelect from "react-select";
import { getReactSelectStyles } from "../Common/reactSelectStyles";

const apiPeriodOptions = [
  { value: "100 p/m", label: "Daily" },
  { value: "500 p/m", label: "Weekly" },
  { value: "1000 p/m", label: "Monthly" },
];

const retentionAuditOptions = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
];

const retentionBackupOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const UserDetails = ({ users, isOpen, onClose, onAdd, setActiveStep, formData, setFormData, handleModalClose, from }) => {

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(formData?.logo || "");
  const logoInputRef = useRef(null);
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [ndaPages, setNdaPages] = useState(null);
  const [isNdaPagesLoading, setIsNdaPagesLoading] = useState(false);
  const { data: user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const roleOptions = [
    { value: UserRole.USER, label: "User" },
    { value: UserRole.ADMIN, label: "Admin" },
    { value: UserRole.MODERATOR, label: "Moderator" }
  ];
  const [initialFormData, setInitialFormData] = useState({
    id: user.id || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phoneNo: user.phoneNo || "",
    title: user.title || "",
    companyName: user.company?.name || "",
    role: user.role || UserRole.USER,
    logo: user.company?.logo || null,
  })
  const isFormChanged = () => {
    const keys = Object.keys(formData);
    return keys.some((key) => {
      if (formData[key] instanceof File) return true; // logo changed
      return formData[key] !== initialFormData[key];
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFormChange("logo", file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    handleFormChange("logo", null);
    setPreviewUrl("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

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

  const fetchNdaPages = async () => {
    try {
      setIsNdaPagesLoading(true);
      const url = `/api/nda-agreements?portalId=${params.portalid || "root"}`;
      const response = await fetchWrapper(url, {}, "fetch-nda-agreements");
      if (!response.ok) {
        throw new Error("Failed to fetch NDA pages");
      }
      const data = await response.json();

      // Transform data for select dropdown
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

  useEffect(() => {
    fetchNdaPages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let logoUrl = "";

      // Upload logo if selected
      if (formData.logo) {
        const uploadData = new FormData();
        uploadData.append("file", formData.logo);

        const uploadResponse = await fetchWrapper(
          "/api/upload",
          {
            method: "POST",
            body: uploadData,
          },
          "user-logo"
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url;
      }

      // Create Box user
      const boxResponse = await fetchWrapper(
        "/api/box/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: formData.email,
            externalId: `user_${Date.now()}`,
            portalId: params.portalid,
          }),
        },
        "create-user-box"
      );

      const boxData = await boxResponse.json();

      if (!boxResponse.ok) {
        throw new Error(boxData.error || "Failed to create Box user");
      }

      // Prepare user data for storage
      const user = getUserData();
      const userData = {
        email: formData.email,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        companyName: formData.companyName,
        password: "000",
        role: formData.role,
        logo: logoUrl,
        boxUserId: boxData.user.userId,
        folderId: boxData.user.folderId,
        portal: params.portalid || "root",
        isOnboardingRequired: false,
        createdBy: user.id,
        permissions: {
          portalId: params.portalid || "root",
          role: formData.role,
        },
      };

      // Save user data
      const saveResponse = await fetchWrapper(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
        "save-user"
      );
      const savedData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(savedData.error || "Failed to save user data");
      }

      onAdd(savedData);
      handleModalClose();
      toast.success("User created successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error creating user:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handelNext = async () => {
    try {
      setIsLoading(true);
      setActiveStep("Permissions");
    } catch (error) {
      console.error("Error creating folder files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validation
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError("");
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    handleFormChange("email", email);
    validateEmail(email);
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
          "user-logo"
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
        "Update User"
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }
      const updatedUserData = {
        ...user,
        ...formData,
        company: {
          ...user.company,
          name: formData.companyName,
          logo: logoUrl,
        },
      };
      dispatch(setCurrentUser(updatedUserData));

      // Optionally clean up formData extras
      delete updatedUserData.companyName;
      delete updatedUserData.logo;

      toast.success("Profile updated successfully");
      handleModalClose()
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailDisabled = from === "editProfile";
  const isRoleDisabled = from === "editProfile";
  const isNdaDisabled = from === "editProfile" || isNdaPagesLoading;
  const enabledFieldClassName = "h-10 !bg-background text-foreground";
  const readOnlyFieldClassName =
    "h-10 cursor-not-allowed !bg-muted !text-muted-foreground border-border disabled:pointer-events-auto disabled:opacity-100";
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
    <form onSubmit={handleSubmit} className={cn("flex min-h-0 flex-col space-y-4 overflow-hidden bg-background", from === "editProfile" && "mt-2")}>
      <div className="min-w-0 space-y-4 overflow-x-hidden px-6">
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
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            type="email"
            required
            disabled={isEmailDisabled}
            className={cn(
              isEmailDisabled ? readOnlyFieldClassName : enabledFieldClassName,
              fieldErrors.email && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            )}
            value={formData.email}
            onChange={handleEmailChange}
            onBlur={(e) => {
              if (isEmailDisabled) return;
              const value = e.target.value;
              if (!value?.trim()) {
                handleRequiredBlur("email", value);
                return;
              }
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              setFieldErrors((prev) => {
                if (!emailRegex.test(value.trim())) {
                  return { ...prev, email: true };
                }
                const next = { ...prev };
                delete next.email;
                return next;
              });
            }}
          />
        </div>
        {emailError && <p className="text-sm text-destructive">{emailError}</p>}
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
        {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
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
          <Label className="flex items-center gap-2">
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
          <Label className="flex items-center gap-2">
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
            <div className="relative mt-2 w-fit overflow-hidden rounded-lg border border-border bg-muted/20">
              <div className="flex h-32 items-center justify-center overflow-hidden p-2">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="max-h-full max-w-full object-contain"
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
            <div className="mt-2 flex items-center space-x-4">
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
      <div className="sticky bottom-0 flex justify-end space-x-3 rounded-b-lg border-t border-border bg-background p-4">
        <Button
          type="button"
          variant="outline"
          className="px-3 py-3"
          onClick={handleModalClose}
          disabled={loading}
        >
          Cancel
        </Button>
        {from === "editProfile" ? (
          <Button
            type="button"
            variant="outline"
            className="px-3 py-3"
            onClick={handelUpdateProfile}
            disabled={isLoading || !isFormChanged() || !formData.firstName || !formData.lastName || !formData.email || !formData.title || !formData.companyName || emailError || phoneError}
          >
            {isLoading && <LoaderSpinner size={16} className="text-current" />}
            Update
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handelNext}
            className="px-3 py-3"
            disabled={isLoading || !formData.firstName || !formData.lastName || !formData.email || !formData.title || !formData.companyName || emailError || phoneError}
          >
            {isLoading && <LoaderSpinner size={16} className="text-current" />}
            Next
          </Button>
        )}
      </div>
    </form>
  );
};

const PermissionsModel = ({ onClose, setActiveStep, finalStep, formData, setFormData, onAdd, handleModalClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = useParams();
  const [permissions, setPermissions] = useState({
    billing: false,
    users: false,
    security: false,
    api: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    mfa: true,
    sso: false,
    audit: true,
    ip_restrict: false,
  });

  const [storageLimit, setStorageLimit] = useState(100);
  const [apiLimit, setApiLimit] = useState(100);
  const [apiOption, setApiOption] = useState(100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let logoUrl = "";

      // Upload logo if selected
      if (formData.logo) {
        const uploadData = new FormData();
        uploadData.append("file", formData.logo);

        const uploadResponse = await fetchWrapper(
          "/api/upload",
          {
            method: "POST",
            body: uploadData,
          },
          "user-logo"
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url;
      }

      // Create Box user
      const boxResponse = await fetchWrapper(
        "/api/box/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: formData.email,
            externalId: `user_${Date.now()}`,
            portalId: params.portalid,
          }),
        },
        "create-user-box"
      );

      const boxData = await boxResponse.json();

      if (!boxResponse.ok) {
        throw new Error(boxData.error || "Failed to create Box user");
      }

      // Prepare user data for storage
      const user = getUserData();
      const userData = {
        email: formData.email,
        phoneNo: formData.phoneNo,
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        companyName: formData.companyName,
        password: "000",
        role: formData.role,
        logo: logoUrl,
        boxUserId: boxData.user.userId,
        folderId: boxData.user.folderId,
        portal: params.portalid,
        isOnboardingRequired: false,
        createdBy: user.id,
        permissions: {
          portalId: params.portalid,
          role: formData.role,
        },
        ndaPages: formData.ndaPages,
      };

      // Save user data
      const saveResponse = await fetchWrapper(
        "/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
        "save-user"
      );
      const savedData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(savedData.error || "Failed to save user data");
      }

      onAdd(savedData);
      handleModalClose();
      toast.success("User created successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error creating user:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxClick = (id) => {
    setPermissions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSecurityToggle = (id) => {
    setSecuritySettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6">
      {/* Permissions */}
      <div className="mb-4">
        <Label className="mb-1 block">Additional Permissions</Label>
        <div className="mt-2 space-y-2">
          {[
            { id: "billing", label: "Billing Management" },
            { id: "users", label: "User Management" },
            { id: "security", label: "Security Settings" },
            { id: "api", label: "API Access" },
          ].map(({ id, label }) => (
            <label key={id} className="flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={permissions[id] ?? false}
                onChange={() => handleCheckboxClick(id)}
                className="h-4 w-4 rounded border-input accent-[var(--primary-solid)]"
              />
              <span className="ml-2 text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Box Enterprise Setup */}
      <div className="space-y-6 text-foreground">
        <div className="space-y-4 rounded-lg bg-muted/50 p-4">
          <div className="flex items-start">
            <div className="mt-0.5 flex-shrink-0">
              <Box className="h-5 w-5 text-foreground" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-foreground">
                Box Enterprise Setup
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure storage and user limits for the Box enterprise account
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Storage Limit (GB) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={storageLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setStorageLimit(value);
                  }
                }}
                placeholder="1000"
                className="h-10 !bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>API Limit <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  value={apiLimit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setApiLimit(value);
                    }
                  }}
                  placeholder="100"
                  className="h-10 !bg-background"
                />
                <ReactSelect
                  className="w-full"
                  classNamePrefix="api-period-select"
                  styles={getReactSelectStyles()}
                  isSearchable
                  value={
                    apiPeriodOptions.find(
                      (option) => option.value === formData.retentionApi
                    ) || null
                  }
                  onChange={(option) =>
                    setFormData({
                      ...formData,
                      retentionApi: option?.value || "",
                    })
                  }
                  options={apiPeriodOptions}
                  placeholder="Daily"
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                  menuPosition="fixed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div>
          <Label className="mb-3 block">Security Settings</Label>
          <div className="space-y-3">
            {[
              { id: "mfa", label: "Require Multi-Factor Authentication", default: true },
              { id: "sso", label: "Enable Single Sign-On", default: false },
              { id: "audit", label: "Enable Audit Logging", default: true },
              { id: "ip_restrict", label: "IP Address Restrictions", default: false },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center justify-between border-b border-border py-2">
                <label htmlFor={id} className="text-sm text-foreground">{label}</label>
                <input
                  type="checkbox"
                  id={id}
                  checked={securitySettings[id]}
                  onChange={() => handleSecurityToggle(id)}
                  className="h-4 w-4 cursor-pointer rounded border-input accent-[var(--primary-solid)]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Data Retention */}
        <div>
          <Label className="mb-3 block">Data Retention</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-normal text-muted-foreground">Audit Logs</Label>
              <ReactSelect
                className="w-full"
                classNamePrefix="retention-audit-select"
                styles={getReactSelectStyles()}
                isSearchable
                value={
                  retentionAuditOptions.find(
                    (option) => option.value === formData.retentionAudit
                  ) || null
                }
                onChange={(option) =>
                  setFormData({
                    ...formData,
                    retentionAudit: option?.value || "",
                  })
                }
                options={retentionAuditOptions}
                placeholder="30 days"
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-normal text-muted-foreground">System Backups</Label>
              <ReactSelect
                className="w-full"
                classNamePrefix="retention-backup-select"
                styles={getReactSelectStyles()}
                isSearchable
                value={
                  retentionBackupOptions.find(
                    (option) => option.value === formData.retentionBackup
                  ) || null
                }
                onChange={(option) =>
                  setFormData({
                    ...formData,
                    retentionBackup: option?.value || "",
                  })
                }
                options={retentionBackupOptions}
                placeholder="Daily"
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-3 flex justify-end gap-3">
        <Button variant="outline" onClick={() => setActiveStep("User Details")}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <LoaderSpinner size={16} className="text-current" />}
          Add User
        </Button>
      </div>
    </div>
  )
}

const AddUserModal = ({ users, isOpen, onClose, onAdd, from, user }) => {
  const [activeStep, setActiveStep] = useState("User Details");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    id: from === 'editProfile' ? user.id || "" : "",
    firstName: from === 'editProfile' ? user.firstName || "" : "",
    lastName: from === 'editProfile' ? user.lastName || "" : "",
    email: from === 'editProfile' ? user.email || "" : "",
    phoneNo: from === 'editProfile' ? user.phoneNo || "" : "",
    title: from === 'editProfile' ? user.title || "" : "",
    companyName: from === 'editProfile' ? user.company?.name || "" : "",
    role: from === 'editProfile' ? user.role || UserRole.USER : UserRole.USER,
    logo: from === 'editProfile' ? user.company?.logo || null : null,
    ndaPages: from === "editProfile" ? user.ndaPages || null : null,
  });

  const finalStep = () => {
    dispatch(setNewLoan(newLoanData));
  };

  const handleModalClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      companyName: "",
      role: "user",
      logo: null,
      ndaPages: null,
    });
    setError("");
    onClose();
    setActiveStep("User Details");
  };

  const getActiveStepContent = () => {
    switch (activeStep) {
      case "User Details":
        return (
          <UserDetails
            formData={formData}
            setFormData={setFormData}
            users={users}
            onAdd={onAdd}
            onClose={onClose}
            setActiveStep={setActiveStep}
            handleModalClose={handleModalClose}
            from={from}
          />
        );
      case "Permissions":
        return (
          <PermissionsModel
            formData={formData}
            onAdd={onAdd}
            setFormData={setFormData}
            setActiveStep={setActiveStep}
            onClose={onClose}
            finalStep={finalStep}
            handleModalClose={handleModalClose}
          />
        );
      default:
        return null;
    }
  };

  const WizardStep = ({ step, currentStep }) => {
    const isCompleted = currentStep > step;
    const isActive = currentStep === step;

    return (
      <div className="flex w-30 items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border",
            isCompleted
              ? "border-transparent bg-[var(--primary-solid)] text-primary-foreground"
              : isActive
                ? "border-primary-solid bg-background text-secondary-foreground"
                : "border-border bg-background text-muted-foreground"
          )}
        >
          {isCompleted ? (
            <Check size={16} className="text-secondary-foreground" />
          ) : (
            <span className="text-secondary-foreground">{step + 1}</span>
          )}
        </div>
        <div className={cn("ml-3", isActive || isCompleted ? "text-secondary-foreground" : "text-muted-foreground")}>
          {["User Details", "Permissions"][step]}
        </div>
      </div>
    );
  };

  const steps = ["User Details", "Permissions"];
  const activeStepIndex = steps.indexOf(activeStep);
  const stepRefs = useRef([]);
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    if (activeStepIndex >= 0 && stepRefs.current[activeStepIndex]) {
      stepRefs.current[activeStepIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeStepIndex]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-2xl bg-background"
      >
        <div className="flex items-center justify-between border-b border-border px-4 pb-3 pt-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {from === "editProfile" ? "Edit Profile" : "Add New User"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleModalClose}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        {from !== "editProfile" && (
          <div ref={scrollContainerRef} className="flex w-full justify-center px-6 py-4">
            <div className="flex items-center justify-between space-x-2 md:space-x-8">
              {[0, 1].map((step) => (
                <div key={step} className="flex items-center" ref={(el) => (stepRefs.current[step] = el)}>
                  <WizardStep step={step} currentStep={activeStepIndex} />
                  {step < 1 && (
                    <ChevronRight size={16} className="mx-2 text-secondary-foreground/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="hidden-scrollbar min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto">
          {getActiveStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddUserModal;
