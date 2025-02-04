"use client";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Loader2, X } from "lucide-react";

export default function SignRequestModal({ isOpen, onClose, signUrl }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-[90vw] w-[1200px] h-[80vh] bg-white rounded-lg shadow-xl relative">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Sign Document
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[calc(80vh-73px)] relative">
            {signUrl ? (
              <iframe
                src={signUrl}
                width="100%"
                height="100%"
                className="border-none rounded-lg"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-gray-500 mt-2">Loading document...</p>
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
