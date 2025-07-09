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
  Loader2,
  Search,
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
import Navbar from "./Navbar";
import Container from "./Container";
import MyTaskPopupBox from "./MyTaskPopupBox";
import UploadFileConfirmDialog from "@/components/UploadFileConfirmDialog";
import CompleteForms from "./CompleteForms";
import SignRequestModal from "./SignRequestModal";
import { setPortal } from "@/store/services/portalService";
import { useDispatch, useSelector } from "react-redux";
import { setCollaboratedFiles, setFiles } from "@/store/services/fileService";
import { setCurrentUser } from "@/store/services/userService";
import Button from "./Common/Elements/Button";
import { TaskStatus, TaskType } from "@/config/constants";
import Messaging from "./Common/Messaging";
import TasksSection from "./Common/TasksSection";
import MessageSection from "./Common/MessageSection";
import AdvisorSection from "./Common/AdvisorSection";
import TickerTape from "./Common/charts/TickerTape";
import TopStories from "./Common/charts/TopStories";

function Documents({
  fileType,
  setSelectedItems,
  selectedItems,
  isRest,
  loanFolderId,
  clientFolderId
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenNewFolderDrawer, setIsOpenNewFolderDrawer] = useState(false);
  const [isOpenCreateFolderModal, setIsOpenCreateFolderModal] = useState(false);
  const [isOpenUploadArea, setIsOpenUploadArea] = useState(false);
  // const [filesList, setFilesList] = useState(null);
  // const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [path, setPath] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cols, setCols] = useState(1);
  const [view, setView] = useState("list");
  const [suggestions, setSuggestions] = useState([]);
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
  const [uploadedfilePath, setUpladedFilePath] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // const [config, setConfig] = useState(null);
  const [content, setContent] = useState(null);
  const params = useParams();
  const [footerLoading, setFooterLoading] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isTechSupportModalOpen, setIsTechSupportModalOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [isMyTaskPopupOpen, setIsMyTaskPopupOpen] = useState(false);
  const [myTaskPopupBoxContent, setMyTaskPopupBoxContent] = useState("");
  const [isCompleteFormPopupOpen, setIsCompleteFormPopupOpen] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collaborator, setCollaborator] = useState({
    email: "",
    role: "viewer",
  });
  const [collaborators, setCollaborators] = useState([]);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedSignUrl, setSelectedSignUrl] = useState(null);
  const [isSignReqLoading, setIsSignReqLoading] = useState(null);
  const [completedTask, setCompletedTask] = useState({
    upload: false,
    completeForm: false,
    sign: false,
    autoLoan: false,
  });
  const [page, setPage] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  const [signRequest, setSignRequest] = useState(null);
  const pathname = usePathname();

  const { data: config } = useSelector((state) => state.portal);
  const { data: filesList, loading: isFilesLoading } = useSelector(
    (state) => state.files
  );
  const [filteredFilesList, setFilteredFilesList] = useState(filesList);
  const [currentFilesList, setCurrentFilesList] = useState(filesList);

  const {data : user } = useSelector((state)=>state.user);
  const { data: pages } = useSelector((state) => state.pages);
  const dispatch = useDispatch();

  useEffect(() => {
    const page = pages?.find((page) => page.title === "shared-docs");
    if (page && !page.isPageVisible) {
      router.push("access-denied");
    }
  }, []);


  const handleBrowse = (event) => {
    if (event.type === "click") {
      fileInputRef.current?.click();
    } else {
      handleFileSelect(event);
    }
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpenNewFolderDrawer(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const router = useRouter();

  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    setCols(value);

    // Calculate percentage for the custom CSS variable
    const percentage = ((5 - value) / 4) * 100; // 5 should be 0%, 1 should be 100%
    e.target.style.setProperty("--value-percent", percentage);
  };

  const fetchPage = async () => {
    try {
      setIsPageLoading(true);
      if (!params?.portalid) return;
      const response = await fetchWrapper(
        `/api/pages?portalId=${params.portalid || "default"}&&page=${pathname
          .split("/")
          .pop()}`,
        {},
        "fetch-page"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch page");
      }

      const pageData = data?.data?.visibility || []

      setPage(pageData);
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleSelfSign = async (file, taskType) => {
    try {
      setIsSignReqLoading(taskType);
      const response = await fetchWrapper(
        "/api/box/e-sign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: file.id,
            signers: [
              {
                signerEmail: user.email,
                signerId: user.id,
              },
            ],
            boxUserId: user.boxUserId,
            portal: params.portalid,
            onSameDoc: false,
          }),
        },
        "self-esign-request"
      );
      const data = await response.json();
      console.log("data: ", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate e-sign request");
      }
      toast.success("E-sign request generated successfully.");
      const currentUserReq = data.data[0].signers.find(
        (item) => item.email === user.email
      );
      if (currentUserReq) {
        setTimeout(() => {
          setSelectedSignUrl(currentUserReq.iframeable_embed_url);
          setIsSignModalOpen(true);
          setIsSignReqLoading(null);
        }, 2500);
      }
    } catch (error) {
      setIsSignReqLoading(null);
    } finally {
      setIsSignReqLoading(null);
    }
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
        uploadData.append("userId", userData.boxUserId);

        const requestOptions = {
          method: "POST",
          body: uploadData,
        };

        const response = await fetchWrapper(
          "/api/box/files",
          requestOptions,
          "uploadFile"
        );
        const data = await response.json();
        if (!response.ok) {
          console.log("data status", data.status);
          throw new Error(data.error || "Failed to upload files");
        }
        if (data.duplicateFiles.length > 0) {
          setDuplicateFiles(data.duplicateFiles);
        }
        setShowUploadArea(false);
        await refreshFiles();
        const path = getFolderPath(
          filesList,
          selectedItem?.id || userData?.boxFolderId
        );
        let location = "";
        if (data.files.length > 0) {
          location = [...data.files.map((file) => file.name)];
        }
        setUpladedFilePath(location);
        setIsModalOpen(true);
        setIsOpenUploadArea(false);
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
      // setIsLoading(true);
      const userData = getUserData();
      const requestOptions = {
        method: "GET",
      };
      if (fileType == "shared" || fileType == "loan") {
        if (loanFolderId) {
          // const response = await fetchWrapper(
          //   `/api/box/folders?folderId=${loanFolderId}`,
          //   requestOptions,
          //   "fetchFile"
          // );
          // if (!response.ok) throw new Error("Failed to fetch files");
          // const data = await response.json();
          // const newFilesList = data?.items || [];
          // setFilesList(newFilesList)
          dispatch(setFiles(loanFolderId));
          setSelectedItem({ type: "folder", id: loanFolderId });
        } else if (
          userData?.collaborationIds &&
          userData.collaborationIds.length > 0 &&
          fileType == "shared"
        ) {
          // const requestOptions = {
          //   method: "POST",
          //   body: JSON.stringify({ collaborated: userData.collaborationIds }),
          // };
          // const response = await fetchWrapper(
          //   `/api/box/collaborations`,
          //   requestOptions,
          //   "fetchCollaboratedFolder"
          // );
          // if (!response.ok)
          //   throw new Error("Failed to get collaborated folder");
          // const data = await response.json();
          // const newFilesList = data?.items;
          // setFilesList(newFilesList)
          dispatch(setCollaboratedFiles(userData?.collaborationIds));
        } else {
          if (!userData?.boxFolderId) {
            return;
          }
          // const response = await fetchWrapper(
          //   `/api/box/folders?folderId=${userData?.boxFolderId}`,
          //   requestOptions,
          //   "fetchFile"
          // );
          // if (!response.ok) throw new Error("Failed to fetch files");
          // const data = await response.json();
          // const newFilesList = data?.items || [];
          // setFilesList(newFilesList)
          dispatch(setFiles(userData?.boxFolderId));
        }
      } else if(fileType === 'advisor'){
        if (!clientFolderId) {
          return;
        }
        dispatch(setFiles(clientFolderId));
      }  else {
        if (!userData?.boxFolderId) {
          return;
        }
        // const response = await fetchWrapper(
        //   `/api/box/folders?folderId=${userData?.boxFolderId}`,
        //   requestOptions,
        //   "fetchFile"
        // );
        // if (!response.ok) throw new Error("Failed to fetch files");
        // const data = await response.json();
        // const newFilesList = data?.items || [];
        // setFilesList(newFilesList)
        dispatch(setFiles(userData?.boxFolderId));
      }
    } catch (error) {
      console.error("Error refreshing files:", error);
    } finally {
      // setIsLoading(false);
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
        if (file?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
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
    setSelectedItems && setSelectedItems(selectedBulkItems);
  }, [selectedBulkItems]);

  // useEffect(() => {
  //   if (selectedItems?.length > 0 && isRest) {
  //     setSelectedBulkItems([]);
  //     setSelectedItems([]);
  //   }
  // }, [isRest]);

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedItemsDetails = currentFilesList
      .filter((item) => selectedBulkItems.includes(item.id))
      .map((item) => ({ id: item.id, type: item.type }));
    console.log("selectedItemsDetails", selectedItemsDetails);
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
    } finally {
      setIsDeleting(false);
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

  const fetchConfig = async () => {
    try {
      // const response = await fetchWrapper(
      //   `/api/portal?portalid=${params.portalid || "default"}`,
      //   {},
      //   "portal-login"
      // );
      // const data = await response.json();
      // if (!data.data && response.status === 404) {
      //   router.push(`/${params.portalid}/not-found`);
      //   return;
      // }
      // if (!response.ok) {
      //   throw new Error(data.error || "Failed to fetch portal config");
      // }
      // setConfig(data.data);
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setFooterLoading(false);
    }
  };
  useEffect(() => {
    fetchConfig();
    fetchContent();
    refreshFiles();
    if(fileType === 'my'){
      fetchPage();
    }
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
      if (!email) {
        return;
      }
      let url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetchUserByEmail");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      // setUserData(userData);
      dispatch(setCurrentUser(userData));
      // localStorage.setItem("portal", params.portalid);
      localStorage.setItem("accessToken", data.accessToken);
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      const userData = getUserData();
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
      // setUser(userData);
      // refreshFiles();
    });
  }, [router]);

  const addCollaborator = ({ email, role }) => {
    if(!email) return;
    const collaborators =
      JSON.parse(localStorage.getItem("collaborators")) || [];
    const collabExist = collaborators.find((collab) => collab.email === email);
    if (collabExist) {
      toast.error("Collaborator with same email already exist");
      return;
    }
    const collab = {
      name: email.split("@")[0],
      email: email,
      role: role,
    };
    collaborators.push(collab);
    localStorage.setItem("collaborators", JSON.stringify(collaborators));
    setCollaborators(collaborators);
    setCollaborator({
      email: "",
      role: "viewer",
    });
  };

  const removeCollaborator = (email) => {
    const collaborators =
      JSON.parse(localStorage.getItem("collaborators")) || [];
    const newList = collaborators.filter((collab) => collab.email !== email);
    localStorage.setItem("collaborators", JSON.stringify(newList));
    setCollaborators(newList);
  };

  useEffect(() => {
    const isCollabsExist = localStorage.getItem("collaborators");
    if (isCollabsExist) {
      const collabs = JSON.parse(isCollabsExist);
      setCollaborators(collabs);
    }
  }, []);

  const firstFileToSign = () => {
    return filesList?.find((file) => file.type === "file") || null;
  };

  const filterVisibility = (label) => {
    if (isPageLoading) return false; 
    if (!page || !page.length) return true;     
    
    const section = page.find((item) => item.label === label);
    return section?.visible ?? false; 
  };

  const isAnySideSectionVisible = () => {
    if (isPageLoading) return true; 
    if (!page || !page.length) return true; 
    
    return page.some((item) => item.visible);
  };

  const fetchTasks = async () => {
    try {
      setIsTaskLoading(true);
      const url =`/api/tasks?portalId=${params.portalid}&userId=${user?.id}`
      const response = await fetchWrapper(url, {}, "fetch-tasks");
      if (!response.ok) throw new Error("Something went wrong!!");
      const data = await response.json();
      console.log("User:", data);
      setTasks(data.data);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsTaskLoading(false);
    }
  };

  const handleOpenSignModal = async (task) => {
    try {
      setIsSignReqLoading(task?.title);
      const response = await fetchWrapper(
        `/api/box/e-sign?id=${task?.uploads[0]}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        },
        "get-esign-request"
      );
      const data = await response.json();
      console.log("data: ", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to get e-sign request");
      }
      setSignRequest(data?.data)
      toast.success("E-sign request generated successfully.");
      const currentUserReq = data?.data.signers.find(
        (item) => item.email === user.email
      );
     
      if (currentUserReq) {
        setTimeout(() => {
          setSelectedSignUrl(currentUserReq.iframeable_embed_url);
          setIsSignModalOpen(true);
          setIsSignReqLoading(null);
        }, 2500);
      }
    } catch (error) {
      setIsSignReqLoading(null);
    } finally {
      setIsSignReqLoading(null);
    }
  }

  const updateTaskStatus = async () => {
    try {
      setIsTaskLoading(true);
      const response = await fetchWrapper(
        `/api/tasks`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body : JSON.stringify({
            taskId : taskToUpdate?.id,
            status : TaskStatus.COMPLETED
          })
        },
        "update-task"
      );

      if (!response.ok) throw new Error("Something went wrong!!");
      await fetchTasks();
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsTaskLoading(false);
    }
  };

  useEffect(() => {
    const completed = ["signed", "completed", "finalizing"];
    if (signRequest && completed.includes(signRequest?.status)) {
      if(taskToUpdate.uploads[0] === signRequest?.id){
        updateTaskStatus();
        setSignRequest(null);
      }
    }
  }, [signRequest]);

  // useEffect(()=>{
  //   fetchTasks()
  // }, [])

  const LoadingSpinner = () => (
    <div className="h-[80vh] flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // if (!filterValue("Shared Docs Heading")) return <LoadingSpinner />;
  const userIsAdmin = isAdmin();

  return (
    // <div className="bg-white min-h-screen">
    // <Container>
    <div
      className={`max-w-[1820px] ${
        fileType === "loan" || fileType === "advisor"
          ? ""
          : `${filterVisibility("Ticker Tape") ? "mx-auto pt-5" : "mx-auto pt-5 sm:pt-14"}`
      }`}
    >
      <div>
        <div
          className={`grid gap-7 grid-cols-5 ${
            fileType === "loan" || fileType === "advisor" ? "" : "px-4"
          }`}
        >
          <div
            className={`col-span-5 ${
              fileType === "loan" || fileType === "advisor" || !isAnySideSectionVisible()
                ? "lg:col-span-5"
                : "lg:col-span-3"
            }`}
          >
            {fileType !== "loan" && (
              <>
                <div className={`flex flex-col justify-center ${filterVisibility("Ticker Tape") ? "gap-4" : ""}`}>
                  {fileType !== "loan" && fileType !== "advisor" && (
                    <div className="flex justify-center">
                      {filterVisibility("Ticker Tape") && (
                        <div className="w-full">
                          <TickerTape />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-10">
                    {/* <p className="text-sm font-lato">
                      <span className="block md:inline text-xl font-light sm:text-center text-black mr-10 font-lato mb-2 md:mb-0">
                        Shared Documents
                      </span>
                      <span className="text-sm font-normal text-black font-lato block md:inline">
                        Securely share content with your advisor and trusted
                        collaborators
                      </span>
                    </p> */}
                    <div className="w-full">
                      <div className="text-xl font-light text-black font-lato flex flex-wrap items-center">
                        <span className="block md:inline text-xl font-light sm:text-center text-black mr-10 font-lato mb-2 md:mb-0">
                          Shared Documents
                        </span>
                        <span className="text-sm font-normal text-black font-lato block md:inline">
                          {
                            // Check if content and its required properties are loaded
                            (!content || !content.portalContent || !content.defaultContent) ? (
                              <div className="pr-2 flex items-center">
                                <div className="flex space-x-1">
                                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"></div>
                                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            ) : (
                              // Content is fully loaded, now check for custom content
                              (() => {
                                const customContent = filterValue("Shared Docs Heading");
                                return (customContent && customContent.trim().length > 0) ? (
                                  <div className="page flex flex-col" dangerouslySetInnerHTML={{ __html: customContent }} suppressHydrationWarning={true} />
                                ) : (
                                  <div className="pr-2 flex items-center">Securely share content with your advisor and trusted collaborators</div>
                                );
                              })()
                            )
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="my-5" />
              </>
            )}
            <div className="border border-solid border-[#0000001a] rounded-sm relative">
              <div className="border-b border-solid border-[#0000001a]">
                <div className="py-[18px] flex items-center w-full px-5 bg-gray-50 text-[#8f8f8f]">
                  <div>
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="search"
                    placeholder="Search file and folders"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={
                      "relative border w-full mx-4 h-9 rounded-md shadow-inner pl-4 text-sm outline-none focus:outline-1 focus:outline-blue-500 focus:outline-offset-0 pr-4 text-gray-700"
                    }
                  />

                  <div>
                    <div className="flex items-center gap-3">
                      {fileType !== "loan" && (
                        <>
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
                        </>
                      )}

                      {/* Upload items */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200"
                          onClick={() => {
                            setIsOpenNewFolderDrawer((prev) => !prev);
                          }}
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

              {fileType !== "loan" && (
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
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-gray-600 ${
                          fileType === "shared" ? "hidden" : "hover:bg-gray-200"
                        } outline-none`}
                        onClick={() =>
                          selectedBulkItems.length > 0 &&
                          handelToolbarMoveClick()
                        }
                        disabled={fileType === "shared"}
                      >
                        <FolderInput className="size-5" />
                      </button>
                      <button
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-gray-600 ${
                          fileType === "shared" ? "hidden" : "hover:bg-gray-200"
                        } outline-none`}
                        onClick={
                          () =>
                            selectedBulkItems.length > 0 && handleBulkDownload()
                          // console.log("selectedBulkItems", selectedBulkItems)
                        }
                        disabled={fileType === "shared"}
                      >
                        <Download className="size-5" />
                      </button>
                      <button
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-gray-600 ${
                          fileType === "shared" ? "hidden" : "hover:bg-gray-200"
                        } outline-none`}
                        onClick={() =>
                          selectedBulkItems.length > 0 &&
                          setIsDeleteModalOpen(true)
                        }
                        disabled={fileType === "shared"}
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* breadcrumbs */}
              <div className="px-5 border-b break-words flex justify-between">
                <div className="py-3 flex items-center justify-between flex-wrap relative">
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
                </div>
                <div className="w-50 flex justify-center items-center">
                 {/* Grid range */}
                 {view === "grid" && (
                        <div className="items-center justify=-center gap-2 hidden md:flex">
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

              <div className={` ${isFilesLoading === true ? "visible" : "hidden"}`}>
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
                listType={fileType}
                setSearchQuery={setSearchQuery}
                view={view}
                cols={cols}
                setSelectedBulkItems={setSelectedBulkItems}
                selectedBulkItems={selectedBulkItems}
                setIsMoveModalOpen={setIsMoveModalOpen}
                setMoveItem={setMoveItem}
                setIsNewFolderModalOpen={setIsNewFolderModalOpen}
                loading={isLoading}
              />

              <DeleteConfirmDialog
                isModalOpen={isDeleteModalOpen}
                setIsModalOpen={setIsDeleteModalOpen}
                handleDelete={handleBulkDelete}
                config={config}
                isLoading={isDeleting}
              />
              <MoveDialog
                item={moveItem}
                isModalOpen={isMoveModalOpen}
                setIsModalOpen={setIsMoveModalOpen}
                fileList={filesList}
                handleMove={handleMove}
              />
              <UploadFileConfirmDialog
                title="File Uploaded"
                message="File uploaded successfully!"
                fileLocation={uploadedfilePath}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                isDuplicateFile={duplicateFiles.length > 0}
                duplicateFiles={duplicateFiles}
                setDuplicateFiles={setDuplicateFiles}
                config={config}
                selectedItem={selectedItem}
                refreshFiles={refreshFiles}
                path={getFolderPath(
                  filesList ? filesList : [],
                  selectedItem?.id || user?.boxFolderId
                )}
              />
              {/* <UploadFileConfirmDialog
                fileLocation={uploadedfilePath}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                config={config}
              /> */}
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
            {fileType !== "loan" && fileType !== "advisor" && (
            <div className="flex justify-center mt-5">
              {filterVisibility("Top Stories") && (
                  <div className="w-[99.99%]">
                    <TopStories />
                  </div>
                )}
            </div>
            )}
          </div>

          {/* right panel */}

          {fileType !== "loan" && fileType !== "advisor" && (
            <div className="col-span-5 lg:col-span-2">
              <div>
                {/* Tasks */}
                {filterVisibility("My Task Section") && (
                    // <>
                    //   <div className="grid grid-cols-3">
                    //     <div></div>
                    //     <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                    //       My Tasks
                    //     </h3>
                    //     <div
                    //       className="flex items-center justify-end text-[#dc3545] cursor-pointer"
                    //       onClick={() =>
                    //         setCompletedTask({
                    //           upload: false,
                    //           completeForm: false,
                    //           sign: false,
                    //           autoLoan: false,
                    //         })
                    //       }
                    //     >
                    //       <RotateCw className="h-4 w-4" />
                    //     </div>
                    //   </div>

                    //   <div className="mb-7">
                    //     <table className="min-w-full divide-y divide-gray-200 overflow-auto border border-[#dee2e6]">
                    //       <tbody className="divide-y divide-gray-200 ">
                    //         <tr>
                    //           <td className="ps-3 py-4">
                    //             <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                    //           </td>
                    //           <td className="px-3 py-4">
                    //             <p className="font-lato text-[#212529] text-sm">
                    //               Upload identity information
                    //             </p>
                    //           </td>
                    //           <td className="px-3 py-4">
                    //             <p
                    //               className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end cursor-pointer"
                    //               onClick={() => {
                    //                 setMyTaskPopupBoxContent({
                    //                   title: "Upload identity information",
                    //                   actionText: "Upload",
                    //                 });
                    //                 setIsMyTaskPopupOpen((prev) => !prev);
                    //                 setCompletedTask((prev) => ({
                    //                   ...prev,
                    //                   upload: true,
                    //                 }));
                    //               }}
                    //             >
                    //               {completedTask.upload ? (
                    //                 <span className="italic">Completed</span>
                    //               ) : (
                    //                 "Upload"
                    //               )}
                    //             </p>
                    //           </td>
                    //         </tr>
                    //         <tr>
                    //           <td className="ps-3 py-4">
                    //             <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                    //           </td>
                    //           <td className="px-3 py-4">
                    //             <p className="font-lato text-[#212529] text-sm">
                    //               Upload 2023 tax return
                    //             </p>
                    //           </td>
                    //           <td className="px-3 py-4">
                    //             <p
                    //               className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end cursor-pointer"
                    //               onClick={() => {
                    //                 setIsCompleteFormPopupOpen((prev) => !prev);
                    //                 setCompletedTask((prev) => ({
                    //                   ...prev,
                    //                   completeForm: true,
                    //                 }));
                    //               }}
                    //             >
                    //               {completedTask.completeForm ? (
                    //                 <span className="italic">Completed</span>
                    //               ) : (
                    //                 "Complete Forms"
                    //               )}
                    //             </p>
                    //           </td>
                    //         </tr>
                    //         <tr>
                    //           <td className="ps-3 py-4">
                    //             <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                    //           </td>
                    //           <td className="px-3 py-4">
                    //             <p className="font-lato text-[#212529] text-sm">
                    //               Sign money transfer agreement
                    //             </p>
                    //           </td>
                    //           <td className="px-3 py-4">
                    //             <p
                    //               className={`font-lato text-sky-500 text-sm hover:text-sky-700 text-end cursor-pointer ${!firstFileToSign() ? "pointer-events-none opacity-50" : ""}`}
                    //               onClick={() => {
                    //                 if (!firstFileToSign()) return;
                    //                 handleSelfSign(firstFileToSign(), "sign");
                    //                 setCompletedTask((prev) => ({
                    //                   ...prev,
                    //                   sign: true,
                    //                 }));
                    //               }}
                    //             >
                    //               {isSignReqLoading === "sign" ? (
                    //                 <Loader2 className="ml-auto size-5 animate-spin text-blue-500" />
                    //               ) : completedTask.sign ? (
                    //                 <span className="italic">Completed</span>
                    //               ) : (
                    //                 "Sign"
                    //               )}
                    //             </p>
                    //           </td>
                    //         </tr>
                    //         <tr>
                    //           <td className="ps-3 py-4">
                    //             <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                    //           </td>
                    //           <td className="px-3 py-4">
                    //             <p className="font-lato text-[#212529] text-sm">
                    //               Auto Loan Forms
                    //             </p>
                    //           </td>
                    //           <td className="px-3 py-4">
                    //             <p
                    //               className={`font-lato text-sky-500 text-sm hover:text-sky-700 text-end cursor-pointer ${!firstFileToSign() ? "pointer-events-none opacity-50" : ""}`}
                    //               onClick={() => {
                    //                 if (!firstFileToSign()) return;
                    //                 handleSelfSign(
                    //                   firstFileToSign(),
                    //                   "autoLoan"
                    //                 );
                    //                 setCompletedTask((prev) => ({
                    //                   ...prev,
                    //                   autoLoan: true,
                    //                 }));
                    //               }}
                    //             >
                    //               {isSignReqLoading === "autoLoan" ? (
                    //                 <Loader2 className="ml-auto size-5 animate-spin text-blue-500" />
                    //               ) : completedTask.autoLoan ? (
                    //                 <span className="italic">Completed</span>
                    //               ) : (
                    //                 "Start Forms"
                    //               )}
                    //             </p>
                    //           </td>
                    //         </tr>
                    //         {tasks?.length > 0 && tasks?.map((task)=>(
                    //            <tr key={task?.id}>
                    //              <td className="ps-3 py-4">
                    //                <div className={`h-3 w-3 rounded-full  pulse-animation ${task?.status === TaskStatus.PENDING ? "bg-[#ffc107]" : "bg-[#1ec0cb]"}`}></div>
                    //              </td>
                    //              <td className="px-3 py-4">
                    //                <p className="font-lato text-[#212529] text-sm">
                    //                  {task?.title}
                    //                </p>
                    //              </td>
                    //              <td className="px-3 py-4">
                    //                <p
                    //                  className={`font-lato text-sky-500 text-sm hover:text-sky-700 text-end cursor-pointer`}
                    //                  onClick={()=> {
                    //                    if(task?.status === TaskStatus.COMPLETED){
                    //                      return;
                    //                    }
                    //                    setTaskToUpdate(task)
                    //                    if(task?.type === TaskType.SIGN){
                    //                      handleOpenSignModal(task);
                    //                    }else {
                    //                      setMyTaskPopupBoxContent({
                    //                        title: task?.title,
                    //                        actionText: task?.type,
                    //                      });
                    //                      setIsMyTaskPopupOpen((prev) => !prev);
                    //                      setCompletedTask((prev) => ({
                    //                        ...prev,
                    //                        upload: true,
                    //                      }));
                    //                    }
                    //                  }}
                    //                >
                    //                  {isSignReqLoading === task?.title ? (
                    //                    <Loader2 className="ml-auto size-5 animate-spin text-blue-500" />
                    //                  ) : task?.status === TaskStatus.COMPLETED ? (
                    //                    <span className="italic">Completed</span>
                    //                  ) : (
                    //                    <span>{task?.type.charAt(0).toUpperCase() + task?.type.slice(1)}</span>
                    //                  )}
                    //                </p>
                    //              </td>
                    //            </tr>
                    //          ))}
                    //       </tbody>
                    //     </table>
                    //   </div>
                    // </>
                    <TasksSection />
                  )}

                {isMyTaskPopupOpen && (
                  <MyTaskPopupBox
                    onClose={() => setIsMyTaskPopupOpen(false)}
                    content={myTaskPopupBoxContent}
                    config={config}
                  />
                )}
                <CompleteForms
                  onClose={() => setIsCompleteFormPopupOpen(false)}
                  isOpen={isCompleteFormPopupOpen}
                />

                {/* My advisor */}
                {filterVisibility("Advisor Section") && (
                   <AdvisorSection />
                )}

                {/* Collaborators */}
                {filterVisibility("Collaborator Section") && (
                    <div className="mb-5">
                      <div>
                        <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                          My Collaborators
                        </h3>
                      </div>
                      <div className="p-4 border border-[#dee2e6]">
                      <form className="mb-3.5" onSubmit={(e) => {
                        e.preventDefault(); 
                        addCollaborator(collaborator); 
                      }}>
                          <input
                            type="email"
                            value={collaborator.email}
                            onChange={(e) =>
                              setCollaborator((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                            placeholder="user@example.com"
                            className="border border-[#dee2e6] mb-2 w-full rounded-md outline-none text-[#495057] text-base py-1.5 px-4 font-lato"
                          />

                          <div className="flex items-center gap-6">
                            <select
                              className="text-[#495057] max-w-[335px] w-full py-2  border border-[#dee2e6] px-3 rounded-md font-lato"
                              value={collaborator.role}
                              onChange={(e) =>
                                setCollaborator((prev) => ({
                                  ...prev,
                                  role: e.target.value,
                                }))
                              }
                            >
                              
                              <option value={"editor"}>Editor</option>
                              <option value={"viewer"}>Viewer</option>
                              
                            </select>

                            
                            <Button 
                              onClick={addCollaborator(collaborator)}
                              type="Secondary"
                              label="Invite"
                              buttonType="Submit"
                            />
                          </div>
                        </form>

                       
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
                                <th className="text-sm text-black font-medium font-lato p-3 text-start">
                                  Actions
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
                                <td></td>
                              </tr>
                              {collaborators &&
                                collaborators.length > 0 &&
                                collaborators.map(({ name, email, role }) => (
                                  <tr className="hover:bg-gray-300" key={email}>
                                    <td className="p-3">
                                      <p className="font-semibold font-lato text-sm text-black">
                                        {name}
                                      </p>
                                    </td>
                                    <td className="p-3">
                                      <p className="font-normal font-lato text-sm text-black">
                                        {email}
                                      </p>
                                    </td>
                                    <td className="p-3">
                                      <p className="font-normal font-lato text-sm text-black">
                                        {role.charAt(0).toUpperCase() +
                                          role.slice(1)}
                                      </p>
                                    </td>
                                    <td
                                      className="p-3"
                                      onClick={() => removeCollaborator(email)}
                                    >
                                      <X className="text-red-600 cursor-pointer" />
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                {filterVisibility("Messaging") && (
                  // <Messaging />
                  <MessageSection />
                )}
              </div>
            </div>
          )}
          <SignRequestModal
            isOpen={isSignModalOpen && signRequest !== null}
            onClose={() => setIsSignModalOpen(false)}
            signUrl={selectedSignUrl}
            signRequest={signRequest}
            setSignRequest={setSignRequest}
          />
        </div>
      </div>
    </div>
    // </Container>
  );
}

export default Documents;
