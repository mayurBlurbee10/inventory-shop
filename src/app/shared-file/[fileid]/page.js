"use client";import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function SharedFilePage() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [itemUrl, setItemUrl] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    console.log("params: ", params);
    console.log("useEffect: ");
    getSharedFile(params.fileid);
  }, []);

  const getSharedFile = async (fileId) => {
    try {
      setIsLoading(true);
      const requestOptions = {
        method: "GET",
      };
      const response = await fetchWrapper(
        `/api/box/share?fileId=${fileId}`,
        requestOptions,
        "fetchSharedFile"
      );
      console.log("response: ", response);
      if (!response.ok) throw new Error("Failed to fetch shared files");

      const headers = response.headers;
      const contentDisposition = headers.get("Content-Disposition");
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match && match[1]) {
          const filename = match[1];
          setFileName(filename)
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      console.log("url: ", url);
      setItemUrl(url);
    } catch (error) {
      console.error("Error get shared files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-white">
      {fileName && (
        <div className="p-3 border-1 border-b flex items-center justify-start gap-3">
          <h2 className="text-l font-semibold text-gray-800">{fileName}</h2>
        </div>
      )}
      <div className="h-[calc(100vh-50px)] p-4 bg-[#f5f5f5]">
        <img src={itemUrl} className="h-full w-full object-contain" />
      </div>
    </div>
  );
}
