"use client";
import { clearUserData, getUserData, isAdmin } from "@/app/lib/auth";
import Header from "@/components/Header";
import SettingsModal from "@/components/Settings";
import Sidepanel from "@/components/Sidepanel";
import SignRequestModal from "@/components/SignRequestModal";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { signOut } from "next-auth/react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

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

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedSignUrl, setSelectedSignUrl] = useState(null);

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
      if(!userData) return;
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
    const userData = getUserData();
    setUser(userData);
    fetchConfig();
    fetchSignRequests(userData);
  }, []);

  return (
    <div className="bg-white rounded-lg flex relative w-full h-[80vh] max-w-[1140px] mx-auto">
      <div
        className="bg-white rounded-2xl w-full xl:mr-5 pt-5 pb-3 px-4"
        onClick={() => {
          setAccountDropdown(false);
        }}
      >
        <div className="mb-4">
          <h3 className="text-lg xl:text-2xl text-[#3c4043] font-medium text-center xl:mb-5">
            Welcome, {user?.name}
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-lg ${
              activeTab === "pending"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Requests ({pendingRequests?.length || 0})
          </button>
          <button
            className={`px-4 py-2 text-lg ${
              activeTab === "completed"
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
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-2 text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="mt-4 h-[calc(100vh-260px)]">
            {activeTab === "pending" && (
              <div>
                {pendingRequests?.length > 0 ? (
                  <ul className="space-y-2 overflow-y-auto h-[64vh]">
                    {pendingRequests.map((req) => (
                      <li
                        key={req.id}
                        className="p-3 border rounded-lg shadow-sm flex justify-between items-center"
                      >
                        <span className="text-gray-800 font-semibold">
                          {req.source_files[0].name}
                        </span>
                        <button
                          className="text-blue-500 px-4 py-2 rounded-lg hover:text-blue-600"
                          onClick={() => handleSignClick(req)}
                        >
                          Sign
                        </button>
                      </li>
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
                    {completedRequests.map((req) => (
                      <li
                        key={req.id}
                        className="p-3 border rounded-lg shadow-sm"
                      >
                        <span className="text-gray-800 font-semibold">
                          {req.source_files[0].name}
                        </span>
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
        onClose={() => {
          setIsSignModalOpen(false);
          fetchSignRequests(user);
        }}
        signUrl={selectedSignUrl}
      />
    </div>
  );
}

export default ESignature;
