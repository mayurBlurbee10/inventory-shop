import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import FileExplorer from "../FileExplorer";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

const processBoxFiles = (files) => {
  if (!files) return;
  const itemsMap = new Map();
  const rootItems = [];

  files.forEach((file) => {
    const item = {
      id: file.id,
      name: file.name,
      type: file.type || "file",
      size: file.size,
      created_at: file.created_at,
      modified_at: file.modified_at,
      children: [],
    };
    itemsMap.set(file.id, item);

    if (!file.parent || !itemsMap.has(file.parent?.id)) {
      rootItems.push(item);
    } else {
      const parent = itemsMap.get(file.parent.id);
      parent?.children.push(item);
    }
  });

  return rootItems;
};

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
           body: JSON.stringify({ collaborated: user?.collaborationIds }),
         };

        // const response = await fetchWrapper(
        //   `/api/box/files?folderId=${encodeURIComponent(user.folderId)}`,{},
        //   "fetch-file"
        // );

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col relative">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Files - {user.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <FileExplorer data={files} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;
