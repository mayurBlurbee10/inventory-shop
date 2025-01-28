"use client";
import { X, UploadCloud } from "lucide-react";
import { useState } from "react";
import DialogBox from "./DialogBox";

export default function MyTaskPopupBox({ onClose, content }) {
    const [confirmPopup, setConfirmPopup] = useState(false);

    return (
        
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg border border-gray-300 p-10">
                <div className="pb-5">
                    {content}
                </div>
                {/* Wrap all content inside outline */}
                <div className="border border-gray-300 rounded-lg">

                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Upload</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* File Upload Section */}
                    <div className="p-6 flex flex-col items-center text-center border-b">
                        <UploadCloud className="h-12 w-12 text-blue-500 mb-2" />
                        <p className="text-gray-600">Drag and drop files</p>
                        <p className="text-blue-600 cursor-pointer underline">Browse your device</p>
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
                            <button className="text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100" >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-400"
                                onClick={() => {
                                    setConfirmPopup(
                                        (prev) => !prev
                                    )
                                }}
                            >
                                Upload
                            </button>

                            {
                                confirmPopup && (
                                    <DialogBox
                                        title="Document Uploaded"
                                        message="Document uploaded successfully!"
                                        isModalOpen={confirmPopup}
                                        setIsModalOpen={setConfirmPopup}
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
        </div>
    );
}
