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
import { setCurrentUser } from "@/store/services/userService";
import TasksSection from "@/components/Common/TasksSection";
import MessageSection from "@/components/Common/MessageSection";
import AdvisorSection from "@/components/Common/AdvisorSection";

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
  // const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  // const [config, setConfig] = useState(null);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [sidepanelDropdown, setSidepanelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: config } = useSelector((state) => state.portal);
  const { data: user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWrapper(
        `/api/pages?portalId=${params?.portalid}&page=${
          reverseSanitizeName(params?.page) || ""
        }`,
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

  function reverseSanitizeName(sanitizedName) {
    let reversedName = sanitizedName.endsWith("-")
      ? sanitizedName.slice(0, -1)
      : sanitizedName;

    reversedName = reversedName.replace(/-/g, " ");
    reversedName = reversedName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return reversedName;
  }

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
      // setUserData(userData);
      dispatch(setCurrentUser(userData));
      if (typeof window !== "undefined") {
        // localStorage.setItem("portal", params.portalid);
        localStorage.setItem("accessToken", data.accessToken);
      }
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
  };

  const filterVisibility = (label) => {
    if (isLoading) return false;
    if (!page) return true;

    const section = page?.visibility.find((item) => item.label === label);
    return section?.visible ?? false;
  };

  const isAnySideSectionVisible = () => {
    if (isLoading) return true; 
    if (!page) return true; 
    
    return page?.visibility.some((item) => item.visible);
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

      // setUser(userData);
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
      <LoadingSpinner />
    );
  }
  const userIsAdmin = isAdmin();
  return (
    <div className="p-4 bg-white text-gray-800 font-lato">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
        <div className={`col-span-5 ${isAnySideSectionVisible() ? "lg:col-span-3" : "lg:col-span-5"}`}>
          <div className="bg-gray-50 flex-1">
            {page && page?.description ? (
              <div
                className="bg-white pt-5 pb-3 px-5 page"
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
        <div className="col-span-2">
          {filterVisibility("My Task Section") && (
            <TasksSection />
          )}
          {filterVisibility("Advisor Section") && (
            <AdvisorSection />
          )}
          {filterVisibility("Messaging") && (
            <MessageSection />
          )}
        </div>
      </div>
    </div>
  );
}
export default Page;
