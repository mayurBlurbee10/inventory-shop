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
  Moon,
  Plug,
  Settings,
  Signature,
  Sun,
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
import { getStoredMode, toggleGlobalThemeMode } from "@/app/lib/theme-manager";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// OLD portal theme: inline styles used config?.primaryColor, config?.accentColor,
// config?.secondaryColor. Replaced with CSS variables via Tailwind theme tokens
// (bg-primary, text-primary-foreground, bg-accent, text-foreground, etc.).

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
  const [themeMode, setThemeMode] = useState("light");
  useSocket();

  useEffect(() => {
    setLogo(config?.logo || null);
  }, [user, config]);

  useEffect(() => {
    setThemeMode(getStoredMode());
    const handleModeChange = (event) => {
      if (event?.detail) setThemeMode(event.detail);
    };
    window.addEventListener("theme-mode-changed", handleModeChange);
    return () =>
      window.removeEventListener("theme-mode-changed", handleModeChange);
  }, []);

  const handleToggleThemeMode = () => {
    const nextMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
    toggleGlobalThemeMode(nextMode);
  };

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
  }, []);


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

  const desktopNavItemClass = (isActive) =>
    cn(
      "flex items-center px-4 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-all duration-200",
      isActive
        ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/25"
        : "text-primary-foreground/90 hover:bg-accent hover:text-primary",
    );

  const mobileNavItemClass = (isActive) =>
    cn(
      "relative flex items-center transition-all cursor-pointer w-full px-4 py-3 rounded-lg font-lato text-sm",
      isActive
        ? "bg-accent text-primary font-bold"
        : "text-foreground font-medium hover:bg-accent hover:text-primary",
    );

  const NavBarItem = ({ title, href, activeRoutes = [], icon: Icon }) => {
    if (!href) {
      console.error("href prop is required for NavBarItem.");
      return null;
    }
    const isActive =
      pathname.includes(href) ||
      activeRoutes.some((route) => pathname.includes(route));

    if (isOpenNavbar) {
      return (
        <Link href={href} passHref className="w-full block">
          <div
            className={mobileNavItemClass(isActive)}
            onClick={() => setIsOpenNavbar(false)}
          >
            <span className="flex items-center">
              {Icon && <Icon className="mr-2 h-4 w-4" />}
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
        <span className={desktopNavItemClass(isActive)}>
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {title}
        </span>
      </Link>
    );
  };

  const NotificationNavButton = ({ variant = "desktop" }) => {
    const isActive = isNotificationModalOpen;
    const isMobile = variant === "mobile";

    if (isMobile) {
      return (
        <button
          type="button"
          onClick={() => {
            setIsNotificationModalOpen(true);
            setIsOpenNavbar(false);
          }}
          className={cn(mobileNavItemClass(isActive), "relative")}
        >
          <span className="flex items-center">
            <Bell className="mr-2 size-5" />
            Notifications
          </span>
          {notificationCount > 0 && (
            <Badge variant="destructive" className="ml-auto size-5 rounded-full p-0 text-xs">
              {notificationCount}
            </Badge>
          )}
        </button>
      );
    }

    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsNotificationModalOpen(true)}
        className={cn(
          "relative rounded-md text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground",
          isActive && "bg-accent text-primary hover:bg-accent hover:text-primary",
        )}
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute right-1 top-1 flex size-2.5 items-center justify-center rounded-full bg-destructive" />
        )}
      </Button>
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
        // OLD: color: "#000000e6",
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
        className="relative border-b border-border bg-primary text-primary-foreground"
      >
        {/* OLD: style={{ backgroundColor: config?.primaryColor }} */}
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
                <Skeleton className="h-[60px] w-[150px] mr-2" />
              )}

              <span
                className="text-3xl text-primary-foreground font-lato overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] md:max-w-[300px] lg:max-w-[350px] xl:max-w-[450px]"
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
            <div className="hidden lg:flex items-center cursor-pointer">
              <div className="hidden md:block">
                <PluginRenderer config={config} pluginKeys={['box_ai']} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleToggleThemeMode}
                className="ml-2 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
                title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
              >
                {themeMode === "dark" ? (
                  <Sun className="size-5" />
                ) : (
                  <Moon className="size-5" />
                )}
              </Button>
              <div className="ml-2">
                <NotificationNavButton />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={openMessageDrawer}
                className={cn(
                  "ml-2 rounded-full text-primary-foreground hover:bg-primary-foreground/20",
                  isMessageDrawerOpen && "bg-primary-foreground/20",
                )}
                title="Messages"
                aria-label="Messages"
              >
                <MessageSquare className="size-5" />
              </Button>
              <DropdownMenu open={accountDropdown} onOpenChange={setAccountDropdown}>
                <DropdownMenuTrigger
                  className="nav-icon-btn ml-2 rounded-full p-0 outline-none transition-transform hover:scale-105"
                  render={
                    <button type="button" aria-label="Account menu" />
                  }
                >
                  <Avatar className="size-10 shadow-sm">
                    <AvatarFallback className="size-10 bg-secondary text-secondary-foreground font-black">
                      {user?.firstName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem className="gap-2 py-2 px-3 hover:bg-accent" onClick={() => setIsAccountInfoModalOpen(true)}>
                    <CircleUserRound className="h-5 w-5" />
                    Account Info
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 py-2 px-3 hover:bg-accent" onClick={() => setIsNotificationConfigurationOpen(true)}>
                    <Bell className="h-5 w-5" />
                    Preferences
                  </DropdownMenuItem>
                  {userIsAdmin && (
                    <DropdownMenuItem className="gap-2 py-2 px-3 hover:bg-accent" onClick={() => setIsTechSupportModalOpen(true)}>
                      <Headset className="h-5 w-5" />
                      Tech Support
                    </DropdownMenuItem>
                  )}
                  {userIsAdmin && (
                    <DropdownMenuItem
                      className="gap-2 py-2 px-3 hover:bg-accent"
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
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2 py-2 px-3 hover:bg-accent"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    {logoutLoading ? (
                      <LoaderSpinner size={24} className="text-destructive" />
                    ) : (
                      <LogOut className="h-5 w-5" />
                    )}
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Navbar */}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpenNavbar(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            {isOpenNavbar && (
              <div className="fixed top-0 right-0 sm:w-2/5 w-4/5 h-full bg-card text-card-foreground shadow-lg z-50 transition-all flex flex-col border-l border-border">
                <div
                  style={{
                    minHeight: "var(--navbar-height, 56px)",
                  }}
                  className={`flex items-center pr-5 ${isManagePortalView ? "justify-between pl-5" : "justify-end"}`}
                >
                  {isManagePortalView && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsManagePortalView(false)}
                      className="flex items-center gap-2 px-2 py-2 text-sm text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:bg-accent"
                    onClick={() => {
                      setIsOpenNavbar(false);
                      setAccountDropdown(false);
                      setIsManagePortalView(false);
                      setIsIntegrateDropdownOpen(false);
                    }}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="flex flex-col items-start w-full flex-1 min-h-0">
                  {isManagePortalView ? (
                    <div className="w-full h-full flex flex-col p-5">
                      <div className="flex justify-between items-center mt-2 mb-4">
                        <h2 className="text-md text-foreground font-semibold">Tools</h2>
                      </div>
                      <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] w-full">
                        {managePortalTabs
                          .slice()
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map(({ id, label, icon: Icon, hasDropdown }) => {
                            const isActive = hasDropdown
                              ? isIntegrateDropdownOpen || activeTab === "integrate"
                              : activeTab === id;
                            return (
                              <div key={id} className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    hasDropdown
                                      ? setIsIntegrateDropdownOpen((prev) => !prev)
                                      : openManagePortalTab(id)
                                  }
                                  className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out",
                                    isActive
                                      ? "bg-accent text-primary"
                                      : "bg-transparent text-foreground hover:bg-accent hover:text-primary",
                                  )}
                                >
                                  <div className="flex items-center space-x-3">
                                    <Icon className="w-4 h-4" />
                                    <span className="text-left">{label}</span>
                                  </div>
                                  <div>
                                    {hasDropdown && (
                                      <ChevronDown
                                        className={cn(
                                          "w-4 h-4 transition-transform",
                                          isIntegrateDropdownOpen && "rotate-180",
                                        )}
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
                                          className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out",
                                            isOptionActive
                                              ? "bg-accent text-primary"
                                              : "text-foreground hover:bg-accent hover:text-primary",
                                          )}
                                        >
                                          <span className="flex items-center gap-3">
                                            <OptionIcon className="w-4 h-4" />
                                            {optionLabel}
                                          </span>
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
                          className={mobileNavItemClass(isMessageDrawerOpen)}
                        >
                          <span className="flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Messages
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleThemeMode}
                          className={mobileNavItemClass(false)}
                        >
                          <span className="flex items-center">
                            {themeMode === "dark" ? (
                              <Sun className="mr-2 h-4 w-4" />
                            ) : (
                              <Moon className="mr-2 h-4 w-4" />
                            )}
                            {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
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
                      <div className="flex items-center justify-start space-x-2 w-full mt-auto border-t border-border">
                        <div ref={dropdownRef} className="w-full">
                          {accountDropdown && (
                            <div className="w-full p-5 flex flex-col gap-2">
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 px-4 py-2 text-sm text-foreground"
                                onClick={() => setIsAccountInfoModalOpen((prev) => !prev)}
                              >
                                <CircleUserRound className="h-4 w-4" />
                                Account Info
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 px-4 py-2 text-sm text-foreground"
                                onClick={() => setIsNotificationConfigurationOpen((prev) => !prev)}
                              >
                                <Bell className="h-4 w-4" />
                                Preferences
                              </Button>
                              {userIsAdmin && (
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start gap-3 px-4 py-2 text-sm text-foreground"
                                  onClick={() => setIsTechSupportModalOpen((prev) => !prev)}
                                >
                                  <Headset className="h-4 w-4" />
                                  Tech Support
                                </Button>
                              )}
                              {userIsAdmin && (
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-between px-4 py-2 text-sm text-foreground",
                                    ToolsActive && "font-semibold",
                                  )}
                                  onClick={() => {
                                    setIsManagePortalView(true);
                                    setAccountDropdown(false);
                                  }}
                                >
                                  <span className="flex items-center gap-3">
                                    <Bolt className="h-4 w-4" />
                                    Tools
                                  </span>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 px-4 py-2 text-sm text-destructive hover:text-destructive"
                                onClick={handleLogout}
                              >
                                {logoutLoading ? (
                                  <LoaderSpinner size={24} className="text-destructive" />
                                ) : (
                                  <LogOut className="h-4 w-4" />
                                )}
                                Sign out
                              </Button>
                            </div>
                          )}
                          <button
                            type="button"
                            className="flex items-center gap-3 w-full text-left bg-muted p-3"
                            onClick={() => setAccountDropdown((prev) => !prev)}
                          >
                            <Avatar size="lg">
                              <AvatarFallback className="font-lato">
                                {user?.firstName?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col text-sm xl:text-base">
                              <span className="font-medium line-clamp-1 text-foreground">
                                {`${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
                              </span>
                            </div>
                            <span className="ml-auto text-foreground pr-4">
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
              className="fixed inset-0 bg-foreground/30 z-40"
              aria-hidden
              onClick={() => setIsMessageDrawerOpen(false)}
            />
            <aside
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card text-card-foreground shadow-xl z-50 flex flex-col border-l border-border"
              aria-label="Message sidebar"
            >
              <div
                className="flex items-center justify-between border-b border-border px-4 bg-card shrink-0"
                style={{
                  height: navbarHeight ? `${navbarHeight}px` : undefined,
                }}
              >
                <div className="text-sm font-semibold text-foreground">
                  Messages
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMessageDrawerOpen(false)}
                  className="rounded-full text-muted-foreground hover:bg-accent"
                  aria-label="Close messages"
                >
                  <X className="w-5 h-5" />
                </Button>
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
