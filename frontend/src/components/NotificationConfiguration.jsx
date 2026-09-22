import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeSwitch } from "@/components/ui/theme-switch";

const NotificationConfiguration = ({
  isOpen,
  onClose,
  config,
  user,
}) => {
  const [preferences, setPreferences] = useState({});
  const [availableTypes, setAvailableTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotificationPreferences();
    }
  }, [isOpen]);

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);

      const response = await fetchWrapper(
        "/api/users/notification-preferences",
        {},
        "fetch-notification-prefs",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notification preferences");
      }

      const data = await response.json();

      setPreferences(data.preferences || {});
      setAvailableTypes(data.availableTypes || []);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = async (
    key,
    currentValue,
  ) => {
    try {
      setUpdating(key);

      const newValue = !currentValue;

      const response = await fetchWrapper(
        "/api/users/notification-preferences",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferences: {
              [key]: newValue,
            },
          }),
        },
        "update-notification-prefs",
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update notification preferences",
        );
      }

      const data = await response.json();

      setPreferences(data.preferences || {});

      toast.success(
        `${key.replace(/_/g, " ")} ${
          newValue ? "enabled" : "disabled"
        }`,
      );
    } catch (error) {
      console.error(
        "Error updating notification preferences:",
        error,
      );
      toast.error("Failed to update notification settings");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !updating) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-[95vw] flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <DialogTitle className="text-xl font-bold text-foreground sm:text-2xl">
            Preferences
          </DialogTitle>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={!!updating}
            aria-label="Close"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-lg font-semibold text-foreground">
              Notification Settings
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoaderSpinner size={32} className="text-secondary-foreground" />
            </div>
          ) : availableTypes.length > 0 ? (
            <>
              <div className="space-y-4">
                {availableTypes.map((notifType) => {
                  const isEnabled = preferences[notifType.key] !== false;

                  return (
                    <div
                      key={notifType.key}
                      className="flex flex-col justify-between gap-4 rounded-lg border border-border p-4 transition-all hover:border-foreground/20 hover:bg-muted/50 sm:flex-row sm:items-center"
                    >
                      {/* Notification Details */}
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 break-words text-sm font-semibold text-foreground sm:text-base">
                          {notifType.label}
                        </h3>

                        <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">
                          {notifType.description}
                        </p>

                        {notifType.category && (
                          <Badge
                            variant="secondary"
                            className="mt-2 line-clamp-1 break-words bg-accent text-secondary-foreground"
                          >
                            {notifType.category}
                          </Badge>
                        )}
                      </div>

                      {/* Toggle */}
                      <div className="flex justify-end sm:justify-center">
                        {updating === notifType.key ? (
                          <LoaderSpinner
                            size={24}
                            className="text-muted-foreground"
                          />
                        ) : (
                          <ThemeSwitch
                            checked={isEnabled}
                            disabled={!!updating}
                            onCheckedChange={() =>
                              handleToggleNotification(
                                notifType.key,
                                isEnabled,
                              )
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="mt-6">
                <p className="border-l-4 border-warning bg-warning/10 p-3 text-sm text-foreground">
                  <strong>Tip:</strong> You can manage these settings at any
                  time. We respect your preferences and will only send you
                  notifications that you have enabled.
                </p>
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">
                No notification settings available at this time.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end rounded-b-xl border-t border-border bg-card p-4 sm:p-6">
          <Button type="button" variant="outline" className="px-3 py-3" onClick={onClose} disabled={!!updating}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationConfiguration;
