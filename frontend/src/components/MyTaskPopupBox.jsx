"use client";
import { X, File, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import DialogBox from "./DialogBox";
import { useEffect } from "react";
import Button from "./Common/Elements/Button";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

export default function MyTaskPopupBox({ onClose, content, config, isForImport }) {
    const [confirmPopup, setConfirmPopup] = useState(false);
    const [arrayOfFiles, setArrayOfFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleBrowse = (event) => {
        if (event.type === "click") {
            fileInputRef.current?.click();
        } else {
            handleFileSelect(event);
        }
    };
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setArrayOfFiles(files); // Update the selected files
    };

    useEffect(() => {
        console.log("Selected Files:", arrayOfFiles);
    }, [arrayOfFiles]);
    console.log('arryOfFiles', arrayOfFiles);

    const handleRemoveFile = (index) => {
        const updatedFiles = arrayOfFiles.filter((_, i) => i !== index);
        setArrayOfFiles(updatedFiles); // Update state
    };

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

        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles = isForImport
            ? droppedFiles.filter((file) => file.type === "text/csv")
            : droppedFiles;

        if (validFiles.length === 0) {
            return;
        }

        setArrayOfFiles((prevFiles) => {
            const existingFileNames = prevFiles.map((file) => file.name);
            const newFiles = validFiles.filter(
                (file) => !existingFileNames.includes(file.name)
            );
            return [...prevFiles, ...newFiles];
        });
    };

    return (

        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-2xl bg-background border border-border px-4 sm:px-8 pb-6 sm:pb-8 pt-6 max-h-[90vh] overflow-y-auto"
                overlayClassName="bg-black/30"
                showCloseButton={false}
            >
                <div className="pb-4 flex justify-between items-center text-foreground">
                    <span className="font-medium text-lg">{content?.title}</span>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {/* Wrap all content inside outline */}
                <div className="border border-border rounded-lg bg-card">

                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground">{content?.actionText}</h2>
                    </div>

                    {/* File Upload Section */}
                    <div className={`py-6 flex flex-col items-center text-center border-b border-border max-h-[350px] min-h-[200px] overflow-auto custom-scrollbar ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                        }`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div>
                            {
                                arrayOfFiles.length === 0 && (
                                    <div className="flex flex-col items-center text-center">
                                        <UploadCloud className={`h-12 w-12 text-primary mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <p className="text-muted-foreground">
                                            Drag and drop file
                                            {isForImport ? ' csv ' : ' '}
                                            here or{' '}
                                            <button
                                                onClick={handleBrowse}
                                                className="text-primary hover:underline font-medium focus:outline-none"
                                            >
                                                browse computer
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                style={{ display: "none" }} // Hide the file input
                                                multiple
                                            />
                                        </p>
                                    </div>
                                )
                            }
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="w-full border-collapse ">
                                <tbody>
                                    {arrayOfFiles && arrayOfFiles.length > 0 ? (
                                        arrayOfFiles.map((file, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-border hover:bg-muted/50"
                                            >
                                                {/* File Name and Icon */}
                                                <td className="px-4 py-2 text-foreground flex items-center gap-2">
                                                    <File className="h-6 w-6 text-foreground flex-shrink-0" />
                                                    <span className="truncate text-sm sm:text-base">{file.name}</span>
                                                </td>
                                                {/* File Size */}
                                                <td className="px-4 py-2 text-muted-foreground text-center text-sm sm:text-base">
                                                    {(file.size / 1024).toFixed(2)} KB
                                                </td>
                                                {/* Remove Button */}
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        className="text-destructive hover:underline"
                                                        onClick={() => handleRemoveFile(index)}
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-4 py-2 text-center text-muted-foreground text-sm"
                                            >
                                                No files selected.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>


                    {/* Footer with Buttons */}
                    <div className="flex justify-between items-center p-4">
                        <Button
                            label="Close"
                            type="Secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        />
                        <div className="flex space-x-2">
                            <Button
                                label="Cancel"
                                type="Secondary"
                                onClick={() => {
                                    setArrayOfFiles([]);
                                }}
                                disabled={isLoading}
                            />

                            <Button
                                label="Upload"
                                type="Primary"
                                onClick={async () => {
                                    setIsLoading(true);
                                    await new Promise((resolve) => setTimeout(resolve, 3000));
                                    setArrayOfFiles([]);
                                    setIsLoading(false);
                                    setConfirmPopup((prev) => !prev);
                                }}
                                isLoading={isLoading}
                                disabled={arrayOfFiles.length === 0}
                            />

                            {
                                confirmPopup && (
                                    <DialogBox
                                        title="Document Uploaded"
                                        message="Document uploaded successfully!"
                                        isModalOpen={confirmPopup}
                                        setIsModalOpen={setConfirmPopup}
                                        config={config}
                                    />
                                )
                            }
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
