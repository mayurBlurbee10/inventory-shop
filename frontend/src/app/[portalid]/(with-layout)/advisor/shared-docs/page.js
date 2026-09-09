"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import {
  ArrowLeft
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import Documents from "@/components/Documents";
import { useSelector } from "react-redux";
import MessageSection from "@/components/Common/MessageSection";
import TasksSection from "@/components/Common/TasksSection";
import AdvisorSection from "@/components/Common/AdvisorSection";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import { Can } from "@/components/Access/AccessControlProvider";

export default function AdvisorViewSharedDocsPage() {
  const [user, setUser] = useState(null);
  const [filesList, setFilesList] = useState(null);
  const [filteredFilesList, setFilteredFilesList] = useState(filesList);
  const [searchQuery, setSearchQuery] = useState("");
  const params = useParams();
  const [path, setPath] = useState([]);
  const [selectedBulkItems, setSelectedBulkItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilesList, setCurrentFilesList] = useState(filesList);
  const [isSearching, setIsSearching] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [page, setPage] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const { data: pages } = useSelector((state) => state.pages);
  const { data: loggedInUser } = useSelector((state) => state.user);
  const searchParams = useSearchParams();
  const boxUserId = searchParams.get("userId");

  const router = useRouter();
  useEffect(() => {
    const page = pages?.find((page) => page.title === "advisor dashboard");

    if (page && !page.isPageVisible) {
      router.push(
        `${params?.portalid
          ? `/${params?.portalid}/access-denied`
          : "/access-denied"
        }`
      );
      return;
    }
  }, []);

  const [dayAndDate, setDayAndDate] = useState({
    day: "",
    date: "",
    month: "",
  });

  const fetchUserByBoxUserId = async () => {
    try {
      setIsLoading(true)
      const url = `/api/users?boxUserId=${boxUserId}`
      const response = await fetchWrapper(url, {}, "fetch-user");
      if (!response.ok) throw new Error("Something went wrong!!");
      const data = await response.json();
      console.log("User:", data);
      setUser(data);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    fetchUserByBoxUserId()
  }, [boxUserId])

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

  useEffect(() => {
    setIsToolbarVisible(selectedBulkItems.length > 0);
  }, [selectedBulkItems]);

  const fetchPage = async () => {
    try {
      setIsPageLoading(true);
      if (!params?.portalid) return;
      const page = encodeURIComponent("advisor shared-docs")
      const response = await fetchWrapper(
        `/api/pages?portalId=${params.portalid || "root"}&page=${page}`,
        {},
        "fetch-page"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to fetch page");
      }
      const pageData = data?.data?.visibility || [];
      setPage(pageData);
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsPageLoading(false);
    }
  };
  const filterVisibility = (label) => {
    if (isPageLoading) return false;
    if (!page || !page.length) return true;
    const section = page.find((item) => item.label === label);
    return section?.visible ?? false;
  };

  useEffect(() => {
    fetchPage();
  }, []);

  const LoadingSpinner = () => (
    <div className={`h-[80vh] flex items-center justify-center bg-white`}>
      <LoaderSpinner size={32} className="text-blue-500" />
    </div>
  );

  if (boxUserId && !user) return <LoadingSpinner />;
  console.log("User:", user);

  return (
    <div className="max-w-[1820px] mx-auto px-4">
      <div className="pt-5 lg:pt-10">
        <button
          className="flex items-center text-gray-600 hover:text-blue-700 font-medium text-sm sm:text-md transition-colors duration-200 group"
          onClick={() =>
            router.push(
              params.portalid
                ? `/${params.portalid}/advisor/dashboard`
                : "/advisor/dashboard"
            )
          }
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-45 mr-1 group-hover:-translate-x-1 transition-transform duration-200" />
          Back
        </button>
      </div>
      <div className="grid gap-7 grid-cols-5 pt-2">
        <div className="col-span-5 lg:col-span-3 ">
          <Documents
            fileType={"advisor"}
            clientFolderId={user ? user?.folderId : loggedInUser?.folderId}
            key={user ? user.id : loggedInUser.id}
            advisorSelectedUser={user}
          />
        </div>
        <div className="col-span-5 lg:col-span-2">
          {filterVisibility("My Task Section") && (
            <div>
              <Can resource="task" action="view">
                <TasksSection
                  client={user ? user : loggedInUser}
                    key={user ? user.id : loggedInUser.id}
                  />
              </Can>
            </div>
          )}
          {filterVisibility("Advisor Section") && (
            <div>
              <div className="mb-7">
                <AdvisorSection
                  title="Your Client"
                  userName={user ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : `${loggedInUser?.firstName || ''} ${loggedInUser?.lastName || ''}`.trim()}
                  role={user ? user?.email : loggedInUser?.email}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
