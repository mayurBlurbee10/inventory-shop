import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Check,
  MoreHorizontal,
  ExternalLink,
  Heart,
  CheckSquare,
  Info,
  MessageSquareMore,
  MessageCircleMore,
  CircleAlert,
  Globe,
  Gem,
  RotateCw,
} from "lucide-react";import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams, useRouter } from "next/navigation";
import { formatTimeAgo } from "@/utils/helper";
import { toast } from "react-toastify";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { getNotificationMessagePreview } from "@/utils/notification";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { AppTooltip } from "@/components/ui/tooltip";
const NotificationModal = ({
  isOpen,
  onClose,
  config,
  notificationCount,
  setNotificationCount,
  notifications,
  setNotifications,
  isNotificationLoading,
  setIsNotificationLoading,
  getNotifications: getNotificationsProp,
  error,
  setError,
}) => {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const params = useParams();

  // Helper function to get initials
  const getInitials = (name) => {
    if (!name) return "U";
    const words = name.split(" ");
    return words.length === 1
      ? words[0].charAt(0).toUpperCase()
      : (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Get notification icon based on type
  const getNotificationTypeIcon = (type) => {
    const iconClass = "w-2.5 h-2.5 text-background";
    const badgeClass =
      "w-5 h-5 rounded-full flex items-center justify-center border-2 border-popover shadow-sm bg-foreground";

    switch (type?.toLowerCase()) {
      case "comment":
        return (
          <div className={badgeClass}>
            <MessageCircleMore className={iconClass} strokeWidth={3} />
          </div>
        );
      case "message":
        return (
          <div className={badgeClass}>
            <MessageSquareMore
              className={iconClass}
              fill="currentColor"
              strokeWidth={3}
            />
          </div>
        );
      case "connection":
        return (
          <div className={badgeClass}>
            <Globe className={iconClass} strokeWidth={3} />
          </div>
        );
      case "endorsement":
        return (
          <div className={badgeClass}>
            <Gem className={iconClass} strokeWidth={3} />
          </div>
        );
      case "task":
        return (
          <div className={badgeClass}>
            <CheckSquare className={iconClass} strokeWidth={3} />
          </div>
        );
      case "like":
        return (
          <div className={badgeClass}>
            <Heart className={iconClass} fill="currentColor" strokeWidth={3} />
          </div>
        );
      case "system":
      default:
        return (
          <div className={badgeClass}>
            <Info className={iconClass} strokeWidth={3} />
          </div>
        );
    }
  };

  // Get profile URL based on notification type
  const getProfileUrl = (notification) => {
    const referenceData = notification.referenceData || {};
    const type = notification.type?.toLowerCase();

    switch (type) {
      case "message":
        return referenceData?.sender?.profileUrl;
      case "comment":
        return referenceData?.author?.profileUrl;
      case "task":
        return (
          referenceData?.assignedBy?.profileUrl ||
          referenceData?.creator?.profileUrl
        );
      case "like":
        return (
          referenceData?.user?.profileUrl || referenceData?.liker?.profileUrl
        );
      case "system":
      default:
        // For system notifications, try to get from user or referenceData
        return notification.user?.profileUrl || referenceData?.user?.profileUrl;
    }
  };

  // Get user name based on notification type
  const getUserName = (notification) => {
    const referenceData = notification.referenceData || {};
    const type = notification.type?.toLowerCase();
    const fallbackUser = notification.user || {};

    switch (type) {
      case "message":
        return (
          referenceData?.sender?.FirstName ||
          referenceData?.sender?.email ||
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email
        );
      case "comment":
        return (
          referenceData?.author?.firstName ||
          referenceData?.author?.email ||
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email
        );
      case "task":
        return (
          referenceData?.assignedBy?.firstName ||
          referenceData?.creator?.firstName ||
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email
        );
      case "like":
        return (
          referenceData?.user?.firstName ||
          referenceData?.liker?.firstName ||
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email
        );
      case "system":
      default:
        return (
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email ||
          "System"
        );
    }
  };

  const getNotificationContent = (notification) =>
    getNotificationMessagePreview(notification);

  // Format notification data for display
  const formatNotification = (notification) => {
    const userName = getUserName(notification);
    const profileUrl = getProfileUrl(notification);
    const userInitials = getInitials(userName);

    return {
      id: notification.id,
      user: { name: userName, profileUrl: profileUrl },
      avatar: userInitials,
      content: getNotificationContent(notification),
      action:
        getNotificationContent(notification) ||
        notification.body ||
        notification.title ||
        "New notification",
      time: formatTimeAgo(notification.createdAt),
      title: notification.title || "",
      url: notification.url || "",
      isRead: notification.status === "read" || notification.status === "READ",
      type: notification.type || "SYSTEM",
      readAt: notification.readAt,
      portal: notification.portal,
      referenceData: notification.referenceData,
    };
  };

  // Get notifications: use parent's fetcher when provided so state stays in sync; otherwise fetch here
  const getNotifications = async (limit = 7, offset = 0) => {
    if (getNotificationsProp) {
      return getNotificationsProp(limit, offset);
    }
    try {
      setIsNotificationLoading?.(true);
      setError?.(null);
      const res = await fetchWrapper(
        `/api/in-app-notification?limit=${limit}&offset=${offset}`,
        {},
        "get-notifications",
      );

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await res.json();
      if (data?.data) {
        setNotifications?.(data.data);
      }
      return data;
    } catch (err) {
      setError?.(err?.message ?? "Failed to load notifications");
      return null;
    } finally {
      setIsNotificationLoading?.(false);
    }
  };

  // Load notifications when modal opens
  useEffect(() => {
    if (isOpen) {
      getNotifications();
    }
  }, [isOpen]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Update local state immediately for better UX
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                status: "read",
                readAt: new Date().toISOString(),
              }
            : notification,
        ),
      );

      // Make API call to mark as read (in-app notification API)
      const res = await fetchWrapper(
        `/api/in-app-notification/${notificationId}/read`,
        {
          method: "PUT",
        },
        "mark-notification-read",
      );

      if (!res.ok) {
        // Revert if API call fails
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  status:
                    notification.status?.toLowerCase() === "read"
                      ? "unread"
                      : notification.status,
                  readAt: null,
                }
              : notification,
          ),
        );
        throw new Error("Failed to mark notification as read");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to mark notification as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Store original state for potential revert
      const originalNotifications = [...notifications];

      // Update local state immediately
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: "read",
          readAt: new Date().toISOString(),
        })),
      );

      // Make API call to mark all as read (in-app notification API)
      const res = await fetchWrapper(
        `/api/in-app-notification/mark-all-read`,
        {
          method: "PUT",
        },
        "mark-all-notifications-read",
      );

      if (!res.ok) {
        // Revert if API call fails
        setNotifications(originalNotifications);
        throw new Error("Failed to mark all notifications as read");
      }

      setShowDropdown(false);
    } catch (error) {
      toast.error(error?.message || "Failed to mark all notifications as read");
    }
  };

  // Filter notifications based on read/unread toggle
  const filteredNotifications = showUnreadOnly
    ? notifications.filter((n) => n.status?.toLowerCase() !== "read")
    : notifications;

  // Handle navigation to URL
  const handleNavigateToUrl = (e, url, state) => {
    e.stopPropagation();
    if (url) {
      localStorage.setItem("navigationState", JSON.stringify(state));
      const basePath = url;
      window.open(basePath, "_self");
    }
  };

  // Handle unread dot click
  const handleUnreadDotClick = async (e, notificationId) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    console.log("Notification clicked:", notification.id);
  };

  useEffect(() => {
    const unreadCount =
      notifications.filter((n) => n.status?.toLowerCase() !== "read").length >
      0;
    setNotificationCount(unreadCount);
  }, [notifications, setNotificationCount]);
  if (!isOpen) return null;

  // Use createPortal so modal renders at body level - works when opened from mobile sidebar (parent no longer hidden)
  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      {/* Modal - full-width centered on mobile, top-right on desktop */}
      <div className="fixed left-4 right-4 top-20 z-[9999] flex max-h-[85vh] w-[calc(100%-2rem)] flex-col rounded-lg border border-border bg-popover text-popover-foreground shadow-xl md:left-auto md:right-4 md:top-16 md:max-h-[80vh] md:w-96 md:max-w-96">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-b border-border p-4">
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <div className="flex items-center gap-3">
            {/* Toggle Switch for Only show unread */}
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span>Only show unread</span>
              <ThemeSwitch
                checked={showUnreadOnly}
                onCheckedChange={setShowUnreadOnly}
              />
            </div>

            {/* Refresh + open notifications page */}
            <div className="flex items-center gap-1">
              <AppTooltip label="Refresh">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={() => getNotifications()}
                  disabled={isNotificationLoading}
                  aria-label="Refresh"
                >
                  <RotateCw
                    className={cn(
                      "h-4 w-4",
                      isNotificationLoading && "animate-spin",
                    )}
                  />
                </Button>
              </AppTooltip>
              <AppTooltip label="Open notifications page">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={() => router.push(`/${params.portalid}/notifications`)}
                  aria-label="Open notifications page"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </AppTooltip>
            </div>

            {/* Three dots menu (inline dropdown to stay above the portal modal) */}
            <div className="relative">
              <AppTooltip label="More options">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </AppTooltip>              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg">
                  <button
                    onClick={markAllAsRead}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Check className="h-4 w-4" />
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1">
          {isNotificationLoading ? (
            <div className="flex h-36 items-center justify-center p-8 text-center">
              <LoaderSpinner size={32} className="text-secondary-foreground" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-2 h-8 w-8 text-destructive">
                <CircleAlert className="h-full w-full" />
              </div>
              <p className="mb-2 text-destructive">Failed to load notifications</p>
              <Button
                variant="link"
                size="sm"
                className="text-primary-solid"
                onClick={() => getNotifications()}
              >
                Try again
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p>
                {showUnreadOnly
                  ? "No unread notifications"
                  : "No notifications to show"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const formattedNotification = formatNotification(notification);
              return (
                <div
                  key={formattedNotification.id}
                  className={cn(
                    "cursor-pointer border-b border-border p-3 transition-colors hover:bg-muted/50",
                    !formattedNotification.isRead && "bg-accent"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with Type Badge */}
                    <div className="relative">
                      <Avatar size="lg">
                        {formattedNotification?.user?.profileUrl ? (
                          <AvatarImage
                            src={formattedNotification?.user?.profileUrl}
                            alt="Profile Picture"
                          />
                        ) : null}
                        <AvatarFallback className="bg-foreground font-semibold text-background">
                          {formattedNotification?.avatar}
                        </AvatarFallback>
                      </Avatar>

                      {/* Type Icon Badge */}
                      <div className="absolute -bottom-0.5 -right-1">
                        {getNotificationTypeIcon(formattedNotification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {formattedNotification.title && (
                            <div className="mb-1 text-sm font-semibold text-foreground">
                              {formattedNotification.title}
                            </div>
                          )}
                        </div>
                        <div className="ml-2 mt-1 flex items-center gap-2">
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {formattedNotification.time}
                          </span>
                        </div>
                      </div>

                      {formattedNotification.content && (
                        <div className="mb-2 text-sm text-foreground">
                          {formattedNotification.content}
                        </div>
                      )}
                    </div>

                    {/* Action Icons */}
                    <div className="my-auto flex flex-col items-center gap-1">
                      {/* Navigation Icon - only show if URL exists */}
                      {formattedNotification.url && (
                        <AppTooltip label="Open link">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-primary-solid"
                            onClick={(e) =>
                              handleNavigateToUrl(
                                e,
                                formattedNotification.url,
                                formattedNotification,
                              )
                            }
                            aria-label="Open link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </AppTooltip>
                      )}

                      {!formattedNotification.isRead && (
                        <AppTooltip label="Mark as read">
                          <button
                            type="button"
                            onClick={(e) =>
                              handleUnreadDotClick(e, formattedNotification.id)
                            }
                            className="h-3 w-3 rounded-full bg-primary-solid transition-opacity hover:opacity-70"
                            aria-label="Mark as read"
                          />
                        </AppTooltip>
                      )}                    </div>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </div>    </>,
    document.body,
  );
};

export default NotificationModal;
