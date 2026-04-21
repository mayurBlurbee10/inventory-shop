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
  X,
  Trash2,
  ChevronDown,
  Menu as MenuIcon,
  Copy
} from "lucide-react";
import CreationWizard from "./CreationWizard";
import Image from "next/image";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { UserRole } from "@/config/constants";
import { clearUserData, getUserData } from "@/app/lib/auth";
import MasterUsersContent from "./Master/MasterUsersContent";
import { toast } from "react-toastify";
import { Dialog, DialogBackdrop, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import PortalCreatedPopup from "./PortalCreatedPopup";
import Button from "./Common/Elements/Button";
import PortalDuplicateModal from "./Settings/PortalDuplicateModal";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";

const SidePanel = ({ setCurrentPage }) => (
  <div className="w-80 bg-[#0061D5] z-50 p-6 flex flex-col h-screen fixed left-0">
    <div className="mb-8">
      <Image
        src="/M_Strategy_logo.png"
        alt="Client Logo"
        width={100}
        height={80}
        className="w-auto mx-auto"
      />
    </div>

    <nav className="space-y-4 flex-1">
      <button
        className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors"
        onClick={() => setCurrentPage("Portals")}
      >
        <Layout className="w-5 h-5 mr-3" />
        Dashboard
      </button>
      <button
        className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors"
        onClick={() => setCurrentPage("Reports")}
      >
        <FileText className="w-5 h-5 mr-3" />
        Reports
      </button>

      <button
        className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors"
        onClick={() => setCurrentPage("Super User")}
      >
        <Users className="w-5 h-5 mr-3" />
        User Management
      </button>
    </nav>
    <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors mt-auto">
      Powered by MStrategy
    </button>
  </div>
);

const SubsidiaryCard = ({
  subsidiary,
  onSelect
}) => {
  const [isPortalDuplicateModalOpen, setIsPortalDuplicateModalOpen] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [duplicatePortalData, setDuplicatePortalData] = useState({
    legalName: "",
    tradingName: "",
    domain: "",
  });

  // const fetchUsers = async () => {
  //   try {
  //     if (!subsidiary) return;
  //     const response = await fetchWrapper(
  //       `/api/users?portalid=${sanitizeName(subsidiary?.legalName)}`,
  //       {},
  //       "fetch-users"
  //     );
  //     const data = await response.json();
  //     if (!response.ok) {
  //       throw new Error(data.error || "Failed to fetch users");
  //     }

  //     setUsersCount(data?.length);
  //     console.log("active", activeUsers);
  //     setActiveUsers((prev) => {
  //       const updatedArray = [...prev];
  //       const firstNullIndex = updatedArray.indexOf(null);
  //       if (firstNullIndex !== -1) {
  //         updatedArray[firstNullIndex] = data?.length;
  //       }
  //       return updatedArray;
  //     });
  //   } catch (error) {
  //     console.log("error: ", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  const handleDuplicatePortal = async () => {
    try {
      if (!subsidiary) return;
      setIsLoading(true);
      const response = await fetchWrapper(
        `/api/portal/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id : subsidiary?.id, ...duplicatePortalData }),
        },
        "create-portal"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create duplicate portal");
      }
      setIsPopupOpen(true)
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  function sanitizeName(name) {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
  }
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0061D5] to-[#0061D5] rounded-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-white">
              {(subsidiary.legalName || subsidiary.tradingName || "U")
                .charAt(0)
                .toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                subsidiary.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {subsidiary.status}
            </div>

            <div
              className="relative group px-2 py-1"
              onClick={() => setIsPortalDuplicateModalOpen(subsidiary)}
            >
              <Copy className="size-4  text-blue-700" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition bg-gray-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                duplicate
              </span>
            </div>
          </div>
        </div>
        <div onClick={() => onSelect(subsidiary)}>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {subsidiary.legalName}
          </h3>
          <p
            className="text-sm text-gray-500 mb-4 hover:text-bg-[#0061D5]"
            onClick={(event) => {
              event.stopPropagation();
              const url = `/${sanitizeName(subsidiary.legalName)}/login`;
              window.open(url, "_blank");
            }}
          >
            {subsidiary.domain
              ? `${subsidiary.domain}.company.com`
              : "Domain not configured"}
          </p>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Users size={16} className="mr-1" />
              <span>{subsidiary.userCount} users</span>
            </div>
            <div className="flex items-center">
              <Folder size={16} className="mr-1" />
              <span>{subsidiary.storageUsed || "0 GB"}</span>
            </div>
          </div>
        </div>
      </div>
      {/* <DeletePortalModal
        isOpen={portalToDelete?.id === subsidiary?.id}
        onClose={() => setPortalToDelete(null)}
        subsidiary={subsidiary}
        refreshPortals={refreshPortals}
      /> */}
      {/* {isPortalDuplicateModalOpen?.id === subsidiary?.id && ( */}
        <PortalDuplicateModal
          isOpen={isPortalDuplicateModalOpen?.id === subsidiary?.id}
          onClose={()=>setIsPortalDuplicateModalOpen(null)}
          handleDuplicate={handleDuplicatePortal}
          setFormData={setDuplicatePortalData}
          formData={duplicatePortalData}
          isLoading={isLoading}
        />
      {/* )} */}
      <PortalCreatedPopup
        isOpen={isPopupOpen}
        portalName={duplicatePortalData?.legalName}
        portalId={sanitizeName(duplicatePortalData?.legalName)}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
};

const CreateSubsidiaryButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="h-full min-h-[200px] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-white p-6 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600"
  >
    <Plus size={24} className="mb-2" />
    <span className="text-sm font-medium">Create New Portal</span>
  </button>
);

const DashboardHeader = ({
  currentPage,
  currentPageCount,
  user,
  accountDropdown,
  setAccountDropdown,
  handleLogout,
}) => (
  <>
    <div className="flex justify-between items-start">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {currentPage}
        </h1>
        <p className="text-sm text-gray-500">
          Managing {currentPageCount} {currentPage}
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
            className={`size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-[#0061D5]`}
          >
            {user?.firstName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col text-sm xl:text-base">
            <span className="text-gray-900 font-medium">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}</span>
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

const SubsidiaryMetrics = ({ activeUsers, currentPageCount }) => {
  console.log(activeUsers);
  const [users, setUsers] = useState(0);
  // useEffect(() => {
  //   // Ensure activeUsers is an array of numbers (filtering out null or undefined)
  //   const totalActiveUsers = activeUsers.reduce(
  //     (acc, item) => (typeof item === "number" ? acc + item : acc),
  //     0
  //   );
  //   setUsers(totalActiveUsers);
  // }, [activeUsers]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {[
        {
          label: "Total Portals",
          value: currentPageCount,
          change: "+2 this month",
        },
        { label: "Active Users", value: activeUsers, change: "+57 this month" },
        { label: "Storage Used", value: "0 TB", change: "+100 GB this month" },
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
};

const LoadingSpinner = () => (
  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
    <div className="text-center space-y-3">
      <LoaderSpinner size={24} className="text-blue-500" />
    </div>
  </div>
);


const SubsidiaryGrid = ({
  isLoading,
  subsidiaries,
  onSelectSubsidiary,
  onCreateNew,
 }) => {
  const [visibleSubsidiaries, setVisibleSubsidiaries] = useState(5);

  const handleLoadMore = () => {
    setVisibleSubsidiaries(subsidiaries.length);
  };

  return (

    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CreateSubsidiaryButton onClick={onCreateNew} />
            {subsidiaries?.slice(0, visibleSubsidiaries).map((subsidiary) => {
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
          </div>
          {visibleSubsidiaries < subsidiaries.length && (
            <div className="flex justify-center mt-6">
              {/* <button
                onClick={handleLoadMore}
                className="bg-[#0061D5] text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Load More
              </button> */}
              <Button 
                onClick={handleLoadMore}
                type="Primary"
                label="Load More"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const [showCreationModal, setShowCreationModal] = useState(false);
  const [currentPage, setCurrentPage] = useState("Portals");
  const [currentPageCount, setCurrentPageCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  const [filteredSubsidiaries, setFilteredSubsidiaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newPortalName, setNewPortalName] = useState("");
  const [newPortalId, setNewPortalId] = useState("");

  const handleSelectSubsidiary = (subsidiary) => {
    router.push(`/admin/portals/${subsidiary.id}`);
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
        faviconUrl: formData.faviconUrl || "",
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
        logo: null,
        boxUserId: boxData.user.userId,
        folderId: boxData.user.folderId,
        portal: sanitizeName(formData.legalName) || "",
        isOnboardingRequired: true,
        createdBy: user.id,
        permissions: {
          portalId: sanitizeName(formData.legalName),
          role: UserRole.ADMIN,
        },
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
      const data = await UserResponse.json();
      if (!UserResponse.ok) {
        throw new Error(data.error || "Failed to create user data");
      }

      newSubsidiary.portalCreatedAdmin = data?.id

      const saveResponse = await fetchWrapper(
        "/api/portal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSubsidiary),
        },
        "create-portal"
      );

      const subsidiary = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(subsidiary.error || "Failed to save portal data");
      }

      setSubsidiaries((prev) => [...prev, subsidiary.data]);
      getPortal();
      // toast.success(subsidiary.message || "Portal created successfully");
      setNewPortalName(subsidiary.data.legalName);
      setNewPortalId(sanitizeName(subsidiary.data.legalName));
      setIsPopupOpen(true);
    } catch (error) {
      toast.error(error.message);
      console.error("Error creating portal:", error);
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
        `/api/portal?userId=${userData?.id}`, // ⬅ Add limit parameter
        { method: "GET" },
        "get-portal"
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      const subsidiaries = data.data;
      setSubsidiaries(subsidiaries.portals);
      setFilteredSubsidiaries(subsidiaries.portals);
      setCurrentPageCount(subsidiaries.portals.length);
      setActiveUsers(subsidiaries.activeUsers);
    } catch (err) {
      console.error("Error while fetching portals");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
  };

  const handleFilterChange = (selectedFilter) => {
    setFilter(selectedFilter);
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

  useEffect(() => {
    setCurrentPageCount(0);

    if (currentPage === "Portals" || currentPage === "Reports") {
      setCurrentPageCount(subsidiaries.length);

    }
  }, [currentPage, subsidiaries?.length]);

  useEffect(() => {
    const filtered = subsidiaries.filter((subsidiary) => {
      const matchesSearch = subsidiary.legalName
        .toLowerCase()
        .includes(searchTerm);
      const matchesFilter =
        filter === "all" || subsidiary.createdBy.id === user.id;

      return matchesSearch && matchesFilter;
    });

    setFilteredSubsidiaries(filtered);
  }, [subsidiaries, searchTerm, filter, user]);

  const handleLogout = () => {
    setAccountDropdown(false);
    clearUserData();
    router.push("login");
  };
  // const recentSubsidiary =  subsidiaries[subsidiaries.length - 1].domain
  // console.log("Last Portal:",);


  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-gray-50"
      onClick={() => {
        setAccountDropdown(false);
      }}
    >
      <div
        className={`sm:hidden fixed w-full border-b border-gray-200 top-0 left-0  z-50 bg-white p-4 flex items-center justify-start ${sidePanelOpen ? "hidden" : "block"}`}
        onClick={() =>
          setSidePanelOpen((prev) => !prev)
        }
      >
        {sidePanelOpen ? '' : <MenuIcon className="" />}
      </div>


      {sidePanelOpen && (
        <div
          className="fixed top-4 left-4 z-[60] text-white cursor-pointer"
          onClick={() => setSidePanelOpen(false)}
        >
          <X className="" />
        </div>
      )}
      <div
        className={`sm:block z-[50]  ${sidePanelOpen ? "block" : "hidden"} `}
      >
        <SidePanel setCurrentPage={setCurrentPage} />
      </div>

      <div className="flex-1 pt-10 sm:pt-0 sm:ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:py-8 pt-10">
          <DashboardHeader
            currentPageCount={currentPageCount}
            currentPage={currentPage}
            user={user}
            accountDropdown={accountDropdown}
            setAccountDropdown={setAccountDropdown}
            handleLogout={handleLogout}
          />
          {currentPage === "Portals" && (
            <>
              <div className="flex justify-between items-center mb-6 text-gray-600 gap-4">
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search Portals..."
                  value={searchTerm}
                  onChange={handleSearch}
                />

                <Menu as="div" className="relative flex-shrink-0">
                  <MenuButton className="flex items-center px-4 py-2 text-gray-600 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {filter === "all" ? "All Portals" : "My Portals"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </MenuButton>

                  <MenuItems className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                    <MenuItem>
                      <button
                        onClick={() => handleFilterChange("all")}
                        className={`block w-full text-left px-4 py-2 text-sm ${filter === "all" ? "bg-blue-100" : ""
                          }`}
                      >
                        All Portals
                      </button>
                    </MenuItem>
                    <MenuItem>
                      <button
                        onClick={() => handleFilterChange("my")}
                        className={`block w-full text-left px-4 py-2 text-sm ${filter === "my" ? "bg-blue-100" : ""
                          }`}
                      >
                        My Portals
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
              <SubsidiaryGrid
                isLoading={isPortalLoading}
                subsidiaries={filteredSubsidiaries}
                onSelectSubsidiary={handleSelectSubsidiary}
                onCreateNew={() => {
                  setShowCreationModal(true);
                }}
                user={user}
                refreshPortals={getPortal}
              />
            </>
          )}

          {currentPage === "Reports" && (
            <SubsidiaryMetrics
              activeUsers={activeUsers}
              currentPage={currentPage}
              currentPageCount={currentPageCount}
            />
          )}

          {currentPage === "Super User" && (
            <MasterUsersContent setCurrentPageCount={setCurrentPageCount} />
          )}
        </div>

        <CreationWizard
          isLoading={isLoading}
          isOpen={showCreationModal}
          onClose={() => {
            setShowCreationModal(false);
          }}
          onCreateSubsidiary={handleCreateSubsidiary}
        />
        <PortalCreatedPopup
          isOpen={isPopupOpen}
          portalName={newPortalName}
          portalId={newPortalId}
          onClose={() => setIsPopupOpen(false)}
        />
      </div>
    </div>
  );
}
