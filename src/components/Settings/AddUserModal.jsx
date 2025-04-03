"use client"
import React, { useEffect, useRef, useState } from "react";
import { Box, Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { UserRole } from "@/config/constants";
import Button from "../Common/Elements/Button";

const UserDetails = ({ users, isOpen, onClose, onAdd, setActiveStep, formData , setFormData, handleModalClose}) => {
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [companyOptions, setCompanyOptions] = useState({
    visible: false,
    data: [],
    filteredData: [],
  });
  const [companySearched, setCompanySearched] = useState("");
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // const handleModalClose = () => {
  //   // reset state on modal close
  //   setFormData({
  //     name: "",
  //     email: "",
  //     phone: "",
  //     title: "",
  //     companyName: "",
  //     role: "user",
  //     logo: null,
  //   });
  //   setCompanyOptions({
  //     visible: false,
  //     data: [],
  //     filteredData: [],
  //   });
  //   setError("");
  //   setPreviewUrl("");
  //   setCompanySearched("");
  //   onClose();
  // };

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
        name: formData.name,
        title: formData.title,
        companyName: formData.companyName,
        password: "000",
        role: formData.role,
        logo: logoUrl,
        boxUserId: boxData.user.userId,
        folderId: boxData.user.folderId,
        portal: params.portalid || "",
        isOnboardingRequired: false,
        createdBy: user.id,
        permissions: {
          portalId: params.portalid,
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

  const onCompanyNameSearch = (e) => {
    const searchedText = e.target.value;
    setCompanySearched(searchedText);
    setTimeout(() => {
      onApplySearchFilter(searchedText);
    }, 1000);
  };

  const onApplySearchFilter = (searchedText, visible) => {
    searchedText = String(searchedText).trim().toLowerCase();
    const data =
      companyOptions.data.length > 0
        ? companyOptions.data
        : users.map((x) => x.name);
    let companyData = JSON.parse(JSON.stringify(data));

    if (!!searchedText)
      companyData = companyData.filter((x) =>
        String(x).trim().toLowerCase().startsWith(searchedText)
      );
    else companyData = data;

    setCompanyOptions({
      visible: companyOptions.visible || visible,
      data,
      filteredData: companyData,
    });
  };

  const toggleCompanyDropdown = () => {
    if (!companyOptions.visible) onApplySearchFilter(companySearched, true);
    else onCompanyNameBlur();
  };

  const onCompanyNameBlur = () => {
    setCompanyOptions({ ...companyOptions, visible: false });
    setCompanySearched("");
  };

  const onCompanyNameSelect = (item) => {
    handleFormChange("companyName", item);
    onCompanyNameBlur();
  };

  const onAddCompany = () => {
    setCompanySearched("");
    const data = [...companyOptions.data, companySearched];
    setCompanyOptions({ ...companyOptions, data, filteredData: data });
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

    // const validatePhoneNumber = (phone) => {
    //   if (!phone.trim()) {
    //     setPhoneError(""); // Clear error if input is empty
    //     return;
    //   }
    //   const usCanadaRegex = /^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/; // US & Canada: 10 digits
    //   const mexicoRegex = /^(\+52|52)[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/; // Mexico: 10-12 digits
    
    //   if (usCanadaRegex.test(phone) || mexicoRegex.test(phone)) {
    //     setPhoneError(""); // Valid number
    //   } else {
    //     setPhoneError("Enter a valid phone number");
    //   }
    // };
    
    // const handlePhoneChange = (e) => {
    //   let phone = e.target.value;
    //   phone = phone.replace(/[^0-9\s-.+]/g, "");
    //   handleFormChange("phone", phone);
    //   validatePhoneNumber(phone);
    // };
    const validateOnlyDigits = (value) => {
      return /^\d*$/.test(value); // Allows only digits and empty string
    };
    
    const handlePhoneChange = (e) => {
      const phone = e.target.value;
    
      if (validateOnlyDigits(phone)) {
        handleFormChange("phone", phone);
        setPhoneError(phone.length > 0 ? "" : null); // Clear error if valid or empty
      } else {
        setPhoneError("Only digits are allowed");
      }
    };
    
    
  return (
    // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    //   <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              required
              className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.email}
              onChange={handleEmailChange}
            />
          </div>
          {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone No</label>
            <input
              type="text"
              // maxLength={16}
              className={`mt-1 pl-2 block w-full text-gray-500 rounded-md border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500 ${phoneError ? "border-red-500" : "border-gray-300 text-gray-500"
                }`}
              value={formData.phone}
              onChange={handlePhoneChange}
            />
          </div>
          {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700">
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
            <label className="block text-sm font-medium text-gray-700">
              Company Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className="mt-1 pl-2 block w-full rounded-md border-gray-300 text-gray-500 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.companyName}
              onChange={(e) => handleFormChange("companyName", e.target.value)}
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <div className="relative">
              <button
                type="button"
                className={`relative w-full ${!!formData.companyName ? 'py-2' : 'py-5'} rounded border border-solid py-2 outline-none-lg text-left px-2 text-gray-700`}
                onClick={toggleCompanyDropdown}
              >
                {formData.companyName}
                <div className='absolute top-3 right-0'>
                  <ChevronDown className="w-4 h-4 mr-2 text-[#000]" />
                </div>
              </button>
              {companyOptions.visible && users && users.length > 0 && (
                <div className="absolute w-full top-8">
                  <div className='bg-white rounded-lg border relative'>
                    <ul className='w-100 max-h-[120px] overflow-auto'>
                      <li>
                        <input
                          type="text"
                          placeholder='Please select or search to create a company'
                          className="mt-1 block w-full text-gray-900 border-gray-300 border-b focus:border-blue-500 focus:ring-blue-500"
                          value={companySearched}
                          onChange={onCompanyNameSearch}
                        />
                      </li>
                      {companyOptions.filteredData.map((item, i) =>
                        <React.Fragment key={i}>
                          <li className='text-[#000] hover:text-white hover:bg-blue-600 p-1' onClick={(e) => onCompanyNameSelect(item)}>
                            {item}
                          </li>
                        </React.Fragment>
                      )}
                      {(!companyOptions.filteredData || companyOptions.filteredData.length == 0) && !!companySearched && (
                        <>
                          <li className='text-[#000] text-center p-1'>No data found</li>

                          <li className='sticky bottom-0 flex align-items-center border-t py-2 px-1'>
                            <button className='text-sm font-medium text-blue-600 mb-2 mr-6 ml-1 underline decoration-1 rounded-md hover:text-blue-700 disabled:opacity-55 disabled:cursor-not-allowed' onClick={onAddCompany}>+Add</button>
                            <p className='text-gray-700'>{companySearched}</p>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div> */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role <span className="text-red-600">*</span>
            </label>
            <select
              className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 border border-solid py-2 outline-none focus:border-blue-500 focus:ring-blue-500"
              value={formData.role}
              onChange={(e) => handleFormChange("role", e.target.value)}
              style={{ height: "2.5rem" }}
            >
              <option value={UserRole.USER}>User</option>
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.MODERATOR}>Moderator</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
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
          <div className="flex justify-end space-x-3">
            {/* <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button> */}
            <Button 
            type="Secondary"
            onClick={handleModalClose}
            disabled={loading}
            label="Cancel"
            />
            {/* <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? "Creating..." : "Add User"}
            </button> */}
        <Button
          onClick={handelNext}
          disabled={isLoading || !formData.name || !formData.email || !formData.title || !formData.companyName || emailError || phoneError}
          isLoading={isLoading}
          type="Primary"
          label="Next"
        />
          </div>
        </form>
    //   </div>
    // </div>
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
        phone: formData.phone,
        name: formData.name,
        title: formData.title,
        companyName: formData.companyName,
        password: "000",
        role: formData.role,
        logo: logoUrl,
        boxUserId: boxData.user.userId,
        folderId: boxData.user.folderId,
        portal: params.portalid || "",
        isOnboardingRequired: false,
        createdBy: user.id,
        permissions: {
          portalId: params.portalid,
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

  console.log("FormData:", formData);
  const handleCheckboxClick = (id) => {
    setPermissions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSecurityToggle = (id) => {
    setSecuritySettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* Permissions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Permissions
        </label>
        <div className="space-y-2 mt-2">
          {[
            { id: "billing", label: "Billing Management" },
            { id: "users", label: "User Management" },
            { id: "security", label: "Security Settings" },
            { id: "api", label: "API Access" },
          ].map(({ id, label }) => (
            <label key={id} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={permissions[id] ?? false}
                onChange={() => handleCheckboxClick(id)}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-400"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Box Enterprise Setup */}
      <div className="space-y-6 text-gray-700">
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <Box className="h-5 w-5 text-gray-900" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Box Enterprise Setup
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Configure storage and user limits for the Box enterprise account
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Storage Limit (GB) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={storageLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setStorageLimit(value);
                  }
                }}
                placeholder="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">API Limit <span className="text-red-600">*</span></label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    value={apiLimit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setApiLimit(value);
                      }
                    }}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <select
                    value={formData.retentionApi}
                    onChange={(e) => setFormData({ ...formData, retentionApi: e.target.value })}
                    className="w-full px-3 py-[10px] border border-gray-300 rounded-md"
                  >
                    <option value="100 p/m">Daily</option>
                    <option value="500 p/m">Weekly</option>
                    <option value="1000 p/m">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Security Settings
          </label>
          <div className="space-y-3">
            {[
              { id: "mfa", label: "Require Multi-Factor Authentication", default: true },
              { id: "sso", label: "Enable Single Sign-On", default: false },
              { id: "audit", label: "Enable Audit Logging", default: true },
              { id: "ip_restrict", label: "IP Address Restrictions", default: false },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <label htmlFor={id} className="text-sm text-gray-700">{label}</label>
                <input
                  type="checkbox"
                  id={id}
                  checked={securitySettings[id]}
                  onChange={() => handleSecurityToggle(id)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Data Retention */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Data Retention
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Audit Logs</label>
              <select
                value={formData.retentionAudit}
                onChange={(e) => setFormData({ ...formData, retentionAudit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">System Backups</label>
              <select
                value={formData.retentionBackup}
                onChange={(e) => setFormData({ ...formData, retentionBackup: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-3">
        <Button onClick={() => setActiveStep("User Details")} type="Secondary" label="Back" />
        <Button
          onClick={handleSubmit}
          buttonType="submit"
          type="Primary"
          disabled={loading}
          isLoading={loading}
          label="Add User"
        />
      </div>
    </>
  )
}

const AddUserModal = ({ users, isOpen, onClose, onAdd }) => {
  const [activeStep, setActiveStep] = useState("User Details");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    companyName: "",
    role: UserRole.USER,
    logo: null,
  });

    const finalStep = () => {
      dispatch(setNewLoan(newLoanData));
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
      <div className="flex items-center w-40">
        <div
          className={`
          w-8 h-8 rounded-full flex items-center justify-center border
          ${isCompleted
              ? "bg-[#0061D5]"
              : isActive
                ? "bg-white border-[#0061D5] text-[#0061D5]"
                : "bg-white border-gray-300"
            }
          ${isCompleted || isActive ? "text-white" : "text-[#0061D5]"}
        `}
        >
          {isCompleted ? (
            <Check size={16} className="text-white" />
          ) : (
            <span className={isActive ? "text-[#0061D5]" : "text-gray-500"}>
              {step + 1}
            </span>
          )}
        </div>
        <div className={`ml-3 ${isActive || isCompleted ? "text-[#0061D5]" : "text-gray-500"}`}>
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

    const handleClose = () => {
      onClose()
    }
if (!isOpen) return ;
console.log("activeStep:", activeStep);
const handleModalClose = () => {
  setFormData({
    name: "",
    email: "",
    phone: "",
    title: "",
    companyName: "",
    role: "user",
    logo: null,
  });
  setError("");
  onClose();
  setActiveStep("User Details");
};
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg  w-full max-w-2xl">
          <div className="flex justify-between items-center border-b px-4 pt-4 pb-3">
            <h2 className="text-xl text-gray-800 font-semibold">Add New User</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div ref={scrollContainerRef} className="px-6 py-4 overflow-auto flex w-full sm:justify-center">
            <div className="flex justify-between items-center space-x-8">
              {[0, 1].map((step) => (
                <div key={step} className="flex items-center" ref={(el) => (stepRefs.current[step] = el)}>
                  <WizardStep step={step} currentStep={activeStepIndex} />
                  {step < 1 && (
                    <ChevronRight size={16} className="mx-2 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full px-6 pb-6 max-h-[72vh] overflow-y-auto">{getActiveStepContent()}</div>
        </div>
      </div>
    </>

  )

}

export default AddUserModal;
