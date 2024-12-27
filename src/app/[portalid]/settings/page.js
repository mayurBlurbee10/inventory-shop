"use client";

import { useRouter } from "next/navigation";
import SettingsModal from "@/components/Settings";

export default function SettingsPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsModal 
        isOpen={true} 
        onClose={handleClose}
      />
    </div>
  );
}
