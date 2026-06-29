"use client";
import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Clock,
  Heart,
  MessageCircleMore,
  MessageSquareMore,
  ExternalLink,
  Info,
  RotateCw,
  Globe,
  Gem,
  ChevronLeft,
  CheckSquare,
} from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Image from "next/image";
import { useSelector } from "react-redux";
import { formatTimeAgo } from "@/utils/helper";
import { useRouter } from "next/navigation";
import Button from "../Common/Elements/Button";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { decryptMessage } from "@/app/lib/crypto";

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  console.log("notifications", notifications);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isMarkRead, setIsMarkRead] = useState(null);
  const [isRemoving, setIsRemoving] = useState(null);
  const [isClearing, setIsClearing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const readCount = notifications.filter((n) => n.status === "read").length;
  const router = useRouter();

  const { data: config } = useSelector((state) => state.portal);

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

  const handleNavigateToUrl = (e, url, state) => {
    e.stopPropagation();
    if (url) {
      localStorage.setItem("navigationState", JSON.stringify(state));
      const basePath = url.split("?")[0];
      window.open(basePath, "_self");
    }
  };

  const getNotifications = async (limit = 50, offset = 0) => {
    try {
      setIsNotificationLoading(true);
      setError(null);
      const res = await fetchWrapper(
        `/api/in-app-notification?limit=${limit}&offset=${offset}`,
        {},
        "get-notifications",
      );

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await res.json();
      if (data && data.data) {
        setNotifications(data.data);
      }
      return data;
    } catch (error) {
      setError(error?.message || "Failed to load notifications");
      // toast.error(error?.message || "Failed to load notifications");
      return null;
    } finally {
      setIsNotificationLoading(false);
    }
  };

  useEffect(() => {
    getNotifications();
  }, []);

  const markAsRead = async (notification) => {
    setIsMarkRead(notification.id);
    try {
      const res = await fetchWrapper(
        `/api/in-app-notification/${notification.id}/read`,
        {
          method: "PUT",
        },
        "mark-notification-read",
      );

      if (!res.ok) {
        throw new Error("Failed to mark notification as read");
      }
      setNotifications(
        notifications.map((n) =>
          n.id === notification.id ? { ...n, status: "read" } : n,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setIsMarkRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsMarkingAllRead(true);
      const originalNotifications = [...notifications];
      const res = await fetchWrapper(
        `/api/in-app-notification/mark-all-read`,
        {
          method: "PUT",
        },
        "mark-all-notifications-read",
      );

      if (!res.ok) {
        setNotifications(originalNotifications);
        throw new Error("Failed to mark all notifications as read");
      }
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: "read",
          readAt: new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const removeNotification = async (notification) => {
    try {
      setIsRemoving(notification?.id);
      const originalNotifications = [...notifications];
      const res = await fetchWrapper(
        `/api/in-app-notification/${notification?.id}`,
        {
          method: "DELETE",
        },
        "delete-notification",
      );

      if (!res.ok) {
        setNotifications(originalNotifications);
        throw new Error("Failed to delete notification");
      }
      setNotifications((prev) => prev.filter((n) => n.id !== notification?.id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      setIsClearing(true);
      const originalNotifications = [...notifications];
      const res = await fetchWrapper(
        `/api/in-app-notification`,
        {
          method: "DELETE",
        },
        "delete-notification",
      );

      if (!res.ok) {
        setNotifications(originalNotifications);
        throw new Error("Failed to delete notification");
      }
      setNotifications([]);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const words = name.split(" ");
    return words.length === 1
      ? words[0].charAt(0).toUpperCase()
      : (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return n.status === "unread";
    if (filter === "read") return n.status === "read";
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="px-10 mt-5">
        <button
          className="flex items-center justify-center gap-2 text-gray-800"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="w-8 h-8 text-gray-800" />
                {unreadCount > 0 && (
                  <span className="absolute -top-3 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Notifications
                </h1>
                <p className="text-sm text-gray-800">
                  {unreadCount} unread notifications
                </p>
              </div>
            </div>
            <div className="flex flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto max-w-sm">
              <div
                className="relative p-2 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer group"
                onClick={() => getNotifications()}
              >
                <RotateCw className="w-5 h-5 text-gray-600 transition-transform duration-300 ease-in-out group-hover:rotate-[360deg]" />
                {/* Tooltip */}
                <span className="absolute -left-1/3 -translate-y-1/2 top-0 -mt-4 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Refresh
                </span>
              </div>

              {unreadCount > 0 && (
                <Button
                  className="w-full sm:w-auto"
                  type="Primary"
                  label={
                    <span className="hidden sm:inline">Mark all read</span>
                  }
                  icon={CheckCheck}
                  isLoading={isMarkingAllRead}
                  onClick={markAllAsRead}
                />
              )}
              {notifications.length > 0 && (
                <Button
                  className="w-full sm:w-auto"
                  type="Delete"
                  label={<span className="hidden sm:inline">Clear all</span>}
                  icon={Trash2}
                  isLoading={isClearing}
                  onClick={clearAllNotifications}
                />
              )}
            </div>
          </header>
          <div className="flex items-center space-x-1 bg-gray-100/50 p-1 rounded-2xl">
            {["all", "unread", "read"].map((filterType) => {
              const isActive = filter === filterType;
              const baseClasses =
                "px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2";
              const activeClasses =
                "bg-white text-blue-700 shadow-lg transform";
              const inactiveClasses =
                "text-gray-600 hover:bg-white/50 hover:text-gray-800 hover:shadow-md";

              return (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`${baseClasses} ${
                    isActive ? activeClasses : inactiveClasses
                  }`}
                >
                  <span className="capitalize">{filterType}</span>

                  {filterType === "all" && (
                    <span className="bg-gray-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {notifications.length}
                    </span>
                  )}
                  {filterType === "unread" && unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {unreadCount}
                    </span>
                  )}
                  {filterType === "read" && readCount > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {readCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}

        {isNotificationLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderSpinner size={32} className="text-gray-800" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <Bell className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-800">
                  {filter === "unread"
                    ? "All caught up! No unread notifications."
                    : filter === "read"
                      ? "No read notifications found."
                      : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification?.id}
                  className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md`}
                  style={{
                    backgroundColor:
                      notification?.status === "unread"
                        ? `${config.primaryColor}10`
                        : "",
                    borderColor:
                      notification?.status === "unread"
                        ? config?.primaryColor
                        : "#EEEEEE",
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="relative w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {notification?.referenceData?.author?.profileUrl ||
                          notification?.referenceData?.sender?.profileUrl ||
                          notification?.user?.profileUrl ? (
                            <Image
                              src={
                                notification?.referenceData?.author
                                  ?.profileUrl ||
                                notification?.referenceData?.sender
                                  ?.profileUrl ||
                                notification?.user?.profileUrl
                              }
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
                                {getInitials(`${notification?.user?.firstName || ""} ${notification?.user?.lastName || ""}`.trim())}
                              </span>
                            </div>
                          )}

                          {/* Type Icon Badge */}
                          <div className="absolute -bottom-0.5 -right-1">
                            {getNotificationTypeIcon(notification.type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3
                              className={`font-semibold line-clamp-2 ${
                                notification?.status === "unread"
                                  ? "text-gray-800"
                                  : "text-gray-800"
                              }`}
                            >
                              {notification?.title}
                            </h3>
                            {notification?.status === "unread" && (
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse p-1"></div>
                            )}
                          </div>

                          <p className="text-gray-800 text-sm mb-2 line-clamp-2">
                            {notification?.type === "message" ? decryptMessage(notification?.body) : notification?.body}
                          </p>

                          <div className="flex items-center space-x-4 text-xs text-gray-800">
                            {/* <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>
                                {notification?.referenceData?.author?.name ||
                                  notification?.referenceData?.sender?.name ||
                                  notification?.user?.name}
                              </span>
                            </span> */}
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatTimeAgo(notification?.createdAt)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {notification?.status === "unread" && (
                          <button
                            onClick={() => markAsRead(notification)}
                            className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-200 bg-blue-100 rounded-lg transition-colors duration-200"
                            title="Mark as read"
                          >
                            {isMarkRead === notification.id ? (
                              <LoaderSpinner
                                size={12}
                                className="text-blue-600"
                                wrapperClassName="flex h-4 w-4 shrink-0 items-center justify-center"
                                aria-hidden
                              />
                            ) : notification.status === "unread" ? (
                              <CheckCheck className="h-4 w-4 shrink-0" />
                            ) : null}
                          </button>
                        )}
                        {notification.url && (
                          <button
                            onClick={(e) =>
                              handleNavigateToUrl(
                                e,
                                notification.url,
                                notification,
                              )
                            }
                            className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-200 bg-blue-100 rounded-lg transition-colors duration-200"
                            title="Open link"
                          >
                            <ExternalLink className="h-4 w-4 shrink-0" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification)}
                          className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-200 bg-red-100 rounded-lg transition-colors duration-200"
                          title="Remove notification"
                        >
                          {isRemoving === notification.id ? (
                            <LoaderSpinner
                              size={12}
                              className="text-red-500"
                              wrapperClassName="flex h-4 w-4 shrink-0 items-center justify-center"
                              aria-hidden
                            />
                          ) : (
                            <X className="h-4 w-4 shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationComponent;
