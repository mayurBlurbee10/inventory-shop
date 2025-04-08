"use client";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import SettingsModal from "./Settings";
import TechSupport from "./TechSupport";
import {
  clearUserData,
  getUserData,
  isAdmin,
  setUserData,
} from "@/app/lib/auth";
import {
  Bolt,
  CircleUserRound,
  Ellipsis,
  File,
  Headset,
  LogOut,
  Settings,
  UserRoundPen,
} from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import AccountInfo from "./AccountInfo";
import { useDispatch, useSelector } from "react-redux";
import { setFileList } from "@/store/actions/fileAction";
import { setLoans } from "@/store/services/loanService";
import { setPortal } from "@/store/services/portalService";
import { setCurrentUser } from "@/store/services/userService";
import { UserRole } from "@/config/constants";
import { setPages as setReduxPages } from "@/store/services/pageService";
import { fontSizes, logoSizeRatio } from "@/app/lib/data/font_size";

function Navbar({ content, config, filterValue }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  // const [user, setUser] = useState(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [userIsModerator, setUserIsModerator] = useState(false);
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
  const dropdownRef = useRef(null);
  const moreLinksDropdownRef = useRef(null);
  const [logo, setLogo] = useState(null);
  const [pages, setPages] = useState([]);
  const [customPages, setCustomPages] = useState([]);
  const [isOpenMoreLinksDropdown, setIsOpenMoreLinksDropdown] = useState(false);

  const { data: loanData } = useSelector((state) => state.loans);
  const { data: user } = useSelector((state) => state.user);
  const { data: pageData } = useSelector((state) => state.pages);
  const dispatch = useDispatch();

  useEffect(() => {
    setLogo(config?.logo || null);
  }, [user, config]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAccountDropdown(false);
      }

      if (moreLinksDropdownRef.current && !moreLinksDropdownRef.current.contains(event.target)) {
        setIsOpenMoreLinksDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        <div
          className={`relative mx-2 h-full flex items-center border-b-2 transition-all justify-center`}
          style={{
            borderBottomColor: pathname.includes(href) ? config?.primaryColor : "transparent",
            borderBottomWidth: pathname.includes(href) ? "3px" : "",
          }}
        >
          <button
            className={`px-3 py-2 hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm ${
              pathname.includes(href) ? "font-bold" : "text-black"
            }`}
            style={pathname.includes(href) ? { color: config?.primaryColor } : {}}
          >
            {title}
          </button>
          {/* Line Below Button */}
          {/* <div
            className={`h-1 w-full absolute left-0 transition-all duration-300 ${isOpenNavbar ? " -bottom-1" : "-bottom-6 "} ${
              pathname.includes(href) ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundColor: pathname.includes(href) ? config?.primaryColor : "transparent",
            }}
          ></div> */}
        </div>
      </Link>
    );
  };
  const clearStoreData = ()=>{
    dispatch(setFileList(null));
    dispatch(setLoans(loanData?.length === 3 ? loanData.slice(1) : loanData));
    dispatch(setPortal(null));
    dispatch(setCurrentUser(null));
    dispatch(setReduxPages(null));
  }
  const handleLogout = async () => {
    clearUserData();
    clearStoreData();
    await signOut();
    toast.success("User signout successfully");
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = params.portalid ? `/${params.portalid}/login` : "/login";
  };

  useEffect(() => {
    const filterPages =
      pageData?.filter((item) => item.isCustomPage === false) || [];

    const filterCustomPages =
      pageData?.filter((item) => item.isCustomPage === true) || [];

    setPages(filterPages);
    setCustomPages(filterCustomPages);
  }, [pageData]);

   const fetchPages = async () => {
     try {
      const encodedPage = encodeURIComponent('pages');
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid}&type=${encodedPage}`,
        {},
        "fetch-page"
      );
       if (!response.ok) {
         throw new Error("Failed to fetch plugins");
       }
       const data = await response.json();

       const filterPages =
       Array.isArray(data?.data) && data.data.length > 0
         ? data.data[0]?.pages?.filter((item) => item.isCustomPage === false) || []
         : [];
      //  setPages(filterPages);
       dispatch(setReduxPages(Array.isArray(data?.data) && data.data.length > 0
       && data.data[0]?.pages))
     } catch (error) {
       console.error("Error fetching plugins:", error);
     }
   };

  const filterPageVisibility = (pageTitle) => {
    const page = pages?.length && pages?.find((page) => page.title === pageTitle);
    return page ?  page.isPageVisible : true
  }
  
  function sanitizeName(name) {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".")
      ? sanitizeName.slice(0, -1)
      : sanitizeName;
  }

  useEffect(() => {
    setUserIsAdmin(user?.role !== UserRole.USER && user?.role !== UserRole.MODERATOR);
    setUserIsModerator(user?.role === UserRole.MODERATOR);
    fetchPages();
  }, []);

  const filterTheme = (title) => {
        const contentItem = content && content?.portalContent?.find((item) => item.title === title);
        let fontSize = fontSizes.find((item) => item.key === title)
        let theme = contentItem ? contentItem.theme : {
          fontSize: fontSize?.size,
          color: "#000000e6",
          fontWeight: title === 'Paragraph' ? 300 : 400,
        };
        return theme;
      };

  const LogoImage = () => {
      const baseSize = 100; // Set a reasonable base size (in pixels)
  
      const logoSize =
        (filterTheme("Logo")?.fontSize &&
          logoSizeRatio[
            filterTheme("Logo")?.fontSize
          ]) ||
        logoSizeRatio.medium;
      return (
        <div className="block min-w-16" >
              <img
                src={logo.replace("/api/upload", "/uploads")}
                alt={params.portalid}
                className="object-contain mr-2"
                style={{
                  height: `${baseSize * logoSize}px`, 
                  width: "auto",                     
                  maxWidth: "100%",                   
                }}
              />
        </div>
      );
    };

  return (
    <div className="border-b border-[#0000001a] relative" style={{ backgroundColor: config?.accentColor}}>
      <div className="w-full mx-auto px-2">
        <nav className="flex justify-between">
          <div className="flex items-center pr-[18px] hover:scale-105 transition-all ease-in-out duration-300 py-2">
            {logo ? (
              // <img
              //   src={logo.replace("/api/upload", "/uploads")}
              //   alt={params.portalid}
              //   className="mr-2 max-h-[60px] max-w-[150px]"
              // />
              <LogoImage />
            ) : (
              <div className="h-[60px] w-[150px] mr-2 bg-gray-300 animate-pulse rounded" />
            )}

            <span
              className="text-3xl text-[#000000e6] font-lato overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] md:max-w-[300px] lg:max-w-[350px] xl:max-w-[450px]"
              style={{
                fontSize:
                  content?.portalContent?.find((item) => item.title === "Header Text")
                    ?.fontSize || "30px",
                lineHeight: "1.2", 
                paddingBottom: "2px",
                paddingInline:"2px" 
              }}
            >
              {
              // content?.portalContent === undefined ? ( 
              //   <span className="w-[200px] h-[70px] bg-gray-200 animate-pulse rounded block"></span>
              // ) : 
              filterValue("Header Text") &&
                filterValue("Header Text") !== "Premier Customer Portal" ? (
                filterValue("Header Text") 
              ) : (
                params?.portalid 
              )}
            </span>

          </div>

          <div className="hidden lg:flex">
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
                {filterPageVisibility("dashboard") && (
                   <NavBarItem
                     title="Dashboard"
                     href={
                       params.portalid
                         ? `/${params.portalid}/dashboard`
                         : `/dashboard`
                     }
                   />
                 )}
                {/* <NavBarItem
                  title="My Documents"
                  href={
                    params.portalid ? `/${params.portalid}/my-docs` : "/my-docs"
                  }
                /> */}

                  {filterPageVisibility("shared-docs") && (
                   <NavBarItem
                     title="Shared Documents"
                     href={
                       params.portalid
                         ? `/${params.portalid}/shared-docs`
                         : "/shared-docs"
                     }
                   />
                 )}
                 {filterPageVisibility("esignature") && (
                   <NavBarItem
                     title="eSignature"
                     href={
                       params.portalid
                         ? `/${params.portalid}/esignature`
                         : "/esignature"
                     }
                   />
                 )}
                 {filterPageVisibility("loans") && (
                   <NavBarItem
                     title="Loans"
                     href={
                       params.portalid ? `/${params.portalid}/loans` : "/loans"
                     }
                   />
                 )}
                 {/* {customPages?.length > 0 && (
                    <div className="relative text-gray-800 cursor-pointer mr-5" ref={moreLinksDropdownRef}>
                      <div onClick={() => setIsOpenMoreLinksDropdown((prev) => !prev)}>
                        <Ellipsis />
                      </div>

                      {isOpenMoreLinksDropdown && (
                        <div className="absolute right-0 mt-2 max-w-60 min-w-48 bg-white shadow-lg rounded-lg border z-30 text-sm">
                          {customPages.map((page) => (
                            <div
                              key={page?.id || page?.title}
                              className="p-2 hover:bg-gray-100 flex items-center gap-2 px-3"
                              onClick={() => {
                                setIsOpenMoreLinksDropdown(false);
                                router.push(
                                  params.portalid
                                    ? `/${params.portalid}/${sanitizeName(
                                        page?.title
                                      )}`
                                    : "/loans"
                                )
                              }}
                            >
                              <File className="size-5" />
                              {page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )} */}
                  {customPages?.length > 0 && customPages?.map((page) => (
                    <NavBarItem 
                      key={page?.id}
                      title={page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
                      href={
                        params.portalid
                          ? `/${params.portalid}/${sanitizeName(
                            page?.title
                            )}`
                          : `/dashboard`
                      }
                    />
                  ))}
                {/* {userIsAdmin && (
                  <NavBarItem
                    title="Settings"
                    href={
                      params.portalid
                        ? `/${params.portalid}/settings`
                        : "/settings"
                    }
                  />
                )} */}
              </>
            )}

            {/* Profile dropdown */}
            <div className="flex items-center space-x-8 cursor-pointer">
              <div
                ref={dropdownRef}
                className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
                onClick={() => setAccountDropdown((prev) => !prev)}
              >
                {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                <div
                  className={`size-10 rounded-full overflow-hidden flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                    }`}
                >
                  {/* {
                    isAdvisorViewOpen ? <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1498529605908-f357a9af7bf5?auto=format&fit=crop&w=1950&q=60&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D" /> : user?.name?.charAt(0).toUpperCase() || "U"
                  } */}
                  {
                    user?.name?.charAt(0).toUpperCase() || "U"
                  }
                </div>
                <div className="flex flex-col text-sm xl:text-base">
                  <span className="text-gray-900 font-medium">
                    {/* {
                      isAdvisorViewOpen ? "Erica Smith" : user?.name
                    } */}
                    {user?.name}
                  </span>
                </div>

                {/* DROPDOWN SECTION DONE*/}
                {accountDropdown && (
                  <>
                    {isAdvisorViewOpen ? (
                      <div className="absolute top-[50px] overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                        {!userIsModerator && (
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
                        )}
                        {
                          userIsModerator && (
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                            >
                              <LogOut className="h-5 w-5" />
                              Sign out
                            </button>
                          )
                        }
                      </div>
                    ) : (
                      <div className="absolute top-[50px] overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
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
                        {/* Edit button */}
                        {userIsAdmin && !isAdvisorViewOpen && (
                          <button
                            className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                            onClick={() =>
                              router.push(
                                params.portalid
                                  ? `/${params.portalid}/settings`
                                  : "/settings"
                              )
                            }
                          >
                            <Bolt className="h-5 w-5" />
                            Tools
                          </button>
                        )}
                        {
                          userIsAdmin && (
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
                          )
                        }
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
                    {filterPageVisibility("dashboard") && (
                       <NavBarItem
                         title="Dashboard"
                         href={
                           params.portalid
                             ? `/${params.portalid}/dashboard`
                             : `/dashboard`
                         }
                       />
                     )}
                    {/* <NavBarItem
                      title="My Documents"
                      href={
                        params.portalid
                          ? `/${params.portalid}/my-docs`
                          : "/my-docs"
                      }
                    /> */}
                    {filterPageVisibility("shared-docs") && (
                       <NavBarItem
                         title="Shared Documents"
                         href={
                           params.portalid
                             ? `/${params.portalid}/shared-docs`
                             : "/shared-docs"
                         }
                       />
                     )}
                     {filterPageVisibility("esignature") && (
                       <NavBarItem
                         title="eSignature"
                         href={
                           params.portalid
                             ? `/${params.portalid}/esignature`
                             : "/esignature"
                         }
                       />
                     )}
                     {filterPageVisibility("loans") && (
                       <NavBarItem
                         title="Loans"
                         href={
                           params.portalid
                             ? `/${params.portalid}/loans`
                             : "/loans"
                         }
                       />
                     )}
                     {customPages?.length > 0 && customPages?.map((page) => (
                        <NavBarItem 
                          key={page?.id}
                          title={page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
                          href={
                            params.portalid
                              ? `/${params.portalid}/${sanitizeName(
                                page?.title
                                )}`
                              : `/dashboard`
                          }
                        />
                      ))}
                  </>
                )}
                <div className="flex items-center space-x-2 cursor-pointer">
                  <div
                    ref={dropdownRef}
                    className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
                    onClick={() => setAccountDropdown((prev) => !prev)}
                  >
                    {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                    <div
                      className={`size-10 rounded-full overflow-hidden flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                        }`}
                    >
                      {/* {
                        isAdvisorViewOpen ? <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1498529605908-f357a9af7bf5?auto=format&fit=crop&w=1950&q=60&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D" /> : user?.name?.charAt(0).toUpperCase() || "U"
                      } */}
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col text-sm xl:text-base">
                      <span className="text-gray-900 font-medium">
                        {/* {
                          isAdvisorViewOpen ? "Erica Smith" : user?.name
                        } */}
                        {user?.name}
                      </span>
                    </div>

                    {accountDropdown && (
                      <>
                        {isAdvisorViewOpen ? (
                          <div className="absolute top-[50px] overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                            {!userIsModerator && (
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
                            )}
                            {
                              userIsModerator && (
                                <button
                                  onClick={handleLogout}
                                  className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                                >
                                  <LogOut className="h-5 w-5" />
                                  Sign out
                                </button>
                              )
                            }
                          </div>
                        ) : (
                          <div className="absolute top-[50px] overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
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
                            {/* Edit button */}
                            {userIsAdmin && !isAdvisorViewOpen && (
                              <button
                                className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                                onClick={() =>
                                  router.push(
                                    params.portalid
                                      ? `/${params.portalid}/settings`
                                      : "/settings"
                                  )
                                }
                              >
                                <Bolt className="h-5 w-5" />
                                Tools
                              </button>
                            )}
                            {
                              userIsAdmin && (
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
                              )
                            }
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
