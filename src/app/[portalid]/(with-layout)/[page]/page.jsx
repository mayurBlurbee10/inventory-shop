"use client";
import { clearUserData, getUserData, isAdmin } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Header from "@/components/Header";
import SettingsModal from "@/components/Settings";
import Sidepanel from "@/components/Sidepanel";
import { setUserData } from "@/lib/auth";
import { getSession, signOut } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import "../../../../components/Plugins/RTE/tiptap-style.css";
import TNCModal from "@/components/TNCModal";
import { setPortal } from "@/store/services/portalService";
import { useDispatch, useSelector } from "react-redux";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);
function Page() {
  const params = useParams();
  const router = useRouter();
  const [page, setPage] = useState(null);
  const [pages, setPages] = useState([]);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  // const [config, setConfig] = useState(null);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [sidepanelDropdown, setSidepanelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: config } = useSelector((state) => state.portal);
  const dispatch = useDispatch()

  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWrapper(
        `/api/pages?portalId=${params?.portalid}&page=${params?.page || ""}`,
        {},
        "fetch-page"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      setPage(data.data);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    clearUserData();
    await signOut();
    toast.success("User signout successfully");
    router.push("login");
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

  const getUserDetailsByEmail = async (email) => {
    try {
      let url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetchUserByEmail");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      setUserData(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("portal", params.portalid);
        localStorage.setItem("accessToken", data.accessToken);
      }
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      if (sessionData) {
        await getUserDetailsByEmail(sessionData.user.email);
      }
    };
    fetchSession().then(() => {
      const userData = getUserData();
      if (!userData) {
        router.push("login");
        return;
      }

      setUser(userData);
      fetchConfig();
    });
  }, [router]);

  useEffect(() => {
    fetchPlugins();
  }, []);
  if (isLoading) {
    return (
      // <div className="flex justify-center py-8 h-full w-full">
      //   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      // </div>
      <LoadingSpinner/>
    );
  }
  const userIsAdmin = isAdmin();
  return (
    <div className="flex flex-col min-h-screen text-gray-800">
      <div className="bg-gray-50 flex-1">
        <Header
          user={user}
          config={config}
          userIsAdmin={userIsAdmin}
          router={router}
          accountDropdown={accountDropdown}
          setAccountDropdown={setAccountDropdown}
          handleLogout={handleLogout}
          handelSettings={() => setIsSettingsOpen(true)}
          setIsNewFolderModalOpen={setIsNewFolderModalOpen}
          setShowUploadArea={setShowUploadArea}
        />

        <div className="flex flex-row">
          <Sidepanel
            userIsAdmin={userIsAdmin}
            sidepanelDropdown={sidepanelDropdown}
            setSidepanelDropdown={setSidepanelDropdown}
            setIsNewFolderModalOpen={setIsNewFolderModalOpen}
            showUploadArea={showUploadArea}
            setShowUploadArea={setShowUploadArea}
            router={router}
            isSettingsOpen={isSettingsOpen}
            handelSettings={() => setIsSettingsOpen(true)}
          />
          {page && page?.description ? (
            <div
              className="bg-white rounded-2xl w-full xl:mr-5 pt-5 pb-3 px-5 page"
              dangerouslySetInnerHTML={{
                __html: page.description,
              }}
              suppressHydrationWarning={true}
            />
          ) : (
            <div>No Content Available</div>
          )}
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
export default Page;
