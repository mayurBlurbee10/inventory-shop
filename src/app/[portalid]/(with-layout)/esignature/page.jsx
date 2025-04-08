"use client";
import { clearUserData, getUserData, isAdmin } from "@/app/lib/auth";
import Header from "@/components/Header";
import SettingsModal from "@/components/Settings";
import Sidepanel from "@/components/Sidepanel";
import SignRequestModal from "@/components/SignRequestModal";
import { Bell, ChevronDown, ChevronUp, Eye, Loader2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { signOut } from "next-auth/react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { setPortal } from "@/store/services/portalService";
import { useDispatch, useSelector } from "react-redux";
import PreviewModal from "@/components/FileExplorer/PreviewModal";
import { Dialog } from "@headlessui/react";
import Button from "@/components/Common/Elements/Button";

const TrackStatus = ({ trackedRequests }) => {
  const params = useParams();
  const [expandedRow, setExpandedRow] = useState(null);
  const [isSendReminderLoading, setIsSendReminderLoading] = useState(null);

  const { data : user } = useSelector((state) => state?.user);

  const toggleRow = (reqId) => {
    setExpandedRow(expandedRow?.id === reqId ? null : reqId);
  };

  const handleSendReminder = async (signer, signRequest) => {

      const messageData = {
        sender: user?.id,
        receiver: signer?.embed_url_external_user_id,
        portalId: params.portalid,
        subject: `Sign Document`,
        text: `Please sign "${signRequest?.source_files[0].name}"`,
      };
      setIsSendReminderLoading(signer?.embed_url_external_user_id);
      try {
        const response = await fetchWrapper(
          "/api/messages",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messageData),
          },
          "create-message"
        );
  
        if (!response.ok) throw new Error("Failed to send message");
        toast.success("Reminder sent successfully")
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsSendReminderLoading(null);
      }
    };

  return (
    <div className="p-4 bg-white text-gray-800 font-lato">
      {trackedRequests?.length > 0 ? (
        <table className="w-full text-sm text-left border border-gray-200 rounded-md overflow-hidden table-fixed">
          <thead className="border-b bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 w-1/3">Document</th>
              <th className="p-3 w-1/4">Signers</th>
              <th className="p-3 w-1/6">Status</th>
              <th className="p-3 w-1/6"></th>
            </tr>
          </thead>
          <tbody className="">
            {trackedRequests.map((req) => {
              const signers = req?.signers?.filter(
                (signer) => req.sender_email !== signer.email
              );

              return signers.length > 0 ? (
                <React.Fragment key={req.id}>
                  {/* Default Row */}
                  {req.source_files.length > 0 && (
                  <tr className={`hover:bg-gray-50 transition ${expandedRow?.id !== req?.id && "border-b border-gray-200"}`}>
                    {/* Document Name */}
                    <td className="p-3 font-medium text-gray-900 align-middle truncate w-1/3">
                      {req?.source_files[0]?.name}
                    </td>

                    {/* Signers Initials */}
                    <td className="p-3 w-1/4">
                      <div className="flex -space-x-2">
                        {signers.map((signer, index) => (
                          <span
                            key={index}
                            className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-800 font-semibold border border-white"
                          >
                            {signer?.email[0].toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3 w-1/6">
                      {signers.some((signer) => signer?.signer_decision === null && signer.role !== "final_copy_reader") ? (
                        <span className="text-yellow-600 font-semibold">Pending</span>
                      ) : (
                        <span className="text-green-600 font-semibold">Completed</span>
                      )}
                    </td>

                    {/* View Button */}
                    <td className="p-3 w-1/6">
                      <button
                        onClick={() => {toggleRow((prev) => prev?.id === req?.id ? null : req)}}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedRow?.id === req?.id ? <ChevronUp /> : <ChevronDown />}
                      </button>
                    </td>
                  </tr>
                  )}
                  {/* Expanded Row */}
                  {expandedRow?.id === req.id &&
                    signers.map((signer, idx) => (
                      <tr key={`${req.id}-${signer.email}`} className="hover:bg-gray-50 transition border-b border-gray-200">
                        {/* Merge document name cell */}
                        {idx === 0 && (
                          <td rowSpan={signers.length} className="p-3 font-medium text-gray-900 align-middle w-1/3"></td>
                        )}

                        {/* Signer Email */}
                        <td className="p-3 w-1/4">{signer?.email}</td>

                        {/* Status */}
                        <td className="p-3 w-1/6">
                          {signer?.signer_decision !== null ? (
                            <span className="text-green-600 font-semibold">Completed</span>
                          ) : (
                            <p className="flex items-center gap-2">
                              <span className="text-yellow-600 font-semibold">Pending</span>
                              <button title="Send Reminder" onClick={() => handleSendReminder(signer, expandedRow)}>
                                {isSendReminderLoading === signer?.embed_url_external_user_id ? (
                                  <Loader2 className="text-blue-500 hover:text-blue-700 animate-spin size-5 ml-5"/>
                                ) : (
                                <Bell className="text-gray-500 hover:text-gray-700 cursor-pointer size-5 ml-5" />
                                )}
                              </button>
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                    }
                </React.Fragment>
              ) : null;
           
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-center p-3">No pending requests</p>
      )}
      
    </div>
  );
};

function ESignature() {
  const router = useRouter();
  const params = useParams();
  // const [config, setConfig] = useState(null);
  // const [user, setUser] = useState(null);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [trackedRequests, setTrackedRequest] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const userIsAdmin = isAdmin();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedSignUrl, setSelectedSignUrl] = useState(null);

  const { data: config } = useSelector((state) => state.portal);
  const { data: user } = useSelector((state) => state.user);
  const {data : pages } = useSelector((state)=>state.pages);
  const dispatch = useDispatch();

  useEffect(() => {
    const page = pages?.find((page) => page.title === "esignature");
    if (page && !page.isPageVisible) {
      router.push("access-denied");
    }
  }, []);

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) return;
      // const response = await fetchWrapper(
      //   `/api/portal?portalid=${params.portalid}`,
      //   {},
      //   "portal-login"
      // );
      // const data = await response.json();
      // if (!data.data && response.status === 404) {
      //   router.push(`/${params.portalid}/not-found`);
      //   return;
      // }
      // if (!response.ok) {
      //   throw new Error("Failed to fetch users");
      // }

      // setConfig(data.data);
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
        setTrackedRequest(data.data.tracked)
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

  // useEffect(() => {
  //   if (!isSignModalOpen) {
  //     const userData = getUserData();
  //     fetchSignRequests(userData);
  //   }
  // }, [isSignModalOpen]);

  const LoadingSpinner = () => (
    <div className="h-[80vh] flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  useEffect(() => {
    const userData = getUserData();
    // setUser(userData);
    fetchConfig();
    if (!isSignModalOpen) {
      fetchSignRequests(userData);
    }
  }, [router]);

  if(isLoading){
    return <LoadingSpinner/>
  }

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
              E-signature
            </span>
            <span className="block md:inline text-black">
              Securely execute an eSignature workflow, including document preparation, and digital signing.
            </span>
          </p>

        </div>
        {/* Tabs */}
        <div className="border mt-[20px]">
        <div className="flex border-b p-4 bg-gray-50">
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
          <button
            className={`px-4 py-2 text-md sm:text-lg font-lato ${activeTab === "track_status"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
              }`}
            onClick={() => setActiveTab("track_status")}
          >
            Track Status
          </button>
        </div>

        {/* Display List of Requests */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px] sm:min-h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-2 text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="max-h-[550px] overflow-y-auto">
            {activeTab === "pending" && (
              <div>
                {pendingRequests?.length > 0 ? (
                  <ul className="overflow-y-auto">
                    {pendingRequests.map((req) => (
                      <React.Fragment key={req.id}>
                        {req.source_files.length > 0 && (
                          <li
                            key={req.id}
                            className="px-3 py-2 font-lato border-b flex justify-between items-center"
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
                  <p className="text-gray-500 text-center p-3">
                    No pending requests
                  </p>
                )}
              </div>
            )}

            {activeTab === "completed" && (
              <div>
                {completedRequests?.length > 0 ? (
                  <ul>
                    {completedRequests?.map((req) => (
                      <li
                        key={req.id}
                        className="p-3 border-b flex items-center justify-between"
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
                  <p className="text-gray-500 text-center p-3">
                    No completed requests
                  </p>
                )}
              </div>
            )}
           {activeTab === "track_status" && (
              <TrackStatus trackedRequests={trackedRequests}/>
            )}
          </div>
        )}
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <SignRequestModal
        isOpen={isSignModalOpen}
        onClose={() => {setIsSignModalOpen(false); fetchSignRequests(user)}}
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
