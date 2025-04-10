import { Mark } from "@tiptap/core";
import { Minus, Plus } from "lucide-react"; 
import { useState } from "react";

const minSize = 8;
const maxSize = 96;

export const FontSizeControl = ({editor }) => {
    const fontSizeOptions = [
      8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96
    ];
  
    const [currentFontSize, setCurrentFontSize] = useState("16");
  
    const applyFontSize = (size) => {
      const value = `${size}px`;
      editor.chain().focus().setFontSize(value).run();
      setCurrentFontSize(size.toString());
    };
  
    const increaseFontSize = () => {
      const current = parseInt(currentFontSize || "16", 10);
      const next = fontSizeOptions.find((size) => size > current);
      if (next) applyFontSize(next);
    };
  
    const decreaseFontSize = () => {
      const current = parseInt(currentFontSize || "16", 10);
      const reversed = [...fontSizeOptions].reverse();
      const prev = reversed.find((size) => size < current);
      if (prev) applyFontSize(prev);
    };
  
    const handleInputChange = (e) => {
        const value = e.target.value;
        setCurrentFontSize(value);
        const numberValue = parseInt(value, 10);
        if (!isNaN(numberValue)) {
            editor
            .chain()
            .setFontSize(`${numberValue}px`) 
            .run();
        }
    };
  
    return (
      <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-1">
        <button
          onClick={decreaseFontSize}
          className="text-gray-600 hover:text-black"
          type="button"
        >
          <Minus size={16} />
        </button>
        <input
          type="text"
          min={minSize}
          max={maxSize}
          value={currentFontSize}
          onChange={handleInputChange}
          className="w-10 text-center border-none outline-none bg-transparent"
        />
        <button
          onClick={increaseFontSize}
          className="text-gray-600 hover:text-black"
          type="button"
        >
          <Plus size={16} />
        </button>
      </div>
    );
  };

const FontSize = Mark.create({
  name: "fontSize",

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ style: "font-size" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ commands }) => {
          return commands.setMark(this.name, { fontSize });
        },
      unsetFontSize:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export default FontSize;
