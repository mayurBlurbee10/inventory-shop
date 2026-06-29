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
} from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { formatTimeAgo } from "@/utils/helper";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { decryptMessage } from "@/app/lib/crypto";

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
    const iconClass = "w-2.5 h-2.5 text-white";

    switch (type?.toLowerCase()) {
      case "comment":
        return (
          <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-gray-800">
            <MessageCircleMore className={iconClass} strokeWidth={3} />
          </div>
        );
      case "message":
        return (
          <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-gray-800">
            <MessageSquareMore
              className={iconClass}
              fill="currentColor"
              strokeWidth={3}
            />
          </div>
        );
      case "connection":
        return (
          <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-gray-800">
            <Globe className={iconClass} strokeWidth={3} />
          </div>
        );
      case "endorsement":
        return (
          <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-gray-800">
            <Gem className={iconClass} strokeWidth={3} />
          </div>
        );
      case "task":
        return (
          <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-gray-800">
            <CheckSquare className={iconClass} strokeWidth={3} />
          </div>
        );
      case "like":
        return (
          <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-gray-800">
            <Heart className={iconClass} fill="currentColor" strokeWidth={3} />
          </div>
        );
      case "system":
      default:
        return (
          <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-gray-800">
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

  // Format notification data for display
  const formatNotification = (notification) => {
    const userName = getUserName(notification);
    const profileUrl = getProfileUrl(notification);
    const userInitials = getInitials(userName);

    return {
      id: notification.id,
      user: { name: userName, profileUrl: profileUrl },
      avatar: userInitials,
      action: notification.body || notification.title || "New notification",
      time: formatTimeAgo(notification.createdAt),
      title: notification.title || "",
      content: notification.type === "message" ? decryptMessage(notification.body) : notification.body || "",
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
      <div className="fixed left-4 right-4 top-20 max-h-[85vh] w-[calc(100%-2rem)] md:left-auto md:right-4 md:top-16 md:w-96 md:max-w-96 md:max-h-[80vh] bg-white rounded-lg shadow-xl border z-[9999] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between p-4 border-b bg-white rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
          <div className="flex items-center gap-3">
            {/* Toggle Switch for Only show unread */}
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <span>Only show unread</span>
              <button
                type="button"
                aria-pressed={showUnreadOnly}
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                  showUnreadOnly ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    showUnreadOnly ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* External link icon */}
            <button
              className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
              onClick={() => router.push(`/${params.portalid}/notifications`)}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>

            {/* Three dots menu */}
            <div className="relative">
              <button
                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
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
        <div className="flex-1 overflow-y-auto">
          {isNotificationLoading ? (
            <div className="p-8 text-center flex justify-center items-center h-36">
              <LoaderSpinner size={32} className="text-gray-800" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="h-8 w-8 mx-auto mb-2 text-red-500">
                <CircleAlert className="h-full w-full" />
              </div>
              <p className="text-red-500 mb-2">Failed to load notifications</p>
              <button
                onClick={() => getNotifications()}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Try again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
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
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !formattedNotification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with Type Badge */}
                    <div className="relative w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {formattedNotification?.user?.profileUrl ? (
                        <Image
                          src={formattedNotification?.user?.profileUrl}
                          alt="Profile Picture"
                          width={40}
                          height={40}
                          quality={90}
                          priority
                          sizes="40px"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 to-gray-900 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {formattedNotification?.avatar}
                          </span>
                        </div>
                      )}

                      {/* Type Icon Badge */}
                      <div className="absolute -bottom-0.5 -right-1">
                        {getNotificationTypeIcon(formattedNotification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {formattedNotification.title && (
                            <div className="text-sm font-semibold text-gray-800 mb-1">
                              {formattedNotification.title}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2 mt-1">
                          <span className="text-gray-800 text-xs whitespace-nowrap">
                            {formattedNotification.time}
                          </span>
                        </div>
                      </div>

                      {formattedNotification.content && (
                        <div className="text-sm text-gray-800 mb-2">
                          {formattedNotification.content}
                        </div>
                      )}
                    </div>

                    {/* Action Icons */}
                    <div className="flex flex-col items-center gap-1 my-auto">
                      {/* Navigation Icon - only show if URL exists */}
                      {formattedNotification.url && (
                        <button
                          onClick={(e) =>
                            handleNavigateToUrl(
                              e,
                              formattedNotification.url,
                              formattedNotification,
                            )
                          }
                          className="p-1.5 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}

                      {/* Unread Indicator - clickable to mark as read */}
                      {!formattedNotification.isRead && (
                        <button
                          onClick={(e) =>
                            handleUnreadDotClick(e, formattedNotification.id)
                          }
                          className="w-3 h-3 bg-gray-800 rounded-full hover:bg-gray-500 transition-colors"
                          title="Mark as read"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={() => {
              // Refresh notifications
              getNotifications();
            }}
            className="text-gray-800 hover:text-gray-500 text-sm font-medium transition-colors"
          >
            Refresh notifications
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default NotificationModal;
