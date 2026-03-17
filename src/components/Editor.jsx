"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Loader2, MessageSquareDiff, Save, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { SignJWT } from "jose";
import Button from "./Common/Elements/Button";
import { useSelector } from "react-redux";

function Editor({ isModalOpen, setIsModalOpen, item, selectedItem }) {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [token, setToken] = useState("");
  const [fileType, setFileType] = useState("");
  const [blobReq, setBlobReq] = useState(false);
  const [replaceReq, setReplaceReq] = useState(false);
  // const [user, setUser] = useState(null);
  const [isOpenCommentBox, setIsOpenCommentBox] = useState(false);
  const [message, setMessage] = useState("");
  const [isPostLoading, setIsPostLoading] = useState(false);
  const [comments, setComments] = useState([]);

  const { data: user } = useSelector((state) => state.user);

  const getDocumentType = (fileType) => {
    const fileMappings = {
      word: ["doc", "docx", "odt", "rtf", "txt"],
      cell: ["xls", "xlsx", "ods", "csv"],
      slide: ["ppt", "pptx", "odp"],
    };
    return (
      Object.keys(fileMappings).find((type) =>
        fileMappings[type].includes(fileType)
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
          url
        )}&fileType=${fileTypeParam}&token=${token}`,
        { responseType: "blob" }
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

      const secretKey = new TextEncoder().encode(
        "4f5e6eef675c4ed79ba5c56b421cd6d2"
      );

      const tokenPayload = {
        document: {
          fileType: fetchedFileType,
          key: item?.id,
          title: item.name,
          url: fileUrl,
          permissions: { edit: true, download: true },
        },
        documentType: documentType,
        editorConfig: {
          user: { id: user?.id, firstName: user?.firstName, lastName: user?.lastName },
          customization: {
            autoSave: true,
            uiTheme: "default-light",
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
  }, [item, isLoading]);

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
        "fetch-comments"
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
        "create-comment"
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

  return (
    <>
      {isModalOpen && (
        <div className="relative z-50">
          {/* Modal Background */}
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-[90vw] min-h-[80vh] max-h-[90vh] overflow-auto bg-white rounded-lg shadow-lg flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center border-b px-6 py-4">
                <h2 className="text-xl text-gray-800 font-semibold">
                  Edit &quot;{item?.name}&quot;
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Editor Section */}
              <div className="flex flex-col md:flex-row w-full h-[80vh] sm:h-[70vh]">
                <div className="flex-1 overflow-hidden min-h-0">
                  <div className="h-[100%]">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div
                        id="onlyoffice-editor"
                        ref={editorRef}
                        className="h-full w-full"
                      // style={{ minHeight: "600px" }}
                      ></div>
                    )}
                  </div>
                </div>

                {/* Comment Section */}
                <div className="w-full md:w-[30%] md:border-l p-3 bg-gray-50 text-sm text-[#000000e8] flex flex-col font-lato pb-4">
                  {comments &&
                    comments.length > 0 &&
                    comments?.map((comment) => (
                      <div
                        key={comment?.id}
                        className="cursor-pointer w-full"
                        onClick={() => setIsOpenCommentBox((prev) => !prev)}
                      >
                        {comment?.user && (
                          <div className="flex items-start gap-3 pt-3 pb-5 border-b border-[#0000001a]">
                            <div className="flex items-center justify-center p-2 rounded-full bg-blue-600 text-white font-bold text-sm">
                              {comment?.user?.firstName
                                ?.split(" ")
                                .map((word) => word.charAt(0).toUpperCase())
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div>
                              <p>{comment?.user?.email}</p>
                              <p className="text-gray-600">
                                {formatTimestamp(comment?.created_at)}
                              </p>
                              <p>{comment?.message}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  {comments && comments.length === 0 && (
                    <div className="flex flex-col items-center my-auto text-gray-500 py-5">
                      <MessageSquareDiff className="w-10 h-10 text-blue-500" />
                      <p className="text-lg font-semibold mt-2 text-[#000000bd]">
                        No comments to show
                      </p>
                      <span className="text-sm text-[#000000bd]">
                        Be the first to add a comment!
                      </span>
                    </div>
                  )}

                  {/* Comment Input */}
                  {isOpenCommentBox ? (
                    <div className="flex flex-col mt-auto">
                      <div className="flex items-start mb-4">
                        <div className="flex items-center justify-center p-2 rounded-full bg-blue-600 text-white font-bold text-sm">
                          {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()
                            ?.split(" ")
                            .map((word) => word.charAt(0).toUpperCase())
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <textarea
                          placeholder="Write a comment..."
                          className="border w-full mx-3 cursor-pointer h-24 rounded-md shadow-inner px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none placeholder-gray-400"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex ml-auto space-x-2">
                        <Button
                          type="Secondary"
                          onClick={() => setIsOpenCommentBox(false)}
                          disabled={isPostLoading}
                          label="Cancel"
                        />

                        <Button
                          type="Primary"
                          onClick={handleAddComment}
                          disabled={isPostLoading}
                          label={"Post"}
                          isLoading={isPostLoading}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center mt-auto cursor-pointer"
                      onClick={() => setIsOpenCommentBox((prev) => !prev)}
                    >
                      <div className="flex items-center justify-center size-8 p-2 rounded-full bg-blue-600 text-white font-bold text-sm">
                        {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()
                          ?.split(" ")
                          .map((word) => word.charAt(0).toUpperCase())
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <input
                        type="text"
                        placeholder="Write a comment"
                        className="border w-full mx-3 h-9 rounded-md shadow-inner pl-4 text-sm outline-none text-gray-700"
                      />
                    </div>
                  )}
                </div>
              </div>
              {/* Footer Buttons */}
              <div className="flex justify-end border-t px-4 py-3 space-x-2">
                <Button
                  type="Secondary"
                  onClick={() => {
                    if (editorRef.current?.destroyEditor) {
                      editorRef.current.destroyEditor();
                    }
                    setIsModalOpen(false);
                  }}
                  disabled={isSaveLoading}
                  label="Cancel"
                />

                <Button
                  type="Primary"
                  disabled={isSaveLoading || isLoading}
                  onClick={async () => {
                    if (editorRef.current?.downloadAs) {
                      setIsSaveLoading(true);
                      editorRef.current.downloadAs();
                    }
                  }}
                  label={"Save"}
                  isLoading={isSaveLoading}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Editor;
