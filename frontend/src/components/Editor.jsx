"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquareDiff, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { SignJWT } from "jose";
import { useSelector } from "react-redux";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { getStoredMode } from "@/app/lib/theme-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function Editor({ isModalOpen, setIsModalOpen, item, selectedItem }) {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [token, setToken] = useState("");
  const [fileType, setFileType] = useState("");
  const [blobReq, setBlobReq] = useState(false);
  const [replaceReq, setReplaceReq] = useState(false);
  const [isOpenCommentBox, setIsOpenCommentBox] = useState(false);
  const [message, setMessage] = useState("");
  const [isPostLoading, setIsPostLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [themeMode, setThemeMode] = useState(() =>
    typeof window !== "undefined" ? getStoredMode() : "light",
  );

  const { data: user } = useSelector((state) => state.user);

  useEffect(() => {
    const handleModeChange = (event) => {
      setThemeMode(event?.detail || getStoredMode());
    };
    setThemeMode(getStoredMode());
    window.addEventListener("theme-mode-changed", handleModeChange);
    return () => {
      window.removeEventListener("theme-mode-changed", handleModeChange);
    };
  }, []);

  const getDocumentType = (fileType) => {
    const fileMappings = {
      word: ["doc", "docx", "odt", "rtf", "txt"],
      cell: ["xls", "xlsx", "ods", "csv"],
      slide: ["ppt", "pptx", "odp"],
    };
    return (
      Object.keys(fileMappings).find((type) =>
        fileMappings[type].includes(fileType),
      ) || "pdf"
    );
  };

  const getBlobFromUrl = async (url, fileTypeParam) => {
    try {
      if (blobReq) {
        return;
      } else {
        setBlobReq(true);
      }
      console.log("FileType", fileTypeParam);
      const response = await fetchWrapper(
        `/api/box/files/proxy-file?url=${encodeURIComponent(
          url,
        )}&fileType=${fileTypeParam}&token=${token}`,
        { responseType: "blob" },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file. Status: ${response.status}`);
      }

      const blob = await response.blob(); // ✅ Convert response to Blob
      console.log("✅ Blob received:", blob);

      setBlobReq(false);
      return blob;
    } catch (error) {
      console.error("❌ Error fetching blob:", error);
      setBlobReq(false);
      return null;
    }
  };

  const getFile = useCallback(async () => {
    if (!item?.id || isLoading) return;

    const response = await fetchWrapper(`/api/box/editor?fileId=${item.id}`, {
      method: "GET",
    });

    if (!response || !response.ok) throw new Error("Failed to fetch file");

    const { fileUrl, fileType: fetchedFileType } = await response.json();
    setFileType(fetchedFileType);

    // Wait for OnlyOffice API to be available
    if (typeof window !== "undefined" && !window.DocsAPI) {
      // Wait for script to load
      let attempts = 0;
      while (!window.DocsAPI && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      if (!window.DocsAPI) {
        console.error("OnlyOffice API failed to load");
        return;
      }
    }

    setIsLoading(true);

    try {
      const documentType = getDocumentType(fetchedFileType);
      // Capture fileType for use in event callbacks
      const currentFileType = fetchedFileType;
      const currentMode =
        typeof window !== "undefined" ? getStoredMode() : themeMode;

      const secretKey = new TextEncoder().encode(
        "4f5e6eef675c4ed79ba5c56b421cd6d2",
      );

      const tokenPayload = {
        document: {
          fileType: fetchedFileType,
          key: `${item.id}-${Date.now()}`,
          title: item.name,
          url: fileUrl,
          permissions: { edit: true, download: true },
        },
        documentType: documentType,
        editorConfig: {
          user: {
            id: user?.id,
            firstName: user?.firstName,
            lastName: user?.lastName,
          },
          customization: {
            autoSave: true,
            uiTheme: currentMode === "dark" ? "default-dark" : "default-light",
            features: { tabBackground: { mode: "toolbar" } },
          },
        },
        events: {
          onRequestSaveAs: async function (event) {
            console.log("Saving document...");
            try {
              const data = event.data; // Get file data from ONLYOFFICE
              console.log("fileData", event);
              const blob = await getBlobFromUrl(data.url, currentFileType);
              console.log("blob", blob);
              if (blob) {
                await uploadFileToBox(blob);
              }
            } catch (error) {
              console.error("Error updating file:", error);
            }
          },
          onRequestClose: function () {
            console.log("Editor closed");
            if (editorRef.current && editorRef.current.destroyEditor) {
              editorRef.current.destroyEditor();
            }
          },
          onDownloadAs: async function (event) {
            console.log("Downloading document...");
            try {
              const data = event.data; // Get file data from ONLYOFFICE
              console.log("fileData", event);
              const blob = await getBlobFromUrl(data.url, currentFileType);
              console.log("blob", blob);
              if (blob) {
                await uploadFileToBox(blob);
              }
            } catch (error) {
              console.error("Error downloading file:", error);
            }
          },
        },
      };

      const jwtToken = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secretKey);

      setToken(jwtToken);

      // Destroy existing editor instance if it exists
      if (
        editorRef.current &&
        typeof editorRef.current.destroyEditor === "function"
      ) {
        console.log("🔹 Destroying old editor instance...", editorRef.current);
        editorRef.current.destroyEditor();
      }

      console.log("editor.current Before", editorRef.current);
      console.log("token", jwtToken);

      // Initialize new editor instance
      editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", {
        ...tokenPayload,
        token: jwtToken,
        height: "100%",
        width: "100%",
      });

      console.log("editor.current", editorRef.current);

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Error loading document.");
    } finally {
      setIsLoading(false);
    }
  }, [item, isLoading, themeMode, user]);

  const uploadFileToBox = async (blob) => {
    if (replaceReq) {
      return;
    } else {
      setReplaceReq(true);
    }
    if (!blob) {
      console.log("No blob");
      setReplaceReq(false);
      return;
    }
    try {
      setIsSaveLoading(true);
      const userData = getUserData();
      const formData = new FormData();
      formData.append("file", blob, item.name);
      if (!!selectedItem && selectedItem.type == "folder") {
        formData.append("boxFolderId", selectedItem.id);
      } else {
        formData.append("boxFolderId", userData.boxFolderId);
      }
      formData.append("email", userData.email);

      const response = await fetchWrapper("/api/box/files/replace", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload file");

      const result = await response.json();
      console.log("File uploaded successfully:", result);
      toast.success("File saved successfully");

      if (editorRef.current?.destroyEditor) {
        editorRef.current.destroyEditor();
      }
      setIsModalOpen(false);
      setReplaceReq(false);
      setIsSaveLoading(false);
    } catch (error) {
      toast.error(error.message);
      console.error("Error processing file:", error);
      setIsModalOpen(false);
      setIsSaveLoading(false);
      setReplaceReq(false);
    }
  };

  const handleClose = () => {
    if (editorRef.current?.destroyEditor) {
      console.log("🔹 Destroying old editor instance...", editorRef.current);
      editorRef.current.destroyEditor();
    }
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (isModalOpen && item) {
      getFile();
    }
  }, [isModalOpen, item, getFile]);

  useEffect(() => {
    // const userData = getUserData();
    // setUser(userData);
    fetFileComments();
  }, []);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        if (editorRef.current.destroyEditor) {
          console.log("Destroy", editorRef.current);
          editorRef.current.destroyEditor();
        }
        editorRef.current = null;
      }
    };
  }, []);

  const fetFileComments = async () => {
    try {
      // setIsExistingPageLoading(true);
      const response = await fetchWrapper(
        `/api/box/comment?fileId=${item?.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
        "fetch-comments",
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete page");
      }
      setComments(data.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      // setIsExistingPageLoading(false);
    }
  };

  const handleAddComment = async () => {
    try {
      setIsPostLoading(true);
      const response = await fetchWrapper(
        "/api/box/comment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            fileId: item?.id,
            boxUserId: user.boxUserId,
          }),
        },
        "create-comment",
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete page");
      }
      fetFileComments();
      setMessage("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsPostLoading(false);
      setIsOpenCommentBox(false);
    }
  };

  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString(); // Check if the date is today

    const options = {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };

    const timeString = date.toLocaleTimeString("en-US", options); // Format time

    if (isToday) {
      return `Today at ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      return `${dateString} at ${timeString}`;
    }
  }

  const userDisplayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open && !isSaveLoading) {
          handleClose();
        }
      }}
    >
      <DialogContent
        className="flex max-h-[90vh] min-h-[80vh] w-full max-w-[90vw] flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-[90vw]"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <DialogHeader className="min-w-0 shrink-0 space-y-0 border-b border-border px-6 py-4 text-left">
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <DialogTitle
              className="min-w-0 flex-1 overflow-hidden text-xl font-semibold text-foreground"
              title={item?.name}
            >
              <span className="block truncate">
                Edit &quot;{item?.name}&quot;
              </span>
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="min-h-[40vh] flex-1 overflow-hidden md:min-h-0">
            {isLoading ? (
              <div className="flex h-full items-center justify-center bg-background">
                <LoaderSpinner size={32} className="text-secondary-foreground" />
              </div>
            ) : (
              <div id="onlyoffice-editor" className="h-full w-full" />
            )}
          </div>

          <div className="flex w-full flex-col border-t border-border bg-muted/30 p-3 text-sm text-foreground md:w-[30%] md:border-l md:border-t-0">
            <ScrollArea className="min-h-0 flex-1">
              {comments &&
                comments.length > 0 &&
                comments?.map((comment) => (
                  <button
                    key={comment?.id}
                    type="button"
                    className="w-full cursor-pointer text-left"
                    onClick={() => setIsOpenCommentBox((prev) => !prev)}
                  >
                    {comment?.user && (
                      <div className="flex items-start gap-3 border-b border-border py-3">
                        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                          <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                            {getInitials(
                              `${comment?.user?.firstName || ""} ${comment?.user?.lastName || ""}`.trim() ||
                                comment?.user?.email ||
                                "",
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-foreground">
                            {comment?.user?.email}
                          </p>
                          <p className="text-muted-foreground">
                            {formatTimestamp(comment?.created_at)}
                          </p>
                          <p className="break-words text-foreground">
                            {comment?.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                ))}

              {comments && comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <MessageSquareDiff className="h-10 w-10 text-primary" />
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    No comments to show
                  </p>
                  <span className="text-sm text-muted-foreground">
                    Be the first to add a comment!
                  </span>
                </div>
              )}
            </ScrollArea>

            {isOpenCommentBox ? (
              <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0 bg-primary text-primary-foreground">
                    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                      {getInitials(userDisplayName || user?.email || "")}
                    </AvatarFallback>
                  </Avatar>
                  <Textarea
                    placeholder="Write a comment..."
                    className="min-h-24 !bg-background text-foreground"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpenCommentBox(false)}
                    disabled={isPostLoading}
                    className="px-3 py-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddComment}
                    disabled={isPostLoading || !message.trim()}
                    className="px-3 py-3"
                  >
                    {isPostLoading ? (
                      <LoaderSpinner
                        size={18}
                        className="text-primary-foreground"
                      />
                    ) : null}
                    Post
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="mt-3 flex w-full items-center gap-3 border-t border-border pt-3 text-left"
                onClick={() => setIsOpenCommentBox((prev) => !prev)}
              >
                <Avatar className="h-8 w-8 shrink-0 bg-primary text-primary-foreground">
                  <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                    {getInitials(userDisplayName || user?.email || "")}
                  </AvatarFallback>
                </Avatar>
                <Input
                  type="text"
                  readOnly
                  placeholder="Write a comment"
                  className="pointer-events-none flex-1 !bg-background text-foreground"
                />
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 gap-2 rounded-none border-t border-border bg-muted/30 px-4 py-3 bg-transparent">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (editorRef.current?.destroyEditor) {
                editorRef.current.destroyEditor();
              }
              setIsModalOpen(false);
            }}
            disabled={isSaveLoading}
            className="px-3 py-3"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaveLoading || isLoading}
            onClick={async () => {
              if (editorRef.current?.downloadAs) {
                setIsSaveLoading(true);
                editorRef.current.downloadAs();
              }
            }}
            className="px-3 py-3"
          >
            {isSaveLoading ? (
              <LoaderSpinner size={18} className="text-primary-foreground" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Editor;
