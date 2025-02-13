"use client";
import { X, File, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import DialogBox from "./DialogBox";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

export default function MyTaskPopupBox({ onClose, content, config, isForImport }) {
    const [confirmPopup, setConfirmPopup] = useState(false);
    const [fileSelected, setFileSelected] = useState(false);
    const [arrayOfFiles, setArrayOfFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // const [config, setConfig] = useState(null);
    // const params = useParams();
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


    // useEffect(() => {
    //     const fetchConfig = async () => {
    //         try {
    //             if (!params?.portalid) return;
    //             const response = await fetchWrapper(
    //                 `/api/portal?portalid=${params.portalid}`,
    //                 {},
    //                 "portal-login"
    //             );
    //             const data = await response.json();
    //             if (!data.data && response.status === 404) {
    //                 router.push(`/${params.portalid}/not-found`);
    //                 return;
    //             }
    //             if (!response.ok) {
    //                 throw new Error("Failed to fetch users");
    //             }

    //             setConfig(data.data);
    //         } catch (error) {
    //             console.log("error: ", error);
    //         }
    //     };

    //     fetchConfig();
    // }, []);

    return (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg border border-gray-300 px-10 pb-10 pt-7 relative">
                <div className="pb-7 flex justify-between items-center text-black">
                    {content?.title}
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 "
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {/* Wrap all content inside outline */}
                <div className="border border-gray-300 rounded-lg ">

                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">{content?.actionText}</h2>
                    </div>

                    {/* File Upload Section */}
                    <div className={`py-6 flex flex-col items-center text-center border-b max-h-[350px] min-h-[200px] overflow-auto custom-scrollbar ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
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
                                        <UploadCloud className={`h-12 w-12 text-blue-500 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                                        <p className="text-gray-600">
                                            Drag and drop file
                                            {isForImport ? ' csv ' : ' '}
                                            here or{' '}
                                            <button
                                                onClick={handleBrowse}
                                                className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline"
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

                    </div>


                    {/* Footer with Buttons */}
                    <div className="flex justify-between items-center p-4">
                        <button
                            onClick={onClose}
                            className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
                        >
                            Close
                        </button>
                        <div className="flex space-x-2">
                            <button
                                className="text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100"
                                onClick={() => {
                                    setArrayOfFiles([]);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`text-white px-4 py-2 rounded-lg border-gray ${config?.secondaryColor ? "" : "bg-blue-500 hover:bg-blue-600"
                                    } ${isLoading ? "bg-gray-400 cursor-not-allowed" : ""}`}
                                onClick={async () => {
                                    setIsLoading(true);
                                    await new Promise((resolve) => setTimeout(resolve, 3000));
                                    setArrayOfFiles([]);
                                    setIsLoading(false);
                                    setConfirmPopup((prev) => !prev);
                                }}
                                style={{ backgroundColor: config?.secondaryColor || "#0061D5" }}
                                disabled={arrayOfFiles.length === 0 || isLoading}
                            >
                                {isLoading ? "Uploading..." : "Upload"}
                            </button>

                            {
                                confirmPopup && (
                                    <DialogBox
                                        title="Document Uploaded"
                                        message="Document uploaded successfully!"
                                        isModalOpen={confirmPopup}
                                        setIsModalOpen={setConfirmPopup}
                                        config={config}
                                    />
                                    // <div className="fixed inset-0 flex items-center justify-center z-100">
                                    //     <div className="bg-white rounded-lg w-full max-w-xl shadow-lg border border-gray-300 absolute top-20 p-5">
                                    //         <div className="flex justify-between items-center p-4 absolute right-0 top-0">
                                    //             <button
                                    //                 onClick={() => {
                                    //                     setConfirmPopup(
                                    //                         (prev) => !prev
                                    //                     )
                                    //                 }}
                                    //                 className="text-gray-400 hover:text-gray-500"
                                    //             >
                                    //                 <X className="h-5 w-5" />
                                    //             </button>
                                    //         </div>
                                    //         <p className="pt-5">
                                    //             Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quam sunt perferendis magnam omnis enim iure ducimus aliquid dolorem est dicta.
                                    //         </p>

                                    //         <div className="flex space-x-2 pt-4 text-center justify-center">
                                    //             <button className="text-white px-4 py-2 rounded-lg hover:bg-blue-400 bg-blue-500" onClick={onClose} >
                                    //                 OK
                                    //             </button>
                                    //         </div>
                                    //     </div>
                                    // </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
