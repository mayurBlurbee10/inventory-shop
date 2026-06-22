"use client";

import { useEffect, useState } from "react";

import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/lib/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Documents from "@/components/Documents";

export default function AdvisorView() {
  const [filesList, setFilesList] = useState(null);
  const [filteredFilesList, setFilteredFilesList] = useState(filesList);
  const [path, setPath] = useState([]);
  const [selectedBulkItems, setSelectedBulkItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilesList, setCurrentFilesList] = useState(filesList);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

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

  useEffect(() => {
    setIsToolbarVisible(selectedBulkItems.length > 0);
  }, [selectedBulkItems]);

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
