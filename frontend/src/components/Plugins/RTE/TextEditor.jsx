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
  Link2,
  List,
  Strikethrough,
  Table as TableIcon,
} from "lucide-react";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { useEffect, useState } from "react";
import AddLinkModal from "./AddLinkModal";
import FontSize, { FontSizeControl } from "./FontSize";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";

const ToolbarButton = ({ active, className, children, ...props }) => (
  <Button
    type="button"
    variant="ghost"
    size="lg"
    className={cn(
      "h-11 w-11 shrink-0 rounded-md text-foreground hover:bg-accent hover:text-secondary-foreground",
      active && "bg-accent text-secondary-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </Button>
);

const Toolbar = ({ editor, linkModalVisible, setLinkModalVisible, linkUrl, setLinkUrl, savedRange, setSavedRange, text, setText, from }) => {
  if (!editor) return null;
  const [color, setColor] = useState("#000");
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const applyTextColor = (color) => {
    editor.chain().focus().setColor(color).run();
    setColorPickerVisible(false); // Close the picker after color selection
    setColor(color)
  };


  return (
    <div className="custom-scrollbar mb-4 flex w-full items-center justify-start gap-1 overflow-x-auto rounded-lg border border-border bg-card py-1 shadow-sm lg:flex-wrap">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="ml-1"
      >
        <Bold />
      </ToolbarButton>
      <FontSizeControl editor={editor} />
      <div className="relative">
        <ToolbarButton
          active={editor.isActive("textStyle", { color: "red" })}
          onClick={() => setColorPickerVisible((prev) => !prev)}
          className="relative text-2xl"
        >
          A
          <div
            className="absolute left-1/2 top-[80%] h-[6px] w-5 -translate-x-1/2 rounded-sm"
            style={{ backgroundColor: color }}
          />
        </ToolbarButton>
        {colorPickerVisible && (
          <div className="absolute z-50 mt-2">
            <CompactPicker
              color={editor.getAttributes("textStyle").color || "#000"}
              onChange={(color) => applyTextColor(color.hex)}
            />
          </div>
        )}
      </div>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strikeThrough")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className="w-auto px-3"
      >
        Highlight
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        p
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolbarButton>
      {!from && (
        <>
          <ToolbarButton
            active={editor.isActive("alignLeft")}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("alignCenter")}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("alignRight")}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("link")}
            onClick={() => {
              const previousUrl = editor.getAttributes("link").href;
              const selection = editor.state.selection;
              const { from, to } = selection;
              const selectedText = editor.state.doc.textBetween(from, to, " ");

              setSavedRange(selection);
              setLinkUrl(previousUrl || "");
              setText(selectedText);
              setLinkModalVisible(true);
            }}
          >
            <Link2 className="-rotate-45" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="w-auto px-3"
          >
            Ordered List
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("table")}
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
            }
          >
            <TableIcon className="rotate-90" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("deleteTable")}
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="w-auto px-3"
          >
            Delete Table
          </ToolbarButton>
          <AddLinkModal
            isOpen={linkModalVisible}
            onClose={() => {
              setLinkModalVisible(false);
              setLinkUrl("");
              setText("");
            }}
            text={text}
            initialLink={linkUrl}
            setLink={setLinkUrl}
            editor={editor}
            savedRange={savedRange}
          />
        </>
      )}
    </div>
  );
};

const TabKeyExtension = Extension.create({
  name: "tabKeyExtension",

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const { state, dispatch } = this.editor.view;
        const { tr, selection } = state;
        dispatch(tr.insertText("    ", selection.from, selection.to));
        return true;
      },
      "Shift-Tab": () => {
        const { state, dispatch } = this.editor.view;
        const { from, to } = state.selection;
        const text = state.doc.textBetween(from, to, "\n", "\0");
        const updated = text.replace(/^ {1,4}/gm, "");
        const tr = state.tr.replaceWith(from, to, state.schema.text(updated));
        dispatch(tr);
        return true;
      },
    };
  },
});

const TextEditor = ({ content, onChange,from }) => {
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState(null);
  const [text, setText] = useState("")
  const MAX_CHARACTERS = 40;
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
      FontSize
    ],
    content: content,
    editorProps: {
      immediatelyRender: false,
      handleClickOn(view, pos, node, nodePos, event) {
        const target = event.target;
      
        if (target.tagName === "A") {
          event.preventDefault();
          event.stopPropagation();
      
          const href = target.getAttribute("href");
          const linkText = target.innerText;
      
          setSavedRange(view.state.selection);
          setText(linkText);
          setLinkUrl(href);
          setLinkModalVisible(true);
      
          return true; // ⚠️ Must return true to block default ProseMirror behavior
        }
      
        return false;
      }
    },
    onUpdate({ editor }) {
      const plainText = editor.getText().replace(/\s/g, ''); // remove all spaces
      // if(from){
      //   if (plainText.length <= MAX_CHARACTERS) {
      //     onChange(editor.getHTML());
      //   } else {
      //     editor.commands.undo(); // revert the last input
      //   }
      // }
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || !editor.view) return;

    const editorEl = document.querySelector('[contenteditable="true"]');

    const handleClick = (e) => {
      const target = e.target;
      if (target.tagName === "A") {
        e.preventDefault();
        e.stopPropagation();

        const href = target.getAttribute("href");
        const linkText = target.innerText;

        const selection = editor.view.state.selection;

        setSavedRange(selection);
        setText(linkText);
        setLinkUrl(href);
        setLinkModalVisible(true);
      }
    };

    editorEl?.addEventListener("click", handleClick);

    return () => {
      editorEl?.removeEventListener("click", handleClick);
    };
  }, [editor]);

  // useEffect(() => {
  //   if (!editor) return;
  
  //   const tooltip = document.getElementById("link-tooltip");
  
  //   const handleMouseMove = (event) => {
  //     const target = event.target;
  //     if (target.tagName === "A" && target.href) {
  //       tooltip.textContent = target.href;
  //       tooltip.classList.remove("hidden");
  //     } else {
  //       tooltip.classList.add("hidden");
  //     }
  //   };
    
  //   const editorDOM = editor.view.dom;
  //   editorDOM.addEventListener("mousemove", handleMouseMove);
  
  //   return () => {
  //     editorDOM.removeEventListener("mousemove", handleMouseMove);
  //   };
  // }, [editor]);

  return (
    <div className="relative">
      <div className="editor-container">
        <Toolbar from={from} editor={editor} linkModalVisible={linkModalVisible} setLinkModalVisible={setLinkModalVisible} linkUrl={linkUrl} setLinkUrl={setLinkUrl} savedRange={savedRange}     setSavedRange={setSavedRange} text={text} setText={setText}/>
        <EditorContent editor={editor} className={`editor`} />
        {/* <div
          id="link-tooltip"
          className="hidden absolute -bottom-8 left-4 px-2 py-1 text-xs rounded bg-black text-white z-50 pointer-events-none"
        ></div> */}
      </div>
    </div>
  );
};

export default TextEditor;
