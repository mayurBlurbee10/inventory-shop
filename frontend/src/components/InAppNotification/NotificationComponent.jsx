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
import { formatTimeAgo } from "@/utils/helper";
import { useRouter } from "next/navigation";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { getNotificationMessagePreview } from "@/utils/notification";
import { cn } from "@/app/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
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

  const getNotificationTypeIcon = (type) => {
    const iconClass = "w-2.5 h-2.5 text-background";
    const badgeClass =
      "w-5 h-5 rounded-full flex items-center justify-center border-2 border-card shadow-sm bg-foreground";

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

  const getProfileUrl = (notification) => {
    if (!notification) return null;
    const referenceData = notification.referenceData || {};
    const type = notification.type?.toLowerCase();

    switch (type) {
      case "message":
        return referenceData?.sender?.profileUrl || notification.user?.profileUrl;
      case "comment":
        return referenceData?.author?.profileUrl || notification.user?.profileUrl;
      case "task":
        return (
          referenceData?.assignedBy?.profileUrl ||
          referenceData?.creator?.profileUrl ||
          notification.user?.profileUrl
        );
      case "like":
        return (
          referenceData?.user?.profileUrl ||
          referenceData?.liker?.profileUrl ||
          notification.user?.profileUrl
        );
      case "system":
      default:
        return (
          notification.user?.profileUrl ||
          referenceData?.user?.profileUrl ||
          referenceData?.author?.profileUrl ||
          referenceData?.sender?.profileUrl
        );
    }
  };

  const getUserName = (notification) => {
    if (!notification) return "";
    const referenceData = notification.referenceData || {};
    const type = notification.type?.toLowerCase();
    const fallbackUser = notification.user || {};

    switch (type) {
      case "message":
        return (
          referenceData?.sender?.firstName ||
          referenceData?.sender?.FirstName ||
          referenceData?.sender?.email ||
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email ||
          ""
        );
      case "comment":
        return (
          referenceData?.author?.firstName ||
          referenceData?.author?.email ||
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email ||
          ""
        );
      case "task":
        return (
          referenceData?.assignedBy?.firstName ||
          referenceData?.creator?.firstName ||
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email ||
          ""
        );
      case "like":
        return (
          referenceData?.user?.firstName ||
          referenceData?.liker?.firstName ||
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email ||
          ""
        );
      case "system":
      default:
        return (
          `${fallbackUser.firstName || ""} ${fallbackUser.lastName || ""}`.trim() ||
          fallbackUser.email ||
          ""
        );
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
    <div className="min-h-screen bg-background pb-8">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-foreground hover:bg-accent"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Back</span>
          </Button>
        </div>

        <Card className="mb-6 rounded-2xl p-4 sm:p-6">
          <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative shrink-0">
                <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Notifications
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <AppTooltip label="Refresh">
                <Button
                  variant="outline"
                  size="sm"
                  className="group h-9 px-3 gap-1.5"
                  onClick={() => getNotifications()}
                  aria-label="Refresh"
                >
                  <RotateCw
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 ease-in-out group-hover:rotate-[360deg]",
                      isNotificationLoading && "animate-spin"
                    )}
                  />
                  <span className="text-xs sm:text-sm">Refresh</span>
                </Button>
              </AppTooltip>

              {unreadCount > 0 && (
                <Button
                  size="sm"
                  className="h-9 px-3 gap-1.5"
                  disabled={isMarkingAllRead}
                  onClick={markAllAsRead}
                >
                  {isMarkingAllRead ? (
                    <LoaderSpinner size={14} className="text-current" />
                  ) : (
                    <CheckCheck className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">Mark all read</span>
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9 px-3 gap-1.5"
                  disabled={isClearing}
                  onClick={clearAllNotifications}
                >
                  {isClearing ? (
                    <LoaderSpinner size={14} className="text-current" />
                  ) : (
                    <Trash2 className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">Clear all</span>
                </Button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 sm:flex sm:w-auto sm:space-x-1">
            {["all", "unread", "read"].map((filterType) => {
              const isActive = filter === filterType;

              return (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={cn(
                    "flex items-center justify-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm transition-all duration-300",
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                  )}
                >
                  <span className="capitalize">{filterType}</span>

                  {filterType === "all" && (
                    <Badge variant="secondary" className="min-w-[18px] h-4 sm:h-5 px-1 justify-center rounded-full text-[10px] sm:text-xs">
                      {notifications.length}
                    </Badge>
                  )}
                  {filterType === "unread" && unreadCount > 0 && (
                    <Badge className="min-w-[18px] h-4 sm:h-5 px-1 justify-center rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                  {filterType === "read" && readCount > 0 && (
                    <Badge className="min-w-[18px] h-4 sm:h-5 px-1 justify-center rounded-full bg-success text-success-foreground text-[10px] sm:text-xs">
                      {readCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Notifications List */}

        {isNotificationLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderSpinner size={32} className="text-secondary-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card className="rounded-2xl p-8 sm:p-12 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                <h3 className="mb-2 text-base sm:text-lg font-semibold text-foreground">
                  No notifications found
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {filter === "unread"
                    ? "All caught up! No unread notifications."
                    : filter === "read"
                      ? "No read notifications found."
                      : "You don't have any notifications yet."}
                </p>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification?.id}
                  className={cn(
                    "rounded-2xl transition-all duration-200 hover:shadow-md",
                    notification?.status === "unread"
                      ? "border-primary/50 bg-accent/40"
                      : "border-border"
                  )}
                >
                  <CardContent className="p-3.5 sm:p-5">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex flex-1 items-start gap-2.5 sm:gap-4 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar size="default" className="sm:size-10">
                            {getProfileUrl(notification) ? (
                              <AvatarImage
                                src={getProfileUrl(notification)}
                                alt="Profile Picture"
                              />
                            ) : null}
                            <AvatarFallback className="bg-foreground font-semibold text-background text-xs sm:text-sm">
                              {getInitials(getUserName(notification))}
                            </AvatarFallback>
                          </Avatar>

                          {/* Type Icon Badge */}
                          <div className="absolute -bottom-0.5 -right-1">
                            {getNotificationTypeIcon(notification.type)}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-1.5 flex-wrap">
                            <h3 className="line-clamp-2 text-sm sm:text-base font-semibold text-foreground break-words">
                              {notification?.title || "Notification"}
                            </h3>
                            {notification?.status === "unread" && (
                              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary"></span>
                            )}
                          </div>

                          <p className="mb-2 line-clamp-2 text-xs sm:text-sm text-muted-foreground break-words">
                            {getNotificationMessagePreview(notification)}
                          </p>

                          <div className="flex items-center gap-4 text-[11px] sm:text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>
                                {formatTimeAgo(notification?.createdAt)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 self-start">
                        {notification?.status === "unread" && (
                          <AppTooltip label="Mark as read">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              aria-label="Mark as read"
                              onClick={() => markAsRead(notification)}
                            >
                              {isMarkRead === notification.id ? (
                                <LoaderSpinner
                                  size={12}
                                  className="text-foreground"
                                  wrapperClassName="flex h-4 w-4 shrink-0 items-center justify-center"
                                  aria-hidden
                                />
                              ) : (
                                <CheckCheck className="h-4 w-4 shrink-0" />
                              )}
                            </Button>
                          </AppTooltip>
                        )}
                        {notification.url && (
                          <AppTooltip label="Open link">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              aria-label="Open link"
                              onClick={(e) =>
                                handleNavigateToUrl(
                                  e,
                                  notification.url,
                                  notification,
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4 shrink-0" />
                            </Button>
                          </AppTooltip>
                        )}
                        <AppTooltip label="Remove notification">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label="Remove notification"
                            onClick={() => removeNotification(notification)}
                          >
                            {isRemoving === notification.id ? (
                              <LoaderSpinner
                                size={12}
                                className="text-destructive"
                                wrapperClassName="flex h-4 w-4 shrink-0 items-center justify-center"
                                aria-hidden
                              />
                            ) : (
                              <X className="h-4 w-4 shrink-0" />
                            )}
                          </Button>
                        </AppTooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationComponent;
