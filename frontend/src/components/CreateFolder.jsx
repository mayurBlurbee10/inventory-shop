"use client";
import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import Button from "./Common/Elements/Button";

export default function CreateFolder({
  loanFolderId,
  onFolderCreated,
  selectedItem,
  isModalOpen,
  setIsModalOpen,
}) {

  const [folderName, setFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const params = useParams();
  const { data: config } = useSelector((state) => state.portal);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        if (!params?.portalid) return;
      } catch (error) {
        console.log("error: ", error);
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
        boxFolderId: loanFolderId || userData.boxFolderId,
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

        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="mx-auto max-w-[400px] w-full rounded-lg bg-white shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <Dialog.Title className="text-lg text-gray-600 font-medium flex items-center">
                Create New Folder
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-600 hover:bg-gray-100 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showSuccess ? (
              <div className="text-center p-4">
                <div className="text-green-600 mb-4">
                  Folder successfully created!
                  {console.log(config)}
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

              <div className=" bg-white rounded-lg w-full mx-auto p-6">
                <label className="text-sm text-black font-medium font-lato block mb-1">
                  Please enter a name.
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="py-2 px-2 w-full text-black border border-[#D3D3D3] rounded-md text-sm font-[#222] outline-none mb-2 focus:border-[#0061D5] focus:ring-blue-500 hover:border-[#0061D5]"
                  disabled={isLoading}
                />
                <div
                  className="flex items-center justify-center pt-4 gap-2"
                >
                  <Button
                    disabled={isLoading || !folderName.trim()}
                    onClick={handleCreateFolder}
                    label="Create"
                    type="Primary"
                    isLoading={isLoading}
                  />
                  <Button
                    onClick={() => {
                      setIsModalOpen(false);
                      setFolderName("");
                    }}
                    disabled={isLoading}
                    type="Secondary"
                    label="Cancel"
                  />
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}