import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Loader2, MessageSquareDiff, Save, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { SignJWT } from "jose";
import Button from "./Common/Elements/Button";

function Editor({ isModalOpen, setIsModalOpen, item, selectedItem }) {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [token, setToken] = useState("");
  const [fileType, setFileType] = useState("");
  const [blobReq, setBlobReq] = useState(false);
  const [replaceReq, setReplaceReq] = useState(false);
  const [user, setUser] = useState(null);
  const [isOpenCommentBox, setIsOpenCommentBox] = useState(false);
  const [message, setMessage] = useState("");
  const [isPostLoading, setIsPostLoading] = useState(false);
  const [comments, setComments] = useState([]);

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

  const getBlobFromUrl = async (url, fileType) => {
    try {
      if (blobReq) {
        return;
      } else {
        setBlobReq(true);
      }
      const userData = getUserData();
      console.log("FileType", fileType)
      const response = await fetchWrapper(
        `/api/box/files/proxy-file?url=${encodeURIComponent(
          url
        )}&&fileType=${fileType}&&token=${token}`,
        { responseType: "blob" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file. Status: ${response.status}`);
      }

      const blob = await response.blob(); // ✅ Convert response to Blob
      console.log("✅ Blob received:", blob);

      return blob;
    } catch (error) {
      console.error("❌ Error fetching blob:", error);
      return null;
    }
  };

  const getFile = useCallback(async () => {
    if (!item?.id || isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetchWrapper(`/api/box/editor?fileId=${item.id}`, {
        method: "GET",
      });

      if (!response || !response.ok) throw new Error("Failed to fetch file");

      const { fileUrl, fileType } = await response.json();
      setIsLoading(false);
      setFileUrl(fileUrl);
      setFileType(fileType);
      const userData = getUserData();
      const secretKey = new TextEncoder().encode(
        "9bce206dc17d48548d37a329732a3c88"
      );

      const tokenPayload = {
        document: {
          fileType: fileType,
          key: item.id,
          title: item.name,
          url: fileUrl,
          permissions: { edit: true, download: true },
        },
        documentType: getDocumentType(fileType),
        editorConfig: {
          user: { id: userData.id, name: userData.name },
          customization: { autoSave: true, uiTheme: 'default-light', features : { tabBackground : { mode : "toolbar"}} },
        },
        // events: {
        //   onRequestSaveAs: async function (event) {
        //     console.log("Saving document...");
        //     try {
        //       const data = event.data; // Get file data from ONLYOFFICE
        //       console.log("fileData", event);
        //       const blob = await getBlobFromUrl(data.url, fileType);
        //       console.log("blob", blob);
        //       await uploadFileToBox(blob);
        //     } catch (error) {
        //       console.error("Error updating file:", error);
        //       toast.error("Failed to save document.");
        //     }
        //   },
        //   onRequestClose: function () {
        //     console.log("Editor closed");
        //     if (editorRef.current && editorRef.current.destroyEditor) {
        //       editorRef.current.destroyEditor();
        //     }
        //   },
        //   onDownloadAs: async function (event) {
        //     console.log("Saving document...");
        //     try {
        //       const data = event.data; // Get file data from ONLYOFFICE
        //       console.log("fileData", event);
        //       const blob = await getBlobFromUrl(data.url, fileType);
        //       console.log("blob", blob);
        //       await uploadFileToBox(blob);
        //     } catch (error) {
        //       console.error("Error updating file:", error);
        //       toast.error("Failed to save document.");
        //     }
        //   },
        // },
      };

      const token = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secretKey);
      setToken(token);

      if (
        editorRef.current &&
        typeof editorRef.current.destroyEditor === "function"
      ) {
        console.log("🔹 Destroying old editor instance...", editorRef.current);
        editorRef.current.destroyEditor();
      }

      console.log('tokenPayload: ', tokenPayload);
      setTimeout(()=>{
        console.log('tokenPayload: ', tokenPayload);
      },1000)

      editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", {
        ...tokenPayload,
        token,
        height: "100%",
        width: "100%",
      });

      console.log("editor.current", editorRef.current);
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
      return;
    }
    try {
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

      toast.success("File saved successfully");
      editorRef.current.destroyEditor();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
      console.error("Error processing file:", error);
      setIsModalOpen(false);
      setIsSaveLoading(false);
    }
  };

  async function handleSaveFile() {
    if (!editorRef.current) return;
    setIsSaveLoading(true);

    try {
      console.log("editor.current", editorRef.current);
      editorRef.current.downloadAs();
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document.");
    }
  }

  useEffect(() => {
    if (isModalOpen) getFile();
  }, [isModalOpen]);

  useEffect(() => {
    const userData = getUserData();
    setUser(userData)
    fetFileComments()
  }, []);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        console.log("Destroy", editorRef.current);
        editorRef.current.destroyEditor();
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
      setComments(data.data)

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
            body: JSON.stringify({ message: message, fileId: item?.id, boxUserId : user.boxUserId }),
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
        setIsOpenCommentBox(false)
      }
    };

    function formatTimestamp(isoString) {
      const date = new Date(isoString);
      const now = new Date();
    
      const isToday =
        date.toDateString() === now.toDateString(); // Check if the date is today
    
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
    <Dialog open={isModalOpen} onClose={() => {}} className="relative z-50">
      {/* Modal Background */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-[90vw] min-h-[80vh] bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center border-b px-6 py-4 text-black">
            <h2 className="text-lg font-semibold">Edit “{item?.name}”</h2>
            <button
              onClick={() => {
                if (editorRef.current?.destroyEditor) {
                  editorRef.current.destroyEditor();
                }
                setIsModalOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex w-full pb-4">
            {/* Editor Section */}
            <div className="w-[65vw] h-[73vh] flex-1">
              <div className="h-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <div
                    id="onlyoffice-editor"
                    ref={editorRef}
                    className="h-full w-full"
                    // style={{backgroundColor:' #007BFF !important'}}
                  ></div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end border-t mt-4 px-4 py-3 space-x-2">
                {/* <button
                  onClick={() => {
                    if (editorRef.current?.destroyEditor) {
                      editorRef.current.destroyEditor();
                    }
                    setIsModalOpen(false);
                  }}
                  disabled={isSaveLoading}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button> */}
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
                  disabled={isSaveLoading}
                  onClick={handleSaveFile}
                  label={"Save"}
                  isLoading={isSaveLoading}
                />
                {/* <button
                  onClick={handleSaveFile}
                  disabled={isSaveLoading}
                  className="px-4 py-2 flex items-center bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaveLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </button> */}
              </div>
            </div>

            {/* Comment Section */}
            <div className="w-[25vw] border-l p-3 bg-gray-50 text-sm text-[#000000e8] flex flex-col font-lato h-[80vh]">
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
                          {comment?.user?.name
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
                <div className="flex flex-col items-center my-auto text-gray-500">
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
                      {user?.name
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
                    {/* <button
                      className="text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100"
                      onClick={() => setIsOpenCommentBox(false)}
                      disabled={isPostLoading}
                    >
                      Cancel
                    </button> */}
                    {/* <button
                      className={`text-white px-4 py-2 rounded-lg border-gray bg-blue-500 hover:bg-blue-600  ${
                        isPostLoading ? "bg-gray-400 cursor-not-allowed" : ""
                      }`}
                      onClick={handleAddComment}
                      disabled={isPostLoading}
                    >
                      {isPostLoading ? "Posting..." : "Post"}
                    </button> */}
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center mt-auto cursor-pointer"
                  onClick={() => setIsOpenCommentBox((prev) => !prev)}
                >
                  <div className="flex items-center justify-center p-2 rounded-full bg-blue-600 text-white font-bold text-sm">
                    {user?.name
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
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default Editor;
