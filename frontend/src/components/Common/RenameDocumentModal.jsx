"use client";
import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Button from "./Elements/Button";
import { toast } from "react-toastify";

const RenameDocumentModal = ({ isOpen, onClose, item, onFileRename }) => {
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setNewName(item?.name);
  }, [item])

  const handleRename = async () => {
    if (!newName.trim()) return;

    setIsLoading(true);
    try {
      const requestOptions = {
        method: "PUT",
        body: JSON.stringify({ itemId: item?.id, newName : newName, type: item?.type }),
      };
      const response = await fetchWrapper(
        "/api/box/files",
        requestOptions,
        "rename-document"
      );
      const data = await response.json();
      if(!response.ok){
        throw new Error(data?.error || "Failed to rename document")
      }
      setShowSuccess(true);
      await onFileRename();
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      toast.error(error?.message)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-[400px] w-full rounded-lg bg-white shadow-xl">
          <div className="flex justify-between items-center p-4 border-b">
            <Dialog.Title className="text-lg text-gray-600 font-medium flex items-center">
              Rename {item?.type === "file" ? "File" : "Folder"}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-600 hover:bg-gray-100 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showSuccess ? (
            <div className="text-center p-4">
              <div className="text-green-600 mb-4">
                {item?.type === "file" ? "File" : "Folder"} successfully
                renamed!
              </div>
              <div className="flex justify-center space-x-3">
                <Button onClick={onClose} type="Primary" label="Done" />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-sm w-full mx-auto p-6">
              <label className="text-sm text-black font-medium block mb-1">
                Enter new name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="py-2 px-2 w-full text-black border border-gray-300 rounded-md text-sm outline-none mb-2 focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
                
              />
              <div className="flex items-center justify-center pt-4 gap-2">
                <Button
                  disabled={isLoading || !newName?.trim()}
                  onClick={handleRename}
                  label="Rename"
                  type="Primary"
                  isLoading={isLoading}
                />
                <Button
                  onClick={onClose}
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
  );
};

export default RenameDocumentModal;
