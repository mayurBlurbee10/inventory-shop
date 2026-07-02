"use client";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import SettingsModal from "./Settings";
import TechSupport from "./TechSupport";
import {
  clearCookieByName,
} from "@/app/lib/auth";
import {
  ArrowLeft,
  Bell,
  Bolt,
  ChartLine,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  EllipsisVertical,
  FilePen,
  FileText,
  Headset,
  LayoutDashboard,
  LayoutDashboardIcon,
  LogOut,
  Menu,
  MessageSquare,
  Plug,
  Settings,
  Signature,
  Users,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import AccountInfo from "./AccountInfo";
import { useDispatch, useSelector } from "react-redux";
import { UserRole } from "@/config/constants";
import { setPages as setReduxPages } from "@/store/services/pageService";
import { fontSizes, logoSizeRatio } from "@/app/lib/data/font_size";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { clearUserStates } from "@/app/lib/userCleanupService";
import PluginRenderer from "../../Plugins/PluginRenderer";
import NotificationConfiguration from "./NotificationConfiguration";
import NotificationModal from "./InAppNotification/NotificationModel";
import MessageComponent from "./Message/Message";
import { useSocket } from "@/app/lib/useSocket";

function Navbar({ content, config, filterValue }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [userIsModerator, setUserIsModerator] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTechSupportModalOpen, setIsTechSupportModalOpen] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isOpenNavbar, setIsOpenNavbar] = useState(false);
  const [isManagePortalView, setIsManagePortalView] = useState(false);
  const [isIntegrateDropdownOpen, setIsIntegrateDropdownOpen] = useState(false);
  const [isAccountInfoModalOpen, setIsAccountInfoModalOpen] = useState(false);
  const [isNotificationConfigurationOpen, setIsNotificationConfigurationOpen] = useState(false);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const dropdownRef = useRef(null);
  const moreLinksDropdownRef = useRef(null);
  const [logo, setLogo] = useState(null);
  const [pages, setPages] = useState([]);
  const [customPages, setCustomPages] = useState([]);
  const [isOpenMoreLinksDropdown, setIsOpenMoreLinksDropdown] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navbarRef = useRef(null);
  const [navbarHeight, setNavbarHeight] = useState(null);
  const { data: user } = useSelector((state) => state.user);
  const { data: pageData } = useSelector((state) => state.pages);
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  useSocket();

  useEffect(() => {
    setLogo(config?.logo || null);
  }, [user, config]);

  const openMessageDrawer = () => {
    if (!user?.id) {
      toast.error("Please sign in to view messages.");
      return;
    }

    setIsMessageDrawerOpen(true);
  };

  useEffect(() => {
    if (!navbarRef.current) return;
    const update = () => {
      if (!navbarRef.current) return;
      const nextHeight = navbarRef.current.getBoundingClientRect().height;
      setNavbarHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      if (Number.isFinite(nextHeight) && nextHeight > 0) {
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${nextHeight}px`,
        );
      }
    }; update();

    const ro = new ResizeObserver(() => {
      update();
    });

    ro.observe(navbarRef.current);
    return () => ro.disconnect();
  }, [config?.primaryColor, config?.accentColor, config?.secondaryColor]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAccountDropdown(false);
      }

      if (
        moreLinksDropdownRef.current &&
        !moreLinksDropdownRef.current.contains(event.target)
      ) {
        setIsOpenMoreLinksDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const NavBarItem = ({ title, href, activeRoutes = [], icon: Icon }) => {
    if (!href) {
      console.error("href prop is required for NavBarItem.");
      return null;
    }
    const isActive =
      pathname.includes(href) ||
      activeRoutes.some((route) => pathname.includes(route));

    const [isHovered, setIsHovered] = useState(false);
    const isActiveOrHovered = isActive || isHovered;

    if (isOpenNavbar) {
      return (
        <Link href={href} passHref className="w-full block">
          <div
            className={`relative flex items-center transition-all cursor-pointer w-full px-4 py-3 rounded-lg `}
            style={{ backgroundColor: isActive || isHovered ? config?.accentColor : "transparent",
             }}
             onMouseEnter={() => setIsHovered(true)}
             onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsOpenNavbar(false)}
          >
            <span
              className={`font-lato text-sm flex items-center ${isActive ? "font-bold" : "font-medium"
                }`}
              style={isActive || isHovered ? { color: config?.primaryColor } : { color: "#374151" }}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" style={{ color: isActive || isHovered ? config?.primaryColor : "#374151" }} />}
              {title}
            </span>
          </div>
        </Link>
      );
    }

    return (
      <Link
        href={href}
        passHref
        className="mr-2"
        onClick={() => setIsOpenNavbar(false)}
      >
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex items-center px-4 py-2 text-sm font-semibold rounded-md whitespace-nowrap hover:scale-105 transition-all duration-200"
          style={{
            color: isActiveOrHovered
              ? config?.primaryColor
              : config?.secondaryColor,
            backgroundColor: isHovered
              ? config?.accentColor
              : isActive
                ? config?.accentColor
                : "transparent",
          }}
        >
          {Icon && <Icon className="mr-2 h-4 w-4" style={{ color: isActiveOrHovered ? config?.primaryColor : config?.secondaryColor }} />}
          {title}
        </button>
      </Link>
    );
  };

  const NotificationNavButton = ({ variant = "desktop" }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isActiveOrHovered = isNotificationModalOpen || isHovered;
    const isMobile = variant === "mobile";

    if (isMobile) {
      return (
        <button
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            setIsNotificationModalOpen(true);
            setIsOpenNavbar(false);
          }}
          className="relative flex w-full cursor-pointer items-center rounded-lg px-4 py-3 transition-all"
          style={{
            backgroundColor: isActiveOrHovered ? config?.accentColor : "transparent",
          }}
        >
          <span
            className={`font-lato flex items-center text-sm ${
              isNotificationModalOpen ? "font-bold" : "font-medium"
            }`}
            style={isActiveOrHovered ? { color: config?.primaryColor } : { color: "#374151" }}
          >
            <Bell
              className="mr-2 h-4 w-4"
              style={{ color: isActiveOrHovered ? config?.primaryColor : "#374151" }}
            />
            Notifications
          </span>
          {notificationCount > 0 && (
            <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {notificationCount}
            </span>
          )}
        </button>
      );
    }

    const buttonStyle = {
      color: isActiveOrHovered ? config?.primaryColor : config?.secondaryColor,
      backgroundColor: isActiveOrHovered ? config?.accentColor : "transparent",
    };

    return (
      <button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsNotificationModalOpen(true)}
        className="relative flex items-center rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105 cursor-pointer"
        style={buttonStyle}
      >
        <Bell
          className="h-5 w-5"
          style={{ color: buttonStyle.color }}
        />
        {notificationCount > 0 && (
          <span className={`absolute ${isHovered ? "right-[2px] -top-[-1px]" : "-right-0 -top-0"} flex size-2.5 items-center justify-center rounded-full bg-red-500 text-xs text-white`}>
            {notificationCount}
          </span>
        )}
      </button>
    );
  };

  const clearClientRefreshTokenCookie = () => {
    clearCookieByName("clientRefreshToken");
  };

  const clearClientTokenCookie = () => {
    clearCookieByName("clientToken");
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      // First log the logout action
      await fetchWrapper(
        "/api/auth/logout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portalId: params?.portalid,
          }),
        },
        "logout",
      );

      // Then clear user and Redux state
      clearUserStates();
      clearClientRefreshTokenCookie();
      clearClientTokenCookie();

      await signOut();
      toast.success("User signed out successfully");

      // Redirect to login
      window.location.href = params.portalid
        ? `/${params.portalid}/login`
        : "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    } finally {
      setLogoutLoading(false);
    }
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
      const encodedPage = encodeURIComponent("pages");
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid || "root"}&type=${encodedPage}`,
        {},
        "fetch-page",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();

      const filterPages =
        Array.isArray(data?.data) && data.data.length > 0
          ? data.data[0]?.pages?.filter(
            (item) => item.isCustomPage === false,
          ) || []
          : [];
      //  setPages(filterPages);
      dispatch(
        setReduxPages(
          Array.isArray(data?.data) &&
          data.data.length > 0 &&
          data.data[0]?.pages,
        ),
      );
    } catch (error) {
      console.error("Error fetching plugins:", error);
    }
  };

  const filterPageVisibility = (pageTitle) => {
    const page =
      pages?.length && pages?.find((page) => page.title === pageTitle);
    return page ? page.isPageVisible : true;
  };

  function sanitizeName(name) {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".")
      ? sanitizeName.slice(0, -1)
      : sanitizeName;
  }

  useEffect(() => {
    setUserIsAdmin(
      user?.role !== UserRole.USER && user?.role !== UserRole.MODERATOR,
    );
    setUserIsModerator(user?.role === UserRole.MODERATOR);
    fetchPages();
  }, []);

  const filterTheme = (title) => {
    const contentItem =
      content && content?.portalContent?.find((item) => item.title === title);
    let fontSize = fontSizes.find((item) => item.key === title);
    let theme = contentItem
      ? contentItem.theme
      : {
        fontSize: fontSize?.size,
        color: "#000000e6",
        fontWeight: title === "Paragraph" ? 300 : 400,
      };
    return theme;
  };

  const LogoImage = () => {
    const baseSize = 90; // Set a reasonable base size (in pixels)

    const logoSize =
      (filterTheme("Logo")?.fontSize &&
        logoSizeRatio[filterTheme("Logo")?.fontSize]) ||
      logoSizeRatio.small;
    return (
      <div className="block min-w-16">
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

  const portalId = Array.isArray(params?.portalid)
    ? params.portalid[0]
    : params?.portalid;
  const ToolsActive = pathname.includes("/settings");
  const managePortalTabs = [
    { id: "configuration", label: "Configuration", icon: Settings },
    { id: "identity", label: "Identity Management", icon: Users },
    { id: "reports", label: "Reports", icon: ChartLine },
    { id: "users", label: "User Access", icon: Users },
  ];
  const integrateOptions = [{ id: "integrate", label: "Integrate", icon: Plug }];

  const openManagePortalTab = (tabId) => {
    const settingsUrl = portalId
      ? `/${portalId}/settings?tab=${encodeURIComponent(tabId)}`
      : `/settings?tab=${encodeURIComponent(tabId)}`;
    router.push(settingsUrl);
    setIsOpenNavbar(false);
    setAccountDropdown(false);
    setIsManagePortalView(false);
    setIsIntegrateDropdownOpen(false);
  };

  const getNotifications = async (limit = 7, offset = 0) => {
    setIsNotificationLoading(true)
      try {
        setError(null);
        const res = await fetchWrapper(
          `/api/in-app-notification?limit=${limit}&offset=${offset}`,
          {},
          "get-notifications"
        );
  
        if (!res.ok) {
          throw new Error("Failed to fetch notifications");
        }
  
        const data = await res.json();
        if (data && data.data) {
          setNotifications(data?.data);
        }
        return data;
      } catch (error) {
        setError(error?.message || "Failed to load notifications");
        return null;
      } finally {
        setIsNotificationLoading(false)
      }
    };
  
    useEffect(() => {
      getNotifications()
    }, [])

   useEffect(() => {
      const unreadCount = notifications.filter(n => n.status?.toLowerCase() !== "read").length > 0;
      setNotificationCount(unreadCount);
    }, [notifications, setNotificationCount]);

  return (
    <>
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        config={config}
        setNotificationCount={setNotificationCount}
        notificationCount={notificationCount}
        notifications={notifications}
        setNotifications={setNotifications}
        isNotificationLoading={isNotificationLoading}
        setIsNotificationLoading={setIsNotificationLoading}
        error={error}
        setError={setError}
      />
    <div
      className="border-b border-[#0000001a] relative"
      style={{ backgroundColor: config?.primaryColor }}
    >
      <div className="w-full mx-auto px-2">
        <nav ref={navbarRef} className="flex justify-between">
          <div
            onClick={() => {
              const dashboardPage = pageData.find((page) => page.title === "dashboard");
              if (dashboardPage?.isPageVisible) {
                router.push(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalId}/dashboard`);
              } else {
                router.push(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalId}/shared-docs`);
              }
            }}
            className="flex items-center px-[18px] py-1 flex-shrink-0"
          >
            {logo ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (params.portalid) {
                    const dashboardPage = pages?.find((page) => page.title === "dashboard");
                    if (dashboardPage?.isPageVisible) {
                      router.push(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/${params.portalid}/dashboard`);
                    } else {
                      router.push(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/${params.portalid}/shared-docs`);
                    }
                  } else {
                    const dashboardPage = pages?.find((page) => page.title === "dashboard");
                    if (dashboardPage?.isPageVisible) {
                      router.push(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/dashboard`);
                    } else {
                      router.push(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-docs`);
                    }
                  }
                }}
              >
                <LogoImage />
              </div>
            ) : (
              <div className="h-[60px] w-[150px] mr-2 bg-gray-300 animate-pulse rounded" />
            )}

            <span
              className="text-3xl text-[#000000e6] font-lato overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] md:max-w-[300px] lg:max-w-[350px] xl:max-w-[450px]"
              style={{
                fontSize: filterTheme("Header Text").fontSize,
                fontWeight: filterTheme("Header Text").fontWeight,
                lineHeight: "1.2",
                paddingBottom: "2px",
                paddingInline: "2px",
              }}
            >
              {
                filterValue("Header Text") &&
                  filterValue("Header Text") !== "Premier Customer Portal"
                  ? filterValue("Header Text")
                  : params?.portalid
              }
            </span>
          </div>

          <div className="hidden lg:flex items-center">
            {filterPageVisibility("dashboard") && (
              <NavBarItem
                title="Dashboard"
                icon={LayoutDashboard}
                href={
                  params.portalid
                    ? `/${params.portalid}/dashboard`
                    : `/dashboard`
                }
              />
            )}

            {filterPageVisibility("shared-docs") && (
              <NavBarItem
                title="Shared Documents"
                icon={FileText}
                href={
                  params.portalid
                    ? `/${params.portalid}/shared-docs`
                    : "/shared-docs"
                }
              />
            )}
            {filterPageVisibility("esignature") && (
              <NavBarItem
                title="Sign"
                icon={Signature}
                href={
                  params.portalid
                    ? `/${params.portalid}/esignature`
                    : "/esignature"
                }
              />
            )}
            {(userIsAdmin || userIsModerator) &&
              filterPageVisibility("advisor dashboard") && (
                <NavBarItem
                  title="Advisor Dashboard"
                  icon={LayoutDashboardIcon}
                  href={
                    params.portalid
                      ? `/${params.portalid}/advisor/dashboard`
                      : "/advisor/dashboard"
                  }
                  activeRoutes={[
                    params.portalid
                      ? `/${params.portalid}/advisor/shared-docs`
                      : "/advisor/shared-docs",
                  ]}
                />
              )}
            {filterPageVisibility("forms") && (
              <NavBarItem
                title="Forms"
                icon={FilePen}
                href={params.portalid ? `/${params.portalid}/forms` : "/forms"}
              />
            )}
            {customPages?.length > 0 &&
              customPages?.map((page) => (
                <NavBarItem
                  key={page?.id}
                  icon={LayoutDashboard}
                  title={
                    page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)
                  }
                  href={
                    params.portalid
                      ? `/${params.portalid}/${sanitizeName(page?.title)}`
                      : `/dashboard`
                  }
                />
              ))}
          </div>
          {/* Profile dropdown */}
          <div className="hidden lg:flex items-center space-x-8 cursor-pointer">
            <div className="hidden md:block">
              <PluginRenderer config={config} pluginKeys={['box_ai']} />
            </div>
            {/* <div className="relative"> */}
              <NotificationNavButton />
            {/* </div> */}
            <button
              type="button"
              onClick={openMessageDrawer}
              className={`relative flex items-center justify-center size-10 rounded-full hover:bg-white/25 transition-colors ${isMessageDrawerOpen ? "bg-white/25" : ""}`}
              title="Messages"
              aria-label="Messages"
            >
              <MessageSquare
                className="size-5"
                style={{ color: config?.secondaryColor || "#111827" }}
              />
            </button>
            <div
              ref={dropdownRef}
              className="flex items-center space-x-3 pl-4 relative"
              onClick={() => setAccountDropdown((prev) => !prev)}
            >
              {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
              <div
                className={`size-10 rounded-full overflow-hidden flex items-center justify-center shadow-sm font-lato transition-transform hover:scale-105`}
                style={{
                  backgroundColor: config?.accentColor ? `${config.accentColor}3A` : '#3b82f61B',
                  border: `1px solid ${config?.accentColor ? config.accentColor : '#3b82f61B'}`,
                  color: config?.secondaryColor ? config.secondaryColor : '#ffffff1b',
                }}
              >
                {user?.firstName?.charAt(0).toUpperCase() || "U"}
              </div>

              {/* DROPDOWN SECTION DONE*/}
              {accountDropdown && (
                <div className="absolute top-[50px] overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                  <button
                    className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                    onMouseEnter={ (e) =>{
                      e.currentTarget.style.backgroundColor = config?.accentColor ? `${config.accentColor}` : '#3b82f633'
                      }}
                    onMouseLeave={ (e) =>{
                      e.currentTarget.style.backgroundColor = 'inherit'
                    }}
                    onClick={() => setIsAccountInfoModalOpen((prev) => !prev)}
                  >
                    <CircleUserRound className="h-5 w-5" /> Account Info
                  </button>
                  <button
                    className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                    onMouseEnter={ (e) =>{
                      e.currentTarget.style.backgroundColor = config?.accentColor ? `${config.accentColor}` : '#3b82f633'
                      }}
                    onMouseLeave={ (e) =>{
                      e.currentTarget.style.backgroundColor = 'inherit'
                    }}
                    onClick={() => setIsNotificationConfigurationOpen((prev) => !prev)}
                  >
                    <Bell className="h-5 w-5" /> Preferences
                  </button>
                  {userIsAdmin && (
                    <button
                      onClick={() =>
                        setIsTechSupportModalOpen((prev) => !prev)
                      }
                      className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                      onMouseEnter={ (e) =>{
                      e.currentTarget.style.backgroundColor = config?.accentColor ? `${config.accentColor}` : '#3b82f633'
                      }}
                    onMouseLeave={ (e) =>{
                      e.currentTarget.style.backgroundColor = 'inherit'
                    }}
                    >
                      <Headset className="h-5 w-5" />
                      Tech Support
                    </button>
                  )}
                  {/* Edit button */}
                  {userIsAdmin && (
                    <button
                    className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                    onMouseEnter={ (e) =>{
                      e.currentTarget.style.backgroundColor = config?.accentColor ? `${config.accentColor}` : '#3b82f633'
                      }}
                    onMouseLeave={ (e) =>{
                      e.currentTarget.style.backgroundColor = 'inherit'
                    }}  
                      onClick={() =>
                        router.push(
                          params.portalid
                            ? `/${params.portalid}/settings?tab=configuration`
                            : "/settings?tab=configuration",
                        )
                      }
                    >
                      <Bolt className="h-5 w-5" />
                      Tools
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                  >
                    {logoutLoading ? (
                      <LoaderSpinner size={24} className="text-blue-500" />
                    ) : (
                      <LogOut className="h-5 w-5" />
                    )}
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navbar */}

          <button
            className="lg:hidden text-text"
            onClick={() => setIsOpenNavbar(true)}
          >
            <Menu className="h-6 w-6 text-headerlink" />
          </button>

          {isOpenNavbar && (
            <div className="fixed top-0 right-0 sm:w-2/5 w-4/5 h-full bg-white shadow-lg z-50 transition-all flex flex-col">
              <div
                style={{
                  minHeight: "var(--navbar-height, 56px)",
                }}
                className={`flex items-center pr-5 ${isManagePortalView ? "justify-between pl-5" : "justify-end"}`}
              >
                {isManagePortalView && (
                  <button
                    type="button"
                    onClick={() => setIsManagePortalView(false)}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                <button
                  className="text-gray-800 hover:bg-gray-100 rounded-full"
                  onClick={() => {
                    setIsOpenNavbar(false);
                    setAccountDropdown(false);
                    setIsManagePortalView(false);
                    setIsIntegrateDropdownOpen(false);
                  }}
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
              </div>

              <div className="flex flex-col items-start w-full flex-1 min-h-0">
                {isManagePortalView ? (
                  <div className="w-full h-full flex flex-col p-5">
                    <div className="flex justify-between items-center mt-2 mb-4">
                      <h2 className="text-md text-gray-800 font-semibold">Tools</h2>
                    </div>
                    <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] w-full">
                      {managePortalTabs
                        .slice()
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map(({ id, label, icon: Icon, hasDropdown }) => {
                          const isActive = hasDropdown
                            ? isIntegrateDropdownOpen || activeTab === "integrate"
                            : activeTab === id;
                          const primaryColor = config?.primaryColor || "#3f3f46";
                          const accentColor = config?.accentColor || "#ffffff";
                          return (
                            <div key={id} className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  hasDropdown
                                    ? setIsIntegrateDropdownOpen((prev) => !prev)
                                    : openManagePortalTab(id)
                                }
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out ${isActive ? "bg-gray-100" : "bg-transparent"
                                  } ${isActive ? "" : "hover:bg-gray-100"
                                  }`}
                                style={{
                                  color: isActive ? primaryColor : "#3f3f46",
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  <Icon
                                    className="w-4 h-4"
                                    style={{
                                      color: isActive ? primaryColor : "#3f3f46",
                                    }}
                                  />
                                  <span className="text-left">{label}</span>
                                </div>
                                <div>
                                  {hasDropdown && (
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform ${isIntegrateDropdownOpen ? "rotate-180" : ""
                                        }`}
                                      style={{ color: isActive ? primaryColor : "#3f3f46" }}
                                    />
                                  )}
                                </div>
                              </button>

                              {hasDropdown && isIntegrateDropdownOpen && (
                                <div className="mt-1 ml-3">
                                  {integrateOptions.map(({ id: optionId, label: optionLabel, icon: OptionIcon }) => {
                                    const isOptionActive = activeTab === optionId;
                                    return (
                                      <button
                                        key={optionId}
                                        type="button"
                                        onClick={() => openManagePortalTab(optionId)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out"
                                        style={{
                                          backgroundColor: isOptionActive ? accentColor : "transparent",
                                          color: isOptionActive ? primaryColor : "#3f3f46",
                                        }}
                                      >
                                        <span className="flex items-center gap-3">
                                          <OptionIcon className="w-4 h-4" />
                                          {optionLabel}
                                        </span>
                                        {/* <ChevronRight className="w-4 h-4" /> */}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </nav>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-start gap-2 w-full px-5 flex-1 min-h-0 overflow-y-auto">
                      {filterPageVisibility("dashboard") && (
                        <NavBarItem
                          title="Dashboard"
                          icon={LayoutDashboard}
                          href={
                            params.portalid
                              ? `/${params.portalid}/dashboard`
                              : `/dashboard`
                          }
                        />
                      )}
                      {filterPageVisibility("shared-docs") && (
                        <NavBarItem
                          title="Shared Documents"
                          icon={FileText}
                          href={
                            params.portalid
                              ? `/${params.portalid}/shared-docs`
                              : "/shared-docs"
                          }
                        />
                      )}
                      {filterPageVisibility("esignature") && (
                        <NavBarItem
                          title="Sign"
                          icon={Signature}
                          href={
                            params.portalid
                              ? `/${params.portalid}/esignature`
                              : "/esignature"
                          }
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpenNavbar(false);
                          openMessageDrawer();
                        }}
                        className="relative flex items-center transition-all cursor-pointer w-full px-4 py-3 rounded-lg hover:bg-gray-100"
                      >
                        <span
                          className={`font-lato text-sm flex items-center ${
                            isMessageDrawerOpen ? "font-bold" : "font-medium"
                          }`}
                          style={
                            isMessageDrawerOpen
                              ? { color: config?.primaryColor }
                              : { color: "#374151" }
                          }
                        >
                          <MessageSquare
                            className="mr-2 h-4 w-4"
                            style={{
                              color: isMessageDrawerOpen
                                ? config?.primaryColor
                                : "#374151",
                            }}
                          />
                          Messages
                        </span>
                      </button>
                      {(userIsAdmin || userIsModerator) &&
                        filterPageVisibility("advisor dashboard") && (
                          <NavBarItem
                            title="Advisor Dashboard"
                            icon={LayoutDashboard}
                            href={
                              params.portalid
                                ? `/${params.portalid}/advisor/dashboard`
                                : "/advisor/dashboard"
                            }
                            activeRoutes={[
                              params.portalid
                                ? `/${params.portalid}/advisor/shared-docs`
                                : "/advisor/shared-docs",
                            ]}
                          />
                        )}
                      {filterPageVisibility("forms") && (
                        <NavBarItem
                          title="Forms"
                          icon={FilePen}
                          href={
                            params.portalid ? `/${params.portalid}/forms` : "/forms"
                          }
                        />
                      )}
                      {customPages?.length > 0 &&
                        customPages?.map((page) => (
                          <NavBarItem
                            key={page?.id}
                            icon={FileText}
                            title={
                              page?.title?.charAt(0).toUpperCase() +
                              page?.title?.slice(1)
                            }
                            href={
                              params.portalid
                                ? `/${params.portalid}/${sanitizeName(page?.title)}`
                                : `/dashboard`
                            }
                          />
                        ))}
                      <div className="">
                        <PluginRenderer config={config} pluginKeys={['box_ai']} />
                      </div>
                      <div className="relative w-full">
                        <NotificationNavButton variant="mobile" />
                      </div>
                    </div>
                    <div className="flex items-center justify-start space-x-2 w-full mt-auto border-t border-slate-200">
                      <div ref={dropdownRef} className="w-full">
                        {accountDropdown && (
                          <div className="w-full p-5 flex flex-col gap-2">
                            <button
                              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-800 hover:font-semibold"
                              onClick={() => setIsAccountInfoModalOpen((prev) => !prev)}
                            >
                              <CircleUserRound className="h-4 w-4" />
                              Account Info
                            </button>
                            <button
                              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-800 hover:font-semibold"
                              onClick={() => setIsNotificationConfigurationOpen((prev) => !prev)}
                            >
                              <Bell className="h-4 w-4" />
                              Preferences
                            </button>
                            {userIsAdmin && (
                              <button
                                onClick={() => setIsTechSupportModalOpen((prev) => !prev)}
                                className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-800 hover:font-semibold"
                              >
                                <Headset className="h-4 w-4" />
                                Tech Support
                              </button>
                            )}
                            {userIsAdmin && (
                              <button
                                className={`flex items-center justify-between w-full px-4 py-2 text-left text-sm text-gray-800 hover:font-semibold ${ToolsActive ? "font-semibold" : ""
                                  }`}
                                onClick={() => {
                                  setIsManagePortalView(true);
                                  setAccountDropdown(false);
                                }}
                              >
                                <span className="flex items-center gap-3">
                                  <Bolt className={`h-4 w-4`} />
                                  Tools
                                </span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-500 hover:font-semibold"
                            >
                              {logoutLoading ? (
                                <LoaderSpinner size={24} className="text-blue-500" />
                              ) : (
                                <LogOut className="h-4 w-4" />
                              )}
                              Sign out
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left bg-slate-100 p-3"
                          onClick={() => setAccountDropdown((prev) => !prev)}
                        >
                          <div
                            className={`size-10 rounded-full overflow-hidden flex items-center justify-center shadow-sm font-lato transition-transform hover:scale-105`}
                            style={{
                              backgroundColor: config?.accentColor ? `${config.accentColor}3A` : '#3b82f61B',
                              border: `1px solid ${config?.accentColor ? config.accentColor : '#3b82f61B'}`,
                              color: config?.secondaryColor ? config.secondaryColor : '#ffffff1b',
                            }}
                          >
                            {user?.firstName?.charAt(0).toUpperCase() || "U"}
                          </div>

                          <div className="flex flex-col text-sm xl:text-base">
                            <span className="font-medium line-clamp-1 text-black">
                              {`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
                            </span>
                          </div>
                          <span className="ml-auto text-black pr-4">
                            <EllipsisVertical className="h-4 w-4" />
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
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

      {isMessageDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            aria-hidden
            onClick={() => setIsMessageDrawerOpen(false)}
          />
          <aside
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
            aria-label="Message sidebar"
            style={{
              "--accent": config?.accentColor,
              "--primary": config?.primaryColor,
              "--secondary": config?.secondaryColor,
            }}
          >
            <div
              className="flex items-center justify-between border-b px-4 bg-white shrink-0"
              style={{
                height: navbarHeight ? `${navbarHeight}px` : undefined,
              }}
            >
              <div className="text-sm font-semibold text-[var(--secondary)]">
                Messages
              </div>
              <button
                type="button"
                onClick={() => setIsMessageDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close messages"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <MessageComponent />
            </div>
          </aside>
        </>
      )}

      <NotificationConfiguration
        isOpen={isNotificationConfigurationOpen}
        onClose={() => setIsNotificationConfigurationOpen(false)}
        config={config}
        user={user}
      />
    </div>
    </>

  );
}

export default Navbar;
