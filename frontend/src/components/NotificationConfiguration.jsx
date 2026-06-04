import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import Button from "./Common/Elements/Button";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";

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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-2 sm:p-4">
      <div
        className="
          bg-white rounded-xl shadow-xl
          w-full
          max-w-[95vw]
          sm:max-w-xl
          md:max-w-2xl
          lg:max-w-3xl
          max-h-[90vh]
          flex flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Preferences
          </h2>

          <button
            onClick={onClose}
            disabled={!!updating}
            className="p-1 rounded-full text-gray-600 hover:bg-gray-100 transition-colors disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-gray-700 text-lg font-semibold">Notification Settings</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoaderSpinner
                size={32}
                className="text-blue-500"
              />
            </div>
          ) : availableTypes.length > 0 ? (
            <>
              <div className="space-y-4">
                {availableTypes.map((notifType) => {
                  const isEnabled =
                    preferences[notifType.key] !== false;

                  return (
                    <div
                      key={notifType.key}
                      className="
                        flex flex-col sm:flex-row
                        sm:items-center
                        justify-between
                        gap-4
                        p-4
                        rounded-lg
                        border border-gray-200
                        hover:border-gray-300
                        hover:bg-gray-50
                        transition-all
                      "
                    >
                      {/* Notification Details */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold text-sm sm:text-base break-words line-clamp-1 text-gray-800"
                        >
                          {notifType.label}
                        </h3>

                        <p className="text-sm text-gray-600 mt-1 break-words line-clamp-2">
                          {notifType.description}
                        </p>

                        {notifType.category && (
                          <span
                            className="inline-block mt-2 px-2 py-1 text-xs rounded-full break-words line-clamp-1 text-blue-500 bg-blue-100">
                            {notifType.category}
                          </span>
                        )}
                      </div>

                      {/* Toggle */}
                      <div className="flex justify-end sm:justify-center">
                        {updating === notifType.key ? (
                          <LoaderSpinner
                            size={24}
                            className="text-gray-500"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={!!updating}
                            onClick={() =>
                              handleToggleNotification(
                                notifType.key,
                                isEnabled,
                              )
                            }
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:cursor-not-allowed ${
                              isEnabled
                                ? "bg-blue-600"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                isEnabled
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div
                className="mt-6 rounded-lg p-3 sm:p-4"
              >
                <p className="text-sm text-gray-700 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <strong>Tip:</strong> You can manage these
                  settings at any time. We respect your
                  preferences and will only send you
                  notifications that you have enabled.
                </p>
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-gray-600">
                No notification settings available at this
                time.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 sm:p-6 rounded-b-xl flex justify-end">
            <Button
              onClick={onClose}
              type="Secondary"
              disabled={!!updating}
              label="Close"
            />
        </div>
      </div>
    </div>
  );
};

export default NotificationConfiguration;