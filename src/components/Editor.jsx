import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Loader2, Save, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { SignJWT } from "jose";
import { fileTypeFromStream } from "file-type";

function Editor({ isModalOpen, setIsModalOpen, item, selectedItem }) {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

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

  const getFile = useCallback(async () => {
    if (!item?.id || isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetchWrapper(`/api/box/editor?fileId=${item.id}`, {
        method: "GET",
      });

      if (!response || !response.ok) throw new Error("Failed to fetch file");

      const clonedResponse = response.clone();
      const fileType = await fileTypeFromStream(clonedResponse.body);
      const fileBlob = await response.blob();
      const fileUrl = URL.createObjectURL(fileBlob);

      const userData = getUserData();
      const secretKey = new TextEncoder().encode(
        "9bce206dc17d48548d37a329732a3c88"
      );

      const tokenPayload = {
        document: {
          fileType: fileType.ext,
          key: item.id,
          title: item.name,
          url: fileUrl,
          permissions: { edit: true, download: true },
        },
        documentType: getDocumentType(fileType.ext),
        editorConfig: { user: { id: userData.id, name: userData.name } },
      };

      const token = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secretKey);

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

  const uploadFileToBox = async () => {
    if (!editorRef.current) {
      toast.error("Editor instance not found.");
      return;
    }

    setIsSaveLoading(true);
    try {
      editorRef.current.saveAs(async (blob) => {
        const uploadData = new FormData();
        uploadData.append("file", blob, item.name);
        uploadData.append("boxFolderId", selectedItem.id);
        uploadData.append("email", getUserData().email);

        const response = await fetchWrapper("/api/box/files/replace", {
          method: "POST",
          body: uploadData,
        });

        if (!response.ok) throw new Error("Failed to upload file");

        toast.success("File saved successfully");
        setIsModalOpen(false);
      }, "blob");
    } catch (error) {
      toast.error(error.message);
      console.error("Error uploading file:", error);
    } finally {
      setIsSaveLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) getFile();
  }, [isModalOpen]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
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
              onClick={() => setIsModalOpen(false)}
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
              onClick={() => setIsModalOpen(false)}
              disabled={isSaveLoading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={uploadFileToBox}
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
