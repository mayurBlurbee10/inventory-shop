// BoxAI Plugin - Standalone Plugin
import React, { useState } from 'react';
import { BrainCog } from 'lucide-react';
import BoxAIModal from '../component/BoxAIModal';

class BoxAIPlugin {
  constructor() {
    // Only store the plugin key for identification
    this.key = 'box_ai';
  }

  // Get plugin component
  getComponent() {
    return (config = {}) => {
      const [isModalOpen, setIsModalOpen] = useState(false);
      
      // Extract configuration from props
      const {
        primaryColor = "#1f2937",
        secondaryColor = "#ffffff",
        accentColor = "#3b82f6",
        backgroundColor = "#ffffff",
        textColor = "#1f2937",
        ...otherConfig
      } = config;

      return (
        <>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 w-24 border px-2 py-1.5 font-semibold rounded-lg"
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
          >
            <BrainCog className="h-5 w-5" />
            <span>Box AI</span>
          </button>
          
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