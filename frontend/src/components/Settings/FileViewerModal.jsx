import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import FileExplorer from "../FileExplorer";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const FileViewerModal = ({ isOpen, onClose, user }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError("");

        const requestOptions = {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ collaborated: user?.collaborationIds, boxUserId: user?.boxUserId }),
        };

        const response = await fetchWrapper(
          `/api/box/collaborations`,
          requestOptions,
          "view-user-files"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch files");
        }

        // setFiles(processBoxFiles(data));
        const data = await response.json();
        const newData = data?.items || [];
        setFiles(newData);
      } catch (error) {
        setError("Failed to load files");
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && user) {
      fetchFiles();
    }
  }, [isOpen, user]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[80vh] w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 p-0 sm:w-full sm:max-w-4xl"
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Files - {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div
          className={
            loading
              ? "flex min-h-0 flex-1 items-center justify-center p-6"
              : "min-h-0 flex-1 overflow-y-auto p-6"
          }
        >
          {error && (
            <Alert variant="destructive" className="mb-4 border-destructive/30">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <LoaderSpinner size={32} className="text-secondary-foreground" />
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <FileExplorer data={files} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerModal;
