"use client";

import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { X } from "lucide-react";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SignRequestModal({
  isOpen,
  onClose,
  signUrl,
  redirect_url = "",
  signRequest = null,
  setSignRequest = () => {},
}) {
  const router = useRouter();

  const fetchSignRequest = async () => {
    try {
      const response = await fetchWrapper(
        `/api/box/e-sign?id=${signRequest?.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
        "get-esign-request",
      );
      const data = await response.json();
      console.log("data: ", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to get e-sign request");
      }
      setSignRequest(data?.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleClose = async () => {
    try {
      if (signRequest) {
        await fetchSignRequest();
      }
      onClose();
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleDismiss = async () => {
    if (redirect_url) {
      router.push(redirect_url);
      onClose();
      return;
    }
    await handleClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleDismiss();
        }
      }}
    >
      <DialogContent
        className="flex h-[80vh] w-[1200px] max-w-[90vw] flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-[90vw]"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <DialogHeader className="min-w-0 shrink-0 space-y-0 border-b border-border px-6 py-4 text-left">
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Sign Document
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDismiss}
              className="shrink-0 rounded-full px-3 py-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-background">
          {signUrl ? (
            <iframe
              src={signUrl}
              title="Sign Document"
              width="100%"
              height="100%"
              className="h-full w-full border-none bg-background"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
              <LoaderSpinner size={32} className="text-secondary-foreground" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
