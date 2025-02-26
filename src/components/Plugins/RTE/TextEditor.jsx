"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import ListItem from "@tiptap/extension-list-item";
import { Extension } from "@tiptap/core";
import { CompactPicker } from "react-color";
import "./tiptap-style.css";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  Strikethrough,
  Table as TableIcon,
} from "lucide-react";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { useEffect, useState } from "react";

const fontSizeOptions = [
  { label: '8', value: '8px' },
  { label: '10', value: '10px' },
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
];

const Toolbar = ({ editor }) => {
  if (!editor) return null;
  const [color, setColor] = useState("#000")
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(
    editor.getAttributes("textStyle").fontSize || null
  );


  // const handleFontSizeChange = (fontSize) => {
  //   if (!editor.isActive("textStyle")) {
  //     console.error("TextStyle extension is not active.");
  //     return;
  //   }

  //   if (fontSize) {
  //     editor.chain().focus().setTextStyle({ fontSize }).run();
  //   } else {
  //     editor.chain().focus().unsetTextStyle().run();
  //   }
  // };

  // const handleFontSizeChange = (fontSize) => {
  //   editor.chain().focus().setTextStyle({ fontSize }).run();
  //   setCurrentFontSize(fontSize)
  // };
  const applyTextColor = (color) => {
    editor.chain().focus().setColor(color).run();
    setColorPickerVisible(false); // Close the picker after color selection
    setColor(color)
  };


  const addImage = () => {
    const url = window.prompt("Enter the image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex items-center justify-start w-full gap-2 rounded border border-[#ccc] shadow mb-4 py-1 lg:flex-wrap overflow-x-auto custom-scrollbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 ml-1 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("bold") ? "bg-indigo-200" : ""
        }`}
      >
        <Bold />
      </button>
      {/* <select 
        value={currentFontSize || ''} 
        onChange={(e) => handleFontSizeChange(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1"
      >
        <option value="">Default</option>
        {fontSizeOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>  */}
      <button
        onClick={() => setColorPickerVisible((prev) => !prev)}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 -mx-2 text-2xl border-none rounded cursor-pointer hover:bg-indigo-200 relative ${
          editor.isActive("textStyle", { color: "red" }) ? "bg-indigo-200" : ""
        }`}
      >
        A<div className={`absolute h-[6px] w-5 left-1/2 -translate-x-1/2 top-[80%] bg-[${color || "000"}]`} style={{ backgroundColor: color || "#000" }}></div>
      </button>
      {colorPickerVisible && (
        <div className="absolute top-10 left-0">
          <CompactPicker
            color={editor.getAttributes("textStyle").color || "#000"} // Get current color
            onChange={(color) => applyTextColor(color.hex)}
          />
        </div>
      )}
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("italic") ? "bg-indigo-200" : ""
        }`}
      >
        <Italic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("strikeThrough") ? "bg-indigo-200" : ""
        }`}
      >
        <Strikethrough />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 py-2 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("highlight") ? "bg-indigo-200" : ""
        }`}
      >
        Highlight
      </button>
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("paragraph") ? "bg-indigo-200" : ""
        }`}
      >
        p
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("heading", { level: 1 }) ? "bg-indigo-200" : ""
        }`}
      >
        <Heading1 />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("heading", { level: 2 }) ? "bg-indigo-200" : ""
        }`}
      >
        <Heading2 />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("heading", { level: 3 }) ? "bg-indigo-200" : ""
        }`}
      >
        <Heading3 />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("alignLeft") ? "bg-indigo-200" : ""
        }`}
      >
        <AlignLeft />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("alignCenter") ? "bg-indigo-200" : ""
        }`}
      >
        <AlignCenter />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("alignRight") ? "bg-indigo-200" : ""
        }`}
      >
        <AlignRight />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("bulletList") ? "bg-indigo-200" : ""
        }`}
      >
        <List />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 py-2 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("orderedList") ? "bg-indigo-200" : ""
        }`}
      >
        Ordered List
      </button>
      {/* <button onClick={addImage}>Add Image</button> */}
      <button
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
        }
        className={`bg-[#fdfdfd] text-gray-800 px-2 h-11 w-11 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("table") ? "bg-indigo-200" : ""
        }`}
      >
        <TableIcon className="rotate-90" />
      </button>
      <button
        onClick={() => editor.chain().focus().deleteTable().run()}
        className={`bg-[#fdfdfd] text-gray-800 px-2 py-2 border-none rounded cursor-pointer hover:bg-indigo-200 ${
          editor.isActive("deleteTable") ? "bg-indigo-200" : ""
        }`}
      >
        Delete Table
      </button>
    </div>
  );
};

const TabKeyExtension = Extension.create({
  name: "tabKeyExtension",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { state, dispatch } = editor.view;
        const { $from } = state.selection;

        if ($from.parent.type.name === "codeBlock") {
          dispatch(state.tr.insertText("    ")); // Insert 4 spaces
          return true;
        }

        return false;
      },
      "Shift-Tab": ({ editor }) => {
        const { state, dispatch } = editor.view;
        const { $from, $to } = state.selection;

        if ($from.parent.type.name === "codeBlock") {
          const { tr } = state;
          // Remove 4 spaces at the start of the current line(s)
          const start = Math.min($from.start(), $to.start());
          const end = Math.max($from.end(), $to.end());
          const text = tr.doc.textBetween(start, end);
          const updatedText = text.replace(/^ {1,4}/gm, ""); // Remove up to 4 spaces
          tr.replaceWith(start, end, tr.doc.type.schema.text(updatedText));
          dispatch(tr);
          return true;
        }

        return false;
      },
    };
  },
});

const TextEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: "custom-code-block", // Optional: Add custom styles
          },
        },
        keyboardShortcuts: false, // Disable default keyboard shortcuts
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link,
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      TabKeyExtension,
      BulletList,
      OrderedList,
      Color.configure({ types: [TextStyle.name, "textStyle"] }),
      TextStyle.configure({ types: [ListItem.name] }),
    ],
    content: content,
    editorProps: {
      immediatelyRender: false,
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
      console.log(editor.getHTML());
    },
  });

  return (
    <div className="editor-container">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className={`editor`} />
    </div>
  );
};

export default TextEditor;
