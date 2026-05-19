"use client";
import { X, File, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import DialogBox from "./DialogBox";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import Button from "./Common/Elements/Button";


export default function MyTaskFileUploadArea({ isForImport, onFileChange, from="", existingFilesToShow = [] }) {
    const [arrayOfFiles, setArrayOfFiles] = useState(existingFilesToShow);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);

    console.log("existingFilesToShow", existingFilesToShow)

    const handleBrowse = (event) => {
        if (event.type === "click") {
            // alert('Test if')
            event.preventDefault();
            fileInputRef.current?.click();
        } else {
            // alert('Test else')
            handleFileSelect(event);
        }
    };
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        // setArrayOfFiles(files); 
        // if (onUploadSuccess) {
            // onUploadSuccess();
        // }
        setArrayOfFiles((prevFiles) => {
            const existingFileNames = prevFiles.map((file) => file.name);
            const newFiles = files.filter(
                (file) => !existingFileNames.includes(file.name)
            );
            return [...prevFiles, ...newFiles];
        });
    };

    useEffect(() => {
        // if(arrayOfFiles.length>0){
        //     onUploadSuccess();
        // }
        onFileChange(arrayOfFiles);
        console.log("Selected Files:", arrayOfFiles);
    }, [arrayOfFiles]);
    console.log('arryOfFiles', arrayOfFiles);

    const handleRemoveFile = (index) => {
        const updatedFiles = arrayOfFiles.filter((_, i) => i !== index);
        setArrayOfFiles(updatedFiles); // Update state
        onFileChange(updatedFiles);
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
        <>
            < div className="rounded-lg" >
                {/* File Upload Section */}
                <div className={`flex flex-col h-[200px] items-center text-center border-gray-300 rounded-md   ${arrayOfFiles.length > 0 ? 'border  border-gray-500' : 'border-2 border-dashed py-6'} ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div>
                        {
                            arrayOfFiles.length === 0 && (
                                <div className="flex flex-col items-center text-center gap-2">
                                    <UploadCloud className={`h-12 w-12 text-blue-500 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <p className="text-gray-600">
                                        Drag and drop file
                                        {isForImport ? ' csv ' : ' '}
                                        here
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            style={{ display: "none" }} // Hide the file input
                                            multiple

                                        />
                                    </p>
                                    {/* <button
                                        onClick={handleBrowse}
                                        className="border px-3 py-1 rounded-lg border-gray-300 hover:border-blue-300 text-gray-700"
                                    >
                                        Select Files
                                    </button> */}
                                    <Button
                                        onClick={handleBrowse}
                                        type="Secondary"
                                        label="Select Files"
                                    />
                                </div>
                            )
                        }
                    </div>
                    <div className="overflow-x-auto w-full min-h-[150px] max-h-[200px] overflow-auto custom-scrollbar">
                        <table className="w-full border-collapse ">
                            <tbody>
                                {arrayOfFiles && arrayOfFiles.length > 0 ? (
                                    arrayOfFiles.map((file, index) => (
                                        <tr
                                            key={index}
                                            className="border-b border-gray-200 hover:bg-gray-50"
                                        >
                                            {/* File Name and Icon */}
                                            <td className="px-4 py-2 text-gray-700 flex items-center gap-2">
                                                <File className="h-6 w-6 text-[#3c4043] flex-shrink-0" />
                                                <span className="truncate text-sm sm:text-base">{file.name}</span>
                                            </td>
                                            {/* File Size */}
                                            <td className="px-4 py-2 text-gray-500 text-center text-sm sm:text-base">
                                                {(file.size / 1024).toFixed(2)} KB
                                            </td>
                                            {/* Remove Button */}
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    className="text-red-500 hover:underline"
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
                                            className="px-4 py-2 text-center text-gray-500 text-sm"
                                        >
                                            No files selected.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div >
                {
                    arrayOfFiles.length > 0 && (
                        <div className="my-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                style={{ display: "none" }} // Hide the file input
                                multiple={ from !== "tasks"}
                            />
                            {from !== "tasks" && (
                                <Button
                                    onClick={handleBrowse}
                                    type="Secondary"
                                    label="Add another file"
                                />
                            )}
                        </div>
                    )
                }
            </div >
        </>

    );
}
