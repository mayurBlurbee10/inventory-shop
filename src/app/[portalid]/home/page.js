"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Settings,
  LogOut,
  Plus,
  FilePlus,
  FolderPlus,
  House,
  UsersRound,
  CircleUserRound,
  Search,
  File,
  Eye,
  Download,
  Share2,
  EllipsisVertical,
  Trash2,
  ChevronRight,
  Upload,
  FileIcon,
} from "lucide-react";
import ActionButtons from "@/components/ActionButtons";
import UploadArea from "@/components/UploadArea";
import Footer from "@/components/Footer";
import { getUserData, clearUserData, isAdmin } from "@/app/lib/auth";
import DialogBox from "@/components/DialogBox";
// import { fetchWrapper } from "../lib/fetchWrapper";
import FolderExplorer from "@/components/FolderExplorer";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import SettingsModal from "@/components/Settings";

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



const Header = ({
  user,
  userIsAdmin,
  router,
  handleLogout,
  accountDropdown,
  setAccountDropdown,
  config,
  handelSettings,
}) => (
  <header className=" border-gray-100 py-2">
    <div className="px-8 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* <img src="/logo.png" alt="Wealthportal" className="h-12 w-auto" /> */}
        <img src={config?.logo} alt="Premierportal" className="h-12 w-auto" />
      </div>

      <div className="flex items-center space-x-8">
        <div
          className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
          onClick={() => setAccountDropdown((prev) => !prev)}
        >
          {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${
              userIsAdmin ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-medium">{user?.name}</span>
            {userIsAdmin && (
              <span className="text-blue-600 text-sm font-medium">
                Administrator
              </span>
            )}
          </div>

          {/* DROPDOWN SECTION DONE*/}
          {accountDropdown && (
            <div className="absolute top-16 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
              <button className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200">
                <CircleUserRound className="h-5 w-5" /> Account Info
              </button>
              <button
                onClick={handelSettings}
                className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
              >
                <Settings className="h-5 w-5" />
                Settings
              </button>
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
  </header>
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

const Sidepanel = ({
  sidepanelDropdown,
  setSidepanelDropdown,
  setIsNewFolderModalOpen,
  setShowUploadArea,
  router,
  handelSettings,
}) => (
  <div className="max-w-[260px] w-full">
    <div className="p-4">
      <div className="relative">
        {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
        <button
          className="flex items-center gap-2 py-3 px-5 mb-4 bg-white rounded-lg custom-shadow text-gray-800 group hover:bg-blue-100 transition-all ease-in-out duration-100 relative"
          onClick={() => setSidepanelDropdown((prev) => !prev)}
        >
          <Plus /> New
        </button>

        {/* DROPDOWN SECTION Done*/}
        {sidepanelDropdown && (
          <div className="absolute top-16 overflow-hidden left-0 max-w-52 w-full bg-white shadow py-2">
            {/* <div className="pb-2 border-b-gray-300  border-b"> */}
            {/* <button className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100">
                <FilePlus className="h-5 w-5" />
                New document
              </button> */}

            <button
              className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100"
              onClick={() => setIsNewFolderModalOpen((prev) => !prev)}
            >
              <FolderPlus className="h-5 w-5" />
              New folder
            </button>
            <button
              className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100"
              onClick={() => setShowUploadArea((prev) => !prev)}
            >
              <Upload className="h-5 w-5" />
              Upload
            </button>
            {/* </div> */}
            {/* <div className="pt-2">
              <button className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100">
                <Upload className="h-5 w-5" />
                Upload
              </button>
            </div> */}
          </div>
        )}

        <button
          className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1 active:bg-sky-200 active:text-sky-800"
          onClick={() => router.push("/home")}
        >
          <House className="h-5 w-5" /> Home
        </button>

        <button
          className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1"
          onClick={() => router.push("sharewithme")}
        >
          <UsersRound className="h-5 w-5" /> Shared with me
        </button>

        <button
          className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1"
          onClick={handelSettings}
        >
          <Settings className="h-5 w-5" /> Settings
        </button>
      </div>
    </div>
  </div>
);

export default function HomePage() {
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
  const [deleteDropdown, setDeleteDropdown] = useState(null);
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

  const EmptyState = () => (
    <div className="flex flex-col w-full items-center justify-center py-12 text-gray-500">
      <FileIcon size={48} className="mb-4 opacity-50" />
      <p>No files or folders found</p>
    </div>
  );

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      try {
        setIsLoading(true);
        const uploadData = new FormData();
        uploadData.append("file", files[0]);
        if (!!selectedItem && selectedItem.type == "folder") {
          uploadData.append("boxFolderId", selectedItem.id);
        } else {
          const userData = getUserData();
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
          selectedItem.id || userData.boxFolderId
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
      const response = await fetchWrapper(
        `/api/box/folders?folderId=${userData.boxFolderId}`,
        requestOptions,
        "fetchFile"
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      const newFilesList = data?.items || [];
      setFilesList(newFilesList);
    } catch (error) {
      console.error("Error refreshing files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePath = (prevPath, filesList) => {
    let updatedPath = [...prevPath]; 
    let currentFolder = updatedPath[updatedPath.length - 1];

    // Update the path incrementally
    for (let level = 0; level < updatedPath.length; level++) {
      const folderAtLevel = updatedPath[level];
      // Find the folder in the filesList
      const updatedFolder = filesList.find(
        (item) => item.id === folderAtLevel.id
      );
      if (updatedFolder) {
        updatedPath[level] = updatedFolder;
      }
    }

    return updatedPath;
  };

  console.log(path);

  useEffect(() => {
    if (filesList.length > 0) {
      setPath((prevPath) => updatePath(prevPath, filesList));
      setCurrentFilesList(
        path?.length === 0 ? filesList : path[path.length - 1]?.children || []
      );
    }
  }, [filesList]);

  const handleLogout = () => {
    clearUserData();
    router.push("/login");
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

  const Breadcrumbs = () => {
    const handleBreadcrumbClick = (index) => {
      setPath((prev) => prev.slice(0, index + 1));
    };

    return (
      <nav className="flex items-center text-gray-500 text-base space-x-1 py-1.5">
        <button
          onClick={() => setPath([])}
          className="text-gray-700 transition-colors font-semibold hover:text-gray-950"
        >
          My Files
        </button>
        {path &&
          path.length > 0 &&
          path.map((p, index) => (
            <div key={p.id} className="flex items-center">
              <ChevronRight className="h-5 w-5" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="text-gray-700 transition-colors font-semibold hover:text-gray-950"
              >
                {p.name}
              </button>
            </div>
          ))}

        {/* {path.map((folder, index) => (
          <React.Fragment key={index}>
            <span>/</span>
            <button
              onClick={() => onNavigate(path.slice(0, index + 1))}
              className="text-gray-700 transition-colors"
            >
              {folder}
            </button>       
          </React.Fragment>
        ))} */}
      </nav>
    );
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
    } finally {
      setIsLoading(false);
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
          userIsAdmin={userIsAdmin}
          router={router}
          accountDropdown={accountDropdown}
          setAccountDropdown={setAccountDropdown}
          handleLogout={handleLogout}
          config={config}
          handelSettings={() => setIsSettingsOpen(true)}
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
            className="bg-white rounded-2xl w-full mr-5 pt-5 pb-3 px-4"
            onClick={() => {
              setSidepanelDropdown(false);
              setAccountDropdown(false);
            }}
          >
            <div className="mb-4">
              <h3 className="text-2xl text-[#3c4043] font-medium text-center mb-5">
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
              <Breadcrumbs />
            </div>
            {/* TABLE START */}
            <div className="overflow-auto h-[calc(100vh-248px)] custom-scrollbar">
              <div className="bg-white pr-1">
                <table className="min-w-full divide-y divide-gray-200 overflow-auto">
                {currentFilesList && currentFilesList?.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <>
                      <thead>
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
                        </tr>
                      </thead>
                      <tbody>
                        <>
                          <FolderExplorer
                            fileList={filesList}
                            deleteDropdown={deleteDropdown}
                            setDeleteDropdown={setDeleteDropdown}
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
    </div>
  );
}
