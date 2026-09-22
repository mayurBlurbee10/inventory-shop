import { useEffect, useState } from "react";
import { ChevronRight, FolderInput } from "lucide-react";
import FileExplorer from "./FileExplorer";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";

function MoveDialog({
  item,
  isModalOpen,
  setIsModalOpen,
  fileList,
  handleMove,
}) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchWithPaths = (nodes, query, currentPath = []) => {
    const results = [];

    nodes.forEach((node) => {
      const newPath = [...currentPath, node]; // Add the current node to the path

      // Check if the node matches the query
      if (node.id === query) {
        results.push({
          ...node,
          path: newPath, // Store the full path to this node
        });
      }

      // If the node has children, continue searching recursively
      if (node.children && node.children.length > 0) {
        results.push(...searchWithPaths(node.children, query, newPath));
      }
    });

    return results;
  };

  useEffect(() => {
    if (item) {
      const file = searchWithPaths(fileList, item.id);
      if (file[0]?.path) {
        file[0].path.pop();
        setCurrentLocation(file[0].path);
      }
    }
  }, [item]);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden bg-background p-0 text-foreground sm:w-full sm:max-w-md">
        {/* Header */}
        <DialogHeader className="space-y-2 overflow-hidden border-b border-border px-4 py-3 pr-12 text-left">
          <DialogTitle className="text-lg font-semibold text-secondary-foreground">
            Move
          </DialogTitle>
          {item?.name ? (
            <p
              className="min-w-0 break-all text-sm font-medium text-muted-foreground"
              title={item.name}
            >
              “{item.name}”
            </p>
          ) : null}
        </DialogHeader>

        {/* Content */}
        <div className="h-[60vh] max-h-[600px] space-y-4 overflow-auto p-4">
          {/* Current Location */}
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-secondary-foreground">
              Current location:
            </p>
            <div className="flex min-w-0 flex-wrap items-center gap-x-1 text-sm font-medium text-foreground">
              <span className="shrink-0">My Files</span>
              {currentLocation &&
                currentLocation.length > 0 &&
                currentLocation.map((p, index) => (
                  <div key={index} className="flex min-w-0 max-w-full items-center gap-1">
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate" title={p.name}>
                      {p.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Folder List */}
          <div className="min-w-0">
            <p className="font-medium text-secondary-foreground">
              Select a new location:
            </p>
            <div className="custom-scrollbar mt-2 space-y-2 overflow-auto rounded-lg border border-border bg-secondary">
              <FileExplorer
                data={fileList}
                selectedItem={selectedFolder}
                setSelectedItem={setSelectedFolder}
                isInDialog={true}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border bg-transparent px-4 py-3">
          <Button
            variant="outline"
            className="px-3 py-3"
            onClick={() => setIsModalOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            onClick={() => {
              handleMove(selectedFolder);
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
              }, 2000);
            }}
            className="px-3 py-3"
            disabled={
              isLoading ||
              !selectedFolder ||
              selectedFolder?.id ==
              currentLocation[currentLocation.length - 1]?.id ||
              selectedFolder?.id == item?.id
            }
          >
            {isLoading ? (
              <LoaderSpinner size={20} className="text-primary-foreground" />
            ) : (
              <>
                <FolderInput className="h-4 w-4" />
                Move
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MoveDialog;
