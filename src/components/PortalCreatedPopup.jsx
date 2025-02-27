'use client'
import { clearUserData } from "@/app/lib/auth";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "./Common/Elements/Button";

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
      onClose={onClose}
      className="relative z-50 text-gray-600"
    >
      <div className="fixed inset-0 bg-black/10" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white shadow-lg">
          <div className="flex justify-between items-center border-b px-4 py-3">
            <h2 className="text-lg font-semibold">
              Portal Created Successfully
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4 text-center">
            <p className="text-gray-600 mb-6">
              Your portal <span className="font-semibold">{portalName}</span> has
              been created successfully. Please visit to explore more.
            </p>
            <Button 
              onClick={handleVisitPortal}
              label="Visit your portal"
              type="Primary"
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default PortalCreatedPopup;
