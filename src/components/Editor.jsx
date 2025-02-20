import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Loader2, Save, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { SignJWT } from "jose";

function Editor({ isModalOpen, setIsModalOpen, item, selectedItem }) {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [token, setToken] = useState("");
  const [fileType, setFileType] = useState("");
  const [blobReq, setBlobReq] = useState(false);
  const [replaceReq, setReplaceReq] = useState(false);

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
          customization: { autoSave: true },
        },
        events: {
          onRequestSaveAs: async function (event) {
            console.log("Saving document...");
            try {
              const data = event.data; // Get file data from ONLYOFFICE
              console.log("fileData", event);
              const blob = await getBlobFromUrl(data.url, fileType);
              console.log("blob", blob);
              await uploadFileToBox(blob);
            } catch (error) {
              console.error("Error updating file:", error);
              toast.error("Failed to save document.");
            }
          },
          onRequestClose: function () {
            console.log("Editor closed");
            if (editorRef.current && editorRef.current.destroyEditor) {
              editorRef.current.destroyEditor();
            }
          },
          onDownloadAs: async function (event) {
            console.log("Saving document...");
            try {
              const data = event.data; // Get file data from ONLYOFFICE
              console.log("fileData", event);
              const blob = await getBlobFromUrl(data.url, fileType);
              console.log("blob", blob);
              await uploadFileToBox(blob);
            } catch (error) {
              console.error("Error updating file:", error);
              toast.error("Failed to save document.");
            }
          },
        },
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

      editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", {
        ...tokenPayload,
        token,
        height: "100%",
        width: "100%",
      });
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
    return () => {
      if (editorRef.current) {
        console.log("Destroy", editorRef.current);
        editorRef.current.destroyEditor();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <Dialog
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      className="relative z-50 text-gray-600"
    >
      <div className="fixed inset-0 bg-black/10" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-3xl rounded-lg bg-white shadow-lg">
          <div className="flex justify-between items-center border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Edit “{item?.name}”</h2>
            <button
              onClick={() => {
                if (
                  editorRef.current &&
                  typeof editorRef.current.destroyEditor === "function"
                ) {
                  console.log(
                    "🔹 Destroying old editor instance...",
                    editorRef.current
                  );
                  editorRef.current.destroyEditor();
                }
                setIsModalOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4" style={{ height: "80vh" }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-60">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <div
                id="onlyoffice-editor"
                ref={editorRef}
                style={{ height: "80vh", width: "100%" }}
              ></div>
            )}
          </div>
          <div className="flex justify-end border-t px-4 py-3 space-x-2">
            <button
              onClick={() => {
                if (
                  editorRef.current &&
                  typeof editorRef.current.destroyEditor === "function"
                ) {
                  console.log(
                    "🔹 Destroying old editor instance...",
                    editorRef.current
                  );
                  editorRef.current.destroyEditor();
                }
                setIsModalOpen(false);
              }}
              disabled={isSaveLoading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
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
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default Editor;
