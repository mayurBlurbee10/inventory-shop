"use client";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import SettingsModal from "./Settings";
import TechSupport from "./TechSupport";
import {
  clearUserData,
  getUserData,
  isAdmin,
  setUserData,
} from "@/app/lib/auth";
import {
  CircleUserRound,
  Headset,
  LogOut,
  Settings,
  UserRoundPen,
} from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import AccountInfo from "./AccountInfo";

function Navbar({ content, config, user, filterValue }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  // const [user, setUser] = useState(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  //   const [config, setConfig] = useState(null);
  // const [session, setSession] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTechSupportModalOpen, setIsTechSupportModalOpen] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isOpenNavbar, setIsOpenNavbar] = useState(false);
  const [isAccountInfoModalOpen, setIsAccountInfoModalOpen] = useState(false);
  const [isAdvisorViewModalOpen, setIsAdvisorViewModalOpen] = useState(false);
  const [isAdvisorViewOpen, setIsAdvisorViewOpen] = useState(false);
  // const isAdvisorViewOpen = pathname.includes("advisor");

  useEffect(() => {
    setIsAdvisorViewOpen(pathname.includes("advisor"));
  }, [pathname]);

  const NavBarItem = ({ title, href }) => {
    if (!href) {
      console.error("href prop is required for NavBarItem.");
      return null;
    }

    return (
      <Link href={href} passHref>
        <button
          className={`px-3 py-2 text-black hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm ${
            pathname.includes(href) ? "text-blue-500" : ""
          }`}
        >
          {title}
        </button>
      </Link>
    );
  };
  const handleLogout = async () => {
    clearUserData();
    await signOut();
    toast.success("User signout successfully");
    router.push("login");
  };
  //   const fetchConfig = async () => {
  //     try {
  //       if (!params?.portalid) return;
  //       const response = await fetchWrapper(
  //         `/api/portal?portalid=${params.portalid || "default"}`,
  //         {},
  //         "portal-login"
  //       );
  //       const data = await response.json();
  //       if (!data.data && response.status === 404) {
  //         router.push(`/${params.portalid}/not-found`);
  //         return;
  //       }
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch users");
  //       }

  //       setConfig(data.data);
  //     } catch (error) {
  //       console.log("error: ", error);
  //     }
  //   };

  //   const fetchContent = async () => {
  //     const response = await fetchWrapper(
  //       `/api/contentManagement?portalId=${params.portalid}`,
  //       { method: "GET" },
  //       "fetchContentManagement"
  //     );
  //     const data = await response.json();
  //     if (!response.ok) {
  //       throw new Error(data.error || "Failed to fetch Content Management");
  //     }
  //     setContent(data);
  //   };

  // const filterValue = (title) => {
  //   if (!content) return null;
  //   console.log("content:", content);

  //   const contentItem = content.portalContent.find(
  //     (item) => item.title === title
  //   );
  //   const value = contentItem ? contentItem.value : null;

  //   if (!value) {
  //     const defaultItem = content.defaultContent.find(
  //       (item) => item.title === title
  //     );
  //     return defaultItem ? defaultItem.value : null;
  //   }
  //   return value;
  // };

  // const getUserDetailsByEmail = async (email) => {
  //   try {
  //     let url = `/api/users/loginByProvider`;
  //     const body = {
  //       method: "POST",
  //       body: JSON.stringify({ email, portalid: params.portalid }),
  //     };
  //     const response = await fetchWrapper(url, body, "fetchUserByEmail");
  //     if (!response.ok) throw new Error("Failed to get user from email");
  //     const data = await response.json();
  //     const userData = data.user;
  //     setUserData(userData);
  //     localStorage.setItem("portal", params.portalid);
  //     localStorage.setItem("accessToken", data.accessToken);
  //   } catch (error) {
  //     console.error("Failed to get user from email:", error);
  //     router.push("login");
  //   }
  // };

  // useEffect(() => {
  //   const fetchSession = async () => {
  //     const sessionData = await getSession();
  //     setSession(sessionData);
  //     if (sessionData) {
  //       await getUserDetailsByEmail(sessionData.user.email);
  //     }
  //   };
  //   fetchSession().then(() => {
  //     const userData = getUserData();
  //     if (!userData) {
  //       router.push("login");
  //       return;
  //     }

  //     setUser(userData);
  //   });
  // }, [router]);

  useEffect(() => {
    // fetchConfig();
    // fetchContent();
    setUserIsAdmin(isAdmin());
  }, []);

  return (
    <div className="border-b border-[#0000001a]">
      <div className="lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto px-3">
        <nav className="flex justify-between items-center bg-secondary py-2">
          <div className="flex items-center py-1 pr-[18px] hover:scale-105 transition-all ease-in-out duration-300">
            {user?.company?.logo || config?.logo ? (
              <img
                src={
                  user?.company?.logo
                    ? user.company.logo.replace("/api/upload", "/uploads")
                    : config?.logo
                }
                alt={params.portalid}
                className="h-[52px] mr-2"
              />
            ) : (
              // Skeleton for logo
              <div className="h-[52px] w-[52px] mr-2 bg-gray-300 animate-pulse rounded" />
            )}

            <span className="text-3xl text-[#000000e6] mb-1 font-lato">
              {filterValue("Header Text") || params.portalId ? (
                filterValue("Header Text") || params.portalId
              ) : (
                // Skeleton for header text
                <div className="w-[200px] h-[50px] bg-gray-200 animate-pulse rounded" />
              )}
            </span>
          </div>
          <div className="hidden lg:flex space-x-4 items-center">
            {isAdvisorViewOpen ? (
              <>
                <NavBarItem
                  title="Dashboard"
                  href={
                    params.portalid
                      ? `/${params.portalid}/advisor/dashboard`
                      : `/dashboard`
                  }
                />
                <NavBarItem
                  title="Shared Documents"
                  href={
                    params.portalid
                      ? `/${params.portalid}/advisor/shared-docs`
                      : "/shared-docs"
                  }
                />
              </>
            ) : (
              <>
                <NavBarItem
                  title="Dashboard"
                  href={
                    params.portalid
                      ? `/${params.portalid}/dashboard`
                      : `/dashboard`
                  }
                />
                <NavBarItem
                  title="My Documents"
                  href={
                    params.portalid ? `/${params.portalid}/my-docs` : "/my-docs"
                  }
                />
                <NavBarItem
                  title="Shared Documents"
                  href={
                    params.portalid
                      ? `/${params.portalid}/shared-docs`
                      : "/shared-docs"
                  }
                />
                <NavBarItem
                  title="eSignature"
                  href={
                    params.portalid
                      ? `/${params.portalid}/esignature`
                      : "/esignature"
                  }
                />
                <NavBarItem
                  title="Loans"
                  href={
                    params.portalid ? `/${params.portalid}/loans` : "/loans"
                  }
                />
                {userIsAdmin && (
                  // <button
                  //   className={`px-3 py-2 text-black hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm flex justify-start`}
                  //   onClick={() => setIsSettingsOpen(true)}
                  // >
                  //   Settings
                  // </button>
                  <NavBarItem
                    title="Settings"
                    href={
                      params.portalid
                        ? `/${params.portalid}/settings`
                        : "/settings"
                    }
                  />
                )}
              </>
            )}

            {/* Profile dropdown */}
            <div className="flex items-center space-x-8 cursor-pointer">
              <div
                className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
                onClick={() => setAccountDropdown((prev) => !prev)}
              >
                {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                <div
                  className={`size-8 xl:size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${
                    userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                  }`}
                >
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="flex flex-col text-sm xl:text-base">
                  <span className="text-gray-900 font-medium">
                    {user?.name}
                  </span>
                  {userIsAdmin && (
                    <span className="text-blue-600 text-sm font-medium">
                      Administrator
                    </span>
                  )}
                </div>

                {/* DROPDOWN SECTION DONE*/}
                {accountDropdown && (
                  <>
                    {isAdvisorViewOpen ? (
                      <div className="absolute top-16 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                        <button
                          className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                          onClick={() =>
                            router.push(
                              params.portalid
                                ? `/${params.portalid}/dashboard`
                                : "/dashboard"
                            )
                          }
                        >
                          <UserRoundPen className="h-5 w-5" /> Client View
                        </button>
                      </div>
                    ) : (
                      <div className="absolute top-16 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                        <button
                          className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                          onClick={() =>
                            setIsAccountInfoModalOpen((prev) => !prev)
                          }
                        >
                          <CircleUserRound className="h-5 w-5" /> Account Info
                        </button>
                        {userIsAdmin && (
                          <button
                            onClick={() =>
                              setIsTechSupportModalOpen((prev) => !prev)
                            }
                            className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                          >
                            <Headset className="h-5 w-5" />
                            Tech Support
                          </button>
                        )}
                        <button
                          className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                          onClick={() =>
                            router.push(
                              params.portalid
                                ? `/${params.portalid}/advisor/dashboard`
                                : "/advisor/dashboard"
                            )
                          }
                        >
                          <UserRoundPen className="h-5 w-5" /> Advisor View
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                        >
                          <LogOut className="h-5 w-5" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Edit button */}
            <button className="h-5 w-5 rounded-sm text-white bg-[#17a2b8] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="currentColor"
              >
                <path d="M12.8995 6.85453L17.1421 11.0972L7.24264 20.9967H3V16.754L12.8995 6.85453ZM14.3137 5.44032L16.435 3.319C16.8256 2.92848 17.4587 2.92848 17.8492 3.319L20.6777 6.14743C21.0682 6.53795 21.0682 7.17112 20.6777 7.56164L18.5563 9.68296L14.3137 5.44032Z"></path>
              </svg>
            </button>
          </div>

          {/* Mobile Navbar */}

          <button
            className="lg:hidden text-text"
            onClick={() => setIsOpenNavbar(true)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {isOpenNavbar && (
            <div className="fixed top-0 right-0 sm:w-2/5 w-1/2 h-full bg-white shadow-lg z-50 p-5 transition-all">
              {/* Close Icon */}
              <button
                className="absolute top-5 left-5 text-gray-600 hover:text-black"
                onClick={() => {
                  setIsOpenNavbar(false); // Close navbar
                  setAccountDropdown(false); // Also close account dropdown
                }} // Close menu
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Navbar Content */}
              <div className="flex flex-col justify-center space-y-4 mt-10">
                {isAdvisorViewOpen ? (
                  <>
                    <NavBarItem
                      title="Dashboard"
                      href={
                        params.portalid
                          ? `/${params.portalid}/advisor/dashboard`
                          : `/dashboard`
                      }
                    />
                    <NavBarItem
                      title="Shared Documents"
                      href={
                        params.portalid
                          ? `/${params.portalid}/advisor/shared-docs`
                          : "/shared-docs"
                      }
                    />
                  </>
                ) : (
                  <>
                    <NavBarItem
                      title="Dashboard"
                      href={
                        params.portalid
                          ? `/${params.portalid}/dashboard`
                          : `/dashboard`
                      }
                    />
                    <NavBarItem
                      title="My Documents"
                      href={
                        params.portalid
                          ? `/${params.portalid}/my-docs`
                          : "/my-docs"
                      }
                    />
                    <NavBarItem
                      title="Shared Documents"
                      href={
                        params.portalid
                          ? `/${params.portalid}/shared-docs`
                          : "/shared-docs"
                      }
                    />
                    <NavBarItem
                      title="eSignature"
                      href={
                        params.portalid
                          ? `/${params.portalid}/esignature`
                          : "/esignature"
                      }
                    />
                    <NavBarItem
                      title="Loans"
                      href={
                        params.portalid ? `/${params.portalid}/loans` : "/loans"
                      }
                    />
                    {userIsAdmin && (
                      // <button
                      //   className={`px-3 py-2 text-black hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm flex justify-start`}
                      //   onClick={() => setIsSettingsOpen(true)}
                      // >
                      //   Settings
                      // </button>
                      <NavBarItem
                        title="Settings"
                        href={
                          params.portalid
                            ? `/${params.portalid}/settings`
                            : "/settings"
                        }
                      />
                    )}
                  </>
                )}
                <div className="flex items-center space-x-8 cursor-pointer">
                  <div
                    className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
                    onClick={() => setAccountDropdown((prev) => !prev)}
                  >
                    {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                    <div
                      className={`size-8 xl:size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${
                        userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                      }`}
                    >
                      {user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex flex-col text-sm xl:text-base">
                      <span className="text-gray-900 font-medium">
                        {user?.name}
                      </span>
                      {userIsAdmin && (
                        <span className="text-blue-600 text-sm font-medium">
                          Administrator
                        </span>
                      )}
                    </div>
                    {accountDropdown && (
                      <>
                        {isAdvisorViewOpen ? (
                          <div className="absolute top-16 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                            <button
                              className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                              onClick={() =>
                                router.push(
                                  params.portalid
                                    ? `/${params.portalid}/dashboard`
                                    : "/dashboard"
                                )
                              }
                            >
                              <UserRoundPen className="h-5 w-5" /> Client View
                            </button>
                          </div>
                        ) : (
                          <div className="absolute top-16 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                            <button
                              className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                              onClick={() =>
                                setIsAccountInfoModalOpen((prev) => !prev)
                              }
                            >
                              <CircleUserRound className="h-5 w-5" /> Account
                              Info
                            </button>
                            {userIsAdmin && (
                              <button
                                onClick={() =>
                                  setIsTechSupportModalOpen((prev) => !prev)
                                }
                                className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                              >
                                <Headset className="h-5 w-5" />
                                Tech Support
                              </button>
                            )}
                            <button
                              className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                              onClick={() =>
                                router.push(
                                  params.portalid
                                    ? `/${params.portalid}/advisor/dashboard`
                                    : "/advisor/dashboard"
                                )
                              }
                            >
                              <UserRoundPen className="h-5 w-5" /> Advisor View
                            </button>
                           
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                            >
                              <LogOut className="h-5 w-5" />
                              Sign out
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <TechSupport
        isOpen={isTechSupportModalOpen}
        onClose={() => setIsTechSupportModalOpen(false)}
      />
      <AccountInfo
        isOpen={isAccountInfoModalOpen}
        onClose={() => setIsAccountInfoModalOpen(false)}
        config={config}
        user={user}
        userIsAdmin={userIsAdmin}
      />
    </div>
  );
}

export default Navbar;
