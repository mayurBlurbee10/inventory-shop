"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        if (!params?.portalid) return;
      } catch (error) {
        console.log("error: ", error);
      }
    };

    fetchConfig();
  }, [params?.portalid]);

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
        "create-folder",
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
          className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] bg-background sm:w-full sm:max-w-[400px]"
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
                disabled={isLoading}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {showSuccess ? (
            <div className="space-y-4 py-2 text-center">
              <DialogDescription className="text-base font-medium text-success">
                Folder successfully created!
              </DialogDescription>
              <DialogFooter className="m-0 justify-center p-0 sm:justify-center bg-transparent">
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
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Please enter a name.
                </Label>
                <Input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="!bg-background text-foreground"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && folderName.trim() && !isLoading) {
                      handleCreateFolder();
                    }
                  }}
                />
              </div>
              <DialogFooter className="m-0 gap-2 p-0 sm:justify-center bg-transparent border-0 bg-transparent">
                <Button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={isLoading || !folderName.trim()}
                  className="px-3 py-3"
                >
                  {isLoading ? (
                    <LoaderSpinner size={18} className="text-primary-foreground" />
                  ) : null}
                  Create
                </Button>
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
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
