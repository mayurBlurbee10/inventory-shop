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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const UserDetails = ({ users, isOpen, onClose, onAdd, setActiveStep, formData, setFormData, handleModalClose, from }) => {

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(formData?.logo || "");
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [ndaPages, setNdaPages] = useState(null);
  const [isNdaPagesLoading, setIsNdaPagesLoading] = useState(false);
  const{data:user} = useSelector((state) => state.user);
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
    role:user.role || UserRole.USER,
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

  const handleFormChange = (key, val) => {
    if (!key) return;

    setFormData({
      ...formData,
      [key]: val,
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
      }

      const requestData = {
        ...formData,
          company:{
          name: formData.companyName,
          logo: logoUrl,
        }
      }
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

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4 bg-background", from === "editProfile" && "mt-2")}>
      <div className="space-y-4 px-6">
        <div className="flex w-full gap-4">
          <div className="w-1/2 space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              required
              className="h-10 !bg-background"
              value={formData.firstName}
              onChange={(e) => handleFormChange("firstName", e.target.value)}
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
              className="h-10 !bg-background"
              value={formData.lastName}
              onChange={(e) => handleFormChange("lastName", e.target.value)}
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
            disabled={from === "editProfile"}
            className="h-10 !bg-background"
            value={formData.email}
            onChange={handleEmailChange}
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
            className={cn("h-10 !bg-background", phoneError && "border-destructive")}
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
            className="h-10 !bg-background"
            value={formData.title}
            onChange={(e) => handleFormChange("title", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            type="text"
            className="h-10 !bg-background"
            value={formData.companyName}
            onChange={(e) => handleFormChange("companyName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Role <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleFormChange("role", value)}
            disabled={from === "editProfile"}
          >
            <SelectTrigger className="h-11 w-full !bg-background">
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            NDA Pages
          </Label>
          <Select
            value={formData.ndaPages ?? "none"}
            onValueChange={(value) =>
              handleFormChange("ndaPages", value === "none" ? null : value)
            }
            disabled={from === "editProfile" || isNdaPagesLoading}
          >
            <SelectTrigger className="h-11 w-full !bg-background">
              <SelectValue
                placeholder={
                  isNdaPagesLoading ? "Fetching NDA pages..." : "Select NDA pages..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No NDA</SelectItem>
              {(ndaPages || []).map((page) => (
                <SelectItem key={page.value} value={page.value}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Company Logo
          </Label>
          <div className="mt-2 flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground hover:file:bg-accent/70"
            />
          </div>
          {previewUrl && (
            <div className="mt-2">
              <img
                src={previewUrl}
                alt="Logo preview"
                className="h-20 w-20 rounded border border-border object-contain"
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

const PermissionsModel = ({onClose, setActiveStep,finalStep ,formData , setFormData,onAdd,handleModalClose}) => {
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
                <Select
                  value={formData.retentionApi}
                  onValueChange={(value) =>
                    setFormData({ ...formData, retentionApi: value })
                  }
                >
                  <SelectTrigger className="h-11 w-full !bg-background">
                    <SelectValue placeholder="Daily" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100 p/m">Daily</SelectItem>
                    <SelectItem value="500 p/m">Weekly</SelectItem>
                    <SelectItem value="1000 p/m">Monthly</SelectItem>
                  </SelectContent>
                </Select>
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
              <Select
                value={formData.retentionAudit}
                onValueChange={(value) =>
                  setFormData({ ...formData, retentionAudit: value })
                }
              >
                <SelectTrigger className="h-11 w-full !bg-background">
                  <SelectValue placeholder="30 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-normal text-muted-foreground">System Backups</Label>
              <Select
                value={formData.retentionBackup}
                onValueChange={(value) =>
                  setFormData({ ...formData, retentionBackup: value })
                }
              >
                <SelectTrigger className="h-11 w-full !bg-background">
                  <SelectValue placeholder="Daily" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
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
                ? "border-primary-solid bg-background text-primary-solid"
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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 p-0 sm:max-w-2xl bg-background"
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
        <div className="hidden-scrollbar w-full flex-1 overflow-y-auto">
          {getActiveStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddUserModal;
