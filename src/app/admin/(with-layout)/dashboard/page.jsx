"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import CreationWizard from "@/components/CreationWizard";
import PortalCreatedPopup from "@/components/PortalCreatedPopup";
import PortalDuplicateModal from "@/components/Settings/PortalDuplicateModal";
import { PluginType, UserRole } from "@/config/constants";
import { setPortals } from "@/store/actions/portalAction";
import { setActiveUsers } from "@/store/services/portalService";
import {
  Dialog,
  DialogBackdrop,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { ChevronDown, Copy, Folder, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const SubsidiaryCard = ({ subsidiary, onSelect, refreshPortals }) => {
  const [isPortalDuplicateModalOpen, setIsPortalDuplicateModalOpen] =
    useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicatePortalData, setDuplicatePortalData] = useState({
    legalName: "",
    domain: "",
  });

  const { data : user } = useSelector((state)=> state.user)

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
      const user = getUserData();
      const response = await fetchWrapper(
        `/api/portal/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: subsidiary?.id, ...duplicatePortalData, createdBy: user?.id, existingPortal : subsidiary?.legalName}),
        },
        "create-portal"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create duplicate portal");
      }
      setIsPopupOpen(true);
      refreshPortals();
    } catch (error) {
      console.log("error: ", error);
      toast.error(error.message)
    } finally {
      setIsLoading(false);
    }
  };

  function sanitizeName(name) {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".")
      ? sanitizeName.slice(0, -1)
      : sanitizeName;
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
            <button
              className="relative group px-2 py-1"
              onClick={() => setIsPortalDuplicateModalOpen(subsidiary)}
              title="Duplicate"
            >
              <Copy className="size-4  text-blue-700" />
            </button>
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
      <PortalDuplicateModal
        isOpen={isPortalDuplicateModalOpen?.id === subsidiary?.id}
        onClose={() => setIsPortalDuplicateModalOpen(null)}
        handleDuplicate={handleDuplicatePortal}
        setFormData={setDuplicatePortalData}
        formData={duplicatePortalData}
        isLoading={isLoading}
      />
      <PortalCreatedPopup
        isOpen={isPopupOpen}
        portalName={duplicatePortalData?.legalName}
        portalId={sanitizeName(duplicatePortalData?.legalName)}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
};

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

const CreateSubsidiaryButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="h-full min-h-[200px] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-white p-6 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600"
  >
    <Plus size={24} className="mb-2" />
    <span className="text-sm font-medium">Create New Portal</span>
  </button>
);

const SubsidiaryGrid = ({
  isLoading,
  subsidiaries,
  onSelectSubsidiary,
  onCreateNew,
  refreshPortals
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
            {Array.isArray(subsidiaries) && subsidiaries?.slice(0, visibleSubsidiaries).map((subsidiary) => {
                return (
                  <React.Fragment key={subsidiary.id}>
                    <SubsidiaryCard
                      key={subsidiary.id}
                      subsidiary={subsidiary}
                      onSelect={onSelectSubsidiary}
                      refreshPortals={refreshPortals}
                    />
                  </React.Fragment>
                );
              })}
          </div>
          {visibleSubsidiaries < subsidiaries?.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                className="bg-[#0061D5] text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

const AdminDashboardPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  //   const [subsidiaries, setSubsidiaries] = useState([]);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);

  const [filteredSubsidiaries, setFilteredSubsidiaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newPortalName, setNewPortalName] = useState("");
  const [newPortalId, setNewPortalId] = useState("");

  const { data: user } = useSelector((state) => state.user);
  const { data: subsidiaries } = useSelector((state) => state.portal);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSelectSubsidiary = (subsidiary) => {
    router.push(`/admin/portals/${subsidiary.id}`);
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
      if (!response.ok) throw new Error("Failed to fetch portals");
      const data = await response.json();
      const subsidiariesData = data.data;
      dispatch(setPortals(subsidiariesData?.portals));
      dispatch(setActiveUsers(subsidiariesData?.activeUsers));
      //   setSubsidiaries(subsidiariesData.portals);
      setFilteredSubsidiaries(subsidiaries);
    } catch (err) {
      console.error("Error while fetching portals", err);
    } finally {
      setIsPortalLoading(false);
    }
  };

  const sanitizeName = (name) => {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".")
      ? sanitizeName.slice(0, -1)
      : sanitizeName;
  };

  const fetchExistingPages = async (legalName) => {
    try {
      const pluginPayload = {
        type: PluginType.PAGES,
        portalId: sanitizeName(legalName) || "root",
        createdBy: user?.id,
      };
      const pluginResponse = await fetchWrapper(
        "/api/plugins",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pluginPayload),
        },
        "save-plugin"
      );

      if (!pluginResponse.ok) {
        return;
      }

      const savedPluginData = await pluginResponse.json();

      const response = await fetchWrapper(
        "/api/pages/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portalId: sanitizeName(legalName),
            pluginId: savedPluginData?.data?.id,
          }),
        },
        "fetch-page"
      );
    } catch (error) {
      toast.error(error.message);
    }
  };


  const handleCreateSubsidiary = async (formData) => {
    setIsLoading(true);
    try {
      let newSubsidiary = {
        legalName: formData.legalName,
        tradingName: formData.legalName,
        domain: formData.domain,
        status: "setup",
        userCount: 0,
        storageUsed: "0 GB",
        theme: formData.theme || "minimal",
        primaryColor: formData.primaryColor || "#000000",
        secondaryColor: formData.secondaryColor || "#2563eb",
        accentColor: formData.accentColor || "#ffffff",
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
      // const boxResponse = await fetchWrapper(
      //   "/api/box/create-user",
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       userName: formData.adminEmail,
      //       externalId: `user_${Date.now()}`,
      //     }),
      //   },
      //   "create-user-box"
      // );

      // const boxData = await boxResponse.json();

      // if (!boxResponse.ok) {
      //   throw new Error(boxData.error || "Failed to create Box user");
      // }

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
        portal: sanitizeName(formData.legalName) || "",
        isOnboardingRequired: true,
        createdBy: user.id,
        permissions: {
          portalId: sanitizeName(formData.legalName),
          role: UserRole.ADMIN,
        },
        phoneNo: formData.phoneNumber,
        from: "portaCreatedAdmin",
      };

      const UserResponse = await fetchWrapper(
        // "/api/users",
        "/api/users/bulk",
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

      newSubsidiary.portalCreatedAdmin = data?.data?.id

      // Create end user for portal.
      // const boxEndUserResponse = await fetchWrapper(
      //   "/api/box/create-user",
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       userName: `user_${formData.adminEmail}`,
      //       externalId: `user_${Date.now()}`,
      //     }),
      //   },
      //   "create-user-box"
      // );

      // const boxEndUserData = await boxEndUserResponse.json();

      // if (!boxEndUserResponse.ok) {
      //   throw new Error(boxEndUserData.error || "Failed to create Box end user");
      // }

      // const endUser = {
      //   email: `user_${formData.adminEmail}`,
      //   name: `${sanitizeName(formData.legalName)} user`,
      //   title: formData.jobTitle,
      //   companyName: formData.legalName,
      //   role: UserRole.USER,
      //   password: "000",
      //   logo: null,
      //   boxUserId: boxEndUserData.user.userId,
      //   folderId: boxEndUserData.user.folderId,
      //   portal: sanitizeName(formData.legalName) || "",
      //   isOnboardingRequired: false,
      //   createdBy: user.id,
      //   permissions: {
      //     portalId: sanitizeName(formData.legalName),
      //     role: UserRole.USER,
      //   },
      //   phone: formData.phoneNumber
      // }

      // const endUserResponse = await fetchWrapper(
      //   "/api/users",
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(endUser),
      //   },
      //   "save-user"
      // );
      // const endUserData = await endUserResponse.json();
      // if (!endUserResponse.ok) {
      //   throw new Error(endUserData.error || "Failed to create end user data");
      // }

      // Create portal
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

      //   setSubsidiaries((prev) => [...prev, subsidiary.data]);
      dispatch(setPortals([...subsidiaries, subsidiary.data]));
      getPortal();
      await fetchExistingPages(formData.legalName);
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

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
  };

  const handleFilterChange = (selectedFilter) => {
    setFilter(selectedFilter);
  };

  useEffect(() => {
    if (!subsidiaries || subsidiaries?.length === 0) {
      getPortal();
    }
  }, []);

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }

    // setUser(userData);
  }, [router]);

  useEffect(() => {
    const filtered = Array.isArray(subsidiaries) && subsidiaries?.filter((subsidiary) => {
        const matchesSearch = subsidiary.legalName
          .toLowerCase()
          .includes(searchTerm);
        const matchesFilter =
          filter === "all" || subsidiary.createdBy.id === user.id;

        return matchesSearch && matchesFilter;
      });

    setFilteredSubsidiaries(filtered);
  }, [subsidiaries, searchTerm, filter, user]);

  return (
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
                className={`block w-full text-left px-4 py-2 text-sm ${
                  filter === "all" ? "bg-blue-100" : ""
                }`}
              >
                All Portals
              </button>
            </MenuItem>
            <MenuItem>
              <button
                onClick={() => handleFilterChange("my")}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  filter === "my" ? "bg-blue-100" : ""
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
    </>
  );
};

export default AdminDashboardPage;
