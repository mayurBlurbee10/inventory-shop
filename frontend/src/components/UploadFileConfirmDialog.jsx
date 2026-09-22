import { useState } from "react";
import { X } from "lucide-react";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const UploadFileConfirmDialog = ({
  title,
  message,
  fileLocation,
  isModalOpen,
  setIsModalOpen,
  config,
  isDuplicateFile,
  duplicateFiles,
  setDuplicateFiles,
  selectedItem,
  refreshFiles,
  path,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReplaceLoading, setIsReplaceLoading] = useState(false);
  const [location, setLocation] = useState([]);

  function base64ToFile(base64, fileName, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  const handleReplaceFiles = async () => {
    if (duplicateFiles.length > 0) {
      try {
        setIsReplaceLoading(true);
        const uploadData = new FormData();
        const userData = getUserData();
        duplicateFiles.forEach(({ stream }) => {
          const file = base64ToFile(
            stream.base64,
            stream.name,
            stream.type
          );
          uploadData.append("file", file);
        });
        if (!!selectedItem && selectedItem.type == "folder") {
          uploadData.append("boxFolderId", selectedItem.id);
        } else {
          uploadData.append("boxFolderId", userData.boxFolderId);
        }

        uploadData.append("email", userData.email);
        uploadData.append("userId", userData.boxUserId);

        const requestOptions = {
          method: "POST",
          body: uploadData,
        };

        const response = await fetchWrapper(
          "/api/box/files/replace",
          requestOptions,
          "upload-file"
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to upload files");
        }
        setLocation([...data.files.map((file) => file.name)]);
        await refreshFiles().then(() => {
          setDuplicateFiles([]);
          toast.success("File uploaded successfully");
        });
      } catch (error) {
        toast.error(error.message);
        console.error("Error uploading files:", error);
      } finally {
        setIsReplaceLoading(false);
      }
    }
  };

  const handleCreateDuplicateFiles = async () => {
    if (duplicateFiles.length > 0) {
      try {
        setIsLoading(true);
        const userData = getUserData();
        let destinationFolder;
        if (!!selectedItem && selectedItem.type == "folder") {
          destinationFolder = selectedItem.id;
        } else {
          destinationFolder = userData.boxFolderId;
        }

        const requestOptions = {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: duplicateFiles,
            destinationFolderId: destinationFolder,
            userId: userData.boxUserId
          }),
        };

        const response = await fetchWrapper(
          "/api/box/files/duplicate",
          requestOptions,
          "upload-file"
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to upload files");
        }

        setLocation([...data.files.map((file) => file.name)]);
        await refreshFiles().then(() => {
          setDuplicateFiles([]);
          toast.success("File uploaded successfully");
        });
      } catch (error) {
        toast.error(error.message);
        console.error("Error uploading files:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading && !isReplaceLoading) {
          setLocation([]);
          setIsModalOpen(false);
        }
      }}
    >
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-md bg-background"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-border pb-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-xl font-medium text-foreground">
              {title}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setLocation([]);
                setIsModalOpen(false);
              }}
              disabled={isLoading || isReplaceLoading}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {!isDuplicateFile && (
          <div className="space-y-4 px-1 py-2 text-center">
            <DialogDescription className="text-base font-medium text-success">
              {message}
            </DialogDescription>

            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <div>Location: Home{path}</div>
              <div>Name: {[...location, ...fileLocation].join(", ")}</div>
            </div>

            <DialogFooter className="m-0 p-0 pt-2 bg-transparent">
              <Button
                type="button"
                onClick={() => {
                  setLocation([]);
                  setIsModalOpen(false);
                }}
                disabled={isLoading}
                className="px-3 py-3"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}

        {isDuplicateFile && (
          <div className="space-y-4 px-1 py-2">
            <DialogDescription className="text-center text-base text-foreground">
              A file with the same name already exists. What would you like to do?
            </DialogDescription>

            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Name: {duplicateFiles?.map((file) => file.name).join(", ")}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={handleReplaceFiles}
                disabled={isReplaceLoading || isLoading}
                className="px-3 py-3"
              >
                {isReplaceLoading ? (
                  <LoaderSpinner size={18} className="text-primary-foreground" />
                ) : null}
                Replace Existing File
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleCreateDuplicateFiles}
                disabled={isLoading || isReplaceLoading}
                className="px-3 py-3 bg-success text-success-foreground hover:bg-success/90"
              >
                {isLoading ? (
                  <LoaderSpinner size={18} className="text-success-foreground" />
                ) : null}
                Upload as Duplicate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadFileConfirmDialog;
