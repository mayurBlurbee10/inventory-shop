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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 text-gray-800 w-full max-w-7xl py-5 flex relative rounded-lg overflow-hidden">
        <div className="w-full h-full flex flex-col p-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold px-5">
              {isEsignNda ? "Non-disclosure agreement" : "Terms and Conditions"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 pr-5"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-5">
            {user && user?.id && page && !isEsignNda && page?.description && (
              <div className="px-5">
                <div
                  className="w-full h-full px-5 pt-5 editor overflow-y-auto max-h-[60vh]"
                  dangerouslySetInnerHTML={{
                    __html: page.description,
                  }}
                  suppressHydrationWarning={true}
                />
              </div>
            )}

            {user && user?.id && page && isEsignNda && (
              <div className="space-y-3 pb-2">
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
          <div className="flex items-center gap-2 text-sm px-6 mb-3 mt-2">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              checked={isAccepted}
              disabled={isEsignNda && isSignRequestLoading}
              onChange={handleAcceptanceChange}
            />
            <p>
              {isEsignNda ? (
                <>
                  Check this box to confirm you have reviewed the NDA. Click{" "}
                  <span className="font-medium">Agree</span> to open e-sign; when
                  signing is complete you will be redirected to the dashboard.
                </>
              ) : (
                <>
                  By ticking, you are confirming that you have read, understood
                  and agree to terms and conditions.
                </>
              )}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 px-5">
            <button
              type="button"
              className="inline-flex items-center px-10 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 border border-gray-400 bg-gray-100 hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Exit
            </button>
            <button
              type="button"
              disabled={agreeDisabled}
              className="inline-flex items-center px-10 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
            >
              {isLoading ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="spinner"></div>
                    Agree
                  </div>
                </>
              ) : (
                "Agree"
              )}
            </button>
          </div>
        </div>

        {isEsignNda && isSignRequestLoading && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50/50"
            aria-busy="true"
            aria-label="Preparing e-sign"
          >
            <LoaderSpinner size={32} className="text-gray-500" />
          </div>
        )}
      </div>
    </div>

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
