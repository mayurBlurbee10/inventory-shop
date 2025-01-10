"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  Settings,
  Users,
  Layout,
  Plus,
  FileText,
  HeadphonesIcon,
  LogOut,
} from "lucide-react";
import CreationWizard from "./CreationWizard";
import Image from "next/image";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { UserRole } from "@/config/constants";
import { clearUserData, getUserData } from "@/app/lib/auth";

const SidePanel = () => (
  <div className="w-80 bg-[#0161D5] p-6 flex flex-col h-screen fixed left-0">
    <div className="mb-8">
      <Image
        src="/logo_admin.png"
        alt="Client Logo"
        width={150}
        height={100}
        className="w-auto mx-auto"
      />
    </div>

    <nav className="space-y-4 flex-1">
      <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors">
        <Layout className="w-5 h-5 mr-3" />
        Dashboard
      </button>
      <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors">
        <FileText className="w-5 h-5 mr-3" />
        Reports
      </button>

      <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors">
        <Users className="w-5 h-5 mr-3" />
        User Management
      </button>
      <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors">
        <HeadphonesIcon className="w-5 h-5 mr-3" />
        Customer Support
      </button>
      <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors">
        <Settings className="w-5 h-5 mr-3" />
        Settings
      </button>
    </nav>
    <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors mt-auto">
      Powered by MStrategy
    </button>
  </div>
);

const SubsidiaryCard = ({ subsidiary, onSelect }) => (
  <div
    onClick={() => onSelect(subsidiary)}
    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
  >
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#0161D5] to-[#0161D5] rounded-lg flex items-center justify-center">
          <span className="text-lg font-semibold text-white">
            {(subsidiary.legalName || subsidiary.tradingName || "U")
              .charAt(0)
              .toUpperCase()}
          </span>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            subsidiary.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {subsidiary.status}
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {subsidiary.legalName || subsidiary.tradingName}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {subsidiary.domain
          ? `${subsidiary.domain}.company.com`
          : "Domain not configured"}
      </p>

      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Users size={16} className="mr-1" />
          <span>{subsidiary.userCount || 0} users</span>
        </div>
        <div className="flex items-center">
          <Folder size={16} className="mr-1" />
          <span>{subsidiary.storageUsed || "0 GB"}</span>
        </div>
      </div>
    </div>
  </div>
);

const CreateSubsidiaryButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="h-full min-h-[240px] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-white p-6 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600"
  >
    <Plus size={24} className="mb-2" />
    <span className="text-sm font-medium">Create New Subsidiary</span>
  </button>
);

const DashboardHeader = ({
  subsidiaryCount,
  user,
  accountDropdown,
  setAccountDropdown,
  handleLogout,
}) => (
  <>
    <div className="flex justify-between items-start">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Portals</h1>
        <p className="text-sm text-gray-500">
          Managing {subsidiaryCount}{" "}
          {subsidiaryCount === 1 ? "portal" : "portals"}
        </p>
      </div>
      <div className="flex items-center space-x-8 cursor-pointer">
        <div
          className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
          onClick={(e) => {
            e.stopPropagation();
            setAccountDropdown((prev) => !prev);
          }}
        >
          {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
          <div
            className={`size-8 xl:size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-blue-600`}
          >
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col text-sm xl:text-base">
            <span className="text-gray-900 font-medium">{user?.name}</span>
          </div>

          {/* DROPDOWN SECTION DONE*/}
          {accountDropdown && (
            <div className="absolute top-12 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);

const SubsidiaryMetrics = () => (
  <div className="grid grid-cols-3 gap-6 mb-8">
    {[
      { label: "Total Subsidiaries", value: "12", change: "+2 this month" },
      { label: "Active Users", value: "1,234", change: "+57 this month" },
      { label: "Storage Used", value: "1.2 TB", change: "+100 GB this month" },
    ].map((metric, idx) => (
      <div
        key={idx}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
        <p className="text-2xl font-semibold text-gray-900 mb-2">
          {metric.value}
        </p>
        <p className="text-xs text-green-600">{metric.change}</p>
      </div>
    ))}
  </div>
);

const LoadingSpinner = () => (
  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
    <div className="text-center space-y-3">
      <div className="mx-auto h-8 w-8 animate-spin">
        <div className="h-full w-full rounded-full border-4 border-gray-200 border-t-gray-800"></div>
      </div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

const SubsidiaryGrid = ({
  isLoading,
  subsidiaries,
  onSelectSubsidiary,
  onCreateNew,
}) => (
  <>
    {isLoading ? (
      <LoadingSpinner />
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subsidiaries.map((subsidiary) => {
          return (
            <React.Fragment key={subsidiary.id}>
              <SubsidiaryCard
                key={subsidiary.id}
                subsidiary={subsidiary}
                onSelect={onSelectSubsidiary}
              />
            </React.Fragment>
          );
        })}
        <CreateSubsidiaryButton onClick={onCreateNew} />
      </div>
    )}
  </>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const [showCreationModal, setShowCreationModal] = useState(false);

  const handleSelectSubsidiary = (subsidiary) => {
    router.push(`/admin/subsidiaries/${subsidiary.id}`);
  };

  const sanitizeName = (name) => {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".")
      ? sanitizeName.slice(0, -1)
      : sanitizeName;
  };

  const handleCreateSubsidiary = async (formData) => {
    setIsLoading(true);
    try {
      let newSubsidiary = {
        legalName: formData.legalName,
        tradingName: formData.tradingName,
        domain: formData.domain,
        status: "setup",
        userCount: 0,
        storageUsed: "0 GB",
        theme: formData.theme || "minimal",
        primaryColor: formData.primaryColor || "#000000",
        secondaryColor: formData.secondaryColor || "#4F46E5",
        accentColor: formData.accentColor || "#000000",
        faviconUrl : formData.faviconUrl || "",
        security: {
          mfa: formData.security?.mfa || true,
          sso: formData.security?.sso || false,
          audit: formData.security?.audit || true,
          ip_restrict: formData.security?.ip_restrict || false,
        },
        permissions: {
          billing: formData.permissions?.billing || true,
          users: formData.permissions?.users || true,
          security: formData.permissions?.security || false,
          api: formData.permissions?.api || false,
        },
        retentionAudit: formData.retentionAudit || "90",
        retentionBackup: formData.retentionBackup || "daily",
        storageLimit: formData.storageLimit || 1000,
        userLimit: formData.userLimit || 100,
        createdBy: user.id,
      };

      // Create Box user
      const boxResponse = await fetchWrapper(
        "/api/box/create-user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: formData.adminEmail,
            externalId: `user_${Date.now()}`,
          }),
        },
        "create-user-box"
      );
  
      const boxData = await boxResponse.json();
  
      if (!boxResponse.ok) {
        throw new Error(boxData.error || "Failed to create Box user");
      }

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
          "logo-upload"
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url;
      }

      newSubsidiary.logo = logoUrl;
      const userData = {
        email: formData.adminEmail,
        name: `${formData.firstName} ${formData.lastName}`,
        title: formData.jobTitle,
        companyName: formData.legalName,
        role: UserRole.ADMIN,
        password: "000",
        logo: logoUrl,
        boxUserId: boxData.user.userId,
        folderId: boxData.user.folderId,
        portal: sanitizeName(formData.legalName) || "",
        isOnboardingRequired: true,
      };

      const UserResponse = await fetchWrapper(
        "/api/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        },
        "save-user"
      );

      if (!UserResponse.ok) {
        throw new Error("Failed to create user data");
      }

      const saveResponse = await fetchWrapper(
        "/api/portal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSubsidiary),
        },
        "create-portal"
      );

      if (!saveResponse.ok) {
        throw new Error("Failed to save subsidiary data");
      }

      const subsidiary = await saveResponse.json();

      setSubsidiaries((prev) => [...prev, subsidiary.data]);
    } catch (error) {
      console.error("Error creating subsidiary:", error);
    } finally {
      setIsLoading(false);
      setShowCreationModal(false);
    }
  };

  const getPortal = async () => {
    try {
      setIsPortalLoading(true);
      const userData = getUserData();
      const response = await fetchWrapper(
        `/api/portal?userId=${userData?.id}`,
        { method: "GET" },
        "get-portal"
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      const subsidiaries = Object.values(data.data);
      setSubsidiaries(subsidiaries);
    } catch (err) {
      console.error("Error while fetching portals");
    } finally {
      setIsPortalLoading(false);
    }
  };

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }

    setUser(userData);
    getPortal();
  }, [router]);

  const handleLogout = () => {
    setAccountDropdown(false);
    clearUserData();
    router.push("login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" onClick={() => {setAccountDropdown(false)}}>
      <SidePanel />
      <div className="flex-1 ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardHeader
            subsidiaryCount={subsidiaries.length}
            user={user}
            accountDropdown={accountDropdown}
            setAccountDropdown={setAccountDropdown}
            handleLogout={handleLogout}
          />
          <SubsidiaryMetrics />
          <SubsidiaryGrid
            isLoading={isPortalLoading}
            subsidiaries={subsidiaries}
            onSelectSubsidiary={handleSelectSubsidiary}
            onCreateNew={() => {
              setShowCreationModal(true);
            }}
          />
        </div>

        <CreationWizard
          isLoading={isLoading}
          isOpen={showCreationModal}
          onClose={() => {
            setShowCreationModal(false);
          }}
          onCreateSubsidiary={handleCreateSubsidiary}
        />
      </div>
    </div>
  );
}
