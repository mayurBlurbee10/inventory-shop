import { decryptMessage } from "@/app/lib/crypto";

const getDisplayText = (text) => {
  if (!text) return "";
  try {
    const decrypted = decryptMessage(text);
    return decrypted || text;
  } catch {
    return text;
  }
};

export const getNotificationPreview = (notification) => {
  const type = notification?.type?.toLowerCase();

  if (type === "message") {
    const refText = notification?.referenceData?.text?.trim();
    if (refText) {
      return getDisplayText(refText);
    }

    const body = notification?.body?.trim() || "";
    if (body && body !== "You have a new message") {
      return getDisplayText(body);
    }

    return "";
  }

  if (type === "task") {
    return (
      notification?.referenceData?.title?.trim() ||
      notification?.body?.trim() ||
      ""
    );
  }

  return notification?.body || "";
};

/** @deprecated use getNotificationPreview */
export const getNotificationMessagePreview = getNotificationPreview;
