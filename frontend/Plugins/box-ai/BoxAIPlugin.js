// BoxAI Plugin - Standalone Plugin
import React, { useState } from "react";
import { BrainCog } from "lucide-react";
import BoxAIModal from "../component/BoxAIModal";
import { Button } from "@/components/ui/button";

export function BoxAIPluginButton({ config = {} }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="h-10 w-24 gap-2 border border-border bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/25 px-3 py-2 font-semibold"
      >
        <BrainCog className="h-5 w-5" />
        <span>Box AI</span>
      </Button>

      <BoxAIModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hubTitle="Box AI Plugin"
      />
    </>
  );
}

class BoxAIPlugin {
  constructor() {
    this.key = "box_ai";
  }

  getComponent() {
    return BoxAIPluginButton;
  }
}

export default BoxAIPlugin;
