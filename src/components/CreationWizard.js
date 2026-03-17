"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronRight,
  Building2,
  Users,
  Palette,
  Box,
  Globe,
  Mail,
  Moon,
  Sun,
} from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import DialogBox from "./DialogBox";
import Button from "./Common/Elements/Button";

const WizardStep = ({ step, currentStep }) => {
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;

  return (
    <div className="flex items-center">
      <div
        className={`
        w-8 h-8 rounded-full flex items-center justify-center border
        ${isCompleted
            ? "bg-[#0061D5]"
            : isActive
              ? "bg-white border-[#0061D5]"
              : "bg-white border-gray-300"
          }
        ${isCompleted || isActive ? "text-white" : "text-gray-500"}
      `}
      >
        {isCompleted ? (
          <Check size={16} className="text-white" />
        ) : (
          <span className={isActive ? "text-gray-900" : "text-gray-500"}>
            {step + 1}
          </span>
        )}
      </div>
      <div className={`ml-3 ${isActive ? "text-gray-900" : "text-gray-500"}`}>
        {["Company Details", "Branding", "Administrator", "System Setup"][step]}
      </div>
    </div>
  );
};

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  onBlur = () => { },
  placeholder = "",
  required = true,
  isLoading = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-gray-400 ml-1">*</span>}
    </label>
    <div className="w-full px-3 py-2 border border-gray-300 rounded-md flex justify-between items-center focus:ring-1 focus:ring-gray-400">
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        onBlur={onBlur}
        className="w-full focus:outline-none"
      />
      {isLoading && (
        <div className="flex items-center gap-2 ">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  </div>
);

const CompanyDetailsStep = ({ formData, setFormData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function sanitizeName(name) {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".")
      ? sanitizeName.slice(0, -1)
      : sanitizeName;
  }

  const handlePortalBlur = async () => {
    if (!formData?.legalName) return;
    setIsLoading(true);
    setError("");
    try {
      const legalName = sanitizeName(formData?.legalName);
      const encodedPortal = encodeURIComponent(legalName);
      const response = await fetchWrapper(
        `/api/portal?portalid=${encodedPortal}`,
        {},
        "fetch-portal"
      );
      const portal = await response.json();
      if (portal.error) {
        setError("");
      } else {
        setError("This name is already in use, please choose another one");
      }
    } catch (err) {
      console.error("Error fetching portal data:", err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="space-y-6  text-gray-700">
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Company Information
        </h3>
        <p className="text-sm text-gray-500">
          Please enter company information
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 ">
        <div className="text-gray-700">
          <InputField
            label="Company Name"
            type="legalName"
            value={formData.legalName}
            onChange={(e) =>
              setFormData({ ...formData, legalName: e.target.value })
            }
            onBlur={handlePortalBlur}
            placeholder="e.g., Acme Corporation Ltd."
            isLoading={isLoading}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region <span className="text-gray-400">*</span>
          </label>
          <select
            value={formData.region}
            onChange={(e) =>
              setFormData({ ...formData, region: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="">Select a region</option>
            <option value="na">North America</option>
            <option value="eu">Europe</option>
            <option value="asia">Asia Pacific</option>
            <option value="latam">Latin America</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Domain Setup <span className="text-gray-400">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  className="flex-1 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300"
                  placeholder="subdomain"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                  .company.com
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={formData.customDomain}
                onChange={(e) =>
                  setFormData({ ...formData, customDomain: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Custom domain (optional)"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="Brief description of the portal's operations"
          />
        </div>
      </div>
    </div>
  );
};

const BrandingStep = ({ formData, setFormData }) => {
  const themes = [
    {
      name: "Modern",
      value: "modern",
      icon: Palette,
      description: "Clean and contemporary design with vibrant accents",
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-blue-400 rounded" />
          <div className="h-2 w-1/2 bg-purple-400 rounded" />
          <div className="h-2 w-2/3 bg-pink-400 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-blue-400" />
            <div className="h-3 w-3 rounded-sm bg-purple-400" />
            <div className="h-3 w-3 rounded-sm bg-pink-400" />
          </div>
        </div>
      ),
      bgClass: "bg-gradient-to-r from-blue-50 to-purple-50",
    },
    {
      name: "Minimal",
      value: "minimal",
      icon: Moon,
      description: "Clean, simple interface focused on content",
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-gray-200 rounded" />
          <div className="h-2 w-1/2 bg-gray-200 rounded" />
          <div className="h-2 w-2/3 bg-gray-200 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
          </div>
        </div>
      ),
      bgClass: "bg-white",
    },
    {
      name: "Classic",
      value: "classic",
      icon: Sun,
      description: "Traditional layout with professional appeal",
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-gray-400 rounded" />
          <div className="h-2 w-1/2 bg-gray-300 rounded" />
          <div className="h-2 w-2/3 bg-gray-400 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-gray-400" />
            <div className="h-3 w-3 rounded-sm bg-gray-300" />
            <div className="h-3 w-3 rounded-sm bg-gray-400" />
          </div>
        </div>
      ),
      bgClass: "bg-gradient-to-r from-gray-50 to-slate-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Brand Settings
        </h3>
        <p className="text-sm text-gray-500">
          Customize the appearance for this portal
        </p>
      </div>

      <div className="space-y-8">
        {/* Theme Selection */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Theme Selection
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((theme) => {
              const Icon = theme.icon;
              return (
                <div
                  key={theme.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${formData.theme === theme.value
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                  onClick={() =>
                    setFormData({ ...formData, theme: theme.value })
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={theme.value}
                        checked={formData.theme === theme.value}
                        onChange={() =>
                          setFormData({ ...formData, theme: theme.value })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <label
                            htmlFor={theme.value}
                            className="font-medium text-gray-900 block cursor-pointer"
                          >
                            {theme.name}
                          </label>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                    <div className={`h-24 rounded border p-4 ${theme.bgClass}`}>
                      {theme.preview}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand Assets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="mx-auto h-24 w-24 bg-gray-50 rounded flex items-center justify-center mb-4">
                {formData.logo ? (
                  <img
                    src={URL.createObjectURL(formData.logo)}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.files[0] })
                  }
                  className="hidden"
                  id="logo-upload"
                  accept="image/*"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Choose file
                </label>
                <p className="text-xs text-gray-500">
                  SVG, PNG or JPG (max. 800x400px)
                </p>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Brand Colors
              </label>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    className="h-10 w-full rounded-md border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-md border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) =>
                      setFormData({ ...formData, accentColor: e.target.value })
                    }
                    className="h-10 w-full rounded-md border border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Favicon URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favicon URL
              </label>
              <input
                type="text"
                value={formData.faviconUrl}
                onChange={(e) =>
                  setFormData({ ...formData, faviconUrl: e.target.value })
                }
                placeholder="https://"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdministratorStep = ({ formData, setFormData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailBlur = async () => {
    if (!formData?.adminEmail) return;
    setIsLoading(true);
    setError("");
    try {
      const encodedEmail = encodeURIComponent(formData?.adminEmail);
      const response = await fetchWrapper(
        `/api/users?email=${encodedEmail}&check=portalCreatedAdmin`,
        {},
        "fetch-user"
      );
      const userData = await response.json();
      if (!response.ok) throw new Error(userData.error);
      if (userData) {
        // Populate the formData with fetched user details
        setFormData({
          ...formData,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          jobTitle: userData.title || "",
          phoneNumber: userData.phoneNo || ""
          // permissions: userData?.permissions || {}, // Pre-populate permissions if available
        });
      } 
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="space-y-6  text-gray-700">
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Administrator Account
        </h3>
        <p className="text-sm text-gray-500">
          Create the primary administrator for this portal
        </p>
      </div>
      <InputField
        label="Work Email"
        type="email"
        value={formData.adminEmail}
        onChange={(e) =>{
          setFormData({ ...formData, adminEmail: e.target.value, firstName: "", lastName: "", jobTitle: "", phoneNumber: "" })
        }}
        onBlur={handleEmailBlur}
        placeholder="john.doe@company.com"
        isLoading={isLoading}
      />
      {isLoading && (
        <p className="text-sm text-gray-500">Loading user data...</p>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-6">
        <InputField
          label="First Name"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          placeholder="John"
        />
        <InputField
          label="Last Name"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          placeholder="Doe"
        />
      </div>

      <div className="space-y-4">
        <InputField
          label="Job Title"
          value={formData.jobTitle}
          onChange={(e) =>
            setFormData({ ...formData, jobTitle: e.target.value })
          }
          placeholder="e.g., Regional Director"
        />

        <div className="grid grid-cols-2 gap-6">
          <InputField
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            placeholder="+1 (555) 000-0000"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone <span className="text-gray-400">*</span>
            </label>
            <select
              value={formData.timezone}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="">Select timezone</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Central European Time (CET)</option>
              <option value="Asia/Singapore">Singapore Time (SGT)</option>
            </select>
          </div>
        </div>

        <div>
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
              <label key={id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.permissions?.[id]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: {
                        ...formData.permissions,
                        [id]: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemSetupStep = ({ formData, setFormData }) => (
  <div className="space-y-6  text-gray-700">
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        System Configuration
      </h3>
      <p className="text-sm text-gray-500">
        Configure technical settings and integrations
      </p>
    </div>

    <div className="space-y-6">
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
          <InputField
            label="Storage Limit (GB)"
            type="number"
            value={formData.storageLimit}
            onChange={(e) =>
              setFormData({ ...formData, storageLimit: e.target.value })
            }
            placeholder="1000"
          />
          <InputField
            label="User Limit"
            type="number"
            value={formData.userLimit}
            onChange={(e) =>
              setFormData({ ...formData, userLimit: e.target.value })
            }
            placeholder="100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Security Settings
        </label>
        <div className="space-y-3">
          {[
            {
              id: "mfa",
              label: "Require Multi-Factor Authentication",
              default: true,
            },
            { id: "sso", label: "Enable Single Sign-On", default: false },
            { id: "audit", label: "Enable Audit Logging", default: true },
            {
              id: "ip_restrict",
              label: "IP Address Restrictions",
              default: false,
            },
          ].map(({ id, label, default: defaultValue }) => (
            <div
              key={id}
              className="flex items-center justify-between py-2 border-b border-gray-100"
            >
              <div>
                <label htmlFor={id} className="text-sm text-gray-700">
                  {label}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={id}
                  checked={formData.security?.[id] ?? defaultValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      security: {
                        ...formData.security,
                        [id]: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Data Retention
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Audit Logs
            </label>
            <select
              value={formData.retentionAudit}
              onChange={(e) =>
                setFormData({ ...formData, retentionAudit: e.target.value })
              }
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
            <label className="block text-sm text-gray-700 mb-1">
              System Backups
            </label>
            <select
              value={formData.retentionBackup}
              onChange={(e) =>
                setFormData({ ...formData, retentionBackup: e.target.value })
              }
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
  </div>
);

const CreationWizard = ({ isLoading, isOpen, onClose, onCreateSubsidiary }) => {
  const initialFormData = {
    legalName: "",
    tradingName: "",
    region: "",
    domain: "",
    customDomain: "",
    description: "",
    theme: "minimal",
    primaryColor: "#000000",
    secondaryColor: "#2563eb",
    accentColor: "#ffffff",
    logo: null,
    faviconUrl: "",
    firstName: "",
    lastName: "",
    adminEmail: "",
    jobTitle: "",
    phoneNumber: "",
    timezone: "",
    permissions: {
      billing: true,
      users: true,
      security: false,
      api: false,
    },
    storageLimit: 1000,
    userLimit: 100,
    security: {
      mfa: true,
      sso: false,
      audit: true,
      ip_restrict: false,
    },
    retentionAudit: "90",
    retentionBackup: "daily",
  };
  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const validateStep = () => {
    const errors = {};

    switch (currentStep) {
      case 0:
        if (!formData.legalName) errors.legalName = "Required";
        if (!formData.region) errors.region = "Required";
        if (!formData.domain) errors.domain = "Required";
        break;
      case 1:
        if (!formData.logo) errors.logo = "Required";
        break;
      case 2:
        if (!formData.firstName) errors.firstName = "Required";
        if (!formData.lastName) errors.lastName = "Required";
        if (!formData.adminEmail) errors.adminEmail = "Required";
        if (
          formData.adminEmail &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)
        ) {
          errors.adminEmail = "Invalid email";
        }
        break;
      case 3:
        if (!formData.storageLimit) errors.storageLimit = "Required";
        if (!formData.userLimit) errors.userLimit = "Required";
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep()) {
      if (currentStep === 3) {
        setIsSubmitting(true);
        // Simulate API call with 3 second delay
        // await new Promise(resolve => setTimeout(resolve, 6000));
        onCreateSubsidiary(formData);
        setShowSuccess(true);
        setIsSubmitting(false);
        // Close the modal after showing success for 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 6000);
        // onClose();
        resetOnClose();
      } else {
        setCurrentStep(currentStep + 1);
        // console.log('name:', formData.legalName);
        // setDialogOpen(
        //   (prev) => !prev
        // )
        // console.log('open:', dialogOpen)
      }
    }
  };

  const resetOnClose = () => {
    setFormData(initialFormData);
    setCurrentStep(0);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    resetOnClose();
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { component: CompanyDetailsStep },
    { component: BrandingStep },
    { component: AdministratorStep },
    { component: SystemSetupStep },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="fixed inset-0 z-[70] bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-3xl h-[calc(100vh-120px)] flex flex-col relative">
        {/* Success Message */}

        {/* {showSuccess && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Portal Successfully Created
              </h3>
            </div>
          </div>
        )} */}

        {/* Loading Overlay */}
        {(isSubmitting || isLoading) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin">
                <div className="h-full w-full rounded-full border-4 border-gray-200 border-t-gray-800"></div>
              </div>
              <p className="text-sm text-gray-500">Creating your portal...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 overflow-auto">
          <div className="flex justify-between items-center space-x-8">
            {[0, 1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <WizardStep step={step} currentStep={currentStep} />
                {step < 3 && (
                  <ChevronRight size={16} className="mx-2 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <CurrentStepComponent formData={formData} setFormData={setFormData} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between">
          <Button
            onClick={currentStep === 0 ? handleClose : handleBack}
            disabled={isSubmitting || isLoading}
            type="Secondary"
            label={currentStep === 0 ? "Cancel" : "Back"}
          />
          <Button
            onClick={handleNext}
            disabled={isSubmitting || isLoading}
            type="Primary"
            label={currentStep === steps.length - 1 ? "Create Portal" : "Continue"}
            isLoading={isSubmitting || isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default CreationWizard;
