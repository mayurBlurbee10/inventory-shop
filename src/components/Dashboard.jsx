"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Settings,
  LogOut,
  Search,
  Folder,
  File,
  X,
  FolderInput,
  Trash2,
  Download,
} from "lucide-react";

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
import { getSession, signOut } from "next-auth/react";
import { setUserData } from "@/lib/auth";
import { toast } from "react-toastify";
import MoveDialog from "./MoveDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

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
  const [session, setSession] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveItem, setMoveItem] = useState(null);
  const [selectedBulkItems, setSelectedBulkItems] = useState([]);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleBrowse = (event) => {
    if (event.type === "click") {
      fileInputRef.current?.click();
    } else {
      handleFileSelect(event);
    }
  };

  const refreshSharedFiles = async (folderId) => {
    try {
      setIsLoading(true);
      const userData = getUserData();
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
      }
    } catch (error) {
      console.error("Error get collaborated folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      try {
        setIsLoading(true);
        const uploadData = new FormData();
        const userData = getUserData();
        files.forEach((file) => {
          uploadData.append("file", file);
        });
        if (!!selectedItem && selectedItem.type == "folder") {
          uploadData.append("boxFolderId", selectedItem.id);
        } else {
          uploadData.append("boxFolderId", userData.boxFolderId);
        }

        uploadData.append("email", userData.email);

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
            Name: 
            ${files.map((file) => file.name)}
          </div>
        </div>
        `;
        setUpladedFilePath(location);
        toast.success("File uploaded successfully");
      } catch (error) {
        toast.error(error.message);
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
          `/api/box/folders?folderId=${userData?.boxFolderId}`,
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
      if (updatedFolder) {
        updatedPath[level] = updatedFolder;
        currentFolder = updatedFolder.children;
      }
    }

    return updatedPath;
  };

  useEffect(() => {
    if (filesList?.length > 0) {
      setPath((prevPath) => updatePath(prevPath, filesList));
      setCurrentFilesList(
        path?.length === 0 ? filesList : path[path.length - 1]?.children || []
      );
    }
  }, [filesList]);

  useEffect(() => {
    if (!searchQuery) {
      setCurrentFilesList(
        path?.length === 0 ? filesList : path[path.length - 1]?.children || []
      );
      setSelectedItem(path.length === 0 ? null : path[path.length - 1]);
    }
  }, [path]);

  const handleLogout = async () => {
    clearUserData();
    await signOut();
    toast.success("User signout successfully");
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
      const data = await response.json();
      if (!data.data && response.status === 404) {
        router.push(`/${params.portalid}/not-found`);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      setConfig(data.data);
      
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const getUserDetailsByEmail = async (email) => {
    try {
      let url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetchUserByEmail");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      setUserData(userData);
      localStorage.setItem("portal", params.portalid);
      localStorage.setItem("accessToken", data.accessToken);
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setSuggestions([]);
      return;
    }

    const results = searchWithPaths(filesList, value);
    setSuggestions(results);
  };

  const searchWithPaths = (nodes, query, currentPath = []) => {
    const results = [];

    nodes.forEach((node) => {
      const newPath = [...currentPath, node]; // Add the current node to the path

      // Check if the node matches the query
      if (node.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          ...node,
          path: newPath, // Store the full path to this node
        });
      }

      // If the node has children, continue searching recursively
      if (node.children && node.children.length > 0) {
        results.push(...searchWithPaths(node.children, query, newPath));
      }
    });

    return results;
  };

  const handleSuggestionClick = (item) => {
    setSearchQuery(item.name);
    // if(item.type !== "folder" ){
    item.path.pop();
    // }
    setPath(item.path);
    setCurrentFilesList([item]);
    setSuggestions([]);
  };

  const handelClearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setCurrentFilesList(filesList);
    setPath([]);
  };

  const handleMove = async (folder) => {
    if (selectedBulkItems.length > 0) {
      handleBulkMove(folder);
    } else {
      const obj = {
        itemId: moveItem.id,
        destinationFolderId: folder.id,
        type: moveItem.type,
      };
      try {
        const requestOptions = {
          method: "POST",
          body: JSON.stringify(obj),
        };
        const response = await fetchWrapper(
          `/api/box/move`,
          requestOptions,
          "moveFileOrFolder"
        );
        if (!response.ok) throw new Error("Failed to move file or folder");
        toast.success(
          `${moveItem.type === "file" ? "File" : "Folder"} moved successfully.`
        );
        setIsMoveModalOpen(false);
        refreshFiles();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

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
      const results = source?.filter((item) =>
        item?.name?.toLowerCase().includes(searchQuery?.toLowerCase())
      );
      setCurrentFilesList(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer); // Cleanup on query or component unmount
  }, [searchQuery, selectedItem]);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      if (sessionData) {
        await getUserDetailsByEmail(sessionData.user.email);
      }
    };
    fetchSession().then(() => {
      const userData = getUserData();
      if (!userData) {
        router.push("login");
        return;
      }

      setUser(userData);
      refreshFiles();
      fetchConfig();
    });
  }, [router]);

  useEffect(() => {
    setIsToolbarVisible(selectedBulkItems.length > 0);
  }, [selectedBulkItems]);

  const handleBulkDelete = async () => {
    const selectedItemsDetails = currentFilesList
      .filter((item) => selectedBulkItems.includes(item.id))
      .map((item) => ({ id: item.id, type: item.type }));
    try {
      const requestOptions = {
        method: "POST",
        body: JSON.stringify({ items: selectedItemsDetails }),
      };
      const response = await fetchWrapper(
        `/api/box/bulk/delete`,
        requestOptions,
        "bulk-delete"
      );
      if (!response.ok) throw new Error("Error bulk deleting files or folders");
      toast.success(`Bulk delete operation completed successfully.`);
      refreshFiles();
      setSelectedBulkItems([]);
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleBulkMove = async (destinationFolder) => {
    const selectedItemsDetails = currentFilesList
      .filter((item) => selectedBulkItems.includes(item.id))
      .map((item) => ({ id: item.id, type: item.type }));
    let obj = {
      items: selectedItemsDetails,
      destinationFolderId: destinationFolder.id,
    };
    try {
      const requestOptions = {
        method: "POST",
        body: JSON.stringify(obj),
      };
      const response = await fetchWrapper(
        `/api/box/bulk/move`,
        requestOptions,
        "bulk-move"
      );
      if (!response.ok) throw new Error("Error bulk move files or folders");
      toast.success(`Bulk move operation completed successfully.`);
      refreshFiles();
      setSelectedBulkItems([]);
      setIsMoveModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handelToolbarMoveClick = () => {
    const selectedItemsDetails = currentFilesList.filter(
      (item) => selectedBulkItems[0] === item.id
    );
    setMoveItem(selectedItemsDetails[0]);
    setIsMoveModalOpen(true);
  };

  const handleDownload = async (fileId = "", fileName = "") => {
    if (selectedBulkItems.length > 0) {
      handleBulkDownload();
    } else {
      try {
        const response = await fetchWrapper(
          `/api/box/download?fileId=${fileId}`,
          {},
          "download"
        );
        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();

        window.URL.revokeObjectURL(url);
        toast.success("File dowloaded successfully");
      } catch (error) {
        toast.error(error.message);
        console.error("Download error:", error);
      }
    }
  };

  // const handleBulkDownload = async () => {
  //   const selectedItemsDetails = currentFilesList
  //     .filter((item) => selectedBulkItems.includes(item.id))
  //     .map((item) => ({ id: item.id, type: item.type, fileName: item.name }));
  //   try {
  //     const requestOptions = {
  //       method: "POST",
  //       body: JSON.stringify({ items: selectedItemsDetails }),
  //     };
  //     const responses = await fetchWrapper(
  //       `/api/box/bulk/download`,
  //       requestOptions,
  //       "bulk-download"
  //     );
  //     if (!responses.ok) throw new Error("Download failed");
  //     const data = await responses.json();
  //     for (const response of data.downloadItems) {
  //       const headers = response.headers;
  //       const contentDisposition = headers.get("Content-Disposition");
  //       if (contentDisposition) {
  //         const match = contentDisposition.match(/filename="(.+?)"/);
  //         if (match && match[1]) {
  //           const fileName = match[1];
  //           const blob = await response.blob();
  //           const url = window.URL.createObjectURL(blob);
  //           const link = document.createElement("a");
  //           link.href = url;
  //           link.download = fileName;
  //           link.click();

  //           window.URL.revokeObjectURL(url);
  //         }
  //       }
  //     }
  //     toast.success("Files dowloaded successfully");
  //   } catch (error) {
  //     toast.error(error.message);
  //     console.error("Download error:", error);
  //   }
  // };

  const handleBulkDownload = async () => {
    const unMatchedType = currentFilesList
      .filter((item) => selectedBulkItems.includes(item.id))
      .filter((item) => item.type === 'folder');

      if(unMatchedType && unMatchedType.length>0){
        toast.error("Selected Item is Folder")
        return;
      }


    const selectedItemsDetails = currentFilesList
      .filter((item) => selectedBulkItems.includes(item.id))
      .map((item) => ({ id: item.id, type: item.type, name: item.name }));

    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: selectedItemsDetails }),
      };

      const response = await fetch(
        `/api/box/bulk/download`,
        requestOptions,
        "download"
      );

      if (!response.ok) throw new Error("Download failed");

      const data = await response.json();

      for (const item of data.downloadItems) {
        const { content, name, contentType } = item;

        // Decode Base64 content into a Blob
        const byteCharacters = atob(content);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        const blob = new Blob(byteArrays, { type: contentType });

        // Trigger the download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      toast.success("Files downloaded successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Download error:", error);
    }
  };

  const clearBulkItem = () => {
    setSelectedBulkItems([]);
  };

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
            userIsAdmin={userIsAdmin}
            sidepanelDropdown={sidepanelDropdown}
            setSidepanelDropdown={setSidepanelDropdown}
            setIsNewFolderModalOpen={setIsNewFolderModalOpen}
            showUploadArea={showUploadArea}
            setShowUploadArea={setShowUploadArea}
            router={router}
            isSettingsOpen={isSettingsOpen}
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
              <div className="relative">
                <div className="max-w-xl w-full mx-auto block relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`relative py-3 pl-14 pr-4 w-full text-sm rounded-tl-[30px] border border-transparent rounded-tr-[30px] text-[#3c4043] bg-indigo-50 focus-visible:outline-none focus-visible:bg-white focus-visible:shadow placeholder:text-[#3c4043]
                      ${
                        suggestions.length === 0
                          ? "rounded-bl-[30px] rounded-br-[30px]"
                          : "border-t-gray-200 border-s-gray-200 border-e-gray-200"
                      }`}
                  />
                  <div className="absolute flex items-center justify-center inset-y-1/2 -translate-y-1/2 left-2 h-9 w-9 rounded-full hover:bg-gray-200">
                    <Search className="h-5 w-5 text-[#3c4043]" />
                  </div>
                  {searchQuery.length > 0 && (
                    <div
                      onClick={handelClearSearch}
                      className="absolute flex items-center justify-center inset-y-1/2 -translate-y-1/2 right-2 h-9 w-9 rounded-full hover:bg-gray-200 cursor-pointer"
                    >
                      <X className="h-5 w-5 text-[#3c4043]" />
                    </div>
                  )}
                </div>
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <ul className="bg-white rounded-md max-w-xl mx-auto border border-gray-200 absolute top-[46px] z-[99] left-1/2 -translate-x-1/2 w-full rounded-bl-[30px] rounded-br-[30px] rounded-tl-none rounded-tr-none">
                    {suggestions.map((item, index) => (
                      <li
                        onClick={() => {
                          handleSuggestionClick(item);
                        }}
                        key={item.id}
                        className={`flex items-center px-4 py-2 hover:bg-gray-100 transition cursor-pointer ${
                          suggestions.length - 1 === index
                            ? "rounded-bl-[30px] rounded-br-[30px]"
                            : ""
                        }`}
                      >
                        <span className="mr-2">
                          {item.type === "folder" ? (
                            <Folder className="h-5 w-5 text-[#3c4043]" />
                          ) : (
                            <File className="h-5 w-5 text-[#3c4043]" />
                          )}
                        </span>
                        <span className="text-gray-700 font-medium">
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <div
                className={`bg-indigo-50 rounded-[50px] mb-4 text-gray-600 py-1 
                ${isToolbarVisible ? "opacity-1" : "opacity-0"}
                `}
              >
                <div className="flex items-center gap-3">
                  <button
                    className="h-8 w-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 ml-1 outline-none"
                    onClick={clearBulkItem}
                  >
                    <X className="size-5" />
                  </button>
                  <p className="text-sm font-medium mr-4 text-[#444746]">
                    {selectedBulkItems.length} item(s) selected
                  </p>
                  <button
                    className="h-8 w-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 outline-none"
                    onClick={() =>
                      selectedBulkItems.length > 0 && handelToolbarMoveClick()
                    }
                  >
                    <FolderInput className="size-5" />
                  </button>
                  <button
                    className="h-8 w-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 outline-none"
                    onClick={() =>
                      selectedBulkItems.length > 0 && handleBulkDownload()
                    }
                  >
                    <Download className="size-5" />
                  </button>
                  {/* <button
                    className="h-8 w-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 outline-none"
                  >
                    <Download className="size-5"/>
                  </button> */}
                  <button
                    className="h-8 w-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 outline-none"
                    onClick={() =>
                      selectedBulkItems.length > 0 && setIsDeleteModalOpen(true)
                    }
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Breadcrumbs
                path={path}
                setPath={setPath}
                setSearchQuery={setSearchQuery}
                setSelectedBulkItems={setSelectedBulkItems}
              />
            </div>
            {/* TABLE START */}
            <div className="overflow-auto h-[calc(100vh-370px)] custom-scrollbar flex-grow">
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
                          <th className="text-start text-[#3c4043] py-2 text-sm"></th>
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
                          <th className="text-start text-[#3c4043] py-2 text-sm">
                            Last Updated
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
                            listType={fileType}
                            setSearchQuery={setSearchQuery}
                            setIsMoveModalOpen={setIsMoveModalOpen}
                            setMoveItem={setMoveItem}
                            setSelectedBulkItems={setSelectedBulkItems}
                            selectedBulkItems={selectedBulkItems}
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
      <DeleteConfirmDialog
        isModalOpen={isDeleteModalOpen}
        setIsModalOpen={setIsDeleteModalOpen}
        handleDelete={handleBulkDelete}
      />
      <MoveDialog
        item={moveItem}
        isModalOpen={isMoveModalOpen}
        setIsModalOpen={setIsMoveModalOpen}
        fileList={filesList}
        handleMove={handleMove}
      />
      <DialogBox
        title="File Uploaded"
        message="File uploaded successfully!"
        fileLocation={uploadedfilePath}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        config={config}
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
