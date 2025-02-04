"use client";
import { X, UploadCloud } from "lucide-react";
import { useState } from "react";
import DialogBox from "./DialogBox";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";


export default function MyTaskPopupBox({ onClose, content, config }) {
    const [confirmPopup, setConfirmPopup] = useState(false);
    // const [config, setConfig] = useState(null);
    const params = useParams();

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
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg border border-gray-300 p-10 relative">
                <div className="pb-5">
                    {content?.title}
                </div>
                {/* Wrap all content inside outline */}
                <div className="border border-gray-300 rounded-lg">

                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">{content?.actionText}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 absolute top-[20px] right-[20px]"
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
                                className={`text-white px-4 py-2 rounded-lg border-gray  ${config?.secondaryColor ? "" : "bg-blue-500 hover:bg-blue-600"
                                    }`}
                                onClick={() => {
                                    setConfirmPopup(
                                        (prev) => !prev
                                    )
                                }}
                                style={{ backgroundColor: config?.secondaryColor || "rgb(59, 130, 246)" }}
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
