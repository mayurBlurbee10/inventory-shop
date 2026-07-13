'use client'
import { clearUserData } from "@/app/lib/auth";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function PortalCreatedPopup({ isOpen, portalName, portalId, onClose }) {
  const router = useRouter();
  const handleVisitPortal = () => {
    clearUserData();
    router.push(`/${portalId}/login`);
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="w-full max-w-md bg-background"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
          <DialogHeader className="border-b border-border pb-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg font-semibold text-foreground">
              Portal Created Successfully
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4 p-4 text-center">
            <DialogDescription className="mb-6 text-base text-muted-foreground">
              Your portal <span className="font-semibold text-foreground">{portalName}</span> has
              been created successfully. Please visit to explore more.
            </DialogDescription>
            <DialogFooter className="justify-center sm:justify-center bg-transparent">
              <Button
                type="button"
                onClick={handleVisitPortal}
                className="px-3 py-3"
              >
                Visit your portal
              </Button>
            </DialogFooter>
          </div>
      </DialogContent>
    </Dialog>
  );
}

export default PortalCreatedPopup;
