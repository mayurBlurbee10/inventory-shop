"use client";
import * as React from "react";

import {
  AlignJustify,
  Minus,
  Plus,
  X,
  FolderInput,
  Download,
  Trash2,
  Search,
  UploadIcon,
  PlusIcon,
  LayoutGrid,
} from "lucide-react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getUserData } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import SharedFolderExplorer from "@/components/MyDocumentsExplorer";
import UploadArea from "@/components/UploadArea";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SettingsModal from "@/components/Settings";
import MoveDialog from "@/components/MoveDialog";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { clearUserData, setAuthTokens } from "@/app/lib/auth";
import { getSession, signOut } from "next-auth/react";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import TechSupport from "@/components/TechSupport";
import CreateFolder from "./CreateFolder";
import MyTaskPopupBox from "./MyTaskPopupBox";
import UploadFileConfirmDialog from "@/components/UploadFileConfirmDialog";
import CompleteForms from "./CompleteForms";
import SignRequestModal from "./SignRequestModal";
import { useDispatch, useSelector } from "react-redux";
import { setCollaboratedFiles, setFiles } from "@/store/services/fileService";
import { setCurrentUser } from "@/store/services/userService";
import { TaskStatus, UserRole } from "@/config/constants";
import TasksSection from "./Common/TasksSection";
import MessageSection from "./Common/MessageSection";
import AdvisorSection from "./Common/AdvisorSection";
import TickerTape from "./Common/charts/TickerTape";
import TopStories from "./Common/charts/TopStories";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { Button } from "./ui/button";
import { AppTooltip } from "@/components/ui/tooltip";
import { Input } from "./ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Progress } from "./ui/progress";
import { LinearProgress } from "@mui/material";
import { Can } from "./Access/AccessControlProvider";

function Documents({
  fileType,
  setSelectedItems,
  selectedItems,
  isRest,
  loanFolderId,
  clientFolderId,
  advisorSelectedUser
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenNewFolderDrawer, setIsOpenNewFolderDrawer] = useState(false);
  const [isOpenUploadArea, setIsOpenUploadArea] = useState(false);
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
  const { resError } = useSelector((state) => state.message);
  const isFolderAccessDenied =
    typeof resError === "string" &&
    (resError.includes("permission to view") ||
      resError.includes("ACCESS_DENIED"));
  const [filteredFilesList, setFilteredFilesList] = useState(filesList);
  const [currentFilesList, setCurrentFilesList] = useState(filesList);

  const { data: user } = useSelector((state) => state.user);
  const { data: pages } = useSelector((state) => state.pages);
  const dispatch = useDispatch();

  // useEffect(() => {
  //   if (isFolderAccessDenied && resError) {
  //     toast.error(resError);
  //   }
  // }, [isFolderAccessDenied, resError]);

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

  const handleSliderChange = (value) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setCols(nextValue);
  };

  const fetchPage = async () => {
    try {
      setIsPageLoading(true);
      if (!params?.portalid) return;
      const response = await fetchWrapper(
        `/api/pages?portalId=${params.portalid || "root"}&&page=${pathname
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
          uploadData.append("boxFolderId", loanFolderId || userData.boxFolderId);
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
          "upload-file"
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
          dispatch(setFiles(loanFolderId));
          setSelectedItem({ type: "folder", id: loanFolderId });
        } else if (
          userData?.collaborationIds &&
          userData.collaborationIds.length > 0 &&
          fileType == "shared"
        ) {
          dispatch(setCollaboratedFiles(userData?.collaborationIds, userData?.boxFolderId));
        } else {
          if (!userData?.boxFolderId) {
            return;
          }
          dispatch(setFiles(userData?.boxFolderId, userData?.collaborationIds));
        }
      } else if (fileType === 'advisor') {
        if (!clientFolderId) {
          return;
        }
        console.log("userData=============>", advisorSelectedUser);

        dispatch(setFiles(clientFolderId, advisorSelectedUser.collaborationIds));
      } else {
        if (!userData?.boxFolderId) {
          return;
        }
        dispatch(setFiles(userData?.boxFolderId, userData?.collaborationIds));
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

  useEffect(() => {
    // If no searchQuery, reset the currentFilesList to either filesList or path's last child
    if (!searchQuery) {
      setCurrentFilesList(
        path.length === 0
          ? filesList ?? []
          : path[path.length - 1]?.children ?? []
      );
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Recursive function to search the entire file structure
    const recursiveSearch = (files) => {
      if (!Array.isArray(files)) {
        return [];
      }

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
        path.length === 0
          ? filesList ?? []
          : path[path.length - 1]?.children ?? [];
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(obj),
        };
        const response = await fetchWrapper(
          `/api/box/move`,
          requestOptions,
          "move-file-or-folder"
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

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedItemsDetails = currentFilesList
      .filter((item) => selectedBulkItems.includes(item.id))
      .map((item) => ({ id: item.id, type: item.type }));
    console.log("selectedItemsDetails", selectedItemsDetails);
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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

      const response = await fetchWrapper(
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
    if (fileType === 'my') {
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
      `/api/contentManagement?portalId=${params.portalid || "root"}`,
      { method: "GET" },
      "fetch-content-management"
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetch-user-by-email");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      // setUserData(userData);
      dispatch(setCurrentUser(userData));
      // localStorage.setItem("portal", params.portalid);
      setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
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
    });
  }, [router]);

  const addCollaborator = ({ email, role }) => {
    if (!email) return;
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
      const url = `/api/tasks?portalId=${params.portalid || "root"}&userId=${user?.id}`
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
          body: JSON.stringify({
            taskId: taskToUpdate?.id,
            status: TaskStatus.COMPLETED
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
      if (taskToUpdate.uploads[0] === signRequest?.id) {
        updateTaskStatus();
        setSignRequest(null);
      }
    }
  }, [signRequest]);


  const LoadingSpinner = () => (
    <div className="h-[80vh] flex items-center justify-center bg-white">
      <LoaderSpinner size={32} className="text-secondary-foreground" />
    </div>
  );

  return (
    <div
      className={`max-w-[1820px] bg-background ${fileType === "loan" || fileType === "advisor"
        ? ""
        : `${filterVisibility("Ticker Tape") ? "mx-auto pt-5" : "mx-auto pt-5 sm:pt-14"}`
        }`}
    >
      <div>
        <div
          className={`grid gap-7 grid-cols-5 ${fileType === "loan" || fileType === "advisor" ? "" : "px-4"
            }`}
        >
          <div
            className={`col-span-5 ${fileType === "loan" || fileType === "advisor" || !isAnySideSectionVisible()
              ? "lg:col-span-5"
              : "lg:col-span-3"
              }`}
          >
            <Card className="overflow-hidden shadow-sm border-border">
              <CardHeader className="flex flex-col gap-3 p-4 border border-border  bg-background space-y-0">

                {/* Title Section */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <div className={`flex flex-col justify-center w-full gap-2`}>
                      {fileType !== "loan" && fileType !== "advisor" && (
                        <div className="flex justify-center">
                          {filterVisibility("Ticker Tape") && (
                            <div className="w-full mb-4">
                              <TickerTape />
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg font-bold text-secondary-foreground flex items-center gap-3">

                          {
                            !content ||
                              !content.portalContent ||
                              !content.defaultContent ? (
                              <div className="flex items-center space-x-2 p-2">
                                <Skeleton className="h-2 w-2 rounded-full" />
                                <Skeleton className="h-2 w-2 rounded-full" />
                                <Skeleton className="h-2 w-2 rounded-full" />
                              </div>
                            ) : (
                              (() => {
                                const customContent = filterValue("Shared Docs Heading");
                                return customContent && customContent.trim().length > 0 ? (
                                  <div className="page flex flex-col" dangerouslySetInnerHTML={{ __html: customContent }} suppressHydrationWarning={true} />
                                ) : (
                                  <span className="text-secondary-foreground">Shared Documents</span>
                                );
                              })()
                            )
                          }
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Securely share content with your advisor and trusted collaborators</CardDescription>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search and Actions */}
                <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-2">
                  {/* Search Bar */}
                  <div className="relative min-w-0 flex-1 order-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <Search className="w-4 h-4 text-secondary-foreground" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search files and folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 py-2 h-auto w-full border border-border rounded-lg text-sm text-secondary-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    {searchQuery && (
                      <AppTooltip label="Clear search">
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center cursor-pointer text-secondary-foreground hover:text-secondary-foreground/70"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </AppTooltip>
                    )}
                  </div>

                  {/* Controls Container */}
                  <div className="order-2 flex w-full shrink-0 flex-nowrap items-center gap-2 overflow-x-auto md:w-auto md:justify-end">
                    <ToggleGroup
                      value={[view]}
                      onValueChange={(values) => {
                        const nextView = values[values.length - 1];
                        if (nextView) setView(nextView);
                      }}
                      variant="default"
                      size="sm"
                      spacing={1}
                      className="shrink-0 rounded-lg bg-surface p-1"
                    >
                      <AppTooltip label="List view">
                        <ToggleGroupItem
                          value="list"
                          aria-label="List view"
                          className={view === "list" ? "h-8 rounded-md border border-border bg-background text-secondary-foreground shadow-sm data-[state=on]:bg-secondary" : "h-8 rounded-md border-0 bg-transparent text-muted-foreground hover:text-foreground"}
                        >
                          <AlignJustify className="w-4 h-4" />
                        </ToggleGroupItem>
                      </AppTooltip>
                      <AppTooltip label="Grid view">
                        <ToggleGroupItem
                          value="grid"
                          aria-label="Grid view"
                          className={view === "grid" ? "h-8 rounded-md border border-border bg-background text-secondary-foreground shadow-sm data-[state=on]:bg-secondary" : "h-8 rounded-md border-0  text-muted-foreground hover:text-foreground"}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </ToggleGroupItem>
                      </AppTooltip>
                    </ToggleGroup>
                    <Can resource="shareddocs" action="uploadfile">
                    <Button
                      variant="default"
                      className="h-10 shrink-0"
                      onClick={() => {
                        setIsOpenNewFolderDrawer(false);
                        setIsOpenUploadArea(true);
                      }}
                    >
                      <UploadIcon className="w-5 h-5" />
                      Upload Files
                    </Button>
                    </Can>
                    <Can resource="shareddocs" action="createfolder">
                      <Button
                        variant="default"
                        className="h-10 shrink-0"
                        onClick={() => {
                          setIsOpenNewFolderDrawer(false);
                          setIsNewFolderModalOpen(true);
                        }}
                      >
                        <PlusIcon className="w-5 h-5" />
                        New Folder
                      </Button>
                    </Can>
                  </div>
                </div>

              </CardHeader>

              {fileType !== "loan" && selectedBulkItems.length > 0 && (
                <div>
                  <div
                    className={`bg-accent text-gray-800 py-1 mt-3
                          ${isToolbarVisible ? "opacity-1" : "hidden"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="icons"
                        size="lg"
                        className="h-8 w-8 rounded-full text-secondary-foreground hover:text-secondary-foreground/50 ml-1"
                        onClick={clearBulkItem}
                      >
                        <X className="size-5" />
                      </Button>
                      <p className="text-sm font-medium mr-4 text-secondary-foreground">
                        {selectedBulkItems.length} item(s) selected
                      </p>
                      <Button
                        type="button"
                        variant="icons"
                        size="lg"
                        className={`h-8 w-8 rounded-full text-secondary-foreground ${fileType === "shared" ? "hidden" : "hover:text-secondary-foreground/50"
                          }`}
                        onClick={() =>
                          selectedBulkItems.length > 0 &&
                          handelToolbarMoveClick()
                        }
                        disabled={fileType === "shared"}
                      >
                        <FolderInput className="size-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="icons"
                        size="lg"
                        className={`h-8 w-8 rounded-full text-secondary-foreground ${fileType === "shared" ? "hidden" : "hover:text-secondary-foreground/50"
                          }`}
                        onClick={
                          () =>
                            selectedBulkItems.length > 0 && handleBulkDownload()
                        }
                        disabled={fileType === "shared"}
                      >
                          <Download className="size-5" />
                      </Button>
                      {user?.role !== UserRole.USER && <Button
                        type="button"
                        variant="icons"
                        size="lg"
                        className={`h-8 w-8 rounded-full text-secondary-foreground ${fileType === "shared" ? "hidden" : "hover:text-secondary-foreground/50"
                          }`}
                        onClick={() =>
                          selectedBulkItems.length > 0 &&
                          setIsDeleteModalOpen(true)
                        }
                        disabled={fileType === "shared"}
                      >
                        <Trash2 className="size-5" />
                      </Button>}
                    </div>
                  </div>
                </div>
              )}

              {/* breadcrumbs */}
              <div className="px-5 border-b break-words flex justify-between">
                <div className="py-3 flex items-center justify-between flex-wrap relative">
                  <div>
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hover:text-secondary-foreground/50 text-secondary-foreground"
                        onClick={() =>
                          setCols((prev) => Math.max(prev - 1, 1))
                        }
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[cols]}
                        onValueChange={handleSliderChange}
                        className="w-32"
                        trackClassName="h-1.5 bg-secondary-foreground/30"
                        rangeClassName="bg-secondary-foreground"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hover:text-secondary-foreground/50 text-secondary-foreground"
                        onClick={() =>
                          setCols((prev) => Math.min(prev + 1, 5))
                        }
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {isNewFolderModalOpen && (
                <div className="absolute top-[50%] left-[50%]">
                  <CreateFolder
                    loanFolderId={loanFolderId}
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
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                multiple
              />

              <div className={` ${isFilesLoading || isLoading === true ? "visible" : "hidden"}`}>
              <LinearProgress
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "hsl(var(--muted) / 0.2)",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "hsl(var(--secondary-foreground))",
                      },
                    }}
                  />
              </div>

              {/* Table in list view */}

              {isFolderAccessDenied ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                  <p className="text-base font-medium text-secondary-foreground">
                    Access denied
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {resError ||
                      "You don't have permission to view these files and folders. Please contact your administrator if you need access."}
                  </p>
                </div>
              ) : (
              <SharedFolderExplorer
                fileList={filesList}
                setPath={setPath}
                path={path}
                currentFilesList={currentFilesList}
                setCurrentFilesList={setCurrentFilesList}
                setSelectedItem={setSelectedItem}
                selectedItem={selectedItem}
                handleShareLink={() => { }}
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
              )}

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
              <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
              />
              <TechSupport
                isOpen={isTechSupportModalOpen}
                onClose={() => setIsTechSupportModalOpen(false)}
              />

              {/* Create folder */}
            </Card>
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
              <div className="flex flex-col gap-4">
                {/* Tasks */}
                {filterVisibility("My Task Section") && (
                  <Can resource="task" action="view">
                   <TasksSection />
                  </Can>
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
                  <Card className="overflow-hidden border-gray-200">
                    {/* Header */}
                    <CardHeader className="flex flex-row items-center justify-between bg-white p-3 border-b border-gray-200 rounded-t-xl space-y-0">
                      <CardTitle className="text-lg font-semibold text-gray-800 font-lato">
                        My Collaborators
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <form className="mb-3.5" onSubmit={(e) => {
                        e.preventDefault();
                        addCollaborator(collaborator);
                      }}>
                        <Label htmlFor="collaborator-email" className="sr-only">
                          Collaborator email
                        </Label>
                        <Input
                          id="collaborator-email"
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
                          className="border border-[#dee2e6] mb-2 w-full rounded-md outline-none text-[#495057] text-base py-1.5 px-4 h-auto font-lato"
                        />

                        <div className="flex items-center gap-6">
                          <Label htmlFor="collaborator-role" className="sr-only">
                            Collaborator role
                          </Label>
                          <Select
                            value={collaborator.role}
                            onValueChange={(role) =>
                              setCollaborator((prev) => ({
                                ...prev,
                                role,
                              }))
                            }
                          >
                            <SelectTrigger
                              id="collaborator-role"
                              className="text-[#495057] max-w-[335px] w-full py-2 font-lato"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>


                          <Button
                            onClick={addCollaborator(collaborator)}
                            variant="outline"
                            type="submit"
                            className="text-gray-500 hover:bg-gray-50"
                          >
                            Invite
                          </Button>
                        </div>
                      </form>


                      <ScrollArea className="max-h-[400px]">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow className="hover:bg-gray-50">
                              <TableHead className="text-sm font-semibold text-gray-700 font-lato p-3 text-start">
                                Name
                              </TableHead>
                              <TableHead className="text-sm font-semibold text-gray-700 font-lato p-3 text-start">
                                Email
                              </TableHead>
                              <TableHead className="text-sm font-semibold text-gray-700 font-lato p-3 text-start">
                                Role
                              </TableHead>
                              <TableHead className="text-sm font-semibold text-gray-700 font-lato p-3 text-start">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody className="bg-white">
                            <TableRow className="hover:bg-gray-50 transition-colors">
                              <TableCell className="p-3">
                                <p className="font-semibold font-lato text-sm text-gray-900">
                                  Erica Smith
                                </p>
                              </TableCell>
                              <TableCell className="p-3">
                                <p className="font-normal font-lato text-sm text-gray-600">
                                  advisor@wealthportal.com
                                </p>
                              </TableCell>
                              <TableCell className="p-3">
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  Editor
                                </Badge>
                              </TableCell>
                              <TableCell className="p-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {collaborators &&
                              collaborators.length > 0 &&
                              collaborators.map(({ name, email, role }) => (
                                <TableRow className="hover:bg-gray-50 transition-colors" key={email}>
                                  <TableCell className="p-3">
                                    <p className="font-semibold font-lato text-sm text-gray-900">
                                      {name}
                                    </p>
                                  </TableCell>
                                  <TableCell className="p-3">
                                    <p className="font-normal font-lato text-sm text-gray-600">
                                      {email}
                                    </p>
                                  </TableCell>
                                  <TableCell className="p-3">
                                    <Badge
                                      variant={role === "editor" ? "default" : "secondary"}
                                      className={role === "editor"
                                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"}
                                    >
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="p-3">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-gray-400 hover:text-red-600"
                                      onClick={() => removeCollaborator(email)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
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
