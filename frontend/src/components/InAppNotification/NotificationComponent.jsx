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
import { decryptMessage } from "@/app/lib/crypto";
import { cn } from "@/app/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-background">
      <div className="mt-5 px-10">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back</span>
        </Button>
      </div>
      <div className="mx-auto max-w-4xl p-6">
        <Card className="mb-6 rounded-2xl p-6">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="h-8 w-8 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Notifications
                </h1>
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread notifications
                </p>
              </div>
            </div>
            <div className="flex w-full max-w-sm flex-row items-stretch gap-2 sm:w-auto sm:items-center">
              <Button
                variant="secondary"
                size="icon"
                className="group"
                onClick={() => getNotifications()}
                title="Refresh"
                aria-label="Refresh"
              >
                <RotateCw className="h-5 w-5 transition-transform duration-300 ease-in-out group-hover:rotate-[360deg]" />
              </Button>

              {unreadCount > 0 && (
                <Button
                  className="w-full sm:w-auto"
                  disabled={isMarkingAllRead}
                  onClick={markAllAsRead}
                >
                  {isMarkingAllRead ? (
                    <LoaderSpinner size={16} className="text-current" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={isClearing}
                  onClick={clearAllNotifications}
                >
                  {isClearing ? (
                    <LoaderSpinner size={16} className="text-current" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Clear all</span>
                </Button>
              )}
            </div>
          </header>
          <div className="flex items-center space-x-1 rounded-2xl bg-muted p-1">
            {["all", "unread", "read"].map((filterType) => {
              const isActive = filter === filterType;

              return (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={cn(
                    "flex items-center space-x-2 rounded-xl px-4 py-1.5 text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "bg-card text-muted-foreground shadow"
                      : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                  )}
                >
                  <span className="capitalize">{filterType}</span>

                  {filterType === "all" && (
                    <Badge variant="secondary" className="min-w-[20px] justify-center rounded-lg">
                      {notifications.length}
                    </Badge>
                  )}
                  {filterType === "unread" && unreadCount > 0 && (
                    <Badge className="min-w-[20px] justify-center bg-[var(--primary-solid)] text-primary-foreground">
                      {unreadCount}
                    </Badge>
                  )}
                  {filterType === "read" && readCount > 0 && (
                    <Badge className="min-w-[20px] justify-center bg-success text-success-foreground">
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
              <Card className="rounded-2xl p-12 text-center">
                <Bell className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  No notifications found
                </h3>
                <p className="text-muted-foreground">
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
                      ? "border-primary-solid bg-accent"
                      : "border-border"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-start space-x-4">
                        <div className="relative">
                          <Avatar size="lg">
                            {notification?.referenceData?.author?.profileUrl ||
                            notification?.referenceData?.sender?.profileUrl ||
                            notification?.user?.profileUrl ? (
                              <AvatarImage
                                src={
                                  notification?.referenceData?.author
                                    ?.profileUrl ||
                                  notification?.referenceData?.sender
                                    ?.profileUrl ||
                                  notification?.user?.profileUrl
                                }
                                alt="Profile Picture"
                              />
                            ) : null}
                            <AvatarFallback className="bg-foreground font-semibold text-background">
                              {getInitials(
                                `${notification?.user?.firstName || ""} ${notification?.user?.lastName || ""}`.trim()
                              )}
                            </AvatarFallback>
                          </Avatar>

                          {/* Type Icon Badge */}
                          <div className="absolute -bottom-0.5 -right-1">
                            {getNotificationTypeIcon(notification.type)}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center space-x-2">
                            <h3 className="line-clamp-2 font-semibold text-foreground">
                              {notification?.title}
                            </h3>
                            {notification?.status === "unread" && (
                              <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--primary-solid)] p-1"></div>
                            )}
                          </div>

                          <p className="mb-2 line-clamp-2 text-sm text-foreground">
                            {notification?.type === "message" ? decryptMessage(notification?.body) : notification?.body}
                          </p>

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTimeAgo(notification?.createdAt)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex items-center space-x-2">
                        {notification?.status === "unread" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-primary-solid"
                            onClick={() => markAsRead(notification)}
                            title="Mark as read"
                          >
                            {isMarkRead === notification.id ? (
                              <LoaderSpinner
                                size={12}
                                className="text-secondary-foreground"
                                wrapperClassName="flex h-4 w-4 shrink-0 items-center justify-center"
                                aria-hidden
                              />
                            ) : (
                              <CheckCheck className="h-4 w-4 shrink-0" />
                            )}
                          </Button>
                        )}
                        {notification.url && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-primary-solid"
                            onClick={(e) =>
                              handleNavigateToUrl(
                                e,
                                notification.url,
                                notification,
                              )
                            }
                            title="Open link"
                          >
                            <ExternalLink className="h-4 w-4 shrink-0" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => removeNotification(notification)}
                          title="Remove notification"
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
