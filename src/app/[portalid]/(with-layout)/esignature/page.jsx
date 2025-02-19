"use client";
import { clearUserData, getUserData, isAdmin } from "@/app/lib/auth";
import Header from "@/components/Header";
import SettingsModal from "@/components/Settings";
import Sidepanel from "@/components/Sidepanel";
import SignRequestModal from "@/components/SignRequestModal";
import { Eye, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { signOut } from "next-auth/react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import PreviewModal from "@/components/FileExplorer/PreviewModal";

function ESignature() {
  const router = useRouter();
  const params = useParams();
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const userIsAdmin = isAdmin();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedSignUrl, setSelectedSignUrl] = useState(null);

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) return;
      const response = await fetchWrapper(
        `/api/portal?portalid=${params.portalid}`,
        {},
        "portal-login"
      );
      const data = await response.json();
      if (!data.data && response.status === 404) {
        router.push(`/${params.portalid}/not-found`);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      setConfig(data.data);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const fetchSignRequests = async (userData) => {
    try {
      if (!userData) return;
      setIsLoading(true);
      const response = await fetch(`/api/box/e-sign?userId=${userData?.id}`);
      const data = await response.json();
      if (response.ok) {
        setPendingRequests(data.data.pending);
        setCompletedRequests(data.data.completed);
      } else {
        console.error("Failed to fetch sign requests");
      }
    } catch (error) {
      console.error("Error fetching sign requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignClick = (signReq) => {
    const currentUserReq = signReq.signers.find(
      (item) => item.email === user.email
    );
    if (currentUserReq) {
      setSelectedSignUrl(currentUserReq.iframeable_embed_url);
      setIsSignModalOpen(true);
    }
  };

  const handleLogout = async () => {
    clearUserData();
    toast.success("User signout successfully");
    router.push("login");
  };

  useEffect(() => {
    if (!isSignModalOpen) {
      const userData = getUserData();
      fetchSignRequests(userData);
    }
  }, [isSignModalOpen]);

  useEffect(() => {
    const userData = getUserData();
    setUser(userData);
    fetchConfig();
    fetchSignRequests(userData);
  }, []);

  return (
    <div className="bg-white rounded-lg flex relative w-full max-w-[1140px] mx-auto">
      <div
        className="bg-white rounded-2xl w-full xl:mr-5 pt-3 pb-3 m-1 mx-4"
        onClick={() => {
          setAccountDropdown(false);
        }}
      >
        <div className="border-b border-[#dee2e6] pt-8 pb-5">
          <p className="text-sm font-lato mt-1 text-black">
            <span className="block md:inline text-xl font-light sm:text-center mr-10 font-lato mb-2 md:mb-0">
              Welcome, {user?.name}
            </span>
            <span className="block md:inline text-black">
              Securely execute an eSignature workflow, including document preparation, and digital signing.
            </span>
          </p>

        </div>
        <p className="text-xl font-light font-lato pt-8 text-black">
          E-signature
        </p>
        {/* Tabs */}
        <div className="flex border-b pt-[20px]">
          <button
            className={`px-4 py-2 text-md sm:text-lg font-lato ${activeTab === "pending"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
              }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Requests ({pendingRequests?.length || 0})
          </button>
          <button
            className={`px-4 py-2 text-md sm:text-lg font-lato ${activeTab === "completed"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
              }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed Requests ({completedRequests?.length || 0})
          </button>
        </div>

        {/* Display List of Requests */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px] sm:min-h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-2 text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="mt-4 min-h-[400px] sm:min-h-[500px] overflow-auto">
            {activeTab === "pending" && (
              <div>
                {pendingRequests?.length > 0 ? (
                  <ul className="space-y-2 overflow-y-auto">
                    {pendingRequests.map((req) => (
                      <React.Fragment key={req.id}>
                        {req.source_files.length > 0 && (
                          <li
                            key={req.id}
                            className="p-3 font-lato border rounded-lg shadow-sm flex justify-between items-center"
                          >
                            <span className="text-gray-800 font-semibold">
                              {req?.source_files[0]?.name}
                            </span>
                            <button
                              className="text-blue-500 px-4 py-2 rounded-lg hover:text-blue-600"
                              onClick={() => handleSignClick(req)}
                            >
                              Sign
                            </button>
                          </li>
                        )}
                      </React.Fragment>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center">
                    No pending requests
                  </p>
                )}
              </div>
            )}

            {activeTab === "completed" && (
              <div>
                {completedRequests?.length > 0 ? (
                  <ul className="space-y-2">
                    {completedRequests?.map((req) => (
                      <li
                        key={req.id}
                        className="p-3 border rounded-lg shadow-sm flex items-center justify-between"
                      >
                        <span className="text-gray-800 font-semibold font-lato">
                          {req?.sign_files.files[0]?.name}
                        </span>
                        <button onClick={()=>handlePreview(req?.sign_files.files[0]?.id)} className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center">
                            <Eye className="text-gray-600 size-4"/>
                          </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center">
                    No completed requests
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <SignRequestModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        signUrl={selectedSignUrl}
      />
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        fileId={previewFileId}
      />
    </div>
  );
}

export default ESignature;
