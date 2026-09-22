'use client';
import { useState } from 'react';
import { Import, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function UploadArea({ isForImport, onBrowse, onClose }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => file.type === "text/csv"); 
    if(validFiles.length === 0 && isForImport){
      return
    }
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    // Create a DataTransfer object
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    
    // Set the files to the input
    fileInput.files = dataTransfer.files;
    
    // Dispatch change event
    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', { value: fileInput });
    onBrowse(event);
  };

  return (
    <div className="z-20 mb-6 mt-4 w-full">
      <Card
        className={`relative border-2 border-dashed shadow-none transition-all duration-200 ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border bg-muted/30 hover:border-muted-foreground/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Close upload area"
        >
          <X className="w-5 h-5" />
        </Button>

        <CardContent className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
          {isForImport ?
          (
            <Import className={`h-12 w-12 ${isDragging ? 'text-secondary-foreground' : 'text-muted-foreground'}`} />
          ):(
            <Upload className={`h-12 w-12 ${isDragging ? 'text-secondary-foreground' : 'text-muted-foreground'}`} />
          ) }
          <div>
            <p className="text-sm text-muted-foreground sm:text-base">
              Drag and drop file
              {isForImport ? ' csv ' : ' '}
              here or{' '}
              <Button
                type="button"
                variant="link"
                onClick={onBrowse}
                className="h-auto px-3 py-3 font-medium text-secondary-foreground"
              >
                browse computer
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}