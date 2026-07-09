// BoxAI Plugin - Standalone Plugin
import React, { useState } from "react";
import { BrainCog } from "lucide-react";
import BoxAIModal from "../component/BoxAIModal";
import { Button } from "@/components/ui/button";

class BoxAIPlugin {
  constructor() {
    // Only store the plugin key for identification
    this.key = "box_ai";
  }

  // Get plugin component
  getComponent() {
    return (config = {}) => {
      const [isModalOpen, setIsModalOpen] = useState(false);

      return (
        <>
          {/* OLD portal theme styles kept for reference:
              const {
                primaryColor = "#1f2937",
                secondaryColor = "#ffffff",
                accentColor = "#3b82f6",
                backgroundColor = "#ffffff",
                textColor = "#1f2937",
                ...otherConfig
              } = config;

              style={{
                "--hover-bg": secondaryColor,
                "--hover-text": primaryColor,
                color: secondaryColor,
                backgroundColor: primaryColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = accentColor;
                e.currentTarget.style.color = primaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
                e.currentTarget.style.color = secondaryColor;
              }}
          */}
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
    };
  }
}

export default BoxAIPlugin;