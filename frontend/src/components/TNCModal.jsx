"use client";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import PreviewModal from "@/components/FileExplorer/PreviewModal";
import SignRequestModal from "@/components/SignRequestModal";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ESIGN_DONE_STATUSES = ["signed", "completed", "finalizing"];

function TNCModal({ onClose, user, email, password, page }) {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [esignCompleted, setEsignCompleted] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signUrl, setSignUrl] = useState("");
  const [signRequest, setSignRequest] = useState(null);
  const [isSignRequestLoading, setIsSignRequestLoading] = useState(false);
  const completionHandledRef = useRef(false);
    const { data: config } = useSelector((state) => state.portal);
    const { data: pages } = useSelector((state) => state.pages);

  const fetchSignRequestStatus = useCallback(async (signRequestId) => {
    if (!signRequestId) return null;
    const response = await fetchWrapper(
      `/api/box/e-sign?id=${signRequestId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
      "tnc-esign-status",
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load sign status");
    }
    return data?.data;
  }, []);

  const completeTncAndRedirect = useCallback(async () => {
    if (completionHandledRef.current) return;
    if (!user || !user?.id) return;
    completionHandledRef.current = true;
    try {
      setIsLoading(true);
        try {
          fetchWrapper("/api/api-logs", { method: "POST" }, "guest-login");
        } catch (logError) {
          console.error("Failed to create guest-login log:", logError);
        }
       const dashboardPage = pages?.find((page) => page.title === "dashboard");
       if(dashboardPage?.isPageVisible) {
        router.push("dashboard");
        toast.success("Redirecting to dashboard");
       }else{
        router.push("shared-docs");
        toast.success("Redirecting to shared documents");
       }
    } catch (error) {
      console.error("Error fetching plugins:", error);
      completionHandledRef.current = false;
      toast.error(error?.message || "Could not finish setup. Please try again.");
    } finally {
      setIsLoading(false);
      onClose();
    }
  // }, [user, router, onClose]);
  }, [user, page?.ndaType, page?.fileId, router, onClose]);

  useEffect(() => {
    if (!isSignModalOpen || !signRequest?.id) return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const sr = await fetchSignRequestStatus(signRequest.id);
        if (cancelled || !sr) return;
        setSignRequest(sr);
        if (ESIGN_DONE_STATUSES.includes(sr.status)) {
          setEsignCompleted(true);
          setIsSignModalOpen(false);
          setSignUrl("");
          // toast.success("E-sign completed. Redirecting…");
          await completeTncAndRedirect();
        }
      } catch {
        /* ignore transient poll errors */
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isSignModalOpen, signRequest?.id, fetchSignRequestStatus, completeTncAndRedirect]);

  const startEsignFromAgree = useCallback(async () => {
    if (!user?.email || !user?.id || !user?.boxUserId) {
      toast.error("Your account is missing Box or profile details required for e-sign.");
      return false;
    }
    if (!page?.fileId || !params?.portalid) {
      toast.error("Missing document or portal for e-sign.");
      return false;
    }
    setIsSignRequestLoading(true);
    try {
      const response = await fetchWrapper(
        "/api/box/e-sign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: page.fileId,
            signers: [
              {
                signerEmail: user.email,
                signerId: user.id,
              },
            ],
            boxUserId: user.boxUserId,
            portal: params.portalid,
            onSameDoc: false,
            ndaFolderId: config?.ndaFolderId || null,
            ndaSignFlag: true,
          }),
        },
        "tnc-self-esign-request",
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create e-sign request");
      }
      const sr = data.data?.[0];
      if (!sr?.id) {
        throw new Error("Invalid e-sign response");
      }
      const currentUserSigner = sr.signers?.find((s) => s.email === user.email);
      const embedUrl = currentUserSigner?.iframeableEmbedUrl;
      if (!embedUrl) {
        throw new Error("No e-sign URL returned");
      }
      setSignRequest(sr);
      setSignUrl(embedUrl);
      setIsSignModalOpen(true);
      setIsSignRequestLoading(false);
      return true;
    } catch (err) {
      toast.error(err.message || "E-sign could not be started");
      setIsSignRequestLoading(false);
      return false;
    }
  }, [user, page?.fileId, params?.portalid]);

  const handleClose = async () => {
    const isEsignNda = page?.ndaType === "esign" && page?.fileId;
    if (isEsignNda) {
      if (esignCompleted) {
        await completeTncAndRedirect();
        return;
      }
      if (!signRequest?.id) {
        await startEsignFromAgree();
        return;
      }
      try {
        const sr = await fetchSignRequestStatus(signRequest.id);
        if (sr && ESIGN_DONE_STATUSES.includes(sr.status)) {
          setSignRequest(sr);
          setEsignCompleted(true);
          await completeTncAndRedirect();
          return;
        }
      } catch {
        /* fall through */
      }
      return;
    }

    await completeTncAndRedirect();
  };

  const handleAcceptanceChange = (e) => {
    const checked = e.target.checked;
    const isEsignNda = page?.ndaType === "esign" && page?.fileId;

    if (!isEsignNda) {
      setIsAccepted(checked);
      return;
    }

    if (!checked) {
      if (completionHandledRef.current) return;
      setIsAccepted(false);
      setIsSignModalOpen(false);
      setSignUrl("");
      setSignRequest(null);
      setEsignCompleted(false);
      return;
    }

    setIsAccepted(true);
  };

  const handleSignModalClose = async () => {
    setIsSignModalOpen(false);
    setSignUrl("");
    const id = signRequest?.id;
    if (!id) return;
    try {
      const sr = await fetchSignRequestStatus(id);
      if (sr && ESIGN_DONE_STATUSES.includes(sr.status)) {
        setSignRequest(sr);
        setEsignCompleted(true);
        toast.success("E-sign completed. Redirecting…");
        await completeTncAndRedirect();
      } else {
        setEsignCompleted(false);
        setIsAccepted(false);
        setSignRequest(null);
      }
    } catch {
      setEsignCompleted(false);
      setIsAccepted(false);
      setSignRequest(null);
    }
  };

  useEffect(() => {
    completionHandledRef.current = false;
    setIsAccepted(false);
    setEsignCompleted(false);
    setIsSignModalOpen(false);
    setSignUrl("");
    setSignRequest(null);
    setIsSignRequestLoading(false);
  }, [page?.id, page?.fileId]);

  if (!user || !page || user?.isTNCAccepted) {
    return;
  }

  const isEsignNda = page.ndaType === "esign" && page.fileId;
  const agreeDisabled =
    isLoading ||
    !isAccepted ||
    (isEsignNda &&
      (isSignRequestLoading ||
        (isSignModalOpen && Boolean(signUrl))));

  return (
    <>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-border bg-background p-0 shadow-lg sm:w-full sm:max-w-5xl"
          overlayClassName="bg-black/30"
          showCloseButton={false}
        >
          <div className="relative flex min-h-0 w-full flex-1 flex-col">
            <DialogHeader className="flex flex-row items-center justify-between gap-4 space-y-0 px-6 pb-3 pt-5">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {isEsignNda ? "Non-disclosure agreement" : "Terms and Conditions"}
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-hidden px-6">
              {user && user?.id && page && !isEsignNda && page?.description && (
                <div
                  className="editor max-h-[55vh] min-h-[280px] w-full overflow-y-auto rounded-lg border border-border bg-background px-4 py-4 text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: page.description,
                  }}
                  suppressHydrationWarning={true}
                />
              )}

              {user && user?.id && page && isEsignNda && (
                <div className="max-h-[55vh] min-h-[280px] w-full overflow-hidden rounded-lg border border-border bg-background">
                  <PreviewModal
                    variant="inline"
                    isOpen={true}
                    onClose={() => {}}
                    fileId={page.fileId}
                    fileName={
                      page.originalFileName || page.title || "NDA document"
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 px-6 py-4">
              <Checkbox
                id="tnc-accept"
                checked={isAccepted}
                disabled={isEsignNda && isSignRequestLoading}
                onCheckedChange={(checked) =>
                  handleAcceptanceChange({
                    target: { checked: Boolean(checked) },
                  })
                }
                className="mt-0.5"
              />
              <DialogDescription
                id="tnc-accept-label"
                className="cursor-pointer text-sm leading-6 text-foreground"
                onClick={() => {
                  if (isEsignNda && isSignRequestLoading) return;
                  handleAcceptanceChange({
                    target: { checked: !isAccepted },
                  });
                }}
              >
                {isEsignNda ? (
                  <>
                    Check this box to confirm you have reviewed the NDA. Click{" "}
                    <span className="font-medium">Agree</span> to open e-sign;
                    when signing is complete you will be redirected to the
                    dashboard.
                  </>
                ) : (
                  <>
                    By ticking, you are confirming that you have read,
                    understood and agree to terms and conditions.
                  </>
                )}
              </DialogDescription>
            </div>

            <DialogFooter className="m-0 flex flex-row items-center justify-end gap-2 rounded-none border-0 bg-transparent p-0 px-6 pb-5 pt-0 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="!px-3 !py-3"
                onClick={onClose}
              >
                Exit
              </Button>
              <Button
                type="button"
                disabled={agreeDisabled}
                className="!px-3 !py-3"
                onClick={handleClose}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoaderSpinner
                      size={18}
                      className="text-primary-foreground"
                    />
                    Agree
                  </span>
                ) : (
                  "Agree"
                )}
              </Button>
            </DialogFooter>

            {isEsignNda && isSignRequestLoading && (
              <div
                className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm"
                aria-busy="true"
                aria-label="Preparing e-sign"
              >
                <LoaderSpinner size={32} className="text-secondary-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SignRequestModal
        isOpen={isSignModalOpen && Boolean(signUrl)}
        onClose={handleSignModalClose}
        signUrl={signUrl}
        signRequest={signRequest}
        setSignRequest={setSignRequest}
        ndaSignFlag={true}
      />
    </>
  );
}

export default TNCModal;
