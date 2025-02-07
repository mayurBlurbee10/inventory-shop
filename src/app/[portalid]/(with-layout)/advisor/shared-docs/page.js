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
    Trash2
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



export default function AdvisorView() {
    const [user, setUser] = useState(null);
    const [filesList, setFilesList] = useState(null);
    const [filteredFilesList, setFilteredFilesList] = useState(filesList);
    const [searchQuery, setSearchQuery] = useState("");
    const [config, setConfig] = useState(null);
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
            // setFooterLoading(false);
        }
    };
    useEffect(() => {
        fetchConfig();
        fetchContent();
        refreshFiles();
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

    useEffect(() => {
        const fetchSession = async () => {
            const sessionData = await getSession();
            const userData = getUserData();
            setSession(sessionData);
            if (sessionData) {
                await getUserDetailsByEmail(sessionData.user.email);
            } else {
                const userData = getUserData();
                await getUserDetailsByEmail(userData.email);
            }
            if (!userData) {
                router.push("login");
                return;
            }
            await getUserDetailsByEmail(userData.email);
        };
        fetchSession().then(() => {
            const userData = getUserData();
            if (!userData) {
                router.push("login");
                return;
            }
            setUser(userData);
            refreshFiles();
        });
    }, [router]);

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

    return (
        // <Container>
        <div className="max-w-[1140px] mx-auto px-4 pb-[70px]">
            <div className="grid grid-cols-1 lg:grid-cols-4 pt-8 gap-7">

                <div className="col-span-1">
                    <h3 className="text-xl font-light font-lato text-black mb-4">Your Clients</h3>

                    <div className="w-[250px] flex justify-center flex-wrap gap-5 border">
                        <div className="border w-[150px] sm:w-[200px] lg:w-[220px]">
                            <img
                                src="/profile-3.jpg"
                                alt="User"
                                className="w-full h-[100px] sm:h-[150px] object-cover border"
                            />
                            <div className="text-center p-2">
                                <h3 className="text-sm sm:text-md text-blue-600 font-medium">David West</h3>
                                <p className="text-gray-600 text-xs sm:text-sm">Account ID: 821900</p>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="col-span-3">
                    <div className="mb-7 border">
                        <div className="border-b border-solid border-[#0000001a]">
                            <div className="py-[18px] flex items-center w-full px-5 bg-gray-50">

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
                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-gray-600 outline-none`}
                                        onClick={() =>
                                            selectedBulkItems.length > 0 &&
                                            handelToolbarMoveClick()
                                        }

                                    >
                                        <FolderInput className="size-5" />
                                    </button>
                                    <button
                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-gray-600 outline-none`}
                                        onClick={
                                            () =>
                                                selectedBulkItems.length > 0 && handleBulkDownload()
                                            // console.log("selectedBulkItems", selectedBulkItems)
                                        }

                                    >
                                        <Download className="size-5" />
                                    </button>
                                    <button
                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-gray-600 outline-none`}
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
                        <div className="px-5 border-b break-words">
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
                                <div>
                                    <div className="flex items-center gap-3">
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

                                        {/* Card view button */}
                                        <button
                                            className={`hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200 ${view === "grid" ? "hidden" : "visible"
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
                                            className={`hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200  ${view === "list" ? "hidden" : "visible"
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
                            listType={'my'}
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
                    </div>
                </div>
            </div>

        </div>
        // </Container>
    );
}
