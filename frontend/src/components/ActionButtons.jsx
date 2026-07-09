"use client";
import { useState, useEffect } from "react";
import { FolderPlus, X } from "lucide-react";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { setPortal } from "@/store/services/portalService";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <div className="mb-4 flex justify-end space-x-3">

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open && !isLoading) {
            setIsModalOpen(false);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-sm bg-background"
          overlayClassName="bg-black/30"
          showCloseButton={false}
        >
            <DialogHeader className="border-b border-border pb-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-lg font-medium text-foreground">
                Create New Folder
                </DialogTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>

            {showSuccess ? (
              <div className="py-4 text-center">
                <DialogDescription className="mb-4 text-base text-success">
                  Folder successfully created!
                </DialogDescription>
                <DialogFooter className="justify-center">
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                    className="px-3 py-3"
                  >
                    Done
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <Input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full !bg-background text-foreground"
                  disabled={isLoading}
                />
                <DialogFooter className="mt-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFolderName("");
                    }}
                    disabled={isLoading}
                    className="px-3 py-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateFolder}
                    disabled={isLoading || !folderName.trim()}
                    className="px-3 py-3"
                  >
                    {isLoading ? null : <FolderPlus className="h-4 w-4" />}
                    Create
                  </Button>
                </DialogFooter>
              </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
