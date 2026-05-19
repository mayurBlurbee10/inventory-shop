"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  AlignJustify,
  Folder,
  File,
  Minus,
  Plus,
  X,
  FolderInput,
  Download,
  Trash2,
} from "lucide-react";
import CreateFolder from "@/components/CreateFolder";
import UploadArea from "@/components/UploadArea";
import { LinearProgress } from "@mui/material";
import SharedFolderExplorer from "@/components/MyDocumentsExplorer";
import { getSession } from "next-auth/react";
import { getUserData, setUserData } from "@/lib/auth";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import MoveDialog from "@/components/MoveDialog";
import DialogBox from "@/components/DialogBox";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UploadFileConfirmDialog from "@/components/UploadFileConfirmDialog";
import Documents from "@/components/Documents";
import { useDispatch, useSelector } from "react-redux";
import { setPortal } from "@/store/services/portalService";
import { setCurrentUser } from "@/store/services/userService";

export default function AdvisorView() {
  const [user, setUser] = useState(null);
  const [filesList, setFilesList] = useState(null);
  const [filteredFilesList, setFilteredFilesList] = useState(filesList);
  const [searchQuery, setSearchQuery] = useState("");
  // const [config, setConfig] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [content, setContent] = useState(null);
  const params = useParams();
  const [path, setPath] = useState([]);
  const [selectedBulkItems, setSelectedBulkItems] = useState([]);
  const [view, setView] = useState("list");
  const [isOpenNewFolderDrawer, setIsOpenNewFolderDrawer] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isOpenUploadArea, setIsOpenUploadArea] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilesList, setCurrentFilesList] = useState(filesList);
  const [cols, setCols] = useState(1);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveItem, setMoveItem] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [session, setSession] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uploadedfilePath, setUpladedFilePath] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: config } = useSelector((state) => state.portal);

  const dispatch = useDispatch();

  const router = useRouter();

  const [dayAndDate, setDayAndDate] = useState({
    day: "",
    date: "",
    month: "",
  });

  useEffect(() => {
    const date = new Date();
    const dayIndex = date.getDay();
    const monthIndex = date.getMonth();
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    setDayAndDate((prev) => ({ ...prev, day: days[dayIndex] }));
    setDayAndDate((prev) => ({ ...prev, month: months[monthIndex] }));
    setDayAndDate((prev) => ({ ...prev, date: date.getDate() }));
  }, []);
  const fetchConfig = async () => {
    try {
      // const response = await fetchWrapper(
      //     `/api/portal?portalid=${params.portalid || "default"}`,
      //     {},
      //     "portal-login"
      // );
      // const data = await response.json();
      // if (!data.data && response.status === 404) {
      //     router.push(`/${params.portalid}/not-found`);
      //     return;
      // }
      // if (!response.ok) {
      //     throw new Error(data.error || "Failed to fetch portal config");
      // }
      // setConfig(data.data);
    } catch (error) {
      console.log("error: ", error);
    } finally {
      // setFooterLoading(false);
    }
  };
  useEffect(() => {
    // fetchConfig();
    // fetchContent();
  }, []);

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

  const handleBrowse = (event) => {
    if (event.type === "click") {
      fileInputRef.current?.click();
    } else {
      handleFileSelect(event);
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
        `/api/box/folders?folderId=${userData?.boxFolderId}`,
        requestOptions,
        "fetch-file"
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
        setIsOpenUploadArea(false);
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
      } catch (error) {
        toast.error(error.message);
        console.error("Error uploading files:", error);
      } finally {
        setIsLoading(false);
      }
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

  const handleSuggestionClick = (item) => {
    setSearchQuery(item.name);
    // if(item.type !== "folder" ){
    item.path.pop();
    // }
    setPath(item.path);
    setCurrentFilesList([item]);
    setSuggestions([]);
  };
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
  }, [selectedBulkItems]);

//   useEffect(() => {
//     const fetchSession = async () => {
//       const sessionData = await getSession();
//       const userData = getUserData();
//       setSession(sessionData);
//       if (sessionData) {
//         await getUserDetailsByEmail(sessionData.user.email);
//       } else {
//         if (!userData) {
//           router.push("login");
//           return;
//         }
//         await getUserDetailsByEmail(userData?.email);
//       }
//     };
//     fetchSession().then(() => {
//       const userData = getUserData();
//       if (!userData) {
//         router.push("login");
//         return;
//       }
//       setUser(userData);
//       refreshFiles();
//     });
//   }, [router]);

  const clearBulkItem = () => {
    setSelectedBulkItems([]);
  };

  const getUserDetailsByEmail = async (email) => {
    try {
      let url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetch-user-by-email");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      // setUserData(userData);
      dispatch(setCurrentUser(userData));
    //   localStorage.setItem("portal", params.portalid);
      localStorage.setItem("accessToken", data.accessToken);
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
  };

  return (
    // <Container>
    <div className="max-w-[1140px] mx-auto px-4 pb-[70px]">
      <div className="grid grid-cols-1 lg:grid-cols-4 pt-8 gap-7">
        <div className="col-span-1">
          <h3 className="text-xl font-light font-lato text-black mb-4">
            Your Clients
          </h3>

          <div className="w-[250px] flex justify-center flex-wrap gap-5 border">
            <div className="border w-[150px] sm:w-[200px] lg:w-[220px]">
              <img
                src="/profile-3.jpg"
                alt="User"
                className="w-full h-[100px] sm:h-[150px] object-cover border"
              />
              <div className="text-center p-2">
                <h3 className="text-sm sm:text-md text-blue-600 font-medium">
                  David West
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Account ID: 821900
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <Documents fileType={"advisor"} />
        </div>
      </div>
    </div>
    // </Container>
  );
}
