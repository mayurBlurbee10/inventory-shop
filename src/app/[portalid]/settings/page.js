"use client";

import { useState } from "react";
import SettingsModal from "@/components/Settings";

export default function SettingsPage() {
  const [isOpen, setIsOpen] = useState(true); // State to control the modal's visibility

  const handleClose = () => {
    setIsOpen(false);
    router.push(`/demo/dashboard`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isOpen && ( // Conditionally render the modal based on `isOpen`
        <SettingsModal 
          isOpen={isOpen} 
          onClose={handleClose}
        />
      )}
    </div>
  );
}
