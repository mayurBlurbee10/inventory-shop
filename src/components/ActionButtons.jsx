"use client";
import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { FolderPlus, Upload, Share2, X, Loader2 } from "lucide-react";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { setPortal } from "@/store/services/portalService";
import { useDispatch, useSelector } from "react-redux";

export default function ActionButtons({
  onFolderCreated,
  selectedItem,
  isModalOpen,
  setIsModalOpen,
}) {
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // const [config, setConfig] = useState(null);

  const { data: config } = useSelector((state) => state.portal);
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const portalId = localStorage.getItem("portal");

        // const response = await fetchWrapper(
        //   `/api/portal?portalid=${portalId || "default"}`,
        //   {},
        //   "portal-config"
        // );
        // if (!response.ok) {
        //   throw new Error("Failed to fetch users");
        // }
        // const data = await response.json();
        // setConfig(data.data);
        dispatch(setPortal(portalId || "default"))
      } catch (error) {
        console.log("error: ", error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

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

  return (
    <div className="flex justify-end space-x-3 mb-4">
      {/* <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#005071] rounded-md hover:bg-[#0072a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A4C8A]"
      >
        <FolderPlus className="w-4 h-4 mr-2" />
        New Folder
      </button>

      <button
        onClick={onUploadClick}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#005071] rounded-md hover:bg-[#0072a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A4C8A]"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </button> */}

      <Dialog
        open={isModalOpen}
        onClose={() => {
          if (!isLoading) setIsModalOpen(false);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg text-gray-600 font-medium">
                Create New Folder
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showSuccess ? (
              <div className="text-center py-4">
                <div className="text-green-600 mb-4">
                  Folder successfully created!
                </div>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-secondary rounded-md hover:bg-gray-200"
                    style={{ backgroundColor: config?.secondaryColor }}
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      "Done"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setFolderName("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    disabled={isLoading || !folderName.trim()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FolderPlus className="w-4 h-4 mr-2" />
                    )}
                    Create
                  </button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
