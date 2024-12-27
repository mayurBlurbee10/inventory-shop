"use client";

import Header from "@/components/Header";
import Sidepanel from "@/components/Sidepanel";
import React, { useEffect, useRef, useState } from "react";
import { getUserData, clearUserData, isAdmin } from "@/app/lib/auth";
import { fetchWrapper } from "../lib/fetchWrapper";
import { useRouter } from "next/navigation";
import { ChevronRight, FileIcon, Search } from "lucide-react";
import ActionButtons from "@/components/ActionButtons";
import UploadArea from "@/components/UploadArea";
import FolderExplorer from "@/components/FolderExplorer";
import DialogBox from "@/components/DialogBox";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col w-full items-center justify-center py-12 text-gray-500">
    <FileIcon size={48} className="mb-4 opacity-50" />
    <p>No files or folders found</p>
  </div>
);

function SharewithMe() {
  const router = useRouter();
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

  const handleBrowse = (event) => {
    if (event.type === "click") {
      fileInputRef.current?.click();
    } else {
      handleFileSelect(event);
    }
  };
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

  const getCollaboratedFolder = async () => {
    try {
      const userData = getUserData();
      if (userData?.collaborationIds && userData.collaborationId.length > 0) {
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
        console.log("SHARE WITH ME", data?.items);
        setFilesList(data?.items);
        setCurrentFilesList(data?.items);
        console.log("shared files and folder: ", data);
      }
    } catch (error) {
      console.error("Error get collaborated folder:", error);
    }
  };

  const refreshFiles = async (folderId) => {
    console.log("folderid ", folderId);
    try {
      setIsLoading(true);
      console.log("User Api calling");
      const userData = getUserData();
      console.log(userData);
      if (userData?.collaborationIds && userData.collaborationIds.length > 0) {
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
          Shared Files
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
    console.log("useEffect Shared with me");
  }, [router]);

  useEffect(() => {
    setSearchQuery("");
    setCurrentFilesList(
      path.length === 0 ? filesList : path[path.length - 1].children
    );
  }, [path, filesList]);

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
  }, [searchQuery, selectedItem, filesList]);

  useEffect(() => {
    if (path.length === 0) {
      setSelectedItem(null);
    }
  }, [path]);

  console.log("filelist", filesList);
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
        />

        <div className="flex flex-row">
          <Sidepanel
            sidepanelDropdown={sidepanelDropdown}
            setSidepanelDropdown={setSidepanelDropdown}
            setIsNewFolderModalOpen={setIsNewFolderModalOpen}
            showUploadArea={showUploadArea}
            setShowUploadArea={setShowUploadArea}
            router={router}
          />
          {/* <div className="flex space-x-8">
          <div className="flex-[7]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-medium text-gray-900 mb-1">
                  Shared Documents
                </h2>
                <p className="text-gray-500">
                  Securely share content with your advisor and trusted
                  collaborators
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ActionButtons
                  onFolderCreated={refreshFiles}
                  onUploadClick={() => setShowUploadArea(true)}
                  selectedItem={selectedItem}
                />
              </div>
            </div>

            {showUploadArea && (
              <div className="mb-6">
                <UploadArea
                  isForImport = {false}
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <FileExplorer data={filesList} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
            </div>
          </div>

          <div className="flex-[3]">
            <div className="space-y-6">
              <AccountInfo user={user} userIsAdmin={userIsAdmin} />
              <QuickActions
                userIsAdmin={userIsAdmin}
                router={router}
                handleLogout={handleLogout}
              />
            </div>
          </div>
        </div> */}

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
      {/* <div className="">
      <Footer />
    </div> */}
      <DialogBox
        title="File Uploaded"
        message="File uploaded successfully!"
        fileLocation={uploadedfilePath}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
}

export default SharewithMe;
