import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Loader2, Save, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import WebViewer from "@pdftron/webviewer";
import { fileTypeFromStream } from "file-type";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";

function Editor({ isModalOpen, setIsModalOpen, item, selectedItem }) {
  const viewer = useRef({ instance: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  const getFile = useCallback(
    async (fileId) => {
      if (isLoading) return; // Prevent multiple loads
      setIsLoading(true);

      try {
        const response = await fetchWrapper(
          `/api/box/editor?fileId=${fileId}`,
          { method: "GET" },
          "fetchFileData"
        );
        if (!response || !response.ok) throw new Error("Failed to fetch file");
        const filename = response.headers.get("Content-Disposition")?.match(/filename="(.+?)"/)?.[1] ?? "";

        const clonedResponse = response.clone();
        const fileType = await fileTypeFromStream(clonedResponse.body);
        const myBlob = await response.blob();

        if (!viewer.current.instance) {
          new WebViewer(
            {
              path: "/webviewer/lib",
              licenseKey: "demo:1739516544560:617db83d0300000000ca222df66536ec5d40f563fac11f8a720f5da897",
              enableOfficeEditing: true,
            },
            viewer.current
          ).then((instance) => {
            instance.UI.enableFeatures([instance.UI.Feature.ContentEdit]);
            const { documentViewer, annotationManager } = instance.Core;
            instance.UI.loadDocument(myBlob, { filename });
            viewer.current.instance = instance;
            instance.UI.disableElements([
              "newDocumentButton",
              "saveAsButton",
              "printButton",
            ]);

            document
              .getElementById("save-editor")
              .addEventListener("click", async (event) => {
                event.preventDefault();
                setIsSaveLoading(true);
                const doc = documentViewer.getDocument();
                const xfdfString = await annotationManager.exportAnnotations();
                const data = await doc.getFileData({ xfdfString });
                const arr = new Uint8Array(data);
                const blob = new Blob([arr], { type: fileType.mime });
                console.log("blob: ", blob);
                await uploadFileToBox(new File([blob], filename, { type: fileType.mime }));
              });

            instance.UI.setHeaderItems((header) => {});
          });
        } else {
          viewer.current.instance.UI.loadDocument(myBlob, { filename });
        }
      } catch (error) {
        console.error("Error loading file:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const uploadFileToBox = async (file) => {
    try {
      console.log('selectedItem: ', selectedItem)
      const userData = getUserData();
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("boxFolderId", selectedItem.id);
      uploadData.append("email", userData.email);
      const requestOptions = {
        method: "POST",
        body: uploadData,
      };

      const response = await fetchWrapper(
        "/api/box/files/replace",
        requestOptions,
        "uploadFile"
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload files");
      }
      toast.success("File save successfully");
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
      console.error("Error uploading file to Box:", error);
    }
  };

  useEffect(() => {
    if (item?.id && !isLoading) {
      console.log("item: ", item);
      getFile(item.id);
    }
  }, [item]);

  useEffect(() => {
    return () => {
      if (viewer.current?.instance) {
        viewer.current.instance.dispose();
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
          {/* Header */}
          <div className="flex justify-between items-center border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Edit “{item?.name}”</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Editor */}
          <div className="p-4 space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center h-60">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            )}
            <div
              className="webviewer"
              ref={viewer}
              style={{ height: "70vh" }}
            ></div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end border-t px-4 py-3 space-x-2">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSaveLoading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              id="save-editor"
              // onClick={() => {
              //   handleSave();
              //   setIsLoading(true);
              //   setTimeout(() => setIsLoading(false), 2000);
              // }}
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
