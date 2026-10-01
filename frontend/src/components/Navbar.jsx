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
  FileSpreadsheet,
  FileText,
  Headset,
  LayoutDashboard,
  LayoutDashboardIcon,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Palette,
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
import { AppTooltip } from "@/components/ui/tooltip";
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
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const [desktopAccountMenuOpen, setDesktopAccountMenuOpen] = useState(false);
  const [isOpenNavbar, setIsOpenNavbar] = useState(false);
  const [isManagePortalView, setIsManagePortalView] = useState(false);
  const [isIntegrateDropdownOpen, setIsIntegrateDropdownOpen] = useState(false);
  const [isAccountInfoModalOpen, setIsAccountInfoModalOpen] = useState(false);
  const [isNotificationConfigurationOpen, setIsNotificationConfigurationOpen] = useState(false);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);
  const dropdownRef = useRef(null);
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
  const [messageBadgeDismissed, setMessageBadgeDismissed] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [themeMode, setThemeMode] = useState("light");
  const { socket } = useSocket();

  const closeMobileSidebar = () => {
    setIsOpenNavbar(false);
    setMobileAccountMenuOpen(false);
    setIsManagePortalView(false);
    setIsIntegrateDropdownOpen(false);
  };

  const openAccountInfo = () => {
    setIsAccountInfoModalOpen(true);
    setDesktopAccountMenuOpen(false);
    closeMobileSidebar();
  };

  const openNotificationPreferences = () => {
    setIsNotificationConfigurationOpen(true);
    setDesktopAccountMenuOpen(false);
    closeMobileSidebar();
  };

  const openTechSupport = () => {
    setIsTechSupportModalOpen(true);
    setDesktopAccountMenuOpen(false);
    closeMobileSidebar();
  };

  const openToolsSettings = () => {
    setDesktopAccountMenuOpen(false);
    router.push(
      params.portalid
        ? `/${params.portalid}/settings?tab=configuration`
        : "/settings?tab=configuration",
    );
    closeMobileSidebar();
  };

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

    setMessageBadgeDismissed(true);
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
        setMobileAccountMenuOpen(false);
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
        : "text-primary-foreground/90 hover:bg-primary-foreground/15 hover:text-primary-foreground",
    );

  const navbarIconBtnClass = (isActive = false) =>
    cn(
      "relative inline-flex size-9 min-w-9 shrink-0 items-center justify-center rounded-md p-0 text-primary-foreground transition-colors",
      "[&_svg]:size-6 [&_svg]:shrink-0",
      "hover:!bg-primary-foreground/20 hover:!text-primary-foreground",
      isActive &&
        "bg-primary-foreground/20 text-primary-foreground hover:!bg-primary-foreground/25",
    );

  const mobileSidebarItemClass = (isActive = false) =>
    cn(
      "flex w-full items-center gap-3 h-10 px-3 text-sm font-semibold rounded-md border border-border transition-colors",
      isActive
        ? "bg-accent text-secondary-foreground border-primary/20"
        : "bg-muted/50 text-foreground hover:bg-accent hover:text-secondary-foreground",
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
            className={mobileSidebarItemClass(isActive)}
            onClick={() => setIsOpenNavbar(false)}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className="truncate">{title}</span>
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
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setIsNotificationModalOpen(true);
            setIsOpenNavbar(false);
          }}
          className={cn(mobileSidebarItemClass(isActive), "relative justify-between")}
        >
          <span className="flex items-center gap-3">
            <Bell className="size-4 shrink-0" />
            Notifications
          </span>
          {notificationCount > 0 && (
            <Badge variant="destructive" className="size-5 rounded-full p-0 text-xs">
              {notificationCount}
            </Badge>
          )}
        </Button>
      );
    }

    return (
      <AppTooltip label="Notifications">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => setIsNotificationModalOpen(true)}
          className={navbarIconBtnClass(isActive)}
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex size-2.5 items-center justify-center rounded-full bg-destructive" />
          )}
        </Button>
      </AppTooltip>
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
    return page ? !!page.isPageVisible : true;
  };

  function sanitizeName(name) {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".")
      ? sanitizeName.slice(0, -1)
      : sanitizeName;
  }

  const isNavLinkActive = (href, activeRoutes = []) =>
    pathname.includes(href) ||
    activeRoutes.some((route) => pathname.includes(route));

  const buildDesktopNavLinks = () => {
    const portalBase = params.portalid ? `/${params.portalid}` : "";
    const primaryLinks = [];
    const moreLinks = [];

    if (filterPageVisibility("dashboard")) {
      primaryLinks.push({
        key: "dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        href: portalBase ? `${portalBase}/dashboard` : "/dashboard",
      });
    }

    if (filterPageVisibility("shared-docs")) {
      primaryLinks.push({
        key: "shared-docs",
        title: "Shared Documents",
        icon: FileText,
        href: portalBase ? `${portalBase}/shared-docs` : "/shared-docs",
      });
    }

    if (filterPageVisibility("esignature")) {
      primaryLinks.push({
        key: "esignature",
        title: "Sign",
        icon: Signature,
        href: portalBase ? `${portalBase}/esignature` : "/esignature",
      });
    }

    if (userIsAdmin && filterPageVisibility("reports")) {
      primaryLinks.push({
        key: "reports",
        title: "Reports",
        icon: FileSpreadsheet,
        href: portalBase ? `${portalBase}/reports` : "/reports",
      });
    }

    if (
      (userIsAdmin || userIsModerator) &&
      filterPageVisibility("advisor dashboard")
    ) {
      moreLinks.push({
        key: "advisor-dashboard",
        title: "Advisor Dashboard",
        icon: LayoutDashboardIcon,
        href: portalBase
          ? `${portalBase}/advisor/dashboard`
          : "/advisor/dashboard",
        activeRoutes: [
          portalBase
            ? `${portalBase}/advisor/shared-docs`
            : "/advisor/shared-docs",
        ],
      });
    }

    if (filterPageVisibility("forms")) {
      moreLinks.push({
        key: "forms",
        title: "Forms",
        icon: FilePen,
        href: portalBase ? `${portalBase}/forms` : "/forms",
      });
    }

    customPages?.forEach((page) => {
      moreLinks.push({
        key: page?.id || page?.title,
        title: page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1),
        icon: LayoutDashboard,
        href: portalBase
          ? `${portalBase}/${sanitizeName(page?.title)}`
          : "/dashboard",
      });
    });

    return { primaryLinks, moreLinks };
  };

  const { primaryLinks, moreLinks } = buildDesktopNavLinks();
  const isMoreNavActive = moreLinks.some((link) =>
    isNavLinkActive(link.href, link.activeRoutes),
  );

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
    const logoSizeKey = filterTheme("Logo")?.fontSize || "medium";
    const logoHeightClass = {
      small: "h-10 sm:h-12 lg:h-[45px]",
      medium: "h-12 sm:h-14 lg:h-[68px]",
      large: "h-14 sm:h-16 lg:h-[90px]",
    }[logoSizeKey in logoSizeRatio ? logoSizeKey : "medium"];

    return (
      <div className="block shrink-0">
        <img
          src={logo.replace("/api/upload", "/uploads")}
          alt={params.portalid}
          className={cn("mr-2 w-auto max-w-[88px] object-contain sm:max-w-[96px] lg:max-w-none", logoHeightClass)}
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
    { id: "account-reports", label: "Account Reports", icon: ChartLine },
    { id: "reports", label: "Reports", icon: FileSpreadsheet },
    { id: "users", label: "User Access", icon: Users },
    { id: "theme", label: "Theme", icon: Palette },
  ];
  const integrateOptions = [{ id: "integrate", label: "Integrate", icon: Plug }];

  const openManagePortalTab = (tabId) => {
    const settingsUrl = portalId
      ? `/${portalId}/settings?tab=${encodeURIComponent(tabId)}`
      : `/settings?tab=${encodeURIComponent(tabId)}`;
    router.push(settingsUrl);
    setIsOpenNavbar(false);
    setMobileAccountMenuOpen(false);
    setIsManagePortalView(false);
    setIsIntegrateDropdownOpen(false);
  };

  const getNotifications = async (limit = 7, offset = 0) => {
    setIsNotificationLoading(true)
    try {
      setError(null);
      const [listRes, countRes] = await Promise.all([
        fetchWrapper(
          `/api/in-app-notification?limit=${limit}&offset=${offset}`,
          {},
          "get-notifications"
        ),
        fetchWrapper(
          `/api/in-app-notification/unread-count`,
          {},
          "get-unread-notification-count"
        ),
      ]);

      if (!listRes.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await listRes.json();
      if (data && data.data) {
        setNotifications(data?.data);
      }

      if (countRes.ok) {
        const countData = await countRes.json();
        setNotificationCount(countData?.data?.count ?? 0);
      } else {
        const unread = (data?.data || []).filter(
          (n) => (n.status || "").toLowerCase() !== "read"
        ).length;
        setNotificationCount(unread);
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
    if (user?.id) {
      getNotifications();
    }
  }, [user?.id, params?.portalid]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      setMessageBadgeDismissed(false);
      getNotifications();
    };

    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, user?.id, params?.portalid]);

  const hasUnreadMessage = notifications.some(
    (item) =>
      item.type === "message" &&
      String(item.status || "").toLowerCase() === "unread",
  );
  const showMessageBadge = hasUnreadMessage && !messageBadgeDismissed;

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
        getNotifications={getNotifications}
        error={error}
        setError={setError}
      />
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto w-full px-2">
          <nav
            ref={navbarRef}
            className="relative flex min-h-[56px] w-full items-center gap-2"
          >
            <div
              onClick={() => {
                const dashboardPage = pageData.find((page) => page.title === "dashboard");
                if (dashboardPage?.isPageVisible) {
                  router.push(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalId}/dashboard`);
                } else {
                  router.push(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/${portalId}/shared-docs`);
                }
              }}
              className="relative z-10 flex min-w-0 flex-1 items-center gap-1 px-2 py-1 sm:gap-2 sm:px-[18px] lg:w-auto lg:flex-none lg:flex-shrink-0"
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
                className="font-lato text-sm leading-tight text-primary-foreground whitespace-normal sm:text-base md:text-lg lg:text-xl 2xl:text-2xl"
                style={{
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

            <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 lg:flex">
              <div className="pointer-events-auto flex items-center">
              {primaryLinks.map((link) => (
                <NavBarItem
                  key={link.key}
                  title={link.title}
                  icon={link.icon}
                  href={link.href}
                  activeRoutes={link.activeRoutes}
                />
              ))}

              {moreLinks.length > 0 && (
                <div>
                  <DropdownMenu
                    open={isOpenMoreLinksDropdown}
                    onOpenChange={setIsOpenMoreLinksDropdown}
                  >
                    <DropdownMenuTrigger
                      className={cn(desktopNavItemClass(isMoreNavActive), "mr-2")}
                      render={<button type="button" aria-label="More navigation" />}
                    >
                      <span className="flex items-center">
                        More
                        <ChevronDown
                          className={cn(
                            "ml-1 h-4 w-4 transition-transform",
                            isOpenMoreLinksDropdown && "rotate-180",
                          )}
                        />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {moreLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = isNavLinkActive(
                          link.href,
                          link.activeRoutes,
                        );

                        return (
                          <DropdownMenuItem
                            key={link.key}
                            render={<Link href={link.href} />}
                            className={cn(
                              "gap-2 py-2 px-3 hover:bg-accent",
                              isActive && "bg-accent text-secondary-foreground font-semibold",
                            )}
                            onClick={() => setIsOpenMoreLinksDropdown(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {link.title}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              </div>
            </div>

            <div className="ml-auto hidden shrink-0 items-center gap-0.5 lg:flex">
              <div className="hidden md:block">
                <PluginRenderer config={config} pluginKeys={['box_ai']} />
              </div>
              <AppTooltip
                label={
                  themeMode === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={handleToggleThemeMode}
                  className={navbarIconBtnClass(false) + " mx-2"}
                  aria-label="Toggle theme"
                >
                  {themeMode === "dark" ? (
                    <Sun className="size-5" />
                  ) : (
                    <Moon className="size-5" />
                  )}
                </Button>
              </AppTooltip>
              <NotificationNavButton />
              <AppTooltip label="Messages">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={openMessageDrawer}
                  className={navbarIconBtnClass(isMessageDrawerOpen) + " mx-2"}
                  aria-label="Messages"
                >
                  <MessageSquare className="size-5" />
                  {showMessageBadge && (
                    <span className="absolute right-1 top-1 flex size-2.5 items-center justify-center rounded-full bg-orange-500" />
                  )}
                </Button>
              </AppTooltip>
              <DropdownMenu
                open={desktopAccountMenuOpen}
                onOpenChange={setDesktopAccountMenuOpen}
              >
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
                  <DropdownMenuItem className="gap-2 py-2 px-3 hover:bg-accent" onClick={openAccountInfo}>
                    <CircleUserRound className="h-5 w-5" />
                    Account Info
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 py-2 px-3 hover:bg-accent" onClick={openNotificationPreferences}>
                    <Bell className="h-5 w-5" />
                    Preferences
                  </DropdownMenuItem>
                  {userIsAdmin && (
                    <DropdownMenuItem className="gap-2 py-2 px-3 hover:bg-accent" onClick={openTechSupport}>
                      <Headset className="h-5 w-5" />
                      Tech Support
                    </DropdownMenuItem>
                  )}
                  {userIsAdmin && (
                    <DropdownMenuItem
                      className="gap-2 py-2 px-3 hover:bg-accent"
                      onClick={openToolsSettings}
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
                      setDesktopAccountMenuOpen(false);
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

            {/* Mobile header actions */}
            <div className="ml-auto flex shrink-0 items-center justify-end gap-0.5 lg:hidden">
              <AppTooltip
                label={
                  themeMode === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={handleToggleThemeMode}
                  className={navbarIconBtnClass(false)}
                  aria-label="Toggle theme"
                >
                  {themeMode === "dark" ? (
                    <Sun />
                  ) : (
                    <Moon />
                  )}
                </Button>
              </AppTooltip>
              <Button
                variant="ghost"
                size="icon-lg"
                className={navbarIconBtnClass(isOpenNavbar)}
                onClick={() => setIsOpenNavbar(true)}
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </div>

            {isOpenNavbar && (
              <>
                <div
                  className="fixed inset-0 z-[55] bg-foreground/30 lg:hidden"
                  aria-hidden
                  onClick={closeMobileSidebar}
                />
              <div className="fixed top-0 right-0 z-[60] flex h-full w-4/5 flex-col border-l border-border bg-card text-card-foreground shadow-lg transition-all sm:w-2/5">
                <div
                  style={{ minHeight: "var(--navbar-height, 56px)" }}
                  className={cn(
                    "flex items-center border-b border-border px-4",
                    isManagePortalView ? "justify-between" : "justify-end",
                  )}
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
                    className="rounded-md text-foreground hover:bg-accent"
                    onClick={closeMobileSidebar}
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
                                      ? "bg-accent text-secondary-foreground"
                                      : "bg-transparent text-foreground hover:bg-accent hover:text-secondary-foreground",
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
                                              ? "bg-accent text-secondary-foreground"
                                              : "text-foreground hover:bg-accent hover:text-secondary-foreground",
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
                      <div className="flex w-full flex-col items-start gap-2 px-5 py-4 flex-1 min-h-0 overflow-y-auto">
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
                          className={cn(
                            mobileSidebarItemClass(isMessageDrawerOpen),
                            "relative",
                          )}
                        >
                          <span className="relative inline-flex">
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            {showMessageBadge && (
                              <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-orange-500" />
                            )}
                          </span>
                          <span className="truncate">Messages</span>
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
                        {userIsAdmin && filterPageVisibility("reports") && (
                          <NavBarItem
                            title="Reports"
                            icon={FileSpreadsheet}
                            href={
                              params.portalid
                                ? `/${params.portalid}/reports`
                                : "/reports"
                            }
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
                        <div className="w-full [&_button]:h-10 [&_button]:w-full [&_button]:justify-start [&_button]:rounded-md [&_button]:border [&_button]:border-border [&_button]:bg-muted/50 [&_button]:px-3 [&_button]:text-foreground [&_button]:hover:bg-accent [&_button]:hover:text-secondary-foreground">
                          <PluginRenderer config={config} pluginKeys={['box_ai']} />
                        </div>
                        <div className="relative w-full">
                          <NotificationNavButton variant="mobile" />
                        </div>
                      </div>
                      <div className="flex items-center justify-start space-x-2 w-full mt-auto border-t border-border">
                        <div ref={dropdownRef} className="w-full">
                          {mobileAccountMenuOpen && (
                            <div className="w-full p-5 flex flex-col gap-2">
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 px-4 py-2 text-sm text-foreground"
                                onClick={openAccountInfo}
                              >
                                <CircleUserRound className="h-4 w-4" />
                                Account Info
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 px-4 py-2 text-sm text-foreground"
                                onClick={openNotificationPreferences}
                              >
                                <Bell className="h-4 w-4" />
                                Preferences
                              </Button>
                              {userIsAdmin && (
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start gap-3 px-4 py-2 text-sm text-foreground"
                                  onClick={openTechSupport}
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
                                    setMobileAccountMenuOpen(false);
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
                                onClick={() => {
                                  setDesktopAccountMenuOpen(false);
                                  closeMobileSidebar();
                                  handleLogout();
                                }}
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
                            onClick={() => setMobileAccountMenuOpen((prev) => !prev)}
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
              </>
            )}
          </nav>
        </div>
      </header>

      <div
        aria-hidden="true"
        className="w-full shrink-0"
        style={{
          height: navbarHeight
            ? `${navbarHeight}px`
            : "var(--navbar-height, 64px)",
        }}
      />

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
            className="fixed inset-0 z-[60] bg-foreground/30"
            aria-hidden
            onClick={() => setIsMessageDrawerOpen(false)}
          />
          <aside
            className="fixed top-0 right-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-border bg-card text-card-foreground shadow-xl"
            aria-label="Message sidebar"
          >
            <div
              className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4"
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
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
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
    </>

  );
}

export default Navbar;
