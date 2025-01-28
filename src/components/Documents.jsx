"use client";
import Dashboard from "@/components/Dashboard";
import * as React from "react";
import Footer from "@/components/Footer";
import LinearProgress from "@mui/material/LinearProgress";
import ActionButtons from "@/components/ActionButtons";

import {
  AlignJustify,
  Folder,
  File,
  Minus,
  Plus,
  RotateCw,
  X,
  FolderInput,
  Download,
  Trash2,
  CircleUserRound,
  Settings,
  Headset,
  LogOut,
} from "lucide-react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getUserData, setUserData } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import SharedFolderExplorer from "@/components/MyDocumentsExplorer";
import UploadArea from "@/components/UploadArea";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import DialogBox from "@/components/DialogBox";
import SettingsModal from "@/components/Settings";
import MoveDialog from "@/components/MoveDialog";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { clearUserData } from "@/app/lib/auth";
import { getSession, signOut } from "next-auth/react";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import TechSupport from "@/components/TechSupport";
import CreateFolder from "./CreateFolder";

function Documents({ fileType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenNewFolderDrawer, setIsOpenNewFolderDrawer] = useState(false);
  const [isOpenCreateFolderModal, setIsOpenCreateFolderModal] = useState(false);
  const [isOpenUploadArea, setIsOpenUploadArea] = useState(false);
  const [filesList, setFilesList] = useState(null);
  const [filteredFilesList, setFilteredFilesList] = useState(filesList);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [path, setPath] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cols, setCols] = useState(1);
  const [view, setView] = useState("list");
  const [suggestions, setSuggestions] = useState([]);
  const [currentFilesList, setCurrentFilesList] = useState(filesList);
  const [isSearching, setIsSearching] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [selectedBulkItems, setSelectedBulkItems] = useState([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [moveItem, setMoveItem] = useState(null);
  const [uploadedfilePath, setUpladedFilePath] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [content, setContent] = useState(null);
  const params = useParams();
  const [footerLoading, setFooterLoading] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isTechSupportModalOpen, setIsTechSupportModalOpen] = useState(false);
  const [session, setSession] = useState(null);
  const pathname = usePathname();

  const handleBrowse = (event) => {
    if (event.type === "click") {
      fileInputRef.current?.click();
    } else {
      handleFileSelect(event);
    }
  };

  const router = useRouter();

  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    setCols(value);

    // Calculate percentage for the custom CSS variable
    const percentage = ((5 - value) / 4) * 100; // 5 should be 0%, 1 should be 100%
    e.target.style.setProperty("--value-percent", percentage);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    setIsLoading(true);
    try {
      const userData = getUserData();
      let obj = {
        name: folderName,
        boxFolderId: userData.boxFolderId,
      };
      console.log(selectedItem);
      if (!!selectedItem && selectedItem.type == "folder") {
        obj.boxFolderId = selectedItem.id;
      }
      const response = await fetchWrapper(
        "/api/box/folders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(obj),
        },
        "create-folder"
      );

      const folderResponse = await response.json();

      if (!response.ok)
        throw new Error(folderResponse.error || "Failed to create folder");

      setShowSuccess(true);
      setFolderName("");
      // Reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setIsModalOpen(false);
        onFolderCreated();
      }, 3000);
      toast.success("Folder created successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error creating folder:", error);
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
      setFilteredFilesList(
        path?.length === 0 ? filesList : path[path.length - 1]?.children || []
      );
    }
  }, [filesList]);

  useEffect(() => {
    // if (!searchQuery) {
    setFilteredFilesList(
      path?.length === 0 ? filesList : path[path.length - 1]?.children || []
    );
    setSelectedItem(path.length === 0 ? null : path[path.length - 1]);
    // }
  }, [path]);

  const NavBarItem = ({ title, href }) => {
    if (!href) {
      console.error("href prop is required for NavBarItem.");
      return null;
    }

    return (
      <Link href={href} passHref>
        <button
          className={`px-6 py-2 text-black hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm ${
            pathname.includes(href) ? "text-blue-300" : ""
          }`}
        >
          {title}
        </button>
      </Link>
    );
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
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

  useEffect(() => {
    // If no searchQuery, reset the currentFilesList to either filesList or path's last child
    if (!searchQuery) {
      setCurrentFilesList(
        path.length === 0 ? filesList : path[path.length - 1].children
      );
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Recursive function to search the entire file structure
    const recursiveSearch = (files) => {
      let results = [];
      files.forEach((file) => {
        // If file name starts with the search query (case-insensitive), add it to results
        if (file?.name?.toLowerCase().startsWith(searchQuery.toLowerCase())) {
          results.push(file);
        }

        // If the file has children, recursively search through them
        if (file?.children && file.children.length > 0) {
          results = [...results, ...recursiveSearch(file.children)];
        }
      });
      return results;
    };

    // Debounce logic: wait for 300ms after user stops typing
    const timer = setTimeout(() => {
      const source =
        path.length === 0 ? filesList : path[path.length - 1].children;
      const results = recursiveSearch(source); // Perform the recursive search
      setCurrentFilesList(results); // Set the filtered results
      setIsSearching(false);
    }, 300);

    // Cleanup function to clear the timer
    return () => clearTimeout(timer);
  }, [searchQuery, selectedItem, filesList, path]);

  const getFolderPath = (data, folderId, currentPath = "") => {
    if (!Array.isArray(data)) {
      console.error("Invalid data: Expected an array of folder items");
      return "";
    }

    for (const item of data) {
      if (item && item.id === folderId) {
        return currentPath + "/" + (item.name || "Unnamed Folder");
      }

      if (
        item &&
        item.type === "folder" &&
        Array.isArray(item.children) &&
        item.children.length > 0
      ) {
        const path = getFolderPath(
          item.children,
          folderId,
          currentPath + "/" + (item.name || "Unnamed Folder")
        );
        if (path) {
          return path;
        }
      }
    }

    return "";
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

  const handleBulkDownload = async () => {
    console.log("currentFileList", currentFilesList);
    console.log("selectedFileList", selectedBulkItems);

    const unMatchedType = currentFilesList
      .filter((item) => selectedBulkItems.includes(item.id))
      .filter((item) => item.type === "folder");

    if (unMatchedType && unMatchedType.length > 0) {
      toast.error("Selected Item is Folder");
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

  const handleLogout = async () => {
    clearUserData();
    await signOut();
    toast.success("User signout successfully");
    router.push("login");
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetchWrapper(
          `/api/portal?portalid=${params.portalid || "default"}`,
          {},
          "portal-login"
        );
        const data = await response.json();
        if (!data.data && response.status === 404) {
          router.push(`/${params.portalid}/not-found`);
          return;
        }
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch portal config");
        }
        setConfig(data.data);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setFooterLoading(false);
      }
    };
    fetchConfig();
    fetchContent();
  }, []);

  const filterValue = (title) => {
    if (!content) return null;
    const contentItem = content.portalContent.find(
      (item) => item.title === title
    );
    const value = contentItem ? contentItem.value : null;

    if (!value) {
      const defaultItem = content.defaultContent.find(
        (item) => item.title === title
      );
      return defaultItem ? defaultItem.value : null;
    }
    return value;
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const response = await fetchWrapper(
      `/api/contentManagement?portalId=${params.portalid ?? "default"}`,
      { method: "GET" },
      "fetchContentManagement"
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch Content Management");
    }
    setContent(data);
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

      //   fetchConfig();
    });
  }, [router]);

  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // if (!config || !content) return <LoadingSpinner />;
  const userIsAdmin = isAdmin();

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-[#0000001a]">
        <div className="max-w-[1140px] mx-auto px-3">
          <nav className="flex justify-between items-center bg-secondary py-2">
            <a className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
              {user?.company?.logo || config?.logo ? (
                <img
                  src={
                    user?.company?.logo
                      ? user.company.logo.replace("/api/upload", "/uploads")
                      : config?.logo || "/default_logo_purple.png"
                  }
                  alt={params.portalid}
                  className="h-[52px] mr-2"
                />
              ) : (
                // Skeleton for logo
                <div className="h-[52px] w-[52px] mr-2 bg-gray-300 animate-pulse rounded" />
              )}

              <span className="text-3xl text-[#000000e6] mb-1 font-lato">
                {filterValue("Header Text") || params.portalId ? (
                  filterValue("Header Text") || params.portalId
                ) : (
                  // Skeleton for header text
                  <div className="w-[200px] h-[50px] bg-gray-200 animate-pulse rounded" />
                )}
              </span>
            </a>

            <div className="hidden md:flex space-x-4 items-center">
              <NavBarItem title="Dashboard" href="dashboard" />
              <NavBarItem title="My Documents" href="my-docs" />
              <NavBarItem title="Shared Documents" href="shared-docs" />

              {userIsAdmin && (
                // <NavBarItem title="Settings" href='settings' />
                <button
                  className="px-6 py-2 text-black hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  Settings
                </button>
              )}

              {/* Profile dropdown */}

              <div className="flex items-center space-x-8 cursor-pointer">
                <div
                  className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
                  onClick={() => setAccountDropdown((prev) => !prev)}
                >
                  {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                  <div
                    className={`size-8 xl:size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${
                      userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex flex-col text-sm xl:text-base">
                    <span className="text-gray-900 font-medium">
                      {user?.name}
                    </span>
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
                      {userIsAdmin && (
                        <button
                          onClick={() => setIsSettingsOpen(true)}
                          className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                        >
                          <Settings className="h-5 w-5" />
                          Settings
                        </button>
                      )}
                      {userIsAdmin && (
                        <button
                          onClick={() =>
                            setIsTechSupportModalOpen((prev) => !prev)
                          }
                          className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                        >
                          <Headset className="h-5 w-5" />
                          Tech Support
                        </button>
                      )}
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

              {/* <div className="relative">
                    <button className="flex items-center justify-center gap-1 text-black p-2 rounded-md hover:bg-gray-100 transition-all ease-in-out duration-200" onClick={toggleDropdown}>
                      <div
                        className={`w-8 h-8 xl:w-10 xl:h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                          }`}
                      >
                        {user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex flex-col text-sm xl:text-base">
                        <span className="text-gray-900 font-medium">{user?.name}</span>
                        {userIsAdmin && (
                          <span className="text-blue-600 text-sm font-medium">
                            Administrator
                          </span>
                        )}
                      </div>
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="currentColor"
                        >
                          <path d="M12 16L6 10H18L12 16Z"></path>
                        </svg>
                      </span>
                    </button>
    
                    
                    <div
                      className={`absolute top-[50px] right-0 w-48 bg-white py-3 rounded-md border border-[#e8e8e8] ${isOpen ? 'block' : 'invisible'}`}
                    >
                      <ul>
                        <li>
                          <button className="p-3 w-full text-base text-start font-lato text-[#212529] font-normal hover:bg-gray-50 transition-all ease-in-out duration-100">
                            Advisor view
                          </button>
                        </li>
                        <li>
                          <button
                            className="p-3 w-full text-base text-start font-lato text-[#212529] font-normal hover:bg-gray-50 transition-all ease-in-out duration-100"
                            onClick={handleLogout}
                          >
                            Logout
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div> */}

              {/* Edit button */}
              <button className="h-5 w-5 rounded-sm text-white bg-[#17a2b8] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="currentColor"
                >
                  <path d="M12.8995 6.85453L17.1421 11.0972L7.24264 20.9967H3V16.754L12.8995 6.85453ZM14.3137 5.44032L16.435 3.319C16.8256 2.92848 17.4587 2.92848 17.8492 3.319L20.6777 6.14743C21.0682 6.53795 21.0682 7.17112 20.6777 7.56164L18.5563 9.68296L14.3137 5.44032Z"></path>
                </svg>
              </button>
            </div>
            <button className="md:hidden text-text">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>

      {/* Shared documents */}
      <div className="max-w-[1820px] mx-auto pt-12 mt-12">
        <div>
          <div className="grid grid-cols-5 px-4 gap-7">
            <div className="col-span-5 lg:col-span-3">
              <div className="flex items-center gap-10">
                <span className="text-xl font-light text-[#212529] font-lato">
                  {listType === "shared" ? "Shared Documents" : "My Documents"}
                </span>
                <span className="text-black font-lato font-normal text-sm">
                  Securely share content with your advisor and trusted
                  collaborators
                </span>
              </div>
              <hr className="my-4" />
              <div className="border border-solid border-[#0000001a] rounded-sm relative">
                <div className="border-b border-solid border-[#0000001a]">
                  <div className="py-[18px] flex items-center w-full px-5 bg-gray-50">
                    {/* <img src={
                          user?.company?.logo
                            ? user.company.logo.replace("/api/upload", "/uploads")
                            : config?.logo || "/default_logo_purple.png"
                        }
                          alt={config?.legalName}
                          className="h-8 w-8" /> */}

                    {user?.company?.logo || config?.logo ? (
                      <img
                        src={
                          user?.company?.logo
                            ? user.company.logo.replace(
                                "/api/upload",
                                "/uploads"
                              )
                            : config?.logo || "/default_logo_purple.png"
                        }
                        alt={params.portalid}
                        className="h-8 w-8"
                      />
                    ) : (
                      // Skeleton for logo
                      <div className="h-8 w-8 mr-2 bg-gray-300 animate-pulse rounded" />
                    )}

                    <input
                      type="search"
                      placeholder="Search file and folders"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={
                        "relative border w-full mx-4 h-9 rounded-md shadow-inner pl-4 text-sm outline-none focus:outline-1 focus:outline-blue-500 focus:outline-offset-0 pr-4"
                      }
                    />

                    {/* {searchQuery.length > 0 && (
                          <div
                            onClick={handelClearSearch}
                            className="absolute flex items-center justify-center inset-y-1/2 -translate-y-1/2 right-2 h-9 w-9 rounded-full hover:bg-gray-200 cursor-pointer"
                          >
                            <X className="h-5 w-5 text-[#3c4043]" />
                          </div>
                        )} */}

                    {/* Suggestions */}
                    {/* {suggestions.length > 0 && (
                        <ul className="bg-white rounded-md mx-auto border border-gray-200 relative py-2 top-[-15px] z-[99] left-1/2 -translate-x-1/2  rounded-bl-none rounded-br-none rounded-tl-none rounded-tr-none">
                          {suggestions.map((item, index) => (
                            <li
                              onClick={() => {
                                handleSuggestionClick(item);
                              }}
                              key={item.id}
                              className={`flex items-center px-4 py-2 hover:bg-gray-100 transition cursor-pointer ${suggestions.length - 1 === index
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
                      )} */}

                    {suggestions.length > 0 && (
                      <ul className="bg-white rounded-md mx-auto border border-gray-200 relative py-2 top-[-15px] z-[99] left-1/2 -translate-x-1/2  rounded-bl-none rounded-br-none rounded-tl-none rounded-tr-none">
                        {suggestions.map((item, index) => (
                          <li
                            onClick={() => {
                              handleSuggestionClick(item);
                            }}
                            key={item.id}
                            className={`flex items-center px-4 py-2 hover:bg-gray-100 transition relative cursor-pointer`}
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
                    className={`bg-indigo-50 rounded-[50px] text-gray-600 py-1 mt-3
                         ${isToolbarVisible ? "opacity-1" : "hidden"}
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
                          selectedBulkItems.length > 0 &&
                          handelToolbarMoveClick()
                        }
                      >
                        <FolderInput className="size-5" />
                      </button>
                      <button
                        className="h-8 w-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 outline-none"
                        onClick={
                          () =>
                            selectedBulkItems.length > 0 && handleBulkDownload()
                          // console.log("selectedBulkItems", selectedBulkItems)
                        }
                      >
                        <Download className="size-5" />
                      </button>
                      <button
                        className="h-8 w-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 outline-none"
                        onClick={() =>
                          selectedBulkItems.length > 0 &&
                          setIsDeleteModalOpen(true)
                        }
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* breadcrumbs */}
                <div className="px-5 border-b">
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      {/* <nav className="flex items-center text-gray-500 text-sm xl:text-sm space-x-1 py-1.5">
                            <button className="text-gray-500 transition-colors font-normal hover:text-gray-950 font-lato">
                              emailID
                            </button>
    
                            <div className="flex items-center">
                              <ChevronRight className="h-5 w-5" />
                              <button className="text-gray-500 transition-colors text-sm font-normal hover:text-gray-950 font-lato">
                                Folder name
                              </button>
                            </div>
                          </nav>  */}
                      <Breadcrumbs
                        path={path}
                        setPath={setPath}
                        setSearchQuery={setSearchQuery}
                        user={user}
                        setSelectedBulkItems={setSelectedBulkItems}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        {/* Grid range */}
                        {view === "grid" && (
                          <div className="flex items-center justify=-center gap-2">
                            <button
                              className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200"
                              onClick={() =>
                                setCols((prev) => Math.max(prev - 1, 1))
                              }
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                            <input
                              type="range"
                              min="1" // Set the minimum value for the range
                              max="5" // Set the maximum value for the range
                              value={cols} // Bind the current value of `cols` to the input
                              onChange={(e) => handleSliderChange(e)} // Update `cols` when the range slider changes
                              className="w-32 range-slider" // Optional styling for the slider width
                            />

                            <button
                              className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200"
                              onClick={() =>
                                setCols((prev) => Math.min(prev + 1, 5))
                              }
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        )}

                        {/* Card view button */}
                        <button
                          className={`hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200 ${
                            view === "grid" ? "hidden" : "visible"
                          }`}
                          onClick={() => {
                            setView("grid");
                            // setIsOpenOptionDrawer(false);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="currentColor"
                          >
                            <path d="M22 12.999V20C22 20.5523 21.5523 21 21 21H13V12.999H22ZM11 12.999V21H3C2.44772 21 2 20.5523 2 20V12.999H11ZM11 3V10.999H2V4C2 3.44772 2.44772 3 3 3H11ZM21 3C21.5523 3 22 3.44772 22 4V10.999H13V3H21Z"></path>
                          </svg>
                        </button>

                        {/* List view button */}
                        <button
                          className={`hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200  ${
                            view === "list" ? "hidden" : "visible"
                          }`}
                          onClick={() => {
                            setView("list");
                            // setIsOpenOptionDrawer(false);
                          }}
                        >
                          <AlignJustify />
                        </button>

                        {/* Upload items */}
                        <div className="relative">
                          <button
                            className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200"
                            onClick={() =>
                              setIsOpenNewFolderDrawer((prev) => !prev)
                            }
                          >
                            <Plus />
                          </button>

                          {isOpenNewFolderDrawer && (
                            <div className="absolute top-[50px] z-20 right-0 w-48 bg-white shadow-md p-3 rounded-md">
                              <ul>
                                <li>
                                  <button
                                    className="p-3 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300"
                                    onClick={() => {
                                      setIsOpenNewFolderDrawer(false); // Close the drawer
                                      setIsOpenUploadArea((prev) => !prev); // Toggle upload area
                                    }}
                                  >
                                    Upload
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="p-3 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300"
                                    onClick={() => {
                                      setIsOpenNewFolderDrawer(false); // Close the drawer
                                      setIsNewFolderModalOpen((prev) => !prev);
                                    }}
                                  >
                                    New Folder
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isNewFolderModalOpen && (
                  <div className="absolute top-[50%] left-[50%]">
                    <CreateFolder
                      onFolderCreated={refreshFiles}
                      onUploadClick={() => setShowUploadArea(true)}
                      selectedItem={selectedItem}
                      isModalOpen={isNewFolderModalOpen}
                      setIsModalOpen={setIsNewFolderModalOpen}
                    />
                  </div>
                )}

                {isOpenUploadArea && (
                  <div className="mb-6">
                    <UploadArea
                      isForImport={false}
                      onBrowse={handleBrowse}
                      onClose={() => setIsOpenUploadArea(false)}
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

                <div className={` ${isLoading == true ? "visible" : "hidden"}`}>
                  <LinearProgress />
                </div>

                {/* Table in list view */}

                <SharedFolderExplorer
                  fileList={filesList}
                  setPath={setPath}
                  path={path}
                  currentFilesList={currentFilesList}
                  setCurrentFilesList={setCurrentFilesList}
                  setSelectedItem={setSelectedItem}
                  selectedItem={selectedItem}
                  handleShareLink={() => {}}
                  onFileChanges={refreshFiles}
                  listType={"shared"}
                  setSearchQuery={setSearchQuery}
                  view={view}
                  cols={cols}
                  setSelectedBulkItems={setSelectedBulkItems}
                  selectedBulkItems={selectedBulkItems}
                  setIsMoveModalOpen={setIsMoveModalOpen}
                  setMoveItem={setMoveItem}
                  setIsNewFolderModalOpen={setIsNewFolderModalOpen}
                />

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
                />
                <SettingsModal
                  isOpen={isSettingsOpen}
                  onClose={() => setIsSettingsOpen(false)}
                />
                <TechSupport
                  isOpen={isTechSupportModalOpen}
                  onClose={() => setIsTechSupportModalOpen(false)}
                />

                {/* {view === "abc" && (
                      <div className="min-h-[450px]">
                        <table className="min-w-full divide-y divide-gray-200 overflow-auto">
                          {!filteredFilesList || filteredFilesList?.length === 0 ? (
                            <thead>
                              <tr>
                                <th>
                                  <EmptyState />
                                </th>
                              </tr>
                            </thead>
                          ) : (
                            <>
                              <thead className="custom-box-shadow">
                                <tr>
                                  <th></th>
                                  <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                                    <div className="flex items-center justify-start gap-2  mx-4">
                                      <span className="block">Name</span>
                                      <button className="flex items-center justify-center">
                                        <ChevronUp className="h-4 w-4" />
                                      </button>
                                      <button className="flex items-center justify-center">
                                        <ChevronDown className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </th>
                                  <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                                    <span className="block mx-4">Modified</span>
                                  </th>
                                  <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                                    <span className="block mx-4">Size</span>
                                  </th>
                                </tr>
                              </thead>
    
                              <tbody className="w-full divide-y divide-y-gray-200">
                               
                              </tbody>
                            </>
                          )}
                        </table>
                      </div>
                    )} */}

                {/* Table in card view */}
                {/* {view === "abc" && (
                      <div>
                        <div className={`grid grid-cols-${6 - cols} gap-5`}>
                          <div className="p-2 max-w-[356px]">
                          <div className="border border-[#e8e8e8] card-shadow hover:border-sky-500">
                            <div className="min-h-48 flex items-center justify-center bg-[#fbfbfb]">
                              <div className="max-h-24 max-w-[80px] h-full w-full">
                                <Folder className="flex-auto h-full w-full text-blue-500" />
                              </div>
                            </div>
                            <div className="py-2 px-2.5">
                              <div className="flex items-center justify-between">
                                <h6 className="text-sm font-medium text-black font-lato">
                                  Loans
                                </h6>
    
                                <div className="relative">
                                  <button
                                    className="text-gray-600 hover:bg-gray-100 rounded-md px-3"
                                    onClick={() =>
                                      setIsOpenOptionDrawer((prev) => !prev)
                                    }
                                  >
                                    <Ellipsis />
                                  </button>
                                  {isOpenOptionDrawer && (
                                    <div className="absolute top-7 right-0 w-32 bg-white shadow-md p-3 rounded-md border border-[#e8e8e8]">
                                      <ul>
                                        <li>
                                          <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                            Delete
                                          </button>
                                        </li>
                                        <li>
                                          <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                            Rename
                                          </button>
                                        </li>
                                        <li>
                                          <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                            Share
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 font-lato">
                                Modified today by Wealthportal Service Account
                              </p>
                              <p className="text-xs text-gray-500 font-lato ">
                                100.7 KB
                              </p>
                            </div>
                          </div>
                          <div className="border border-[#e8e8e8] card-shadow hover:border-sky-500">
                            <div className="min-h-48 flex items-center justify-center bg-[#fbfbfb]">
                              <div className="max-h-24 max-w-[80px] h-full w-full">
                                <Folder className="flex-auto h-full w-full text-blue-500" />
                              </div>
                            </div>
                            <div className="py-2 px-2.5">
                              <div className="flex items-center justify-between">
                                <h6 className="text-sm font-medium text-black font-lato">
                                  Loans
                                </h6>
    
                                <div className="relative">
                                  <button
                                    className="text-gray-600 hover:bg-gray-100 rounded-md px-3"
                                    onClick={() =>
                                      setIsOpenOptionDrawer((prev) => !prev)
                                    }
                                  >
                                    <Ellipsis />
                                  </button>
                                  {isOpenOptionDrawer && (
                                    <div className="absolute top-7 right-0 w-32 bg-white shadow-md p-3 rounded-md border border-[#e8e8e8]">
                                      <ul>
                                        <li>
                                          <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                            Delete
                                          </button>
                                        </li>
                                        <li>
                                          <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                            Rename
                                          </button>
                                        </li>
                                        <li>
                                          <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                            Share
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 font-lato">
                                Modified today by Wealthportal Service Account
                              </p>
                              <p className="text-xs text-gray-500 font-lato ">
                                100.7 KB
                              </p>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    )} */}

                {/* Create folder */}
              </div>
            </div>

            {/* right panel */}
            <div className="col-span-5 lg:col-span-2">
              <div>
                <div className="grid grid-cols-3">
                  <div></div>
                  <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                    My Tasks
                  </h3>
                  <div className="flex items-center justify-end text-[#dc3545]">
                    <RotateCw className="h-4 w-4" />
                  </div>
                </div>
                {/* Tasks */}
                <div className="mb-7">
                  <table className="min-w-full divide-y divide-gray-200 overflow-auto border border-[#dee2e6]">
                    <tbody className="divide-y divide-gray-200 ">
                      <tr>
                        <td className="ps-3 py-4">
                          <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-[#212529] text-sm">
                            Upload identity information
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end">
                            Upload
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-3 py-4">
                          <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-[#212529] text-sm">
                            Upload 2023 tax return
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end">
                            Complete Forms
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-3 py-4">
                          <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-[#212529] text-sm">
                            Sign money transfer agreement
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end">
                            Sign
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-3 py-4">
                          <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-[#212529] text-sm">
                            Auto Loan Forms
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end">
                            Start Forms
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* My advisor */}
                <div className="mb-7">
                  <div>
                    <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                      My Advisor
                    </h3>
                  </div>

                  {/* Advisory card */}

                  <div className="rounded-md border border-[#dee2e6]">
                    <div className="flex items-start gap-6 border-b border-b-[#dee2e6] p-4">
                      <div className="max-w-[150px] w-full">
                        <a className="p-1 rounded-sm cursor-pointer flex items-center border border-[#dee2e6]">
                          <img src="https://images.unsplash.com/photo-1498529605908-f357a9af7bf5?auto=format&fit=crop&w=1950&q=60&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D" />
                        </a>
                      </div>

                      <div>
                        <h2 className="font-medium text-2xl font-lato mb-1 text-[#212529] leading-none">
                          Erica Smith
                        </h2>
                        <p className="font-lato text-base text-[#6c757d]">
                          Senior Financial Advisor
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-center bg-gray-100">
                      <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
                        Meet
                      </button>
                      <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
                        Call
                      </button>
                      <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
                        Chat
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collaborators */}

                <div>
                  <div>
                    <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                      My Collaborators
                    </h3>
                  </div>
                  <div className="p-4 border border-[#dee2e6]">
                    <form className="mb-3.5">
                      <input
                        type="email"
                        className="border border-[#dee2e6] mb-2 w-full rounded-md outline-none text-[#495057] text-base py-1.5 px-4 font-lato"
                      />

                      <div className="flex items-center gap-6">
                        <select className="text-[#495057] max-w-[335px] w-full py-2  border border-[#dee2e6] px-3 rounded-md font-lato">
                          <option>Co-Owner</option>
                          <option>Editor</option>
                          <option>Viewer</option>
                          <option>Previewer</option>
                          <option>Uploader</option>
                          <option>Previewer Uploader</option>
                          <option>Viewer Uploader</option>
                        </select>

                        <button
                          className="py-1 px-3 bg-gray-100 rounded-md text-[#495057] border border-transparent hover:border-[#dee2e6] text-sm"
                          type="button"
                        >
                          Invite
                        </button>
                      </div>
                    </form>

                    {/* Table */}

                    <div className="border overflow-auto">
                      <table className="divide-y-2 divide-gray-200 overflow-auto border-t">
                        <thead>
                          <tr>
                            <th className="text-sm text-black font-medium font-lato p-3 text-start">
                              Name
                            </th>
                            <th className="text-sm text-black font-medium font-lato p-3 text-start">
                              Email
                            </th>
                            <th className="text-sm text-black font-medium font-lato p-3 text-start">
                              Role
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr className="hover:bg-gray-300">
                            <td className="p-3">
                              <p className="font-semibold font-lato text-sm text-black">
                                Erica Smith
                              </p>
                            </td>
                            <td className="p-3">
                              <p className="font-normal font-lato text-sm text-black">
                                advisor@wealthportal.com
                              </p>
                            </td>
                            <td className="p-3">
                              <p className="font-normal font-lato text-sm text-black">
                                Editor
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer config={config} filterValue={filterValue} user={user} />
    </div>
  );
}

export default Documents;
