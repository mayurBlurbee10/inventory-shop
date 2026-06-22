import { Dialog, DialogPanel } from "@headlessui/react";
import { useEffect, useState } from "react";
import { ChevronRight, FolderInput, X } from "lucide-react";
import FileExplorer from "./FileExplorer";
import Button from "./Common/Elements/Button";

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
    <Dialog
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      className="relative z-50 text-gray-600"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Dialog Panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Move “{item?.name}”</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-auto max-h-[600px] h-[60vh]">
            {/* Current Location */}
            <div>
              <p className="text-gray-500 font-medium">Current location:</p>
              <div className="font-medium flex">
                My Files
                {currentLocation &&
                  currentLocation.length > 0 &&
                  currentLocation.map((p, index) => (
                    <div key={index} className="flex items-center">
                      <ChevronRight className="h-5 w-5" />
                      {p.name}
                    </div>
                  ))}
              </div>
            </div>

            {/* Folder List */}
            <div>
              <p className="text-gray-500">Select a new location:</p>
              <div className="mt-2 space-y-2 overflow-auto custom-scrollbar">
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
          <div className="flex justify-end border-t px-4 py-3 space-x-2">
            <Button
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
              type="Secondary"
              label="Cancel"
            />
            
            <Button
            onClick={() => {
              handleMove(selectedFolder);
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
            }, 2000); 
            }}
            disabled={
              isLoading ||
              !selectedFolder ||
              selectedFolder?.id ==
                currentLocation[currentLocation.length - 1]?.id ||
              selectedFolder?.id == item?.id
            }
            isLoading={isLoading}
            icon={FolderInput}
            type="Primary"
            label ="Move"
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default MoveDialog;
