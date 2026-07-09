"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import PreviewModal from "./PreviewModal";
import {
  FolderIcon,
  FileIcon,
  ChevronRight,
  ChevronDown,
  FileText,
  Download,
  Eye,
  Search,
  XCircle,
  Share2,
  Copy,
  Send,
} from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const ShareModal = ({ isOpen, onClose, fileName }) => {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const shareLink = `https://files.ethree.com/share/${fileName}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = async () => {
    console.log("Sharing via email:", email);
    setEmail("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-lg p-8 bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Share link
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 h-auto bg-muted border-border rounded-lg text-foreground text-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0 px-3 py-2.5 h-auto text-foreground hover:bg-muted"
              >
                <Copy size={16} />
                <span>{copied ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Share via email
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 h-auto bg-background border-border rounded-lg text-foreground text-sm"
              />
              <Button
                onClick={handleEmailShare}
                disabled={!email}
                className="shrink-0 px-5 py-2.5 h-auto"
              >
                <Send size={16} />
                <span>Send</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
// Memoized SearchBar component to prevent unnecessary re-renders
const SearchBar = memo(({ searchQuery, setSearchQuery, isSearching }) => {
  const inputRef = useRef(null);

  const handleClear = () => {
    setSearchQuery("");
    // Maintain focus after clearing
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {isSearching ? (
          <LoaderSpinner size={24} className="text-primary" />
        ) : (
          <Search size={18} className="text-muted-foreground" />
        )}
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search files and folders..."
        className="w-full pl-10 pr-10 py-2 border border-border rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <XCircle size={18} className="text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";

const Breadcrumbs = ({ path, onNavigate }) => {
  return (
    <nav className="flex items-center text-muted-foreground text-sm space-x-2">
      <button
        onClick={() => onNavigate([])}
        className="hover:text-secondary-foreground transition-colors"
      >
        Home
      </button>
      {path.map((folder, index) => (
        <React.Fragment key={index}>
          <span>/</span>
          <button
            onClick={() => onNavigate(path.slice(0, index + 1))}
            className="hover:text-secondary-foreground transition-colors"
          >
            {folder}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

const FileExplorer = ({ data, selectedItem, setSelectedItem = () => {}, isInDialog=false }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState(null);
  const [shareFileName, setShareFileName] = useState("");
  const [currentPath, setCurrentPath] = useState([]);

  const searchFiles = (items, query) => {
    if (!query) return null;

    const results = [];
    const searchRecursive = (items, path = []) => {
      items.forEach((item) => {
        const itemPath = [...path, item.name];
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            ...item,
            path: itemPath,
            matchType: "name",
          });
        }
        if (item.children?.length > 0) {
          searchRecursive(item.children, itemPath);
        }
      });
    };

    searchRecursive(items);
    return results;
  };

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const results = searchFiles(data, searchQuery);
      setSearchResults(results);
      setIsSearching(false);

      const foldersToExpand = new Set();
      results?.forEach((result) => {
        result.path.forEach((_, index, array) => {
          if (index < array.length - 1) {
            const folderPath = array.slice(0, index + 1).join("/");
            foldersToExpand.add(folderPath);
          }
        });
      });
      setExpandedFolders(foldersToExpand);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, data]);

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetchWrapper(
        `/api/box/download?fileId=${fileId}`,
        {},
        "download"
      );
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully")
    } catch (error) {
      toast.error(error.message)
      console.error("Download error:", error);
    }
  };

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const handleShare = (fileName) => {
    setShareFileName(fileName);
    setIsShareModalOpen(true);
  };

  const toggleFolder = (pathString) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pathString)) {
        newSet.delete(pathString);
        const path = [...pathString.split("/")];
        path.pop();
        setCurrentPath(path);
        navigateToPath(path);
      } else {
        newSet.add(pathString);
        navigateToPath(pathString.split("/"));
      }
      return newSet;
    });
  };

  const HighlightedText = ({ text, searchTerm }) => {
    if (!searchTerm) return text;

    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={i} className="bg-warning/30 text-warning-foreground">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const FileItem = ({ file, level = 0, parentPath = [] }) => {
    const paddingLeft = `${level * 20}px`;
    const isFolder = file.type === "folder";
    const currentPath = [...parentPath, file.name];
    const pathString = currentPath.join("/");
    const isExpanded = expandedFolders.has(pathString);
    const isSelected = selectedItem?.id === file.id;

    const showItem =
      !searchQuery ||
      searchResults?.some((result) => result.id === file.id) ||
      expandedFolders.has(pathString);

    if (!showItem) return null;

    return (
      <>
        <div
          className={`flex items-center p-2 hover:bg-secondary rounded-lg group transition-colors
            ${isSelected ? "bg-accent" : ""}`}
          style={{ paddingLeft }}
          onClick={() => {
            if (typeof setSelectedItem === "function") {
              if(file.type === 'folder') {
                setSelectedItem(file);
              }
            }
            if (isFolder) navigateToPath(currentPath);
          }}
        >
          <div className="flex-1 flex items-center min-w-0">
            {isFolder ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(pathString);
                }}
                className="p-1 hover:bg-secondary rounded-md mr-2"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-[28px] mr-2" />
            )}

            {isFolder ? (
              <FolderIcon
                size={20}
                className="text-primary mr-3 flex-shrink-0"
              />
            ) : (
              <FileText
                size={20}
                className="text-muted-foreground mr-3 flex-shrink-0"
              />
            )}

            <span className="truncate text-foreground">
              <HighlightedText text={file.name} searchTerm={searchQuery} />
            </span>
          </div>

          {!isFolder && (
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(file.id);
                }}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground disabled:opacity-50"
                title="Preview"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoaderSpinner size={24} className="text-primary" />
                ) : (
                  <Eye size={16} />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(file.name);
                }}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"
                title="Share"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(file.id, file.name);
                }}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"
                title="Download"
              >
                <Download size={16} />
              </button>
            </div>
          )}
        </div>

        {isFolder &&
          isExpanded &&
          file.children?.map((child) => (
            <FileItem
              key={child.id}
              file={child}
              level={level + 1}
              parentPath={currentPath}
            />
          ))}
      </>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <FileIcon size={48} className="mb-4 opacity-50" />
      <p>No files or folders found</p>
    </div>
  );

  const SearchResults = () => {
    if (!searchQuery) return null;
    if (isSearching) return null;
    if (!searchResults?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No results found for "{searchQuery}"
        </div>
      );
    }
    return (
      <div className="py-2 px-4 bg-muted border-b border-border text-muted-foreground">
        Found {searchResults.length} result
        {searchResults.length !== 1 ? "s" : ""}
      </div>
    );
  };

  const navigateToPath = (path) => {
    setCurrentPath(path);
    const folderPathStrings = path.map((_, idx) =>
      path.slice(0, idx + 1).join("/")
    );
    setExpandedFolders(new Set(folderPathStrings));
  };

  return (
    <div className="border border-border rounded-lg ">
      {!isInDialog && (
        <div className="p-4 border-b border-border space-y-4">
          <Breadcrumbs path={currentPath} onNavigate={navigateToPath} />
          <h3 className="font-medium text-foreground">Files & Folders</h3>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
          />
          <SearchResults />
        </div>
      )}
      <div className="p-2">
        {data && data.length > 0 ? (
          data.map((item) => <FileItem key={item.id} file={item} />)
        ) : (
          <EmptyState />
        )}
      </div>
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        fileId={previewFileId}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileName={shareFileName}
      />
    </div>
  );
};

export default FileExplorer;
