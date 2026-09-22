import { useState } from "react";
import { X } from "lucide-react";
import Button from "./Common/Elements/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DialogBox = ({ title, message, fileLocation, isModalOpen, setIsModalOpen, config }) => {
  const [isLoading, setIsLoading] = useState(false);
  console.log('dialog:', config);

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-sm bg-background p-0 overflow-hidden"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <div className="flex justify-between items-center p-4 border-b border-border">
          <DialogTitle className="text-xl font-medium text-foreground">
            {title}
          </DialogTitle>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-muted-foreground hover:bg-muted p-1 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center p-4">
          <div className="text-lg text-success mb-4">{message}</div>
          {fileLocation && (
            <div
              className="text-muted-foreground mb-4"
              dangerouslySetInnerHTML={{ __html: fileLocation }}
            ></div>
          )}
          <div className="flex justify-center space-x-3">
            <Button
              onClick={() => setIsModalOpen(false)}
              isLoading={isLoading}
              type="Primary"
              label="Done"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogBox;
