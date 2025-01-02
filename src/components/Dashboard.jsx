"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, LogOut, Search } from "lucide-react";

import { getUserData, clearUserData, isAdmin } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

import EmptyState from "./FileExplorer/EmptyState";
import Header from "./Header";
import Sidepanel from "./Sidepanel";
import Breadcrumbs from "./Breadcrumbs";
import SettingsModal from "./Settings";
import DialogBox from "./DialogBox";
import FolderExplorer from "./FolderExplorer";
import UploadArea from "./UploadArea";
import ActionButtons from "./ActionButtons";

const processBoxFiles = (files) => {
  const itemsMap = new Map();
  const rootItems = [];

  files.forEach((file) => {
    const item = {
      id: file.id,
      name: file.name,
      type: file.type || "file",
      size: file.size,
      created_at: file.created_at,
      modified_at: file.modified_at,
      children: [],
    };
    itemsMap.set(file.id, item);

    if (!file.parent || !itemsMap.has(file.parent?.id)) {
      rootItems.push(item);
    } else {
      const parent = itemsMap.get(file.parent.id);
      parent?.children.push(item);
    }
  });

  return rootItems;
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AccountInfo = ({ user, userIsAdmin }) => (
  <div className="bg-white rounded-xl p-7 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors duration-200">
    <h3 className="text-[22px] font-medium text-gray-900 mb-5">Account Info</h3>
    <div className="space-y-3">
      <p className="text-gray-600 flex justify-between items-center">
        <span className="text-gray-500">Email</span>
        <span className="font-medium">{user?.email}</span>
      </p>
      {user?.boxUserId && (
        <p className="text-gray-600 flex justify-between items-center">
          <span className="text-gray-500">Box ID</span>
          <span className="font-medium">{user.boxUserId}</span>
        </p>
      )}
      {user?.role && (
        <p className="text-gray-600 flex justify-between items-center">
          <span className="text-gray-500">Role</span>
          <span className={`font-medium ${userIsAdmin ? "text-blue-600" : ""}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </p>
      )}
    </div>
  </div>
);

const QuickActions = ({ userIsAdmin, router, handleLogout }) => (
  <div className="bg-white rounded-xl p-7 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors duration-200">
    <h3 className="text-[22px] font-medium text-gray-900 mb-5">
      Quick Actions
    </h3>
    <div className="space-y-2">
      {userIsAdmin && (
        <button
          onClick={() => router.push("/settings")}
          className="w-full py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-left px-4 flex items-center space-x-3 transition-colors duration-200"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      )}
      <button
        onClick={handleLogout}
        className="w-full py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-left px-4 flex items-center space-x-3 transition-colors duration-200"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sign Out</span>
      </button>
    </div>
  </div>
);

function Dashboard({ fileType }) {
  const router = useRouter();
  const params = useParams();
  const [config, setConfig] = useState(null);
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [currentFilesList, setCurrentFilesList] = useState(filesList);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadedfilePath, setUpladedFilePath] = useState("");
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [sidepanelDropdown, setSidepanelDropdown] = useState(false);
  const [path, setPath] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleBrowse = (event) => {
    if (event.type === "click") {
      fileInputRef.current?.click();
    } else {
      handleFileSelect(event);
    }
  };

  const refreshSharedFiles = async (folderId) => {
    console.log("folderid ", folderId);
    try {
      setIsLoading(true);
      console.log("User Api calling");
      const userData = getUserData();
      console.log(userData);
      if (userData?.collaborationIds && userData.collaborationIds.length > 0) {
        const requestOptions = {
          method: "POST",
          body: JSON.stringify({ collaborated: userData.collaborationIds }),
        };
        const response = await fetchWrapper(
          `/api/box/collaborations`,
          requestOptions,
          "fetchCollaboratedFolder"
        );
        if (!response.ok) throw new Error("Failed to get collaborated folder");
        const data = await response.json();
        const newFilesList = data?.items;
        setFilesList(newFilesList);
        console.log("shared files and folder: ", data?.items[0]);
      }
    } catch (error) {
      console.error("Error get collaborated folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      try {
        setIsLoading(true);
        const uploadData = new FormData();
        const userData = getUserData();
        uploadData.append("file", files[0]);
        if (!!selectedItem && selectedItem.type == "folder") {
          uploadData.append("boxFolderId", selectedItem.id);
        } else {
          uploadData.append("boxFolderId", userData.boxFolderId);
        }

        const requestOptions = {
          method: "POST",
          body: uploadData,
        };

        const response = await fetchWrapper(
          "/api/box/files",
          requestOptions,
          "uploadFile"
        );
        if (!response.ok) throw new Error("Failed to upload files");
        setIsModalOpen(true);
        setShowUploadArea(false);
        await refreshFiles();
        const path = getFolderPath(
          filesList,
          selectedItem?.id || userData?.boxFolderId
        );
        const location = `
        <div>
          <div>
            Location: Home${path}
          </div>
          <div>
            Name: ${files[0].name}
          </div>
        </div>
        `;
        setUpladedFilePath(location);
      } catch (error) {
        console.error("Error uploading files:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const refreshFiles = async () => {
    try {
      setIsLoading(true);
      const userData = getUserData();
      const requestOptions = {
        method: "GET",
      };
      if (fileType === "shared") {
        if (
          userData?.collaborationIds &&
          userData.collaborationIds.length > 0
        ) {
          console.log("Inside ");
          const requestOptions = {
            method: "POST",
            body: JSON.stringify({ collaborated: userData.collaborationIds }),
          };
          const response = await fetchWrapper(
            `/api/box/collaborations`,
            requestOptions,
            "fetchCollaboratedFolder"
          );
          if (!response.ok)
            throw new Error("Failed to get collaborated folder");
          const data = await response.json();
          const newFilesList = data?.items;
          setFilesList(newFilesList);
        }
      } else {
        const response = await fetchWrapper(
          `/api/box/folders?folderId=${userData.boxFolderId}`,
          requestOptions,
          "fetchFile"
        );
        if (!response.ok) throw new Error("Failed to fetch files");
        const data = await response.json();
        const newFilesList = data?.items || [];
        setFilesList(newFilesList);
      }
    } catch (error) {
      console.error("Error refreshing files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePath = (prevPath, filesList) => {
    let updatedPath = [...prevPath];
    let currentFolder = filesList;

    // Update the path incrementally
    for (let level = 0; level < updatedPath.length; level++) {
      const folderAtLevel = updatedPath[level];
      // Find the folder in the filesList
      const updatedFolder = currentFolder.find(
        (item) => item.id === folderAtLevel.id
      );
      console.log("updatedFolder : ", updatedFolder);
      if (updatedFolder) {
        updatedPath[level] = updatedFolder;
        currentFolder = updatedFolder.children;
      }
    }

    return updatedPath;
  };

  useEffect(() => {
    if (filesList.length > 0) {
      setPath((prevPath) => updatePath(prevPath, filesList));
      setCurrentFilesList(
        path?.length === 0 ? filesList : path[path.length - 1]?.children || []
      );
    }
  }, [filesList]);

  useEffect(() => {
    setCurrentFilesList(
      path?.length === 0 ? filesList : path[path.length - 1]?.children || []
    );
    setSelectedItem(path.length === 0 ? null : path[path.length - 1]);
  }, [path]);

  const handleLogout = () => {
    clearUserData();
    router.push("login");
  };

  const getFolderPath = (data, folderId, currentPath = "") => {
    for (const item of data) {
      if (item.id === folderId) {
        return currentPath + "/" + item.name;
      }

      if (item.type === "folder" && item.children && item.children.length > 0) {
        const path = getFolderPath(
          item.children,
          folderId,
          currentPath + "/" + item.name
        );
        if (path) {
          return path;
        }
      }
    }
    return "";
  };

  const handleShareLink = (itemId, newSharedLink) => {
    const updateSharedLink = (items) =>
      items.map((item) => {
        if (item.id === itemId) {
          return { ...item, shared_link: newSharedLink };
        }
        if (item.children) {
          return { ...item, children: updateSharedLink(item.children) };
        }
        return item;
      });

    const updatedData = updateSharedLink(currentFilesList);
    setCurrentFilesList(updatedData);
  };

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) return;
      const response = await fetchWrapper(
        `/api/portal?portalid=${params.portalid}`,
        {},
        "portal-login"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setConfig(data.data);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push("/login");
      return;
    }

    setUser(userData);
    // if (userData.boxFiles) {
    //   setFiles(processBoxFiles(userData.boxFiles));
    // }
    refreshFiles();
    fetchConfig();
  }, [router]);

  useEffect(() => {
    setSearchQuery("");
    setCurrentFilesList(
      path.length === 0 ? filesList : path[path.length - 1].children
    );
  }, [path]);

  useEffect(() => {
    if (!searchQuery) {
      setCurrentFilesList(
        path.length === 0 ? filesList : path[path.length - 1].children
      );
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      const source =
        path.length === 0 ? filesList : path[path.length - 1].children;
      const results = source.filter((item) =>
        item?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setCurrentFilesList(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer); // Cleanup on query or component unmount
  }, [searchQuery, selectedItem]);

  if (isLoading) return <LoadingSpinner />;
  const userIsAdmin = isAdmin();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gray-50 flex-1">
        <Header
          user={user}
          config={config}
          userIsAdmin={userIsAdmin}
          router={router}
          accountDropdown={accountDropdown}
          setAccountDropdown={setAccountDropdown}
          handleLogout={handleLogout}
          handelSettings={() => setIsSettingsOpen(true)}
          setIsNewFolderModalOpen={setIsNewFolderModalOpen}
          setShowUploadArea={setShowUploadArea}
        />

        <div className="flex flex-row">
          <Sidepanel
            sidepanelDropdown={sidepanelDropdown}
            setSidepanelDropdown={setSidepanelDropdown}
            setIsNewFolderModalOpen={setIsNewFolderModalOpen}
            showUploadArea={showUploadArea}
            setShowUploadArea={setShowUploadArea}
            router={router}
            handelSettings={() => setIsSettingsOpen(true)}
          />

          <div
            className="bg-white rounded-2xl w-full xl:mr-5 pt-5 pb-3 px-4"
            onClick={() => {
              setSidepanelDropdown(false);
              setAccountDropdown(false);
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg xl:text-2xl text-[#3c4043] font-medium text-center xl:mb-5">
                Welcome, {user.name}
              </h3>
              {/* NEW FOLDER MODEL */}
              <div className="flex items-center gap-3">
                <ActionButtons
                  onFolderCreated={refreshFiles}
                  onUploadClick={() => setShowUploadArea(true)}
                  selectedItem={selectedItem}
                  isModalOpen={isNewFolderModalOpen}
                  setIsModalOpen={setIsNewFolderModalOpen}
                />
              </div>
              {/* UPLOAD FILE */}
              {showUploadArea && (
                <div className="mb-6">
                  <UploadArea
                    isForImport={false}
                    onBrowse={handleBrowse}
                    onClose={() => setShowUploadArea(false)}
                  />
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                multiple
              />
              {/* Search BoX */}
              <div>
                <div className="max-w-xl w-full mx-auto block relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="relative py-3 pl-14 pr-4 w-full rounded-full text-[#3c4043] bg-indigo-50 focus-visible:outline-none focus-visible:bg-white focus-visible:shadow placeholder:text-[#3c4043]"
                  />
                  <div className="absolute flex items-center justify-center inset-y-1/2 -translate-y-1/2 left-2 h-9 w-9 rounded-full hover:bg-gray-200">
                    <Search className="h-5 w-5 text-[#3c4043]" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Breadcrumbs path={path} setPath={setPath} />
            </div>
            {/* TABLE START */}
            <div className="overflow-auto h-[calc(100vh-248px)] custom-scrollbar flex-grow">
              <div className="bg-white xl:pr-1">
                <table className="min-w-full divide-y divide-gray-200 overflow-auto">
                  {!currentFilesList || currentFilesList?.length === 0 ? (
                    <thead>
                      <tr>
                        <th>
                          <EmptyState />
                        </th>
                      </tr>
                    </thead>
                  ) : (
                    <>
                      <thead className="hidden md:table-header-group">
                        <tr>
                          <th className="text-start text-[#3c4043] py-2 text-sm">
                            Name
                          </th>
                          {/* <th className="text-start text-[#3c4043] py-2 text-sm">
                            Reason suggested
                          </th> */}
                          <th className="text-start text-[#3c4043] py-2 text-sm">
                            Owner
                          </th>
                          <th className="text-start text-[#3c4043] py-2 text-sm">
                            Location
                          </th>
                          <th className="py-2 text-sm"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <>
                          <FolderExplorer
                            fileList={filesList}
                            setPath={setPath}
                            path={path}
                            currentFilesList={currentFilesList}
                            setCurrentFilesList={setCurrentFilesList}
                            setSelectedItem={setSelectedItem}
                            selectedItem={selectedItem}
                            onFileChanges={refreshFiles}
                          />
                        </>
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            </div>
            {/* TABLE END */}
          </div>
        </div>
      </div>
      <DialogBox
        title="File Uploaded"
        message="File uploaded successfully!"
        fileLocation={uploadedfilePath}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      {/* <TechSupport
        isOpen={isTechSupportModalOpen}
        onClose={() => setIsTechSupportModalOpen(false)}
      /> */}
    </div>
  );
}

export default Dashboard;
