"use client";
import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { FolderPlus, X } from "lucide-react";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { setPortal } from "@/store/services/portalService";
import { useDispatch } from "react-redux";
import Button from "./Common/Elements/Button";

export default function ActionButtons({
  onFolderCreated,
  selectedItem,
  isModalOpen,
  setIsModalOpen,
}) {
  const [folderName, setFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const portalId = localStorage.getItem("portal");
        dispatch(setPortal(portalId || "root"))
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
                  <Button
                    onClick={() => setIsModalOpen(false)}
                    isLoading={isLoading}
                    type="Primary"
                    label="Done"
                  />
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
                  <Button
                    onClick={() => {
                      setIsModalOpen(false);
                      setFolderName("");
                    }}
                    disabled={isLoading}
                    type="Secondary"
                    Label="Cancel"
                  />
                  <Button
                    onClick={handleCreateFolder}
                    disabled={isLoading || !folderName.trim()}
                    isLoading={isLoading}
                    type="Primary"
                    Label="Create"
                    icon={FolderPlus}
                  />
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
