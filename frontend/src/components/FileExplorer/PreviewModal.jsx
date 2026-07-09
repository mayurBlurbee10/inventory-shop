"use client";
import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getStoredMode } from "@/app/lib/theme-manager";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Add CSS to hide Box logo and sync preview chrome with app theme
const hideBoxLogo = `
  .bp-default-logo {
    display: none !important;
  }
  .bp-custom-logo{
    display: none !important;}
  .bp-header {
    background: hsl(var(--background)) !important;
    border-bottom: 1px solid hsl(var(--border)) !important;
    color: hsl(var(--foreground)) !important;
  }
  .bp-header button,
  .bp-header a,
  .bp-header .bp-btn,
  .bp-toolbar,
  .bp-toolbar button,
  .bp-toolbar svg,
  .bp-header svg {
    color: hsl(var(--foreground)) !important;
    fill: hsl(var(--foreground)) !important;
  }
  .bp-preview,
  .bp-container,
  .bp-content,
  .bp-image,
  .preview-container {
    background: hsl(var(--background)) !important;
  }
  .bp-header-file-info,
  .bp-file-name,
  .bp-doc-filename,
  .bp-header .bp-title,
  .bp-header-title {
    max-width: 100% !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    color: hsl(var(--foreground)) !important;
  }
`;

const hideInlineHeader = `
  .inline-preview .bp-header,
  .inline-preview .bp-header-container,
  .inline-preview .bp-toolbar,
  .inline-preview .bp-toolbar-container {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
  }
  .inline-preview .bp-content {
    top: 0 !important;
  }
`;

export default function PreviewModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  variant = "modal",
}) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);
  const [themeMode, setThemeMode] = useState(() =>
    typeof window !== "undefined" ? getStoredMode() : "light",
  );
  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const initRequestRef = useRef(0);
  const isInline = variant === "inline";
  const boxHeaderMode = themeMode === "dark" ? "dark" : "light";

  useEffect(() => {
    const handleModeChange = (event) => {
      setThemeMode(event?.detail || getStoredMode());
    };
    setThemeMode(getStoredMode());
    window.addEventListener("theme-mode-changed", handleModeChange);
    return () => {
      window.removeEventListener("theme-mode-changed", handleModeChange);
    };
  }, []);

  const waitForStableContainer = (requestId, timeoutMs = 5000) =>
    new Promise((resolve, reject) => {
      const startedAt = Date.now();
      let rafId = null;
      let resizeObserver = null;
      let intersectionObserver = null;
      let latestSize = { width: 0, height: 0 };
      let stableFrames = 0;
      let prevArea = -1;
      let isIntersecting = false;

      const cleanup = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (intersectionObserver) {
          intersectionObserver.disconnect();
        }
      };

      const fail = (message) => {
        cleanup();
        reject(new Error(message));
      };

      const el = containerRef.current;
      if (!el) {
        fail("Preview container missing");
        return;
      }

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        latestSize.width = entry.contentRect.width;
        latestSize.height = entry.contentRect.height;
      });
      resizeObserver.observe(el);

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = Boolean(entry?.isIntersecting);
        },
        { threshold: [0, 0.01] },
      );
      intersectionObserver.observe(el);

      const tick = () => {
        if (initRequestRef.current !== requestId) {
          cleanup();
          return;
        }

        const target = containerRef.current;
        const rect = target?.getBoundingClientRect?.();
        const width = latestSize.width || rect?.width || 0;
        const height = latestSize.height || rect?.height || 0;
        const area = width * height;
        const hasDomParent =
          Boolean(target?.offsetParent) ||
          (target
            ? window.getComputedStyle(target).position === "fixed"
            : false);
        const renderable =
          hasDomParent && width > 0 && height > 0 && isIntersecting;

        if (renderable) {
          if (area === prevArea) {
            stableFrames += 1;
          } else {
            stableFrames = 0;
            prevArea = area;
          }

          if (stableFrames >= 2) {
            cleanup();
            resolve(target);
            return;
          }
        } else {
          stableFrames = 0;
          prevArea = -1;
        }

        if (Date.now() - startedAt > timeoutMs) {
          fail("Preview container did not become stably visible");
          return;
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    });

  useEffect(() => {
    // Add style to hide Box logo
    const style = document.createElement("style");
    style.textContent = `${hideBoxLogo}\n${isInline ? hideInlineHeader : ""}`;
    document.head.appendChild(style);

    // Clean up previous preview instance
    if (previewRef.current) {
      previewRef.current.hide();
      previewRef.current = null;
    }

    if (!isOpen || !fileId) return;

    let preview = null;
    const requestId = Date.now();
    initRequestRef.current = requestId;

    const initPreview = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!window.Box) {
          const script = document.createElement("script");
          script.src =
            "https://cdn01.boxcdn.net/platform/preview/2.93.0/en-US/preview.js";

          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href =
            "https://cdn01.boxcdn.net/platform/preview/2.93.0/en-US/preview.css";

          document.head.appendChild(link);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const response = await fetchWrapper(
          `/api/box/preview/${fileId}`,
          {},
          "file-preview",
        );
        const data = await response.json();

        if (!response.ok || !data.accessToken) {
          throw new Error(data.error || "Failed to get access token");
        }

        setFileInfo(data.fileInfo);

        const targetContainer = await waitForStableContainer(requestId);
        if (initRequestRef.current !== requestId) return;
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );

        preview = new window.Box.Preview();

        const clearLoading = () => {
          if (initRequestRef.current !== requestId) return;
          setIsLoading(false);
        };

        if (typeof preview.addListener === "function") {
          preview.addListener("load", clearLoading);
          preview.addListener("previewsuccess", clearLoading);
          preview.addListener("viewerload", clearLoading);
        }

        preview.show(fileId, data.accessToken, {
          container: targetContainer,
          showDownload: !isInline,
          showPrint: !isInline,
          header: boxHeaderMode,
          showAnnotations: false,
          autoFocus: false,
          logoUrl: " ", // Set to space to remove logo
          hasHeader: !isInline,
          onLoad: clearLoading,
          onError: (err) => {
            if (initRequestRef.current !== requestId) return;
            console.error("Preview load error:", err);
            setError(err.message || "Failed to load preview");
            setIsLoading(false);
          },
        });

        previewRef.current = preview;

        // Image viewers sometimes skip onLoad while content is already shown.
        setTimeout(clearLoading, 1500);
      } catch (err) {
        if (initRequestRef.current !== requestId) return;
        console.error("Preview initialization error:", err);
        setError(err.message || "Failed to initialize preview");
        setIsLoading(false);
      }
    };

    initPreview();

    return () => {
      initRequestRef.current += 1;
      if (preview) {
        try {
          preview.hide();
        } catch (e) {
          console.warn("Preview hide failed during cleanup", e);
        }
      }
      if (previewRef.current) {
        try {
          previewRef.current.hide();
        } catch (e) {
          console.warn("Preview ref hide failed during cleanup", e);
        }
        previewRef.current = null;
      }
      // Remove the style when component unmounts
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [isOpen, fileId, isInline, boxHeaderMode]);

  const handleClose = () => {
    onClose?.();
    setFileInfo(null);
  };

  const previewBody = (
    <div className="relative h-full min-h-0">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <LoaderSpinner size={32} className="text-secondary-foreground" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Error Loading Preview</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <div className="preview-container h-full w-full" ref={containerRef} />
    </div>
  );

  if (isInline) {
    return (
      <div className="inline-preview relative max-h-[55vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-border bg-card">
        <div className="relative h-[55vh] min-h-[420px]">{previewBody}</div>
      </div>
    );
  }

  const titleText = fileInfo?.name || fileName || "File Preview";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        className="flex h-[80vh] w-[1200px] max-w-[90vw] flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-[90vw]"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <DialogHeader className="min-w-0 shrink-0 space-y-0 overflow-hidden border-b border-border px-6 py-4 text-left">
          <div className="flex w-full min-w-0 items-center gap-3">
            <DialogTitle
              className="min-w-0 flex-1 overflow-hidden text-lg font-semibold text-foreground"
              title={titleText}
            >
              <span className="block truncate">{titleText}</span>
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 overflow-hidden">{previewBody}</div>
      </DialogContent>
    </Dialog>
  );
}
