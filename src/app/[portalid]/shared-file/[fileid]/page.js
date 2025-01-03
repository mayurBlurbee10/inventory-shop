"use client";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
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
  const [config, setConfig] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");

  useEffect(() => {
    getSharedFile(params.fileid);
    fetchConfig();
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

      const contentType = headers.get("Content-Type");
      if(contentType){
        setFileType(contentType.split('/')[1]);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setItemUrl(url);
    } catch (error) {
      console.error("Error get shared files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetchWrapper(`/api/portal?portalid=${params.portalid}`, {}, 'portal-login');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setConfig(data.data)
    } catch (error) {
      console.log("error: ", error);
    } finally {
      // setIsLoading(false);
    }
  };

  const renderView = () => {
    switch (fileType) {
      case "png":
        return <img src={itemUrl} className="h-full w-full object-contain" />;
      case "pdf":
        return (
          <iframe
            src={`/api/box/share?fileId=${params.fileid}#toolbar=0`}
            width="100%"
            height="100%"
          ></iframe>
        );
      case "mp4":
        return (
          <video width="100%" height="100%" controls controlsList="nodownload">
            <source src={itemUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      case "mp3":
        return (
          <audio controls controlsList="nodownload" style={{ width: "100%" }}>
            <source src={itemUrl} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        );
      case "svg":
        return (
          <object
            data={itemUrl}
            type="image/svg+xml"
            width="100%"
            height="600px"
          >
            Your browser does not support SVGs.
          </object>
        );
      default:
        return <img src={itemUrl} className="h-full w-full object-contain" />;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-white">
      <div className="p-3 border-1 border-b flex items-center justify-start gap-3">
        <img src={config?.logo} alt="Wealthportal" className="h-10 w-auto block" />
        <h2 className="text-lg font-semibold text-gray-800">{config?.legalName}</h2>
      </div>
      {fileName && (<div className="p-3 border-1 border-b flex items-center justify-start gap-3">
        <h2 className="text-l font-semibold text-gray-800">{fileName}</h2>
      </div>)}
      <div className="h-[calc(100vh-115px)] p-4 bg-[#f5f5f5]">
        {renderView()}
      </div>
    </div>
  );
}
